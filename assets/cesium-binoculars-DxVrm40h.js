import"./lit-BFn1CURT.js";import"./card-58mEaPX-.js";import{t as e}from"./setup-DYuWPPM-.js";import{A as t,C as n,T as r,i,n as a,r as o,w as s,y as c}from"./cesium-shim-Dw5GLahM.js";import"./switch-BktEAscN.js";var l=`// Eye coordinates of the pixel at uv, from the depth texture; w is 0 for the sky. With a
// logarithmic depth buffer, czm_readDepth's perspective depth is about 1 beyond a few meters,
// so the distance is decoded from the logarithmic depth directly.
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
`,u=`// The eyepieces, two overlapping circles in a 160x100 box fitted to the canvas, black around
// them. Inside, lens effects: a slight fisheye and color fringes toward the rim, both stronger at
// high magnification, the light falling off and the image softening toward the rim, a depth of
// field focused on the middle of the view that gets shallower as the magnification grows, and the
// warm tint of the coatings. Optionally, a rangefinder reticle, a mil scale that grows with the
// magnification. Picking ignores the fisheye, so near the rim the picked point is a little off
// what is shown.
uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
uniform float magnification;
// 1 to draw the reticle, 0 not to
uniform float reticle;
// device pixels per milliradian, from the field of view
uniform float pixelsPerMil;
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
// fisheye: on the rim, sample up to this fraction further from the center, at 5x
const float FISHEYE = 0.07;
// color fringe on the rim, in box units, at 5x
const float FRINGE = 1.0;
// light lost on the rim of an eyepiece
const float VIGNETTE = 0.35;
// blur on the rim, off the optical axis
const float RIM_BLUR = 0.6;
// sharp within this many factors of two of the focal distance at 1x, narrower as 1 / magnification
const float FOCUS_RANGE = 2.0;

// ticks of the reticle closer than this, in CSS pixels, are left out for every 5th or 10th
const float MIN_TICK_SPACING = 6.0;
// ticks on each side of the middle, and the empty gap in the middle, in ticks
const float TICKS = 10.0;
const float GAP = 1.0;
// dark lines in a light halo, readable on dark forest as on snow
const vec4 RETICLE = vec4(0.05, 0.05, 0.05, 0.9);
const vec4 HALO = vec4(0.9, 0.9, 0.85, 0.6);

// coverage of a line this far from the pixel, width pixels wide
float line(float distance, float width) {
  return 1.0 - smoothstep(0.5 * width - 0.5, 0.5 * width + 0.5, distance);
}

// coverage of the reticle at a pixel, in device pixels from the middle of the view, with lines
// width device pixels wide: a cross of mil scales, ticks every 1, 5 or 10 mils, longer every 5th
float reticleAt(vec2 p, float width) {
  float minSpacing = MIN_TICK_SPACING * czm_pixelRatio;
  float spacing = pixelsPerMil;
  if (spacing < minSpacing) {
    spacing *= 5.0;
  }
  if (spacing < minSpacing) {
    spacing *= 2.0;
  }
  float coverage = 0.0;
  // one axis at a time: along is the distance along the scale, across the distance from it
  for (int axis = 0; axis < 2; axis++) {
    float along = axis == 0 ? p.x : p.y;
    float across = axis == 0 ? p.y : p.x;
    float fromMiddle = abs(along);
    if (fromMiddle < GAP * spacing || fromMiddle > TICKS * spacing + width) {
      continue;
    }
    float tick = floor(fromMiddle / spacing + 0.5);
    float tickLength = (mod(tick, 5.0) == 0.0 ? 6.0 : 3.0) * czm_pixelRatio + 0.5 * width;
    coverage = max(coverage, line(abs(across), width));
    if (abs(across) < tickLength) {
      coverage = max(coverage, line(abs(fromMiddle - tick * spacing), width));
    }
  }
  return coverage;
}

// offsets in box units for one eyepiece: xy the fisheye, zw the color fringe
vec4 lensOffsets(vec2 toCenter, float strength) {
  float fromCenter = length(toCenter);
  // 0 up to the band, 1 on the rim
  float rim = 1.0 - clamp((RADIUS - fromCenter) / BAND, 0.0, 1.0);
  vec2 direction = toCenter / max(fromCenter, 1e-3);
  return strength * vec4(toCenter * FISHEYE * rim * rim, direction * FRINGE * rim * rim * rim);
}

// the scene at uv, blurred by the depth of field around the focal distance and toward the rim
vec4 sampleAt(vec2 uv, float focalDistance, float rimBlur) {
  vec4 eye = eyeAt(depthTexture, uv);
  float fromCamera = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float range = FOCUS_RANGE / magnification;
  float defocus = focalDistance > 0.0
    ? smoothstep(range, 2.0 * range, abs(log2(fromCamera / focalDistance)))
    : 0.0;
  // no depth of field at 1x, fully from 3x
  defocus *= smoothstep(1.0, 3.0, magnification);
  return mix(texture(colorTexture, uv), texture(blurTexture, uv), max(defocus, rimBlur));
}

void main() {
  vec2 size = czm_viewport.zw;
  float scale = min(size.x / BOX.x, size.y / BOX.y);
  vec2 position = (v_textureCoordinates * size - 0.5 * (size - scale * BOX)) / scale;
  vec2 toLeft = position - LEFT;
  vec2 toRight = position - RIGHT;

  // cheap optics show their flaws more when zoomed in: 0.6 at 1x, 1 at 5x, 2 at 20x and beyond
  float strength = clamp(0.5 + magnification / 10.0, 0.6, 2.0);
  vec4 left = lensOffsets(toLeft, strength);
  vec4 right = lensOffsets(toRight, strength);
  // blend the two eyepieces where they overlap, so there is no seam between them
  float weight = smoothstep(-6.0, 6.0, length(toRight) - length(toLeft));
  vec4 offsets = mix(right, left, weight) * scale / vec4(size, size);

  // focused on what is in the middle of the view; the sky there is at infinity
  vec4 target = eyeAt(depthTexture, vec2(0.5));
  float focalDistance = target.w == 0.0 ? 0.0 : length(target.xyz);
  // 0 in the middle of an eyepiece, 1 on its rim
  float fromAxis = min(length(toLeft), length(toRight)) / RADIUS;
  float rimBlur = RIM_BLUR * smoothstep(0.6, 1.0, fromAxis);

  vec2 uv = v_textureCoordinates + offsets.xy;
  vec4 center = sampleAt(uv, focalDistance, rimBlur);
  vec3 color = vec3(
    sampleAt(uv + offsets.zw, focalDistance, rimBlur).r,
    center.g,
    sampleAt(uv - offsets.zw, focalDistance, rimBlur).b
  );
  color *= vec3(1.0, 0.98, 0.93);
  // the light falls off toward the field stop
  color *= 1.0 - VIGNETTE * smoothstep(0.5, 1.0, fromAxis);
  if (reticle > 0.0) {
    vec2 fromMiddle = gl_FragCoord.xy - 0.5 * size;
    color = mix(color, HALO.rgb, HALO.a * reticleAt(fromMiddle, 3.0 * czm_pixelRatio));
    color = mix(color, RETICLE.rgb, RETICLE.a * reticleAt(fromMiddle, czm_pixelRatio));
  }
  float open = 1.0 - smoothstep(RADIUS - EDGE, RADIUS + EDGE, min(length(toLeft), length(toRight)));
  out_FragColor = vec4(color * open, center.a);
}
`,d=3,f=new o,p=class{constructor(e,t=1.25,n=20){this.viewer=e,this.zoomFactor_=t,this.maxMagnification=n,this.originalFov_=void 0,this.active_=!1,this.previousController_=void 0,this.previousAction_=void 0,this.lens_=void 0,this.previousDepthTestAgainstTerrain_=!1,this.reticle_=!1,this.onPreRender_=this.onPreRender.bind(this),this.onMouseWheel_=this.onMouseWheel.bind(this)}get active(){return this.active_}set active(e){if(e===this.active_)return;this.active_=e;let n=this.viewer.scene.screenSpaceCameraController,r=this.viewer.screenSpaceEventHandler;if(e){this.originalFov_=this.frustum_.fov;let{enableZoom:e,enableRotate:i,enableTilt:o,lookEventTypes:s}=n;this.previousController_={enableZoom:e,enableRotate:i,enableTilt:o,lookEventTypes:s},n.enableZoom=!1,n.enableRotate=!1,n.enableTilt=!1,n.lookEventTypes=a.LEFT_DRAG,this.previousAction_=r.getInputAction(t.WHEEL),r.setInputAction(this.onMouseWheel_,t.WHEEL),this.addLens_(),this.viewer.scene.preRender.addEventListener(this.onPreRender_)}else this.viewer.scene.preRender.removeEventListener(this.onPreRender_),this.removeLens_(),this.frustum_.fov=this.originalFov_,Object.assign(n,this.previousController_),this.previousAction_?r.setInputAction(this.previousAction_,t.WHEEL):r.removeInputAction(t.WHEEL);this.viewer.scene.requestRender()}addLens_(){let e=this.viewer.scene;e.globe&&(this.previousDepthTestAgainstTerrain_=e.globe.depthTestAgainstTerrain,e.globe.depthTestAgainstTerrain=!0);let t=r.createBlurStage();this.lens_=new s({stages:[t,new n({fragmentShader:l+u,uniforms:{blurTexture:t.name,magnification:()=>this.magnification,reticle:()=>+!!this.reticle_,pixelsPerMil:()=>e.drawingBufferHeight/2/Math.tan(this.frustum_.fovy/2)*.001}})],inputPreviousStageTexture:!1,uniforms:t.uniforms}),this.lens_.uniforms.sigma=d,e.postProcessStages.add(this.lens_)}removeLens_(){let e=this.viewer.scene;e.postProcessStages.remove(this.lens_),this.lens_=void 0,e.globe&&(e.globe.depthTestAgainstTerrain=this.previousDepthTestAgainstTerrain_)}get reticle(){return this.reticle_}set reticle(e){this.reticle_=e,this.viewer.scene.requestRender()}get distance(){let e=this.viewer.scene;if(!this.active_||!e.pickPositionSupported)return;let t=e.canvas,n=o.fromElements(t.clientWidth/2,t.clientHeight/2,f),r=e.pickPosition(n);return r&&i.distance(e.camera.positionWC,r)}get frustum_(){return this.viewer.scene.camera.frustum}get magnification(){return this.active_?Math.tan(this.originalFov_/2)/Math.tan(this.frustum_.fov/2):1}set magnification(e){if(!this.active_)return;let t=c.clamp(e,1,this.maxMagnification);this.frustum_.fov=2*Math.atan(Math.tan(this.originalFov_/2)/t)}onPreRender(){let e=this.viewer.scene.camera;Math.abs(c.negativePiToPi(e.roll))>c.EPSILON6&&e.setView({orientation:{heading:e.heading,pitch:e.pitch,roll:0}})}onMouseWheel(e){this.magnification*=this.zoomFactor_**(e/120)}};e(`cesiumContainer`).then(e=>{let t=new Date;t.setHours(14,0,0,0),e.clock.currentTime=Cesium.JulianDate.fromDate(t),e.clock.shouldAnimate=!1;let n=new p(e),r=document.querySelector(`#activate`);r.addEventListener(`change`,()=>n.active=r.checked);let i=document.querySelector(`#reticle`);i.addEventListener(`change`,()=>n.reticle=i.checked);let a=document.querySelector(`#magnification`);e.scene.postRender.addEventListener(()=>{let e=n.reticle?n.distance:void 0,t=e===void 0?``:`  ${Math.round(e)} m`,r=n.active?`${n.magnification.toFixed(1)}x${t}`:``;a.textContent!==r&&(a.textContent=r)})});