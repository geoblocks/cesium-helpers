import assert from 'node:assert/strict';
import {test} from 'node:test';
import {smoothstep} from './smoothstep.js';

test('smoothstep is 0 below the edges, 1 above, and 0.5 between them', () => {
  assert.equal(smoothstep(2, 4, 1), 0);
  assert.equal(smoothstep(2, 4, 5), 1);
  assert.equal(smoothstep(2, 4, 3), 0.5);
});
