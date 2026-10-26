import {test} from 'node:test';
import assert from 'node:assert/strict';
import createCloudNoise, {createMapNoise} from './cloud-noise.js';

const SIZE = 32;
const noise = createCloudNoise(SIZE);
const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z, /** @type {number} */ channel) =>
  noise[4 * ((z * SIZE + y) * SIZE + x) + channel];

test('the volume has four bytes for each voxel', () => {
  assert.equal(noise.length, SIZE * SIZE * SIZE * 4);
});

test('the volume tiles: across each face it changes as little as between neighbors inside', () => {
  for (let channel = 0; channel < 3; channel++) {
    for (const axis of [0, 1, 2]) {
      let seam = 0;
      let inside = 0;
      for (let a = 0; a < SIZE; a++) {
        for (let b = 0; b < SIZE; b++) {
          const voxel = (/** @type {number} */ i) => (axis === 0 ? at(i, a, b, channel) : axis === 1 ? at(a, i, b, channel) : at(a, b, i, channel));
          seam += Math.abs(voxel(SIZE - 1) - voxel(0));
          inside += Math.abs(voxel(SIZE / 2) - voxel(SIZE / 2 + 1));
        }
      }
      assert.ok(seam <= 1.5 * inside + SIZE * SIZE, `channel ${channel}, axis ${axis}: ${seam} across, ${inside} inside`);
    }
  }
});

test('each channel spreads over most of its range', () => {
  for (let channel = 0; channel < 3; channel++) {
    let min = 255;
    let max = 0;
    for (let i = channel; i < noise.length; i += 4) {
      min = Math.min(min, noise[i]);
      max = Math.max(max, noise[i]);
    }
    assert.ok(min < 64 && max > 192, `channel ${channel}: ${min} to ${max}`);
  }
});

test('the base shape and the details are different patterns', () => {
  const correlation = (/** @type {number} */ a, /** @type {number} */ b) => {
    const n = noise.length / 4;
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
    for (let i = 0; i < noise.length; i += 4) {
      const x = noise[i + a];
      const y = noise[i + b];
      sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y;
    }
    return (sab / n - (sa / n) * (sb / n)) / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2));
  };
  assert.ok(correlation(0, 1) < 0.9, `red and green: ${correlation(0, 1)}`);
  assert.ok(correlation(1, 2) < 0.9, `green and blue: ${correlation(1, 2)}`);
});

const MAP_SIZE = 256;
const mapNoise = createMapNoise(MAP_SIZE);
const mapAt = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ channel) => mapNoise[4 * (y * MAP_SIZE + x) + channel];

test('the map noise has four bytes for each texel, and tiles: across each edge it changes as little as between neighbors inside', () => {
  assert.equal(mapNoise.length, MAP_SIZE * MAP_SIZE * 4);
  for (let channel = 0; channel < 3; channel++) {
    for (const axis of [0, 1]) {
      let seam = 0;
      let inside = 0;
      for (let a = 0; a < MAP_SIZE; a++) {
        const texel = (/** @type {number} */ i) => (axis === 0 ? mapAt(i, a, channel) : mapAt(a, i, channel));
        seam += Math.abs(texel(MAP_SIZE - 1) - texel(0));
        inside += Math.abs(texel(MAP_SIZE / 2) - texel(MAP_SIZE / 2 + 1));
      }
      assert.ok(seam <= 1.5 * inside + MAP_SIZE, `channel ${channel}, axis ${axis}: ${seam} across, ${inside} inside`);
    }
  }
});
