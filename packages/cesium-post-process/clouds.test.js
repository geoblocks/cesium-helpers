import {test, mock} from 'node:test';
import assert from 'node:assert/strict';
import {Cartographic, Rectangle} from '@cesium/core';
import Clouds from './clouds.js';

// a viewer with what the effect touches: its stages, its render requests, the globe's depth test,
// the scene's preRender event, and the camera
const fakeViewer = (height = 1000) => {
  /** @type {Function[]} */
  const listeners = [];
  const calls = [];
  return {
    calls,
    listeners,
    scene: {
      postProcessStages: {
        add: (/** @type {any} */ stage) => calls.push(['add', stage]),
        remove: (/** @type {any} */ stage) => calls.push(['remove', stage]),
      },
      requestRender: () => calls.push(['render']),
      globe: {depthTestAgainstTerrain: false},
      preRender: {
        addEventListener: (/** @type {Function} */ listener) => listeners.push(listener),
        removeEventListener: (/** @type {Function} */ listener) => listeners.splice(listeners.indexOf(listener), 1),
      },
      camera: {positionCartographic: Cartographic.fromDegrees(6, 47, height)},
    },
  };
};

// a map raining at half intensity over 5 to 7 east and 46 to 48 north
const map = {
  image: {width: 1, height: 1, data: new Uint8ClampedArray([128, 0, 0, 255])},
  rectangle: Rectangle.fromDegrees(5, 46, 7, 48),
};

test('activating adds the stage and tests the depth against the terrain, deactivating undoes both', (t) => {
  const viewer = fakeViewer();
  const clouds = new Clouds(/** @type {any} */ (viewer), {map});
  const destroy = t.mock.method(clouds.weatherMap_, 'destroy');
  clouds.active = true;
  assert.equal(viewer.calls[0][0], 'add');
  assert.equal(viewer.scene.globe.depthTestAgainstTerrain, true);
  assert.equal(viewer.listeners.length, 1);
  clouds.active = false;
  assert.ok(viewer.calls.some(([name]) => name === 'remove'));
  assert.equal(viewer.scene.globe.depthTestAgainstTerrain, false);
  assert.equal(viewer.listeners.length, 0);
  assert.equal(destroy.mock.callCount(), 1);
});

test('deactivating destroys the noise texture made when the clouds were drawn', () => {
  const viewer = fakeViewer();
  const clouds = new Clouds(/** @type {any} */ (viewer), {map});
  clouds.active = true;
  const destroy = mock.fn();
  // a texture as Cesium's, made by the march's noise uniform in a browser
  clouds.noiseTexture_ = {destroy};
  clouds.active = false;
  assert.equal(destroy.mock.callCount(), 1);
  assert.equal(clouds.noiseTexture_, undefined);
});

test('the options are live: setting one changes the uniforms and requests a render', () => {
  const viewer = fakeViewer();
  const clouds = new Clouds(/** @type {any} */ (viewer), {map});
  clouds.active = true;
  const march = /** @type {any} */ (clouds.stage_).get(0);
  for (const [name, value] of /** @type {const} */ ([['cloudBase', 1800], ['cloudTop', 7000], ['density', 0.5]])) {
    viewer.calls.length = 0;
    clouds[name] = value;
    assert.equal(clouds[name], value);
    assert.equal(march.uniforms[name](), value);
    assert.deepEqual(viewer.calls, [['render']]);
  }
  viewer.calls.length = 0;
  clouds.map = undefined;
  assert.equal(clouds.map, undefined);
  assert.deepEqual(viewer.calls, [['render']]);
});

test('the clouds take no haze of their own: Precipitation draws it over them', () => {
  const clouds = new Clouds(/** @type {any} */ (fakeViewer()), /** @type {any} */ ({intensity: 0.8}));
  assert.equal('intensity' in clouds, false);
});

test('the defaults are those of the spec', () => {
  const clouds = new Clouds(/** @type {any} */ (fakeViewer()));
  assert.equal(clouds.cloudBase, 2500);
  assert.equal(clouds.cloudTop, 9000);
  assert.equal(clouds.density, 1);
  assert.equal(clouds.map, undefined);
});

test('the density at the camera is the map inside the clouds, 0 outside them', () => {
  for (const [height, expected] of [[1000, 0], [4000, 128 / 255], [9500, 0]]) {
    const viewer = fakeViewer(height);
    const clouds = new Clouds(/** @type {any} */ (viewer), {map});
    clouds.active = true;
    viewer.listeners[0]();
    assert.ok(Math.abs(clouds.localDensity - expected) < 1e-9, `at ${height} m`);
  }
});

test('without a map there is no cloud at the camera', () => {
  const viewer = fakeViewer(4000);
  const clouds = new Clouds(/** @type {any} */ (viewer));
  clouds.active = true;
  viewer.listeners[0]();
  assert.equal(clouds.localDensity, 0);
});

test('the clouds do not make the scene render on its own', () => {
  mock.timers.enable({apis: ['setInterval', 'setTimeout']});
  try {
    const viewer = fakeViewer();
    const clouds = new Clouds(/** @type {any} */ (viewer), {map});
    clouds.active = true;
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.equal(viewer.calls.length, 0);
  } finally {
    mock.timers.reset();
  }
});
