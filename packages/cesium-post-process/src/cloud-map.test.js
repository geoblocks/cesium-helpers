import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Rectangle} from '@cesium/core';
import createCloudMap from './cloud-map.js';

// a 64 x 64 map, about a kilometer a pixel at 47 north, dry but for a square of rain in its middle
const SIZE = 64;
const raining = (/** @type {number} */ red) => {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 30; y < 34; y++) {
    for (let x = 30; x < 34; x++) {
      data[4 * (y * SIZE + x)] = red;
    }
  }
  return {image: {width: SIZE, height: SIZE, data}, rectangle: Rectangle.fromDegrees(6, 46.7, 6.84, 47.276)};
};
const at = (/** @type {any} */ image, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ channel) => image.data[4 * (y * SIZE + x) + channel];

test('the coverage covers the rain, spreads beyond it and fades with the distance', () => {
  const cloudMap = createCloudMap(raining(200));
  // full where it rains, however small the shower
  assert.equal(at(cloudMap, 31, 31, 1), 255);
  const away = [36, 40, 44, 48, 60].map((x) => at(cloudMap, x, 31, 1));
  assert.ok(away[0] > 0, 'beyond the rain');
  for (let i = 1; i < away.length; i++) {
    assert.ok(away[i] <= away[i - 1], 'fading');
  }
  assert.equal(away.at(-1), 0, 'far from it');
});

test('the type goes from the deck over drizzle to towers at 10 mm/h', () => {
  // the map is sqrt(R / 10 mm/h): 0.5 mm/h and below is the deck, 10 mm/h the towers
  assert.equal(at(createCloudMap(raining(Math.round(255 * Math.sqrt(0.05)))), 31, 31, 2), 0);
  // over a cell of 4 km, dilated more than it is softened, about its full height
  assert.ok(at(createCloudMap(raining(255)), 31, 31, 2) >= 245);
  const middle = at(createCloudMap(raining(Math.round(255 * Math.sqrt(0.25)))), 31, 31, 2);
  assert.ok(Math.abs(middle - 255 * Math.log(5) / Math.log(20)) < 4);
});

test('a map wider than the warp\'s noise is warped, not emptied', () => {
  // 1024 pixels of about 600 m: the warp's noise spans many of its periods
  const [width, height] = [1024, 64];
  const data = new Uint8ClampedArray(width * height * 4);
  for (let x = 0; x < width; x += 64) {
    data[4 * (32 * width + x)] = 255;
  }
  const {data: cloud} = createCloudMap({image: {width, height, data}, rectangle: Rectangle.fromDegrees(0, 46.8, 8.4, 47.15)});
  const highest = (/** @type {number} */ channel) => Math.max(...Array.from({length: width * height}, (_, i) => cloud[4 * i + channel]));
  assert.ok(highest(0) > 0, 'the rain');
  assert.ok(highest(1) > 200, 'the coverage');
  assert.ok(highest(2) > 0, 'the type');
});

test('a tower is a dome: its type falls off smoothly around the cell, with no step at its pixels', () => {
  const cloudMap = createCloudMap(raining(255));
  const across = [31, 33, 35, 37, 39, 41, 43, 45].map((x) => at(cloudMap, x, 31, 2));
  for (let i = 1; i < across.length; i++) {
    assert.ok(across[i] <= across[i - 1], 'falling');
    // no wall: a pixel never drops by more than half of the tower's height
    assert.ok(across[i - 1] - across[i] < 128, `step at ${i}`);
  }
  assert.ok(across[4] > 0 && across[4] < across[0], 'sloping beyond the cell');
});
