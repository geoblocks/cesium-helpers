import {Cartesian3} from '@cesium/engine';

const relativePositionScratch = new Cartesian3();

// Time constant (in seconds) of the transition between two frames' values:
// changing the audio params abruptly produces clicks ("zipper noise").
const SMOOTHING_TIME_CONSTANT = 0.02;

/**
 * Spatializes a sound source located on the globe: on each frame, the Web Audio
 * listener follows the camera and the panner node follows the source.
 */
export default class CesiumAudio {
  /**
   * @param {import('@cesium/engine').Scene} scene
   * @param {Cartesian3} position position of the sound source
   * @param {PannerNode} panner
   */
  constructor(scene, position, panner) {
    this.scene = scene;
    this.position = position;
    this.panner = panner;
    this.active_ = false;
    this.jump_ = false;

    this.update_ = this.update.bind(this);
  }

  get active() {
    return this.active_;
  }

  set active(active) {
    if (active === this.active_) {
      return;
    }
    this.active_ = active;
    if (active) {
      // The listener stays at the origin and the source is positioned relative
      // to the camera: audio params are single precision, too coarse for ECEF
      // coordinates.
      const listener = this.panner.context.listener;
      if (listener.positionX) {
        listener.positionX.value = 0;
        listener.positionY.value = 0;
        listener.positionZ.value = 0;
      } else {
        listener.setPosition(0, 0, 0);
      }
      this.jump_ = true;
      this.scene.postRender.addEventListener(this.update_);
      this.update();
    } else {
      this.scene.postRender.removeEventListener(this.update_);
    }
  }

  update() {
    const camera = this.scene.camera;
    const time = this.panner.context.currentTime;
    /** @type {(param: AudioParam, value: number) => void} */
    const set = this.jump_ ?
      (param, value) => param.setValueAtTime(value, time) :
      (param, value) => param.setTargetAtTime(value, time, SMOOTHING_TIME_CONSTANT);
    this.jump_ = false;

    const relative = Cartesian3.subtract(this.position, camera.positionWC, relativePositionScratch);
    set(this.panner.positionX, relative.x);
    set(this.panner.positionY, relative.y);
    set(this.panner.positionZ, relative.z);

    const listener = this.panner.context.listener;
    const direction = camera.directionWC;
    const up = camera.upWC;
    if (listener.forwardX) {
      set(listener.forwardX, direction.x);
      set(listener.forwardY, direction.y);
      set(listener.forwardZ, direction.z);
      set(listener.upX, up.x);
      set(listener.upY, up.y);
      set(listener.upZ, up.z);
    } else {
      // Firefox does not implement the listener orientation audio params
      listener.setOrientation(direction.x, direction.y, direction.z, up.x, up.y, up.z);
    }
  }
}
