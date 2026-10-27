import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Cartesian4, Matrix4} from '@cesium/core';
import OpenSky from './open-sky.js';
import {localFromEye} from './local-frame.js';

const grid = (options = {}) => new OpenSky({covers: new Float32Array([0, 1, 2, -Infinity, 4, 5]), columns: 3, rows: 2, extent: [10, 14, 20, 23],
  frame: Matrix4.fromTranslation(new Cartesian3(100, 0, 0)), ...options});

test('the grid: its first node and the step between two along x and y', () => {
  assert.ok(Cartesian4.equals(grid().grid, new Cartesian4(10, 20, 2, 3)));
});

test('the frame\'s coordinates from the eye\'s, from the camera\'s view', () => {
  const view = Matrix4.fromTranslation(new Cartesian3(0, 0, -50));
  const fromEye = grid().fromEye({camera: {viewMatrix: view}});
  assert.ok(Matrix4.equals(fromEye, localFromEye(Matrix4.fromTranslation(new Cartesian3(100, 0, 0)), view)));
  assert.ok(Cartesian3.equals(Matrix4.multiplyByPoint(fromEye, new Cartesian3(), new Cartesian3()), new Cartesian3(-100, 0, 50)));
});

test('a cover and a ceiling a node, side by side, the ceilings the covers by default; nothing far below everything, not at -Infinity, which a texture would not hold', () => {
  assert.deepEqual(Array.from(grid().heights_), [0, 0, 1, 1, 2, 2, -1e9, -1e9, 4, 4, 5, 5]);
  const crowned = grid({ceilings: new Float32Array([0, 1, 9, -Infinity, 4, 5])});
  assert.deepEqual(Array.from(crowned.heights_.filter((_, k) => k % 2)), [0, 1, 9, -1e9, 4, 5]);
});

test('heights that do not fill the grid, or a grid of a single row, are refused', () => {
  assert.throws(() => grid({columns: 2}), /6 covers and 6 ceilings for 2 by 2 nodes/);
  assert.throws(() => grid({covers: new Float32Array(3), columns: 3, rows: 1}), /3 covers and 3 ceilings for 3 by 1 nodes/);
  assert.throws(() => grid({ceilings: new Float32Array(4)}), /6 covers and 4 ceilings for 3 by 2 nodes/);
});
