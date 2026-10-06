import {paintTile, terrainTile} from './skatepark.js';

// paints a map tile or samples a terrain tile, off the main thread
onmessage = ({data: {id, kind, tile}}) => {
  const result = kind === 'map' ? paintTile(tile) : terrainTile(tile);
  postMessage({id, result}, [result.buffer]);
};
