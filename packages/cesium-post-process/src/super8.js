import {PostProcessStage, PostProcessStageComposite} from '@cesium/engine';
import createBlur from './blur.js';
import Effect from './effect.js';
import Frame from './shaders/Frame.js';
import Noise from './shaders/Noise.js';
import Super8Shader from './shaders/Super8.js';

/** @import {CesiumWidget} from '@cesium/engine' */

// spread of the halation glow, the sigma and step of Cesium's blur stage, at half resolution:
// a glow this wide does not need more
const HALATION_SIGMA = 6;
const HALATION_STEP = 1;
const HALATION_SCALE = 0.5;
// Super 8 runs at 18 frames per second, as in Super8.glsl
const FRAME_RATE = 18;

/**
 * A Super 8 home movie: faded warm colors, halation, grain, gate weave,
 * flicker, light leaks and the rounded corners of the camera gate. The film moves, so while
 * active the scene renders at its 18 frames per second, also in requestRenderMode.
 */
export default class Super8 extends Effect {
  #fade;
  #halation;
  #grain;
  #weave;
  #flicker;
  #lightLeaks;
  #aspectRatio;

  /**
   * @param {CesiumWidget} viewer
   * @param {{fade?: number, halation?: number, grain?: number, weave?: number, flicker?: number, lightLeaks?: number, aspectRatio?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    // a new picture only with each film frame, not with each frame of the display
    this.frameRate_ = FRAME_RATE;
    this.#fade = options.fade ?? 0.5;
    this.#halation = options.halation ?? 0.5;
    this.#grain = options.grain ?? 0.15;
    this.#weave = options.weave ?? 1.5;
    this.#flicker = options.flicker ?? 0.08;
    this.#lightLeaks = options.lightLeaks ?? 0.5;
    this.#aspectRatio = options.aspectRatio ?? 4 / 3;
  }

  /**
   * @override
   * @protected
   */
  createStage_() {
    // a single level of composite: Cesium's texture cache hands the stage after a nested series
    // of stages the output of that series instead of the scene
    const blur = createBlur('czm_super8_halation', HALATION_SCALE);
    const stage = new PostProcessStageComposite({
      stages: [
        blur,
        new PostProcessStage({
          fragmentShader: Frame + Noise + Super8Shader,
          uniforms: {
            blurTexture: blur.name,
            time: () => performance.now() / 1000,
            fade: () => this.#fade,
            halation: () => this.#halation,
            grain: () => this.#grain,
            weave: () => this.#weave,
            flicker: () => this.#flicker,
            lightLeaks: () => this.#lightLeaks,
            aspectRatio: () => this.#aspectRatio,
          },
        }),
      ],
      // both read the scene
      inputPreviousStageTexture: false,
      uniforms: blur.uniforms,
    });
    stage.uniforms.sigma = HALATION_SIGMA;
    stage.uniforms.stepSize = HALATION_STEP;
    return stage;
  }

  /**
   * Faded colors: less saturation, lifted blacks, a warm cast; 0 to 1.
   */
  get fade() {
    return this.#fade;
  }

  set fade(value) {
    this.#fade = value;
  }

  /**
   * Warm glow bleeding around the highlights, 0 to 1.
   */
  get halation() {
    return this.#halation;
  }

  set halation(value) {
    this.#halation = value;
  }

  /**
   * Film grain, 0 to 1.
   */
  get grain() {
    return this.#grain;
  }

  set grain(value) {
    this.#grain = value;
  }

  /**
   * Drift of the picture in the gate, in CSS pixels.
   */
  get weave() {
    return this.#weave;
  }

  set weave(value) {
    this.#weave = value;
  }

  /**
   * Change of brightness from frame to frame, 0 to 1.
   */
  get flicker() {
    return this.#flicker;
  }

  set flicker(value) {
    this.#flicker = value;
  }

  /**
   * Warm light leaks along the edge, 0 to 1.
   */
  get lightLeaks() {
    return this.#lightLeaks;
  }

  set lightLeaks(value) {
    this.#lightLeaks = value;
  }

  /**
   * Width over height of the visible frame, with rounded corners; 0 for the
   * whole canvas.
   */
  get aspectRatio() {
    return this.#aspectRatio;
  }

  set aspectRatio(value) {
    this.#aspectRatio = value;
  }
}
