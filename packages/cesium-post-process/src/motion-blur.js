import {Matrix4, PixelDatatype, Math as CesiumMath} from '@cesium/core';
import {PostProcessStage, PostProcessStageComposite} from '@cesium/engine';
import Effect from './effect.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Hash from './shaders/Hash.js';
import MotionBlurShader from './shaders/MotionBlur.js';
import MotionBlurVelocity from './shaders/MotionBlurVelocity.js';

/** @import {CesiumWidget, Scene} from '@cesium/engine' */

/**
 * Camera motion blur: each pixel is blurred along its motion on the screen
 * since the previous frame, over the exposure time.
 */
export default class MotionBlur extends Effect {
  #strength;
  #exposure;
  #previousViewProjection = new Matrix4();
  #reprojection = new Matrix4();
  #previousTime = 0;
  #onPostRender;

  /**
   * @param {CesiumWidget} viewer
   * @param {{strength?: number, exposure?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#strength = options.strength ?? 1;
    this.#exposure = options.exposure ?? 1 / 24;
    this.#onPostRender = () => {
      const camera = this.viewer.scene.camera;
      Matrix4.multiply(camera.frustum.projectionMatrix, camera.viewMatrix, this.#previousViewProjection);
      this.#previousTime = performance.now();
    };
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    // the velocity of each pixel is computed once, at half resolution, rather than once per
    // sample of the gather; the distances need the range of floats
    const velocity = new PostProcessStage({
      name: 'czm_motion_blur_velocity',
      fragmentShader: EyeFromDepth + MotionBlurVelocity,
      uniforms: {
        reprojection: () =>
          Matrix4.multiply(this.#previousViewProjection, scene.camera.inverseViewMatrix, this.#reprojection),
        // the blur spans the motion during the exposure, whatever the frame rate; after a pause
        // in requestRenderMode, the time since the previous frame is not the time of the motion
        exposureScale: () =>
          (this.#strength * this.#exposure) /
          CesiumMath.clamp((performance.now() - this.#previousTime) / 1000, 1 / 240, 1 / 10),
      },
      textureScale: 0.5,
      pixelDatatype: PixelDatatype.FLOAT,
    });
    const stage = new PostProcessStageComposite({
      stages: [
        velocity,
        new PostProcessStage({
          fragmentShader: Hash + MotionBlurShader,
          uniforms: {velocityTexture: velocity.name},
        }),
      ],
      // the gather reads the scene, not the velocities
      inputPreviousStageTexture: false,
    });
    // no pass at all without strength
    stage.enabled = this.#strength > 0;
    return stage;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  activated_(scene) {
    this.#onPostRender();
    scene.postRender.addEventListener(this.#onPostRender);
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  deactivating_(scene) {
    scene.postRender.removeEventListener(this.#onPostRender);
  }

  /**
   * Strength of the blur, 0 to 1: a fraction of the exposure.
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

  /**
   * Exposure time, in seconds: 1/48 is the 180 degree shutter of film at 24
   * frames per second, longer blurs more.
   */
  get exposure() {
    return this.#exposure;
  }

  set exposure(value) {
    this.#exposure = value;
    this.viewer.scene.requestRender();
  }
}
