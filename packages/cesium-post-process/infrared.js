import {PostProcessStage} from '@cesium/engine';
import Hsl from './shaders/Hsl.js';
import InfraredShader from './shaders/Infrared.js';

/**
 * Black and white infrared film: bright foliage, dark sky and water.
 */
export default class Infrared {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{strength?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.strength_ = options.strength ?? 1;
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
      this.stage_ = new PostProcessStage({
        fragmentShader: Hsl + InfraredShader,
        uniforms: {
          strength: () => this.strength_,
        },
      });
      scene.postProcessStages.add(this.stage_);
    } else {
      // removing a stage also destroys it
      scene.postProcessStages.remove(/** @type {PostProcessStage} */ (this.stage_));
      this.stage_ = undefined;
    }
    scene.requestRender();
  }

  /**
   * How far from the original colors, 0 to 1.
   */
  get strength() {
    return this.strength_;
  }

  set strength(value) {
    this.strength_ = value;
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.active = false;
  }
}
