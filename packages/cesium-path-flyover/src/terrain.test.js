import {test} from "node:test";
import assert from "node:assert/strict";
import {BoundingSphere, Cartesian3, Cartographic, Math as CesiumMath} from "@cesium/core";
import {EllipsoidTerrainProvider, GeographicTilingScheme, QuantizedMeshTerrainData} from "@cesium/engine";
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
  assert.ok(peak() <= 64, `peak in flight ${peak()}`);
  assert.ok(peak() > 32, `peak in flight ${peak()}`);
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

test("the tile carrying a subtree's availability is fetched before the tiles in it", async () => {
  // as a CesiumTerrainProvider with the metadata extension: a level-10 tile lists the
  // available tiles below it, and until it is loaded the deeper tiles read as missing
  const {provider, requests} = fakeProvider((lon, lat, level) => level);
  provider._layers = [{availabilityLevels: 10}];
  const loaded = new Set();
  provider.getTileDataAvailable = (x, y, level) => level <= 10 || loaded.has(`${x >> (level - 10)}/${y >> (level - 10)}`);
  const request = provider.requestTileGeometry;
  provider.requestTileGeometry = (x, y, level) => {
    const promise = request(x, y, level);
    return level === 10 ? promise.then((data) => (loaded.add(`${x}/${y}`), data)) : promise;
  };
  const sampler = new TerrainSampler(provider, 16);
  const heights = await sampler.heightsAt(line(5, 0.01));
  assert.deepEqual(heights, [16, 16, 16, 16, 16]);
  assert.ok(requests[0].startsWith("10/"), `first request ${requests[0]}`);
  const listings = requests.filter((r) => r.startsWith("10/"));
  assert.equal(new Set(listings).size, listings.length, "each availability tile fetched once");
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

// a quantized-mesh tile: the four corners SW NW SE NE at the given quantized
// heights, `indices` its triangles
const quantizedTile = (heights, indices) =>
  new QuantizedMeshTerrainData({
    minimumHeight: 0,
    maximumHeight: 32767,
    quantizedVertices: new Uint16Array([0, 0, 32767, 32767, 0, 32767, 0, 32767, ...heights]),
    indices: new Uint16Array(indices),
    boundingSphere: new BoundingSphere(Cartesian3.ZERO, 1),
    horizonOcclusionPoint: Cartesian3.ZERO,
    westIndices: [0, 1],
    southIndices: [0, 2],
    eastIndices: [2, 3],
    northIndices: [1, 3],
    westSkirtHeight: 1,
    southSkirtHeight: 1,
    eastSkirtHeight: 1,
    northSkirtHeight: 1,
  });

test("quantized-mesh tiles are interpolated through the sampler's own index, as Cesium would", async () => {
  // a plane rising to the east and north, in two triangles
  const data = quantizedTile([0, 10000, 20000, 30000], [0, 2, 3, 0, 3, 1]);
  const reference = data.interpolateHeight.bind(data);
  let cesiumCalls = 0;
  data.interpolateHeight = (...args) => {
    cesiumCalls++;
    return reference(...args);
  };
  const scheme = new GeographicTilingScheme();
  const provider = {tilingScheme: scheme, getTileDataAvailable: () => true, requestTileGeometry: () => Promise.resolve(data)};
  const sampler = new TerrainSampler(provider, 16);
  const rectangle = scheme.tileXYToRectangle(scheme.positionToTileXY(Cartographic.fromDegrees(6.5, 46.8), 16).x, scheme.positionToTileXY(Cartographic.fromDegrees(6.5, 46.8), 16).y, 16);
  const positions = [0.1, 0.5, 0.9, 0.999].flatMap((fu) =>
    [0.2, 0.5, 0.8].map((fv) => new Cartographic(rectangle.west + fu * rectangle.width, rectangle.south + fv * rectangle.height))
  );
  const heights = await sampler.heightsAt(positions);
  positions.forEach((p, i) => {
    const expected = reference(rectangle, p.longitude, p.latitude);
    assert.ok(Math.abs(heights[i] - expected) < 1e-6, `${heights[i]} for ${expected} at ${i}`);
  });
  assert.ok(heights[0] > 1000 && heights.at(-1) > 20000, "a slope");
  assert.equal(cesiumCalls, 0, "Cesium's linear scan was not used");
});

test("a position outside a tile's triangles is sampled at the fallback level", async () => {
  // only the south-east triangle; the north-west half has no terrain at level 16
  const requests = [];
  const provider = {
    tilingScheme: new GeographicTilingScheme(),
    getTileDataAvailable: () => true,
    requestTileGeometry: (x, y, level) => {
      requests.push(level);
      return Promise.resolve(level === 16 ? quantizedTile([0, 0, 0, 0], [0, 2, 3]) : {interpolateHeight: () => 77});
    },
  };
  const sampler = new TerrainSampler(provider, 16);
  const scheme = provider.tilingScheme;
  const {x, y} = scheme.positionToTileXY(Cartographic.fromDegrees(6.5, 46.8), 16);
  const rectangle = scheme.tileXYToRectangle(x, y, 16);
  const southEast = new Cartographic(rectangle.west + 0.8 * rectangle.width, rectangle.south + 0.2 * rectangle.height);
  const northWest = new Cartographic(rectangle.west + 0.2 * rectangle.width, rectangle.south + 0.8 * rectangle.height);
  const heights = await sampler.heightsAt([southEast, northWest]);
  assert.equal(heights[0], 0);
  assert.equal(heights[1], 77);
  assert.ok(requests.includes(14), "the fallback level was fetched");
});
