const SWITZERLAND_RECTANGLE = Cesium.Rectangle.fromDegrees(4, 45, 12, 48);

export async function createViewer(container) {
  Object.assign(Cesium.RequestScheduler.requestsByServer, {
    "wmts.geo.admin.ch:443": 28,
    "3d.geo.admin.ch:443": 28,
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
    // 4x multisampling costs about a third of the frame on an integrated GPU; FXAA below is
    // much cheaper
    msaaSamples: 1,
    baseLayer: new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg",
        rectangle: SWITZERLAND_RECTANGLE,
        // the service goes to 20 but the terrain stops at 18 and drives the refinement:
        // deeper imagery is two thirds of the tile requests on a low flight, for texels
        // below the mesh detail
        maximumLevel: 18,
      })
    ),
    terrainProvider: await Cesium.CesiumTerrainProvider.fromUrl(
      "https://3d.geo.admin.ch/ch.swisstopo.terrain.3d/v1/",
      // without them the lighting below shades the ellipsoid, not the relief
      {requestVertexNormals: true}
    ),
  });

  viewer.scene.requestRenderMode = true;
  viewer.scene.globe.showGroundAtmosphere = true;
  viewer.scene.globe.enableLighting = true;
  viewer.scene.postProcessStages.fxaa.enabled = true;

  viewer.scene.fog.density = 2.0e-4 * 2;
  viewer.scene.fog.minimumBrightness = 0.03 * 10;

  // today at 14:00, for the light
  const afternoon = new Date();
  afternoon.setHours(14, 0, 0, 0);
  viewer.clock.currentTime = Cesium.JulianDate.fromDate(afternoon);
  viewer.clock.shouldAnimate = false;

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
