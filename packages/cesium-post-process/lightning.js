import {Cartesian3, Cartesian4, Cartographic, Matrix4} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import {advanceStrikes, MAX_STRIKES} from './strikes.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Hash from './shaders/Hash.js';
import LightningShader from './shaders/Lightning.js';

// the flickering of the strokes is tens of milliseconds long: a render for each frame of a video
const FRAME_RATE = 30;
// strikes per second at intensity 1
const MAX_RATE = 0.4;
// the nearest a strike lands, in meters, and the least height of its channel
const MIN_DISTANCE = 300;
const MIN_CHANNEL = 500;
// longest time between two frames, in seconds, after a pause in requestRenderMode
const MAX_STEP = 0.1;
const TWO_PI = 2 * Math.PI;
// the branches of a channel (Lightning.glsl's BRANCHES), the share of them that exist, and how far down
// the channel they leave it and at what angle from it, in radians, at most
const BRANCHES = 5;
const BRANCH_ODDS = 0.7;
const BRANCH_ANGLE = [0.25, 0.75];
// how far from the camera's heading a strike lands in front of it, in radians
const AHEAD = Math.PI / 6;

/**
 * @typedef {{start: number, seed: number, ground: Cartesian3, top: Cartesian3, branches: number[][]}} Strike
 */

const eyeScratch = new Cartesian3();

/**
 * Lightning: cloud-to-ground strikes at random around the camera, each a
 * branching channel from the cloud base to the ground with 2 to 4 return
 * strokes tens of milliseconds apart, a hot core in a halo that flickers with
 * them, hidden behind nearer terrain, and a flash that lights the land around
 * the strike and the clouds above it. The strikes are placed on the ground,
 * so they stay where they are as the camera moves. None strikes around a
 * camera above the cloud base. The strokes flicker, so while it is active
 * with an intensity the scene renders at 30 frames per second, also in
 * requestRenderMode.
 */
export default class Lightning extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{intensity?: number, cloudBase?: number, radius?: number, inFront?: boolean}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.intensity_ = options.intensity ?? 0.5;
    this.cloudBase_ = options.cloudBase ?? 2500;
    this.radius_ = options.radius ?? 5000;
    this.inFront_ = options.inFront ?? false;
    /** @type {Strike[]} */
    this.strikes_ = [];
    // what the shader gets of each strike, in eye coordinates: the top of its channel and its seed,
    // its foot and its age, negative for a slot without a strike
    this.strikeTop_ = Array.from({length: MAX_STRIKES}, () => new Cartesian4());
    this.strikeBottom_ = Array.from({length: MAX_STRIKES}, () => new Cartesian4(0, 0, 0, -1));
    // and each one's branches: where along the channel they leave it, the cosine and the sine of their
    // angle from it, and their length as a share of the channel's, 0 for a branch that does not exist
    this.strikeBranches_ = Array.from({length: MAX_STRIKES * BRANCHES}, () => new Cartesian4());
    this.lastTime_ = 0;
    this.onPreRender_ = () => {
      const scene = this.viewer.scene;
      const now = performance.now() / 1000;
      const dt = Math.min(now - this.lastTime_, MAX_STEP);
      this.lastTime_ = now;
      const below = scene.camera.positionCartographic.height < this.cloudBase_;
      advanceStrikes(this.strikes_, now, dt, below ? this.intensity_ * MAX_RATE : 0, Math.random, (start) => this.createStrike_(start));
      const view = scene.camera.viewMatrix;
      for (let i = 0; i < MAX_STRIKES; i++) {
        const strike = this.strikes_[i];
        if (!strike) {
          this.strikeBottom_[i].w = -1;
          continue;
        }
        Matrix4.multiplyByPoint(view, strike.top, eyeScratch);
        Cartesian4.fromElements(eyeScratch.x, eyeScratch.y, eyeScratch.z, strike.seed, this.strikeTop_[i]);
        Matrix4.multiplyByPoint(view, strike.ground, eyeScratch);
        Cartesian4.fromElements(eyeScratch.x, eyeScratch.y, eyeScratch.z, now - strike.start, this.strikeBottom_[i]);
        for (let j = 0; j < BRANCHES; j++) {
          const [at, angle, length] = strike.branches[j];
          Cartesian4.fromElements(at, Math.cos(angle), Math.sin(angle), length, this.strikeBranches_[i * BRANCHES + j]);
        }
      }
    };
  }

  /**
   * A strike at a random place within the radius, uniformly over the area.
   * @param {number} start
   * @return {Strike}
   */
  createStrike_(start) {
    const scene = this.viewer.scene;
    const {longitude, latitude} = scene.camera.positionCartographic;
    const azimuth = this.inFront_ ? scene.camera.heading + (Math.random() * 2 - 1) * AHEAD : Math.random() * TWO_PI;
    const distance = MIN_DISTANCE + Math.max(this.radius_ - MIN_DISTANCE, 0) * Math.sqrt(Math.random());
    const radius = scene.ellipsoid.maximumRadius;
    const strikeLongitude = longitude + (distance * Math.sin(azimuth)) / (radius * Math.cos(latitude));
    const strikeLatitude = latitude + (distance * Math.cos(azimuth)) / radius;
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
      top: Cartesian3.fromRadians(strikeLongitude, strikeLatitude, Math.max(this.cloudBase_, height + MIN_CHANNEL), scene.ellipsoid),
    };
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} _scene
   */
  createStage_(_scene) {
    const stage = new PostProcessStage({
      fragmentShader: Hash + EyeFromDepth + LightningShader,
      uniforms: {
        strikeTop: () => this.strikeTop_,
        strikeBottom: () => this.strikeBottom_,
        strikeBranches: () => this.strikeBranches_,
      },
    });
    // no pass, and no frames, without an intensity
    stage.enabled = this.intensity_ > 0;
    return stage;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    this.lastTime_ = performance.now() / 1000;
    scene.preRender.addEventListener(this.onPreRender_);
    acquireTerrainDepth(scene);
    if (this.intensity_ > 0) {
      acquireFrames(scene, FRAME_RATE);
    }
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    if (this.intensity_ > 0) {
      releaseFrames(scene, FRAME_RATE);
    }
    releaseTerrainDepth(scene);
    scene.preRender.removeEventListener(this.onPreRender_);
    this.strikes_.length = 0;
    for (const bottom of this.strikeBottom_) {
      bottom.w = -1;
    }
  }

  /**
   * How active the storm is, 0 to 1: the strikes start at random, up to one
   * every 2.5 seconds on average.
   */
  get intensity() {
    return this.intensity_;
  }

  set intensity(value) {
    const striking = this.intensity_ > 0;
    this.intensity_ = value;
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
    return this.cloudBase_;
  }

  set cloudBase(value) {
    this.cloudBase_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Whether the strikes land in front of the camera, within 30 degrees of
   * where it looks, rather than all around it.
   */
  get inFront() {
    return this.inFront_;
  }

  set inFront(value) {
    this.inFront_ = value;
  }

  /**
   * How far from the camera the strikes land, in meters.
   */
  get radius() {
    return this.radius_;
  }

  set radius(value) {
    this.radius_ = value;
    this.viewer.scene.requestRender();
  }
}
