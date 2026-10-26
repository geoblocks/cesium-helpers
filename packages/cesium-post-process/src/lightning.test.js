import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Cartographic, Ellipsoid, Matrix4, Rectangle} from '@cesium/core';
import Lightning from './lightning.js';

const fakeViewer = (height = 1000) => ({
  scene: {
    camera: {
      positionCartographic: Cartographic.fromDegrees(7.9, 46.7, height),
      positionWC: Cartographic.toCartesian(Cartographic.fromDegrees(7.9, 46.7, height)),
      heading: 0,
      viewMatrix: Matrix4.IDENTITY,
    },
    ellipsoid: Ellipsoid.WGS84,
  },
});

// a map of one intensity over the whole of Switzerland
const map = (/** @type {number} */ value) => ({
  image: {width: 1, height: 1, data: new Uint8ClampedArray([value, 0, 0, 255])},
  rectangle: Rectangle.fromDegrees(5, 45, 11, 48),
});

// the distance from the camera to the foot of a strike, along the ground
const distance = (/** @type {any} */ viewer, /** @type {any} */ strike) => {
  const camera = Cartographic.clone(viewer.scene.camera.positionCartographic);
  camera.height = 0;
  const foot = Cartographic.fromCartesian(strike.ground);
  foot.height = 0;
  return Cartesian3.distance(Cartographic.toCartesian(camera), Cartographic.toCartesian(foot));
};

test('a new strike raises the strike event with its foot on the ground', (t) => {
  t.mock.method(Math, 'random', () => 0);
  const lightning = new Lightning(/** @type {any} */ (fakeViewer()), {intensity: 1});
  const grounds = [];
  lightning.strikeEvent.addEventListener((ground) => grounds.push(ground));
  lightning.onPreRender_();
  assert.equal(grounds.length, 1);
  assert.ok(Math.abs(Cartographic.fromCartesian(grounds[0]).height) < 1e-6);
});

test('a point on heavy rain makes a strike, with its glow over it', (t) => {
  t.mock.method(Math, 'random', () => 0);
  const lightning = new Lightning(/** @type {any} */ (fakeViewer()), {map: map(255)});
  const strike = lightning.createStrike_(0);
  assert.ok(strike);
  assert.ok(Math.abs(strike.glowIntensity - 1) < 1e-9);
  assert.ok(Math.abs(Cartographic.fromCartesian(strike.glow).height - (lightning.cloudBase + 1500)) < 1e-3);
});

test('a point on light rain makes no strike', (t) => {
  t.mock.method(Math, 'random', () => 0);
  // 64 / 255 is about 0.25, under the 0.5 where strikes begin
  const lightning = new Lightning(/** @type {any} */ (fakeViewer()), {map: map(64)});
  assert.equal(lightning.createStrike_(0), undefined);
});

test('without a map, strikes land anywhere in the radius, their glow at full intensity', (t) => {
  t.mock.method(Math, 'random', () => 0);
  const strike = new Lightning(/** @type {any} */ (fakeViewer())).createStrike_(0);
  assert.ok(strike);
  assert.equal(strike.glowIntensity, 1);
});

test('the radius grows with the camera height', (t) => {
  // the square root of 0.64 places the strike at 80 % of the radius
  t.mock.method(Math, 'random', () => 0.64);
  const low = fakeViewer(1000);
  assert.ok(distance(low, new Lightning(/** @type {any} */ (low)).createStrike_(0)) < 5000);
  const high = fakeViewer(50000);
  const far = distance(high, new Lightning(/** @type {any} */ (high)).createStrike_(0));
  assert.ok(far > 35000 && far < 45000, `${far}`);
});

test('a camera above the cloud base gets strikes', (t) => {
  t.mock.method(Math, 'random', () => 0);
  const viewer = fakeViewer(9000);
  const lightning = new Lightning(/** @type {any} */ (viewer), {intensity: 1});
  const grounds = [];
  lightning.strikeEvent.addEventListener((ground) => grounds.push(ground));
  lightning.onPreRender_();
  assert.equal(grounds.length, 1);
});

test('the shader gets each strike glow and how far above the cloud base the camera is', (t) => {
  t.mock.method(Math, 'random', () => 0);
  const high = new Lightning(/** @type {any} */ (fakeViewer(9000)), {intensity: 1});
  high.onPreRender_();
  assert.equal(high.above_, 1);
  assert.equal(high.strikeGlow_[0].w, 1);
  assert.equal(high.strikeGlow_[1].w, 0);
  const low = new Lightning(/** @type {any} */ (fakeViewer(1000)), {intensity: 1});
  low.onPreRender_();
  assert.equal(low.above_, 0);
  // at the cloud base, halfway through the cross-fade
  const base = new Lightning(/** @type {any} */ (fakeViewer(2500)), {intensity: 1});
  base.onPreRender_();
  assert.ok(Math.abs(base.above_ - 0.5) < 1e-9);
});

test('a point on light rain is tried again elsewhere, until one on heavy rain', (t) => {
  // dry west of the camera, heavy east of it: 60 pixels of 0.1 degree, the edge at the camera
  const data = new Uint8ClampedArray(60 * 4);
  for (let x = 30; x < 60; x++) {
    data[4 * x] = 255;
  }
  const halves = {image: {width: 60, height: 1, data}, rectangle: Rectangle.fromDegrees(4.9, 45, 10.9, 48)};
  // the first point west of the camera, the second east of it, 2 km away; then 0
  const draws = [0.75, 0.1, 0, 0.25, 0.1, 0];
  t.mock.method(Math, 'random', () => draws.shift() ?? 0);
  const viewer = fakeViewer();
  const strike = new Lightning(/** @type {any} */ (viewer), {map: halves}).createStrike_(0);
  assert.ok(strike);
  assert.ok(Cartographic.fromCartesian(strike.ground).longitude > viewer.scene.camera.positionCartographic.longitude);
});
