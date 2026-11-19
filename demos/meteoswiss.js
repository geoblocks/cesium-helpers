import {StacEndpoint} from '@camptocamp/ogc-client';
import {EAST, NORTH, SOUTH, WEST} from './radar-extent.js';

const {Rectangle} = Cesium;

// The rain as MeteoSwiss' radars saw it, for Precipitation's map: the CombiPrecip composite of
// the open data (data.geo.admin.ch, STAC, one item per UTC day, kept 14 days), the last hour's
// rain in mm adjusted on the rain gauges, so a mean mm/h, decoded in the browser, in a worker
// (radar-worker.js), and drawn in longitudes and latitudes.
const COLLECTION = 'https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-radar-precip';
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

/** @typedef {{width: number, height: number, data: Uint8ClampedArray}} RadarPixels */

/**
 * A worker that decodes the files, and the calls waiting for it: it answers in the order of the
 * files. On an error, it is stopped and its calls rejected, the next file starting another.
 */
function startDecoder() {
  /** @type {Array<{resolve: (image: RadarPixels) => void, reject: (error: Error) => void}>} */
  const waiting = [];
  const worker = new Worker(new URL('./radar-worker.js', import.meta.url), {type: 'module'});
  worker.onmessage = ({data: {image, error}}) => {
    const call = waiting.shift();
    if (image) {
      call?.resolve(image);
    } else {
      call?.reject(error);
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    worker.terminate();
    if (decoder?.worker === worker) {
      decoder = undefined;
    }
    const error = new Error(`The radar worker failed: ${event.message || 'it did not load'}`);
    for (const call of waiting.splice(0)) {
      call.reject(error);
    }
  };
  return {worker, waiting};
}

/** @type {ReturnType<typeof startDecoder> | undefined} */
let decoder;

/**
 * The map of a radar file: its pixels decoded in the worker.
 * @param {ArrayBuffer} buffer an ODIM_H5 composite, handed to the worker
 */
async function radarMap(buffer) {
  decoder ??= startDecoder();
  const {worker, waiting} = decoder;
  /** @type {RadarPixels} */
  const image = await new Promise((resolve, reject) => {
    waiting.push({resolve, reject});
    worker.postMessage(buffer, [buffer]);
  });
  return {image, rectangle: Rectangle.fromDegrees(WEST, SOUTH, EAST, NORTH)};
}

/** @type {Map<number, ReturnType<typeof radarMap>>} */
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
  return /** @type {ReturnType<typeof radarMap>} */ (maps.get(time));
}
