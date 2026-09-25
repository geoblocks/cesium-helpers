import {Cartesian2, EllipsoidTerrainProvider} from "@cesium/engine";

const FALLBACK_LEVEL = 14;
const TILES_IN_FLIGHT = 24;

const tileScratch = new Cartesian2();

/**
 * Terrain heights at a fixed level, one tile request per tile for the life of the
 * sampler: positions are grouped by tile, each tile is fetched once and kept, and
 * heights are interpolated from it. `sampleTerrain` refetches every tile on every
 * call, which on a track load meant three to four requests per distinct tile.
 * Tiles the provider lacks at the level (it promises them in its availability data
 * but the server answers 400) are sampled at a coarse level instead, so no position
 * is left without a height. Requests are kept to a bounded number in flight.
 */
export default class TerrainSampler {
  /**
   * @param {import('@cesium/engine').TerrainProvider} terrainProvider
   * @param {number} level
   */
  constructor(terrainProvider, level) {
    this.provider_ = terrainProvider;
    this.level_ = level;
    /** @type {Map<number, Promise<import('@cesium/engine').TerrainData | undefined>>} */
    this.tiles_ = new Map();
    this.inFlight_ = 0;
    /** @type {(() => void)[]} */
    this.waiting_ = [];
  }

  /**
   * @param {import('@cesium/engine').Cartographic[]} cartographics not modified
   * @return {Promise<(number | undefined)[]>} terrain height per position; undefined
   *   where the provider has no terrain (an EllipsoidTerrainProvider) or no tile
   */
  async heightsAt(cartographics) {
    // other providers may list no availability, yet have terrain
    if (this.provider_ instanceof EllipsoidTerrainProvider) {
      return cartographics.map(() => undefined);
    }
    const heights = await this.sampleAt_(cartographics, this.level_);
    /** @type {number[]} */
    const missing = [];
    heights.forEach((height, i) => {
      if (height === undefined) {
        missing.push(i);
      }
    });
    if (missing.length > 0) {
      const coarse = await this.sampleAt_(missing.map((i) => cartographics[i]), FALLBACK_LEVEL);
      missing.forEach((i, k) => {
        heights[i] = coarse[k];
      });
    }
    return heights;
  }

  /**
   * @param {import('@cesium/engine').Cartographic[]} cartographics
   * @param {number} level
   * @return {Promise<(number | undefined)[]>}
   */
  async sampleAt_(cartographics, level) {
    const scheme = this.provider_.tilingScheme;
    /** @type {Map<number, {x: number, y: number, indices: number[]}>} */
    const groups = new Map();
    cartographics.forEach((cartographic, i) => {
      if (!scheme.positionToTileXY(cartographic, level, tileScratch)) {
        return;
      }
      // a number rather than a string per position; room for levels up to 20
      const key = (level * 2 ** 20 + tileScratch.x) * 2 ** 20 + tileScratch.y;
      let group = groups.get(key);
      if (!group) {
        group = {x: tileScratch.x, y: tileScratch.y, indices: []};
        groups.set(key, group);
      }
      group.indices.push(i);
    });
    /** @type {(number | undefined)[]} */
    const heights = new Array(cartographics.length).fill(undefined);
    await Promise.all(
      [...groups.entries()].map(async ([key, group]) => {
        const data = await this.tile_(key, group.x, group.y, level);
        if (!data) {
          return;
        }
        const rectangle = scheme.tileXYToRectangle(group.x, group.y, level);
        for (const i of group.indices) {
          const height = data.interpolateHeight(rectangle, cartographics[i].longitude, cartographics[i].latitude);
          heights[i] = Number.isFinite(height) ? height : undefined;
        }
      })
    );
    return heights;
  }

  /**
   * @param {number} key
   * @param {number} x
   * @param {number} y
   * @param {number} level
   * @return {Promise<import('@cesium/engine').TerrainData | undefined>}
   */
  tile_(key, x, y, level) {
    let promise = this.tiles_.get(key);
    if (!promise) {
      promise = this.fetch_(x, y, level);
      this.tiles_.set(key, promise);
    }
    return promise;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} level
   * @return {Promise<import('@cesium/engine').TerrainData | undefined>}
   */
  async fetch_(x, y, level) {
    if (this.provider_.getTileDataAvailable(x, y, level) === false) {
      return undefined;
    }
    await this.slot_();
    try {
      const request = this.provider_.requestTileGeometry(x, y, level);
      return request ? await request : undefined;
    } catch {
      return undefined;
    } finally {
      this.inFlight_--;
      this.waiting_.shift()?.();
    }
  }

  /** @return {Promise<void>} resolves once fewer than TILES_IN_FLIGHT requests are pending */
  slot_() {
    if (this.inFlight_ < TILES_IN_FLIGHT) {
      this.inFlight_++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiting_.push(() => {
        this.inFlight_++;
        resolve();
      });
    });
  }
}
