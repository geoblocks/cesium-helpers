import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Cartesian4, Cartographic, Ellipsoid, Matrix4, Rectangle} from '@cesium/core';
import Lightning from './lightning.js';

// a viewer with what the effect touches: its stages, its render requests, the scene's preRender
// event, and the camera
const fakeViewer = (height = 1000) => {
  /** @type {any[]} */
  const stages = [];
  /** @type {Function[]} */
  const listeners = [];
  return {
    stages,
    listeners,
    scene: {
      postProcessStages: {
        add: (/** @type {any} */ stage) => stages.push(stage),
        remove: (/** @type {any} */ stage) => stages.splice(stages.indexOf(stage), 1),
      },
      requestRender: () => {},
      isDestroyed: () => false,
      preRender: {
        addEventListener: (/** @type {Function} */ listener) => listeners.push(listener),
        removeEventListener: (/** @type {Function} */ listener) => listeners.splice(listeners.indexOf(listener), 1),
      },
      camera: {
        positionCartographic: Cartographic.fromDegrees(7.9, 46.7, height),
        positionWC: Cartographic.toCartesian(Cartographic.fromDegrees(7.9, 46.7, height)),
        heading: 0,
        viewMatrix: Matrix4.IDENTITY,
      },
      ellipsoid: Ellipsoid.WGS84,
    },
  };
};

/**
 * A frame of the effect a tenth of a second after it is activated, as the scene's preRender draws
 * it, with Math.random's draws from a function: the feet of the strikes it raises, and what its
 * shader gets, each strike glow in eye coordinates, the world's with the fake camera, and how far
 * above the cloud base the camera is.
 * @param {import('node:test').TestContext} t
 * @param {ReturnType<typeof fakeViewer>} viewer
 * @param {ConstructorParameters<typeof Lightning>[1]} [options]
 * @param {() => number} [random]
 */
const frame = (t, viewer, options, random = () => 0) => {
  let now = 0;
  t.mock.method(performance, 'now', () => now);
  const lightning = new Lightning(/** @type {any} */ (viewer), options);
  /** @type {Cartesian3[]} */
  const grounds = [];
  lightning.strikeEvent.addEventListener((ground) => grounds.push(ground));
  lightning.active = true;
  const {uniforms} = viewer.stages[0];
  now = 100;
  // after the stage is made, whose name is drawn at random
  const draw = t.mock.method(Math, 'random', random);
  viewer.listeners[0]();
  draw.mock.restore();
  const glows = uniforms.strikeGlow().map((/** @type {Cartesian4} */ glow) => Cartesian4.clone(glow));
  const above = uniforms.above();
  lightning.active = false;
  return {lightning, grounds, glows, above};
};

// a map of one intensity over the whole of Switzerland
const map = (/** @type {number} */ value) => ({
  image: {width: 1, height: 1, data: new Uint8ClampedArray([value, 0, 0, 255])},
  rectangle: Rectangle.fromDegrees(5, 45, 11, 48),
});

// the distance from the camera to the foot of a strike, along the ground
const distance = (/** @type {any} */ viewer, /** @type {Cartesian3} */ ground) => {
  const camera = Cartographic.clone(viewer.scene.camera.positionCartographic);
  camera.height = 0;
  const foot = Cartographic.fromCartesian(ground);
  foot.height = 0;
  return Cartesian3.distance(Cartographic.toCartesian(camera), Cartographic.toCartesian(foot));
};

test('a new strike raises the strike event with its foot on the ground', (t) => {
  const {grounds} = frame(t, fakeViewer(), {intensity: 1});
  assert.equal(grounds.length, 1);
  assert.ok(Math.abs(Cartographic.fromCartesian(grounds[0]).height) < 1e-6);
});

test('a point on heavy rain makes a strike, with its glow over it', (t) => {
  const {lightning, grounds, glows} = frame(t, fakeViewer(), {map: map(255)});
  assert.equal(grounds.length, 1);
  assert.ok(Math.abs(glows[0].w - 1) < 1e-9);
  const glow = Cartographic.fromCartesian(Cartesian3.fromCartesian4(glows[0]));
  assert.ok(Math.abs(glow.height - (lightning.cloudBase + 1500)) < 1e-3);
});

test('a point on light rain makes no strike', (t) => {
  // 64 / 255 is about 0.25, under the 0.5 where strikes begin
  const {grounds, glows} = frame(t, fakeViewer(), {map: map(64)});
  assert.equal(grounds.length, 0);
  assert.equal(glows[0].w, 0);
});

test('without a map, strikes land anywhere in the radius, their glow at full intensity', (t) => {
  const {grounds, glows} = frame(t, fakeViewer());
  assert.equal(grounds.length, 1);
  assert.equal(glows[0].w, 1);
});

test('the radius grows with the camera height', (t) => {
  // the first draw starts a strike; the square root of 0.64 places it at 80 % of the radius
  const draws = () => {
    const values = [0];
    return () => values.shift() ?? 0.64;
  };
  const low = fakeViewer(1000);
  assert.ok(distance(low, frame(t, low, {}, draws()).grounds[0]) < 5000);
  const high = fakeViewer(50000);
  const far = distance(high, frame(t, high, {}, draws()).grounds[0]);
  assert.ok(far > 35000 && far < 45000, `${far}`);
});

test('a camera above the cloud base gets strikes', (t) => {
  const {grounds} = frame(t, fakeViewer(9000), {intensity: 1});
  assert.equal(grounds.length, 1);
});

test('the shader gets each strike glow and how far above the cloud base the camera is', (t) => {
  const high = frame(t, fakeViewer(9000), {intensity: 1});
  assert.equal(high.above, 1);
  assert.equal(high.glows[0].w, 1);
  assert.equal(high.glows[1].w, 0);
  assert.equal(frame(t, fakeViewer(1000), {intensity: 1}).above, 0);
  // at the cloud base, halfway through the cross-fade
  assert.ok(Math.abs(frame(t, fakeViewer(2500), {intensity: 1}).above - 0.5) < 1e-9);
});

test('a point on light rain is tried again elsewhere, until one on heavy rain', (t) => {
  // dry west of the camera, heavy east of it: 60 pixels of 0.1 degree, the edge at the camera
  const data = new Uint8ClampedArray(60 * 4);
  for (let x = 30; x < 60; x++) {
    data[4 * x] = 255;
  }
  const halves = {image: {width: 60, height: 1, data}, rectangle: Rectangle.fromDegrees(4.9, 45, 10.9, 48)};
  // a strike starts; the first point west of the camera, the second east of it, 2 km away; then 0
  const draws = [0, 0.75, 0.1, 0, 0.25, 0.1, 0];
  const viewer = fakeViewer();
  const {grounds} = frame(t, viewer, {map: halves}, () => draws.shift() ?? 0);
  assert.equal(grounds.length, 1);
  assert.ok(Cartographic.fromCartesian(grounds[0]).longitude > viewer.scene.camera.positionCartographic.longitude);
});
