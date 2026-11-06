import {Color} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {heightUniforms} from './height.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Fog from './shaders/Fog.js';
import Height from './shaders/Height.js';
import ValleyFogShader from './shaders/ValleyFog.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */

/**
 * Fog filling the valleys below an altitude: from above, a sea of fog with the
 * peaks standing out; from inside, the visibility drops with the distance.
 */
export default class ValleyFog extends Effect {
  #top;
  #density;
  #softness;
  #color;

  /**
   * @param {CesiumWidget} viewer
   * @param {{top?: number, density?: number, softness?: number, color?: Color}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#top = options.top ?? 1500;
    this.#density = options.density ?? 0.005;
    this.#softness = options.softness ?? 100;
    this.#color = options.color ?? new Color(0.85, 0.88, 0.92, 1);
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    return new PostProcessStage({
      fragmentShader: EyeFromDepth + Height + Fog + ValleyFogShader,
      uniforms: {
        ...heightUniforms(scene),
        top: () => this.#top,
        density: () => this.#density,
        softness: () => this.#softness,
        color: () => this.#color,
      },
    });
  }

  /**
   * Altitude of the top of the fog, in meters above the ellipsoid.
   */
  get top() {
    return this.#top;
  }

  set top(value) {
    this.#top = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Density of the fog, per meter: about 1 / visibility.
   */
  get density() {
    return this.#density;
  }

  set density(value) {
    this.#density = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Height of the band under the top over which the fog thins out, in meters.
   */
  get softness() {
    return this.#softness;
  }

  set softness(value) {
    this.#softness = value;
    this.viewer.scene.requestRender();
  }

  get color() {
    return this.#color;
  }

  set color(value) {
    this.#color = value;
    this.viewer.scene.requestRender();
  }
}
