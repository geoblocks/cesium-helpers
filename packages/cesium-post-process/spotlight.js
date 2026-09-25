import {Cartesian4, PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import {eyeFocus} from './focus.js';
import {heightUniforms} from './height.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Noise from './shaders/Noise.js';
import Normal from './shaders/Normal.js';
import SpotlightShader from './shaders/Spotlight.js';

const focusScratch = new Cartesian4();

/**
 * A searchlight above the focus, pointing down: it throws a pool of warm
 * light on the scene, shades the relief under it and lights up the haze in
 * its beam, the rest darkens.
 */
export default class Spotlight {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{focus?: import('./focus.js').Focus, radius?: number, softness?: number, darkness?: number, beam?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.focus_ = options.focus;
    this.radius_ = options.radius ?? 200;
    this.softness_ = options.softness ?? 0.5;
    this.darkness_ = options.darkness ?? 0.8;
    this.beam_ = options.beam ?? 0.25;
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
        fragmentShader: EyeFromDepth + Noise + Normal + SpotlightShader,
        uniforms: {
          focus: () => eyeFocus(scene, this.focus_, focusScratch),
          up: heightUniforms(scene).up,
          radius: () => this.radius_,
          softness: () => this.softness_,
          darkness: () => this.darkness_,
          beam: () => this.beam_,
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
   * What to light: a position, a function returning one, or undefined for
   * what is in the middle of the screen.
   */
  get focus() {
    return this.focus_;
  }

  set focus(value) {
    this.focus_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Radius of the pool of light on flat ground, in meters. The light hangs
   * twice as high above the focus.
   */
  get radius() {
    return this.radius_;
  }

  set radius(value) {
    this.radius_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Width of the penumbra, as a fraction of the radius.
   */
  get softness() {
    return this.softness_;
  }

  set softness(value) {
    this.softness_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Darkening outside the light, 0 to 1.
   */
  get darkness() {
    return this.darkness_;
  }

  set darkness(value) {
    this.darkness_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Brightness of the beam in the air, 0 to 1.
   */
  get beam() {
    return this.beam_;
  }

  set beam(value) {
    this.beam_ = value;
    this.viewer.scene.requestRender();
  }

  destroy() {
    this.active = false;
  }
}
