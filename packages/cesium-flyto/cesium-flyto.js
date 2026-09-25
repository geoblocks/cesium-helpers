import {
  BoundingSphere,
  Cartesian3,
  EasingFunction,
  HeadingPitchRange,
  Matrix4,
  PostProcessStage,
  PostProcessStageComposite,
  PostProcessStageLibrary,
  ScreenSpaceEventType,
  Transforms,
} from '@cesium/engine';

const directionScratch = new Cartesian3();
const enuScratch = new Matrix4();

// time for the flight effects to fade in and out, in seconds
const FADE_TIME = 0.5;
// motion blur exposure, in seconds: a 180 degree shutter at 24 frames per second, as in film
const EXPOSURE = 1 / 48;
// blur of the depth of field, the sigma of Cesium's blur stage
const FOCUS_BLUR = 2;

// Eye coordinates of the pixel at uv, from the depth texture; w is 0 for the sky. With a
// logarithmic depth buffer, czm_readDepth's perspective depth is about 1 beyond a few meters,
// so the distance is decoded from the logarithmic depth directly.
const EYE_FROM_DEPTH = `
vec4 eyeAt(sampler2D depthTexture, vec2 uv) {
  float raw = texture(depthTexture, uv).r;
  // the pixel's view ray, through the near plane
  vec4 ray = czm_inverseProjection * vec4(2.0 * uv - 1.0, -1.0, 1.0);
  ray.xyz /= ray.w;
  if (raw >= 1.0) {
    return vec4(normalize(ray.xyz), 0.0);
  }
#ifdef LOG_DEPTH
  float viewDepth = exp2(raw * czm_log2FarDepthFromNearPlusOne) - 1.0 + czm_currentFrustum.x;
#else
  vec4 eye = czm_inverseProjection * vec4(2.0 * uv - 1.0, 2.0 * raw - 1.0, 1.0);
  float viewDepth = -eye.z / eye.w;
#endif
  return vec4(ray.xyz * (viewDepth / -ray.z), 1.0);
}
`;

// Camera motion blur, after "A Reconstruction Filter for Plausible Motion Blur" (McGuire et al.,
// I3D 2012). Only the camera moves, so each pixel's motion follows from its depth and the
// reprojection into the previous frame, and there is no velocity buffer. The blur gathers
// jittered samples along the pixel's motion, weighted by depth so that near terrain and far
// ridges or sky do not smear into each other.
const MOTION_BLUR_SHADER = `
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// current eye coordinates to the previous frame's clip coordinates, computed in double
// precision on the CPU
uniform mat4 reprojection;
// exposure time over the time since the previous frame: the blur spans the motion during the
// exposure, whatever the frame rate
uniform float exposureScale;
in vec2 v_textureCoordinates;

const int SAMPLES = 16;
// longest blur, as a fraction of the viewport height
const float MAX_BLUR = 0.05;
// depth difference, relative to the depth, over which a sample goes from in front to behind
const float SOFT_DEPTH = 0.1;

${EYE_FROM_DEPTH}

// xy: half the blur of the pixel at uv, in pixels; z: its distance from the camera
vec3 halfBlurAt(vec2 uv) {
  // the sky is a direction: only the camera rotation moves it
  vec4 eye = eyeAt(depthTexture, uv);
  vec4 previous = reprojection * eye;
  vec2 motion = previous.w > 0.0 ? uv - (previous.xy / previous.w * 0.5 + 0.5) : vec2(0.0);
  // in pixels
  motion *= exposureScale * czm_viewport.zw;
  float extent = length(motion);
  float maxExtent = MAX_BLUR * czm_viewport.w;
  if (extent > maxExtent) {
    motion *= maxExtent / extent;
  }
  return vec3(0.5 * motion, eye.w == 0.0 ? 1e30 : length(eye.xyz));
}

// 1 when b is in front of a, 0 when it is SOFT_DEPTH behind
float inFront(float a, float b) {
  return clamp(1.0 - (b - a) / (SOFT_DEPTH * min(a, b)), 0.0, 1.0);
}

// the blur of a pixel with this half blur covers a sample this far away; the extents are kept
// above 0 for samples without blur
float cone(float gap, vec2 halfBlur) {
  return clamp(1.0 - gap / max(length(halfBlur), 1e-3), 0.0, 1.0);
}

// both pixels are blurred over the gap between them
float cylinder(float gap, vec2 halfBlur) {
  float extent = max(length(halfBlur), 1e-3);
  return 1.0 - smoothstep(0.95 * extent, 1.05 * extent, gap);
}

// per pixel noise in [0, 1), "interleaved gradient noise" (Jimenez 2014)
float noise(vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec3 center = halfBlurAt(v_textureCoordinates);
  vec2 halfBlur = center.xy;
  vec4 centerColor = texture(colorTexture, v_textureCoordinates);
  float extent = length(halfBlur);
  if (extent < 0.5) {
    out_FragColor = centerColor;
    return;
  }

  float weight = 1.0 / extent;
  vec4 color = centerColor * weight;
  // the jitter turns the banding of few samples into fine noise
  float jitter = noise(gl_FragCoord.xy) - 0.5;
  for (int i = 0; i < SAMPLES; i++) {
    float t = mix(-1.0, 1.0, (float(i) + jitter + 1.0) / float(SAMPLES + 1));
    vec2 uv = v_textureCoordinates + t * halfBlur / czm_viewport.zw;
    vec3 other = halfBlurAt(uv);
    float gap = abs(t) * extent;
    float front = inFront(center.z, other.z);
    float behind = inFront(other.z, center.z);
    // a sample in front counts when its own blur reaches this pixel, one behind when this
    // pixel's blur reaches it, and both when they are blurred together
    float alpha =
      front * cone(gap, other.xy) +
      behind * cone(gap, halfBlur) +
      2.0 * cylinder(gap, other.xy) * cylinder(gap, halfBlur);
    weight += alpha;
    color += alpha * texture(colorTexture, uv);
  }
  out_FragColor = color / weight;
}
`;

// Depth of field: sharp around the focal distance, the blurred image further off. Distances
// compare as ratios, like a lens: sharp within FOCUS_RANGE factors of two of the focal distance,
// fully blurred at twice that.
const DEPTH_OF_FIELD_SHADER = `
uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
uniform float focalDistance;
// 0 to 1, as the effect fades in and out
uniform float fade;
in vec2 v_textureCoordinates;

// in factors of two of the focal distance
const float FOCUS_RANGE = 0.8;

${EYE_FROM_DEPTH}

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  float fromCamera = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float blur = fade * smoothstep(FOCUS_RANGE, 2.0 * FOCUS_RANGE, abs(log2(fromCamera / focalDistance)));
  out_FragColor = mix(texture(colorTexture, v_textureCoordinates), texture(blurTexture, v_textureCoordinates), blur);
}
`;

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

    /** @type {PostProcessStage | undefined} */
    this.motionBlur_ = undefined;
    /** @type {PostProcessStageComposite | undefined} */
    this.depthOfField_ = undefined;
    // the depth of field focuses on the target of the flight
    this.target_ = new Cartesian3();
    this.previousDepthTestAgainstTerrain_ = false;
    // the effects fade in during a flight and out after it, then are removed
    this.fade_ = 0;
    this.fadeTarget_ = 0;
    this.fadeTime_ = 0;
    // the previous frame's view projection, and the reprojection uniform
    this.previousViewProjection_ = new Matrix4();
    this.reprojection_ = new Matrix4();
    // increments with each flight, so only the latest flight ends the blur
    this.flight_ = 0;
    this.previousTime_ = 0;
    this.onPreRender_ = this.onPreRender.bind(this);
    this.onPostRender_ = this.onPostRender.bind(this);
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

    Cartesian3.clone(target, this.target_);
    this.startEffects_();
    const flight = ++this.flight_;
    const end = () => {
      if (flight === this.flight_) {
        this.fadeTarget_ = 0;
        // requestRenderMode: keep rendering while the effects fade out
        this.viewer.scene.requestRender();
      }
    };
    camera.flyToBoundingSphere(new BoundingSphere(target, 0), {
      // when already closer than the range, get halfway to the target
      offset: new HeadingPitchRange(heading, pitch, distance > this.range ? this.range : distance / 2),
      ...(this.duration === undefined ? {} : {duration: this.duration}),
      easingFunction: this.easingFunction,
      complete: end,
      cancel: end,
    });
  }

  // motion blur and depth of field, during the flight
  startEffects_() {
    const scene = this.viewer.scene;
    this.fadeTarget_ = 1;
    if (this.motionBlur_ || !PostProcessStageLibrary.isDepthOfFieldSupported(scene)) {
      return;
    }
    this.fade_ = 0;
    this.fadeTime_ = performance.now();
    // the post-process stages only get the depth of the terrain when it is depth tested
    if (scene.globe) {
      this.previousDepthTestAgainstTerrain_ = scene.globe.depthTestAgainstTerrain;
      scene.globe.depthTestAgainstTerrain = true;
    }
    this.onPostRender();
    const blur = PostProcessStageLibrary.createBlurStage();
    this.depthOfField_ = new PostProcessStageComposite({
      stages: [
        blur,
        new PostProcessStage({
          fragmentShader: DEPTH_OF_FIELD_SHADER,
          uniforms: {
            blurTexture: blur.name,
            focalDistance: () => Cartesian3.distance(scene.camera.positionWC, this.target_),
            fade: () => this.fade_,
          },
        }),
      ],
      // both read the scene
      inputPreviousStageTexture: false,
      uniforms: blur.uniforms,
    });
    this.depthOfField_.uniforms.sigma = FOCUS_BLUR;
    scene.postProcessStages.add(this.depthOfField_);
    this.motionBlur_ = new PostProcessStage({
      fragmentShader: MOTION_BLUR_SHADER,
      uniforms: {
        reprojection: () =>
          Matrix4.multiply(this.previousViewProjection_, scene.camera.inverseViewMatrix, this.reprojection_),
        exposureScale: () =>
          (this.fade_ * EXPOSURE) / Math.max((performance.now() - this.previousTime_) / 1000, 1 / 240),
      },
    });
    scene.postProcessStages.add(this.motionBlur_);
    scene.preRender.addEventListener(this.onPreRender_);
    scene.postRender.addEventListener(this.onPostRender_);
  }

  stopEffects_() {
    const scene = this.viewer.scene;
    if (!this.motionBlur_) {
      return;
    }
    scene.preRender.removeEventListener(this.onPreRender_);
    scene.postRender.removeEventListener(this.onPostRender_);
    // removing a stage also destroys it
    scene.postProcessStages.remove(/** @type {PostProcessStage} */ (this.motionBlur_));
    scene.postProcessStages.remove(/** @type {PostProcessStageComposite} */ (this.depthOfField_));
    this.motionBlur_ = undefined;
    this.depthOfField_ = undefined;
    if (scene.globe) {
      scene.globe.depthTestAgainstTerrain = this.previousDepthTestAgainstTerrain_;
    }
    // requestRenderMode: render the last frame without the blur
    scene.requestRender();
  }

  onPreRender() {
    const now = performance.now();
    const step = (now - this.fadeTime_) / 1000 / FADE_TIME;
    this.fadeTime_ = now;
    if (this.fadeTarget_ > this.fade_) {
      this.fade_ = Math.min(this.fade_ + step, 1);
    } else if (this.fadeTarget_ < this.fade_) {
      this.fade_ = Math.max(this.fade_ - step, 0);
    }
    if (this.fade_ !== this.fadeTarget_) {
      this.viewer.scene.requestRender();
    }
  }

  onPostRender() {
    const camera = this.viewer.scene.camera;
    Matrix4.multiply(camera.frustum.projectionMatrix, camera.viewMatrix, this.previousViewProjection_);
    this.previousTime_ = performance.now();
    // faded out: remove the effects after the frame, not while it renders
    if (this.motionBlur_ && this.fadeTarget_ === 0 && this.fade_ === 0) {
      this.stopEffects_();
    }
  }
}
