window['CESIUM_BASE_URL'] = '/node_modules/cesium/Source';
import {Viewer, createWorldTerrain, Cartesian3, Math as CesiumMath} from 'cesium';

export function createViewer(container) {
  const viewer = new Viewer(container, {
    timeline: false,
    navigationHelpButton: false,
    animation: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    fullscreenButton: false,
    terrainProvider: createWorldTerrain()
  });
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(6.06749, 43.77784, 204227),
    orientation: {
      heading: CesiumMath.toRadians(26.0),
      pitch: CesiumMath.toRadians(-33.0)
    },
    duration: 0
  });
  return viewer;
}
