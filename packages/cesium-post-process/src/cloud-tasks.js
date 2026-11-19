import createCloudMap from './cloud-map.js';
import createCloudNoise, {createCloudDetail, createMapNoise} from './cloud-noise.js';

/**
 * The clouds' work off the page's thread, by its name: what cloud-work.js asks cloud-worker.js
 * for, or runs itself without a worker. Each takes a request a worker's message can carry and
 * gives back pixels.
 */
export default {cloudMap: createCloudMap, cloudNoise: createCloudNoise, cloudDetail: createCloudDetail, mapNoise: createMapNoise};
