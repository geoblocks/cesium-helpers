import * as hdf5 from 'jsfive';
import {EAST, NORTH, SOUTH, WEST} from './radar-extent.js';

// A CombiPrecip composite's rain rates drawn in longitudes and latitudes, as RGBA pixels, decoded in
// radar-worker.js, off the page's thread. Imports no Cesium: a worker does not see the page's.

// the grid of the composites: 1 km cells in LV95, the top left corner of the top left cell
const CELL = 1000;
const EAST0 = 2255000;
const NORTH0 = 1480000;
const COLUMNS = 710;
const ROWS = 640;
// the map, a pixel about a cell wide
const WIDTH = 1024;
const HEIGHT = 768;
// the rain rate, in mm/h, at the map's full intensity: the drizzle still shows, under a square root
const HEAVY = 10;

/**
 * LV95 coordinates of a point, swisstopo's approximate formulas: a meter, far below a cell.
 * @param {number} longitude in degrees
 * @param {number} latitude in degrees
 */
function toLV95(longitude, latitude) {
  const lambda = (longitude * 3600 - 26782.5) / 10000;
  const phi = (latitude * 3600 - 169028.66) / 10000;
  return {
    east: 2600072.37 + 211455.93 * lambda - 10938.51 * lambda * phi - 0.36 * lambda * phi * phi - 44.54 * lambda ** 3,
    north: 1200147.07 + 308807.95 * phi + 3745.25 * lambda * lambda + 76.63 * phi * phi - 194.56 * lambda * lambda * phi + 119.79 * phi ** 3,
  };
}

/**
 * The pixels of a radar file's map: the red channel the local intensity, 0 outside the radars'
 * reach and at the edges, opaque.
 * @param {ArrayBuffer} buffer an ODIM_H5 composite
 * @returns {{width: number, height: number, data: Uint8ClampedArray}}
 */
export default function radarPixels(buffer) {
  const file = new hdf5.File(buffer, 'radar.h5');
  const {gain, offset} = file.get('dataset1/data1/what').attrs;
  const rates = /** @type {number[]} */ (file.get('dataset1/data1/data').value);
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    const latitude = NORTH - ((y + 0.5) / HEIGHT) * (NORTH - SOUTH);
    for (let x = 0; x < WIDTH; x++) {
      const longitude = WEST + ((x + 0.5) / WIDTH) * (EAST - WEST);
      const {east, north} = toLV95(longitude, latitude);
      const column = Math.floor((east - EAST0) / CELL);
      const row = Math.floor((NORTH0 - north) / CELL);
      if (column < 0 || column >= COLUMNS || row < 0 || row >= ROWS) {
        continue;
      }
      // NaN beyond the radars' reach
      const rate = rates[row * COLUMNS + column] * gain + offset;
      if (rate > 0) {
        data[4 * (y * WIDTH + x)] = 255 * Math.sqrt(Math.min(rate / HEAVY, 1));
      }
    }
  }
  for (let i = 3; i < data.length; i += 4) {
    data[i] = 255;
  }
  return {width: WIDTH, height: HEIGHT, data};
}
