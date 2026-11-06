import {Cartesian4, PixelDatatype} from '@cesium/core';
import {PostProcessStage, PostProcessStageComposite} from '@cesium/engine';
import Effect from './effect.js';
import {eyeFocus} from './focus.js';
import {heightUniforms} from './height.js';
import Beam from './shaders/Beam.js';
import EyeFromDepth from './shaders/EyeFromDepth.js';
import Filmic from './shaders/Filmic.js';
import Hash from './shaders/Hash.js';
import Noise from './shaders/Noise.js';
import Normal from './shaders/Normal.js';
import SpotlightShader from './shaders/Spotlight.js';
import SpotlightBeam from './shaders/SpotlightBeam.js';
import SpotlightBeamBlur from './shaders/SpotlightBeamBlur.js';
import SpotlightCone from './shaders/SpotlightCone.js';

/** @import {Focus} from './focus.js' */
/** @import {CesiumWidget, Scene} from '@cesium/engine' */

const focusScratch = new Cartesian4();

/**
 * A searchlight above the focus, pointing down: it throws a pool of warm
 * light on the scene, shades the relief under it and lights up the haze in
 * its beam, the rest darkens.
 */
export default class Spotlight extends Effect {
  #focus;
  #power;
  #radius;
  #softness;
  #darkness;
  #beam;
  #beamAnisotropy;

  /**
   * @param {CesiumWidget} viewer
   * @param {{focus?: Focus, power?: number, radius?: number, softness?: number, darkness?: number, beam?: number, beamAnisotropy?: number}} [options]
   */
  constructor(viewer, options = {}) {
    super(viewer);
    this.terrainDepth_ = true;
    this.#focus = options.focus;
    this.#power = options.power ?? 1;
    this.#radius = options.radius ?? 200;
    this.#softness = options.softness ?? 0.5;
    this.#darkness = options.darkness ?? 0.8;
    this.#beam = options.beam ?? 0.25;
    this.#beamAnisotropy = options.beamAnisotropy ?? 0.4;
  }

  /**
   * @override
   * @protected
   * @param {Scene} scene
   */
  createStage_(scene) {
    // SpotlightCone's uniforms, for all the passes
    const cone = {
      focus: () => eyeFocus(scene, this.#focus, focusScratch),
      up: heightUniforms(scene).up,
      radius: () => this.#radius,
      softness: () => this.#softness,
    };
    // the beam is raymarched at half the resolution, then blurred at it
    const beam = new PostProcessStage({
      fragmentShader: EyeFromDepth + Hash + Noise + SpotlightCone + Beam + SpotlightBeam,
      uniforms: {
        ...cone,
        beam: () => this.#beam,
        beamAnisotropy: () => this.#beamAnisotropy,
      },
      textureScale: 0.5,
      pixelDatatype: PixelDatatype.HALF_FLOAT,
    });
    const blurredBeam = new PostProcessStage({
      fragmentShader: SpotlightBeamBlur,
      uniforms: {beamTexture: beam.name},
      textureScale: 0.5,
      pixelDatatype: PixelDatatype.HALF_FLOAT,
    });
    return new PostProcessStageComposite({
      stages: [
        beam,
        blurredBeam,
        new PostProcessStage({
          fragmentShader: EyeFromDepth + Normal + Filmic + SpotlightCone + SpotlightShader,
          uniforms: {
            ...cone,
            beamTexture: blurredBeam.name,
            darkness: () => this.#darkness,
            beam: () => this.#beam,
            power: () => this.#power,
          },
        }),
      ],
      // the light is drawn over the scene, not over the beam
      inputPreviousStageTexture: false,
    });
  }

  /**
   * What to light: a position, a function returning one, or undefined for
   * what is in the middle of the screen.
   */
  get focus() {
    return this.#focus;
  }

  set focus(value) {
    this.#focus = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Brightness of the light, 1 for the searchlight: the pool on the scene
   * and the beam in the air scale with it.
   */
  get power() {
    return this.#power;
  }

  set power(value) {
    this.#power = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Radius of the pool of light on flat ground, in meters. The light hangs
   * twice as high above the focus.
   */
  get radius() {
    return this.#radius;
  }

  set radius(value) {
    this.#radius = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Width of the penumbra, as a fraction of the radius.
   */
  get softness() {
    return this.#softness;
  }

  set softness(value) {
    this.#softness = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Darkening outside the light, 0 to 1.
   */
  get darkness() {
    return this.#darkness;
  }

  set darkness(value) {
    this.#darkness = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Brightness of the beam in the air, 0 to 1.
   */
  get beam() {
    return this.#beam;
  }

  set beam(value) {
    this.#beam = value;
    this.viewer.scene.requestRender();
  }

  /**
   * Henyey-Greenstein asymmetry of the haze, 0 to 1: it scatters mostly
   * forward, so the beam is brighter when looking toward the light.
   */
  get beamAnisotropy() {
    return this.#beamAnisotropy;
  }

  set beamAnisotropy(value) {
    this.#beamAnisotropy = value;
    this.viewer.scene.requestRender();
  }
}
