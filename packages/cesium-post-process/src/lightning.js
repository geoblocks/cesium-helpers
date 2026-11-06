import {Cartesian3, Cartesian4, Cartographic, Event, Matrix4, Math as CesiumMath} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import {smoothstep} from './smoothstep.js';
import {advanceStrikes, MAX_STRIKES} from './strikes.js';
import WeatherMap from './weather-map.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Hash from './shaders/Hash.js';
import LightningShader from './shaders/Lightning.js';

/** @import {WeatherMapOptions} from './weather-map.js' */
/** @import {CesiumWidget, Scene} from '@cesium/engine' */

// the flickering of the strokes is tens of milliseconds long: a render for each frame of a video
const FRAME_RATE = 30;
// strikes per second at intensity 1
const MAX_RATE = 0.4;
// the nearest a strike lands, in meters, and the least height of its channel
const MIN_DISTANCE = 300;
const MIN_CHANNEL = 500;
// longest time between two frames, in seconds, after a pause in requestRenderMode
const MAX_STEP = 0.1;
const TWO_PI = CesiumMath.TWO_PI;
// the branches of a channel (Lightning.glsl's BRANCHES), the share of them that exist, and how far down
// the channel they leave it and at what angle from it, in radians, at most
const BRANCHES = 5;
const BRANCH_ODDS = 0.7;
const BRANCH_ANGLE = [0.25, 0.75];
// how far from the camera's heading a strike lands in front of it, in radians
const AHEAD = CesiumMath.PI / 6;
// the radar's intensity, 0 to 1, over which a point goes from never to always struck: from about
// 2.5 to 8 mm/h, the map being the square root of the rate over 10 mm/h
const STORM = [0.5, 0.9];
// the farthest the strikes land from a camera high above, in meters, and the most the chance of a
// strike grows with the area they land in
const MAX_RADIUS = 150000;
const MAX_AREA = 16;
// the points tried for a strike before giving it up
const ATTEMPTS = 8;
// the glow of a strike in the clouds is this high above the cloud base, in meters
const GLOW_HEIGHT = 1500;
// the glow and the channel cross-fade over this height on either side of the cloud base, in meters
const ABOVE_FADE = 200;

/**
 * @typedef {{start: number, seed: number, ground: Cartesian3, top: Cartesian3, glow: Cartesian3, glowIntensity: number, branches: number[][]}} Strike
 */

const eyeScratch = new Cartesian3();

/**
 * Lightning: cloud-to-ground strikes at random around the camera, each a
 * branching channel from the cloud base to the ground with 2 to 4 return
 * strokes tens of milliseconds apart, a hot core in a halo that flickers with
 * them, hidden behind nearer terrain, and a flash that lights the land around
 * the strike and the clouds above it. The strikes are placed on the ground,
 * so they stay where they are as the camera moves. With a map, they land on
 * heavy rain, around what the camera sees: within the radius, or as far as
 * the camera is high, up to 150 km. The strokes flicker, so while it is active
 * with an intensity the scene renders at 30 frames per second, also in
 * requestRenderMode.
 */
export default class Lightning extends Effect {
  #intensity;
  #cloudBase;
  #radius;
  #inFront;
  // without a map, it strikes anywhere in the radius
  #weatherMap = new WeatherMap(1);
  /** @type {Strike[]} */
  #strikes = [];
  #strikeTop;
  #strikeBottom;
  #strikeBranches;
  #strikeGlow;
  // 0 below the cloud base to 1 above it, where the glow replaces the channel
  #above = 0;
  #lastTime = 0;
  #onPreRender;

  /**
   * @param {CesiumWidget} viewer
   * @param {{intensity?: number, cloudBase?: number, radius?: number, inFront?: boolean, map?: WeatherMapOptions}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#intensity = options.intensity ?? 0.5;
    this.#cloudBase = options.cloudBase ?? 2500;
    this.#radius = options.radius ?? 5000;
    this.#inFront = options.inFront ?? false;
    this.#weatherMap.map = options.map;
    // what the shader gets of each strike, in eye coordinates: the top of its channel and its seed,
    // its foot and its age, negative for a slot without a strike
    this.#strikeTop = Array.from({length: MAX_STRIKES}, () => new Cartesian4());
    this.#strikeBottom = Array.from({length: MAX_STRIKES}, () => new Cartesian4(0, 0, 0, -1));
    // and each one's branches: where along the channel they leave it, the cosine and the sine of their
    // angle from it, and their length as a share of the channel's, 0 for a branch that does not exist
    this.#strikeBranches = Array.from({length: MAX_STRIKES * BRANCHES}, () => new Cartesian4());
    // the glow of each strike in the clouds, in eye coordinates, and its intensity, 0 for none
    this.#strikeGlow = Array.from({length: MAX_STRIKES}, () => new Cartesian4());
    /**
     * Raised with the foot of each new strike on the ground, as it starts.
     * @type {Event<(ground: Cartesian3) => void>}
     */
    this.strikeEvent = new Event();
    this.#onPreRender = () => {
      const scene = this.viewer.scene;
      const now = performance.now() / 1000;
      const dt = Math.min(now - this.#lastTime, MAX_STEP);
      this.#lastTime = now;
      const area = Math.min((this.#usedRadius() / this.#radius) ** 2, MAX_AREA);
      advanceStrikes(this.#strikes, now, dt, this.#intensity * MAX_RATE * area, Math.random, (start) => {
        const strike = this.#createStrike(start);
        if (strike) {
          this.strikeEvent.raiseEvent(strike.ground);
        }
        return strike;
      });
      this.#above = CesiumMath.clamp((scene.camera.positionCartographic.height - this.#cloudBase + ABOVE_FADE) / (2 * ABOVE_FADE), 0, 1);
      const view = scene.camera.viewMatrix;
      for (let i = 0; i < MAX_STRIKES; i++) {
        const strike = this.#strikes[i];
        if (!strike) {
          this.#strikeBottom[i].w = -1;
          this.#strikeGlow[i].w = 0;
          continue;
        }
        Matrix4.multiplyByPoint(view, strike.top, eyeScratch);
        Cartesian4.fromElements(eyeScratch.x, eyeScratch.y, eyeScratch.z, strike.seed, this.#strikeTop[i]);
        Matrix4.multiplyByPoint(view, strike.ground, eyeScratch);
        Cartesian4.fromElements(eyeScratch.x, eyeScratch.y, eyeScratch.z, now - strike.start, this.#strikeBottom[i]);
        for (let j = 0; j < BRANCHES; j++) {
          const [at, angle, length] = strike.branches[j];
          Cartesian4.fromElements(at, Math.cos(angle), Math.sin(angle), length, this.#strikeBranches[i * BRANCHES + j]);
        }
        Matrix4.multiplyByPoint(view, strike.glow, eyeScratch);
        Cartesian4.fromElements(eyeScratch.x, eyeScratch.y, eyeScratch.z, strike.glowIntensity, this.#strikeGlow[i]);
      }
    };
  }

  /**
   * How far from the camera the strikes land: the radius, or the camera's
   * height when it is higher, so that they land around what it sees.
   */
  #usedRadius() {
    const height = this.viewer.scene.camera.positionCartographic.height;
    return Math.min(Math.max(this.#radius, height), MAX_RADIUS);
  }

  /**
   * A strike at a random place within the radius, uniformly over the area,
   * kept with a chance of the map's intensity there.
   * @param {number} start
   * @return {Strike | undefined}
   */
  #createStrike(start) {
    const scene = this.viewer.scene;
    const {longitude, latitude} = scene.camera.positionCartographic;
    const radius = scene.ellipsoid.maximumRadius;
    // a few points tried, so that the strikes find the heavy rain within the radius rather than
    // mostly missing it
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const azimuth = this.#inFront ? scene.camera.heading + (Math.random() * 2 - 1) * AHEAD : Math.random() * TWO_PI;
      const distance = MIN_DISTANCE + Math.max(this.#usedRadius() - MIN_DISTANCE, 0) * Math.sqrt(Math.random());
      const strikeLongitude = longitude + (distance * Math.sin(azimuth)) / (radius * Math.cos(latitude));
      const strikeLatitude = latitude + (distance * Math.cos(azimuth)) / radius;
      const glowIntensity = this.#weatherMap.intensityAt(strikeLongitude, strikeLatitude);
      if (!this.#weatherMap.map || Math.random() < smoothstep(STORM[0], STORM[1], glowIntensity)) {
        return this.#strikeAt(start, strikeLongitude, strikeLatitude, glowIntensity);
      }
    }
    return undefined;
  }

  /**
   * A strike at a place, with its random branches.
   * @param {number} start
   * @param {number} strikeLongitude radians
   * @param {number} strikeLatitude radians
   * @param {number} glowIntensity the map's intensity there
   * @return {Strike}
   */
  #strikeAt(start, strikeLongitude, strikeLatitude, glowIntensity) {
    const scene = this.viewer.scene;
    const branches = Array.from({length: BRANCHES}, () => {
      const at = 0.1 + 0.7 * Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const angle = side * (BRANCH_ANGLE[0] + (BRANCH_ANGLE[1] - BRANCH_ANGLE[0]) * Math.random());
      return [at, angle, Math.random() < BRANCH_ODDS ? (1 - at) * (0.25 + 0.4 * Math.random()) : 0];
    });
    const height = scene.globe?.getHeight(new Cartographic(strikeLongitude, strikeLatitude)) ?? 0;
    return {
      start,
      seed: Math.random() * 100,
      branches,
      ground: Cartesian3.fromRadians(strikeLongitude, strikeLatitude, height, scene.ellipsoid),
      top: Cartesian3.fromRadians(strikeLongitude, strikeLatitude, Math.max(this.#cloudBase, height + MIN_CHANNEL), scene.ellipsoid),
      glow: Cartesian3.fromRadians(strikeLongitude, strikeLatitude, this.#cloudBase + GLOW_HEIGHT, scene.ellipsoid),
      glowIntensity,
    };
  }

  /**
   * @override
   * @protected
   * @param {Scene} _scene
   */
  createStage_(_scene) {
    const stage = new PostProcessStage({
      fragmentShader: Hash + EyeFromDepth + LightningShader,
      uniforms: {
        strikeTop: () => this.#strikeTop,
        strikeBottom: () => this.#strikeBottom,
        strikeBranches: () => this.#strikeBranches,
        strikeGlow: () => this.#strikeGlow,
        above: () => this.#above,
      },
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
    scene.preRender.addEventListener(this.#onPreRender);
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
    scene.preRender.removeEventListener(this.#onPreRender);
    this.#strikes.length = 0;
    for (const bottom of this.#strikeBottom) {
      bottom.w = -1;
    }
    for (const glow of this.#strikeGlow) {
      glow.w = 0;
    }
  }

  /**
   * How active the storm is, 0 to 1: the strikes start at random, up to one
   * every 2.5 seconds on average.
   */
  get intensity() {
    return this.#intensity;
  }

  set intensity(value) {
    const striking = this.#intensity > 0;
    this.#intensity = value;
    if (this.stage_ && striking !== value > 0) {
      this.stage_.enabled = value > 0;
      (value > 0 ? acquireFrames : releaseFrames)(this.viewer.scene, FRAME_RATE);
    }
    this.viewer.scene.requestRender();
  }

  /**
   * Altitude of the cloud base, in meters above the ellipsoid: the channels
   * start there, and none strike around a camera above it.
   */
  get cloudBase() {
    return this.#cloudBase;
  }

  set cloudBase(value) {
    this.#cloudBase = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Whether the strikes land in front of the camera, within 30 degrees of
   * where it looks, rather than all around it.
   */
  get inFront() {
    return this.#inFront;
  }

  set inFront(value) {
    this.#inFront = value;
  }

  /**
   * How far from the camera the strikes land, in meters.
   */
  get radius() {
    return this.#radius;
  }

  set radius(value) {
    this.#radius = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Where it rains, or undefined to strike anywhere: an image whose red
   * channel is the local intensity, as Precipitation's map. With a map, a
   * strike lands only on heavy rain, more surely as it is heavier.
   */
  get map() {
    return this.#weatherMap.map;
  }

  set map(value) {
    this.#weatherMap.map = value;
  }
}
