import {Cartesian2, Cartesian3, Ellipsoid, FixedFrameTransforms, Math as CesiumMath, Matrix4, Ray} from '@cesium/core';
import Controls from '@geoblocks/cesium-input';

// in seconds: a frame after a backgrounded tab must not move far
const MAX_DELTA = 0.1;
// the orbit's elevation above the point it turns around: above its horizon, and short of straight down, where
// the heading is lost
const MIN_ELEVATION = CesiumMath.toRadians(5);
const MAX_ELEVATION = CesiumMath.toRadians(89);
// the pitch of a turn in place, short of straight up or down, where Cesium turns the view around
const MAX_PITCH = CesiumMath.toRadians(85);
// the lowest height the pan's speed is scaled by, in meters, so that it does not stop on the ground
const MIN_HEIGHT = 1;
// in seconds: how soon the motion follows the sticks and the triggers, its starts and stops eased
const EASE_TAU = 0.15;
// below it, an eased value is where it goes: the motion stops, and the scene stops rendering
const SETTLED = 1e-3;
// in seconds: how soon the turn to north gets there
const NORTH_TAU = 0.2;

// the default bindings: the left stick pans, the right one orbits around the center of the view, R2 zooms in
// and L2 out, as fast as they are pressed, R1 climbs and L1 descends, and R3, the right stick pressed, turns the
// view to north
/** @satisfies {Record<string, import('@geoblocks/cesium-input').Binding>} */
export const NAVIGATION_BINDINGS = {
  pan: {type: 'vector', stick: 'left'},
  orbit: {type: 'vector', stick: 'right'},
  zoom: {type: 'axis', buttons: {negative: [6], positive: [7]}},
  climb: {type: 'axis', buttons: {negative: [4], positive: [5]}},
  north: {type: 'button', buttons: [11]},
};

/**
 * @typedef {{pan: {x: number, y: number}, orbit: {x: number, y: number}, zoom: number, climb: number, north: boolean}} NavigationIntent
 */

/**
 * @param {number} from
 * @param {number} to
 * @param {number} min
 * @param {number} max
 * @return {number} `to` within min and max, or no further out of them than `from`: a value already out of them
 *   is not pulled in at once.
 */
function limit(from, to, min, max) {
  return CesiumMath.clamp(to, Math.min(from, min), Math.max(from, max));
}

/**
 * @param {number} distance The distance to the point zoomed to, in meters.
 * @param {number} zoom From -1, out, to 1, in.
 * @param {number} rate The zoom at 1, in e-folds of the distance per second.
 * @param {number} dt In seconds.
 * @param {number} min
 * @param {number} max
 * @return {number} The distance after the zoom, as fast close up as far away, within min and max.
 */
export function zoomDistance(distance, zoom, rate, dt, min, max) {
  return limit(distance, distance * Math.exp(-zoom * rate * dt), min, max);
}

/**
 * @param {number} elevation The camera's elevation above the horizon of the point it orbits, in radians.
 * @param {number} step In radians, up positive.
 * @return {number} The elevation after the step, above the horizon and short of straight down.
 */
export function orbitElevation(elevation, step) {
  return limit(elevation, elevation + step, MIN_ELEVATION, MAX_ELEVATION);
}

/**
 * @param {{x: number, y: number}} vector
 * @return {{x: number, y: number}}
 */
function squared(vector) {
  const length = Math.hypot(vector.x, vector.y);
  return {x: vector.x * length, y: vector.y * length};
}

/**
 * @param {NavigationIntent} intent
 * @return {NavigationIntent} The intent squared, the sticks along their direction: gentle for a slight push, as fast
 *   at full deflection.
 */
export function curved({pan, orbit, zoom, climb, north}) {
  return {pan: squared(pan), orbit: squared(orbit), zoom: zoom * Math.abs(zoom), climb: climb * Math.abs(climb), north};
}

/**
 * @param {number} from
 * @param {number} to
 * @param {number} t
 * @return {number}
 */
function step(from, to, t) {
  return Math.abs(to - from) < SETTLED ? to : from + (to - from) * t;
}

/**
 * @param {NavigationIntent} from
 * @param {NavigationIntent} to
 * @param {number} dt In seconds.
 * @return {NavigationIntent} The intent eased from where it was toward the sticks and the triggers, there once close.
 */
export function eased(from, to, dt) {
  const t = 1 - Math.exp(-dt / EASE_TAU);
  return {
    pan: {x: step(from.pan.x, to.pan.x, t), y: step(from.pan.y, to.pan.y, t)},
    orbit: {x: step(from.orbit.x, to.orbit.x, t), y: step(from.orbit.y, to.orbit.y, t)},
    zoom: step(from.zoom, to.zoom, t),
    climb: step(from.climb, to.climb, t),
    north: to.north,
  };
}

/** @type {NavigationIntent} */
const STILL = {pan: {x: 0, y: 0}, orbit: {x: 0, y: 0}, zoom: 0, climb: 0, north: false};

const centerScratch = new Cartesian2();
const rayScratch = new Ray();
const pivotScratch = new Cartesian3();
const frameScratch = new Matrix4();
const moveScratch = new Cartesian3();
const upScratch = new Cartesian3();

/**
 * Navigates the globe with a gamepad, alongside the mouse: the left stick pans over the ground, the right one
 * orbits around the point at the center of the view, the triggers zoom to it, as fast as they are pressed, the
 * bumpers climb and descend, and the right stick pressed turns the view to north.
 */
export default class GamepadNavigation {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   */
  constructor(viewer) {
    this.viewer_ = viewer;
    this.scene_ = viewer.scene;

    /**
     * The pan's and the climb's speed at full stick, in heights above the ground per second.
     * @type {number}
     */
    this.panRate = 1;

    /**
     * The orbit's turn rate at full stick, in radians per second.
     * @type {number}
     */
    this.orbitRate = CesiumMath.toRadians(90);

    /**
     * The zoom's speed with a trigger fully pressed, in e-folds of the distance per second.
     * @type {number}
     */
    this.zoomRate = 1.5;

    /**
     * The lowest height above the ground the camera is kept at, in meters.
     * @type {number}
     */
    this.clearance = 2;

    /**
     * Where the intent comes from, read on each tick: {pan: {x, y}, orbit: {x, y}, zoom, climb, north}, from -1 to 1,
     * x right and y up, zoom in and climb up positive, and north whether the turn to north is held. The first gamepad
     * by default, with NAVIGATION_BINDINGS; any object with a read() method otherwise. The navigation turns its active
     * on and off with its own: replace it while it is not active.
     * @type {{read(): NavigationIntent, active?: boolean}}
     */
    this.input = new Controls(NAVIGATION_BINDINGS);

    this.active_ = false;
    this.lastTick_ = 0;
    // the intent eased toward the sticks and the triggers
    this.intent_ = STILL;
    // whether the north button was held on the last tick, and whether the view is turning to north
    this.northHeld_ = false;
    this.northing_ = false;
    // the center of the view when the turn to north started, what it turns around
    /** @type {Cartesian3 | undefined} */
    this.northPivot_ = undefined;
    this.onTickCallback_ = this.onTick_.bind(this);
  }

  get active() {
    return this.active_;
  }

  /**
   * Whether the gamepad navigates; the mouse still does.
   * @param {boolean} active
   */
  set active(active) {
    if (active === this.active_) {
      return;
    }
    this.active_ = active;
    this.input.active = active;
    if (active) {
      this.lastTick_ = performance.now();
      this.intent_ = STILL;
      this.northing_ = false;
      this.viewer_.clock.onTick.addEventListener(this.onTickCallback_);
    } else {
      this.viewer_.clock.onTick.removeEventListener(this.onTickCallback_);
    }
  }

  onTick_() {
    const timestamp = performance.now();
    const dt = Math.min((timestamp - this.lastTick_) / 1000, MAX_DELTA);
    this.lastTick_ = timestamp;

    const sticks = curved(this.input.read());
    const {pan, orbit, zoom, climb} = this.intent_ = eased(this.intent_, sticks, dt);
    // the turn to north starts on the press, not while the button is held, and the right stick takes the view back
    if (sticks.north && !this.northHeld_) {
      this.northing_ = true;
      // picked once: a pick on each tick can miss the tiles not loaded yet, in a direction the turn is fast to show
      const pivot = this.pivot_();
      this.northPivot_ = pivot && Cartesian3.clone(pivot, this.northPivot_);
    }
    this.northHeld_ = sticks.north;
    if (sticks.orbit.x !== 0 || sticks.orbit.y !== 0) {
      this.northing_ = false;
    }
    let northStep = 0;
    if (this.northing_) {
      const angle = CesiumMath.negativePiToPi(-this.scene_.camera.heading);
      northStep = Math.abs(angle) < SETTLED ? angle : angle * (1 - Math.exp(-dt / NORTH_TAU));
      this.northing_ = northStep !== angle;
    }

    const panning = pan.x !== 0 || pan.y !== 0;
    const turning = orbit.x !== 0 || orbit.y !== 0 || zoom !== 0 || northStep !== 0;
    if (!panning && !turning && climb === 0) {
      return;
    }
    const height = this.height_();
    if (panning) {
      this.pan_(pan, height * this.panRate * dt);
    }
    if (climb !== 0) {
      const camera = this.scene_.camera;
      camera.move(Ellipsoid.WGS84.geodeticSurfaceNormal(camera.positionWC, upScratch), climb * height * this.panRate * dt);
    }
    if (turning) {
      const headingStep = orbit.x * this.orbitRate * dt + northStep;
      const tiltStep = orbit.y * this.orbitRate * dt;
      // while the left stick moves, the view turns in place, as in a game: an orbit around the center of the view,
      // which the move carries along, would swing the camera around in a spiral
      const moving = sticks.pan.x !== 0 || sticks.pan.y !== 0;
      const pivot = moving ? undefined : northStep !== 0 ? this.northPivot_ : this.pivot_();
      if (pivot) {
        this.orbit_(pivot, headingStep, tiltStep, zoom, dt);
      } else {
        this.turn_(headingStep, tiltStep, zoom * height * this.zoomRate * dt);
      }
    }
    this.keepClearance_();
    this.scene_.requestRender();
  }

  /**
   * Lifts the camera to its clearance above the ground, where a move took it lower, into a slope ahead.
   */
  keepClearance_() {
    const camera = this.scene_.camera;
    const position = camera.positionCartographic;
    const ground = this.scene_.globe.getHeight(position);
    if (ground !== undefined && position.height < ground + this.clearance) {
      const up = Ellipsoid.WGS84.geodeticSurfaceNormal(camera.positionWC, upScratch);
      camera.move(up, ground + this.clearance - position.height);
    }
  }

  /**
   * @return {number} The camera's height above the ground, or the ellipsoid where the ground is not loaded.
   */
  height_() {
    const position = this.scene_.camera.positionCartographic;
    const ground = this.scene_.globe.getHeight(position) ?? 0;
    return Math.max(position.height - ground, MIN_HEIGHT);
  }

  /**
   * @return {Cartesian3 | undefined} The ground at the center of the view.
   */
  pivot_() {
    const scene = this.scene_;
    centerScratch.x = scene.canvas.clientWidth / 2;
    centerScratch.y = scene.canvas.clientHeight / 2;
    const ray = scene.camera.getPickRay(centerScratch, rayScratch);
    return ray && scene.globe.pick(ray, scene, pivotScratch);
  }

  /**
   * Moves the camera level, along its heading, and keeps its heading and pitch, which a move along the curve of
   * the Earth changes.
   * @param {{x: number, y: number}} pan
   * @param {number} distance At full stick, in meters.
   */
  pan_(pan, distance) {
    const camera = this.scene_.camera;
    const {heading, pitch, roll} = camera;
    const enu = FixedFrameTransforms.eastNorthUpToFixedFrame(camera.positionWC, Ellipsoid.WGS84, frameScratch);
    // forward along the heading, clockwise from north, and right across it
    const sin = Math.sin(heading);
    const cos = Math.cos(heading);
    const move = Matrix4.multiplyByPointAsVector(enu,
      Cartesian3.fromElements(pan.y * sin + pan.x * cos, pan.y * cos - pan.x * sin, 0, moveScratch), moveScratch);
    camera.move(move, distance);
    camera.setView({orientation: {heading, pitch, roll}});
  }

  /**
   * Orbits around the pivot and zooms to it, in its east-north-up frame.
   * @param {Cartesian3} pivot
   * @param {number} headingStep In radians, clockwise.
   * @param {number} tiltStep In radians, up.
   * @param {number} zoom
   * @param {number} dt
   */
  orbit_(pivot, headingStep, tiltStep, zoom, dt) {
    const camera = this.scene_.camera;
    const controller = this.scene_.screenSpaceCameraController;
    camera.lookAtTransform(FixedFrameTransforms.eastNorthUpToFixedFrame(pivot, Ellipsoid.WGS84, frameScratch));
    // a turn right moves the camera clockwise around the pivot, its heading up
    camera.rotate(Cartesian3.UNIT_Z, headingStep);
    // a look up lowers the camera toward the pivot's horizon, as in a game
    const distance = Cartesian3.magnitude(camera.position);
    const elevation = Math.asin(camera.position.z / distance);
    camera.rotate(camera.right, orbitElevation(elevation, -tiltStep) - elevation);
    camera.zoomIn(distance - zoomDistance(distance, zoom, this.zoomRate, dt,
      controller.minimumZoomDistance, controller.maximumZoomDistance));
    camera.lookAtTransform(Matrix4.IDENTITY);
  }

  /**
   * Turns the camera in place and moves it forward: while it moves, or with nothing at the center of the view to
   * orbit, the sky.
   * @param {number} headingStep In radians, clockwise.
   * @param {number} pitchStep In radians, up.
   * @param {number} distance Forward, in meters.
   */
  turn_(headingStep, pitchStep, distance) {
    const camera = this.scene_.camera;
    camera.setView({
      orientation: {
        heading: camera.heading + headingStep,
        pitch: limit(camera.pitch, camera.pitch + pitchStep, -MAX_PITCH, MAX_PITCH),
      },
    });
    camera.moveForward(distance);
  }

  destroy() {
    this.active = false;
  }
}
