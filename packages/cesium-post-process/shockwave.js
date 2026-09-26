import {Cartesian3, Cartesian4, Matrix4, PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import ShockwaveShader from './shaders/Shockwave.js';

// as in the shader
const MAX_IMPACTS = 8;
const FRAME_RATE = 60;

const eyeScratch = new Cartesian3();

/**
 * Shockwave: from each impact, a ring of refraction spreads over the picture
 * and dies out. While a ring lives the scene renders 60 times per second.
 */
export default class Shockwave extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{strength?: number, speed?: number, duration?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.strength_ = options.strength ?? 1;
    this.speed_ = options.speed ?? 12;
    this.duration_ = options.duration ?? 0.5;
    /** @type {{position: Cartesian3, time: number}[]} */
    this.impacts_ = [];
    this.uniform_ = Array.from({length: MAX_IMPACTS}, () => new Cartesian4(0, 0, 0, -1));
    /** @type {ReturnType<typeof setTimeout> | undefined} while frames are acquired */
    this.framesTimeout_ = undefined;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  createStage_(scene) {
    return new PostProcessStage({
      fragmentShader: EyeFromDepth + ShockwaveShader,
      uniforms: {
        impacts: () => this.impactsUniform_(scene),
        strength: () => this.strength_,
        speed: () => this.speed_,
        duration: () => this.duration_,
      },
    });
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    acquireTerrainDepth(scene);
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    this.releaseFrames_(scene);
    releaseTerrainDepth(scene);
  }

  /**
   * Starts a ring at a position, the ninth replacing the oldest.
   * @param {Cartesian3} position World coordinates.
   */
  impact(position) {
    if (this.impacts_.length === MAX_IMPACTS) {
      this.impacts_.shift();
    }
    this.impacts_.push({position: Cartesian3.clone(position), time: performance.now()});
    const scene = this.viewer.scene;
    if (this.active) {
      // frames for the animation, until the last ring has died out
      if (this.framesTimeout_ === undefined) {
        acquireFrames(scene, FRAME_RATE);
      } else {
        clearTimeout(this.framesTimeout_);
      }
      this.framesTimeout_ = setTimeout(() => this.releaseFrames_(scene), this.duration_ * 1000);
    }
    scene.requestRender();
  }

  /**
   * @param {import('@cesium/engine').Scene} scene
   */
  releaseFrames_(scene) {
    if (this.framesTimeout_ !== undefined) {
      clearTimeout(this.framesTimeout_);
      this.framesTimeout_ = undefined;
      releaseFrames(scene, FRAME_RATE);
    }
  }

  /**
   * @param {import('@cesium/engine').Scene} scene
   */
  impactsUniform_(scene) {
    const now = performance.now();
    this.impacts_ = this.impacts_.filter((impact) => now - impact.time <= this.duration_ * 1000);
    for (let i = 0; i < MAX_IMPACTS; i++) {
      const impact = this.impacts_[i];
      const uniform = this.uniform_[i];
      if (impact) {
        const eye = Matrix4.multiplyByPoint(scene.camera.viewMatrix, impact.position, eyeScratch);
        Cartesian4.fromElements(eye.x, eye.y, eye.z, (now - impact.time) / 1000, uniform);
      } else {
        uniform.w = -1;
      }
    }
    return this.uniform_;
  }

  /**
   * Displacement and brightness of the rings, 0 to 1.
   */
  get strength() {
    return this.strength_;
  }

  set strength(value) {
    this.strength_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Growth of the rings, in meters per second.
   */
  get speed() {
    return this.speed_;
  }

  set speed(value) {
    this.speed_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Life of a ring, in seconds.
   */
  get duration() {
    return this.duration_;
  }

  set duration(value) {
    this.duration_ = value;
    this.viewer.scene.requestRender();
  }
}
