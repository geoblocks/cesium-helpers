import {Cartesian3, Cartesian4} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import DepthEdges from './shaders/DepthEdges.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import ToyShader from './shaders/Toy.js';

/** @import {Color} from '@cesium/core' */
/** @import {CesiumWidget, Scene} from '@cesium/engine' */

const NO_SKY = new Cartesian4(0, 0, 0, 0);
const warmScratch = new Cartesian3();
const skyTopScratch = new Cartesian4();
const skyBottomScratch = new Cartesian4();

/**
 * A toy's look, as an isometric game's: the edges lit where the surface bends
 * outward and shaded where it bends inward, rounded close up, the silhouettes
 * outlined in a darker shade of their color, the colors a little richer and
 * warmer, the sky a soft gradient if asked.
 * The edges are found in the depth of the nearest of Cesium's frustums only: with `scene.logarithmicDepthBuffer` off,
 * Cesium splits the view at `farToNearRatio` times the near plane, and what lies past the split has no depth here, so
 * the sky gradient is painted over it; keep the logarithmic depth, or a near plane that keeps the scene in one frustum.
 */
export default class Toy extends Effect {
  #light;
  #shade;
  #bevel;
  #outline;
  #jump;
  #saturation;
  #warm;
  #sky;

  /**
   * @param {CesiumWidget} viewer
   * @param {{light?: number, shade?: number, bevel?: number, outline?: number, jump?: number, saturation?: number, warm?: [number, number, number], sky?: [Color, Color]}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#light = options.light ?? 0.22;
    this.#shade = options.shade ?? 0.18;
    this.#bevel = options.bevel ?? 0;
    this.#outline = options.outline ?? 0.4;
    this.#jump = options.jump ?? 20;
    this.#saturation = options.saturation ?? 1.04;
    this.#warm = options.warm ?? [1.03, 1, 0.95];
    this.#sky = options.sky;
  }

  /**
   * @override
   * @protected
   * @param {Scene} _scene
   */
  createStage_(_scene) {
    return new PostProcessStage({fragmentShader: EyeFromDepth + DepthEdges + this.shader_(), uniforms: this.uniforms_()});
  }

  /**
   * The look's shader, after DepthEdges.
   * @protected
   * @return {string}
   */
  shader_() {
    return ToyShader;
  }

  /**
   * The shader's uniforms.
   * @protected
   * @return {Object<string, () => any>}
   */
  uniforms_() {
    const color = (/** @type {Color} */ c, /** @type {Cartesian4} */ result) => Cartesian4.fromElements(c.red, c.green, c.blue, 1, result);
    return {
      light: () => this.#light,
      shade: () => this.#shade,
      bevel: () => this.#bevel,
      outline: () => this.#outline,
      jump: () => this.#jump,
      saturation: () => this.#saturation,
      warm: () => Cartesian3.fromArray(this.#warm, 0, warmScratch),
      skyTop: () => this.#sky ? color(this.#sky[0], skyTopScratch) : NO_SKY,
      skyBottom: () => this.#sky ? color(this.#sky[1], skyBottomScratch) : NO_SKY,
    };
  }

  /**
   * How much brighter a convex edge gets, 0 for none.
   */
  get light() {
    return this.#light;
  }

  set light(value) {
    this.#light = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How much darker a concave edge gets, 0 for none.
   */
  get shade() {
    return this.#shade;
  }

  set shade(value) {
    this.#shade = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The edges' bevel, in meters: close up, their light and shade fade over that width, as a molded
   * plastic edge's; a pixel at the least, 8 at the most; 0, the default, for a pixel. Next to a small
   * step (a frame proud of a wall), which it cannot tell from a fold, it lights a patch of the face
   * behind.
   */
  get bevel() {
    return this.#bevel;
  }

  set bevel(value) {
    this.#bevel = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How much darker the outline along the silhouettes gets, a pixel wide, a darker shade of their
   * color; 0 for none.
   */
  get outline() {
    return this.#outline;
  }

  set outline(value) {
    this.#outline = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How far the depth jumps, in pixels' sizes, to be a silhouette, outlined, rather than a crease,
   * lit or shaded: 20 by default, for a city's buildings, their eaves lit; lower close up, where a
   * thin thing standing on the ground (a chair's leg) would light its foot.
   */
  get jump() {
    return this.#jump;
  }

  set jump(value) {
    this.#jump = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The colors' saturation, 1 to keep it.
   */
  get saturation() {
    return this.#saturation;
  }

  set saturation(value) {
    this.#saturation = value;
    this.viewer.scene.requestRender();
  }

  /**
   * A factor each of red, green and blue; [1, 1, 1] to keep the colors.
   */
  get warm() {
    return this.#warm;
  }

  set warm(value) {
    this.#warm = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The sky's gradient, its color at the top of the screen and at its bottom;
   * undefined to keep the sky.
   */
  get sky() {
    return this.#sky;
  }

  set sky(value) {
    this.#sky = value;
    this.viewer.scene.requestRender();
  }
}
