import {PostProcessStage, PostProcessStageComposite, TextureMagnificationFilter, TextureMinificationFilter} from '@cesium/engine';
// @ts-expect-error the engine exports its 3D textures and samplers, but does not type them
import {Sampler, Texture3D, TextureWrap} from '@cesium/engine';
import {acquireCloudCover, releaseCloudCover} from './cloud-cover.js';
import createCloudNoise from './cloud-noise.js';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import {heightUniforms} from './height.js';
import CloudsBlur from './shaders/CloudsBlur.js';
import CloudsComposite from './shaders/CloudsComposite.js';
import CloudsMarch from './shaders/CloudsMarch.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Height from './shaders/Height.js';
import RainHaze from './shaders/RainHaze.js';
import WeatherMapShader from './shaders/WeatherMap.js';
import WeatherMap from './weather-map.js';

// the clouds are kilometers wide and soft: a quarter of the resolution, a 16th of the pixels, is
// enough for their raymarch (CloudsComposite.glsl's CLOUD_SCALE)
const CLOUD_SCALE = 0.25;
// voxels along each side of the noise, CloudsMarch.glsl's NOISE_VOXELS
const NOISE_SIZE = 64;

/**
 * The noise's voxels, made once for all the clouds of the page: about a third of a second.
 * @type {Uint8Array | undefined}
 */
let noise;

/**
 * Clouds from a map of the rain: a slab above the cloud base where the map
 * has rain, a flat layer over drizzle and towers up to the cloud top over the
 * heaviest rain, eroded by noise, lit by the sun with a silver lining toward
 * it and by the sky, brighter at their top. Seen from far above they are
 * cloud tops; the camera flies into them as it comes down. Activated before
 * Precipitation, the rain, its shafts and its haze are drawn over them, so
 * from below the cloud base they are seen through the rain. They are
 * raymarched at a quarter of
 * the resolution and upscaled with the weights of the scene's depth. They do
 * not move on their own, so they do not make the scene render. Without a
 * map, there are no clouds.
 */
export default class Clouds extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{map?: import('./weather-map.js').WeatherMapOptions, cloudBase?: number, cloudTop?: number, density?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.cloudBase_ = options.cloudBase ?? 2500;
    this.cloudTop_ = options.cloudTop ?? 9000;
    this.density_ = options.density ?? 1;
    // without a map, no clouds
    this.weatherMap_ = new WeatherMap(0);
    this.weatherMap_.map = options.map;
    // the map's intensity at the camera when it is inside the clouds, read each frame
    this.localDensity_ = 0;
    // made when the clouds are first drawn, as the map's texture
    /** @type {any} */
    this.noiseTexture_ = undefined;
    this.onPreRender_ = () => {
      const {longitude, latitude, height} = this.viewer.scene.camera.positionCartographic;
      const inside = height >= this.cloudBase_ && height <= this.cloudTop_;
      this.localDensity_ = inside ? this.weatherMap_.intensityAt(longitude, latitude) : 0;
    };
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  createStage_(scene) {
    const march = new PostProcessStage({
      fragmentShader: EyeFromDepth + Height + WeatherMapShader + RainHaze + CloudsMarch,
      uniforms: {
        ...heightUniforms(scene),
        // @ts-expect-error the scene's context is not typed
        map: () => this.weatherMap_.texture(scene.context),
        mapBounds: () => this.weatherMap_.bounds,
        // @ts-expect-error the scene's context is not typed
        cloudNoise: () => this.createNoiseTexture_(scene.context),
        cloudBase: () => this.cloudBase_,
        cloudTop: () => this.cloudTop_,
        density: () => this.density_,
      },
      textureScale: CLOUD_SCALE,
    });
    // blurred at the same resolution
    const blurred = new PostProcessStage({
      fragmentShader: CloudsBlur,
      uniforms: {cloudTexture: march.name},
      textureScale: CLOUD_SCALE,
    });
    return new PostProcessStageComposite({
      stages: [
        march,
        blurred,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + CloudsComposite,
          uniforms: {cloudTexture: blurred.name},
        }),
      ],
      // the clouds are drawn over the scene, not over the march
      inputPreviousStageTexture: false,
    });
  }

  /**
   * The noise's texture, repeating in every direction, with its mipmaps for the far clouds.
   * @param {any} context the scene's context
   */
  createNoiseTexture_(context) {
    if (!this.noiseTexture_) {
      noise ??= createCloudNoise(NOISE_SIZE);
      this.noiseTexture_ = new Texture3D({
        context,
        flipY: false,
        source: {width: NOISE_SIZE, height: NOISE_SIZE, depth: NOISE_SIZE, arrayBufferView: noise},
        sampler: new Sampler({
          wrapS: TextureWrap.REPEAT,
          wrapT: TextureWrap.REPEAT,
          wrapR: TextureWrap.REPEAT,
          minificationFilter: TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
          magnificationFilter: TextureMagnificationFilter.LINEAR,
        }),
      });
      this.noiseTexture_.generateMipmap();
    }
    return this.noiseTexture_;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    scene.preRender.addEventListener(this.onPreRender_);
    acquireTerrainDepth(scene);
    acquireCloudCover(scene);
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    releaseCloudCover(scene);
    releaseTerrainDepth(scene);
    scene.preRender.removeEventListener(this.onPreRender_);
    this.weatherMap_.destroy();
    this.noiseTexture_ = this.noiseTexture_?.destroy();
  }

  /**
   * Where it rains, or undefined for no clouds: an image whose red channel
   * is the local intensity, 0 to 1, over a rectangle of longitudes and
   * latitudes, north up, as Precipitation's map. Set it again after drawing
   * on the image, which is read then.
   */
  get map() {
    return this.weatherMap_.map;
  }

  set map(value) {
    this.weatherMap_.map = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Altitude of the cloud base, in meters above the ellipsoid, as
   * Precipitation's.
   */
  get cloudBase() {
    return this.cloudBase_;
  }

  set cloudBase(value) {
    this.cloudBase_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Altitude of the highest cloud tops, over the heaviest rain, in meters
   * above the ellipsoid; over drizzle the clouds are 1500 m thick.
   */
  get cloudTop() {
    return this.cloudTop_;
  }

  set cloudTop(value) {
    this.cloudTop_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Scale of the clouds' opacity: 1 for solid clouds over heavy rain.
   */
  get density() {
    return this.density_;
  }

  set density(value) {
    this.density_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The map's intensity at the camera when it is inside the clouds, 0 to 1,
   * read each frame while active; 0 outside them.
   */
  get localDensity() {
    return this.localDensity_;
  }
}
