import {Math as CesiumMath, PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import {heightUniforms} from './height.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Height from './shaders/Height.js';
import Normal from './shaders/Normal.js';
import SnowLineShader from './shaders/SnowLine.js';

/**
 * Snow above an altitude, on the slopes gentle enough to hold it, shaded by
 * the sun.
 */
export default class SnowLine {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{altitude?: number, transition?: number, maxSlope?: number, coverage?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.altitude_ = options.altitude ?? 2000;
    this.transition_ = options.transition ?? 200;
    this.maxSlope_ = options.maxSlope ?? 40;
    this.coverage_ = options.coverage ?? 1;
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
        fragmentShader: EyeFromDepth + Height + Normal + SnowLineShader,
        uniforms: {
          ...heightUniforms(scene),
          altitude: () => this.altitude_,
          transition: () => this.transition_,
          maxSlope: () => CesiumMath.toRadians(this.maxSlope_),
          coverage: () => this.coverage_,
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
   * Altitude of the snow line, in meters above the ellipsoid.
   */
  get altitude() {
    return this.altitude_;
  }

  set altitude(value) {
    this.altitude_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Height of the band around the altitude over which the snow thins out, in meters.
   */
  get transition() {
    return this.transition_;
  }

  set transition(value) {
    this.transition_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Steepest slope that holds snow, in degrees.
   */
  get maxSlope() {
    return this.maxSlope_;
  }

  set maxSlope(value) {
    this.maxSlope_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Opacity of the snow, 0 to 1.
   */
  get coverage() {
    return this.coverage_;
  }

  set coverage(value) {
    this.coverage_ = value;
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.active = false;
  }
}
