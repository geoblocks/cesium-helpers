import {Cartesian3, Cartesian4, Math as CesiumMath} from '@cesium/core';
import {PostProcessStage, PostProcessStageComposite} from '@cesium/engine';
// @ts-expect-error the engine exports its textures, framebuffers and render states, but does not type them
import {Framebuffer, RenderState, Texture} from '@cesium/engine';
import {cloudShadow, hasCloudCover} from './cloud-cover.js';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import {heightUniforms} from './height.js';
import {smoothstep} from './smoothstep.js';
import CloudsShadow from './shaders/CloudsShadow.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Fog from './shaders/Fog.js';
import Hash from './shaders/Hash.js';
import Height from './shaders/Height.js';
import Noise from './shaders/Noise.js';
import Phase from './shaders/Phase.js';
import PrecipitationShader from './shaders/Precipitation.js';
import PrecipitationShaftBlur from './shaders/PrecipitationShaftBlur.js';
import PrecipitationShafts from './shaders/PrecipitationShafts.js';
import PrecipitationWind from './shaders/PrecipitationWind.js';
import RainHaze from './shaders/RainHaze.js';
import SkyTable from './shaders/SkyTable.js';
import WeatherMapShader from './shaders/WeatherMap.js';
import WeatherMap from './weather-map.js';

/** @import {CesiumWidget, Light, Scene} from '@cesium/engine' */
/** @import {WeatherMapOptions} from './weather-map.js' */

// the streaks are the drops' motion over a frame's exposure
const FRAME_RATE = 30;
// the shader's time wraps at an hour, a whole number of the periods of its gusts and its flutter
const TIME_PERIOD = 3600;
// terminal velocity of the drops and of the flakes, in m/s, at speed 1; in between, geometrically,
// so that the slush at half is about 3 m/s
const RAIN_VELOCITY = 9;
const SNOW_VELOCITY = 1;
// the cells along the fall per radian at the nearest layer's distance: taller than wide in the rain,
// where the streaks are long, square in the snow, in between geometrically, and that distance, in
// meters (Precipitation.glsl's NEAREST): the grid scrolls by the speed over the distance, in
// radians per second, times the cells per radian
const RAIN_CELLS_ALONG = 4.44;
const SNOW_CELLS_ALONG = 20;
const NEAREST = 2;
// the exposure of the drops and of the flakes, in seconds, in between geometrically: a streak is the
// motion over it, a 1/30 s video frame for the drops; the flakes, at 1 m/s, would be half as long as
// wide at 1/30 s and look like streaks, not like flakes: a shorter exposure keeps them round
const RAIN_EXPOSURE = 1 / 30;
const SNOW_EXPOSURE = 1 / 90;
// the longest trail, in cells: Precipitation.glsl looks one cell above each pixel's for it
const MAX_TRAIL = 1;
const TWO_PI = CesiumMath.TWO_PI;
// the layers of drops, 2 to 16 m away, a drop every 0.05 rad around at the horizon in the nearest
// one, and the radius of its flakes in pixels, halved in each further layer (Precipitation.glsl's
// LAYERS, NEAREST, and the rest of its drops)
const LAYERS = 4;
const CELLS_AROUND = 20;
const FLAKE_RADIUS = 4;
// Precipitation.glsl's PERIOD, the cells after which the grid repeats
const PERIOD = 1000;
// longest time between two frames, in seconds, after a pause in requestRenderMode
const MAX_STEP = 0.1;
// the shafts are kilometers wide and soft: an eighth of the resolution, a 64th of the pixels, is
// enough for their raymarch and their blur (Precipitation.glsl's SHAFT_SCALE)
const SHAFT_SCALE = 0.125;
// the sky table's texels toward the horizon, besides the one overhead, RainHaze.glsl's SKY_TABLE
const SKY_TABLE = 64;
// the sunlight under the clouds, as a share of its intensity
const OVERCAST = 0.5;
// the camera goes from under the clouds to above them over this height around the cloud base, in
// meters, as the drops in Precipitation.glsl
const CLOUD_BASE_FADE = 50;

/**
 * @typedef {WeatherMapOptions} PrecipitationMapOptions
 */

// the scenes under clouds, with their light and shadows before: rain and snow may be active at
// once, the first one dims the light, the last one restores it
/** @type {WeakMap<Scene, {count: number, light: Light, intensity: number, shadows: boolean}>} */
const overcast = new WeakMap();

/**
 * @param {Scene} scene
 */
function acquireOvercast(scene) {
  const clouds = overcast.get(scene);
  if (clouds) {
    clouds.count++;
    return;
  }
  overcast.set(scene, {count: 1, light: scene.light, intensity: scene.light.intensity, shadows: scene.shadowMap.enabled});
  scene.light.intensity *= OVERCAST;
  scene.shadowMap.enabled = false;
}

/**
 * The sunlight and the shadows under the clouds, in proportion to how hard it rains at the camera.
 * @param {Scene} scene
 * @param {number} local
 */
function shadeOvercast(scene, local) {
  const clouds = overcast.get(scene);
  if (!clouds) {
    return;
  }
  clouds.light.intensity = clouds.intensity * (1 - (1 - OVERCAST) * local);
  scene.shadowMap.enabled = clouds.shadows && local < 0.5;
}

/**
 * @param {Scene} scene
 */
function releaseOvercast(scene) {
  const clouds = overcast.get(scene);
  if (!clouds || --clouds.count > 0) {
    return;
  }
  clouds.light.intensity = clouds.intensity;
  scene.shadowMap.enabled = clouds.shadows;
  overcast.delete(scene);
}

/**
 * Precipitation, from rain to snow: streaks of falling drops, or soft
 * fluttering flakes, in layers at different distances over the whole scene,
 * hidden behind what is nearer, a haze veiling the distance and shafts of
 * heavier precipitation below the cloud base, in a gusting wind. Between rain
 * and snow, the same drops slow down, shorten and soften, as in sleet. While
 * active, the sky is overcast: no shadows, and a dimmer sunlight. The
 * precipitation falls, so while active with an intensity the scene renders at
 * 30 frames per second, also in requestRenderMode. With a map, it falls where
 * the map says, in cells seen from outside through their shafts and haze,
 * and the sky is overcast in proportion to the map at the camera, but not
 * above the cloud base.
 */
export default class Precipitation extends Effect {
  #intensity;
  #wind;
  #speed;
  #cloudBase;
  #snow;
  // without a map, it rains everywhere
  #weatherMap = new WeatherMap(1);
  // the map's intensity at the camera, read each frame
  #localIntensity = 1;
  // the scroll of the grid, added up from frame to frame: the speed changes with the snow, and
  // time times the speed would move all the drops when it does
  #offset = 0;
  #lastTime = 0;
  #layerShape;
  #layerLook;
  #onPreRender;
  // the clear sky the haze scatters, drawn at each frame (SkyTable.glsl)
  /** @type {any} */
  #skyTable = undefined;
  /** @type {any} */
  #skyTableFramebuffer = undefined;
  /** @type {any} */
  #skyTableCommand = undefined;

  /**
   * @param {CesiumWidget} viewer
   * @param {{intensity?: number, wind?: number, speed?: number, cloudBase?: number, snow?: number, map?: PrecipitationMapOptions}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#intensity = options.intensity ?? 0.5;
    this.#wind = options.wind ?? 10;
    this.#speed = options.speed ?? 1;
    this.#cloudBase = options.cloudBase ?? 2500;
    this.#snow = options.snow ?? 0;
    this.#weatherMap.map = options.map;
    // what the layers share in the shader, computed here once rather than for each pixel
    this.#layerShape = Array.from({length: LAYERS}, () => new Cartesian4());
    this.#layerLook = Array.from({length: LAYERS}, () => new Cartesian4());
    this.#onPreRender = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(now - this.#lastTime, MAX_STEP);
      this.#lastTime = now;
      this.#offset = (this.#offset + (dt * this.#fallSpeed() * this.#cellsAlong()) / NEAREST) % PERIOD;
      this.#updateLayers();
      const {longitude, latitude, height} = this.viewer.scene.camera.positionCartographic;
      this.#localIntensity = this.#weatherMap.intensityAt(longitude, latitude);
      // above the clouds, the sun shines
      const below = 1 - smoothstep(this.#cloudBase - CLOUD_BASE_FADE, this.#cloudBase + CLOUD_BASE_FADE, height);
      shadeOvercast(this.viewer.scene, this.#localIntensity * below);
      this.#drawSkyTable(this.viewer.scene);
    };
  }

  /**
   * Draws the sky table into its own texture before the stages run.
   * @param {Scene} scene
   */
  #drawSkyTable(scene) {
    // @ts-expect-error the scene's context is not typed
    const context = scene.context;
    if (!context) {
      return;
    }
    if (!this.#skyTable) {
      this.#skyTable = new Texture({context, width: SKY_TABLE + 1, height: 1});
      this.#skyTableFramebuffer = new Framebuffer({context, colorTextures: [this.#skyTable], destroyAttachments: false});
      this.#skyTableCommand = context.createViewportQuadCommand(Height + Fog + Phase + RainHaze + SkyTable, {
        framebuffer: this.#skyTableFramebuffer,
        renderState: RenderState.fromCache({viewport: {x: 0, y: 0, width: SKY_TABLE + 1, height: 1}}),
        uniformMap: {
          skyLightIntensity: () => scene.skyAtmosphere?.atmosphereLightIntensity ?? 50,
          cloudBase: () => this.#cloudBase,
        },
      });
    }
    this.#skyTableCommand.execute(context);
  }

  #destroySkyTable() {
    this.#skyTableCommand?.shaderProgram?.destroy();
    this.#skyTableCommand = undefined;
    this.#skyTableFramebuffer = this.#skyTableFramebuffer?.destroy();
    this.#skyTable = this.#skyTable?.destroy();
  }

  /**
   * Speed of the drops or flakes, in m/s.
   */
  #fallSpeed() {
    return this.#speed * RAIN_VELOCITY * (SNOW_VELOCITY / RAIN_VELOCITY) ** this.#snow;
  }

  /**
   * The layers' uniforms from the snow and the cells along the fall.
   */
  #updateLayers() {
    const cellsAlong = this.#cellsAlong();
    for (let i = 0; i < LAYERS; i++) {
      const scale = 2 ** i;
      // a whole number of cells around, so that they close up
      const count = Math.floor(TWO_PI * CELLS_AROUND * scale + 0.5);
      Cartesian4.fromElements(count / TWO_PI, cellsAlong * scale, count, NEAREST * scale, this.#layerShape[i]);
      const rainRadius = Math.max(0.5, 1 - 0.25 * i);
      const flakeRadius = Math.max(FLAKE_RADIUS / scale, 0.75);
      const rainBrightness = 0.45 - 0.07 * i;
      const snowBrightness = 0.8 - 0.12 * i;
      // the largest flake and its soft edge, the nearest layer's wider, or the thin streak and its
      const flakeReach = i === 0 ? 1.4 * flakeRadius * 1.8 : 1.4 * flakeRadius + 0.5;
      Cartesian4.fromElements(
        rainBrightness + (snowBrightness - rainBrightness) * this.#snow,
        rainRadius + 0.5 + (flakeReach - rainRadius - 0.5) * this.#snow,
        rainRadius,
        flakeRadius,
        this.#layerLook[i],
      );
    }
  }

  /**
   * The length of a drop's trail, in cells: its motion over the exposure.
   */
  #trail() {
    const exposure = RAIN_EXPOSURE * (SNOW_EXPOSURE / RAIN_EXPOSURE) ** this.#snow;
    return Math.min((this.#fallSpeed() * exposure * this.#cellsAlong()) / NEAREST, MAX_TRAIL);
  }

  /**
   * The cells of the grid along the fall per radian, at the nearest layer's distance.
   */
  #cellsAlong() {
    return RAIN_CELLS_ALONG * (SNOW_CELLS_ALONG / RAIN_CELLS_ALONG) ** this.#snow;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    // PrecipitationWind's uniforms, for both passes
    const shared = {
      ...heightUniforms(scene),
      // reduced in double precision: a float would lose the time's fraction of a second
      time: () => (performance.now() / 1000) % TIME_PERIOD,
      wind: () => this.#wind,
      speed: () => this.#speed,
      cloudBase: () => this.#cloudBase,
      intensity: () => this.#intensity,
      snow: () => this.#snow,
    };
    const shafts = new PostProcessStage({
      fragmentShader: EyeFromDepth + Noise + Height + PrecipitationWind + WeatherMapShader + Fog + Phase + RainHaze + CloudsShadow + PrecipitationShafts,
      uniforms: {
        ...shared,
        // the shadow map of the clouds in the scene, whose gaps light the haze
        shadowed: () => (cloudShadow(scene) ? 1 : 0),
        // @ts-expect-error the scene's context is not typed
        shadowMap: () => cloudShadow(scene)?.texture() ?? scene.context.defaultTexture,
        shadowCenter: () => cloudShadow(scene)?.center ?? Cartesian3.ZERO,
        shadowExtent: () => cloudShadow(scene)?.extent() ?? 1,
        shadowBase: () => cloudShadow(scene)?.base() ?? 0,
        shadowTop: () => cloudShadow(scene)?.top() ?? 0,
        // @ts-expect-error the scene's context is not typed
        map: () => this.#weatherMap.texture(scene.context),
        // @ts-expect-error the scene's context is not typed
        nextMap: () => this.#weatherMap.nextTexture(scene.context),
        mapBlend: () => this.#weatherMap.blend,
        mapBounds: () => this.#weatherMap.bounds,
      },
      textureScale: SHAFT_SCALE,
    });
    // blurred at the same resolution
    const blurredShafts = new PostProcessStage({
      fragmentShader: PrecipitationShaftBlur,
      uniforms: {shaftTexture: shafts.name},
      textureScale: SHAFT_SCALE,
    });
    const stage = new PostProcessStageComposite({
      stages: [
        shafts,
        blurredShafts,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + Hash + Height + PrecipitationWind + Fog + Phase + RainHaze + PrecipitationShader,
          uniforms: {
            ...shared,
            shaftTexture: blurredShafts.name,
            localIntensity: () => this.#localIntensity,
            clouds: () => (hasCloudCover(scene) ? 1 : 0),
            shadowed: () => (cloudShadow(scene) ? 1 : 0),
            // @ts-expect-error the scene's context is not typed
            skyTable: () => this.#skyTable ?? scene.context.defaultTexture,
            trail: () => this.#trail(),
            layerShape: () => this.#layerShape,
            layerLook: () => this.#layerLook,
            offset: () => this.#offset,
          },
        }),
      ],
      // the precipitation is drawn over the scene, not over the shafts
      inputPreviousStageTexture: false,
    });
    // no pass, and no frames, without an intensity
    stage.enabled = this.#intensity > 0;
    return stage;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  activated_(scene) {
    this.#lastTime = performance.now() / 1000;
    this.#updateLayers();
    scene.preRender.addEventListener(this.#onPreRender);
    acquireOvercast(scene);
    if (this.#intensity > 0) {
      acquireFrames(scene, FRAME_RATE);
    }
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  deactivating_(scene) {
    if (this.#intensity > 0) {
      releaseFrames(scene, FRAME_RATE);
    }
    releaseOvercast(scene);
    scene.preRender.removeEventListener(this.#onPreRender);
    this.#destroySkyTable();
    this.#weatherMap.destroy();
  }

  /**
   * Where it rains, or undefined for everywhere: an image whose red channel
   * is the local intensity, 0 to 1, over a rectangle of longitudes and
   * latitudes, north up. The precipitation fades in over a pixel of the
   * image. Set it again after drawing on the image, which is read then.
   */
  get map() {
    return this.#weatherMap.map;
  }

  /**
   * The map's intensity at the camera, 0 to 1, read each frame while active;
   * 1 without a map.
   */
  get localIntensity() {
    return this.#localIntensity;
  }

  set map(value) {
    this.#weatherMap.map = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The map the precipitation crossfades to by the map blend, over the same
   * rectangle, as the radar's next hour, or undefined for none.
   */
  get nextMap() {
    return this.#weatherMap.nextMap;
  }

  set nextMap(value) {
    this.#weatherMap.nextMap = value;
    this.viewer.scene.requestRender();
  }

  /**
   * From the map, 0, to the next map, 1.
   */
  get mapBlend() {
    return this.#weatherMap.blend;
  }

  set mapBlend(value) {
    this.#weatherMap.blend = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How hard it rains or snows, 0 to 1: the share of the drops or flakes
   * shown, their opacity, and the haze, from 39 km of visibility to 4.4 km in
   * the rain, taken as 0 to 10 mm/h under a square root, from 20 km to 500 m in
   * the snow.
   */
  get intensity() {
    return this.#intensity;
  }

  set intensity(value) {
    const raining = this.#intensity > 0;
    this.#intensity = value;
    if (this.stage_ && raining !== value > 0) {
      this.stage_.enabled = value > 0;
      (value > 0 ? acquireFrames : releaseFrames)(this.viewer.scene, FRAME_RATE);
    }
    this.viewer.scene.requestRender();
  }

  /**
   * Tilt of the fall from the vertical, toward the east, in degrees.
   */
  get wind() {
    return this.#wind;
  }

  set wind(value) {
    this.#wind = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Speed of the precipitation, 1 at its terminal velocity, 9 m/s for the
   * drops and 1 m/s for the flakes: faster drops draw longer streaks.
   */
  get speed() {
    return this.#speed;
  }

  set speed(value) {
    this.#speed = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Altitude of the cloud base, in meters above the ellipsoid: the
   * precipitation falls below it, in shafts, and none falls around a camera
   * above it.
   */
  get cloudBase() {
    return this.#cloudBase;
  }

  set cloudBase(value) {
    this.#cloudBase = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How much the rain has turned to snow, 0 to 1: the drops slow down from
   * 9 m/s to 1 m/s, shorten and soften into flakes, with the haze, its light
   * and the shafts going from the rain's to the snow's. In between, they are
   * the short, soft streaks of sleet.
   */
  get snow() {
    return this.#snow;
  }

  set snow(value) {
    this.#snow = value;
    this.viewer.scene.requestRender();
  }
}
