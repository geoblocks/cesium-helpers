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
