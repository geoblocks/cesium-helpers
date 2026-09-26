import {Cartesian3, Cartesian4, Color, Matrix4, PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import {acquireFrames, releaseFrames} from './frame-clock.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import TrailsShader from './shaders/Trails.js';

/**
 * A position of a moving thing and when it was there.
 * @typedef {Object} TrailPoint
 * @property {Cartesian3} position World coordinates.
 * @property {number} time A performance.now() timestamp, in milliseconds.
 */

// as in the shader
const MAX_POINTS = 64;
const FRAME_RATE = 60;

const eyeScratch = new Cartesian3();

/**
 * Trails: a glowing streak along the recent positions of each moving thing,
 * fading with age. While a streak shows the scene renders 60 times per second.
 */
export default class Trails extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{trails: () => TrailPoint[][], fade?: number, width?: number, color?: Color}} options
   */
  constructor(viewer, options) {
    super(viewer);
    this.trails_ = options.trails;
    this.fade_ = options.fade ?? 0.4;
    this.width_ = options.width ?? 0.05;
    this.color_ = options.color ?? new Color(1, 0.35, 0.15, 1);
    this.uniform_ = Array.from({length: MAX_POINTS}, () => new Cartesian4(0, 0, 0, -1));
    // frames are acquired while there is something to draw, for the fade of a trail that stopped
    this.animating_ = false;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  createStage_(scene) {
    return new PostProcessStage({
      fragmentShader: EyeFromDepth + TrailsShader,
      uniforms: {
        trail: () => this.trailUniform_(scene),
        fade: () => this.fade_,
        width: () => this.width_,
        color: () => this.color_,
      },
    });
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    acquireTerrainDepth(scene);
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    this.animate_(scene, false);
    releaseTerrainDepth(scene);
  }

  /**
   * @param {import('@cesium/engine').Scene} scene
   * @param {boolean} animating
   */
  animate_(scene, animating) {
    if (animating === this.animating_) {
      return;
    }
    this.animating_ = animating;
    if (animating) {
      acquireFrames(scene, FRAME_RATE);
    } else {
      releaseFrames(scene, FRAME_RATE);
    }
  }

  /**
   * @param {import('@cesium/engine').Scene} scene
   */
  trailUniform_(scene) {
    const now = performance.now();
    const viewMatrix = scene.camera.viewMatrix;
    const uniform = this.uniform_;
    let count = 0;
    for (const trail of this.trails_()) {
      // room for a segment and the break after it
      if (count > MAX_POINTS - 3) {
        break;
      }
      let written = 0;
      for (const point of trail) {
        const age = (now - point.time) / 1000;
        if (age > this.fade_ || count === MAX_POINTS - 1) {
          continue;
        }
        const eye = Matrix4.multiplyByPoint(viewMatrix, point.position, eyeScratch);
        Cartesian4.fromElements(eye.x, eye.y, eye.z, age, uniform[count++]);
        written++;
      }
      if (written > 0) {
        uniform[count++].w = -1;
      }
    }
    for (let i = count; i < MAX_POINTS; i++) {
      uniform[i].w = -1;
    }
    this.animate_(scene, count > 0);
    return uniform;
  }

  /**
   * The trails to draw, read every frame: one array of points per moving
   * thing, oldest first. Ages come from the points' timestamps.
   */
  get trails() {
    return this.trails_;
  }

  set trails(value) {
    this.trails_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Age at which a point has faded out, in seconds.
   */
  get fade() {
    return this.fade_;
  }

  set fade(value) {
    this.fade_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Half width of a streak, in meters at its depth, at least a few pixels.
   */
  get width() {
    return this.width_;
  }

  set width(value) {
    this.width_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Color of the streaks, added to the picture.
   */
  get color() {
    return this.color_;
  }

  set color(value) {
    this.color_ = value;
    this.viewer.scene.requestRender();
  }
}
