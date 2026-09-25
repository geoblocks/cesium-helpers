import {PostProcessStage, PostProcessStageComposite, PostProcessStageLibrary} from '@cesium/engine';
import Frame from './shaders/Frame.js';
import Noise from './shaders/Noise.js';
import Super8Shader from './shaders/Super8.js';

// spread of the halation glow, the sigma and step of Cesium's blur stage
const HALATION_SIGMA = 6;
const HALATION_STEP = 2;
// Super 8 runs at 18 frames per second, as in Super8.glsl
const FRAME_RATE = 18;

/**
 * A Super 8 home movie: faded warm colors, halation, grain, gate weave,
 * flicker, light leaks and the rounded corners of the camera gate. The film moves, so while
 * active the scene renders at its 18 frames per second, also in requestRenderMode.
 */
export default class Super8 {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{fade?: number, halation?: number, grain?: number, weave?: number, flicker?: number, lightLeaks?: number, aspectRatio?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.fade_ = options.fade ?? 0.5;
    this.halation_ = options.halation ?? 0.5;
    this.grain_ = options.grain ?? 0.15;
    this.weave_ = options.weave ?? 1.5;
    this.flicker_ = options.flicker ?? 0.08;
    this.lightLeaks_ = options.lightLeaks ?? 0.5;
    this.aspectRatio_ = options.aspectRatio ?? 4 / 3;
    /** @type {PostProcessStageComposite | undefined} */
    this.stage_ = undefined;
    /** @type {ReturnType<typeof setInterval> | undefined} */
    this.interval_ = undefined;
  }

  get active() {
    return this.stage_ !== undefined;
  }

  set active(active) {
    if (active === this.active) {
      return;
    }
    const scene = this.viewer.scene;
    if (active) {
      // a single level of composite: Cesium's texture cache hands the stage after a nested series
      // of stages the output of that series instead of the scene
      const blur = PostProcessStageLibrary.createBlurStage();
      this.stage_ = new PostProcessStageComposite({
        stages: [
          blur,
          new PostProcessStage({
            fragmentShader: Frame + Noise + Super8Shader,
            uniforms: {
              blurTexture: blur.name,
              time: () => performance.now() / 1000,
              fade: () => this.fade_,
              halation: () => this.halation_,
              grain: () => this.grain_,
              weave: () => this.weave_,
              flicker: () => this.flicker_,
              lightLeaks: () => this.lightLeaks_,
              aspectRatio: () => this.aspectRatio_,
            },
          }),
        ],
        // both read the scene
        inputPreviousStageTexture: false,
        uniforms: blur.uniforms,
      });
      this.stage_.uniforms.sigma = HALATION_SIGMA;
      this.stage_.uniforms.stepSize = HALATION_STEP;
      scene.postProcessStages.add(this.stage_);
      // a new picture only with each film frame, not with each frame of the display
      this.interval_ = setInterval(() => scene.requestRender(), 1000 / FRAME_RATE);
    } else {
      clearInterval(this.interval_);
      this.interval_ = undefined;
      // removing a stage also destroys it
      scene.postProcessStages.remove(/** @type {PostProcessStageComposite} */ (this.stage_));
      this.stage_ = undefined;
    }
    scene.requestRender();
  }

  /**
   * Faded colors: less saturation, lifted blacks, a warm cast; 0 to 1.
   */
  get fade() {
    return this.fade_;
  }

  set fade(value) {
    this.fade_ = value;
  }

  /**
   * Warm glow bleeding around the highlights, 0 to 1.
   */
  get halation() {
    return this.halation_;
  }

  set halation(value) {
    this.halation_ = value;
  }

  /**
   * Film grain, 0 to 1.
   */
  get grain() {
    return this.grain_;
  }

  set grain(value) {
    this.grain_ = value;
  }

  /**
   * Drift of the picture in the gate, in CSS pixels.
   */
  get weave() {
    return this.weave_;
  }

  set weave(value) {
    this.weave_ = value;
  }

  /**
   * Change of brightness from frame to frame, 0 to 1.
   */
  get flicker() {
    return this.flicker_;
  }

  set flicker(value) {
    this.flicker_ = value;
  }

  /**
   * Warm light leaks along the edge, 0 to 1.
   */
  get lightLeaks() {
    return this.lightLeaks_;
  }

  set lightLeaks(value) {
    this.lightLeaks_ = value;
  }

  /**
   * Width over height of the visible frame, with rounded corners; 0 for the
   * whole canvas.
   */
  get aspectRatio() {
    return this.aspectRatio_;
  }

  set aspectRatio(value) {
    this.aspectRatio_ = value;
  }

  destroy() {
    this.active = false;
  }
}
