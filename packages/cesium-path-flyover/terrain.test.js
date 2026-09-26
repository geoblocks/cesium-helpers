import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartographic, EllipsoidTerrainProvider, GeographicTilingScheme, Math as CesiumMath} from "@cesium/engine";
import TerrainSampler from "./terrain.js";

// a terrain provider whose tiles report a height from a function of the position,
// recording every tile request; `failing` tiles reject at the requested level
const fakeProvider = (heightAt, {failing = new Set(), delayMs = 0} = {}) => {
  const requests = [];
  let inFlight = 0;
  let peak = 0;
  const provider = {
    availability: {},
    tilingScheme: new GeographicTilingScheme(),
    getTileDataAvailable: () => true,
    requestTileGeometry(x, y, level) {
      requests.push(`${level}/${x}/${y}`);
      inFlight++;
      peak = Math.max(peak, inFlight);
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          inFlight--;
          if (failing.has(`${level}/${x}/${y}`)) {
            reject(new Error("no tile"));
          } else {
            resolve({interpolateHeight: (rectangle, longitude, latitude) => heightAt(longitude, latitude, level)});
          }
        }, delayMs)
      );
    },
  };
  return {provider, requests, peak: () => peak};
};
const line = (count, spanDegrees) =>
  Array.from({length: count}, (_, i) => Cartographic.fromDegrees(6.5 + (spanDegrees * i) / (count - 1), 46.8));

test("heightsAt returns one height per position without touching the inputs", async () => {
  const {provider} = fakeProvider((lon) => 1000 + CesiumMath.toDegrees(lon));
  const sampler = new TerrainSampler(provider, 16);
  const positions = line(5, 0.01);
  positions.forEach((p) => (p.height = 42));
  const heights = await sampler.heightsAt(positions);
  assert.equal(heights.length, 5);
  heights.forEach((h, i) => assert.ok(Math.abs(h - (1006.5 + 0.01 * (i / 4))) < 1e-6, `height ${h} at ${i}`));
  assert.ok(positions.every((p) => p.height === 42), "inputs untouched");
});

test("each tile is requested once, across positions and across calls", async () => {
  const {provider, requests} = fakeProvider(() => 500);
  const sampler = new TerrainSampler(provider, 16);
  // 2000 positions over 0.2 degrees of longitude: many positions per level-16 tile
  await sampler.heightsAt(line(2000, 0.2));
  const distinct = new Set(requests).size;
  assert.equal(requests.length, distinct, "no tile requested twice");
  assert.ok(distinct > 50 && distinct < 100, `${distinct} tiles`);
  await sampler.heightsAt(line(300, 0.2));
  assert.equal(requests.length, distinct, "a second call over the same ground fetches nothing");
});

test("tiles are fetched a bounded number at a time", async () => {
  const {provider, peak} = fakeProvider(() => 500, {delayMs: 2});
  const sampler = new TerrainSampler(provider, 16);
  await sampler.heightsAt(line(3000, 0.4));
  assert.ok(peak() <= 32, `peak in flight ${peak()}`);
  assert.ok(peak() > 4, `peak in flight ${peak()}`);
});

test("a tile that fails is sampled at the coarse fallback level instead", async () => {
  const positions = line(50, 0.05);
  const scheme = new GeographicTilingScheme();
  const failing = new Set([`16/${scheme.positionToTileXY(positions[0], 16).x}/${scheme.positionToTileXY(positions[0], 16).y}`]);
  const {provider, requests} = fakeProvider((lon, lat, level) => level, {failing});
  const sampler = new TerrainSampler(provider, 16);
  const heights = await sampler.heightsAt(positions);
  assert.equal(heights[0], 14, "first position from the fallback level");
  assert.ok(heights.slice(1).some((h) => h === 16), "the others from level 16");
  assert.ok(requests.some((r) => r.startsWith("14/")), "a level 14 tile was requested");
});

test("a provider without availability data is sampled", async () => {
  // a CesiumTerrainProvider whose layer.json lists no availability, a CustomHeightmapTerrainProvider
  const {provider} = fakeProvider(() => 500);
  provider.availability = undefined;
  provider.getTileDataAvailable = () => undefined;
  const sampler = new TerrainSampler(provider, 16);
  const heights = await sampler.heightsAt(line(5, 0.01));
  assert.deepEqual(heights, [500, 500, 500, 500, 500]);
});

test("an EllipsoidTerrainProvider has no terrain: every height is undefined", async () => {
  const sampler = new TerrainSampler(new EllipsoidTerrainProvider(), 16);
  const heights = await sampler.heightsAt(line(5, 0.01));
  assert.deepEqual(heights, [undefined, undefined, undefined, undefined, undefined]);
});
