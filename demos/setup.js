const SWITZERLAND_RECTANGLE = Cesium.Rectangle.fromDegrees(4, 45, 12, 48);

export async function createViewer(container) {
  Object.assign(Cesium.RequestScheduler.requestsByServer, {
    "wmts.geo.admin.ch:443": 28,
    "download.swissgeol.ch:443": 28,
    "tile.openstreetmap.org:443": 28,
  });

  const viewer = new Cesium.Viewer(container, {
    timeline: false,
    navigationHelpButton: false,
    animation: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    fullscreenButton: false,
    scene3DOnly: true,
    baseLayer: new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg",
        rectangle: SWITZERLAND_RECTANGLE,
      })
    ),
    terrainProvider: await Cesium.CesiumTerrainProvider.fromUrl(
      "https://download.swissgeol.ch/cli_terrain/ch-2m/"
    ),
  });

  viewer.scene.highDynamicRange = true;
  viewer.scene.globe.showGroundAtmosphere = true;
  viewer.scene.globe.enableLighting = true;
  viewer.scene.globe.preloadSiblings = true;

  viewer.scene.fog.density = 2.0e-4 * 2;
  viewer.scene.fog.minimumBrightness = 0.03 * 10;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(7.863775, 46.686447, 1200),
    orientation: {
      heading: Cesium.Math.toRadians(25.0),
      pitch: 0.0,
    },
    duration: 0,
  });
  return viewer;
}
