import {Math as CesiumMath} from '@cesium/core';
import Controls from '@geoblocks/cesium-input';
import HoldZoom from './zoom.js';

/** @import {PerspectiveFrustum} from '@cesium/core' */
/** @import {CesiumWidget} from '@cesium/engine' */
/** @import {Binding} from '@geoblocks/cesium-input' */

// short of 87.4 degrees, where Cesium reads the heading from the up vector and turns the view around
const MAX_PITCH = CesiumMath.toRadians(85);
// in seconds: a frame after a backgrounded tab must not turn far
const MAX_DELTA = 0.1;
// the field of view out of the zoom, which the wheel changes
const MIN_FOV = CesiumMath.toRadians(1);
const MAX_FOV = CesiumMath.toRadians(60);

// the default bindings: the right stick looks around, L2 or the right mouse button zooms in, held; the mouse's
// movement looks around too, under the pointer lock
/** @satisfies {Record<string, Binding>} */
export const LOOK_BINDINGS = {
  look: {type: 'vector', stick: 'right'},
  zoom: {type: 'button', buttons: [6], mouse: [2]},
};

/** @typedef {{look: {x: number, y: number}, zoom: boolean}} LookIntent */

/**
 * @param {number} pitch
 * @return {number} The pitch, short of straight up or down, where the heading flips.
 */
export function clampPitch(pitch) {
  return CesiumMath.clamp(pitch, -MAX_PITCH, MAX_PITCH);
}

export default class FirstPersonCameraMode {

  #viewer;
  #scene;
  #movementFactor;
  #zoomFactor;
  /** @type {number | undefined} */
  #originalFov = undefined;
  #movementX = 0;
  #movementY = 0;
  #zoom = new HoldZoom();
  // the field of view out of the zoom, which the wheel changes
  #baseFov = 0;
  #lastTick = 0;
  // whether the mode entered: Chrome repeats pointerlockchange when the locked element asks again
  #entered = false;
  #onMouseMoveCallback;
  #onWheelCallback;
  // the camera controller's inputs before the mode, given back as they were
  /** @type {boolean | undefined} */
  #inputsBefore = undefined;
  #onTickCallback;
  #onCanvasPointerCallback;
  #onPointerLockChangeCallback;
  #onPointerLockErrorCallback;

  /**
   * @param {CesiumWidget} viewer
   * @param {number} [zoomFactor=CesiumMath.toRadians(5)]
   * @param {number} [movementFactor=0.003]
   */
  constructor(viewer, zoomFactor = CesiumMath.toRadians(5), movementFactor = 0.003) {
    this.#viewer = viewer;
    this.#scene = viewer.scene;

    this.#movementFactor = movementFactor;
    this.#zoomFactor = zoomFactor;

    /**
     * Turn rate of the look at full deflection, the right stick by default, in radians per second.
     * @type {number}
     */
    this.lookRate = CesiumMath.toRadians(120);

    /**
     * Added to the field of view out of the zoom, in radians: wider while sprinting, as in GTA 5.
     * @type {number}
     */
    this.fovOffset = 0;

    /**
     * Where the look's intent comes from, read on each tick: {look: {x, y}, zoom}, look the turn rate from -1
     * to 1, x right and y up, and zoom whether the zoom is held. The first gamepad and the right mouse button
     * by default, with LOOK_BINDINGS; any object with a read() method otherwise, touch controls for
     * instance. The mouse's movement turns the view as well. The mode turns its active on and off with its
     * own: replace it while the mode is not active.
     * @type {{read(): LookIntent, active?: boolean}}
     */
    this.input = new Controls(LOOK_BINDINGS);

    this.#onMouseMoveCallback = this.#onMouseMove.bind(this);
    // the wheel on the canvas itself, as Cesium's handler reads it (its delta the opposite of deltaY), the page kept from
    // scrolling; not on the widget's handler, whose wheel action is the app's
    this.#onWheelCallback = (/** @type {WheelEvent} */ event) => {
      event.preventDefault();
      this.#onMouseWheel(-event.deltaY);
    };
    this.#onTickCallback = this.#onTick.bind(this);
    // Cesium's handler captures the pointer on pointerdown, which throws while the pointer is locked:
    // keep the canvas's pointer events from it, the mouse events still come
    this.#onCanvasPointerCallback = (/** @type {PointerEvent} */ event) => {
      if (event.target === this.#scene.canvas) {
        event.stopPropagation();
      }
    };
    this.#onPointerLockChangeCallback = this.#onPointerLockChange.bind(this);
    this.#onPointerLockErrorCallback = (/** @type {Event} */ event) => console.error(event);

    document.addEventListener('pointerlockchange', this.#onPointerLockChangeCallback);
    document.addEventListener('pointerlockerror', this.#onPointerLockErrorCallback);
  }

  #onPointerLockChange() {
    if (this.active === this.#entered) {
      return;
    }
    if (this.active) {
      this.#enter();
    } else {
      this.#leave();
    }
  }

  #enter() {
    this.#entered = true;
    const controller = this.#scene.screenSpaceCameraController;
    this.#inputsBefore = controller.enableInputs;
    controller.enableInputs = false;
    const frustum = this.#frustum();
    this.#originalFov = frustum.fov;
    this.#baseFov = /** @type {number} */ (frustum.fov);
    this.#zoom.zoom = 0;
    this.#lastTick = performance.now();
    this.input.active = true;
    document.addEventListener('mousemove', this.#onMouseMoveCallback);
    window.addEventListener('pointerdown', this.#onCanvasPointerCallback, true);
    window.addEventListener('pointerup', this.#onCanvasPointerCallback, true);
    this.#viewer.clock.onTick.addEventListener(this.#onTickCallback);
    this.#scene.canvas.addEventListener('wheel', this.#onWheelCallback, {passive: false});
  }

  #leave() {
    this.#entered = false;
    this.#scene.screenSpaceCameraController.enableInputs = this.#inputsBefore ?? true;
    this.#frustum().fov = this.#originalFov;
    this.#zoom.zoom = 0;
    this.input.active = false;
    document.removeEventListener('mousemove', this.#onMouseMoveCallback);
    window.removeEventListener('pointerdown', this.#onCanvasPointerCallback, true);
    window.removeEventListener('pointerup', this.#onCanvasPointerCallback, true);
    this.#viewer.clock.onTick.removeEventListener(this.#onTickCallback);
    this.#scene.canvas.removeEventListener('wheel', this.#onWheelCallback);
  }

  get active() {
    return document.pointerLockElement !== null;
  }

  set active(active) {
    if (active) {
      if (!this.active) {
        // the mouse's raw counts, without the system's acceleration, where the browser has them
        const canvas = this.#scene.canvas;
        // a plain lock only where the option is not supported: without a user activation it would fail too
        canvas.requestPointerLock({unadjustedMovement: true})?.catch(error => {
          if (error.name === 'NotSupportedError') {
            canvas.requestPointerLock()?.catch(() => {});
          }
        });
      }
    } else if (this.active) {
      document.exitPointerLock();
    }
  }

  /**
   * How far the zoom is, 0 out to 1 in.
   * @return {number}
   */
  get zoom() {
    return this.#zoom.zoom;
  }

  /**
   * Field of view zoomed in, in radians.
   * @return {number}
   */
  get zoomFov() {
    return this.#zoom.zoomFov;
  }

  set zoomFov(fov) {
    this.#zoom.zoomFov = fov;
  }

  /**
   * @return {PerspectiveFrustum}
   */
  #frustum() {
    return /** @type {PerspectiveFrustum} */ (this.#scene.camera.frustum);
  }

  /**
   * @return {number} The field of view out of the zoom: the wheel's with the offset, which never closes it.
   */
  #unzoomedFov() {
    return Math.max(this.#baseFov + this.fovOffset, MIN_FOV);
  }

  /**
   * @return {number} How much slower the look turns, by the zoom.
   */
  #lookScale() {
    return this.#zoom.lookScale(this.#unzoomedFov());
  }

  /**
   * @param {number} movement The wheel's delta, Cesium's sign: positive rolled away from the user, the view zoomed in.
   */
  #onMouseWheel(movement) {
    if (this.#zoom.zoom > 0) {
      // the zoom owns the field of view
      return;
    }
    const fov = this.#baseFov + (movement > 0 ? -this.#zoomFactor : this.#zoomFactor);
    this.#baseFov = CesiumMath.clamp(fov, MIN_FOV, MAX_FOV);
  }

  /**
   * @param {MouseEvent} event
   */
  #onMouseMove(event) {
    // Firefox bug: first pointerlock event fires movementX=-2, movementY=0 spuriously
    if (event.movementX !== 0 || event.movementY !== 0) {
      this.#movementX += event.movementX;
      this.#movementY += event.movementY;
      this.#scene.requestRender();
    }
  }

  #onTick() {
    const timestamp = performance.now();
    const dt = Math.min((timestamp - this.#lastTick) / 1000, MAX_DELTA);
    this.#lastTick = timestamp;

    const {look, zoom} = this.input.read();
    this.#zoom.update(zoom, dt);
    const fov = this.#zoom.fov(this.#unzoomedFov());
    const frustum = this.#frustum();
    if (fov !== frustum.fov) {
      frustum.fov = fov;
      this.#scene.requestRender();
    }

    // the mouse since the last tick, and the look's turn rate, slowed down by the zoom; on the tick, before
    // the frame renders, not a frame late after it
    const scale = this.#lookScale();
    const heading = (this.#movementX * this.#movementFactor + look.x * this.lookRate * dt) * scale;
    const pitch = (-this.#movementY * this.#movementFactor + look.y * this.lookRate * dt) * scale;
    this.#movementX = 0;
    this.#movementY = 0;
    if (heading !== 0 || pitch !== 0) {
      const camera = this.#scene.camera;
      camera.setView({
        orientation: {
          heading: camera.heading + heading,
          pitch: clampPitch(camera.pitch + pitch)
        }
      });
      this.#scene.requestRender();
    }
  }

  destroy() {
    // the pointer is released later, after the pointerlockchange listener is gone: leave now
    if (this.#entered) {
      this.#leave();
    }
    if (this.active) {
      document.exitPointerLock();
    }
    document.removeEventListener('pointerlockchange', this.#onPointerLockChangeCallback);
    document.removeEventListener('pointerlockerror', this.#onPointerLockErrorCallback);
  }
}
