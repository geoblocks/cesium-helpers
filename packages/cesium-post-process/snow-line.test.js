import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, FixedFrameTransforms, Matrix3, Matrix4, Math as CesiumMath} from '@cesium/core';
import {localFromEye} from './local-frame.js';
import SnowLine from './snow-line.js';

const fakeViewer = (view = Matrix4.IDENTITY) => {
  const scene = {
    renders: 0,
    requestRender() {
      this.renders++;
    },
    camera: {viewMatrix: view},
  };
  return {scene};
};
const uniformsOf = (snow, viewer) => snow.createStage_(viewer.scene).uniforms;

test('the defaults leave the snow line as it was: an opacity, no water, Cesium\'s sun', () => {
  const viewer = fakeViewer();
  const uniforms = uniformsOf(new SnowLine(viewer), viewer);
  assert.equal(uniforms.altitude(), 2000);
  assert.equal(uniforms.coverage(), 1);
  assert.equal(uniforms.patchiness(), 0);
  assert.ok(uniforms.waterLevel() > 1e8);
  assert.equal(uniforms.ownSun(), 0);
});

test('the patchiness and the water\'s level, given or changed, ask for a render; none for the water: far above everything', () => {
  const viewer = fakeViewer();
  const snow = new SnowLine(viewer, {patchiness: 1, waterLevel: 372});
  assert.equal(uniformsOf(snow, viewer).patchiness(), 1);
  assert.equal(uniformsOf(snow, viewer).waterLevel(), 372);
  snow.patchiness = 0.5;
  snow.waterLevel = undefined;
  assert.equal(viewer.scene.renders, 2);
  assert.equal(uniformsOf(snow, viewer).patchiness(), 0.5);
  assert.ok(uniformsOf(snow, viewer).waterLevel() > 1e8);
});

test('a sun given is the one the snow is shaded by: its direction in the eye\'s frame, unit length; none, Cesium\'s', () => {
  // a camera turned a quarter about the z axis: the world's x is the eye's y
  const view = Matrix4.fromRotationTranslation(Matrix3.fromRotationZ(CesiumMath.PI_OVER_TWO), Cartesian3.ZERO, new Matrix4());
  const viewer = fakeViewer(view);
  const snow = new SnowLine(viewer, {sunDirection: new Cartesian3(3, 0, 0)});
  const uniforms = uniformsOf(snow, viewer);
  assert.equal(uniforms.ownSun(), 1);
  const sun = uniforms.sunEC();
  assert.ok(Math.abs(Cartesian3.magnitude(sun) - 1) < 1e-12);
  assert.ok(Cartesian3.equalsEpsilon(sun, new Cartesian3(0, 1, 0), 0, 1e-12));
  snow.sunDirection = undefined;
  assert.equal(uniformsOf(snow, viewer).ownSun(), 0);
  assert.equal(viewer.scene.renders, 1);
});

test('the shader keeps Cesium\'s sun for the default, thins the snow into patches by the patchiness and keeps it off the water', () => {
  const viewer = fakeViewer();
  const {fragmentShader} = new SnowLine(viewer).createStage_(viewer.scene);
  for (const part of ['czm_sunDirectionEC', 'patchiness', 'waterLevel']) {
    assert.ok(fragmentShader.includes(part), part);
  }
});

test('the grain, the scene\'s light and the steep slopes\' cover default to the snow line as it was; given or changed, each asks for a render', () => {
  const viewer = fakeViewer();
  const defaults = uniformsOf(new SnowLine(viewer), viewer);
  assert.deepEqual([defaults.grain(), defaults.sceneLight(), defaults.steepCover()], [90, 0, 0.35]);
  const snow = new SnowLine(viewer, {grain: 4, sceneLight: 1, steepCover: 0});
  assert.deepEqual([uniformsOf(snow, viewer).grain(), uniformsOf(snow, viewer).sceneLight(), uniformsOf(snow, viewer).steepCover()], [4, 1, 0]);
  snow.grain = 8;
  snow.sceneLight = 0.5;
  snow.steepCover = 0.2;
  assert.equal(viewer.scene.renders, 3);
  assert.deepEqual([uniformsOf(snow, viewer).grain(), uniformsOf(snow, viewer).sceneLight(), uniformsOf(snow, viewer).steepCover()], [8, 0.5, 0.2]);
});

test('with no coverage the stage is off: no pass that would only copy the scene', () => {
  const viewer = fakeViewer();
  const snow = new SnowLine(viewer, {coverage: 0});
  const stage = snow.createStage_(viewer.scene);
  assert.equal(stage.enabled, false);
  snow.stage_ = stage;
  snow.coverage = 0.6;
  assert.equal(stage.enabled, true);
  snow.coverage = 0;
  assert.equal(stage.enabled, false);
});

test('the noise is laid in a local frame about the origin given, from the camera\'s view: a few meters\' grain holds far from the globe\'s centre', () => {
  const view = Matrix4.inverseTransformation(Matrix4.fromTranslation(new Cartesian3(1000, 2000, 3000), new Matrix4()), new Matrix4());
  const viewer = fakeViewer(view);
  const origin = Cartesian3.fromDegrees(6.63, 46.52, 400);
  const snow = new SnowLine(viewer, {origin});
  assert.ok(Matrix4.equals(uniformsOf(snow, viewer).localFromEye(), localFromEye(FixedFrameTransforms.eastNorthUpToFixedFrame(origin), view)));
  assert.ok(Cartesian3.equals(snow.origin, origin));
});
