import {
  CallbackProperty,
  Cartesian3,
  Cartographic,
  Color,
  ConstantPositionProperty,
  Event,
} from "@cesium/engine";

// a backgrounded tab must not integrate a multi-second step on return
const MAX_STEP_SECONDS = 0.1;
// an apple over terrain that never loads must not tick forever
const MAX_FLIGHT_SECONDS = 30;
// the recent positions kept for a trail effect
const TRAIL_INTERVAL_SECONDS = 0.04;
const TRAIL_POINTS = 16;
// a landed apple's trail is available for this long after landing
const TRAIL_KEEP_SECONDS = 1;

const normalScratch = new Cartesian3();
const deltaScratch = new Cartesian3();
const cartographicScratch = new Cartographic();

/**
 * @typedef {Object} Apple
 * @property {Cartesian3} position
 * @property {Cartesian3} velocity
 * @property {import('@cesium/engine').Entity} entity
 * @property {number} thrownAt performance.now() timestamp
 * @property {TrailPoint[]} trail the most recent positions, oldest first
 * @property {number} trailSampledAt performance.now() timestamp
 */

/** @typedef {import('../packages/cesium-post-process/trails.js').TrailPoint} TrailPoint */

export default class Apples {
  /**
   * @param {import('@cesium/widgets').Viewer} viewer
   * @param {number} [radius=0.1] Apple radius in meters.
   * @param {number} [gravity=9.81] In meters per second squared.
   */
  constructor(viewer, radius = 0.1, gravity = 9.81) {
    this.viewer = viewer;
    this.radius = radius;
    this.gravity = gravity;

    /** @type {Apple[]} */
    this.inFlight_ = [];
    /** @type {Apple[]} landed recently, their trail still available */
    this.landedRecently_ = [];
    /** Raised with the position of each apple as it lands. */
    this.landed = new Event();
    this.lastTick_ = 0;
    this.handleTickFunction = this.handleTick.bind(this);
  }

  /**
   * The apples still moving. A target loop can test distances against these.
   * @return {Apple[]}
   */
  get inFlight() {
    return this.inFlight_;
  }

  /**
   * The trails of the apples in flight and of those landed in the last second, one array of
   * points per apple, oldest point first.
   * @return {TrailPoint[][]}
   */
  get trails() {
    const cutoff = performance.now() - TRAIL_KEEP_SECONDS * 1000;
    this.landedRecently_ = this.landedRecently_.filter((apple) => apple.trailSampledAt > cutoff);
    return [...this.inFlight_, ...this.landedRecently_].map((apple) => apple.trail);
  }

  /**
   * @param {Cartesian3} position World coordinates.
   * @param {Cartesian3} velocity World coordinates, meters per second.
   */
  throw(position, velocity) {
    const apple = {
      position: Cartesian3.clone(position),
      velocity: Cartesian3.clone(velocity),
      thrownAt: performance.now(),
      /** @type {import('@cesium/engine').Entity} */
      entity: /** @type {any} */ (undefined),
      trail: [{position: Cartesian3.clone(position), time: performance.now()}],
      trailSampledAt: performance.now(),
    };
    apple.entity = this.viewer.entities.add({
      position: new CallbackProperty(() => apple.position, false),
      ellipsoid: {
        radii: new Cartesian3(this.radius, this.radius, this.radius),
        material: Color.RED,
      },
    });
    if (this.inFlight_.length === 0) {
      this.lastTick_ = apple.thrownAt;
      this.viewer.clock.onTick.addEventListener(this.handleTickFunction);
    }
    this.inFlight_.push(apple);
  }

  handleTick() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTick_) / 1000, MAX_STEP_SECONDS);
    this.lastTick_ = now;
    const globe = this.viewer.scene.globe;
    const ellipsoid = globe.ellipsoid;

    for (let i = this.inFlight_.length - 1; i >= 0; i--) {
      const apple = this.inFlight_[i];
      const normal = ellipsoid.geodeticSurfaceNormal(apple.position, normalScratch);
      Cartesian3.multiplyByScalar(normal, -this.gravity * dt, deltaScratch);
      Cartesian3.add(apple.velocity, deltaScratch, apple.velocity);
      Cartesian3.multiplyByScalar(apple.velocity, dt, deltaScratch);
      Cartesian3.add(apple.position, deltaScratch, apple.position);

      const cartographic = Cartographic.fromCartesian(apple.position, ellipsoid, cartographicScratch);
      const terrainHeight = globe.getHeight(cartographic);
      if (terrainHeight !== undefined && cartographic.height <= terrainHeight + this.radius) {
        cartographic.height = terrainHeight + this.radius;
        Cartographic.toCartesian(cartographic, ellipsoid, apple.position);
        // static from now on, so the entity system stops re-evaluating it
        apple.entity.position = new ConstantPositionProperty(apple.position);
        this.sampleTrail_(apple, now);
        this.inFlight_.splice(i, 1);
        this.landedRecently_.push(apple);
        this.landed.raiseEvent(apple.position);
        continue;
      }
      if (now - apple.trailSampledAt >= TRAIL_INTERVAL_SECONDS * 1000) {
        this.sampleTrail_(apple, now);
      }
      if (now - apple.thrownAt > MAX_FLIGHT_SECONDS * 1000) {
        this.viewer.entities.remove(apple.entity);
        this.inFlight_.splice(i, 1);
      }
    }

    this.viewer.scene.requestRender();
    if (this.inFlight_.length === 0) {
      this.viewer.clock.onTick.removeEventListener(this.handleTickFunction);
    }
  }

  /**
   * @param {Apple} apple
   * @param {number} now
   */
  sampleTrail_(apple, now) {
    if (apple.trail.length === TRAIL_POINTS) {
      apple.trail.shift();
    }
    apple.trail.push({position: Cartesian3.clone(apple.position), time: now});
    apple.trailSampledAt = now;
  }
}
