import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';

/** @import {CesiumWidget, PostProcessStage, PostProcessStageComposite, Scene} from '@cesium/engine' */

/**
 * A screen-space effect: a post-process stage on a scene while active.
 * Subclasses create their stage in `createStage_` and take their side effects
 * in `activated_` and `deactivating_`. The terrain's depth and a render rate it needs for as
 * long as it is active are declared by `terrainDepth_` and `frameRate_`, set in the constructor.
 */
export default class Effect {
  /**
   * The stage while active.
   * @protected
   * @type {PostProcessStage | PostProcessStageComposite | undefined}
   */
  stage_ = undefined;
  /**
   * Whether the effect reads the terrain's depth: the scene keeps it for as long as the effect is active.
   * @protected
   */
  terrainDepth_ = false;
  /**
   * The renders a second the effect needs in requestRenderMode while active, 0 for none.
   * @protected
   */
  frameRate_ = 0;

  /**
   * The name of the effect's stage (its outermost composite's), `{name}` if given, else empty (Cesium's own): spread into
   * that stage's options. `scene.postProcessStages.getStageByName` finds it while active; two active effects of one scene
   * need different names.
   * @protected
   * @type {{name?: string}}
   */
  named_;

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.named_ = options.name === undefined ? {} : {name: options.name};
  }

  get active() {
    return this.stage_ !== undefined;
  }

  set active(active) {
    const scene = this.viewer.scene;
    if (active) {
      if (this.stage_) {
        return;
      }
      this.stage_ = this.createStage_(scene);
      scene.postProcessStages.add(this.stage_);
      if (this.terrainDepth_) {
        acquireTerrainDepth(scene);
      }
      if (this.frameRate_ > 0) {
        acquireFrames(scene, this.frameRate_);
      }
      this.activated_(scene);
    } else {
      if (!this.stage_) {
        return;
      }
      this.deactivating_(scene);
      if (this.frameRate_ > 0) {
        releaseFrames(scene, this.frameRate_);
      }
      if (this.terrainDepth_) {
        releaseTerrainDepth(scene);
      }
      // removing a stage also destroys it
      scene.postProcessStages.remove(this.stage_);
      this.stage_ = undefined;
    }
    scene.requestRender();
  }

  /**
   * @param {Scene} _scene
   * @return {PostProcessStage | PostProcessStageComposite}
   * @protected
   */
  createStage_(_scene) {
    throw new Error(`${this.constructor.name} does not implement createStage_`);
  }

  /**
   * Called once the stage is added to the scene.
   * @param {Scene} _scene
   * @protected
   */
  activated_(_scene) {}

  /**
   * Called before the stage is removed from the scene.
   * @param {Scene} _scene
   * @protected
   */
  deactivating_(_scene) {}

  destroy() {
    this.active = false;
  }
}
