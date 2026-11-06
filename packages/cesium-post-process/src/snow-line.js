import {Cartesian3, Math as CesiumMath, Matrix4} from '@cesium/core';
import {PostProcessStage} from '@cesium/engine';
import Effect from './effect.js';
import {heightUniforms} from './height.js';
import {LocalFrame} from './local-frame.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Height from './shaders/Height.js';
import Normal from './shaders/Normal.js';
import OpenSkyShader from './shaders/OpenSky.js';
import {openSkyUniforms} from './open-sky.js';
import SnowLineShader from './shaders/SnowLine.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */
/** @import OpenSky from './open-sky.js' */

// the water's level when there is no water: far above everything
const NO_WATER = 1e9;

const sunScratch = new Cartesian3();

/**
 * Snow above an altitude, on the slopes gentle enough to hold it, shaded by
 * the sun.
 */
export default class SnowLine extends Effect {
  #altitude;
  #transition;
  #maxSlope;
  #coverage;
  #patchiness;
  #waterLevel;
  #sunDirection;
  #grain;
  #sceneLight;
  #steepCover;
  #frame;
  #openSky;

  /**
   * @param {CesiumWidget} viewer
   * @param {{altitude?: number, transition?: number, maxSlope?: number, coverage?: number, patchiness?: number, waterLevel?: number,
   *   sunDirection?: Cartesian3, grain?: number, sceneLight?: number, steepCover?: number, origin?: Cartesian3,
   *   openSky?: OpenSky}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#altitude = options.altitude ?? 2000;
    this.#transition = options.transition ?? 200;
    this.#maxSlope = options.maxSlope ?? 50;
    this.#coverage = options.coverage ?? 1;
    this.#patchiness = options.patchiness ?? 0;
    this.#waterLevel = options.waterLevel;
    this.#sunDirection = options.sunDirection && Cartesian3.normalize(options.sunDirection, new Cartesian3());
    this.#grain = options.grain ?? 90;
    this.#sceneLight = options.sceneLight ?? 0;
    this.#steepCover = options.steepCover ?? 0.35;
    this.#frame = new LocalFrame(options.origin);
    this.#openSky = options.openSky;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    const stage = new PostProcessStage({
      fragmentShader: EyeFromDepth + Height + Normal + OpenSkyShader + SnowLineShader,
      uniforms: {
        ...heightUniforms(scene),
        ...openSkyUniforms(scene, () => this.#openSky),
        altitude: () => this.#altitude,
        transition: () => this.#transition,
        maxSlope: () => CesiumMath.toRadians(this.#maxSlope),
        coverage: () => this.#coverage,
        patchiness: () => this.#patchiness,
        waterLevel: () => this.#waterLevel ?? NO_WATER,
        sunEC: () => this.#sunDirection ? Matrix4.multiplyByPointAsVector(scene.camera.viewMatrix, this.#sunDirection, sunScratch) : sunScratch,
        ownSun: () => this.#sunDirection ? 1 : 0,
        grain: () => this.#grain,
        sceneLight: () => this.#sceneLight,
        steepCover: () => this.#steepCover,
        localFromEye: () => this.#frame.fromEye(scene),
      },
    });
    // with no coverage the pass would only copy: off
    stage.enabled = this.#coverage > 0;
    return stage;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  activated_(scene) {
    this.#frame.anchor(scene);
  }

  /**
   * Altitude of the snow line, in meters above the ellipsoid.
   */
  get altitude() {
    return this.#altitude;
  }

  set altitude(value) {
    this.#altitude = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Height of the band around the altitude over which the snow thins out, in meters.
   */
  get transition() {
    return this.#transition;
  }

  set transition(value) {
    this.#transition = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Steepest slope that holds snow, in degrees.
   */
  get maxSlope() {
    return this.#maxSlope;
  }

  set maxSlope(value) {
    this.#maxSlope = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Opacity of the snow, 0 (none: the stage is off) to 1.
   */
  get coverage() {
    return this.#coverage;
  }

  set coverage(value) {
    this.#coverage = value;
    if (this.stage_) {
      this.stage_.enabled = value > 0;
    }
    this.viewer.scene.requestRender();
  }

  /**
   * How far the coverage thins the snow into patches, 0 to 1: at 0 the coverage is the snow's opacity, at 1 the share of the ground it
   * covers, the noise leaving the rest bare.
   */
  get patchiness() {
    return this.#patchiness;
  }

  set patchiness(value) {
    this.#patchiness = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The water's height above the ellipsoid, in meters, or undefined for none: what lies within a quarter meter of it holds no snow,
   * so that a flat lake stays water.
   */
  get waterLevel() {
    return this.#waterLevel;
  }

  set waterLevel(value) {
    this.#waterLevel = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The direction toward the sun that the snow is shaded by, in world coordinates, or undefined for Cesium's own sun. For a scene lit by a
   * light of its own: `scene.light.direction` is the way the light travels, so give its negation.
   */
  get sunDirection() {
    return this.#sunDirection;
  }

  set sunDirection(value) {
    this.#sunDirection = value && Cartesian3.normalize(value, new Cartesian3());
    this.viewer.scene.requestRender();
  }

  /**
   * The noise's largest scale, in meters, its finer ones a third and a ninth of it: the size of the patches and of the snow line's
   * irregularities. A few meters for a garden, tens for a mountainside.
   */
  get grain() {
    return this.#grain;
  }

  set grain(value) {
    this.#grain = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How far the snow's brightness is the scene's own, 0 to 1: at 0 the snow is shaded by the sun alone and stays bright at dusk; at 1 it
   * keeps the scene's shadows and darkens with its light, for a scene lit by a light of its own that goes down at night.
   */
  get sceneLight() {
    return this.#sceneLight;
  }

  set sceneLight(value) {
    this.#sceneLight = value;
    this.viewer.scene.requestRender();
  }

  /**
   * What is open to the sky, or undefined for all of it: the rest holds no snow (a deck under a roof, the ground under a tree, a cloud's top).
   */
  get openSky() {
    return this.#openSky;
  }

  set openSky(value) {
    this.#openSky = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The thin cover the steep slopes keep at the limit, as a fraction of the coverage, 0 to 1: the rock showing through on a mountain; 0
   * for none on the walls of a building.
   */
  get steepCover() {
    return this.#steepCover;
  }

  set steepCover(value) {
    this.#steepCover = value;
    this.viewer.scene.requestRender();
  }

  /**
   * The point of the world the noise is laid about, which keeps the snow's patches where they are as the camera moves; the camera's
   * position when the effect is activated if none is given. Keep it within a few kilometers of what is looked at for a grain of a few meters.
   */
  get origin() {
    return this.#frame.origin;
  }

  set origin(value) {
    this.#frame.origin = value;
    this.viewer.scene.requestRender();
  }
}
