var e=class{constructor(e){this.viewer=e,this.stage_=void 0}get active(){return this.stage_!==void 0}set active(e){let t=this.viewer.scene;if(e){if(this.stage_)return;this.stage_=this.createStage_(t),t.postProcessStages.add(this.stage_),this.activated_(t)}else{if(!this.stage_)return;this.deactivating_(t),t.postProcessStages.remove(this.stage_),this.stage_=void 0}t.requestRender()}createStage_(e){throw Error(`${this.constructor.name} does not implement createStage_`)}activated_(e){}deactivating_(e){}destroy(){this.active=!1}},t=`// random in [0, 1) for a point, without sin, which GPUs compute poorly for large numbers
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
`,n=new WeakMap;function r(e){let t=e.globe;if(!t)return;let r=n.get(t);if(r){r.count++;return}n.set(t,{count:1,previous:t.depthTestAgainstTerrain}),t.depthTestAgainstTerrain=!0}function i(e){let t=e.globe,r=t&&n.get(t);t&&r&&--r.count===0&&(t.depthTestAgainstTerrain=r.previous,n.delete(t))}var a=`// Eye coordinates of the pixel at uv, from the depth texture; w is 0 for the sky. With a
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

// the distance to the pixel at uv, in meters, and the sky as far as a given distance
float eyeDistance(sampler2D depthTexture, vec2 uv, float skyDistance) {
  vec4 eye = eyeAt(depthTexture, uv);
  return eye.w == 0.0 ? skyDistance : length(eye.xyz);
}
`;export{e as a,t as i,r as n,i as r,a as t};