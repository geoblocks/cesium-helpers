import {StacEndpoint} from '@camptocamp/ogc-client';
import * as hdf5 from 'jsfive';

const {Rectangle} = Cesium;

// The rain as MeteoSwiss' radars saw it, for Precipitation's map: the CombiPrecip composite of
// the open data (data.geo.admin.ch, STAC, one item per UTC day, kept 14 days), the last hour's
// rain in mm adjusted on the rain gauges, so a mean mm/h, decoded in the browser and drawn in
// longitudes and latitudes.
const COLLECTION = 'https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-radar-precip';
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
const HOUR = 3600 * 1000;
// the maps kept, the most recently asked for: about 3 MB each
const MAX_MAPS = 12;

/** @type {Map<string, Promise<Record<string, {href: string}>>>} */
const days = new Map();

/**
 * The files of a UTC day, fetched once.
 * @param {Date} date
 */
function dayAssets(date) {
  const id = `${date.toISOString().slice(0, 10).replaceAll('-', '')}-ch`;
  if (!days.has(id)) {
    // by its URL: the catalog lists its collections by pages, and ogc-client reads the first; a
    // failure is not kept, to try again
    days.set(
      id,
      StacEndpoint.fromUrl(`${COLLECTION}/items/${id}`).then(
        ({data}) => data.assets,
        (error) => {
          days.delete(id);
          throw error;
        },
      ),
    );
  }
  return /** @type {Promise<Record<string, {href: string}>>} */ (days.get(id));
}

/**
 * The name of the hourly CombiPrecip file ending at a full hour, but its last digits:
 * cpc, the year in 2 digits, the day of the year in 3, the hour and the minutes.
 * @param {Date} date
 */
function hourlyPrefix(date) {
  const day = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / (24 * HOUR));
  const pad = (/** @type {number} */ n, /** @type {number} */ length) => String(n).padStart(length, '0');
  return `cpc${pad(date.getUTCFullYear() % 100, 2)}${pad(day, 3)}${pad(date.getUTCHours(), 2)}00`;
}

/**
 * The end of the latest hour with a file, today's or yesterday's (UTC) just after midnight.
 */
export async function latestHour() {
  const hour = new Date(Math.floor(Date.now() / HOUR) * HOUR);
  const today = hour.getUTCDate();
  for (let tries = 0; tries < 26; tries++) {
    let assets;
    try {
      assets = await dayAssets(hour);
    } catch (error) {
      // today's item may not be there yet: on to yesterday's last hour
      if (hour.getUTCDate() !== today) {
        throw error;
      }
      hour.setUTCHours(-1, 0, 0, 0);
      continue;
    }
    const prefix = hourlyPrefix(hour);
    if (Object.keys(assets).some((name) => name.startsWith(prefix))) {
      return hour;
    }
    hour.setTime(hour.getTime() - HOUR);
  }
  throw new Error('No CombiPrecip file in the last day');
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
function radarMap(buffer) {
  const file = new hdf5.File(buffer, 'radar.h5');
  const {gain, offset} = file.get('dataset1/data1/what').attrs;
  const rates = /** @type {number[]} */ (file.get('dataset1/data1/data').value);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  // read back by Precipitation and for the radar colors
  const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', {willReadFrequently: true}));
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
  return {image: canvas, rectangle: Rectangle.fromDegrees(WEST, SOUTH, EAST, NORTH)};
}

/** @type {Map<number, Promise<ReturnType<typeof radarMap>>>} */
const maps = new Map();

/**
 * The map of the hour of rain ending at a full hour, fetched and decoded once, while it is among
 * the last asked for.
 * @param {Date} hour
 */
export function hourlyRadarMap(hour) {
  const time = hour.getTime();
  const kept = maps.get(time);
  if (kept) {
    // the most recently asked for last
    maps.delete(time);
    maps.set(time, kept);
  } else {
    const load = async () => {
      const prefix = hourlyPrefix(hour);
      const assets = await dayAssets(hour);
      const name = Object.keys(assets).find((name) => name.startsWith(prefix));
      if (!name) {
        throw new Error(`No CombiPrecip file for ${hour.toISOString()}`);
      }
      const response = await fetch(assets[name].href);
      if (!response.ok) {
        throw new Error(`${response.status} for ${response.url}`);
      }
      return radarMap(await response.arrayBuffer());
    };
    // a failure is not kept, to try again
    maps.set(time, load().catch((error) => {
      maps.delete(time);
      throw error;
    }));
    if (maps.size > MAX_MAPS) {
      maps.delete(maps.keys().next().value);
    }
  }
  return /** @type {Promise<ReturnType<typeof radarMap>>} */ (maps.get(time));
}
