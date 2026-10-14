var e=class{constructor(e){this.viewer=e,this.stage_=void 0}get active(){return this.stage_!==void 0}set active(e){let t=this.viewer.scene;if(e){if(this.stage_)return;this.stage_=this.createStage_(t),t.postProcessStages.add(this.stage_),this.activated_(t)}else{if(!this.stage_)return;this.deactivating_(t),t.postProcessStages.remove(this.stage_),this.stage_=void 0}t.requestRender()}createStage_(e){throw Error(`${this.constructor.name} does not implement createStage_`)}activated_(e){}deactivating_(e){}destroy(){this.active=!1}},t=new WeakMap;function n(e){let n=e.globe;if(!n)return;let r=t.get(n);r?r.count++:(t.set(n,{count:1,previous:n.depthTestAgainstTerrain}),n.depthTestAgainstTerrain=!0)}function r(e){let n=e.globe,r=n&&t.get(n);n&&r&&--r.count===0&&(n.depthTestAgainstTerrain=r.previous,t.delete(n))}var i=`// Eye coordinates of the pixel at uv, from the depth texture; w is 0 for the sky. With a
// logarithmic depth buffer, czm_readDepth's perspective depth is about 1 beyond a few meters,
// so the distance is decoded from the logarithmic depth directly. An orthographic camera's depth
// is linear between the near and far planes Cesium fits to the scene each frame, not the
// projection's, and its rays are parallel; Cesium gives it no inverse projection (zero).

// A sampler's default precision is low: some phones' GPUs (Mali) then read the depth as a half float,
// steps of centimeters a few hundred meters away.
precision highp sampler2D;

vec4 eyeAt(sampler2D depthTexture, vec2 uv) {
  float raw = texture(depthTexture, uv).r;
  if (czm_orthographicIn3D == 1.0) {
    vec2 xy = (2.0 * uv - 1.0 - czm_projection[3].xy) / vec2(czm_projection[0][0], czm_projection[1][1]);
    return raw >= 1.0 ? vec4(0.0, 0.0, -1.0, 0.0) : vec4(xy, -mix(czm_currentFrustum.x, czm_currentFrustum.y, raw), 1.0);
  }
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
`;export{e as i,n,r,i as t};