import {PostProcessStage} from '@cesium/engine';
import Frame from './shaders/Frame.js';
import TechnicolorShader from './shaders/Technicolor.js';

/**
 * Three-strip Technicolor: dense, saturated primaries, as the films of the
 * 1930s to 1950s.
 */
export default class Technicolor {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{strength?: number, aspectRatio?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.strength_ = options.strength ?? 1;
    this.aspectRatio_ = options.aspectRatio ?? 0;
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
        fragmentShader: Frame + TechnicolorShader,
        uniforms: {
          strength: () => this.strength_,
          aspectRatio: () => this.aspectRatio_,
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

  /**
   * Width over height of the visible frame, black bars around it; 0 for the
   * whole canvas. 1.37 is the Academy ratio of the era.
   */
  get aspectRatio() {
    return this.aspectRatio_;
  }

  set aspectRatio(value) {
    this.aspectRatio_ = value;
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.active = false;
  }
}
