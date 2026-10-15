import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Ellipsoid, FixedFrameTransforms, Math as CesiumMath, Matrix4} from '@cesium/core';

globalThis.window = /** @type {any} */ ({addEventListener: () => {}, removeEventListener: () => {}});
const {default: CesiumIso} = await import('./cesium-iso.js');

// Bern, on the ellipsoid
const BERN = Cartesian3.fromDegrees(7.4474, 46.948);

/** A viewer without a globe, its camera looking straight down at Bern, its canvas 800 x 600. */
const fakeViewer = () => {
  const frustum = {width: 1, clone: () => ({...frustum, original: true})};
  return {
    scene: {
      canvas: {clientWidth: 800, clientHeight: 600, addEventListener: () => {}, removeEventListener: () => {}},
      ellipsoid: Ellipsoid.WGS84,
      pickPositionSupported: false,
      screenSpaceCameraController: {enableInputs: true},
      requestRender: () => {},
      camera: {
        heading: 0,
        position: new Cartesian3(), direction: new Cartesian3(), up: new Cartesian3(), right: new Cartesian3(),
        positionWC: BERN,
        frustum,
        pickEllipsoid: () => Cartesian3.clone(BERN),
        lookAtTransform: () => {},
        switchToOrthographicFrustum: () => {},
      },
    },
  };
};

/** A vector in the east-north-up frame at a position. */
const local = (/** @type {Cartesian3} */ vector, /** @type {Cartesian3} */ at) =>
  Matrix4.multiplyByPointAsVector(Matrix4.inverse(FixedFrameTransforms.eastNorthUpToFixedFrame(at), new Matrix4()), vector, new Cartesian3());

const near = (/** @type {number} */ a, /** @type {number} */ b, epsilon = 1e-9) =>
  assert.ok(Math.abs(a - b) < epsilon, `${a} is not ${b}`);

test('the corners are a quarter turn apart, the first at 45 degrees by default', () => {
  const iso = new CesiumIso(fakeViewer());
  near(iso.cornerAfter_(0, 0), CesiumMath.toRadians(45));
  near(iso.cornerAfter_(CesiumMath.toRadians(100), 0), CesiumMath.toRadians(135));
  near(iso.cornerAfter_(CesiumMath.toRadians(45), 1), CesiumMath.toRadians(135));
  near(iso.cornerAfter_(CesiumMath.toRadians(45), -1), CesiumMath.toRadians(-45));
});

test('the corners follow the heading given, square to a place\'s streets', () => {
  const iso = new CesiumIso(fakeViewer(), {heading: 88.75});
  near(iso.cornerAfter_(0, 0), CesiumMath.toRadians(-1.25));
  near(iso.cornerAfter_(CesiumMath.toRadians(80), 0), CesiumMath.toRadians(88.75));
});

test('active, the camera looks down at the pitch from the nearest corner, without a globe', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer, {pitch: 30, size: 100});
  iso.active = true;
  const {camera} = viewer.scene;
  const direction = local(camera.direction, BERN);
  near(direction.z, -Math.sin(CesiumMath.toRadians(30)));
  // toward the north-east, at 45 degrees
  near(Math.atan2(direction.x, direction.y), CesiumMath.toRadians(45));
  // the target in the middle of the view: on the camera's line of sight
  const toTarget = Cartesian3.normalize(Cartesian3.subtract(BERN, camera.position, new Cartesian3()), new Cartesian3());
  near(Cartesian3.dot(toTarget, camera.direction), 1, 1e-6);
  // the size on the shorter side, the frustum's width on the longer
  near(camera.frustum.width, 100 * 800 / 600);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
});

test('the target is a copy; set, it moves the view at once', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer);
  iso.active = true;
  const target = iso.target;
  target.x += 1000;
  assert.ok(Cartesian3.equals(iso.target, BERN));
  const elsewhere = Cartesian3.fromDegrees(7.45, 46.95, 10);
  iso.target = elsewhere;
  assert.ok(Cartesian3.equals(iso.target, elsewhere));
  const toTarget = Cartesian3.normalize(Cartesian3.subtract(elsewhere, viewer.scene.camera.position, new Cartesian3()), new Cartesian3());
  near(Cartesian3.dot(toTarget, viewer.scene.camera.direction), 1, 1e-6);
});

test('a limit keeps the target where the view may stand, set or moved; none by default', () => {
  const viewer = fakeViewer();
  const inside = Cartesian3.fromDegrees(7.45, 46.95, 10);
  const iso = new CesiumIso(viewer, {limit: () => Cartesian3.clone(inside)});
  iso.active = true;
  assert.ok(Cartesian3.equals(iso.target, inside));
  iso.target = BERN;
  assert.ok(Cartesian3.equals(iso.target, inside));
  const toTarget = Cartesian3.normalize(Cartesian3.subtract(inside, viewer.scene.camera.position, new Cartesian3()), new Cartesian3());
  near(Cartesian3.dot(toTarget, viewer.scene.camera.direction), 1, 1e-6);
  const free = new CesiumIso(fakeViewer());
  free.active = true;
  free.target = BERN;
  assert.ok(Cartesian3.equals(free.target, BERN));
});

test('inactive again, the camera gets its own frustum back and the inputs', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer);
  globalThis.cancelAnimationFrame = () => {};
  iso.active = true;
  iso.active = false;
  assert.equal(viewer.scene.camera.frustum.original, true);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, true);
});

test('the camera stands the orbit away from its target, 5 km by default, closer for a finer depth', () => {
  for (const [options, orbit] of [[{}, 5000], [{orbit: 500}, 500]]) {
    const viewer = fakeViewer();
    const iso = new CesiumIso(viewer, options);
    iso.active = true;
    near(Cartesian3.distance(viewer.scene.camera.position, iso.target), orbit, 1e-6);
  }
});

test('the heading set, in degrees, turns the view at once, no easing', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer, {pitch: 30});
  iso.active = true;
  iso.heading = 100;
  near(iso.heading, 100);
  const direction = local(viewer.scene.camera.direction, BERN);
  near(Math.atan2(direction.x, direction.y), CesiumMath.toRadians(100));
});

test('the size, in meters across the shorter side: read, and set at once within its bounds', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer, {size: 100, minSize: 20, maxSize: 400});
  iso.active = true;
  assert.equal(iso.size, 100);
  iso.size = 200;
  assert.equal(iso.size, 200);
  near(viewer.scene.camera.frustum.width, 200 * 800 / 600);
  iso.size = 1000;
  assert.equal(iso.size, 400);
});

test('placed on a perspective frustum (a subclass\'s), the view leaves it without a width of its own', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer);
  iso.active = true;
  viewer.scene.camera.frustum = {fov: 1};
  iso.target = BERN;
  assert.equal('width' in viewer.scene.camera.frustum, false);
});

test('a pointer let go that the view never saw go down is left alone: no anchoring, no pick', () => {
  const viewer = fakeViewer();
  const iso = new CesiumIso(viewer);
  iso.active = true;
  let picked = 0;
  viewer.scene.pickPositionSupported = true;
  viewer.scene.pickPosition = () => (picked++, Cartesian3.clone(BERN));
  iso.up_(/** @type {any} */ ({pointerId: 7, timeStamp: 0}));
  assert.equal(picked, 0);
});
