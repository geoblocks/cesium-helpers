import {Cartesian3, Cartesian4, Color, Math as CesiumMath} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import {heightUniforms} from './height.js';
import {LocalFrame} from './local-frame.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Hash from './shaders/Hash.js';
import Height from './shaders/Height.js';
import Normal from './shaders/Normal.js';
import OpenSkyShader from './shaders/OpenSky.js';
import {openSkyUniforms} from './open-sky.js';
import RainRingsShader from './shaders/RainRings.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */
/** @import OpenSky from './open-sky.js' */

// the rings grow and fade over a fraction of a second: a render for each frame of a video
const FRAME_RATE = 30;
// the shader's time wraps at an hour, a whole number of the rings' periods
const TIME_PERIOD = 3600;
// the water's level when there is no water: far above everything
const NO_WATER = 1e9;

/**
 * Rings where the rain lands: on the ground, the roofs and the water, in each cell of a local frame a drop landing, a thin ring growing from it
 * and fading, wider and slower on water. For a view of a place from far enough that the drops themselves are too small to see; or under
 * `Precipitation`, the drops falling and these where they land. Found from the depth, with the surface's slope from the normal rebuilt from the
 * neighboring pixels: nothing lies in the air.
 */
export default class RainRings extends Effect {
  #intensity;
  #cell;
  #reach;
  #waterLevel;
  #maxSlope;
  #rate;
  #color;
  #frame;
  #clock;
  #colorScratch = new Cartesian4();
  #openSky;

  /**
   * @param {CesiumWidget} viewer
   * @param {{intensity?: number, cell?: number, reach?: number, waterLevel?: number, maxSlope?: number, rate?: number,
   *   color?: Color, origin?: Cartesian3, clock?: () => number, openSky?: OpenSky}} [options] The share of the cells that have a drop, 0 to 1; the cell's size
   *   and the ring's growth on the ground, in meters (the ring on water is clipped at 0.3 cell); the water's height above the ellipsoid, in
   *   meters, or undefined for none; the steepest slope that takes a ring, in degrees; rings a second in a cell; the ring's color, its alpha how
   *   strongly it shows; the point of the world the cells are laid about; the time the rings run by, in seconds (the wall clock's by default;
   *   one that stands still keeps them still, for a viewer who asks for less motion); what is open to the sky, the rest taking none (all
   *   of it by default).
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#intensity = options.intensity ?? 0.5;
    this.#cell = options.cell ?? 2;
    this.#reach = options.reach ?? 0.35;
    this.#waterLevel = options.waterLevel;
    this.#maxSlope = options.maxSlope ?? 30;
    this.#rate = options.rate ?? 1.6;
    this.#color = options.color ?? new Color(0.31, 0.39, 0.5, 0.6);
    this.#frame = new LocalFrame(options.origin);
    this.#clock = options.clock ?? (() => performance.now() / 1000);
    this.#openSky = options.openSky;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    const stage = new PostProcessStage({
      fragmentShader: EyeFromDepth + Height + Hash + Normal + OpenSkyShader + RainRingsShader,
      uniforms: {
        ...heightUniforms(scene),
        ...openSkyUniforms(scene, () => this.#openSky),
        localFromEye: () => this.#frame.fromEye(scene),
        intensity: () => this.#intensity,
        cell: () => this.#cell,
        reach: () => this.#reach,
        waterLevel: () => this.#waterLevel ?? NO_WATER,
        maxSlope: () => CesiumMath.toRadians(this.#maxSlope),
        rate: () => this.#rate,
        time: () => this.#clock() % TIME_PERIOD,
        color: () => Cartesian4.fromColor(this.#color, this.#colorScratch),
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
    this.#frame.anchor(scene);
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
  }

  /**
   * The share of the cells that have a drop, 0 (no rings, no frames) to 1.
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
   * The size of a cell, in meters: one drop in each, as often as the intensity says.
   */
  get cell() {
    return this.#cell;
  }

  set cell(value) {
    this.#cell = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How far a ring grows on the ground, in meters: over water, 1.7 times as far, but never past 0.3 cell, or the edge of its cell would clip it.
   */
  get reach() {
    return this.#reach;
  }

  set reach(value) {
    this.#reach = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The water's height above the ellipsoid, in meters, or undefined for none: what lies within a quarter meter of it is water, where the rings
   * are wider and slower.
   */
  get waterLevel() {
    return this.#waterLevel;
  }

  set waterLevel(value) {
    this.#waterLevel = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The steepest slope that takes a ring, in degrees.
   */
  get maxSlope() {
    return this.#maxSlope;
  }

  set maxSlope(value) {
    this.#maxSlope = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Rings a second in a cell.
   */
  get rate() {
    return this.#rate;
  }

  set rate(value) {
    this.#rate = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The ring's color, its alpha how strongly it shows. Slate on a light ground, pale on a dark one.
   */
  get color() {
    return this.#color;
  }

  set color(value) {
    this.#color = value;
    this.viewer.scene.requestRender();
  }

  /**
   * What is open to the sky, or undefined for all of it: the rest takes no rings (a deck under a roof, the ground under a tree, a cloud's top).
   */
  get openSky() {
    return this.#openSky;
  }

  set openSky(value) {
    this.#openSky = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The point of the world the cells are laid about, which the effect keeps where it is as the camera moves; the camera's position when
   * the effect is activated if none is given. Keep it within a few kilometers of what is looked at.
   */
  get origin() {
    return this.#frame.origin;
  }

  set origin(value) {
    this.#frame.origin = value;
    this.viewer.scene.requestRender();
  }
}
