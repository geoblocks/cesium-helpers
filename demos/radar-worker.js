// The weather demo's radar files decoded off the page's thread, for meteoswiss.js: each message a
// file, each answer, in the same order, the map's pixels, transferred, or an Error: jsfive throws
// strings.
import radarPixels from './radar-pixels.js';

self.onmessage = (/** @type {MessageEvent<ArrayBuffer>} */ {data: buffer}) => {
  try {
    const image = radarPixels(buffer);
    self.postMessage({image}, {transfer: [image.data.buffer]});
  } catch (error) {
    self.postMessage({error: error instanceof Error ? error : new Error(`The radar file could not be decoded: ${error}`)});
  }
};
