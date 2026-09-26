import {Math as CesiumMath, PostProcessStage} from '@cesium/engine';
import {acquireTerrainDepth, releaseTerrainDepth} from './depth-test.js';
import Effect from './effect.js';
import Beam from './shaders/Beam.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Filmic from './shaders/Filmic.js';
import FlashlightShader from './shaders/Flashlight.js';
import Hash from './shaders/Hash.js';
import Noise from './shaders/Noise.js';
import Normal from './shaders/Normal.js';

/**
 * A torch held to the right of and below the eye, pointing where the camera
 * looks: a narrow hotspot and a wide, dim spill, fading with distance, and
 * the hotspot's beam in the haze, raymarched from the corner of the picture
 * to the bright circle it makes, the rest darkens.
 */
export default class Flashlight extends Effect {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {{power?: number, angle?: number, range?: number, darkness?: number, beam?: number, beamAngle?: number, beamWidth?: number, beamReach?: number, beamDensity?: number, beamAnisotropy?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.power_ = options.power ?? 1;
    this.angle_ = options.angle ?? 20;
    this.range_ = options.range ?? 40;
    this.darkness_ = options.darkness ?? 0.9;
    this.beam_ = options.beam ?? 0.5;
    this.beamAngle_ = options.beamAngle ?? 5;
    this.beamWidth_ = options.beamWidth ?? 0.02;
    this.beamReach_ = options.beamReach ?? 80;
    this.beamDensity_ = options.beamDensity ?? 2.5;
    this.beamAnisotropy_ = options.beamAnisotropy ?? 0.6;
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} _scene
   */
  createStage_(_scene) {
    return new PostProcessStage({
      fragmentShader: EyeFromDepth + Hash + Noise + Normal + Beam + Filmic + FlashlightShader,
      uniforms: {
        power: () => this.power_,
        angle: () => CesiumMath.toRadians(this.angle_),
        range: () => this.range_,
        darkness: () => this.darkness_,
        beam: () => this.beam_,
        beamAngle: () => CesiumMath.toRadians(this.beamAngle_),
        beamWidth: () => this.beamWidth_,
        beamReach: () => this.beamReach_,
        beamDensity: () => this.beamDensity_,
        beamAnisotropy: () => this.beamAnisotropy_,
      },
    });
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  activated_(scene) {
    acquireTerrainDepth(scene);
  }

  /**
   * @override
   * @param {import('@cesium/engine').Scene} scene
   */
  deactivating_(scene) {
    releaseTerrainDepth(scene);
  }

  /**
   * Brightness of the LED, 1 for a pocket torch: the pool on the scene and
   * the beam in the air scale with it.
   */
  get power() {
    return this.power_;
  }

  set power(value) {
    this.power_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Half angle of the cone of the spill, in degrees.
   */
  get angle() {
    return this.angle_;
  }

  set angle(value) {
    this.angle_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Distance at which the light has fallen to a half, in meters.
   */
  get range() {
    return this.range_;
  }

  set range(value) {
    this.range_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Darkening and desaturation outside the light, 0 to 1.
   */
  get darkness() {
    return this.darkness_;
  }

  set darkness(value) {
    this.darkness_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Brightness of the beam in the air, 0 to 1.
   */
  get beam() {
    return this.beam_;
  }

  set beam(value) {
    this.beam_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Half angle of the hotspot, in degrees: the bright core of the pool, and
   * the beam's shaft in the air, which is that light on its way.
   */
  get beamAngle() {
    return this.beamAngle_;
  }

  set beamAngle(value) {
    this.beamAngle_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Radius of the beam's shaft at the torch, in meters: with the angle, it
   * places the virtual source the shaft comes from.
   */
  get beamWidth() {
    return this.beamWidth_;
  }

  set beamWidth(value) {
    this.beamWidth_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * How far the beam lights the haze, in meters.
   */
  get beamReach() {
    return this.beamReach_;
  }

  set beamReach(value) {
    this.beamReach_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Brightness of the lit haze.
   */
  get beamDensity() {
    return this.beamDensity_;
  }

  set beamDensity(value) {
    this.beamDensity_ = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Henyey-Greenstein asymmetry of the haze, 0 to 1: it scatters mostly
   * forward, so the beam is brightest looking along it.
   */
  get beamAnisotropy() {
    return this.beamAnisotropy_;
  }

  set beamAnisotropy(value) {
    this.beamAnisotropy_ = value;
    this.viewer.scene.requestRender();
  }
}
