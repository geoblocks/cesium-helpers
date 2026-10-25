import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Matrix3, Matrix4, Math as CesiumMath} from '@cesium/core';
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
