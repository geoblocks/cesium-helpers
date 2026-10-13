import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian2} from '@cesium/core';
import Toy from './toy.js';
import WhiteModel from './white-model.js';

const fakeViewer = () => {
  const calls = [];
  return {calls, scene: {requestRender: () => calls.push('render')}};
};

test('the white model shares the toy\'s edges, with its own grading and occlusion', () => {
  const white = new WhiteModel(fakeViewer()).createStage_(undefined);
  const toy = new Toy(fakeViewer()).createStage_(undefined);
  for (const stage of [white, toy]) {
    assert.ok(stage.fragmentShader.includes('float creaseOf(') && stage.fragmentShader.includes('float outlineAt('));
  }
  assert.ok(white.fragmentShader.includes('float occludedAt(') && !toy.fragmentShader.includes('float occludedAt('));
  assert.deepEqual(Object.keys(white.uniforms).sort(), [...Object.keys(toy.uniforms), 'occlusion', 'poche', 'radius', 'values'].sort());
});

test('the white model\'s defaults: white, its values pressed, a pale tint; the toy\'s options taken', () => {
  const white = new WhiteModel(fakeViewer(), {bevel: 0.02, values: [0.4, 0.9]});
  const {uniforms} = white.createStage_(undefined);
  assert.equal(uniforms.saturation(), 0);
  assert.equal(uniforms.bevel(), 0.02);
  assert.ok(Cartesian2.equals(uniforms.values(), new Cartesian2(0.4, 0.9)));
  assert.equal(uniforms.occlusion(), 0.35);
});

test('changing the occlusion asks for a render', () => {
  const viewer = fakeViewer();
  const white = new WhiteModel(viewer);
  white.occlusion = 0.5;
  white.radius = 2;
  white.values = [0.6, 1];
  assert.deepEqual(viewer.calls, ['render', 'render', 'render']);
  assert.equal(white.createStage_(undefined).uniforms.radius(), 2);
});

test('the poché: the darkest colors kept black below a tenth by default, 0 to press them too', () => {
  const viewer = fakeViewer();
  const white = new WhiteModel(viewer);
  assert.equal(white.createStage_(undefined).uniforms.poche(), 0.1);
  white.poche = 0;
  assert.equal(white.createStage_(undefined).uniforms.poche(), 0);
  assert.deepEqual(viewer.calls, ['render']);
});

test('an option given as undefined takes the white model\'s default, not the toy\'s', () => {
  const {uniforms} = new WhiteModel(fakeViewer(), {saturation: undefined, light: undefined}).createStage_(undefined);
  assert.equal(uniforms.saturation(), 0);
  assert.equal(uniforms.light(), 0.08);
});

test('the jump, in pixels\' sizes, from a crease to an outline: 20 by default, given, changed', () => {
  const viewer = fakeViewer();
  assert.equal(new Toy(viewer).createStage_(undefined).uniforms.jump(), 20);
  const white = new WhiteModel(viewer, {jump: 6});
  assert.equal(white.createStage_(undefined).uniforms.jump(), 6);
  white.jump = 8;
  assert.equal(white.jump, 8);
  assert.equal(white.createStage_(undefined).uniforms.jump(), 8);
  assert.deepEqual(viewer.calls, ['render']);
});
