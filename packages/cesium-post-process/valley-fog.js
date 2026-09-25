import {Color, PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import {heightUniforms} from './height.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Height from './shaders/Height.js';
import ValleyFogShader from './shaders/ValleyFog.js';

/**
 * Fog filling the valleys below an altitude: from above, a sea of fog with the
 * peaks standing out; from inside, the visibility drops with the distance.
 */
export default class ValleyFog {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{top?: number, density?: number, softness?: number, color?: Color}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.top_ = options.top ?? 1500;
    this.density_ = options.density ?? 0.005;
    this.softness_ = options.softness ?? 100;
    this.color_ = options.color ?? new Color(0.85, 0.88, 0.92, 1);
    /** @type {PostProcessStage | undefined} */
    this.stage_ = undefined;
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
      acquireTerrainDepth(scene);
      this.stage_ = new PostProcessStage({
        fragmentShader: EyeFromDepth + Height + ValleyFogShader,
        uniforms: {
          ...heightUniforms(scene),
          top: () => this.top_,
          density: () => this.density_,
          softness: () => this.softness_,
          color: () => this.color_,
        },
      });
      scene.postProcessStages.add(this.stage_);
    } else {
      // removing a stage also destroys it
      scene.postProcessStages.remove(/** @type {PostProcessStage} */ (this.stage_));
      this.stage_ = undefined;
      releaseTerrainDepth(scene);
    }
    scene.requestRender();
  }

  /**
   * Altitude of the top of the fog, in meters above the ellipsoid.
   */
  get top() {
    return this.top_;
  }

  set top(value) {
    this.top_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Density of the fog, per meter: about 1 / visibility.
   */
  get density() {
    return this.density_;
  }

  set density(value) {
    this.density_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Height of the band under the top over which the fog thins out, in meters.
   */
  get softness() {
    return this.softness_;
  }

  set softness(value) {
    this.softness_ = value;
    this.viewer.scene.requestRender();
  }

  get color() {
    return this.color_;
  }

  set color(value) {
    this.color_ = value;
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.active = false;
  }
}
