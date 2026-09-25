import { CameraEventType, PostProcessStage, ScreenSpaceEventType, Math as CesiumMath } from "@cesium/engine";

// The eyepieces, two overlapping circles in a 160x100 box fitted to the canvas, black around
// them. Inside, lens effects: a slight fisheye and color fringes toward the rim, and the warm
// tint of the coatings. Picking ignores the fisheye, so near the rim the picked point is a
// little off what is shown.
const LENS_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

const vec2 BOX = vec2(160.0, 100.0);
const vec2 LEFT = vec2(52.0, 50.0);
const vec2 RIGHT = vec2(108.0, 50.0);
const float RADIUS = 46.0;
// half width of the soft edge of the eyepieces, in box units
const float EDGE = 2.0;
// the effects only apply within this distance of the rim, in box units, so the middle of the
// view, where the eyepieces overlap, stays clean
const float BAND = 20.0;
// fisheye: on the rim, sample up to this fraction further from the center
const float FISHEYE = 0.07;
// color fringe on the rim, in box units
const float FRINGE = 1.0;

// offsets in box units for one eyepiece: xy the fisheye, zw the color fringe
vec4 lensOffsets(vec2 toCenter) {
  float fromCenter = length(toCenter);
  // 0 up to the band, 1 on the rim
  float rim = 1.0 - clamp((RADIUS - fromCenter) / BAND, 0.0, 1.0);
  vec2 direction = toCenter / max(fromCenter, 1e-3);
  return vec4(toCenter * FISHEYE * rim * rim, direction * FRINGE * rim * rim * rim);
}

void main() {
  vec2 size = czm_viewport.zw;
  float scale = min(size.x / BOX.x, size.y / BOX.y);
  vec2 position = (v_textureCoordinates * size - 0.5 * (size - scale * BOX)) / scale;
  vec2 toLeft = position - LEFT;
  vec2 toRight = position - RIGHT;

  vec4 left = lensOffsets(toLeft);
  vec4 right = lensOffsets(toRight);
  // blend the two eyepieces where they overlap, so there is no seam between them
  float weight = smoothstep(-6.0, 6.0, length(toRight) - length(toLeft));
  vec4 offsets = mix(right, left, weight) * scale / vec4(size, size);

  vec2 uv = v_textureCoordinates + offsets.xy;
  vec4 center = texture(colorTexture, uv);
  vec3 color = vec3(
    texture(colorTexture, uv + offsets.zw).r,
    center.g,
    texture(colorTexture, uv - offsets.zw).b
  );
  color *= vec3(1.0, 0.98, 0.93);
  float open = 1.0 - smoothstep(RADIUS - EDGE, RADIUS + EDGE, min(length(toLeft), length(toRight)));
  out_FragColor = vec4(color * open, center.a);
}
`;

export default class CesiumBinoculars {
  /**
   * @param {import('@cesium/engine').CesiumWidget} viewer
   * @param {number} [zoomFactor] magnification per mouse wheel notch
   * @param {number} [maxMagnification]
   */
  constructor(viewer, zoomFactor = 1.25, maxMagnification = 20) {
    this.viewer = viewer;
    this.zoomFactor_ = zoomFactor;
    this.maxMagnification = maxMagnification;
    this.originalFov_ = undefined;
    this.active_ = false;

    /**
     * @type {Pick<import('@cesium/engine').ScreenSpaceCameraController, 'enableZoom' | 'enableRotate' | 'enableTilt' | 'lookEventTypes'> | undefined}
     */
    this.previousController_ = undefined;
    /**
     * @type {ReturnType<import('@cesium/engine').ScreenSpaceEventHandler['getInputAction']> | undefined}
     */
    this.previousAction_ = undefined;
    /** @type {PostProcessStage | undefined} */
    this.lens_ = undefined;
    this.onPreRender_ = this.onPreRender.bind(this);
    this.onMouseWheel_ = this.onMouseWheel.bind(this);
  }

  get active() {
    return this.active_;
  }

  set active(active) {
    if (active === this.active_) {
      return;
    }
    this.active_ = active;
    const controller = this.viewer.scene.screenSpaceCameraController;
    const handler = this.viewer.screenSpaceEventHandler;
    if (active) {
      this.originalFov_ = this.frustum_.fov;
      const {enableZoom, enableRotate, enableTilt, lookEventTypes} = controller;
      this.previousController_ = {enableZoom, enableRotate, enableTilt, lookEventTypes};
      // stand still: a drag turns the camera in place instead of moving it around the globe
      controller.enableZoom = false;
      controller.enableRotate = false;
      controller.enableTilt = false;
      controller.lookEventTypes = CameraEventType.LEFT_DRAG;
      this.previousAction_ = handler.getInputAction(ScreenSpaceEventType.WHEEL);
      handler.setInputAction(this.onMouseWheel_, ScreenSpaceEventType.WHEEL);
      this.lens_ = new PostProcessStage({fragmentShader: LENS_SHADER});
      this.viewer.scene.postProcessStages.add(this.lens_);
      this.viewer.scene.preRender.addEventListener(this.onPreRender_);
    } else {
      this.viewer.scene.preRender.removeEventListener(this.onPreRender_);
      // removing a stage also destroys it
      this.viewer.scene.postProcessStages.remove(/** @type {PostProcessStage} */ (this.lens_));
      this.lens_ = undefined;
      this.frustum_.fov = this.originalFov_;
      Object.assign(controller, this.previousController_);
      if (this.previousAction_) {
        handler.setInputAction(this.previousAction_, ScreenSpaceEventType.WHEEL);
      } else {
        handler.removeInputAction(ScreenSpaceEventType.WHEEL);
      }
    }
    // requestRenderMode: adding or removing the lens stage does not request a render
    this.viewer.scene.requestRender();
  }

  get frustum_() {
    return /** @type {import('@cesium/engine').PerspectiveFrustum} */ (this.viewer.scene.camera.frustum);
  }

  /**
   * Magnification relative to the field of view when the binoculars were activated, 1 when inactive.
   * The magnification is proportional to 1 / tan(fov / 2).
   */
  get magnification() {
    if (!this.active_) {
      return 1;
    }
    return Math.tan(/** @type {number} */ (this.originalFov_) / 2) / Math.tan(/** @type {number} */ (this.frustum_.fov) / 2);
  }

  /**
   * Only applies while active; clamped between 1 and maxMagnification.
   */
  set magnification(magnification) {
    if (!this.active_) {
      return;
    }
    const clamped = CesiumMath.clamp(magnification, 1, this.maxMagnification);
    this.frustum_.fov = 2 * Math.atan(Math.tan(/** @type {number} */ (this.originalFov_) / 2) / clamped);
  }

  /**
   * In 3D, Cesium's look turns the camera around its own axes, which rolls the view: keep the horizon level.
   */
  onPreRender() {
    const camera = this.viewer.scene.camera;
    if (Math.abs(CesiumMath.negativePiToPi(camera.roll)) > CesiumMath.EPSILON6) {
      camera.setView({orientation: {heading: camera.heading, pitch: camera.pitch, roll: 0}});
    }
  }

  /**
   * @param {number} delta 120 per mouse wheel notch, positive to zoom in; trackpads send smaller values
   */
  onMouseWheel(delta) {
    this.magnification *= Math.pow(this.zoomFactor_, delta / 120);
  }
}
