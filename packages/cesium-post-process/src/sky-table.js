// @ts-expect-error the engine exports its textures, framebuffers and render states, but does not type them
import {Framebuffer, RenderState, Texture} from '@cesium/engine';
import CloudLight from './shaders/CloudLight.js';
import Fog from './shaders/Fog.js';
import Height from './shaders/Height.js';
import Phase from './shaders/Phase.js';
import RainHaze from './shaders/RainHaze.js';
import SkyTableShader from './shaders/SkyTable.js';

/** @import {Scene} from '@cesium/engine' */

// the table's texels toward the horizon, besides the one overhead, RainHaze.glsl's SKY_TABLE
const SKY_TABLE = 64;

/**
 * The clear sky an effect's haze or fog scatters, drawn into a small table at each frame rather than
 * computed for each pixel (SkyTable.glsl), for RainHaze.glsl's skyFromTable and zenithFromTable:
 * toward the horizon at the azimuths from the sun's to its opposite, and overhead, seen from no
 * higher than a height.
 */
export default class SkyTable {
  #height;
  /** @type {any} */
  #texture = undefined;
  /** @type {any} */
  #framebuffer = undefined;
  /** @type {any} */
  #command = undefined;

  /**
   * @param {() => number} height the sky is seen from no higher than this, in meters above the ellipsoid
   */
  constructor(height) {
    this.#height = height;
  }

  /**
   * Draws the table, before the effect's stages run.
   * @param {Scene} scene
   */
  draw(scene) {
    // @ts-expect-error the scene's context is not typed
    const context = scene.context;
    if (!context) {
      return;
    }
    if (!this.#texture) {
      this.#texture = new Texture({context, width: SKY_TABLE + 1, height: 1});
      this.#framebuffer = new Framebuffer({context, colorTextures: [this.#texture], destroyAttachments: false});
      this.#command = context.createViewportQuadCommand(Height + Fog + Phase + CloudLight + RainHaze + SkyTableShader, {
        framebuffer: this.#framebuffer,
        renderState: RenderState.fromCache({viewport: {x: 0, y: 0, width: SKY_TABLE + 1, height: 1}}),
        uniformMap: {
          skyLightIntensity: () => scene.skyAtmosphere?.atmosphereLightIntensity ?? 50,
          viewHeight: this.#height,
        },
      });
    }
    this.#command.execute(context);
  }

  /**
   * The table, RainHaze.glsl's skyTable: the context's default texture before it is drawn.
   * @param {Scene} scene
   */
  texture(scene) {
    // @ts-expect-error the scene's context is not typed
    return this.#texture ?? scene.context.defaultTexture;
  }

  destroy() {
    this.#command?.shaderProgram?.destroy();
    this.#command = undefined;
    this.#framebuffer = this.#framebuffer?.destroy();
    this.#texture = this.#texture?.destroy();
  }
}
