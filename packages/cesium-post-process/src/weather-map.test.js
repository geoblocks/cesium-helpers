import {test, mock} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian4, Rectangle} from '@cesium/core';
import WeatherMap from './weather-map.js';

// a 2 x 2 map over 5 to 7 degrees east and 46 to 48 north, as ImageData: the red channel is the
// intensity, the rows go down from the north
const image = {
  width: 2,
  height: 2,
  data: new Uint8ClampedArray([
    0, 0, 0, 255, 255, 0, 0, 255,
    0, 0, 0, 255, 0, 0, 0, 255,
  ]),
};
const map = {image, rectangle: Rectangle.fromDegrees(5, 46, 7, 48)};
const radians = (/** @type {number} */ degrees) => (degrees * Math.PI) / 180;

test('without a map the intensity is the empty value everywhere', () => {
  assert.equal(new WeatherMap(1).intensityAt(radians(6), radians(47)), 1);
  assert.equal(new WeatherMap(0).intensityAt(radians(6), radians(47)), 0);
  assert.ok(Cartesian4.equals(new WeatherMap(1).bounds, new Cartesian4(0, 0, 1, 1)));
});

test('the bounds are the rectangle in the ellipsoid texture coordinates', () => {
  const weatherMap = new WeatherMap(1);
  weatherMap.map = map;
  const {west, south, east, north} = map.rectangle;
  const expected = new Cartesian4(west / (2 * Math.PI) + 0.5, south / Math.PI + 0.5, (2 * Math.PI) / (east - west), Math.PI / (north - south));
  assert.ok(Cartesian4.equalsEpsilon(weatherMap.bounds, expected, 1e-12));
});

test('the intensity is the pixel at its center, bilinear in between, 0 outside', () => {
  const weatherMap = new WeatherMap(1);
  weatherMap.map = map;
  // the center of the north east pixel, 6.5 east 47.5 north
  assert.equal(weatherMap.intensityAt(radians(6.5), radians(47.5)), 1);
  // halfway between it and the north west pixel
  assert.ok(Math.abs(weatherMap.intensityAt(radians(6), radians(47.5)) - 0.5) < 1e-9);
  // the center of the map, between the four pixels
  assert.ok(Math.abs(weatherMap.intensityAt(radians(6), radians(47)) - 0.25) < 1e-9);
  assert.equal(weatherMap.intensityAt(radians(4), radians(47)), 0);
});

test('setting no map again restores the empty value and the bounds', () => {
  const weatherMap = new WeatherMap(1);
  weatherMap.map = map;
  weatherMap.map = undefined;
  assert.equal(weatherMap.intensityAt(radians(4), radians(47)), 1);
  assert.ok(Cartesian4.equals(weatherMap.bounds, new Cartesian4(0, 0, 1, 1)));
});

test('setting a map again destroys the texture made from the previous one', () => {
  const weatherMap = new WeatherMap(1);
  const destroy = mock.fn();
  // a texture as Cesium's, made by texture(context) in a browser
  weatherMap.texture_ = {destroy};
  weatherMap.map = map;
  assert.equal(destroy.mock.callCount(), 1);
  assert.equal(weatherMap.texture_, undefined);
});

// one pixel raining at a red value, over the same rectangle as the map
const rainingAt = (/** @type {number} */ red) => ({image: {width: 1, height: 1, data: new Uint8ClampedArray([red, 0, 0, 255])}, rectangle: map.rectangle});

test('the intensity crossfades from the map to the next one, and the highest is over both', () => {
  const weatherMap = new WeatherMap(0);
  weatherMap.map = rainingAt(51);
  weatherMap.nextMap = rainingAt(153);
  assert.ok(Math.abs(weatherMap.intensityAt(radians(6), radians(47)) - 0.2) < 1e-9);
  weatherMap.blend = 0.25;
  assert.ok(Math.abs(weatherMap.intensityAt(radians(6), radians(47)) - 0.3) < 1e-9);
  assert.ok(Math.abs(weatherMap.maxIntensity - 0.6) < 1e-9);
  weatherMap.nextMap = undefined;
  assert.ok(Math.abs(weatherMap.intensityAt(radians(6), radians(47)) - 0.2) < 1e-9);
  assert.ok(Math.abs(weatherMap.maxIntensity - 0.2) < 1e-9);
});

// a 32 x 32 map, dry but for a pixel raining at a red value
const rainingPixel = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ red) => {
  const data = new Uint8ClampedArray(32 * 32 * 4);
  data[4 * (y * 32 + x)] = red;
  return {image: {width: 32, height: 32, data}, rectangle: map.rectangle};
};
const maxAt = (/** @type {{width: number, data: Uint8Array}} */ image, /** @type {number} */ x, /** @type {number} */ y) => image.data[4 * (y * image.width + x)];

test('the max map holds the highest rain around blocks of 4 x 4 pixels, spread to their neighbors', () => {
  const weatherMap = new WeatherMap(0);
  weatherMap.map = rainingPixel(10, 10, 200);
  const max = /** @type {any} */ (weatherMap.maxImage());
  assert.equal(max.width, 8);
  assert.equal(max.height, 8);
  // the pixel's block, 2, 2, and its neighbors
  for (const [x, y] of [[2, 2], [1, 1], [3, 3], [1, 3]]) {
    assert.equal(maxAt(max, x, y), 200, `at ${x}, ${y}`);
  }
  for (const [x, y] of [[0, 0], [4, 2], [2, 4], [7, 7]]) {
    assert.equal(maxAt(max, x, y), 0, `at ${x}, ${y}`);
  }
});

test('the max map covers the next map, and is made again when either changes', () => {
  const weatherMap = new WeatherMap(0);
  weatherMap.map = rainingPixel(0, 0, 0);
  weatherMap.nextMap = rainingPixel(30, 30, 100);
  assert.equal(maxAt(/** @type {any} */ (weatherMap.maxImage()), 7, 7), 100);
  const destroy = mock.fn();
  weatherMap.maxTexture_ = {destroy};
  weatherMap.nextMap = undefined;
  assert.equal(destroy.mock.callCount(), 1);
  assert.equal(maxAt(/** @type {any} */ (weatherMap.maxImage()), 7, 7), 0);
  weatherMap.map = rainingPixel(30, 30, 50);
  assert.equal(maxAt(/** @type {any} */ (weatherMap.maxImage()), 7, 7), 50);
});

test('the max map and the highest values are per channel', () => {
  const data = new Uint8ClampedArray(32 * 32 * 4);
  data.set([10, 20, 30, 40], 4 * (5 * 32 + 5));
  const weatherMap = new WeatherMap(0);
  weatherMap.map = {image: {width: 32, height: 32, data}, rectangle: map.rectangle};
  assert.deepEqual(Array.from(/** @type {any} */ (weatherMap.maxImage()).data.slice(4 * (1 * 8 + 1), 4 * (1 * 8 + 1) + 4)), [10, 20, 30, 40]);
  assert.deepEqual(weatherMap.maxValues.map((value) => Math.round(255 * value)), [10, 20, 30, 40]);
});
