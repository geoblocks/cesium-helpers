import{A as e,N as t,Y as n,a as r,j as i}from"./cesium-shim-BYdCjNyS.js";import{i as a,n as o,r as s,t as c}from"./EyeFromDepth-DmDC5MHh.js";import{t as l}from"./focus-QZ153sba.js";var u=`// The edges found in the depth, shared by Toy and WhiteModel, after EyeFromDepth: how far a pixel
// lies, how large a pixel is there, the depth's neighbors around it, how sharply it bends between
// them (a crease, not across a jump: an edge in front of something farther, nor the gentle bends
// between the terrain's triangles), the outline on the near side of a jump; the sky's gradient.
// its samplers read in high precision, whatever comes before (a phone's GPU's default is low)
precision highp sampler2D;
uniform sampler2D depthTexture;

// how much the depth bends, in pixels' sizes, to start and to end lighting an edge
const vec2 CREASE = vec2(0.6, 1.6);
// how far the depth jumps, in pixels' sizes, to be an edge in front of something farther, not a crease
uniform float jump;
// the bevel's widest, in pixels: its neighbors read that far at the most
const float BEVEL = 8.0;
// the sky's depth, far off
const float SKY = 1e9;

// how far the pixel at uv lies, in meters: in an orthographic view past its near plane, small
// numbers whose differences keep their precision (its camera thousands of meters back: some
// phones' GPUs, Mali, lose it subtracting depths that large), in a perspective one from the camera
float depthAt(vec2 uv) {
  if (czm_orthographicIn3D == 1.0) {
    float raw = texture(depthTexture, uv).r;
    return raw >= 1.0 ? SKY : raw * (czm_currentFrustum.y - czm_currentFrustum.x);
  }
  vec4 eye = eyeAt(depthTexture, uv);
  return eye.w == 0.0 ? SKY : -eye.z;
}

// a pixel's size in meters at a depth: an orthographic view's the same everywhere, a perspective's
// growing with the depth
float pixelAt(float depth) {
  return 2.0 / (czm_projection[0][0] * czm_viewport.z) * (czm_orthographicIn3D == 1.0 ? 1.0 : depth);
}

// the depths of the neighbors steps pixels away from uv, less its own c: right, left, up, down
vec4 neighborsAt(vec2 uv, float c, float steps) {
  vec2 o = steps / czm_viewport.zw;
  return vec4(depthAt(uv + vec2(o.x, 0.0)), depthAt(uv - vec2(o.x, 0.0)), depthAt(uv + vec2(0.0, o.y)), depthAt(uv - vec2(0.0, o.y))) - c;
}

// how sharply the depth bends between neighbors n a span of meters apart, from 0 to 1, none across
// a jump; convex where they lie farther than the middle, their sum positive
float creaseOf(vec4 n, float span, float pixel) {
  float far = max(max(abs(n.x), abs(n.y)), max(abs(n.z), abs(n.w)));
  return smoothstep(CREASE.x, CREASE.y, (abs(n.x + n.y) + abs(n.z + n.w)) / span) * (1.0 - step(jump * pixel, far));
}

// how far the surface beyond the pixel at uv lies behind it, in one direction o (a pixel's step): the two neighbours
// that way extrapolated back to the pixel, linearly in an orthographic view, where the depth is affine on the screen,
// in its reciprocal in a perspective one. A plane at any slope extrapolates exactly to the pixel, so a face seen at a
// grazing angle is never a jump, only a nearer thing standing in front of a farther one. The nearer of the extrapolation
// and the neighbour itself: beside a thin thing two pixels away, the extrapolation through it runs far behind the pixel
float farSide(vec2 uv, vec2 o, float c) {
  float d1 = depthAt(uv + o);
  float d2 = depthAt(uv + 2.0 * o);
  if (d1 == SKY) {
    return SKY;
  }
  if (czm_orthographicIn3D == 1.0) {
    return min(d1, d2 == SKY ? d1 : 2.0 * d1 - d2) - c;
  }
  float r = d2 == SKY ? 1.0 / d1 : 2.0 / d1 - 1.0 / d2;
  return (r <= 0.0 ? d1 : min(d1, 1.0 / r)) - c;
}

// the outline, a pixel wide, on the near side of a jump: the farthest of the four directions' surfaces behind the pixel,
// against the jump, anti-aliased over a quarter of it each way (n and steps, the creases' neighbours, unused here: the
// outline reads its own)
float outlineAt(vec2 uv, float c, vec4 n, float steps, float pixel) {
  vec2 texel = 1.0 / czm_viewport.zw;
  float farther = max(max(farSide(uv, vec2(texel.x, 0.0), c), farSide(uv, vec2(-texel.x, 0.0), c)),
    max(farSide(uv, vec2(0.0, texel.y), c), farSide(uv, vec2(0.0, -texel.y), c)));
  float limit = jump * pixel;
  return smoothstep(0.75 * limit, 1.25 * limit, farther);
}

// the sky's gradient at uv, from the top of the screen to its bottom
vec3 skyAt(vec2 uv, vec4 top, vec4 bottom) {
  return mix(bottom.rgb, top.rgb, smoothstep(0.0, 1.0, uv.y));
}
`;function d(r,a=1){let o=[`x`,`y`].map((i,o)=>new e({name:`${r}_${i}`,fragmentShader:`#define USE_STEP_SIZE\n${n}`,uniforms:{delta:1,sigma:2,stepSize:1,direction:o},sampleMode:t.LINEAR,textureScale:a})),s=e=>({get:()=>o[0].uniforms[e],set:t=>{for(let n of o)n.uniforms[e]=t}});return new i({name:r,stages:o,uniforms:Object.defineProperties({},{sigma:s(`sigma`),stepSize:s(`stepSize`)})})}var f=`// Tilt-shift: a narrow band of sharpness around the focal distance and the blurred image further
// off, with the punchy colors of miniature photographs. Distances compare as ratios, like a lens:
// sharp within range factors of two of the focal distance, fully blurred at twice that. An
// orthographic camera has no distance to compare: a band across the screen, as a miniature's fake,
// sharp within range of the view's height above and below the focus, whatever stands there.
precision highp sampler2D;
uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// in factors of two of the focal distance, or shares of the view's height (orthographic)
uniform float range;
// 0 to 1
uniform float saturation;
in vec2 v_textureCoordinates;

void main() {
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  float fromCamera = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  // the orthographic view's height: its projection's y scale is 2 over it
  float off = czm_orthographicIn3D == 1.0
    ? abs(eye.y - target.y) * czm_projection[1][1] / 2.0
    : abs(log2(fromCamera / length(target.xyz)));
  // no blur without a focus in front of the camera (the sky in the middle, a focus behind)
  float blur = target.w > 0.0 && target.z < 0.0 ? smoothstep(range, 2.0 * range, off) : 0.0;
  vec4 sceneColor = mix(texture(colorTexture, v_textureCoordinates), texture(blurTexture, v_textureCoordinates), blur);

  vec3 color = sceneColor.rgb;
  color = czm_saturation(color, 1.0 + saturation);
  color = mix(color, smoothstep(0.0, 1.0, color), saturation);
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
`,p=new r,m=class extends a{constructor(e,t={}){super(e),this.focus_=t.focus,this.range_=t.range??.3,this.blur_=t.blur??4,this.saturation_=t.saturation??.3}createStage_(t){let n=d(`czm_tilt_shift_blur`),r=new i({stages:[n,new e({fragmentShader:c+f,uniforms:{blurTexture:n.name,focus:()=>l(t,this.focus_,p),range:()=>this.range_,saturation:()=>this.saturation_}})],inputPreviousStageTexture:!1,uniforms:n.uniforms});return r.uniforms.sigma=this.blur_,r}activated_(e){o(e)}deactivating_(e){s(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get blur(){return this.blur_}set blur(e){this.blur_=e,this.stage_&&(this.stage_.uniforms.sigma=e),this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}};export{d as n,u as r,m as t};