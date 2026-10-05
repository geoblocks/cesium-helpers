import {StacEndpoint} from '@camptocamp/ogc-client';
import * as hdf5 from 'jsfive';

const {Rectangle} = Cesium;

// The rain as MeteoSwiss' radars see it, for Precipitation's map: the latest radar composite of
// the open data (data.geo.admin.ch, STAC, one item per day, one HDF5 file per product and
// 5 minutes), decoded in the browser and drawn in longitudes and latitudes.
const COLLECTION = 'https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-radar-precip';
// the composites: PRECIP (rzc), the rain rate of the moment in mm/h, or CombiPrecip (cpc), the
// last hour's rain in mm, adjusted on the rain gauges, so also a mean mm/h
export const PRODUCTS = {rzc: 'PRECIP', cpc: 'CombiPrecip'};
// the grid of the composites: 1 km cells in LV95, the top left corner of the top left cell
const CELL = 1000;
const EAST0 = 2255000;
const NORTH0 = 1480000;
const COLUMNS = 710;
const ROWS = 640;
// the map: the grid's corners in longitudes and latitudes, and a pixel about a cell wide
const WEST = 2.68;
const SOUTH = 43.61;
const EAST = 12.47;
const NORTH = 49.38;
const WIDTH = 1024;
const HEIGHT = 768;
// the rain rate, in mm/h, at the map's full intensity: the drizzle still shows, under a square root
const HEAVY = 10;

/**
 * The URL of the latest file of a product, today's or yesterday's (UTC) just after midnight.
 * @param {keyof typeof PRODUCTS} product
 */
export async function latestRadarUrl(product) {
  const day = new Date();
  for (let tries = 0; tries < 2; tries++) {
    const id = `${day.toISOString().slice(0, 10).replaceAll('-', '')}-ch`;
    // by its URL: the catalog lists its collections by pages, and ogc-client reads the first
    const {data} = await StacEndpoint.fromUrl(`${COLLECTION}/items/${id}`);
    const latest = Object.keys(data.assets).filter((name) => name.startsWith(product)).sort().at(-1);
    if (latest) {
      return data.assets[latest].href;
    }
    day.setUTCDate(day.getUTCDate() - 1);
  }
  throw new Error(`No ${product} file in the last two days`);
}

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
 * The map of a radar file: its rain rates drawn in longitudes and latitudes, the red channel
 * the local intensity, 0 outside the radars' reach and at the edges.
 * @param {ArrayBuffer} buffer an ODIM_H5 composite
 */
export function radarMap(buffer) {
  const file = new hdf5.File(buffer, 'radar.h5');
  const {gain, offset} = file.get('dataset1/data1/what').attrs;
  const rates = /** @type {number[]} */ (file.get('dataset1/data1/data').value);
  const {enddate, endtime} = file.get('dataset1/what').attrs;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const image = context.createImageData(WIDTH, HEIGHT);
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
        image.data[4 * (y * WIDTH + x)] = 255 * Math.sqrt(Math.min(rate / HEAVY, 1));
      }
    }
  }
  // opaque, for the canvas to keep the colors as drawn
  for (let i = 3; i < image.data.length; i += 4) {
    image.data[i] = 255;
  }
  context.putImageData(image, 0, 0);
  const time = new Date(`${enddate.slice(0, 4)}-${enddate.slice(4, 6)}-${enddate.slice(6, 8)}T${endtime.slice(0, 2)}:${endtime.slice(2, 4)}:00Z`);
  return {image: canvas, rectangle: Rectangle.fromDegrees(WEST, SOUTH, EAST, NORTH), time};
}

/**
 * The map of the latest file of a product.
 * @param {keyof typeof PRODUCTS} product
 */
export async function latestRadarMap(product) {
  const response = await fetch(await latestRadarUrl(product));
  if (!response.ok) {
    throw new Error(`${response.status} for ${response.url}`);
  }
  return radarMap(await response.arrayBuffer());
}
