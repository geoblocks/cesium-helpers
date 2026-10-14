import{G as e,O as t,a as n,j as r,k as i}from"./cesium-shim-e6hyQueX.js";import{i as a,n as o,r as s,t as c}from"./EyeFromDepth-DmDC5MHh.js";import{t as l}from"./focus-CEnpGAS5.js";function u(n,a=1){let o=[`x`,`y`].map((i,o)=>new t({name:`${n}_${i}`,fragmentShader:`#define USE_STEP_SIZE\n${e}`,uniforms:{delta:1,sigma:2,stepSize:1,direction:o},sampleMode:r.LINEAR,textureScale:a})),s=e=>({get:()=>o[0].uniforms[e],set:t=>{for(let n of o)n.uniforms[e]=t}});return new i({name:n,stages:o,uniforms:Object.defineProperties({},{sigma:s(`sigma`),stepSize:s(`stepSize`)})})}var d=`// Tilt-shift: a narrow band of sharpness around the focal distance and the blurred image further
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
  color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, 1.0 + saturation);
  color = mix(color, smoothstep(0.0, 1.0, color), saturation);
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
`,f=new n,p=class extends a{constructor(e,t={}){super(e),this.focus_=t.focus,this.range_=t.range??.3,this.blur_=t.blur??4,this.saturation_=t.saturation??.3}createStage_(e){let n=u(`czm_tilt_shift_blur`),r=new i({stages:[n,new t({fragmentShader:c+d,uniforms:{blurTexture:n.name,focus:()=>l(e,this.focus_,f),range:()=>this.range_,saturation:()=>this.saturation_}})],inputPreviousStageTexture:!1,uniforms:n.uniforms});return r.uniforms.sigma=this.blur_,r}activated_(e){o(e)}deactivating_(e){s(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get blur(){return this.blur_}set blur(e){this.blur_=e,this.stage_&&(this.stage_.uniforms.sigma=e),this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}};export{u as n,p as t};