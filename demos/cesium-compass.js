//import Cesium from 'cesium';

import { Viewer } from 'cesium';

window['CESIUM_BASE_URL'] = '.';

// import "@geoblocks/cesium-compass";

const viewer = new Viewer("cesiumContainer", {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false
});

// const compass = document.querySelector("cesium-compass");
// compass.scene = viewer.scene;
// compass.clock = viewer.clock;
