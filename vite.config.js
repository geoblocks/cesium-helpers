import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import {buildShader, buildShaders} from './scripts/build-shaders.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(__dirname, 'demos'),
  plugins: [{
    name: 'shaders',
    buildStart: buildShaders,
    configureServer(server) {
      server.watcher.add(resolve(__dirname, 'packages'));
      server.watcher.on('change', file => file.endsWith('.glsl') && buildShader(file));
    },
  }],
  base: './',
  resolve: {
    alias: {
      '@cesium/engine': resolve(__dirname, 'demos/cesium-shim.js'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: resolve(__dirname, 'demos/index.html'),
        'apple-game': resolve(__dirname, 'demos/apple-game.html'),
        'cesium-binoculars': resolve(__dirname, 'demos/cesium-binoculars.html'),
        'cesium-compass': resolve(__dirname, 'demos/cesium-compass.html'),
        'cesium-compass-bar': resolve(__dirname, 'demos/cesium-compass-bar.html'),
        'cesium-first-person-mode': resolve(__dirname, 'demos/cesium-first-person-mode.html'),
        'cesium-flyto': resolve(__dirname, 'demos/cesium-flyto.html'),
        'cesium-path-flyover': resolve(__dirname, 'demos/cesium-path-flyover.html'),
        'cesium-post-process': resolve(__dirname, 'demos/cesium-post-process.html'),
        'cesium-sphere-camera': resolve(__dirname, 'demos/cesium-sphere-camera.html'),
        'cesium-view-cube': resolve(__dirname, 'demos/cesium-view-cube.html'),
        'cesium-walk': resolve(__dirname, 'demos/cesium-walk.html'),
      },
    },
  },
});
