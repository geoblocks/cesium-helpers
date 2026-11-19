import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3} from '@cesium/core';
import {acquireCloudCover, cloudShadowUniforms, releaseCloudCover} from './cloud-cover.js';

test('an effect lit through the clouds reads the shadow map of the clouds in its scene, none without them', () => {
  const scene = /** @type {any} */ ({context: {defaultTexture: 'default'}});
  const uniforms = cloudShadowUniforms(scene);
  assert.equal(uniforms.shadowed(), 0);
  assert.equal(uniforms.shadowMap(), 'default');
  const center = new Cartesian3(1, 2, 3);
  const shadow = {texture: () => 'shadow', center, extent: () => 80000, base: () => 1950, top: () => 13000};
  acquireCloudCover(scene, shadow);
  assert.deepEqual(
    [uniforms.shadowed(), uniforms.shadowMap(), uniforms.shadowCenter(), uniforms.shadowExtent(), uniforms.shadowBase(), uniforms.shadowTop()],
    [1, 'shadow', center, 80000, 1950, 13000],
  );
  // another scene's clouds do not count
  assert.equal(cloudShadowUniforms(/** @type {any} */ ({context: {}})).shadowed(), 0);
  releaseCloudCover(scene, shadow);
  assert.equal(uniforms.shadowed(), 0);
});
