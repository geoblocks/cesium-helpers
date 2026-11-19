import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Event, Matrix4} from '@cesium/core';
import ValleyFog from './valley-fog.js';

const fakeViewer = () => {
  const scene = {
    renders: 0,
    requestRender() {
      this.renders++;
    },
    camera: {viewMatrix: Matrix4.IDENTITY},
    context: {defaultTexture: {}},
    preRender: new Event(),
  };
  return {scene};
};
const uniformsOf = (/** @type {ValleyFog} */ fog, /** @type {any} */ viewer) => /** @type {any} */ (fog.createStage_(viewer.scene)).uniforms;

test('the fog is lit by the sky and the sun by default, flat at lighting 0, and a change asks for a render', () => {
  const viewer = fakeViewer();
  const fog = new ValleyFog(/** @type {any} */ (viewer));
  assert.equal(uniformsOf(fog, viewer).lighting(), 1);
  fog.lighting = 0;
  assert.equal(fog.lighting, 0);
  assert.equal(uniformsOf(fog, viewer).lighting(), 0);
  assert.equal(viewer.scene.renders, 1);
  assert.equal(uniformsOf(new ValleyFog(/** @type {any} */ (viewer), {lighting: 0.5}), viewer).lighting(), 0.5);
});

test('the fog reads the sky table, the default texture until it is drawn, and the clouds\' shadow map', () => {
  const viewer = fakeViewer();
  const uniforms = uniformsOf(new ValleyFog(/** @type {any} */ (viewer)), viewer);
  assert.equal(uniforms.skyTable(), viewer.scene.context.defaultTexture);
  assert.equal(uniforms.shadowed(), 0);
  assert.ok('shadowMap' in uniforms);
});

test('the sky table\'s drawing listens to the scene\'s preRender while the fog is active', () => {
  const viewer = fakeViewer();
  const fog = new ValleyFog(/** @type {any} */ (viewer));
  fog.activated_(/** @type {any} */ (viewer.scene));
  assert.equal(viewer.scene.preRender.numberOfListeners, 1);
  fog.deactivating_(/** @type {any} */ (viewer.scene));
  assert.equal(viewer.scene.preRender.numberOfListeners, 0);
});
