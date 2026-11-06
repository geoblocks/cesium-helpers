import {test, mock} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Cartographic, Ellipsoid, JulianDate, Matrix4, Rectangle} from '@cesium/core';
import Clouds from './clouds.js';
import WeatherMap from './weather-map.js';

// a GPU resource without WebGL: what it was made with, and whether it was destroyed
const resource = (/** @type {any} */ options) => {
  let destroyed = false;
  return {...options, isDestroyed: () => destroyed, destroy: () => void (destroyed = true), generateMipmap: () => {}};
};

// clouds whose textures, framebuffers and render states are such resources
class TestClouds extends Clouds {
  /** @override @protected @param {any} options */
  createTexture_(options) {
    return /** @type {any} */ (resource(options));
  }

  /** @override @protected @param {any} options */
  createTexture3D_(options) {
    return /** @type {any} */ (resource(options));
  }

  /** @override @protected @param {any} options */
  createFramebuffer_(options) {
    return /** @type {any} */ (resource(options));
  }

  /** @override @protected @param {any} viewport */
  renderState_(viewport) {
    return /** @type {any} */ ({viewport});
  }
}

// the scene's context as the clouds use it: a default texture, and viewport quad commands that
// only record each draw in `draws`, the command's options
const fakeContext = () => {
  /** @type {any[]} */
  const draws = [];
  return {
    draws,
    defaultTexture: resource({}),
    createViewportQuadCommand: (/** @type {string} */ _shader, /** @type {any} */ options) => ({...options, execute: () => draws.push(options)}),
  };
};

// a viewer with what the effect touches: its stages, its render requests, the globe's depth test,
// the scene's preRender event, the camera, and a context for its textures and shadow map
const fakeViewer = (height = 1000) => {
  /** @type {Function[]} */
  const listeners = [];
  /** @type {Function[]} */
  const postListeners = [];
  const calls = [];
  return {
    calls,
    listeners,
    postListeners,
    scene: {
      postProcessStages: {
        add: (/** @type {any} */ stage) => calls.push(['add', stage]),
        remove: (/** @type {any} */ stage) => calls.push(['remove', stage]),
      },
      requestRender: () => calls.push(['render']),
      isDestroyed: () => false,
      globe: {depthTestAgainstTerrain: false},
      context: fakeContext(),
      preRender: {
        addEventListener: (/** @type {Function} */ listener) => listeners.push(listener),
        removeEventListener: (/** @type {Function} */ listener) => listeners.splice(listeners.indexOf(listener), 1),
      },
      postRender: {
        addEventListener: (/** @type {Function} */ listener) => postListeners.push(listener),
        removeEventListener: (/** @type {Function} */ listener) => postListeners.splice(postListeners.indexOf(listener), 1),
      },
      camera: {
        positionCartographic: Cartographic.fromDegrees(6, 47, height),
        positionWC: Cartesian3.fromDegrees(6, 47, height),
        viewMatrix: Matrix4.clone(Matrix4.IDENTITY),
        inverseViewMatrix: Matrix4.clone(Matrix4.IDENTITY),
        frustum: {projectionMatrix: Matrix4.clone(Matrix4.IDENTITY)},
      },
    },
    clock: {currentTime: JulianDate.fromIso8601('2026-10-04T08:30:00Z')},
  };
};

// a map raining at half intensity over 5 to 7 east and 46 to 48 north
const map = {
  image: {width: 1, height: 1, data: new Uint8ClampedArray([128, 0, 0, 255])},
  rectangle: Rectangle.fromDegrees(5, 46, 7, 48),
};

test('activating adds the stage and tests the depth against the terrain, deactivating undoes both', (t) => {
  const viewer = fakeViewer();
  const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
  // the textures of its map
  const destroy = t.mock.method(WeatherMap.prototype, 'destroy');
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
  const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
  clouds.active = true;
  const march = /** @type {any} */ (clouds.stage_).get(1);
  const noise = march.uniforms.cloudNoise();
  clouds.active = false;
  assert.equal(noise.isDestroyed(), true);
  // made again when the clouds are drawn again
  assert.notEqual(march.uniforms.cloudNoise(), noise);
});

test('the options are live: setting one changes the uniforms and requests a render', () => {
  const viewer = fakeViewer();
  const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
  clouds.active = true;
  const march = /** @type {any} */ (clouds.stage_).get(1);
  for (const [name, value] of /** @type {const} */ ([['cloudBase', 1800], ['cloudTop', 7000], ['density', 0.5], ['wind', 20]])) {
    viewer.calls.length = 0;
    clouds[name] = value;
    assert.equal(clouds[name], value);
    if (name !== 'wind') {
      assert.equal(march.uniforms[name](), value);
    }
    assert.deepEqual(viewer.calls, [['render']]);
  }
  viewer.calls.length = 0;
  clouds.map = undefined;
  assert.equal(clouds.map, undefined);
  assert.deepEqual(viewer.calls, [['render']]);
});

test('the clouds take no haze of their own: Precipitation draws it over them', () => {
  const clouds = new TestClouds(/** @type {any} */ (fakeViewer()), /** @type {any} */ ({intensity: 0.8}));
  assert.equal('intensity' in clouds, false);
});

test('the defaults are those of the spec', () => {
  const clouds = new TestClouds(/** @type {any} */ (fakeViewer()));
  assert.equal(clouds.cloudBase, 2500);
  assert.equal(clouds.cloudTop, 9000);
  assert.equal(clouds.density, 1);
  assert.equal(clouds.wind, 10);
  assert.equal(clouds.map, undefined);
});

test('the density at the camera is the map inside the clouds, 0 outside them', () => {
  for (const [height, expected] of [[1000, 0], [4000, 128 / 255], [9500, 0]]) {
    const viewer = fakeViewer(height);
    const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
    clouds.active = true;
    viewer.listeners[0]();
    assert.ok(Math.abs(clouds.localDensity - expected) < 1e-9, `at ${height} m`);
    // a frame starts the renders that let the clouds settle, until they are deactivated
    clouds.active = false;
  }
});

test('without a map there is no cloud at the camera', () => {
  const viewer = fakeViewer(4000);
  const clouds = new TestClouds(/** @type {any} */ (viewer));
  clouds.active = true;
  viewer.listeners[0]();
  assert.equal(clouds.localDensity, 0);
  clouds.active = false;
});

test('the clouds do not make the scene render on its own', () => {
  mock.timers.enable({apis: ['setInterval', 'setTimeout']});
  try {
    const viewer = fakeViewer();
    const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
    clouds.active = true;
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.equal(viewer.calls.length, 0);
  } finally {
    mock.timers.reset();
  }
});

test('the march starts at the tallest cloud the map makes: 1500 m thick over drizzle, the cloud top over the heaviest rain', () => {
  const rainingAt = (/** @type {number} */ red) => ({image: {width: 1, height: 1, data: new Uint8ClampedArray([red, 0, 0, 255])}, rectangle: map.rectangle});
  // the type at 128, from the rate at that intensity, 10 mm/h times its square
  const type = Math.round((255 * Math.log((10 * (128 / 255) ** 2) / 0.5)) / Math.log(20)) / 255;
  for (const [red, expected] of [[0, 4000], [255, 9000], [128, 4000 + 5000 * type]]) {
    const clouds = new TestClouds(/** @type {any} */ (fakeViewer()), {map: rainingAt(red)});
    clouds.active = true;
    const march = /** @type {any} */ (clouds.stage_).get(1);
    assert.ok(Math.abs(march.uniforms.slabTop() - expected) < 1e-9, `at ${red}`);
  }
});

test('the noise drifts with the wind toward the east at the map\'s center, by the scene\'s clock, wrapped for single precision', () => {
  const viewer = fakeViewer();
  const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
  clouds.active = true;
  const {windOffset} = /** @type {any} */ (clouds.stage_).get(1).uniforms;
  const up = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(Cartographic.fromDegrees(6, 47));
  const east = Cartesian3.normalize(Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3()), new Cartesian3());
  const before = windOffset();
  viewer.clock.currentTime = JulianDate.addSeconds(viewer.clock.currentTime, 100, new JulianDate());
  // 10 m/s for 100 s
  const moved = Cartesian3.subtract(windOffset(), before, new Cartesian3());
  assert.ok(Cartesian3.equalsEpsilon(moved, Cartesian3.multiplyByScalar(east, 1000, new Cartesian3()), 1e-6));
  viewer.clock.currentTime = JulianDate.fromIso8601('2100-01-01T00:00:00Z');
  const far = windOffset();
  assert.ok([far.x, far.y, far.z].every((component) => Math.abs(component) < 1600000));
});

test('a new map starts the accumulation over', () => {
  const viewer = fakeViewer();
  // the resolve's output, which a frame keeps as the history
  /** @type {any} */ (viewer.scene.postProcessStages).getOutputTexture = () => ({width: 4, height: 4});
  const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
  clouds.active = true;
  viewer.postListeners[0]();
  const resolve = /** @type {any} */ (clouds.stage_).get(2);
  assert.equal(resolve.uniforms.historyWeight(), 0.9);
  clouds.map = map;
  assert.equal(resolve.uniforms.historyWeight(), 0);
  clouds.active = false;
});

test('the scene renders for a moment after a change, for the accumulation to settle', () => {
  mock.timers.enable({apis: ['setInterval', 'setTimeout', 'Date']});
  try {
    const viewer = fakeViewer();
    const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
    clouds.active = true;
    viewer.listeners[0]();
    viewer.postListeners[0]();
    viewer.calls.length = 0;
    mock.timers.tick(200);
    assert.ok(viewer.calls.some(([name]) => name === 'render'));
    mock.timers.tick(1000);
    viewer.listeners[0]();
    viewer.postListeners[0]();
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.equal(viewer.calls.length, 0);
  } finally {
    mock.timers.reset();
  }
});

test('the shadow map is drawn again when the camera moves, the clock or the clouds change, at most 4 times a second', () => {
  mock.timers.enable({apis: ['setInterval', 'setTimeout', 'Date']});
  try {
    const viewer = fakeViewer();
    const {camera} = viewer.scene;
    const clouds = new TestClouds(/** @type {any} */ (viewer), {map});
    clouds.active = true;
    const {draws} = viewer.scene.context;
    // a frame some milliseconds after the last, and whether it drew the shadow map
    const drawn = (/** @type {number} */ milliseconds) => {
      mock.timers.tick(milliseconds);
      const before = draws.length;
      viewer.listeners[0]();
      return draws.length > before;
    };
    const cameraAt = (/** @type {number} */ longitude, height = 1000) => {
      camera.positionCartographic = Cartographic.fromDegrees(longitude, 47, height);
      camera.positionWC = Cartesian3.fromDegrees(longitude, 47, height);
    };
    assert.equal(drawn(0), true);
    assert.equal(drawn(250), false);
    // 2 km, a 40th of its side
    cameraAt(6.02);
    assert.equal(drawn(250), false);
    cameraAt(6.03);
    assert.equal(drawn(250), true);
    viewer.clock.currentTime = JulianDate.addSeconds(viewer.clock.currentTime, 1, new JulianDate());
    assert.equal(drawn(100), false);
    assert.equal(drawn(150), true);
    // its side from 80 to 105 km
    cameraAt(6.03, 26250);
    assert.equal(drawn(250), true);
    clouds.density = 0.8;
    assert.equal(drawn(250), true);
    clouds.active = false;
  } finally {
    mock.timers.reset();
  }
});

test('with a drift, the noise also drifts by the real time, and the clouds keep the scene rendering', (t) => {
  let now = 100000;
  t.mock.method(performance, 'now', () => now);
  mock.timers.enable({apis: ['setInterval', 'setTimeout']});
  try {
    const viewer = fakeViewer();
    const clouds = new TestClouds(/** @type {any} */ (viewer), {map, wind: 0, drift: 100});
    assert.equal(clouds.drift, 100);
    clouds.active = true;
    const up = Ellipsoid.WGS84.geodeticSurfaceNormalCartographic(Cartographic.fromDegrees(6, 47));
    const east = Cartesian3.normalize(Cartesian3.cross(Cartesian3.UNIT_Z, up, new Cartesian3()), new Cartesian3());
    const {windOffset} = /** @type {any} */ (clouds.stage_).get(1).uniforms;
    const before = windOffset();
    now = 110000;
    const moved = Cartesian3.subtract(windOffset(), before, new Cartesian3());
    assert.ok(Cartesian3.equalsEpsilon(moved, Cartesian3.multiplyByScalar(east, 1000, new Cartesian3()), 1e-6));
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.ok(viewer.calls.some(([name]) => name === 'render'));
    clouds.drift = 0;
    viewer.calls.length = 0;
    mock.timers.tick(1000);
    assert.equal(viewer.calls.length, 0);
    clouds.active = false;
  } finally {
    mock.timers.reset();
  }
});
