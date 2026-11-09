import {Cartesian3, Cartographic, Ellipsoid, Event, FixedFrameTransforms, Math as CesiumMath, Matrix4} from '@cesium/core';
import Controls from '@geoblocks/cesium-input';
import {ObstacleProbe, blockedStep, meshGroundHeight, meshObstacleAhead} from '@geoblocks/cesium-obstacles';

/** @import {CesiumWidget} from '@cesium/engine' */
/** @import {Binding} from '@geoblocks/cesium-input' */
/** @import {Obstacle, TriangleMesh} from '@geoblocks/cesium-obstacles' */

export {jammingAt} from './jamming.js';

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
// the fall without its motors: gravity in m/s², and the air slowing the drone's sideways motion, per second
const GRAVITY = 9.81;
const DRAG = 0.3;
// the distance ahead of the drone over which the slope of the terrain is measured, in meters
const SLOPE_BASE = 5;
// in meters: nearer the terrain's height, an obstacle in view is the terrain, which #keepAboveTerrain handles;
// the rendered terrain and its height differ by tens of centimeters
const ON_TERRAIN = 1;

// the keys, by event.code, as the two sticks of a drone's radio ("Mode 2"): W and S climb, A and D turn, the
// arrows fly forward and sideways, R and F tilt the camera, Shift boosts
const KEYS = {
  move: {up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight']},
  climb: {negative: ['KeyS'], positive: ['KeyW']},
  turn: {negative: ['KeyA'], positive: ['KeyD']},
  tilt: {negative: ['KeyR'], positive: ['KeyF']},
  boost: ['ShiftLeft', 'ShiftRight'],
};

// the default bindings, the keys and the gamepad's layouts: 'game', the left stick moving, the right one
// turning and tilting the camera, the triggers climbing and descending, R1 boosting, as in most games; or
// 'mode2', the sticks of a drone's radio, the left one climbing and turning, the right one moving, R2
// boosting, the bumpers tilting the camera
/** @satisfies {Record<'game' | 'mode2', Record<string, Binding>>} */
export const DRONE_BINDINGS = {
  game: {
    move: {type: 'vector', keys: KEYS.move, stick: 'left'},
    climb: {type: 'axis', keys: KEYS.climb, buttons: {negative: [6], positive: [7]}},
    turn: {type: 'axis', keys: KEYS.turn, stick: 'right', along: 'x'},
    tilt: {type: 'axis', keys: KEYS.tilt, stick: 'right', along: 'y'},
    boost: {type: 'button', keys: KEYS.boost, buttons: [5]},
  },
  mode2: {
    move: {type: 'vector', keys: KEYS.move, stick: 'right'},
    climb: {type: 'axis', keys: KEYS.climb, stick: 'left', along: 'y'},
    turn: {type: 'axis', keys: KEYS.turn, stick: 'left', along: 'x'},
    tilt: {type: 'axis', keys: KEYS.tilt, buttons: {negative: [5], positive: [4]}},
    boost: {type: 'button', keys: KEYS.boost, buttons: [7]},
  },
};

/**
 * The drone's intent: move forward and sideways, no longer than 1, and climb, turn and tilt the camera, from -1 to 1.
 * @typedef {{move: {x: number, y: number}, climb: number, turn: number, tilt: number, boost: boolean}} Sticks
 */

/** @type {Sticks} */
const CENTERED = {move: {x: 0, y: 0}, climb: 0, turn: 0, tilt: 0, boost: false};

const enuScratch = new Matrix4();
const stepScratch = new Cartesian3();
const previousScratch = new Cartesian3();
const aheadScratch = new Cartesian3();
const aheadCartographicScratch = new Cartographic();
const cartographicScratch = new Cartographic();
const towardScratch = new Cartesian3();
const allowedScratch = new Cartesian3();
const obstacleCartographicScratch = new Cartographic();
const upScratch = new Cartesian3();

/**
 * An arcade drone: it stays level, holds its altitude when the sticks are released, and is flown
 * with the keyboard (W, A, S, D and the arrows, as the two sticks of a "Mode 2" radio) or a gamepad.
 */
export default class CesiumDrone {
  #layout;
  #active = false;
  // the camera controller's inputs before activation, given back as they were
  #inputsBefore = true;
  #crashed = false;
  #lastTick = 0;
  #position = new Cartesian3();
  // in the east-north-up frame at the drone, in m/s
  #velocity = new Cartesian3();
  #heading = 0;
  // the camera's tilt, and the body's pitch and roll, in radians
  #tilt = 0;
  #pitch = 0;
  #roll = 0;
  #lastSticks;
  #lostFor = 0;
  #obstacleProbe;
  #handleTickFunction;

  /**
   * @param {CesiumWidget} viewer
   * @param {{speed?: number, boostSpeed?: number, climbSpeed?: number, turnRate?: number, clearance?: number, crashSpeed?: number, cameraTilt?: number, failsafeDelay?: number, layout?: 'game' | 'mode2', collision?: boolean}} [options]
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
    /** the time the drone keeps its last command after losing its control link, in seconds, before its motors stop */
    this.failsafeDelay = options.failsafeDelay ?? 1.5;
    this.#layout = options.layout ?? 'game';
    /**
     * Where the drone's intent comes from, read on each tick unless the control link is lost: {move: {x, y},
     * climb, turn, tilt, boost}. The keyboard and the first gamepad by default, with DRONE_BINDINGS for the
     * layout; any object with a read() method otherwise: touch controls, an AI, a replay. The drone turns
     * its active on and off with its own: replace it while the drone is not active.
     * @type {{read(): Sticks, active?: boolean}}
     */
    this.input = new Controls(DRONE_BINDINGS[this.#layout], {deadZone: DEAD_ZONE});
    /**
     * Whether the drone crashes into the obstacles in view, opaque 3D Tiles or primitives, at any speed;
     * the terrain is checked either way.
     */
    this.collision = options.collision ?? false;

    /**
     * Whether the control link is lost, set by the application (from jamming, for example): the
     * drone keeps its last command, then, after the failsafe delay, its motors stop and it falls.
     */
    this.rxLoss = false;

    /**
     * Raised with the position of the drone when it crashes, and its speed into the terrain.
     * @type {Event<(position: Cartesian3, impact: number) => void>}
     */
    this.crashed = new Event();

    /**
     * Height above the ground (groundHeight), in meters, or undefined where it is not known yet.
     * @type {number | undefined}
     */
    this.heightNow = undefined;

    // the sticks before the control link was lost, and for how long it has been lost, in seconds
    this.#lastSticks = CENTERED;

    this.#obstacleProbe = new ObstacleProbe(viewer.scene);

    /**
     * The obstacle ahead of the drone in a direction, a point of its plane and its normal toward the drone, if
     * any; asked for each step while collision is on. By default the obstacles in view, read in the depth of
     * the last frame, which waits for the GPU; for a world known on the CPU, a ray cast in every direction,
     * reaching as far as a step goes.
     * @type {(toward: Cartesian3, key: string) => Obstacle | undefined}
     */
    this.obstacleAhead = (toward, key) => this.#obstacleProbe.ahead(toward, key);

    /**
     * The height of the ground under a position, in meters above the ellipsoid, or undefined when unknown yet:
     * what the drone keeps its clearance above, slides along and crashes into. The terrain by default; a model's
     * roofs and floors otherwise (flyOn).
     * @type {(position: Cartographic) => number | undefined}
     */
    this.groundHeight = position => this.viewer.scene.globe?.getHeight(position);

    this.#handleTickFunction = this.#handleTick.bind(this);
  }

  get active() {
    return this.#active;
  }

  /**
   * The gamepad's layout, 'game' or 'mode2', as in DRONE_BINDINGS, when the input is the default one.
   * @return {'game' | 'mode2'}
   */
  get layout() {
    return this.#layout;
  }

  set layout(layout) {
    this.#layout = layout;
    if (this.input instanceof Controls) {
      this.input.bindings = DRONE_BINDINGS[layout];
    }
  }

  set active(active) {
    if (active === this.#active) {
      return;
    }
    this.#active = active;
    const controller = this.viewer.scene.screenSpaceCameraController;
    if (active) {
      this.#inputsBefore = controller.enableInputs;
      controller.enableInputs = false;
      const camera = this.viewer.camera;
      Cartesian3.clone(camera.positionWC, this.#position);
      Cartesian3.clone(Cartesian3.ZERO, this.#velocity);
      this.#heading = camera.heading;
      this.#tilt = CesiumMath.clamp(CesiumMath.toRadians(this.cameraTilt), MIN_TILT, MAX_TILT);
      this.#pitch = 0;
      this.#roll = 0;
      this.#crashed = false;
      this.#lastSticks = CENTERED;
      this.#lostFor = 0;
      this.#lastTick = performance.now();
      this.input.active = true;
      this.viewer.clock.onTick.addEventListener(this.#handleTickFunction);
    } else {
      controller.enableInputs = this.#inputsBefore;
      this.input.active = false;
      this.viewer.clock.onTick.removeEventListener(this.#handleTickFunction);
    }
  }

  /**
   * Current speed, in m/s.
   */
  get speedNow() {
    return Cartesian3.magnitude(this.#velocity);
  }

  /**
   * Where the drone is, a copy.
   */
  get position() {
    return Cartesian3.clone(this.#position);
  }

  /**
   * Puts the drone back, hovering and level, above the terrain where it crashed or at a position,
   * and gives the controls back. Does nothing while the drone is not active: it takes off from the
   * camera when it is activated.
   * @param {Cartesian3} [position]
   */
  respawn(position) {
    if (!this.#active) {
      return;
    }
    const cartographic = Cartographic.fromCartesian(position ?? this.#position, undefined, cartographicScratch);
    const ground = this.groundHeight(cartographic) ?? cartographic.height;
    cartographic.height = ground + RESPAWN_HEIGHT;
    Cartographic.toCartesian(cartographic, undefined, this.#position);
    Cartesian3.clone(Cartesian3.ZERO, this.#velocity);
    this.#pitch = 0;
    this.#roll = 0;
    this.#crashed = false;
    this.#lastSticks = CENTERED;
    this.#lostFor = 0;
  }

  #handleTick() {
    const now = performance.now();
    // a hidden tab stops the ticks: do not jump over the time it was hidden
    const dt = Math.min((now - this.#lastTick) / 1000, 0.1);
    this.#lastTick = now;
    if (dt <= 0) {
      return;
    }
    // without its control link, the drone keeps its last command, then its motors stop
    this.#lostFor = this.rxLoss ? this.#lostFor + dt : 0;
    const failsafe = this.#lostFor > this.failsafeDelay;
    let sticks = CENTERED;
    if (!this.#crashed && !failsafe) {
      sticks = this.rxLoss ? this.#lastSticks : (this.#lastSticks = this.input.read());
    }

    this.#heading = CesiumMath.zeroToTwoPi(this.#heading + sticks.turn * CesiumMath.toRadians(this.turnRate) * dt);
    this.#tilt = CesiumMath.clamp(this.#tilt + sticks.tilt * TILT_RATE * dt, MIN_TILT, MAX_TILT);

    // the target velocity, from the sticks in the drone's frame to east-north-up
    const sin = Math.sin(this.#heading);
    const cos = Math.cos(this.#heading);
    const speed = sticks.boost ? this.boostSpeed : this.speed;
    const targetForward = sticks.move.y * speed;
    const targetRight = sticks.move.x * speed;
    const velocity = this.#velocity;
    if (failsafe) {
      // the motors stopped: the drone falls, coasting
      const drag = Math.exp(-DRAG * dt);
      velocity.x *= drag;
      velocity.y *= drag;
      velocity.z -= GRAVITY * dt;
    } else {
      const ease = 1 - Math.exp(-dt / VELOCITY_TAU);
      velocity.x += (targetForward * sin + targetRight * cos - velocity.x) * ease;
      velocity.y += (targetForward * cos - targetRight * sin - velocity.y) * ease;
      velocity.z += (sticks.climb * this.climbSpeed - velocity.z) * ease;
    }

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
    this.#pitch += (targetPitch - this.#pitch) * attitudeEase;
    this.#roll += (targetRoll - this.#roll) * attitudeEase;

    const enu = FixedFrameTransforms.eastNorthUpToFixedFrame(this.#position, undefined, enuScratch);
    const step = Matrix4.multiplyByPointAsVector(enu, Cartesian3.multiplyByScalar(velocity, dt, stepScratch), stepScratch);
    Cartesian3.clone(this.#position, previousScratch);
    if (!this.#crashIntoObstacle(step, dt)) {
      Cartesian3.add(this.#position, step, this.#position);
    }

    this.#keepAboveTerrain(previousScratch, enu, dt, failsafe);

    const scene = this.viewer.scene;
    scene.camera.setView({
      destination: this.#position,
      orientation: {heading: this.#heading, pitch: this.#pitch + this.#tilt, roll: this.#roll},
    });
    scene.requestRender();
  }

  /**
   * Crash into the obstacle in view ahead if this tick's step reaches it, at any speed, unlike the terrain.
   * @param {Cartesian3} step this tick's step, in the fixed frame
   * @param {number} dt seconds
   * @return {boolean} whether the drone crashed
   */
  #crashIntoObstacle(step, dt) {
    const length = Cartesian3.magnitude(step);
    if (!this.collision || this.#crashed || length === 0) {
      return false;
    }
    const toward = Cartesian3.divideByScalar(step, length, towardScratch);
    const obstacle = this.obstacleAhead(toward, 'flight');
    // a step shorter than asked for reaches the obstacle
    if (!obstacle?.point || !obstacle.normal || blockedStep(toward, length, this.#position, obstacle, allowedScratch).length >= length) {
      return false;
    }
    const point = Cartographic.fromCartesian(obstacle.point, undefined, obstacleCartographicScratch);
    const ground = this.groundHeight(point);
    if (ground !== undefined && point.height - ground < ON_TERRAIN) {
      return false;
    }
    this.#crashed = true;
    Cartesian3.clone(Cartesian3.ZERO, this.#velocity);
    // its speed into the obstacle
    this.crashed.raiseEvent(Cartesian3.clone(this.#position), -Cartesian3.dot(step, obstacle.normal) / dt);
    return true;
  }

  /**
   * Slide along the terrain when running into it slowly, bump into the walls, crash when fast, or
   * at all with the motors stopped.
   * @param {Cartesian3} previous the position before this tick's step
   * @param {Matrix4} enu the east-north-up frame at the drone
   * @param {number} dt seconds
   * @param {boolean} failsafe whether the motors are stopped
   */
  #keepAboveTerrain(previous, enu, dt, failsafe) {
    const cartographic = Cartographic.fromCartesian(this.#position, undefined, cartographicScratch);
    const ground = this.groundHeight(cartographic);
    if (ground === undefined) {
      // the terrain is not loaded yet under the drone
      this.heightNow = undefined;
      return;
    }
    this.heightNow = cartographic.height - ground;
    if (this.heightNow >= this.clearance) {
      return;
    }
    const velocity = this.#velocity;
    const horizontal = Math.hypot(velocity.x, velocity.y);
    // the slope ahead, over a few meters: the height of the rendered terrain jumps by tens of
    // centimeters between its triangles and as finer tiles load, too much to compare from frame to frame
    let slope = 0;
    if (horizontal > 0.1) {
      const ahead = Cartesian3.fromElements((velocity.x / horizontal) * SLOPE_BASE, (velocity.y / horizontal) * SLOPE_BASE, 0, aheadScratch);
      Cartesian3.add(this.#position, Matrix4.multiplyByPointAsVector(enu, ahead, ahead), ahead);
      const groundAhead = this.groundHeight(Cartographic.fromCartesian(ahead, undefined, aheadCartographicScratch));
      if (groundAhead !== undefined) {
        slope = Math.max(groundAhead - ground, 0) / SLOPE_BASE;
      }
    }
    // how fast the drone runs into the terrain: its velocity across the slope it flies into, from
    // its descent on flat ground to its speed against a wall
    const impact = (Math.max(-velocity.z, 0) + horizontal * slope) / Math.sqrt(1 + slope * slope);
    if (!this.#crashed && (impact >= this.crashSpeed || failsafe)) {
      cartographic.height = ground + this.clearance;
      Cartographic.toCartesian(cartographic, undefined, this.#position);
      this.heightNow = this.clearance;
      this.#crashed = true;
      Cartesian3.clone(Cartesian3.ZERO, velocity);
      this.crashed.raiseEvent(Cartesian3.clone(this.#position), impact);
    } else if (slope > 1) {
      // steeper than 45 degrees: a wall, the drone stops against it rather than going through, and
      // keeps only its climb or descent
      velocity.x = 0;
      velocity.y = 0;
      const rise = Matrix4.multiplyByPointAsVector(enu, Cartesian3.fromElements(0, 0, velocity.z * dt, aheadScratch), aheadScratch);
      Cartesian3.add(previous, rise, this.#position);
      const back = Cartographic.fromCartesian(this.#position, undefined, cartographicScratch);
      const groundBack = this.groundHeight(back) ?? ground;
      if (back.height < groundBack + this.clearance) {
        back.height = groundBack + this.clearance;
        Cartographic.toCartesian(back, undefined, this.#position);
        velocity.z = Math.max(velocity.z, 0);
      }
      this.heightNow = back.height - groundBack;
    } else {
      cartographic.height = ground + this.clearance;
      Cartographic.toCartesian(cartographic, undefined, this.#position);
      this.heightNow = this.clearance;
      if (velocity.z < 0) {
        velocity.z = 0;
      }
    }
  }
}

/**
 * Flies a CesiumDrone among a triangle mesh of cesium-obstacles: its walls stop it, crashing, in every direction,
 * from rays cast from its middle and from around its body, ahead, beside, above and below it; climbing, the
 * ceilings too; its roofs and floors are its ground, else the ground it had (the terrain). Turns the collision on.
 * @param {CesiumDrone} drone
 * @param {TriangleMesh} mesh
 * @param {{radius?: number, reach?: number}} [options] In meters: the drone's body about its middle, 0.25 by
 *     default; how far ahead the walls are looked for, as far as a step goes at the top speed, 5 by default.
 */
export function flyOn(drone, mesh, {radius = 0.25, reach = 5} = {}) {
  const from = () => drone.position;
  const offsets = [
    Cartesian3.ZERO,
    new Cartesian3(radius, 0, 0), new Cartesian3(-radius, 0, 0),
    new Cartesian3(0, radius, 0), new Cartesian3(0, -radius, 0),
    new Cartesian3(0, 0, radius), new Cartesian3(0, 0, -radius),
  ];
  const walls = meshObstacleAhead(mesh, from, {offsets, reach});
  const all = meshObstacleAhead(mesh, from, {offsets, reach, walls: false});
  drone.obstacleAhead = toward => {
    const up = Ellipsoid.WGS84.geodeticSurfaceNormal(drone.position, upScratch);
    if (Cartesian3.dot(toward, up) <= 0) {
      return walls(toward);
    }
    // climbing, the ceilings too; a floor seen from above is the ground's
    const obstacle = all(toward);
    return obstacle?.normal && Cartesian3.dot(obstacle.normal, up) > 0 ? walls(toward) : obstacle;
  };
  // under the body: a ceiling the drone runs into is not its ground
  const ground = meshGroundHeight(mesh, {below: radius});
  const fallback = drone.groundHeight;
  drone.groundHeight = position => ground(position) ?? fallback(position);
  drone.collision = true;
}
