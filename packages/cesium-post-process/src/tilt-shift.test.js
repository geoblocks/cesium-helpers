import {test} from 'node:test';
import assert from 'node:assert/strict';
import TiltShift from './tilt-shift.js';

const fakeViewer = () => ({scene: {postProcessStages: {add: () => {}, remove: () => {}}, requestRender: () => {}}});

test('the blur runs at half resolution, its sigma in the passes\' pixels: the blur keeps its spread on the screen', () => {
  const stage = new TiltShift(fakeViewer(), {blur: 3}).createStage_(undefined);
  const blur = stage.get(0);
  for (const pass of [blur.get(0), blur.get(1)]) {
    assert.equal(pass.textureScale, 0.5);
    assert.equal(pass.uniforms.sigma, 1.5);
  }
});

test('a blur set once active reaches the passes, halved', () => {
  const tiltShift = new TiltShift(fakeViewer());
  tiltShift.active = true;
  tiltShift.blur = 6;
  assert.equal(tiltShift.blur, 6);
  const blur = tiltShift.stage_.get(0);
  assert.equal(blur.get(0).uniforms.sigma, 3);
  assert.equal(blur.get(1).uniforms.sigma, 3);
});
