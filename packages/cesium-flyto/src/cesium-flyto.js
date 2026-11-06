import {
  BoundingSphere,
  Cartesian3,
  FixedFrameTransforms,
  HeadingPitchRange,
  Math as CesiumMath,
  Matrix4,
} from '@cesium/core';
import {
  EasingFunction,
  PostProcessStage,
  PostProcessStageComposite,
  PostProcessStageLibrary,
  ScreenSpaceEventType,
} from '@cesium/engine';
import {EyeFromDepth, MotionBlur} from '@geoblocks/cesium-post-process';
import DepthOfField from './shaders/DepthOfField.js';

/** @import {CesiumWidget, ScreenSpaceEventHandler} from '@cesium/engine' */

const directionScratch = new Cartesian3();
const enuScratch = new Matrix4();

// time for the flight effects to fade in and out, in seconds
const FADE_TIME = 0.5;
// motion blur exposure, in seconds: a 180 degree shutter at 24 frames per second, as in film
const EXPOSURE = 1 / 48;
// blur of the depth of field, the sigma of Cesium's blur stage
const FOCUS_BLUR = 2;
// the flight goes along the line of sight, so the picture zooms: halving the remaining distance
// looks the same at any scale, and each halving takes this long, in seconds
const SECONDS_PER_HALVING = 0.5;
const MIN_DURATION = 1;
const MAX_DURATION = 5;

/**
 * Duration of a flight along the line of sight, from a distance to the target to another.
 * @param {number} from distance at the start of the flight, in meters
 * @param {number} to distance at the end of the flight, in meters
 * @return {number} seconds
 */
export function flightDuration(from, to) {
  const halvings = Math.log2(from / to);
  return CesiumMath.clamp(halvings * SECONDS_PER_HALVING, MIN_DURATION, MAX_DURATION);
}

/**
 * Flies the camera toward the clicked position, along the line of sight, and
 * stops at a given distance from it.
 */
export default class CesiumFlyTo {
  #active = false;
  /**
   * @type {ReturnType<ScreenSpaceEventHandler['getInputAction']> | undefined}
   */
  #previousAction = undefined;
  #onInputAction;
  /** @type {MotionBlur | undefined} */
  #motionBlur = undefined;
  /** @type {PostProcessStageComposite | undefined} */
  #depthOfField = undefined;
  // the depth of field focuses on the target of the flight
  #target = new Cartesian3();
  // the effects fade in during a flight and out after it, then are removed
  #fade = 0;
  #fadeTarget = 0;
  #fadeTime = 0;
  // restored when the effects end
  #msaaSamples = 1;
  // increments with each flight, so only the latest flight ends the blur
  #flight = 0;
  #onPreRender;
  #onPostRender;

  /**
   * @param {CesiumWidget} viewer
   * @param {ScreenSpaceEventType} [eventType=ScreenSpaceEventType.LEFT_DOUBLE_CLICK]
   * @param {number} [range=300] distance (in meters) between the camera and the clicked position at the end of the flight
   * @param {number} [duration] flight duration in seconds; when omitted, half a second per halving of the distance to the target, between 1 and 5 seconds
   * @param {EasingFunction.Callback} [easingFunction=EasingFunction.SINUSOIDAL_IN_OUT]
   */
  constructor(
    viewer,
    eventType = ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    range = 300,
    duration = undefined,
    easingFunction = EasingFunction.SINUSOIDAL_IN_OUT,
  ) {
    this.viewer = viewer;
    this.eventType = eventType;
    this.range = range;
    this.duration = duration;
    this.easingFunction = easingFunction;

    this.#onInputAction = this.onInputAction.bind(this);

    this.#onPreRender = this.onPreRender.bind(this);
    this.#onPostRender = this.onPostRender.bind(this);
  }

  get active() {
    return this.#active;
  }

  set active(active) {
    if (active === this.#active) {
      return;
    }
    this.#active = active;
    const handler = this.viewer.screenSpaceEventHandler;
    if (active) {
      this.#previousAction = handler.getInputAction(this.eventType);
      handler.setInputAction(this.#onInputAction, this.eventType);
    } else if (this.#previousAction) {
      handler.setInputAction(this.#previousAction, this.eventType);
    } else {
      handler.removeInputAction(this.eventType);
    }
  }

  /**
   * @param {ScreenSpaceEventHandler.PositionedEvent} movement
   */
  onInputAction(movement) {
    const scene = this.viewer.scene;
    const camera = scene.camera;
    // pickPosition also hits 3D Tiles and other depth tested primitives
    let target = scene.pickPositionSupported ? scene.pickPosition(movement.position) : undefined;
    if (!target) {
      const ray = camera.getPickRay(movement.position);
      target = ray && scene.globe?.pick(ray, scene);
    }
    if (!target) {
      return;
    }

    // heading and pitch of the line of sight, in the local frame of the target
    const toTarget = Cartesian3.subtract(target, camera.positionWC, directionScratch);
    const distance = Cartesian3.magnitude(toTarget);
    const enu = FixedFrameTransforms.eastNorthUpToFixedFrame(target, scene.ellipsoid, enuScratch);
    const local = Matrix4.multiplyByPointAsVector(Matrix4.inverseTransformation(enu, enu), toTarget, toTarget);
    Cartesian3.normalize(local, local);
    const heading = Math.atan2(local.x, local.y);
    const pitch = Math.asin(local.z);

    Cartesian3.clone(target, this.#target);
    this.#startEffects();
    const flight = ++this.#flight;
    const end = () => {
      if (flight === this.#flight) {
        this.#fadeTarget = 0;
        // requestRenderMode: keep rendering while the effects fade out
        this.viewer.scene.requestRender();
      }
    };
    // when already closer than the range, get halfway to the target
    const range = distance > this.range ? this.range : distance / 2;
    camera.flyToBoundingSphere(new BoundingSphere(target, 0), {
      offset: new HeadingPitchRange(heading, pitch, range),
      duration: this.duration ?? flightDuration(distance, range),
      easingFunction: this.easingFunction,
      complete: end,
      cancel: end,
    });
  }

  // motion blur and depth of field, during the flight
  #startEffects() {
    const scene = this.viewer.scene;
    this.#fadeTarget = 1;
    if (this.#motionBlur || !PostProcessStageLibrary.isDepthOfFieldSupported(scene)) {
      return;
    }
    this.#fade = 0;
    this.#fadeTime = performance.now();
    // the post-process stages only get the depth of the terrain when it is depth tested: the
    // motion blur, which lives as long as the depth of field, turns it on for both, and shares
    // it with the other effects of cesium-post-process
    const blur = PostProcessStageLibrary.createBlurStage();
    this.#depthOfField = new PostProcessStageComposite({
      stages: [
        blur,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + DepthOfField,
          uniforms: {
            blurTexture: blur.name,
            focalDistance: () => Cartesian3.distance(scene.camera.positionWC, this.#target),
            fade: () => this.#fade,
          },
        }),
      ],
      // both read the scene
      inputPreviousStageTexture: false,
      uniforms: blur.uniforms,
    });
    this.#depthOfField.uniforms.sigma = FOCUS_BLUR;
    scene.postProcessStages.add(this.#depthOfField);
    this.#motionBlur = new MotionBlur(this.viewer, {exposure: EXPOSURE, strength: this.#fade});
    this.#motionBlur.active = true;
    // multisampling costs a good share of the frame on integrated GPUs, and the blur hides
    // the aliasing anyway
    this.#msaaSamples = scene.msaaSamples;
    scene.msaaSamples = 1;
    scene.preRender.addEventListener(this.#onPreRender);
    scene.postRender.addEventListener(this.#onPostRender);
  }

  #stopEffects() {
    const scene = this.viewer.scene;
    if (!this.#motionBlur) {
      return;
    }
    scene.preRender.removeEventListener(this.#onPreRender);
    scene.postRender.removeEventListener(this.#onPostRender);
    // removing a stage also destroys it
    this.#motionBlur.destroy();
    scene.postProcessStages.remove(/** @type {PostProcessStageComposite} */ (this.#depthOfField));
    this.#motionBlur = undefined;
    this.#depthOfField = undefined;
    scene.msaaSamples = this.#msaaSamples;
    // requestRenderMode: render the last frame without the blur
    scene.requestRender();
  }

  onPreRender() {
    const now = performance.now();
    const step = (now - this.#fadeTime) / 1000 / FADE_TIME;
    this.#fadeTime = now;
    if (this.#fadeTarget > this.#fade) {
      this.#fade = Math.min(this.#fade + step, 1);
    } else if (this.#fadeTarget < this.#fade) {
      this.#fade = Math.max(this.#fade - step, 0);
    }
    if (this.#motionBlur && this.#motionBlur.strength !== this.#fade) {
      this.#motionBlur.strength = this.#fade;
    }
    if (this.#fade !== this.#fadeTarget) {
      this.viewer.scene.requestRender();
    }
  }

  onPostRender() {
    // faded out: remove the effects after the frame, not while it renders
    if (this.#motionBlur && this.#fadeTarget === 0 && this.#fade === 0) {
      this.#stopEffects();
    }
  }
}
