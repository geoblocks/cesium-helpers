import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(__dirname, 'demos'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: resolve(__dirname, 'demos/index.html'),
        'cesium-binoculars': resolve(__dirname, 'demos/cesium-binoculars.html'),
        'cesium-compass': resolve(__dirname, 'demos/cesium-compass.html'),
        'cesium-compass-bar': resolve(__dirname, 'demos/cesium-compass-bar.html'),
        'cesium-first-person-mode': resolve(__dirname, 'demos/cesium-first-person-mode.html'),
        'cesium-sphere-camera': resolve(__dirname, 'demos/cesium-sphere-camera.html'),
        'cesium-view-cube': resolve(__dirname, 'demos/cesium-view-cube.html'),
      },
    },
  },
});
