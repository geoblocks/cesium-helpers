import {Cartesian2, Cartesian3, Ellipsoid, JulianDate, Matrix4, PixelDatatype, Math as CesiumMath} from '@cesium/core';
import {PostProcessStage, PostProcessStageComposite, TextureMagnificationFilter, TextureMinificationFilter} from '@cesium/engine';
// @ts-expect-error the engine exports its 3D textures and samplers, but does not type them
import {Sampler, Texture3D, TextureWrap} from '@cesium/engine';
// @ts-expect-error the engine exports its textures, framebuffers and render states, but does not type them
import {Framebuffer, RenderState, Texture} from '@cesium/engine';
import {acquireCloudCover, releaseCloudCover} from './cloud-cover.js';
import cloudWork from './cloud-work.js';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import {heightUniforms} from './height.js';
import CloudLight from './shaders/CloudLight.js';
import CloudsComposite from './shaders/CloudsComposite.js';
import CloudsDensity from './shaders/CloudsDensity.js';
import CloudsMarch from './shaders/CloudsMarch.js';
import CloudsResolve from './shaders/CloudsResolve.js';
import CloudsShadow from './shaders/CloudsShadow.js';
import CloudsShadowMap from './shaders/CloudsShadowMap.js';
import CloudsSlab from './shaders/CloudsSlab.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Fog from './shaders/Fog.js';
import Hash from './shaders/Hash.js';
import Height from './shaders/Height.js';
import Phase from './shaders/Phase.js';
import RainHaze from './shaders/RainHaze.js';
import WeatherMapShader from './shaders/WeatherMap.js';
import WeatherMap, {imageData} from './weather-map.js';

/** @import {CloudShadow} from './cloud-cover.js' */
/** @import {WeatherMapOptions} from './weather-map.js' */
/** @import {CesiumWidget, Scene} from '@cesium/engine' */

// the march marches one pixel of each block of 4 x 4 at each frame, a 16th of the pixels, in a
// texture of a quarter of the resolution, in this order of the pixels of a block, a Bayer matrix's,
// so that consecutive frames march pixels far apart; CloudsResolve.glsl builds the full resolution,
// a pixel's n-th sample since the view last changed weighing 1 / n in it, a running mean, down to
// this share, about the last 20 samples, few enough for the clouds to follow the light as it moves
// less than LIGHT_TIME's, and enough to average out the march's jitter along the clouds' edges
const CLOUD_SCALE = 0.25;
const LEAST_FRESH = 0.05;
const BAYER = [0, 10, 2, 8, 5, 15, 7, 13, 1, 11, 3, 9, 4, 14, 6, 12].map((i) => new Cartesian2(i % 4, Math.floor(i / 4)));
// voxels along each side of the noise and of its finest details, CloudsDensity.glsl's
// NOISE_VOXELS and DETAIL_VOXELS
const NOISE_SIZE = 64;
const DETAIL_VOXELS = 32;
// after the camera, the light or the clouds change, the scene renders at this frame rate, also in
// requestRenderMode, for this many rounds of the 16 pixels of each block, for the accumulation to
// settle: eight samples of each pixel, a frame count rather than a time, so that a slower GPU's
// clouds settle as far; fewer leave the march's jitter as grain along the clouds' edges
const SETTLE_RATE = 30;
const SETTLE_ROUNDS = 8;
// the clock changes the clouds only through their light, the sun's or the moon's direction, which
// moves about a quarter of a degree in this many seconds: a clock playing at its own pace changes
// nothing between frames, a change of more than this does. Likewise a crossfade played with it, as
// the weather demo plays an hour's, moves the map's blend a little at each frame, which the
// running mean follows: a change of the blend by this much or more starts the accumulation over
const LIGHT_TIME = 60;
const BLEND_STEP = 1 / 60;
// the shadow map: its texels across, over a square centered on the ground point under the camera,
// this many times as wide as the camera is high, between these sides, in meters, so that it covers
// the view from high above; drawn again once that point moves a 40th of it, its side changes by a
// quarter, the light or the clouds change, rather than at each frame
const SHADOW_SIZE = 512;
const SHADOW_SPREAD = 4;
const SHADOW_EXTENTS = [80000, 800000];
const SHADOW_MOVE = 1 / 40;
const SHADOW_RESIZE = 0.25;
// and at most once in this many milliseconds, while they keep changing, as during playback: a
// redraw takes as long as a frame of the clouds or longer
const SHADOW_INTERVAL = 250;
// the history is a copy of the resolve's output, drawn rather than copied: Cesium does not copy
// from a framebuffer into a texture of half floats
const COPY = `precision highp sampler2D;
uniform sampler2D source;
in vec2 v_textureCoordinates;
void main() {
  out_FragColor = texture(source, v_textureCoordinates);
}
`;
// the clouds over the lightest rain are this thick, in meters, and their base and top swing by
// these, as CloudsDensity.glsl explains
const THIN_DEPTH = 1500;
const BASE_SWING = 300;
const BASE_DROP = 250;
const TOP_SWING = 0.3;
// those constants and the march's blocks for the shaders, prepended to them, so that the slab the
// march and the shadow map cover is the one the density fills
const SHADER_CONSTANTS = Object.entries({THIN_DEPTH, BASE_SWING, BASE_DROP, TOP_SWING, BLOCK: 1 / CLOUD_SCALE})
  .map(([name, value]) => `const float ${name} = ${Number.isInteger(value) ? value.toFixed(1) : String(value)};\n`)
  .join('');

// texels along each side of the map's noise
const MAP_NOISE_SIZE = 256;

/**
 * The noise's voxels, its finest details' and the noise over the clouds' map.
 * @typedef {{noise: Uint8Array, detail: Uint8Array, mapNoise: Uint8Array}} Noises
 */

/**
 * The noises, made once for all the clouds of the page, in the worker: about a third of a second.
 * @type {Promise<Noises> | undefined}
 */
let noises;

/**
 * The noises, made at the first call.
 */
function makeNoises() {
  noises ??= Promise.all([cloudWork.call('cloudNoise', NOISE_SIZE), cloudWork.call('cloudDetail', DETAIL_VOXELS), cloudWork.call('mapNoise', MAP_NOISE_SIZE)]).then(
    ([noise, detail, mapNoise]) => ({noise, detail, mapNoise}),
    (error) => {
      // made again at the next activation
      noises = undefined;
      throw error;
    },
  );
  return noises;
}

const groundScratch = new Cartesian3();
const viewProjectionScratch = new Matrix4();
const sizeScratch = new Cartesian2();

/**
 * Clouds from a map of the rain: a slab about the cloud base where the map
 * has rain, a deck over drizzle and towers up to the cloud top over the
 * heaviest rain, their bases and tops uneven, eroded by noise, lit by the sun
 * with a silver lining toward it, or the moon at night, and by the sky,
 * brighter at their top. Seen from far above they are cloud tops; the camera
 * flies into them as it comes down. Activated before Precipitation, the rain,
 * its shafts and its haze are drawn over them, so from below the cloud base
 * they are seen through the rain. One pixel of each block of 4 x 4 is
 * raymarched at each frame, and the full resolution built from them over the
 * frames. After a change, the scene renders for eight samples of each
 * pixel, about four seconds at 30 frames per second, for them to settle,
 * then rests.
 * Without a map, there are no clouds.
 */
export default class Clouds extends Effect {
  #cloudBase;
  #cloudTop;
  #density;
  #fairWeather;
  // without a map, no clouds but the fair-weather cumulus
  #weatherMap = new WeatherMap(0);
  /** @type {WeatherMapOptions | undefined} */
  #map;
  /** @type {WeatherMapOptions | undefined} */
  #nextMap = undefined;
  // the clouds' maps of the map and the next map, made in the worker, by their rain map's image: at
  // an hour's change, the map is the previous next map, already made; the others are dropped, their
  // calls aborted if they are still waiting
  /** @type {Map<object, {made: Promise<WeatherMapOptions>, controller: AbortController}>} */
  #cloudMaps = new Map();
  // the noises, once made: until then the clouds are not drawn
  /** @type {Noises | undefined} */
  #noises = undefined;
  // the map's intensity at the camera when it is inside the clouds, read each frame
  #localDensity = 0;
  // made when the clouds are first drawn, as the map's texture
  /** @type {any} */
  #noiseTexture = undefined;
  /** @type {any} */
  #detailTexture = undefined;
  /** @type {any} */
  #mapNoiseTexture = undefined;
  // the accumulation over the frames: the frames drawn, the previous frames' clouds, whether they
  // are to be taken, the previous frame's view and projection, and what makes the scene render
  // until it settles
  #frame = 0;
  // the frames since the camera, the light or the clouds last changed
  #stillFrames = 0;
  /** @type {any} */
  #history = undefined;
  /** @type {any} */
  #historyFramebuffer = undefined;
  /** @type {any} */
  #copy = undefined;
  /** @type {any} */
  #copySource = undefined;
  // the stage that builds the full resolution, whose output the history keeps
  /** @type {PostProcessStage | undefined} */
  #resolve = undefined;
  // whether the history is to be taken: not before one is kept, nor after another map's clouds
  #historyValid = false;
  #sceneSize = new Cartesian2();
  #previousViewProjection = new Matrix4();
  #reprojection = new Matrix4();
  #lastViewProjection = new Matrix4();
  #lastSize = new Cartesian2();
  /** @type {JulianDate | undefined} */
  #lastTime = undefined;
  #changed = false;
  // the map's blend when the accumulation last started over for it
  #settledBlend = 0;
  #settling = false;
  // the shadow map, its ground point and time, and whether the clouds changed since it was drawn
  /** @type {any} */
  #shadow = undefined;
  /** @type {any} */
  #shadowFramebuffer = undefined;
  /** @type {any} */
  #shadowCommand = undefined;
  #shadowCenter = new Cartesian3();
  #shadowExtent;
  /** @type {JulianDate | undefined} */
  #shadowTime = undefined;
  #shadowDrawnAt;
  #shadowChanged = true;
  /** @type {CloudShadow} */
  #shadowSource;
  #onPreRender;
  #onPostRender;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, map?: WeatherMapOptions, cloudBase?: number, cloudTop?: number, density?: number, fairWeather?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer, options);
    this.terrainDepth_ = true;
    this.#cloudBase = options.cloudBase ?? 2500;
    this.#cloudTop = options.cloudTop ?? 9000;
    this.#density = options.density ?? 1;
    this.#fairWeather = options.fairWeather ?? 0;
    // the maps of the rain, from which the clouds' maps are made
    this.map = options.map;
    this.#shadowExtent = SHADOW_EXTENTS[0];
    this.#shadowDrawnAt = -Infinity;
    // for Precipitation, which lights its haze through it
    this.#shadowSource = {texture: () => this.#shadow, center: this.#shadowCenter, extent: () => this.#shadowExtent, base: () => this.#slabBottom(), top: () => this.#slabTop()};
    this.#onPreRender = () => {
      const {scene} = this.viewer;
      const {camera} = scene;
      this.#drawShadow(scene);
      const {longitude, latitude, height} = camera.positionCartographic;
      const inside = height >= this.#slabBottom() && height <= this.#slabTop();
      this.#localDensity = inside ? this.#weatherMap.intensityAt(longitude, latitude) : 0;
      const time = this.viewer.clock.currentTime;
      // the projection and the size too: a zoom with the camera held moves what a pixel sees, and a
      // still view reads each pixel's history where it is
      const viewProjection = Matrix4.multiply(camera.frustum.projectionMatrix, camera.viewMatrix, viewProjectionScratch);
      const size = Cartesian2.fromElements(scene.drawingBufferWidth, scene.drawingBufferHeight, sizeScratch);
      if (
        this.#changed ||
        !Matrix4.equals(viewProjection, this.#lastViewProjection) ||
        !Cartesian2.equals(size, this.#lastSize) ||
        !JulianDate.equalsEpsilon(time, this.#lastTime, LIGHT_TIME)
      ) {
        this.#changed = false;
        this.#stillFrames = 0;
        Matrix4.clone(viewProjection, this.#lastViewProjection);
        Cartesian2.clone(size, this.#lastSize);
        this.#lastTime = JulianDate.clone(time, this.#lastTime);
        if (!this.#settling) {
          this.#settling = true;
          acquireFrames(this.viewer.scene, SETTLE_RATE);
        }
      }
    };
    this.#onPostRender = () => {
      const {scene} = this.viewer;
      this.#keepHistory(scene);
      Matrix4.multiply(scene.camera.frustum.projectionMatrix, scene.camera.viewMatrix, this.#previousViewProjection);
      // a whole number of rounds of the blocks' pixels
      this.#frame = (this.#frame + 1) % 1024;
      this.#stillFrames++;
      if (this.#settling && this.#stillFrames >= SETTLE_ROUNDS * BAYER.length) {
        this.#settling = false;
        releaseFrames(scene, SETTLE_RATE);
      }
    };
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    const frameOffset = () => BAYER[this.#frame % BAYER.length];
    // its texture of 32-bit floats holds the light, the transmittance and the distance packed
    const march = new PostProcessStage({
      fragmentShader: SHADER_CONSTANTS + EyeFromDepth + Hash + Height + CloudsSlab + WeatherMapShader + CloudsDensity + CloudsShadow + Fog + Phase + CloudLight + RainHaze + CloudsMarch,
      uniforms: {
        ...this.#slabUniforms(scene),
        // @ts-expect-error the scene's context is not typed
        ...this.#densityUniforms(scene.context),
        ...this.#shadowUniforms(scene),
        // @ts-expect-error the scene's context is not typed
        maxMap: () => this.#weatherMap.maxTexture(scene.context),
        frame: () => this.#frame,
        frameOffset,
        sceneSize: () => Cartesian2.fromElements(scene.drawingBufferWidth, scene.drawingBufferHeight, this.#sceneSize),
        skyLightIntensity: () => scene.skyAtmosphere?.atmosphereLightIntensity ?? 50,
      },
      textureScale: CLOUD_SCALE,
      pixelDatatype: PixelDatatype.FLOAT,
    });
    // at the full resolution, built over the frames
    const resolve = (this.#resolve = new PostProcessStage({
      fragmentShader: SHADER_CONSTANTS + EyeFromDepth + Height + CloudsSlab + CloudsResolve,
      uniforms: {
        ...this.#slabUniforms(scene),
        cloudTexture: march.name,
        // @ts-expect-error the scene's context is not typed
        historyTexture: () => this.#history ?? scene.context.defaultTexture,
        reprojection: () => Matrix4.multiply(this.#previousViewProjection, scene.camera.inverseViewMatrix, this.#reprojection),
        hasHistory: () => this.#historyValid,
        frameOffset,
        fresh: () => Math.max(1 / (1 + Math.floor(this.#stillFrames / BAYER.length)), LEAST_FRESH),
      },
      pixelDatatype: PixelDatatype.HALF_FLOAT,
    }));
    const composite = new PostProcessStageComposite({
      ...this.named_,
      stages: [
        march,
        resolve,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + CloudsShadow + CloudsComposite,
          uniforms: {
            ...this.#shadowUniforms(scene),
            cloudTexture: resolve.name,
          },
        }),
      ],
      // the clouds are drawn over the scene, not over the march
      inputPreviousStageTexture: false,
    });
    // drawn once the noises are made
    composite.enabled = this.#noises !== undefined;
    return composite;
  }

  /**
   * The top of the tallest cloud the map makes, as CloudsDensity.glsl's cloudDensity makes the
   * clouds of its tallest type, over its heaviest rain: from above, the march starts there rather than at the cloud
   * top, so that its steps are in the clouds rather than in the empty air over them.
   */
  #slabTop() {
    // the clouds' map's tallest type, in blue
    const type = this.#weatherMap.maxValues[2];
    return this.#cloudBase + (THIN_DEPTH + (this.#cloudTop - this.#cloudBase - THIN_DEPTH) * type) * (1 + TOP_SWING);
  }

  /**
   * The lowest a cloud's base goes, as CloudsDensity.glsl's cloudDensity lowers it: where the base
   * swings down, under the heaviest rain.
   */
  #slabBottom() {
    return this.#cloudBase - BASE_SWING - BASE_DROP;
  }

  /**
   * The uniforms of CloudsSlab.glsl, with Height.glsl's it needs.
   * @param {Scene} scene
   */
  #slabUniforms(scene) {
    return {...heightUniforms(scene), cloudBase: () => this.#cloudBase, slabBottom: () => this.#slabBottom(), slabTop: () => this.#slabTop()};
  }

  /**
   * The uniforms of CloudsDensity.glsl, with WeatherMap.glsl's it needs.
   * @param {any} context the scene's context
   */
  #densityUniforms(context) {
    return {
      map: () => this.#weatherMap.texture(context),
      nextMap: () => this.#weatherMap.nextTexture(context),
      mapBlend: () => this.#weatherMap.blend,
      mapBounds: () => this.#weatherMap.bounds,
      cloudNoise: () => this.#createNoiseTexture(context),
      cloudDetail: () => this.#createDetailTexture(context),
      mapNoise: () => this.#createMapNoiseTexture(context),
      cloudTop: () => this.#cloudTop,
      density: () => this.#density,
      fairWeather: () => this.#fairWeather,
    };
  }

  /**
   * The uniforms of CloudsShadow.glsl, for the stages that read the shadow map.
   * @param {Scene} scene
   */
  #shadowUniforms(scene) {
    return {
      // @ts-expect-error the scene's context is not typed
      shadowMap: () => this.#shadow ?? scene.context.defaultTexture,
      shadowCenter: () => this.#shadowCenter,
      shadowExtent: () => this.#shadowExtent,
      shadowBase: () => this.#slabBottom(),
      shadowTop: () => this.#slabTop(),
    };
  }

  /**
   * The shadow map's side, in meters, for a camera this high.
   * @param {number} height meters
   */
  #shadowExtentFor(height) {
    return CesiumMath.clamp(SHADOW_SPREAD * height, SHADOW_EXTENTS[0], SHADOW_EXTENTS[1]);
  }

  /**
   * Whether the shadow map, drawn around a ground point at a time, is to be drawn again.
   * @param {Cartesian3} ground the ground point under the camera, in world coordinates
   * @param {JulianDate} time the clock's
   * @param {number} [extent] the side it would have now, in meters
   */
  #shadowStale(ground, time, extent = this.#shadowExtent) {
    return (
      this.#shadowChanged ||
      !JulianDate.equalsEpsilon(time, this.#shadowTime, LIGHT_TIME) ||
      Cartesian3.distance(ground, this.#shadowCenter) > SHADOW_MOVE * this.#shadowExtent ||
      Math.abs(extent - this.#shadowExtent) > SHADOW_RESIZE * this.#shadowExtent
    );
  }

  /**
   * Whether the shadow map is to be drawn again now: stale, and not drawn in the last
   * SHADOW_INTERVAL.
   * @param {Cartesian3} ground
   * @param {JulianDate} time
   * @param {number} now milliseconds
   * @param {number} [extent] the side it would have now, in meters
   */
  #shadowDue(ground, time, now, extent) {
    return this.#shadowStale(ground, time, extent) && now - this.#shadowDrawnAt >= SHADOW_INTERVAL;
  }

  /**
   * @param {Cartesian3} ground
   * @param {JulianDate} time
   * @param {number} [now] milliseconds
   * @param {number} [extent] its side, in meters
   */
  #shadowDrawn(ground, time, now = Date.now(), extent = this.#shadowExtent) {
    Cartesian3.clone(ground, this.#shadowCenter);
    this.#shadowExtent = extent;
    this.#shadowTime = JulianDate.clone(time, this.#shadowTime);
    this.#shadowDrawnAt = now;
    this.#shadowChanged = false;
  }

  /**
   * Draws the shadow map into its own texture before the stages run, when it is due: the
   * stages' textures are sized after the screen. A redraw put off renders after the change
   * settles, in the frames the accumulation asks for.
   * @param {Scene} scene
   */
  #drawShadow(scene) {
    if (!this.#noises) {
      return;
    }
    const ground = Ellipsoid.WGS84.scaleToGeodeticSurface(scene.camera.positionWC, groundScratch);
    const time = this.viewer.clock.currentTime;
    const now = Date.now();
    const extent = this.#shadowExtentFor(scene.camera.positionCartographic.height);
    if (!ground || !this.#shadowDue(ground, time, now, extent)) {
      return;
    }
    this.#shadowDrawn(ground, time, now, extent);
    // @ts-expect-error the scene's context is not typed
    const context = scene.context;
    if (!context) {
      return;
    }
    if (!this.#shadow) {
      this.#shadow = this.createTexture_({context, width: SHADOW_SIZE, height: SHADOW_SIZE, pixelDatatype: PixelDatatype.HALF_FLOAT});
      this.#shadowFramebuffer = this.createFramebuffer_({context, colorTextures: [this.#shadow], destroyAttachments: false});
      this.#shadowCommand = context.createViewportQuadCommand(SHADER_CONSTANTS + Height + CloudsSlab + WeatherMapShader + CloudsDensity + CloudsShadow + CloudsShadowMap, {
        framebuffer: this.#shadowFramebuffer,
        renderState: this.renderState_({x: 0, y: 0, width: SHADOW_SIZE, height: SHADOW_SIZE}),
        uniformMap: {
          ...this.#slabUniforms(scene),
          ...this.#densityUniforms(context),
          maxMap: () => this.#weatherMap.maxTexture(context),
          shadowCenter: () => this.#shadowCenter,
          shadowExtent: () => this.#shadowExtent,
        },
      });
    }
    this.#shadowCommand.execute(context);
  }

  #destroyShadow() {
    this.#shadowCommand?.shaderProgram?.destroy();
    this.#shadowCommand = undefined;
    this.#shadowFramebuffer = this.#shadowFramebuffer?.destroy();
    this.#shadow = this.#shadow?.destroy();
    this.#shadowChanged = true;
  }

  /**
   * Keeps this frame's accumulated clouds for the next one, drawn into the history at the size of
   * the resolve's output, made again when it changes.
   * @param {Scene} scene
   */
  #keepHistory(scene) {
    // @ts-expect-error the collection's output textures are not typed
    const output = this.#noises && this.stage_ && this.#resolve && scene.postProcessStages.getOutputTexture?.(this.#resolve.name);
    if (!output) {
      return;
    }
    // @ts-expect-error the scene's context is not typed
    const context = scene.context;
    if (!this.#history || this.#history.width !== output.width || this.#history.height !== output.height) {
      this.#destroyHistory();
      this.#history = this.createTexture_({context, width: output.width, height: output.height, pixelDatatype: PixelDatatype.HALF_FLOAT});
      this.#historyFramebuffer = this.createFramebuffer_({context, colorTextures: [this.#history], destroyAttachments: false});
      this.#historyValid = false;
    }
    this.#copySource = output;
    this.#copy ??= context.createViewportQuadCommand(COPY, {uniformMap: {source: () => this.#copySource}});
    this.#copy.framebuffer = this.#historyFramebuffer;
    this.#copy.renderState = this.renderState_({x: 0, y: 0, width: output.width, height: output.height});
    this.#copy.execute(context);
    this.#historyValid = true;
  }

  #destroyHistory() {
    this.#historyFramebuffer = this.#historyFramebuffer?.destroy();
    this.#history = this.#history?.destroy();
    this.#historyValid = false;
  }

  /**
   * The noise's texture.
   * @param {any} context the scene's context
   */
  #createNoiseTexture(context) {
    this.#noiseTexture ??= this.#createRepeating3D(context, NOISE_SIZE, this.#made().noise);
    return this.#noiseTexture;
  }

  /**
   * The finest details' texture.
   * @param {any} context the scene's context
   */
  #createDetailTexture(context) {
    this.#detailTexture ??= this.#createRepeating3D(context, DETAIL_VOXELS, this.#made().detail);
    return this.#detailTexture;
  }

  /**
   * A cube of voxels as a texture repeating in every direction, with its mipmaps for the far clouds.
   * @param {any} context the scene's context
   * @param {number} size voxels along each side
   * @param {Uint8Array} voxels RGBA bytes
   */
  #createRepeating3D(context, size, voxels) {
    const texture = this.createTexture3D_({
      context,
      flipY: false,
      source: {width: size, height: size, depth: size, arrayBufferView: voxels},
      sampler: new Sampler({
        wrapS: TextureWrap.REPEAT,
        wrapT: TextureWrap.REPEAT,
        wrapR: TextureWrap.REPEAT,
        minificationFilter: TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
        magnificationFilter: TextureMagnificationFilter.LINEAR,
      }),
    });
    texture.generateMipmap();
    return texture;
  }

  /**
   * The noises, made before the clouds are drawn.
   */
  #made() {
    return /** @type {Noises} */ (this.#noises);
  }

  /**
   * The noise over the clouds' map, repeating.
   * @param {any} context the scene's context
   */
  #createMapNoiseTexture(context) {
    if (!this.#mapNoiseTexture) {
      this.#mapNoiseTexture = this.createTexture_({
        context,
        flipY: false,
        source: {width: MAP_NOISE_SIZE, height: MAP_NOISE_SIZE, arrayBufferView: this.#made().mapNoise},
        sampler: new Sampler({
          wrapS: TextureWrap.REPEAT,
          wrapT: TextureWrap.REPEAT,
          minificationFilter: TextureMinificationFilter.LINEAR,
          magnificationFilter: TextureMagnificationFilter.LINEAR,
        }),
      });
    }
    return this.#mapNoiseTexture;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  activated_(scene) {
    scene.preRender.addEventListener(this.#onPreRender);
    scene.postRender.addEventListener(this.#onPostRender);
    // drawn, and leaving the rain under them to Precipitation, once the noises are made, if still
    // active then
    const stage = this.stage_;
    makeNoises().then(
      (made) => {
        this.#noises = made;
        if (stage && this.stage_ === stage) {
          stage.enabled = true;
          acquireCloudCover(scene, this.#shadowSource);
          this.#historyValid = false;
          this.#cloudsChanged();
        }
      },
      (error) => console.error("The clouds' noise could not be made:", error),
    );
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  deactivating_(scene) {
    releaseCloudCover(scene, this.#shadowSource);
    scene.preRender.removeEventListener(this.#onPreRender);
    scene.postRender.removeEventListener(this.#onPostRender);
    if (this.#settling) {
      this.#settling = false;
      releaseFrames(scene, SETTLE_RATE);
    }
    this.#destroyHistory();
    this.#destroyShadow();
    // removed with the stage, which destroys it
    this.#resolve = undefined;
    this.#copy?.shaderProgram?.destroy();
    this.#copy = undefined;
    this.#weatherMap.destroy();
    this.#noiseTexture = this.#noiseTexture?.destroy();
    this.#detailTexture = this.#detailTexture?.destroy();
    this.#mapNoiseTexture = this.#mapNoiseTexture?.destroy();
  }

  /**
   * Where it rains, or undefined for no clouds: an image whose red channel
   * is the local intensity, 0 to 1, over a rectangle of longitudes and
   * latitudes, north up, as Precipitation's map. Set it again after drawing
   * on the image, which is read then.
   */
  get map() {
    return this.#map;
  }

  set map(value) {
    this.#map = value;
    this.#whenMade(value, (cloudMap) => {
      if (this.#map === value) {
        this.#weatherMap.map = cloudMap;
        // the previous map's clouds would linger
        this.#historyValid = false;
        this.#cloudsChanged();
      }
    });
  }

  /**
   * Hands the clouds' map of a map of the rain to `use` once made in the worker, at once for no
   * map: the clouds keep the previous one until then. The maps neither the map nor the next map
   * is are dropped.
   * @param {WeatherMapOptions | undefined} map
   * @param {(cloudMap: WeatherMapOptions | undefined) => void} use
   */
  #whenMade(map, use) {
    // once both setters of an hour's change ran, in either order
    queueMicrotask(() => this.#dropUnwanted());
    if (!map) {
      use(undefined);
      return;
    }
    this.#cloudMapOf(map).then(use, (error) => {
      // but a dropped map's
      if (error?.name !== 'AbortError') {
        console.error("The clouds' map could not be made:", error);
      }
    });
  }

  /**
   * Drops the clouds' maps neither the map nor the next map is, aborting their calls if they are
   * still waiting.
   */
  #dropUnwanted() {
    for (const [image, {controller}] of this.#cloudMaps) {
      if (image !== this.#map?.image && image !== this.#nextMap?.image) {
        controller.abort();
        this.#cloudMaps.delete(image);
      }
    }
  }

  /**
   * The clouds' map of a map of the rain, made once for each image.
   * @param {WeatherMapOptions} map
   */
  #cloudMapOf(map) {
    const {image, rectangle} = map;
    let cloudMap = this.#cloudMaps.get(image);
    if (!cloudMap) {
      const controller = new AbortController();
      const {width, height, data} = /** @type {{width: number, height: number, data: Uint8ClampedArray}} */ (imageData(image));
      const {west, south, east, north} = rectangle;
      const made = cloudWork
        .call('cloudMap', {image: {width, height, data}, rectangle: {west, south, east, north}}, controller.signal)
        .then(
          (pixels) => ({image: pixels, rectangle}),
          (error) => {
            // made again when set again
            if (this.#cloudMaps.get(image)?.controller === controller) {
              this.#cloudMaps.delete(image);
            }
            throw error;
          },
        );
      cloudMap = {made, controller};
      this.#cloudMaps.set(image, cloudMap);
    }
    return cloudMap.made;
  }

  // the clouds changed: their shadow map is drawn again, and their accumulation starts over and
  // settles
  #cloudsChanged() {
    this.#shadowChanged = true;
    this.#changed = true;
    // a map made after the viewer was destroyed
    if (!this.viewer.scene.isDestroyed()) {
      this.viewer.scene.requestRender();
    }
  }

  /**
   * The map the clouds crossfade to by the map blend, over the same
   * rectangle, as the radar's next hour, or undefined for none.
   */
  get nextMap() {
    return this.#nextMap;
  }

  set nextMap(value) {
    this.#nextMap = value;
    this.#whenMade(value, (cloudMap) => {
      if (this.#nextMap === value) {
        this.#weatherMap.nextMap = cloudMap;
        this.#cloudsChanged();
      }
    });
  }

  /**
   * From the map, 0, to the next map, 1.
   */
  get mapBlend() {
    return this.#weatherMap.blend;
  }

  set mapBlend(value) {
    if (value === this.#weatherMap.blend) {
      return;
    }
    this.#weatherMap.blend = value;
    if (Math.abs(value - this.#settledBlend) >= BLEND_STEP) {
      this.#settledBlend = value;
      this.#cloudsChanged();
    } else {
      this.#shadowChanged = true;
      this.viewer.scene.requestRender();
    }
  }

  /**
   * Altitude of the cloud base, in meters above the ellipsoid, as
   * Precipitation's.
   */
  get cloudBase() {
    return this.#cloudBase;
  }

  set cloudBase(value) {
    this.#cloudBase = value;
    this.#cloudsChanged();
  }

  /**
   * Altitude of the highest cloud tops, over the heaviest rain, in meters
   * above the ellipsoid; over drizzle the clouds are 1500 m thick.
   */
  get cloudTop() {
    return this.#cloudTop;
  }

  set cloudTop(value) {
    this.#cloudTop = value;
    this.#cloudsChanged();
  }

  /**
   * Scale of the clouds' opacity: 1 for solid clouds over heavy rain.
   */
  get density() {
    return this.#density;
  }

  set density(value) {
    this.#density = value;
    this.#cloudsChanged();
  }

  /**
   * The coverage of fair-weather cumulus over the dry ground, 0 for none to 1: the bright, separate
   * puffs of a day without rain, which a radar does not see, in fields with clear sky between them,
   * blending into the clouds over the rain. Every view ray through the slab is then marched, not only
   * those over the rain.
   */
  get fairWeather() {
    return this.#fairWeather;
  }

  set fairWeather(value) {
    this.#fairWeather = value;
    this.#cloudsChanged();
  }

  /**
   * The map's intensity at the camera when it is inside the clouds, 0 to 1,
   * read each frame while active; 0 outside them, and in the fair-weather cumulus, which are not on
   * the map.
   */
  get localDensity() {
    return this.#localDensity;
  }

  /**
   * A texture the clouds draw with or into: a test without WebGL makes its own.
   * @protected
   * @param {any} options the Texture's options
   * @return {Texture}
   */
  createTexture_(options) {
    return new Texture(options);
  }

  /**
   * The noise's 3D texture: a test without WebGL makes its own.
   * @protected
   * @param {any} options the Texture3D's options
   * @return {Texture3D}
   */
  createTexture3D_(options) {
    return new Texture3D(options);
  }

  /**
   * A framebuffer the clouds draw into: a test without WebGL makes its own.
   * @protected
   * @param {any} options the Framebuffer's options
   * @return {Framebuffer}
   */
  createFramebuffer_(options) {
    return new Framebuffer(options);
  }

  /**
   * The render state of a draw into a viewport: a test without WebGL makes its own.
   * @protected
   * @param {{x: number, y: number, width: number, height: number}} viewport
   * @return {RenderState}
   */
  renderState_(viewport) {
    return RenderState.fromCache({viewport});
  }
}
