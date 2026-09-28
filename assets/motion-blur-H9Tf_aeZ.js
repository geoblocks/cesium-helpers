import{T as e,b as t,w as n,x as r}from"./cesium-shim-deYMRcZt.js";var i=class{constructor(e){this.viewer=e,this.stage_=void 0}get active(){return this.stage_!==void 0}set active(e){let t=this.viewer.scene;if(e){if(this.stage_)return;this.stage_=this.createStage_(t),t.postProcessStages.add(this.stage_),this.activated_(t)}else{if(!this.stage_)return;this.deactivating_(t),t.postProcessStages.remove(this.stage_),this.stage_=void 0}t.requestRender()}createStage_(e){throw Error(`${this.constructor.name} does not implement createStage_`)}activated_(e){}deactivating_(e){}destroy(){this.active=!1}},a=`// random in [0, 1) for a point, without sin, which GPUs compute poorly for large numbers
float hash(vec2 p) {
  vec3 p3 = fract(p.xyx * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// per pixel noise in [0, 1), "interleaved gradient noise" (Jimenez 2014): a dither that
// spreads the sample positions of a blur between neighbouring pixels
float pixelNoise(vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}
`,o=new WeakMap;function s(e){let t=e.globe;if(!t)return;let n=o.get(t);if(n){n.count++;return}o.set(t,{count:1,previous:t.depthTestAgainstTerrain}),t.depthTestAgainstTerrain=!0}function c(e){let t=e.globe,n=t&&o.get(t);t&&n&&--n.count===0&&(t.depthTestAgainstTerrain=n.previous,o.delete(t))}var l=`// Eye coordinates of the pixel at uv, from the depth texture; w is 0 for the sky. With a
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
`,u=`// Camera motion blur, after "A Reconstruction Filter for Plausible Motion Blur" (McGuire et al.,
// I3D 2012). Only the camera moves, so each pixel's motion follows from its depth and the
// reprojection into the previous frame, computed once per pixel into the velocity buffer of
// MotionBlurVelocity.glsl. The blur gathers jittered samples along the pixel's motion, weighted
// by depth so that near terrain and far ridges or sky do not smear into each other.
uniform sampler2D colorTexture;
// xy: half the blur, as a fraction of the viewport; z: the distance from the camera
uniform sampler2D velocityTexture;
in vec2 v_textureCoordinates;

const int SAMPLES = 16;
// depth difference, relative to the depth, over which a sample goes from in front to behind
const float SOFT_DEPTH = 0.1;


// xy: half the blur of the pixel at uv, in pixels; z: its distance from the camera
vec3 halfBlurAt(vec2 uv) {
  vec3 velocity = texture(velocityTexture, uv).xyz;
  return vec3(velocity.xy * czm_viewport.zw, velocity.z);
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
  float jitter = pixelNoise(gl_FragCoord.xy) - 0.5;
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
`,d=`// The velocity buffer of the motion blur, at a fraction of the resolution: each pixel's half
// blur, as a fraction of the viewport, and its distance from the camera. Computed once per
// pixel here rather than once per sample in the gather. Needs EyeFromDepth.
uniform sampler2D depthTexture;
// current eye coordinates to the previous frame's clip coordinates, computed in double
// precision on the CPU
uniform mat4 reprojection;
// exposure time over the time since the previous frame: the blur spans the motion during the
// exposure, whatever the frame rate
uniform float exposureScale;
in vec2 v_textureCoordinates;

// longest blur, as a fraction of the viewport height
const float MAX_BLUR = 0.05;

void main() {
  // the sky is a direction: only the camera rotation moves it
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec4 previous = reprojection * eye;
  vec2 motion = previous.w > 0.0 ? v_textureCoordinates - (previous.xy / previous.w * 0.5 + 0.5) : vec2(0.0);
  motion *= exposureScale;
  // the clamp is resolution independent: the ratio to the viewport height is the same at any scale
  vec2 pixels = motion * czm_viewport.zw;
  float extent = length(pixels);
  float maxExtent = MAX_BLUR * czm_viewport.w;
  if (extent > maxExtent) {
    motion *= maxExtent / extent;
  }
  out_FragColor = vec4(0.5 * motion, eye.w == 0.0 ? 1e30 : length(eye.xyz), 1.0);
}
`,f=class extends i{constructor(e,n={}){super(e),this.strength_=n.strength??1,this.exposure_=n.exposure??1/24,this.previousViewProjection_=new t,this.reprojection_=new t,this.previousTime_=0,this.onPostRender_=()=>{let e=this.viewer.scene.camera;t.multiply(e.frustum.projectionMatrix,e.viewMatrix,this.previousViewProjection_),this.previousTime_=performance.now()}}createStage_(i){let o=new n({name:`czm_motion_blur_velocity`,fragmentShader:l+d,uniforms:{reprojection:()=>t.multiply(this.previousViewProjection_,i.camera.inverseViewMatrix,this.reprojection_),exposureScale:()=>this.strength_*this.exposure_/Math.min(Math.max((performance.now()-this.previousTime_)/1e3,1/240),1/10)},textureScale:.5,pixelDatatype:r.FLOAT}),s=new e({stages:[o,new n({fragmentShader:a+u,uniforms:{velocityTexture:o.name}})],inputPreviousStageTexture:!1});return s.enabled=this.strength_>0,s}activated_(e){s(e),this.onPostRender_(),e.postRender.addEventListener(this.onPostRender_)}deactivating_(e){e.postRender.removeEventListener(this.onPostRender_),c(e)}get strength(){return this.strength_}set strength(e){this.strength_=e,this.stage_&&(this.stage_.enabled=e>0),this.viewer.scene.requestRender()}get exposure(){return this.exposure_}set exposure(e){this.exposure_=e,this.viewer.scene.requestRender()}};export{a,c as i,l as n,i as o,s as r,f as t};