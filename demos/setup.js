// window['CESIUM_BASE_URL'] = 'node_modules/cesium/Build/Cesium/';
// import {Viewer, ImageryLayer, OpenStreetMapImageryProvider, CesiumTerrainProvider, Cartesian3, Math as CesiumMath} from 'cesium';

export async function createViewer(container) {
  const viewer = new Cesium.Viewer(container, {
    timeline: false,
    navigationHelpButton: false,
    animation: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    fullscreenButton: false,
    baseLayer: new Cesium.ImageryLayer(
      new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      })
    ),
    terrainProvider: await Cesium.CesiumTerrainProvider.fromUrl(
      "https://download.swissgeol.ch/cli_terrain/ch-2m/"
    ),
  });
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(6.06749, 43.77784, 204227),
    orientation: {
      heading: Cesium.Math.toRadians(26.0),
      pitch: Cesium.Math.toRadians(-33.0)
    },
    duration: 0
  });
  return viewer;
}
