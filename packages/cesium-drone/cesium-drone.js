import {Cartesian3, Cartographic, Event, Math as CesiumMath, Matrix4} from '@cesium/core';
import {Transforms} from '@cesium/engine';

// seconds for the velocity, and the body's pitch and roll, to get two thirds of the way to their target
const VELOCITY_TAU = 0.5;
const ATTITUDE_TAU = 0.2;
const MAX_PITCH = CesiumMath.toRadians(30);
const MAX_ROLL = CesiumMath.toRadians(30);
const TILT_RATE = CesiumMath.toRadians(45);
const MIN_TILT = CesiumMath.toRadians(-90);
const MAX_TILT = CesiumMath.toRadians(40);
const DEAD_ZONE = 0.1;
const RESPAWN_HEIGHT = 20;
// the distance ahead of the drone over which the slope of the terrain is measured, in meters
const SLOPE_BASE = 5;

// the keys, by event.code, and the axis and direction each one pushes
/** @type {Record<string, ['climb' | 'turn' | 'forward' | 'right' | 'tilt', number]>} */
const KEYS = {
  KeyW: ['climb', 1],
  KeyS: ['climb', -1],
  KeyA: ['turn', -1],
  KeyD: ['turn', 1],
  ArrowUp: ['forward', 1],
  ArrowDown: ['forward', -1],
  ArrowLeft: ['right', -1],
  ArrowRight: ['right', 1],
  KeyR: ['tilt', -1],
  KeyF: ['tilt', 1],
};

/**
 * @typedef {{climb: number, turn: number, forward: number, right: number, tilt: number, boost: boolean}} Sticks
 */

const enuScratch = new Matrix4();
const stepScratch = new Cartesian3();
const previousScratch = new Cartesian3();
const aheadScratch = new Cartesian3();
const aheadCartographicScratch = new Cartographic();
const cartographicScratch = new Cartographic();

/**
 * @param {number} value
 */
function deadZone(value) {
  const magnitude = Math.abs(value);
  return magnitude < DEAD_ZONE ? 0 : (Math.sign(value) * (magnitude - DEAD_ZONE)) / (1 - DEAD_ZONE);
}

/**
 * An arcade drone: it stays level, holds its altitude when the sticks are released, and is flown
 * with the keyboard (W, A, S, D and the arrows, as the two sticks of a "Mode 2" radio) or a gamepad.
 */
export default class CesiumDrone {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{speed?: number, boostSpeed?: number, climbSpeed?: number, turnRate?: number, clearance?: number, crashSpeed?: number, cameraTilt?: number}} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    /** horizontal speed at full stick, in m/s */
    this.speed = options.speed ?? 15;
    /** horizontal speed at full stick with boost, in m/s */
    this.boostSpeed = options.boostSpeed ?? 2 * this.speed;
    /** vertical speed at full stick, in m/s */
    this.climbSpeed = options.climbSpeed ?? 6;
    /** turn speed at full stick, in degrees per second */
    this.turnRate = options.turnRate ?? 90;
    /** lowest height above the terrain, in meters */
    this.clearance = options.clearance ?? 2;
    /** speed into the terrain above which touching it is a crash, in m/s */
    this.crashSpeed = options.crashSpeed ?? 8;
    /** the camera's tilt up on the frame when the drone takes off, in degrees */
    this.cameraTilt = options.cameraTilt ?? 20;

    /**
     * Raised with the position of the drone when it crashes, and its speed into the terrain.
     * @type {Event<(position: Cartesian3, impact: number) => void>}
     */
    this.crashed = new Event();

    /**
     * Height above the terrain, in meters, or undefined where the terrain is not loaded.
     * @type {number | undefined}
     */
    this.heightNow = undefined;

    this.active_ = false;
    this.crashed_ = false;
    this.lastTick_ = 0;
    this.position_ = new Cartesian3();
    // in the east-north-up frame at the drone, in m/s
    this.velocity_ = new Cartesian3();
    this.heading_ = 0;
    // the camera's tilt, and the body's pitch and roll, in radians
    this.tilt_ = 0;
    this.pitch_ = 0;
    this.roll_ = 0;
    /** @type {Set<string>} */
    this.keys_ = new Set();

    this.handleKeyFunction_ = this.handleKey_.bind(this);
    this.handleBlurFunction_ = () => this.keys_.clear();
    this.handleTickFunction_ = this.handleTick_.bind(this);
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
      const camera = this.viewer.camera;
      Cartesian3.clone(camera.positionWC, this.position_);
      Cartesian3.clone(Cartesian3.ZERO, this.velocity_);
      this.heading_ = camera.heading;
      this.tilt_ = CesiumMath.clamp(CesiumMath.toRadians(this.cameraTilt), MIN_TILT, MAX_TILT);
      this.pitch_ = 0;
      this.roll_ = 0;
      this.crashed_ = false;
      this.lastTick_ = performance.now();
      document.addEventListener('keydown', this.handleKeyFunction_);
      document.addEventListener('keyup', this.handleKeyFunction_);
      window.addEventListener('blur', this.handleBlurFunction_);
      this.viewer.clock.onTick.addEventListener(this.handleTickFunction_);
    } else {
      document.removeEventListener('keydown', this.handleKeyFunction_);
      document.removeEventListener('keyup', this.handleKeyFunction_);
      window.removeEventListener('blur', this.handleBlurFunction_);
      this.viewer.clock.onTick.removeEventListener(this.handleTickFunction_);
      this.keys_.clear();
    }
    this.enableNavigation_(!active);
  }

  /**
   * Current speed, in m/s.
   */
  get speedNow() {
    return Cartesian3.magnitude(this.velocity_);
  }

  /**
   * Puts the drone back, hovering and level, above the terrain where it crashed, and gives the
   * controls back.
   */
  respawn() {
    const cartographic = Cartographic.fromCartesian(this.position_, undefined, cartographicScratch);
    const ground = this.viewer.scene.globe.getHeight(cartographic) ?? cartographic.height;
    cartographic.height = ground + RESPAWN_HEIGHT;
    Cartographic.toCartesian(cartographic, undefined, this.position_);
    Cartesian3.clone(Cartesian3.ZERO, this.velocity_);
    this.pitch_ = 0;
    this.roll_ = 0;
    this.crashed_ = false;
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKey_(event) {
    if (!(event.code in KEYS) && event.key !== 'Shift') {
      return;
    }
    const code = event.key === 'Shift' ? 'Shift' : event.code;
    if (event.type === 'keyup') {
      // always, or a key released with a modifier held would stay pressed
      this.keys_.delete(code);
      return;
    }
    // leave the shortcuts (Ctrl+R, Cmd+F...) and the typing in text fields alone
    const target = event.composedPath()[0];
    if (event.ctrlKey || event.metaKey || event.altKey || (target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable]'))) {
      return;
    }
    // the arrows would scroll the page
    event.preventDefault();
    this.keys_.add(code);
  }

  /**
   * The keyboard and the first gamepad, added up, each axis from -1 to 1.
   * @return {Sticks}
   */
  readSticks_() {
    /** @type {Sticks} */
    const sticks = {climb: 0, turn: 0, forward: 0, right: 0, tilt: 0, boost: this.keys_.has('Shift')};
    for (const code of this.keys_) {
      const key = KEYS[code];
      if (key) {
        sticks[key[0]] += key[1];
      }
    }
    const pad = navigator.getGamepads?.().find(gamepad => gamepad);
    if (pad) {
      // the sticks' Y axes are positive down
      sticks.turn += deadZone(pad.axes[0] ?? 0);
      sticks.climb -= deadZone(pad.axes[1] ?? 0);
      sticks.right += deadZone(pad.axes[2] ?? 0);
      sticks.forward -= deadZone(pad.axes[3] ?? 0);
      sticks.boost ||= (pad.buttons[7]?.value ?? 0) > 0.5;
      sticks.tilt += (pad.buttons[4]?.pressed ? 1 : 0) - (pad.buttons[5]?.pressed ? 1 : 0);
    }
    sticks.climb = CesiumMath.clamp(sticks.climb, -1, 1);
    sticks.turn = CesiumMath.clamp(sticks.turn, -1, 1);
    sticks.forward = CesiumMath.clamp(sticks.forward, -1, 1);
    sticks.right = CesiumMath.clamp(sticks.right, -1, 1);
    sticks.tilt = CesiumMath.clamp(sticks.tilt, -1, 1);
    return sticks;
  }

  handleTick_() {
    const now = performance.now();
    // a hidden tab stops the ticks: do not jump over the time it was hidden
    const dt = Math.min((now - this.lastTick_) / 1000, 0.1);
    this.lastTick_ = now;
    if (dt <= 0) {
      return;
    }
    const sticks = this.crashed_ ? {climb: 0, turn: 0, forward: 0, right: 0, tilt: 0, boost: false} : this.readSticks_();

    this.heading_ = CesiumMath.zeroToTwoPi(this.heading_ + sticks.turn * CesiumMath.toRadians(this.turnRate) * dt);
    this.tilt_ = CesiumMath.clamp(this.tilt_ + sticks.tilt * TILT_RATE * dt, MIN_TILT, MAX_TILT);

    // the target velocity, from the sticks in the drone's frame to east-north-up
    const sin = Math.sin(this.heading_);
    const cos = Math.cos(this.heading_);
    const speed = sticks.boost ? this.boostSpeed : this.speed;
    const targetForward = sticks.forward * speed;
    const targetRight = sticks.right * speed;
    const velocity = this.velocity_;
    const ease = 1 - Math.exp(-dt / VELOCITY_TAU);
    velocity.x += (targetForward * sin + targetRight * cos - velocity.x) * ease;
    velocity.y += (targetForward * cos - targetRight * sin - velocity.y) * ease;
    velocity.z += (sticks.climb * this.climbSpeed - velocity.z) * ease;

    // the body leans into what it accelerates toward, and into its speed: nose down going forward,
    // about 20 degrees at full stick and more with boost, up when braking, banked into the turns;
    // visual only
    const forward = velocity.x * sin + velocity.y * cos;
    const right = velocity.x * cos - velocity.y * sin;
    /** @type {(target: number, current: number) => number} */
    const lean = (target, current) => CesiumMath.clamp((0.5 * (target - current) + 0.65 * current) / this.speed, -1, 1);
    const attitudeEase = 1 - Math.exp(-dt / ATTITUDE_TAU);
    const targetPitch = -lean(targetForward, forward) * MAX_PITCH;
    const targetRoll = CesiumMath.clamp(lean(targetRight, right) + 0.5 * sticks.turn, -1, 1) * MAX_ROLL;
    this.pitch_ += (targetPitch - this.pitch_) * attitudeEase;
    this.roll_ += (targetRoll - this.roll_) * attitudeEase;

    // @ts-expect-error Transforms.eastNorthUpToFixedFrame is missing from the @cesium/engine 26.4.0 typings
    const enu = Transforms.eastNorthUpToFixedFrame(this.position_, undefined, enuScratch);
    const step = Matrix4.multiplyByPointAsVector(enu, Cartesian3.multiplyByScalar(velocity, dt, stepScratch), stepScratch);
    Cartesian3.clone(this.position_, previousScratch);
    Cartesian3.add(this.position_, step, this.position_);

    this.keepAboveTerrain_(previousScratch, enu);

    const scene = this.viewer.scene;
    scene.camera.setView({
      destination: this.position_,
      orientation: {heading: this.heading_, pitch: this.pitch_ + this.tilt_, roll: this.roll_},
    });
    scene.requestRender();
  }

  /**
   * Slide along the terrain when running into it slowly, bump into the walls, crash when fast.
   * @param {Cartesian3} previous the position before this tick's step
   * @param {Matrix4} enu the east-north-up frame at the drone
   */
  keepAboveTerrain_(previous, enu) {
    const globe = this.viewer.scene.globe;
    const cartographic = Cartographic.fromCartesian(this.position_, undefined, cartographicScratch);
    const ground = globe.getHeight(cartographic);
    if (ground === undefined) {
      // the terrain is not loaded yet under the drone
      this.heightNow = undefined;
      return;
    }
    this.heightNow = cartographic.height - ground;
    if (this.heightNow >= this.clearance) {
      return;
    }
    const velocity = this.velocity_;
    const horizontal = Math.hypot(velocity.x, velocity.y);
    // the slope ahead, over a few meters: the height of the rendered terrain jumps by tens of
    // centimeters between its triangles and as finer tiles load, too much to compare from frame to frame
    let slope = 0;
    if (horizontal > 0.1) {
      const ahead = Cartesian3.fromElements((velocity.x / horizontal) * SLOPE_BASE, (velocity.y / horizontal) * SLOPE_BASE, 0, aheadScratch);
      Cartesian3.add(this.position_, Matrix4.multiplyByPointAsVector(enu, ahead, ahead), ahead);
      const groundAhead = globe.getHeight(Cartographic.fromCartesian(ahead, undefined, aheadCartographicScratch));
      if (groundAhead !== undefined) {
        slope = Math.max(groundAhead - ground, 0) / SLOPE_BASE;
      }
    }
    // how fast the drone runs into the terrain: its descent, and the rise of the slope it flies into
    const impact = Math.max(-velocity.z, 0) + horizontal * slope;
    if (!this.crashed_ && impact >= this.crashSpeed) {
      cartographic.height = ground + this.clearance;
      Cartographic.toCartesian(cartographic, undefined, this.position_);
      this.heightNow = this.clearance;
      this.crashed_ = true;
      Cartesian3.clone(Cartesian3.ZERO, velocity);
      this.crashed.raiseEvent(Cartesian3.clone(this.position_), impact);
    } else if (slope > 1) {
      // steeper than 45 degrees: a wall, the drone stops against it rather than climbing it
      Cartesian3.clone(previous, this.position_);
      this.heightNow = this.clearance;
      velocity.x = 0;
      velocity.y = 0;
    } else {
      cartographic.height = ground + this.clearance;
      Cartographic.toCartesian(cartographic, undefined, this.position_);
      this.heightNow = this.clearance;
      if (velocity.z < 0) {
        velocity.z = 0;
      }
    }
  }

  /**
   * @param {boolean} enable
   */
  enableNavigation_(enable) {
    const controller = this.viewer.scene.screenSpaceCameraController;
    controller.enableTranslate = enable;
    controller.enableZoom = enable;
    controller.enableRotate = enable;
    controller.enableTilt = enable;
    controller.enableLook = enable;
  }
}
