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
const at = (/** @type {any} */ map, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ channel) => map.image.data[4 * (y * SIZE + x) + channel];

test('the coverage covers the rain, spreads beyond it and fades with the distance', () => {
  const cloudMap = createCloudMap(raining(200));
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
  assert.equal(at(createCloudMap(raining(255)), 31, 31, 2), 255);
  const middle = at(createCloudMap(raining(Math.round(255 * Math.sqrt(0.25)))), 31, 31, 2);
  assert.ok(Math.abs(middle - 255 * Math.log(5) / Math.log(20)) < 2);
});
