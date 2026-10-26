import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, FixedFrameTransforms, Matrix3, Matrix4} from '@cesium/core';
import {LocalFrame, localFromEye} from './local-frame.js';

// an east-north-up frame on the globe, and a camera 300 m up and 200 m back from it, turned about
const frame = FixedFrameTransforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(7.5, 46.9, 500));
const camera = Matrix4.fromRotationTranslation(Matrix3.fromRotationZ(0.7), new Cartesian3(100, -200, 300), new Matrix4());
const view = Matrix4.inverseTransformation(Matrix4.multiply(frame, camera, new Matrix4()), new Matrix4());
const eyeOf = local => Matrix4.multiplyByPoint(view, Matrix4.multiplyByPoint(frame, local, new Cartesian3()), new Cartesian3());

test('a point seen in the eye\'s frame is found again in the local frame, to the millimeter, whatever the globe\'s size', () => {
  const back = localFromEye(frame, view);
  [[0, 0, 0], [12.5, -3, 7], [-60, 40, 0.2]].forEach(local => {
    const found = Matrix4.multiplyByPoint(back, eyeOf(new Cartesian3(...local)), new Cartesian3());
    assert.ok(Cartesian3.distance(found, new Cartesian3(...local)) < 1e-3, `${local} found at ${found}`);
  });
});

test('a result given is the one returned', () => {
  const result = new Matrix4();
  assert.equal(localFromEye(frame, view, result), result);
  assert.ok(Matrix4.equals(result, localFromEye(frame, view)));
});

test('a local frame laid about an origin given, or about the camera where it stood when first anchored; a new origin, a new frame', () => {
  const at = Cartesian3.fromDegrees(7.5, 46.9, 800);
  const scene = {camera: {positionWC: at, viewMatrix: view}, ellipsoid: undefined};
  const local = new LocalFrame();
  local.anchor(scene);
  scene.camera.positionWC = Cartesian3.fromDegrees(8, 47, 900);
  assert.ok(Matrix4.equals(local.fromEye(scene), localFromEye(FixedFrameTransforms.eastNorthUpToFixedFrame(at), view)));
  local.origin = Cartesian3.fromDegrees(7.6, 46.95, 450);
  assert.ok(Matrix4.equals(local.fromEye(scene), localFromEye(FixedFrameTransforms.eastNorthUpToFixedFrame(local.origin), view)));
  assert.ok(Matrix4.equals(new LocalFrame(at).fromEye(scene), localFromEye(FixedFrameTransforms.eastNorthUpToFixedFrame(at), view)));
});
