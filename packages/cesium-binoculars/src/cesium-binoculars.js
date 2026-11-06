import {
  Cartesian2,
  Cartesian3,
  Math as CesiumMath,
} from "@cesium/core";
import {
  CameraEventType,
  PostProcessStage,
  PostProcessStageComposite,
  PostProcessStageLibrary,
  ScreenSpaceEventType,
} from "@cesium/engine";
import {acquireTerrainDepth, releaseTerrainDepth} from "@geoblocks/cesium-post-process";
import EyeFromDepth from "./shaders/EyeFromDepth.js";
import Lens from "./shaders/Lens.js";

/** @import {PerspectiveFrustum} from "@cesium/core" */
/** @import {CesiumWidget, ScreenSpaceCameraController, ScreenSpaceEventHandler} from "@cesium/engine" */

// blur of the depth of field and of the rim, the sigma of Cesium's blur stage
const LENS_BLUR = 3;

const middleScratch = new Cartesian2();

export default class CesiumBinoculars {
  #zoomFactor;
  /** @type {number | undefined} */
  #originalFov = undefined;
  #active = false;
  /**
   * @type {Pick<ScreenSpaceCameraController, 'enableZoom' | 'enableRotate' | 'enableTilt' | 'lookEventTypes'> | undefined}
   */
  #previousController = undefined;
  /**
   * @type {ReturnType<ScreenSpaceEventHandler['getInputAction']> | undefined}
   */
  #previousAction = undefined;
  /** @type {PostProcessStageComposite | undefined} */
  #lens = undefined;
  #reticle = false;
  #onPreRender;
  #onMouseWheel;

  /**
   * @param {CesiumWidget} viewer
   * @param {number} [zoomFactor] magnification per mouse wheel notch
   * @param {number} [maxMagnification]
   */
  constructor(viewer, zoomFactor = 1.25, maxMagnification = 20) {
    this.viewer = viewer;
    this.#zoomFactor = zoomFactor;
    this.maxMagnification = maxMagnification;

    this.#onPreRender = this.onPreRender.bind(this);
    this.#onMouseWheel = this.onMouseWheel.bind(this);
  }

  get active() {
    return this.#active;
  }

  set active(active) {
    if (active === this.#active) {
      return;
    }
    this.#active = active;
    const controller = this.viewer.scene.screenSpaceCameraController;
    const handler = this.viewer.screenSpaceEventHandler;
    if (active) {
      this.#originalFov = this.#frustum.fov;
      const {enableZoom, enableRotate, enableTilt, lookEventTypes} = controller;
      this.#previousController = {enableZoom, enableRotate, enableTilt, lookEventTypes};
      // stand still: a drag turns the camera in place instead of moving it around the globe
      controller.enableZoom = false;
      controller.enableRotate = false;
      controller.enableTilt = false;
      controller.lookEventTypes = CameraEventType.LEFT_DRAG;
      this.#previousAction = handler.getInputAction(ScreenSpaceEventType.WHEEL);
      handler.setInputAction(this.#onMouseWheel, ScreenSpaceEventType.WHEEL);
      this.#addLens();
      this.viewer.scene.preRender.addEventListener(this.#onPreRender);
    } else {
      this.viewer.scene.preRender.removeEventListener(this.#onPreRender);
      this.#removeLens();
      this.#frustum.fov = this.#originalFov;
      Object.assign(controller, this.#previousController);
      if (this.#previousAction) {
        handler.setInputAction(this.#previousAction, ScreenSpaceEventType.WHEEL);
      } else {
        handler.removeInputAction(ScreenSpaceEventType.WHEEL);
      }
    }
    // requestRenderMode: adding or removing the lens stage does not request a render
    this.viewer.scene.requestRender();
  }

  #addLens() {
    const scene = this.viewer.scene;
    // the post-process stages only get the depth of the terrain when it is depth tested
    acquireTerrainDepth(scene);
    const blur = PostProcessStageLibrary.createBlurStage();
    this.#lens = new PostProcessStageComposite({
      stages: [
        blur,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + Lens,
          uniforms: {
            blurTexture: blur.name,
            magnification: () => this.magnification,
            reticle: () => (this.#reticle ? 1 : 0),
            pixelsPerMil: () => (scene.drawingBufferHeight / 2 / Math.tan(/** @type {number} */ (this.#frustum.fovy) / 2)) * 0.001,
          },
        }),
      ],
      // both read the scene
      inputPreviousStageTexture: false,
      uniforms: blur.uniforms,
    });
    this.#lens.uniforms.sigma = LENS_BLUR;
    scene.postProcessStages.add(this.#lens);
  }

  #removeLens() {
    const scene = this.viewer.scene;
    // removing a stage also destroys it
    scene.postProcessStages.remove(/** @type {PostProcessStageComposite} */ (this.#lens));
    this.#lens = undefined;
    releaseTerrainDepth(scene);
  }

  /**
   * Whether to draw a rangefinder reticle: a mil scale (milliradians) that
   * grows with the magnification, so an object's size is its distance times
   * the mils it covers, divided by 1000.
   */
  get reticle() {
    return this.#reticle;
  }

  set reticle(value) {
    this.#reticle = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Distance in meters from the camera to what is in the middle of the view,
   * terrain or 3D Tiles; undefined for the sky, when inactive or when picking
   * positions is not supported. Picked when read.
   */
  get distance() {
    const scene = this.viewer.scene;
    if (!this.#active || !scene.pickPositionSupported) {
      return undefined;
    }
    const canvas = scene.canvas;
    const middle = Cartesian2.fromElements(canvas.clientWidth / 2, canvas.clientHeight / 2, middleScratch);
    const position = scene.pickPosition(middle);
    return position && Cartesian3.distance(scene.camera.positionWC, position);
  }

  get #frustum() {
    return /** @type {PerspectiveFrustum} */ (this.viewer.scene.camera.frustum);
  }

  /**
   * Magnification relative to the field of view when the binoculars were activated, 1 when inactive.
   * The magnification is proportional to 1 / tan(fov / 2).
   */
  get magnification() {
    if (!this.#active) {
      return 1;
    }
    return Math.tan(/** @type {number} */ (this.#originalFov) / 2) / Math.tan(/** @type {number} */ (this.#frustum.fov) / 2);
  }

  /**
   * Only applies while active; clamped between 1 and maxMagnification.
   */
  set magnification(magnification) {
    if (!this.#active) {
      return;
    }
    const clamped = CesiumMath.clamp(magnification, 1, this.maxMagnification);
    this.#frustum.fov = 2 * Math.atan(Math.tan(/** @type {number} */ (this.#originalFov) / 2) / clamped);
  }

  /**
   * In 3D, Cesium's look turns the camera around its own axes, which rolls the view: keep the horizon level.
   */
  onPreRender() {
    const camera = this.viewer.scene.camera;
    if (Math.abs(CesiumMath.negativePiToPi(camera.roll)) > CesiumMath.EPSILON6) {
      camera.setView({orientation: {heading: camera.heading, pitch: camera.pitch, roll: 0}});
    }
  }

  /**
   * @param {number} delta 120 per mouse wheel notch, positive to zoom in; trackpads send smaller values
   */
  onMouseWheel(delta) {
    this.magnification *= Math.pow(this.#zoomFactor, delta / 120);
  }
}
