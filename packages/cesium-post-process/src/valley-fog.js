import {Color} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import {cloudShadowUniforms} from './cloud-cover.js';
import Effect from './effect.js';
import {heightUniforms} from './height.js';
import CloudLight from './shaders/CloudLight.js';
import CloudsShadow from './shaders/CloudsShadow.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Fog from './shaders/Fog.js';
import Height from './shaders/Height.js';
import Phase from './shaders/Phase.js';
import RainHaze from './shaders/RainHaze.js';
import ValleyFogShader from './shaders/ValleyFog.js';
import SkyTable from './sky-table.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */

/**
 * Fog filling the valleys below an altitude: from above, a sea of fog with the
 * peaks standing out; from inside, the visibility drops with the distance. Lit
 * by the sky toward the view and by the sun in a broad glow around it, through
 * the gaps of Clouds' clouds in the same scene.
 */
export default class ValleyFog extends Effect {
  #top;
  #density;
  #softness;
  #color;
  #lighting;
  // the clear sky the fog scatters, drawn at each frame, seen from no higher than its top
  #skyTable = new SkyTable(() => this.#top);
  #onPreRender;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, top?: number, density?: number, softness?: number, color?: Color, lighting?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer, options);
    this.terrainDepth_ = true;
    this.#top = options.top ?? 1500;
    this.#density = options.density ?? 0.005;
    this.#softness = options.softness ?? 100;
    this.#color = options.color ?? new Color(0.85, 0.88, 0.92, 1);
    this.#lighting = options.lighting ?? 1;
    // the sky table, read only while the fog is lit
    this.#onPreRender = () => this.#lighting > 0 && this.#skyTable.draw(this.viewer.scene);
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    return new PostProcessStage({
      ...this.named_,
      fragmentShader: EyeFromDepth + Height + Fog + Phase + CloudLight + RainHaze + CloudsShadow + ValleyFogShader,
      uniforms: {
        ...heightUniforms(scene),
        ...cloudShadowUniforms(scene),
        skyTable: () => this.#skyTable.texture(scene),
        lighting: () => this.#lighting,
        top: () => this.#top,
        density: () => this.#density,
        softness: () => this.#softness,
        color: () => this.#color,
      },
    });
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  activated_(scene) {
    scene.preRender.addEventListener(this.#onPreRender);
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  deactivating_(scene) {
    scene.preRender.removeEventListener(this.#onPreRender);
    this.#skyTable.destroy();
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

  /**
   * How the fog is lit, 0 to 1: at 0, its color, flat; at 1, its color tinted by the sky toward the
   * view, and the sun's light scattered forward, a glow around it.
   */
  get lighting() {
    return this.#lighting;
  }

  set lighting(value) {
    this.#lighting = value;
    this.viewer.scene.requestRender();
  }
}
