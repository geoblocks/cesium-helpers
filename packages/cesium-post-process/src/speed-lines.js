import {Cartesian4} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {eyeFocus} from './focus.js';
import Hash from './shaders/Hash.js';
import SpeedLinesShader from './shaders/SpeedLines.js';

/** @import {Focus} from './focus.js' */
/** @import {CesiumWidget, Scene} from '@cesium/engine' */

const focusScratch = new Cartesian4();

/**
 * Speed lines: a zoom blur toward the focus and streaks radiating from it.
 * The streaks change with each frame the scene renders, and do not render it
 * by themselves.
 */
export default class SpeedLines extends Effect {
  #focus;
  #strength;

  /**
   * @param {CesiumWidget} viewer
   * @param {{focus?: Focus, strength?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.#focus = options.focus;
    this.#strength = options.strength ?? 1;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    const stage = new PostProcessStage({
      fragmentShader: Hash + SpeedLinesShader,
      uniforms: {
        focus: () => eyeFocus(scene, this.#focus, focusScratch),
        strength: () => this.#strength,
        time: () => performance.now() / 1000,
      },
    });
    // no pass at all without strength
    stage.enabled = this.#strength > 0;
    return stage;
  }

  /**
   * What the lines converge on: a position, a function returning one, or
   * undefined for the middle of the screen.
   */
  get focus() {
    return this.#focus;
  }

  set focus(value) {
    this.#focus = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Strength of the blur and the streaks, 0 to 1.
   */
  get strength() {
    return this.#strength;
  }

  set strength(value) {
    this.#strength = value;
    if (this.stage_) {
      this.stage_.enabled = value > 0;
    }
    this.viewer.scene.requestRender();
  }
}
