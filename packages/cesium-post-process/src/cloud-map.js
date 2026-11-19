// The clouds' map, from a map of the rain: a radar sees the rain, "not the small cloud droplets and
// ice crystals that make up the rest of the cloud" (UBC ATSC 201), so the clouds are derived from
// it rather than drawn where it rains. Red is the rain, as it is; green is the coverage, the rain
// spread into a cloud shield wider than it; blue is the type of the clouds, from a flat deck over
// drizzle to towers over heavy rain, the precipitation turning the map "to cumulonimbus clouds"
// (Schneider 2015). The clouds need not stand exactly where the radar saw the rain, only look like
// clouds: the map gives regions, softened and warped, which the shader's noise shapes into clouds,
// as Nubis' low-frequency weather map (Schneider 2017). Made in cloud-worker.js, which has no Cesium
// to import (the page's may be a global, which a worker does not see): this module imports only
// cloud-noise.js, which imports nothing.
import {perlin} from './cloud-noise.js';

// the cloud shield reaches this far beyond the rain, in meters, then softened by a Gaussian of this
// standard deviation, less than the spread, so that the shield over a small shower stays full: the
// shader's warp and noise then shape it into clouds
const SHIELD_SPREAD = 5000;
const SHIELD_SOFTEN = 3500;
// the rain rate, in mm/h, at intensity 1, the map's intensity being sqrt(R / RAIN_RATE), as
// RainHaze.glsl's
const RAIN_RATE = 10;
// the deck at this rain rate and below, in mm/h, towers at this one and above, about 40 dBZ (UBC
// ATSC 201): the type is remap(log(R), log(0.5), log(10), 0, 1)
const DECK_RATE = 0.5;
const TOWER_RATE = 10;
// the type is dilated by this much, in meters, round, then softened by a Gaussian of this standard
// deviation, less than the dilation, so that a small cell keeps its height: a convective cell's
// updraft is kilometers wide and its top a dome, where the radar's 1 km pixels would raise each
// pixel's column to its own height, towers standing as walls with stepped outlines
const TOWER_SPREAD = 4000;
const TOWER_SOFTEN = 2500;
// the map is resampled warped by up to this many meters, by gradient noise over this many, so that
// no outline of the radar's survives; here, once, rather than at each sample of the march, so that
// the clouds, the max map and the shadow map's probes read the same map. The noise repeats every
// this many of its cells, 128 km, too far apart to show
const WARP = 2500;
const WARP_SCALE = 8000;
const WARP_PERIOD = 16;
const WARP_STEP = 4;
// meters, for the size of the map's pixels
const EARTH_RADIUS = 6371000;
// a Gaussian is approximated by this many box blurs, each a running sum whatever its width
const BOXES = 3;

/**
 * Blurs values in place along rows (step 1) or columns (step width) by a box of a radius, a running
 * sum, the edges held.
 * @param {Float32Array} values
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @param {boolean} rows
 */
function boxBlur(values, width, height, radius, rows) {
  const [count, length, step, stride] = rows ? [height, width, 1, width] : [width, height, width, 1];
  const line = new Float32Array(length);
  for (let i = 0; i < count; i++) {
    const start = i * stride;
    for (let j = 0; j < length; j++) {
      line[j] = values[start + j * step];
    }
    let sum = 0;
    for (let j = -radius; j <= radius; j++) {
      sum += line[Math.min(Math.max(j, 0), length - 1)];
    }
    for (let j = 0; j < length; j++) {
      values[start + j * step] = sum / (2 * radius + 1);
      sum += line[Math.min(j + radius + 1, length - 1)] - line[Math.max(j - radius, 0)];
    }
  }
}

/**
 * Blurs values in place by a Gaussian of a standard deviation, in pixels, as BOXES box blurs.
 * @param {Float32Array} values
 * @param {number} width
 * @param {number} height
 * @param {number} sigma
 */
function gaussianBlur(values, width, height, sigma) {
  // the radius of each box for the standard deviation
  const radius = Math.max(Math.round(0.5 * (Math.sqrt((12 * sigma * sigma) / BOXES + 1) - 1)), 1);
  for (let box = 0; box < BOXES; box++) {
    boxBlur(values, width, height, radius, true);
    boxBlur(values, width, height, radius, false);
  }
}

/**
 * The highest value within a disc of a radius around each pixel, in pixels: a round dilation, where
 * dilating rows then columns grows a cell into a square whose corners would stand as edges.
 * @param {Float32Array} values
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function dilateRound(values, width, height, radius) {
  // the disc's half-width on each of its rows, and the highest value along each row within each
  // half-width, each from the one before it: the disc is its rows' runs
  const halfWidths = Array.from({length: 2 * radius + 1}, (_, i) => Math.floor(Math.sqrt(radius * radius + radius - (i - radius) ** 2)));
  const runs = [values.slice()];
  for (let half = 1; half <= radius; half++) {
    const previous = runs[half - 1];
    const run = previous.slice();
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        run[row + x] = Math.max(previous[row + x], values[row + Math.max(x - half, 0)], values[row + Math.min(x + half, width - 1)]);
      }
    }
    runs.push(run);
  }
  const rowRuns = halfWidths.map((half) => runs[half]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let max = 0;
      for (let i = 0; i < rowRuns.length; i++) {
        max = Math.max(max, rowRuns[i][Math.min(Math.max(y + i - radius, 0), height - 1) * width + x]);
      }
      values[y * width + x] = max;
    }
  }
}

/**
 * Dilates values in place along rows or columns: the highest within a radius.
 * @param {Float32Array} values
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @param {boolean} rows
 */
function dilate(values, width, height, radius, rows) {
  const [count, length, step, stride] = rows ? [height, width, 1, width] : [width, height, width, 1];
  const line = new Float32Array(length);
  for (let i = 0; i < count; i++) {
    const start = i * stride;
    for (let j = 0; j < length; j++) {
      line[j] = values[start + j * step];
    }
    for (let j = 0; j < length; j++) {
      let max = 0;
      for (let k = Math.max(j - radius, 0); k <= Math.min(j + radius, length - 1); k++) {
        max = Math.max(max, line[k]);
      }
      values[start + j * step] = max;
    }
  }
}

/**
 * Resamples channels of values in place, each pixel from a point moved by gradient noise, bilinear,
 * the edges held.
 * @param {Float32Array[]} channels
 * @param {number} width
 * @param {number} height
 * @param {number} amount the largest move, in pixels
 * @param {number} scale the noise's cells, in pixels
 */
function warp(channels, width, height, amount, scale) {
  const [alongX, alongY] = [perlin(WARP_PERIOD, 70), perlin(WARP_PERIOD, 80)];
  // the move, at every WARP_STEP pixels, interpolated between: the noise varies over many of them
  // at least 2 of each, for a map of a pixel
  const columns = Math.ceil((width - 1) / WARP_STEP) + 2;
  const rows = Math.ceil((height - 1) / WARP_STEP) + 2;
  const moves = new Float32Array(columns * rows * 2);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      // in the noise's cells, within its period: it repeats, and takes no point beyond it
      const [x, y] = [((i * WARP_STEP) / scale) % WARP_PERIOD, ((j * WARP_STEP) / scale) % WARP_PERIOD];
      moves.set([amount * alongX(x, y, 0), amount * alongY(x, y, 0)], 2 * (j * columns + i));
    }
  }
  const sources = channels.map((values) => values.slice());
  for (let y = 0; y < height; y++) {
    const j = Math.min(Math.floor(y / WARP_STEP), rows - 2);
    const v = y / WARP_STEP - j;
    for (let x = 0; x < width; x++) {
      const i = Math.min(Math.floor(x / WARP_STEP), columns - 2);
      const u = x / WARP_STEP - i;
      const a = 2 * (j * columns + i);
      const b = a + 2 * columns;
      // the four moves around the pixel, bilinear
      const w00 = (1 - u) * (1 - v);
      const w10 = u * (1 - v);
      const w01 = (1 - u) * v;
      const w11 = u * v;
      const moveX = w00 * moves[a] + w10 * moves[a + 2] + w01 * moves[b] + w11 * moves[b + 2];
      const moveY = w00 * moves[a + 1] + w10 * moves[a + 3] + w01 * moves[b + 1] + w11 * moves[b + 3];
      const sx = Math.min(Math.max(x + moveX, 0), width - 1);
      const sy = Math.min(Math.max(y + moveY, 0), height - 1);
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      // the four source pixels' indices and weights, the same for each channel
      const i00 = y0 * width + x0;
      const i10 = x0 + 1 < width ? i00 + 1 : i00;
      const i01 = y0 + 1 < height ? i00 + width : i00;
      const i11 = x0 + 1 < width ? i01 + 1 : i01;
      const s00 = (1 - fx) * (1 - fy);
      const s10 = fx * (1 - fy);
      const s01 = (1 - fx) * fy;
      const s11 = fx * fy;
      const index = y * width + x;
      for (let c = 0; c < sources.length; c++) {
        const source = sources[c];
        channels[c][index] = s00 * source[i00] + s10 * source[i10] + s01 * source[i01] + s11 * source[i11];
      }
    }
  }
}

/**
 * The pixels of the clouds' map of the pixels of a map of the rain, over the same rectangle.
 * @param {{image: {width: number, height: number, data: Uint8ClampedArray}, rectangle: {west: number, south: number, east: number, north: number}}} map
 * the map's RGBA pixels, and its rectangle in radians
 * @returns {{width: number, height: number, data: Uint8ClampedArray}}
 */
export default function createCloudMap({image, rectangle}) {
  const {width, height, data} = image;
  const {west, south, east, north} = rectangle;
  const pixel = 0.5 * EARTH_RADIUS * (((east - west) * Math.cos(0.5 * (south + north))) / width + (north - south) / height);
  // the rain dilated by the spread, in pixels, then softened
  const spread = Math.max(Math.round(SHIELD_SPREAD / pixel), 1);
  const shield = new Float32Array(width * height);
  const type = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const intensity = data[4 * i] / 255;
    const rate = RAIN_RATE * intensity * intensity;
    shield[i] = data[4 * i] > 0 ? 1 : 0;
    type[i] = rate > DECK_RATE ? Math.log(rate / DECK_RATE) / Math.log(TOWER_RATE / DECK_RATE) : 0;
  }
  dilate(shield, width, height, spread, true);
  dilate(shield, width, height, spread, false);
  gaussianBlur(shield, width, height, SHIELD_SOFTEN / pixel);
  const tower = Math.max(Math.round(TOWER_SPREAD / pixel), 1);
  dilateRound(type, width, height, tower);
  gaussianBlur(type, width, height, TOWER_SOFTEN / pixel);
  // the shapes only: the rain stays where the radar saw it, where Precipitation and Lightning draw
  // it, and the shield is full there
  warp([shield, type], width, height, WARP / pixel, WARP_SCALE / pixel);
  const cloud = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    cloud[4 * i] = data[4 * i];
    cloud[4 * i + 1] = data[4 * i] > 0 ? 255 : Math.round(255 * shield[i]);
    cloud[4 * i + 2] = Math.round(255 * type[i]);
    cloud[4 * i + 3] = 255;
  }
  return {width, height, data: cloud};
}
