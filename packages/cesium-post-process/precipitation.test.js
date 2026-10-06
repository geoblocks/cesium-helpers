import {test, mock} from 'node:test';
import assert from 'node:assert/strict';
import {Cartographic, Rectangle} from '@cesium/core';
import Clouds from './clouds.js';
import Precipitation from './precipitation.js';

// a viewer with what the effect touches: its stages, its render requests, the globe's depth test,
// the scene's preRender event, the camera, the light and the shadows
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
      isDestroyed: () => false,
      globe: {depthTestAgainstTerrain: false},
      preRender: {
        addEventListener: (/** @type {Function} */ listener) => listeners.push(listener),
        removeEventListener: (/** @type {Function} */ listener) => listeners.splice(listeners.indexOf(listener), 1),
      },
      camera: {positionCartographic: Cartographic.fromDegrees(6, 47, height)},
      light: {intensity: 2},
      shadowMap: {enabled: true},
    },
  };
};

// a map raining at half intensity over 5 to 7 east and 46 to 48 north
const map = {
  image: {width: 1, height: 1, data: new Uint8ClampedArray([128, 0, 0, 255])},
  rectangle: Rectangle.fromDegrees(5, 46, 7, 48),
};

// the effect renders at its frame rate on a timer while active
const withTimers = (/** @type {() => void} */ run) => {
  mock.timers.enable({apis: ['setInterval']});
  try {
    run();
  } finally {
    mock.timers.reset();
  }
};

test('activating adds the stage, tests the depth against the terrain and makes it overcast, deactivating undoes it all', () => {
  withTimers(() => {
    const viewer = fakeViewer();
    const precipitation = new Precipitation(/** @type {any} */ (viewer));
    precipitation.active = true;
    assert.equal(viewer.calls[0][0], 'add');
    assert.equal(viewer.scene.globe.depthTestAgainstTerrain, true);
    assert.equal(viewer.listeners.length, 1);
    assert.equal(viewer.scene.light.intensity, 1);
    assert.equal(viewer.scene.shadowMap.enabled, false);
    precipitation.active = false;
    assert.ok(viewer.calls.some(([name]) => name === 'remove'));
    assert.equal(viewer.scene.globe.depthTestAgainstTerrain, false);
    assert.equal(viewer.listeners.length, 0);
    assert.equal(viewer.scene.light.intensity, 2);
    assert.equal(viewer.scene.shadowMap.enabled, true);
  });
});

test('the intensity at the camera is the map there, 1 without a map', () => {
  withTimers(() => {
    for (const [options, expected] of [[{map}, 128 / 255], [{}, 1]]) {
      const viewer = fakeViewer();
      const precipitation = new Precipitation(/** @type {any} */ (viewer), options);
      precipitation.active = true;
      viewer.listeners[0]();
      assert.ok(Math.abs(precipitation.localIntensity - expected) < 1e-9);
      precipitation.active = false;
    }
  });
});

test('below the cloud base, the light dims and the shadows go as it rains harder at the camera', () => {
  withTimers(() => {
    const viewer = fakeViewer();
    const precipitation = new Precipitation(/** @type {any} */ (viewer), {map});
    precipitation.active = true;
    viewer.listeners[0]();
    assert.ok(Math.abs(viewer.scene.light.intensity - 2 * (1 - 0.5 * (128 / 255))) < 1e-9);
    assert.equal(viewer.scene.shadowMap.enabled, false);
    precipitation.map = undefined;
    precipitation.map = {...map, image: {...map.image, data: new Uint8ClampedArray([0, 0, 0, 255])}};
    viewer.listeners[0]();
    assert.equal(viewer.scene.light.intensity, 2);
    assert.equal(viewer.scene.shadowMap.enabled, true);
    precipitation.active = false;
  });
});

test('above the cloud base, there is no overcast, wherever it rains', () => {
  withTimers(() => {
    const viewer = fakeViewer(300000);
    const precipitation = new Precipitation(/** @type {any} */ (viewer), {map: {...map, image: {...map.image, data: new Uint8ClampedArray([255, 0, 0, 255])}}});
    precipitation.active = true;
    viewer.listeners[0]();
    assert.equal(viewer.scene.light.intensity, 2);
    assert.equal(viewer.scene.shadowMap.enabled, true);
    precipitation.active = false;
  });
});

test('rain and snow share the overcast: the last one deactivated restores the light', () => {
  withTimers(() => {
    const viewer = fakeViewer();
    const rain = new Precipitation(/** @type {any} */ (viewer));
    const snow = new Precipitation(/** @type {any} */ (viewer), {snow: 1});
    rain.active = true;
    snow.active = true;
    assert.equal(viewer.scene.light.intensity, 1);
    rain.active = false;
    assert.equal(viewer.scene.light.intensity, 1);
    assert.equal(viewer.scene.shadowMap.enabled, false);
    snow.active = false;
    assert.equal(viewer.scene.light.intensity, 2);
    assert.equal(viewer.scene.shadowMap.enabled, true);
  });
});

test('without an intensity, there is no pass and no frames', () => {
  withTimers(() => {
    const viewer = fakeViewer();
    const precipitation = new Precipitation(/** @type {any} */ (viewer), {intensity: 0});
    precipitation.active = true;
    assert.equal(/** @type {any} */ (precipitation.stage_).enabled, false);
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.equal(viewer.calls.length, 0);
    precipitation.intensity = 0.5;
    assert.equal(/** @type {any} */ (precipitation.stage_).enabled, true);
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.ok(viewer.calls.length >= 29);
    precipitation.active = false;
  });
});

test('the drops pass knows while Clouds draws the clouds in the scene, to leave the rain under them to them', () => {
  withTimers(() => {
    const viewer = fakeViewer();
    const precipitation = new Precipitation(/** @type {any} */ (viewer));
    precipitation.active = true;
    const drops = /** @type {any} */ (precipitation.stage_).get(2);
    assert.equal(drops.uniforms.clouds(), 0);
    const clouds = new Clouds(/** @type {any} */ (viewer));
    clouds.active = true;
    assert.equal(drops.uniforms.clouds(), 1);
    // in another scene, they do not count
    const other = new Clouds(/** @type {any} */ (fakeViewer()));
    other.active = true;
    clouds.active = false;
    assert.equal(drops.uniforms.clouds(), 0);
    other.active = false;
    precipitation.active = false;
  });
});
