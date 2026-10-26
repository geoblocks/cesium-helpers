import {test} from 'node:test';
import assert from 'node:assert/strict';
import createBlur from './blur.js';

test('two blurs have their own names, so both can be in one collection', () => {
  const a = createBlur('a');
  const b = createBlur('b');
  assert.equal(a.name, 'a');
  assert.equal(b.name, 'b');
  const names = [a.get(0).name, a.get(1).name, b.get(0).name, b.get(1).name];
  assert.equal(new Set(names).size, 4);
  assert.ok(names.every((name) => name.startsWith('a_') || name.startsWith('b_')));
});

test('sigma and stepSize reach both passes', () => {
  const blur = createBlur('halation');
  blur.uniforms.sigma = 6;
  blur.uniforms.stepSize = 2;
  for (const pass of [blur.get(0), blur.get(1)]) {
    assert.equal(pass.uniforms.sigma, 6);
    assert.equal(pass.uniforms.stepSize, 2);
  }
  assert.equal(blur.uniforms.sigma, 6);
  assert.equal(blur.uniforms.stepSize, 2);
});

test('the passes blur along x then y', () => {
  const blur = createBlur('b');
  assert.equal(blur.get(0).uniforms.direction, 0);
  assert.equal(blur.get(1).uniforms.direction, 1);
});
