import {Cartesian3, PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import AnalogVideoShader from './shaders/AnalogVideo.js';
import Hash from './shaders/Hash.js';

// PAL video runs at 25 frames per second, as in AnalogVideo.glsl
const FRAME_RATE = 25;
// the strength of the signal fades in and out at this rate, in changes per second
const FADE_RATE = 0.4;
// interference bands: how many, their drift in pictures per second, and how often each may come
// and go, in seconds
const LINES = 3;
const LINE_DRIFT = 0.07;
const LINE_PERIOD = 2.5;

const fract = (/** @type {number} */ x) => x - Math.floor(x);

/**
 * The shader's hash, in [0, 1), so that the values computed here per frame and
 * those computed there per pixel come from one family.
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
export function hash(x, y) {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1031);
  let pz = px;
  const dot = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
  px += dot;
  py += dot;
  pz += dot;
  return fract((px + py) * pz);
}

/**
 * How the signal fares at a time, all the picture over: how weak it is, 0 to 1
 * (it fades in and out); 1 in the rare frames where it breaks up into static;
 * where each interference band is, as a fraction of the picture height from
 * the bottom, negative while it is away.
 * @param {number} seconds
 * @param {number} interference 0 to 1
 * @param {Cartesian3} lineAt result
 * @return {{weak: number, breakup: number}}
 */
export function signalAt(seconds, interference, lineAt) {
  const fade = seconds * FADE_RATE;
  const t = fract(fade);
  const weak = interference * (hash(Math.floor(fade), 5) + (hash(Math.floor(fade) + 1, 5) - hash(Math.floor(fade), 5)) * t * t * (3 - 2 * t));
  const frame = Math.floor(seconds * FRAME_RATE) % 1000;
  const breakup = hash(frame, 11) < 0.015 * interference ? 1 : 0;
  const at = Array.from({length: LINES}, (_, i) => {
    const seed = i * 7;
    const on = hash(Math.floor(seconds / LINE_PERIOD + seed), seed) < interference;
    return on ? 1 - fract(seconds * LINE_DRIFT * (1 + 0.3 * i) + hash(seed, 1)) : -1;
  });
  Cartesian3.fromElements(at[0], at[1], at[2], lineAt);
  return {weak, breakup};
}

/**
 * An analog FPV video feed: washed-out colors, color bleeding sideways, grain,
 * interference bands and sparkles. The picture moves, so while active the
 * scene renders at 25 frames per second, also in requestRenderMode.
 */
export default class AnalogVideo extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{noise?: number, interference?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.noise_ = options.noise ?? 0.5;
    this.interference_ = options.interference ?? 0.15;
    // the uniforms updated once per frame
    this.weak_ = 0;
    this.breakup_ = 0;
    this.lineAt_ = new Cartesian3();
    this.onPreRender_ = () => {
      const signal = signalAt(performance.now() / 1000, this.interference_, this.lineAt_);
      this.weak_ = signal.weak;
      this.breakup_ = signal.breakup;
    };
  }

  /** @override */
  createStage_() {
    return new PostProcessStage({
      fragmentShader: Hash + AnalogVideoShader,
      uniforms: {
        time: () => performance.now() / 1000,
        noise: () => this.noise_,
        interference: () => this.interference_,
        weak: () => this.weak_,
        breakup: () => this.breakup_,
        lineAt: () => this.lineAt_,
      },
    });
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    scene.preRender.addEventListener(this.onPreRender_);
    // a new picture only with each video frame, not with each frame of the display
    acquireFrames(scene, FRAME_RATE);
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    releaseFrames(scene, FRAME_RATE);
    scene.preRender.removeEventListener(this.onPreRender_);
  }

  /**
   * Grain, 0 to 1.
   */
  get noise() {
    return this.noise_;
  }

  set noise(value) {
    this.noise_ = value;
  }

  /**
   * How weak the signal gets as it fades in and out, 0 to 1: interference
   * bands, sparkles, the color lost, and breakups into static.
   */
  get interference() {
    return this.interference_;
  }

  set interference(value) {
    this.interference_ = value;
  }
}
