import {Cartesian3, Color, FixedFrameTransforms, Math as CesiumMath, Matrix3, Matrix4} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {heightUniforms} from './height.js';
import DepthEdges from './shaders/DepthEdges.js';
import DufourShader from './shaders/Dufour.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Hash from './shaders/Hash.js';
import Height from './shaders/Height.js';
import Normal from './shaders/Normal.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */

// how far the camera moves over the ground, in meters, before the hachures' frame follows it: they jump then
const REBASE = 20000;

const originECScratch = new Cartesian3();
const eastScratch = new Cartesian3();
const northScratch = new Cartesian3();
const surfaceScratch = new Cartesian3();
const frameScratch = new Matrix4();
const paperScratch = new Cartesian3();
const inkScratch = new Cartesian3();

/**
 * The look of the Dufour map, the Swiss topographic map of the 1850s: the slopes drawn in hachures, ink strokes down
 * the steepest slope, straight and broken along their length, thicker where it is steeper and on the slopes away from a light from
 * the north-west, the flat ground left blank, black ink on white paper.
 * The strokes are fixed to the ground: they stay put as the camera moves, a power of two of meters apart, the next
 * power faded in as they grow closer than `spacing` pixels.
 */
export default class Dufour extends Effect {
  #spacing;
  #strokeLength;
  #weight;
  #oblique;
  #flatSlope;
  #outline;
  #jump;
  #paper;
  #ink;
  /** @type {Cartesian3 | undefined} */
  #origin = undefined;
  // east, north and up at the origin
  #frame = new Matrix3();

  /**
   * @param {CesiumWidget} viewer
   * @param {{name?: string, spacing?: number, strokeLength?: number, weight?: number, oblique?: number, flatSlope?: number, outline?: number, jump?: number, paper?: Color, ink?: Color}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer, options);
    this.terrainDepth_ = true;
    this.#spacing = options.spacing ?? 3.5;
    this.#strokeLength = options.strokeLength ?? 14;
    this.#weight = options.weight ?? 1;
    this.#oblique = options.oblique ?? 0.8;
    this.#flatSlope = options.flatSlope ?? 4;
    this.#outline = options.outline ?? 0.8;
    this.#jump = options.jump ?? 20;
    this.#paper = options.paper ?? Color.fromCssColorString('#f7f3ea');
    this.#ink = options.ink ?? Color.fromCssColorString('#1d1b19');
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    const toEye = (/** @type {number} */ column, /** @type {Cartesian3} */ result) => {
      this.#follow(scene);
      Matrix3.getColumn(this.#frame, column, result);
      return Matrix4.multiplyByPointAsVector(scene.camera.viewMatrix, result, result);
    };
    return new PostProcessStage({
      ...this.named_,
      fragmentShader: EyeFromDepth + DepthEdges + Height + Normal + Hash + DufourShader,
      uniforms: {
        ...heightUniforms(scene),
        spacing: () => this.#spacing,
        strokeLength: () => this.#strokeLength,
        weight: () => this.#weight,
        oblique: () => this.#oblique,
        flatSlope: () => CesiumMath.toRadians(this.#flatSlope),
        outline: () => this.#outline,
        jump: () => this.#jump,
        paper: () => Cartesian3.fromElements(this.#paper.red, this.#paper.green, this.#paper.blue, paperScratch),
        ink: () => Cartesian3.fromElements(this.#ink.red, this.#ink.green, this.#ink.blue, inkScratch),
        originEC: () => {
          this.#follow(scene);
          return Matrix4.multiplyByPoint(scene.camera.viewMatrix, /** @type {Cartesian3} */ (this.#origin), originECScratch);
        },
        eastEC: () => toEye(0, eastScratch),
        northEC: () => toEye(1, northScratch),
      },
    });
  }

  /**
   * Moves the hachures' frame under the camera once it is REBASE meters away over the ground.
   * @param {Scene} scene
   */
  #follow(scene) {
    const surface = scene.ellipsoid.scaleToGeodeticSurface(scene.camera.positionWC, surfaceScratch);
    if (!surface || (this.#origin && Cartesian3.distance(surface, this.#origin) < REBASE)) {
      return;
    }
    this.#origin = Cartesian3.clone(surface, this.#origin);
    Matrix4.getMatrix3(FixedFrameTransforms.eastNorthUpToFixedFrame(this.#origin, scene.ellipsoid, frameScratch), this.#frame);
  }

  /**
   * The strokes' spacing on the screen, in pixels: the closest they get before the next power of two of meters
   * takes over.
   */
  get spacing() {
    return this.#spacing;
  }

  set spacing(value) {
    this.#spacing = value;
    this.viewer.scene.requestRender();
  }

  /**
   * A stroke's length between its breaks, in spacings, on average.
   */
  get strokeLength() {
    return this.#strokeLength;
  }

  set strokeLength(value) {
    this.#strokeLength = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The ink's weight: 1 for Lehmann's scale stretched for the Alps, the share of the spacing a stroke covers growing
   * with the slope, all of it at 60 degrees, before the light.
   */
  get weight() {
    return this.#weight;
  }

  set weight(value) {
    this.#weight = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How much thinner the strokes on the slopes facing the north-west light, and thicker away from it, 0 to 1.
   */
  get oblique() {
    return this.#oblique;
  }

  set oblique(value) {
    this.#oblique = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The slope under which the ground is left blank, in degrees.
   */
  get flatSlope() {
    return this.#flatSlope;
  }

  set flatSlope(value) {
    this.#flatSlope = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How dark the outline along the silhouettes, 0 for none.
   */
  get outline() {
    return this.#outline;
  }

  set outline(value) {
    this.#outline = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How far the depth jumps, in pixels' sizes, to be a silhouette, outlined: 20 by default.
   */
  get jump() {
    return this.#jump;
  }

  set jump(value) {
    this.#jump = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The paper's color, and the sky's.
   */
  get paper() {
    return this.#paper;
  }

  set paper(value) {
    this.#paper = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The ink's color.
   */
  get ink() {
    return this.#ink;
  }

  set ink(value) {
    this.#ink = value;
    this.viewer.scene.requestRender();
  }
}
