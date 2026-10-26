import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Math as CesiumMath} from '@cesium/core';
import Dufour from './dufour.js';

const fakeViewer = () => {
  const calls = [];
  return {calls, scene: {requestRender: () => calls.push('render')}};
};

test('the hachures read the height, the normals and the outline', () => {
  const {fragmentShader} = new Dufour(fakeViewer()).createStage_(undefined);
  for (const chunk of ['float heightAt(', 'vec3 normalAt(', 'float outlineAt(', 'float hachuresAt(']) {
    assert.ok(fragmentShader.includes(chunk), chunk);
  }
});

test('the Dufour map\'s defaults, its angles in degrees, and a change asking for a render', () => {
  const viewer = fakeViewer();
  const dufour = new Dufour(viewer, {flatSlope: 12});
  const {uniforms} = dufour.createStage_(undefined);
  assert.equal(uniforms.spacing(), 3.5);
  assert.equal(uniforms.flatSlope(), CesiumMath.toRadians(12));
  dufour.oblique = 0.3;
  assert.equal(uniforms.oblique(), 0.3);
  assert.deepEqual(viewer.calls, ['render']);
});
