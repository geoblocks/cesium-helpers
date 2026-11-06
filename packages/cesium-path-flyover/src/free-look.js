// packages/cesium-path-flyover/free-look.js
import {Math as CesiumMath} from "@cesium/core";
import {damp} from "./track.js";

const DEGREES_PER_PIXEL = 0.3;
const MIN_PITCH = CesiumMath.toRadians(-85);
const MAX_PITCH = CesiumMath.toRadians(-5);
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const WHEEL_STEP = 1.1;
const DAMP_TAU = 0.15;
const RETURN_SECONDS = 1.5;
const EPSILON = CesiumMath.EPSILON4;

/**
 * @typedef {Object} View
 * @property {number} headingDelta radians, added to the planned heading
 * @property {number} pitchDelta radians, added to the planned pitch
 * @property {number} zoom factor on the planned range, below 1 closer
 */

/**
 * The viewer's offsets on top of the planned camera: pixel drags and wheel
 * notches become damped heading, pitch and zoom deltas, and the view returns to
 * the plan by itself after a pause or on request. Pure: time is passed in.
 */
export default class FreeLook {
  #pitch;
  #recenterDelay;
  /** @type {View} where the input wants the view */
  #raw;
  /** @type {View} where the view is, damped toward #raw */
  #view;
  #dragging = false;
  #lastInput;
  /** @type {number | undefined} */
  #lastUpdate = undefined;
  /** @type {{start: number, from: View} | undefined} */
  #return = undefined;

  /**
   * @param {{pitch: number, recenterDelay: number | false}} options planned pitch in
   *   radians (the delta is clamped so the final pitch stays between -85 and -5 degrees);
   *   seconds of idle before the view returns, false never
   */
  constructor(options) {
    this.#pitch = options.pitch;
    this.#recenterDelay = options.recenterDelay;
    this.#raw = {headingDelta: 0, pitchDelta: 0, zoom: 1};
    this.#view = {headingDelta: 0, pitchDelta: 0, zoom: 1};
    this.#lastInput = -Infinity;
  }

  /** @return {View} */
  get view() {
    return this.#view;
  }

  /** @return {boolean} whether the view differs from the plan or is about to */
  get active() {
    return (
      this.#dragging ||
      this.#return !== undefined ||
      Math.abs(this.#view.headingDelta) > EPSILON ||
      Math.abs(this.#view.pitchDelta) > EPSILON ||
      Math.abs(this.#view.zoom - 1) > EPSILON
    );
  }

  /** @param {number} now seconds */
  dragStart(now) {
    this.#dragging = true;
    this.#input(now);
  }

  /**
   * @param {number} dx pixels, right positive
   * @param {number} dy pixels, down positive: dragging down looks more from above
   * @param {number} now seconds
   */
  drag(dx, dy, now) {
    if (!this.#dragging) {
      return;
    }
    this.#input(now);
    this.#raw.headingDelta += CesiumMath.toRadians(DEGREES_PER_PIXEL * dx);
    this.#raw.pitchDelta = CesiumMath.clamp(
      this.#raw.pitchDelta - CesiumMath.toRadians(DEGREES_PER_PIXEL * dy),
      MIN_PITCH - this.#pitch,
      MAX_PITCH - this.#pitch
    );
  }

  /** @param {number} now seconds */
  dragEnd(now) {
    this.#dragging = false;
    this.#input(now);
  }

  /**
   * @param {number} factor on the range, below 1 closer
   * @param {number} now seconds
   */
  zoomBy(factor, now) {
    this.#input(now);
    this.#raw.zoom = CesiumMath.clamp(this.#raw.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  }

  /**
   * @param {number} delta wheel delta, positive scrolls up and zooms in
   * @param {number} now seconds
   */
  wheel(delta, now) {
    this.zoomBy(delta > 0 ? 1 / WHEEL_STEP : WHEEL_STEP, now);
  }

  /**
   * Starts the return to the plan.
   * @param {number} now seconds
   */
  recenter(now) {
    this.#dragging = false;
    if (this.active) {
      // the short way back: a drag of several turns unwinds less than half a turn
      this.#view.headingDelta = CesiumMath.negativePiToPi(this.#view.headingDelta);
      this.#raw.headingDelta = CesiumMath.negativePiToPi(this.#raw.headingDelta);
      this.#return = {start: now, from: {...this.#view}};
    }
  }

  /**
   * Advances the damping and the return.
   * @param {number} now seconds
   * @return {View}
   */
  update(now) {
    const dt = this.#lastUpdate === undefined ? 0 : now - this.#lastUpdate;
    this.#lastUpdate = now;
    if (!this.#return) {
      this.#view.headingDelta = damp(this.#view.headingDelta, this.#raw.headingDelta, dt, DAMP_TAU);
      this.#view.pitchDelta = damp(this.#view.pitchDelta, this.#raw.pitchDelta, dt, DAMP_TAU);
      this.#view.zoom = damp(this.#view.zoom, this.#raw.zoom, dt, DAMP_TAU);
      if (this.#recenterDelay !== false && !this.#dragging && this.active && now - this.#lastInput >= this.#recenterDelay) {
        // from the deadline, not from the frame that noticed it: a slow frame rate
        // must not delay the return
        this.recenter(this.#lastInput + this.#recenterDelay);
      }
    }
    if (this.#return) {
      const u = CesiumMath.clamp((now - this.#return.start) / RETURN_SECONDS, 0, 1);
      const remaining = 1 - u * u * (3 - 2 * u);
      const from = this.#return.from;
      this.#view.headingDelta = from.headingDelta * remaining;
      this.#view.pitchDelta = from.pitchDelta * remaining;
      this.#view.zoom = 1 + (from.zoom - 1) * remaining;
      if (u >= 1) {
        this.#return = undefined;
        this.#raw = {headingDelta: 0, pitchDelta: 0, zoom: 1};
      }
    }
    return this.#view;
  }

  /**
   * Every input restarts the idle clock; one during a return cancels it and holds
   * the view where it is.
   * @param {number} now seconds
   */
  #input(now) {
    this.#lastInput = now;
    if (this.#return) {
      this.#return = undefined;
      Object.assign(this.#raw, this.#view);
    }
  }
}
