import {
  BoundingSphere,
  Cartesian3,
  EasingFunction,
  HeadingPitchRange,
  Matrix4,
  ScreenSpaceEventType,
  Transforms,
} from '@cesium/engine';

const directionScratch = new Cartesian3();
const enuScratch = new Matrix4();

/**
 * Flies the camera toward the clicked position, along the line of sight, and
 * stops at a given distance from it.
 */
export default class CesiumFlyTo {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {ScreenSpaceEventType} [eventType=ScreenSpaceEventType.LEFT_DOUBLE_CLICK]
   * @param {number} [range=300] distance (in meters) between the camera and the clicked position at the end of the flight
   * @param {number} [duration] flight duration in seconds, computed from the distance when omitted
   * @param {import('@cesium/engine').EasingFunction.Callback} [easingFunction=EasingFunction.SINUSOIDAL_IN_OUT]
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
    this.active_ = false;

    /**
     * @type {ReturnType<import('@cesium/engine').ScreenSpaceEventHandler['getInputAction']> | undefined}
     */
    this.previousAction_ = undefined;
    this.onInputAction_ = this.onInputAction.bind(this);
  }

  get active() {
    return this.active_;
  }

  set active(active) {
    if (active === this.active_) {
      return;
    }
    this.active_ = active;
    const handler = this.viewer.screenSpaceEventHandler;
    if (active) {
      this.previousAction_ = handler.getInputAction(this.eventType);
      handler.setInputAction(this.onInputAction_, this.eventType);
    } else if (this.previousAction_) {
      handler.setInputAction(this.previousAction_, this.eventType);
    } else {
      handler.removeInputAction(this.eventType);
    }
  }

  /**
   * @param {import('@cesium/engine').ScreenSpaceEventHandler.PositionedEvent} movement
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
    const enu = Transforms.eastNorthUpToFixedFrame(target, scene.ellipsoid, enuScratch);
    const local = Matrix4.multiplyByPointAsVector(Matrix4.inverseTransformation(enu, enu), toTarget, toTarget);
    Cartesian3.normalize(local, local);
    const heading = Math.atan2(local.x, local.y);
    const pitch = Math.asin(local.z);

    camera.flyToBoundingSphere(new BoundingSphere(target, 0), {
      // when already closer than the range, get halfway to the target
      offset: new HeadingPitchRange(heading, pitch, distance > this.range ? this.range : distance / 2),
      ...(this.duration === undefined ? {} : {duration: this.duration}),
      easingFunction: this.easingFunction,
    });
  }
}
