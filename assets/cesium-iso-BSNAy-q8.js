import"./lit-BFn1CURT.js";/* empty css                   */import"./card-AeaRol_r.js";import{t as e}from"./setup-DMh09s7J.js";import{C as t,O as n,S as r,T as i,a,i as o,o as s,p as c,r as l,y as u}from"./cesium-shim-e6hyQueX.js";import"./switch-C191omm4.js";import{i as d,n as f,r as p,t as m}from"./EyeFromDepth-DmDC5MHh.js";import{n as h}from"./focus-CEnpGAS5.js";import{t as g}from"./tilt-shift-BeNDJ-l1.js";import"./option-CXgv_dG7.js";import"./button-C75z8WNE.js";var _=`// The edges found in the depth, shared by Toy and WhiteModel, after EyeFromDepth: how far a pixel
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

// 1 on the outline a pixel wide, on the near side of a jump: a neighbor much farther; n the
// neighbors steps pixels away, those a pixel away when steps is 1
float outlineAt(vec2 uv, float c, vec4 n, float steps, float pixel) {
  vec2 texel = 1.0 / czm_viewport.zw;
  float farther = steps > 1.0
    ? max(max(depthAt(uv + vec2(texel.x, 0.0)), depthAt(uv - vec2(texel.x, 0.0))), max(depthAt(uv + vec2(0.0, texel.y)), depthAt(uv - vec2(0.0, texel.y)))) - c
    : max(max(n.x, n.y), max(n.z, n.w));
  return step(jump * pixel, farther);
}

// the sky's gradient at uv, from the top of the screen to its bottom
vec3 skyAt(vec2 uv, vec4 top, vec4 bottom) {
  return mix(bottom.rgb, top.rgb, smoothstep(0.0, 1.0, uv.y));
}
`,v=`// A toy's look, as an isometric game's, after DepthEdges: the edges lit where the surface bends
// outward and shaded where it bends inward, rounded as molded plastic close up; an outline along
// the jumps, on their near side, a darker shade of the color; the colors a little richer and
// warmer; the sky, if asked, a soft gradient.
// its samplers read in high precision, whatever comes before (a phone's GPU's default is low)
precision highp sampler2D;
uniform sampler2D colorTexture;
// how much brighter a convex edge gets, how much darker a concave one
uniform float light;
uniform float shade;
// the edges' bevel, in meters, a pixel at the least; how much darker the outline, 0 for none
uniform float bevel;
uniform float outline;
// the colors' saturation, and a factor each of red, green and blue
uniform float saturation;
uniform vec3 warm;
// the sky's gradient, from the top of the screen to its bottom; w 0 to keep the sky
uniform vec4 skyTop;
uniform vec4 skyBottom;
in vec2 v_textureCoordinates;

void main() {
  vec2 uv = v_textureCoordinates;
  vec4 sceneColor = texture(colorTexture, uv);
  float c = depthAt(uv);
  if (c == SKY) {
    out_FragColor = skyTop.w > 0.0 ? vec4(skyAt(uv, skyTop, skyBottom), 1.0) : sceneColor;
    return;
  }
  float pixel = pixelAt(c);
  // the neighbors a bevel's width away: the bend measured over it, strongest on the edge and fading
  // to nothing a bevel off, a rounded edge's highlight
  float steps = clamp(bevel / pixel, 1.0, BEVEL);
  vec4 n = neighborsAt(uv, c, steps);
  float crease = creaseOf(n, steps * pixel, pixel);
  vec3 color = sceneColor.rgb * (n.x + n.y + n.z + n.w > 0.0 ? 1.0 + light * crease : 1.0 - shade * crease);
  if (outline > 0.0) {
    color *= 1.0 - outline * outlineAt(uv, c, n, steps, pixel);
  }
  color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, saturation) * warm;
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
`,y=new a(0,0,0,0),b=new o,x=new a,S=new a,C=class extends d{constructor(e,t={}){super(e),this.light_=t.light??.22,this.shade_=t.shade??.18,this.bevel_=t.bevel??0,this.outline_=t.outline??.4,this.jump_=t.jump??20,this.saturation_=t.saturation??1.04,this.warm_=t.warm??[1.03,1,.95],this.sky_=t.sky}createStage_(e){return new n({fragmentShader:m+_+this.shader_(),uniforms:this.uniforms_()})}shader_(){return v}uniforms_(){let e=(e,t)=>a.fromElements(e.red,e.green,e.blue,1,t);return{light:()=>this.light_,shade:()=>this.shade_,bevel:()=>this.bevel_,outline:()=>this.outline_,jump:()=>this.jump_,saturation:()=>this.saturation_,warm:()=>o.fromArray(this.warm_,0,b),skyTop:()=>this.sky_?e(this.sky_[0],x):y,skyBottom:()=>this.sky_?e(this.sky_[1],S):y}}activated_(e){f(e)}deactivating_(e){p(e)}get light(){return this.light_}set light(e){this.light_=e,this.viewer.scene.requestRender()}get shade(){return this.shade_}set shade(e){this.shade_=e,this.viewer.scene.requestRender()}get bevel(){return this.bevel_}set bevel(e){this.bevel_=e,this.viewer.scene.requestRender()}get outline(){return this.outline_}set outline(e){this.outline_=e,this.viewer.scene.requestRender()}get jump(){return this.jump_}set jump(e){this.jump_=e,this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}get warm(){return this.warm_}set warm(e){this.warm_=e,this.viewer.scene.requestRender()}get sky(){return this.sky_}set sky(e){this.sky_=e,this.viewer.scene.requestRender()}},w=`// A white model's look, as an architect's plaster model or clay render, after DepthEdges: every
// color turned to its value and the values pressed into a narrow range of whites (an accent's hue
// kept, if asked; the darkest left black, a section's poché), so the light and the shapes alone
// tell the surfaces apart; darker where surfaces meet, an ambient obscurance from the depth; the
// creases lit and shaded, a fine outline along the jumps; the sky, if asked, a pale gradient.
// its samplers read in high precision, whatever comes before (a phone's GPU's default is low)
precision highp sampler2D;
uniform sampler2D colorTexture;
// how much brighter a convex edge gets, how much darker a concave one
uniform float light;
uniform float shade;
// the edges' bevel, in meters, a pixel at the least; how much darker the outline, 0 for none
uniform float bevel;
uniform float outline;
// the colors' saturation, 0 for white, and a factor each of red, green and blue: the plaster's tint
uniform float saturation;
uniform vec3 warm;
// the darkest and the lightest values, the scene's black and white; the value under which a color
// keeps it, 0 for none
uniform vec2 values;
uniform float poche;
// how much darker a corner gets, and how wide its shadow is, in meters
uniform float occlusion;
uniform float radius;
// the sky's gradient, from the top of the screen to its bottom; w 0 to keep the sky
uniform vec4 skyTop;
uniform vec4 skyBottom;
in vec2 v_textureCoordinates;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
// the darkest colors' values, under the poché's, kept as they are rather than pressed into the
// whites, fading into them over these shares of it: an architect's poché, solid black, or a text's
const vec2 POCHE = vec2(0.6, 1.4);
// the occlusion: its widest, in pixels; its samples, on a spiral turned by the golden angle, the
// spiral itself turned from pixel to pixel; how steeply above the surface a sample rises to count
// (the normal from the depth is not exact), and how far from the pixel, in meters, a pixel and a
// half at the least (the depth's own steps on a flat wall not counted); how many pixels wide the
// disc is to show, fading in (zoomed out, its samples fall within the depth's noise)
const float RING = 48.0;
const int SAMPLES = 12;
const float GOLDEN = 2.39996;
const float BIAS = 0.15;
const float NEAREST = 0.05;
const vec2 SHOWN = vec2(3.0, 8.0);

// how much the surfaces around uv close in over it, from 0 to 1, as the Alchemy ambient obscurance
// (McGuire et al. 2011): the share of the samples around it, in a disc of the radius, that rise
// above its surface (its normal from the depth's slopes), each the more as it rises steeper, none
// farther than the radius; a corner's foot about a half, a flat floor none. p its eye coordinates, n
// their slopes' normal
float occludedAt(vec2 uv, vec3 p, vec3 n, float pixel) {
  float reach = min(radius, RING * pixel);
  float shown = smoothstep(SHOWN.x, SHOWN.y, reach / pixel);
  if (shown == 0.0) {
    return 0.0;
  }
  // turned toward the eye
  vec3 eye = czm_orthographicIn3D == 1.0 ? vec3(0.0, 0.0, 1.0) : normalize(-p);
  n = dot(n, eye) < 0.0 ? -n : n;
  float nearest = max(NEAREST, 1.5 * pixel);
  float spin = 6.2832 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float sum = 0.0;
  for (int i = 0; i < SAMPLES; i++) {
    float a = float(i) * GOLDEN + spin;
    vec2 o = vec2(cos(a), sin(a)) * (float(i) + 0.5) / float(SAMPLES) * reach / pixel / czm_viewport.zw;
    vec4 q = eyeAt(depthTexture, uv + o);
    vec3 v = q.xyz - p;
    float d = length(v);
    if (q.w > 0.0 && d > nearest) {
      sum += max(0.0, dot(v / d, n) - BIAS) * (1.0 - smoothstep(0.5 * reach, reach, d));
    }
  }
  return shown * sum / float(SAMPLES);
}

void main() {
  vec2 uv = v_textureCoordinates;
  // the surface's normal from the depth's slopes, read before any pixel returns, in step with its
  // neighbors
  vec3 p = eyeAt(depthTexture, uv).xyz;
  vec3 normal = normalize(cross(dFdx(p), dFdy(p)));
  vec4 sceneColor = texture(colorTexture, uv);
  float c = depthAt(uv);
  if (c == SKY) {
    out_FragColor = skyTop.w > 0.0 ? vec4(skyAt(uv, skyTop, skyBottom), 1.0) : sceneColor;
    return;
  }
  float pixel = pixelAt(c);
  // the color's value pressed between the darkest and the lightest, but the darkest's; its hue as
  // saturated as asked, scaled down rather than clipped where a channel would pass 1
  float value = dot(sceneColor.rgb, LUMA);
  float kept = poche > 0.0 ? 1.0 - smoothstep(POCHE.x * poche, POCHE.y * poche, value) : 0.0;
  float pressed = mix(mix(values.x, values.y, value), value, kept);
  vec3 hue = sceneColor.rgb * pressed / max(value, 1e-4);
  vec3 color = mix(vec3(pressed), hue / max(1.0, max(hue.r, max(hue.g, hue.b))), saturation);
  float steps = clamp(bevel / pixel, 1.0, BEVEL);
  vec4 n = neighborsAt(uv, c, steps);
  float crease = creaseOf(n, steps * pixel, pixel);
  color *= n.x + n.y + n.z + n.w > 0.0 ? 1.0 + light * crease : 1.0 - shade * crease;
  if (occlusion > 0.0) {
    color *= 1.0 - occlusion * occludedAt(uv, p, normal, pixel);
  }
  if (outline > 0.0) {
    color *= 1.0 - outline * outlineAt(uv, c, n, steps, pixel);
  }
  out_FragColor = vec4(clamp(color * warm, 0.0, 1.0), sceneColor.a);
}
`,T=new l,E=class extends C{constructor(e,t={}){super(e,{...t,light:t.light??.08,shade:t.shade??.12,outline:t.outline??.25,saturation:t.saturation??0,warm:t.warm??[1,.995,.985]}),this.values_=t.values??[.35,.97],this.poche_=t.poche??.1,this.occlusion_=t.occlusion??.35,this.radius_=t.radius??1.5}shader_(){return w}uniforms_(){return{...super.uniforms_(),values:()=>l.fromArray(this.values_,0,T),poche:()=>this.poche_,occlusion:()=>this.occlusion_,radius:()=>this.radius_}}get values(){return this.values_}set values(e){this.values_=e,this.viewer.scene.requestRender()}get poche(){return this.poche_}set poche(e){this.poche_=e,this.viewer.scene.requestRender()}get occlusion(){return this.occlusion_}set occlusion(e){this.occlusion_=e,this.viewer.scene.requestRender()}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}},D=5e3,O={w:[0,1],arrowup:[0,1],s:[0,-1],arrowdown:[0,-1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]},k=.4,A=450,j=400,M=r.toRadians(15),N=.95,P=60,F=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,I=new l,L=new i(o.UNIT_Z,0),R=new o,z=new o,B=new t,V=new o,H=new o,U=new o,W=class{constructor(e,t={}){this.viewer=e,this.pitch_=r.toRadians(t.pitch??30),this.corner_=r.toRadians(t.heading??45),this.size_=t.size??400,this.minSize_=t.minSize??20,this.maxSize_=t.maxSize??8e3,this.limit_=t.limit,this.orbit_=t.orbit??D,this.active_=!1,this.target_=new o,this.heading_=0,this.pointers_=new Map,this.drag_=void 0,this.held_=new Set,this.turning_=void 0,this.gliding_=void 0,this.frame_=void 0,this.slid_=void 0,this.settling_=void 0,this.moved_=void 0,this.drift_=void 0,this.drifted_=void 0,this.frustum_=void 0,this.listeners_=[[e.scene.canvas,`pointerdown`,e=>this.down_(e)],[e.scene.canvas,`pointermove`,e=>this.move_(e)],[e.scene.canvas,`pointerup`,e=>this.up_(e)],[e.scene.canvas,`pointercancel`,e=>this.up_(e)],[e.scene.canvas,`wheel`,e=>this.wheel_(e)],[e.scene.canvas,`dblclick`,e=>this.glideTo(this.pick_(this.at_(e)))],[e.scene.canvas,`contextmenu`,e=>e.preventDefault()],[window,`keydown`,e=>this.keydown_(e)],[window,`keyup`,e=>this.held_.delete(e.key.toLowerCase())],[window,`blur`,()=>this.held_.clear()],[window,`resize`,()=>this.place_()]]}get active(){return this.active_}set active(e){if(e===this.active_)return;this.active_=e;let{scene:n}=this.viewer;n.screenSpaceCameraController.enableInputs=!e;for(let[t,n,r]of this.listeners_)e?t.addEventListener(n,r,n===`wheel`?{passive:!1}:void 0):t.removeEventListener(n,r);if(e){let{canvas:e,camera:r,globe:i}=n,a=new l(e.clientWidth/2,e.clientHeight/2),c=this.pick_(a);this.target_=c??r.pickEllipsoid(a,n.ellipsoid)??o.clone(r.positionWC),this.heading_=this.cornerAfter_(r.heading,0),this.frustum_=r.frustum.clone(),r.lookAtTransform(t.IDENTITY),r.switchToOrthographicFrustum(),this.place_(),!c&&i?.show&&(this.settling_=i.tileLoadProgressEvent.addEventListener(e=>{let t=s.fromCartesian(this.target_,n.ellipsoid),r=e?void 0:i.getHeight(t);r!==void 0&&(this.settle_(),this.target_=o.fromRadians(t.longitude,t.latitude,r,n.ellipsoid),this.place_())}))}else{this.settle_(),cancelAnimationFrame(this.frame_??0),this.frame_=this.turning_=this.gliding_=this.drag_=this.moved_=this.drift_=this.drifted_=void 0,this.pointers_.clear(),this.held_.clear();let{canvas:e}=n;this.frustum_.aspectRatio!==void 0&&(this.frustum_.aspectRatio=e.clientWidth/e.clientHeight),n.camera.frustum=this.frustum_,n.requestRender()}}get target(){return o.clone(this.target_)}set target(e){this.settle_(),this.target_=o.clone(e),this.active_&&this.place_()}settle_(){this.settling_?.(),this.settling_=void 0}get heading(){return r.toDegrees(this.heading_)}turnTo(e){this.drift_=this.drifted_=void 0,this.anchor_();let t=r.toRadians(e),n=Math.atan2(Math.sin(t-this.heading_),Math.cos(t-this.heading_));this.turning_={from:this.heading_,to:this.heading_+n,start:performance.now()},this.animate_()}turn(e){this.drift_=this.drifted_=void 0,this.anchor_(),this.turning_={from:this.heading_,to:this.cornerAfter_(this.heading_,-e),start:performance.now()},this.animate_()}zoom(e,t){let{canvas:n}=this.viewer.scene,i=t??new l(n.clientWidth/2,n.clientHeight/2),a=this.ground_(i,this.target_);this.size_=r.clamp(this.size_*e,this.minSize_,this.maxSize_),this.place_(),a&&this.keep_(a,i)}glideTo(e){e&&(this.drift_=this.drifted_=void 0,this.gliding_={from:o.clone(this.target_),to:o.clone(e),start:performance.now()},this.animate_())}place_(){if(!this.active_)return;this.limit_&&(this.target_=o.clone(this.limit_(this.target_),this.target_));let{camera:e,ellipsoid:n}=this.viewer.scene,[r,i,a,s]=[Math.sin(this.heading_),Math.cos(this.heading_),Math.sin(this.pitch_),Math.cos(this.pitch_)],l=c.eastNorthUpToFixedFrame(this.target_,n,B),u=t.multiplyByPointAsVector(l,o.fromElements(r*s,i*s,-a,V),V),d=t.multiplyByPointAsVector(l,o.fromElements(r*a,i*a,s,H),H);t.multiplyByPoint(l,o.fromElements(-r*s*this.orbit_,-i*s*this.orbit_,a*this.orbit_,U),e.position),o.clone(u,e.direction),o.clone(d,e.up),o.cross(u,d,e.right),Object.assign(e.frustum,{width:this.width_()}),this.viewer.scene.requestRender()}width_(){let{canvas:e}=this.viewer.scene;return this.size_*Math.max(1,e.clientWidth/e.clientHeight)}cornerAfter_(e,t){let n=Math.PI/2;return this.corner_+(Math.round((e-this.corner_)/n)+t)*n}at_(e){let t=this.viewer.scene.canvas.getBoundingClientRect();return new l(e.clientX-t.left,e.clientY-t.top)}pick_(e){let{scene:t}=this.viewer,n=t.pickPositionSupported?t.pickPosition(e):void 0,r=n||!t.globe?.show?void 0:t.camera.getPickRay(e);return n??(r&&t.globe.pick(r,t))}ground_(e,t){let{scene:n}=this.viewer,r=n.ellipsoid.geodeticSurfaceNormal(t,R),a=i.fromPointNormal(t,r,L),s=n.camera.getPickRay(l.clone(e,I));return s&&u.rayPlane(s,a,new o)}keep_(e,t){let n=this.ground_(t,e);n&&(o.add(this.target_,o.subtract(e,n,z),this.target_),this.place_())}anchor_(){let{canvas:e}=this.viewer.scene,t=this.pick_(new l(e.clientWidth/2,e.clientHeight/2));t&&(this.target_=t,this.place_())}down_(e){this.viewer.scene.canvas.setPointerCapture(e.pointerId),this.settle_(),this.pointers_.set(e.pointerId,this.at_(e)),this.gliding_=this.drift_=this.drifted_=void 0,this.snapshot_(e.timeStamp),this.drag_=this.start_(e)}start_(e){let t=[...this.pointers_.values()];if(t.length===2){let[e,n]=t,r=new l((e.x+n.x)/2,(e.y+n.y)/2);return{grab:this.ground_(r,this.target_),distance:Math.hypot(n.x-e.x,n.y-e.y),angle:Math.atan2(n.y-e.y,n.x-e.x),twist:0}}let n=e.pointerType===`touch`||e.button===2||e.ctrlKey||e.shiftKey,r=t[0];return n?{grab:this.ground_(new l(r.x,r.y),this.target_)}:{turn:!0,last:r}}move_(e){if(!this.pointers_.has(e.pointerId)||!this.drag_)return;this.pointers_.set(e.pointerId,this.at_(e));let t=this.drag_,n=[...this.pointers_.values()];if(n.length===2&&t.distance!==void 0){let[i,a]=n,o=new l((i.x+a.x)/2,(i.y+a.y)/2),[s,c]=[Math.hypot(a.x-i.x,a.y-i.y),Math.atan2(a.y-i.y,a.x-i.x)];this.size_=r.clamp(this.size_*t.distance/s,this.minSize_,this.maxSize_),this.place_(),t.grab&&this.keep_(t.grab,o);let u=Math.atan2(Math.sin(c-t.angle),Math.cos(c-t.angle));t.twist+=u,Math.abs(t.twist)>=M&&(this.heading_-=u,this.place_()),Object.assign(t,{distance:s,angle:c}),this.snapshot_(e.timeStamp)}else{if(t.turn&&t.last){let e=n[0];this.heading_-=2*Math.PI*(e.x-t.last.x)/this.viewer.scene.canvas.clientHeight,t.last=e,this.place_()}else if(t.grab){let e=n[0];this.keep_(t.grab,new l(e.x,e.y))}this.track_(e.timeStamp)}}snapshot_(e){this.moved_={time:e,heading:this.heading_,target:o.clone(this.target_),turn:0,slide:new o}}track_(e){let t=this.moved_,n=t?e-t.time:0;if(!t||n<=0)return;let r=o.divideByScalar(o.subtract(this.target_,t.target,z),n,z);t.turn=(t.turn+(this.heading_-t.heading)/n)/2,o.divideByScalar(o.add(t.slide,r,t.slide),2,t.slide),Object.assign(t,{time:e,heading:this.heading_,target:o.clone(this.target_,t.target)})}up_(e){if(this.pointers_.delete(e.pointerId),this.drag_=this.pointers_.size?this.start_(e):void 0,this.drag_){this.snapshot_(e.timeStamp);return}let t=this.moved_;this.moved_=void 0,t&&e.timeStamp-t.time<P&&(t.turn||o.magnitude(t.slide))?(this.drift_={turn:t.turn,slide:t.slide},this.animate_()):this.anchor_()}wheel_(e){e.preventDefault(),this.zoom(1.0015**(e.deltaY*(e.deltaMode===1?33:1)),this.at_(e))}keydown_(e){if(e.target?.closest?.(`input, select, textarea`)||e.ctrlKey||e.metaKey||e.altKey)return;let t=e.key.toLowerCase();t===`q`||t===`e`?this.turn(t===`q`?-1:1):t in O&&(this.held_.add(t),e.preventDefault(),this.animate_())}animate_(){if(this.frame_!==void 0)return;let e=t=>{if(this.frame_=void 0,this.active_){if(this.held_.size){let[e,n]=[...this.held_].reduce(([e,t],n)=>[e+(O[n]?.[0]??0),t+(O[n]?.[1]??0)],[0,0]),r=this.width_(),i=k*r*Math.min(.05,(t-(this.slid_??t))/1e3),{canvas:a}=this.viewer.scene,o=new l(a.clientWidth/2,a.clientHeight/2),s=Math.hypot(e,n);if(s){let t=i/r*a.clientWidth;this.keep_(this.target_,new l(o.x-e/s*t,o.y+n/s*t*Math.sin(this.pitch_)))}}if(this.slid_=this.held_.size?t:void 0,this.drift_){let e=Math.min(50,t-(this.drifted_??t));this.heading_+=this.drift_.turn*e,o.add(this.target_,o.multiplyByScalar(this.drift_.slide,e,z),this.target_),this.place_();let n=N**(e*60/1e3);this.drift_.turn*=n,o.multiplyByScalar(this.drift_.slide,n,this.drift_.slide),this.drifted_=t,Math.abs(this.drift_.turn)<1e-5&&o.magnitude(this.drift_.slide)<this.width_()*1e-6&&(this.drift_=this.drifted_=void 0,this.anchor_())}if(this.gliding_){let e=Math.min(1,(t-this.gliding_.start)/j);o.lerp(this.gliding_.from,this.gliding_.to,F(e),this.target_),this.place_(),e===1&&(this.gliding_=void 0)}if(this.turning_){let e=Math.min(1,(t-this.turning_.start)/A);this.heading_=this.turning_.from+(this.turning_.to-this.turning_.from)*F(e),this.place_(),e===1&&(this.turning_=void 0)}(this.held_.size||this.drift_||this.gliding_||this.turning_)&&(this.frame_=requestAnimationFrame(e))}};this.frame_=requestAnimationFrame(e)}},G=`https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json`;e(`cesiumContainer`).then(async e=>{e.scene.primitives.add(await Cesium.Cesium3DTileset.fromUrl(G,{maximumScreenSpaceError:8})),e.camera.setView({destination:Cesium.Cartesian3.fromDegrees(7.4442,46.9466,2500),orientation:{heading:0,pitch:-Cesium.Math.PI_OVER_TWO}});let t=new W(e,{size:300,maxSize:600});t.active=!0;let n=new C(e,{sky:[Cesium.Color.fromCssColorString(`#fbf1e4`),Cesium.Color.fromCssColorString(`#e9d3bc`)]}),r=new g(e,{focus:()=>t.target,range:.2,blur:2.5,saturation:0}),i=new h(e,{distortion:0,vignette:.15}),a=new E(e,{sky:[Cesium.Color.fromCssColorString(`#dcdedd`),Cesium.Color.fromCssColorString(`#f3f3f1`)]}),o=()=>{let e=document.querySelector(`#style`).value,t=e===`toy`,o=[[n,t],[a,e===`white`],[r,document.querySelector(`#tilt-shift`).checked],[i,t]];o.forEach(([e])=>e.active=!1),o.forEach(([e,t])=>e.active=t)};o(),document.querySelector(`#activate`).addEventListener(`change`,e=>t.active=e.target.checked),document.querySelector(`#style`).addEventListener(`change`,o),document.querySelector(`#tilt-shift`).addEventListener(`change`,o),document.querySelector(`#left`).addEventListener(`click`,()=>t.turn(-1)),document.querySelector(`#right`).addEventListener(`click`,()=>t.turn(1)),document.querySelector(`#in`).addEventListener(`click`,()=>t.zoom(1/1.25)),document.querySelector(`#out`).addEventListener(`click`,()=>t.zoom(1.25))});