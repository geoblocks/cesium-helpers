import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./setup-COOW6wa2.js";import{C as t,O as n,T as r,a as i,b as a,i as o,j as s,l as c,m as l,o as u,r as d}from"./cesium-shim-OL_EbrB8.js";import{n as f}from"./focus-DmEK7NGm.js";import{r as p,t as m}from"./tilt-shift-Cbx4nU7L.js";import{n as h,t as g}from"./EyeFromDepth-D946yDgv.js";/* empty css                   */import"./button-BkCDB0Kx.js";import"./card-vYdPa2Ii.js";import"./option-DXr0-CFK.js";import"./switch-DNqGrSbW.js";var _=`// A toy's look, as an isometric game's, after DepthEdges: the edges lit where the surface bends
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
  vec3 color = sceneColor.rgb;
  // the creases' neighbours read only when they light or shade: a scene drawing its own edges asks for neither
  if (light != 0.0 || shade != 0.0) {
    vec4 n = neighborsAt(uv, c, steps);
    float crease = creaseOf(n, steps * pixel, pixel);
    color *= n.x + n.y + n.z + n.w > 0.0 ? 1.0 + light * crease : 1.0 - shade * crease;
  }
  if (outline > 0.0) {
    color *= 1.0 - outline * outlineAt(uv, c, vec4(0.0), steps, pixel);
  }
  color = czm_saturation(color, saturation) * warm;
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
`,v=new i(0,0,0,0),y=new o,b=new i,x=new i,S=class extends h{constructor(e,t={}){super(e),this.terrainDepth_=!0,this.light_=t.light??.22,this.shade_=t.shade??.18,this.bevel_=t.bevel??0,this.outline_=t.outline??.4,this.jump_=t.jump??20,this.saturation_=t.saturation??1.04,this.warm_=t.warm??[1.03,1,.95],this.sky_=t.sky}createStage_(e){return new s({fragmentShader:g+p+this.shader_(),uniforms:this.uniforms_()})}shader_(){return _}uniforms_(){let e=(e,t)=>i.fromElements(e.red,e.green,e.blue,1,t);return{light:()=>this.light_,shade:()=>this.shade_,bevel:()=>this.bevel_,outline:()=>this.outline_,jump:()=>this.jump_,saturation:()=>this.saturation_,warm:()=>o.fromArray(this.warm_,0,y),skyTop:()=>this.sky_?e(this.sky_[0],b):v,skyBottom:()=>this.sky_?e(this.sky_[1],x):v}}get light(){return this.light_}set light(e){this.light_=e,this.viewer.scene.requestRender()}get shade(){return this.shade_}set shade(e){this.shade_=e,this.viewer.scene.requestRender()}get bevel(){return this.bevel_}set bevel(e){this.bevel_=e,this.viewer.scene.requestRender()}get outline(){return this.outline_}set outline(e){this.outline_=e,this.viewer.scene.requestRender()}get jump(){return this.jump_}set jump(e){this.jump_=e,this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}get warm(){return this.warm_}set warm(e){this.warm_=e,this.viewer.scene.requestRender()}get sky(){return this.sky_}set sky(e){this.sky_=e,this.viewer.scene.requestRender()}},C=`// A white model's look, as an architect's plaster model or clay render, after DepthEdges: every
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
  float value = czm_luminance(sceneColor.rgb);
  float kept = poche > 0.0 ? 1.0 - smoothstep(POCHE.x * poche, POCHE.y * poche, value) : 0.0;
  float pressed = mix(mix(values.x, values.y, value), value, kept);
  vec3 hue = sceneColor.rgb * pressed / max(value, 1e-4);
  vec3 color = mix(vec3(pressed), hue / max(1.0, max(hue.r, max(hue.g, hue.b))), saturation);
  float steps = clamp(bevel / pixel, 1.0, BEVEL);
  if (light != 0.0 || shade != 0.0) {
    vec4 n = neighborsAt(uv, c, steps);
    float crease = creaseOf(n, steps * pixel, pixel);
    color *= n.x + n.y + n.z + n.w > 0.0 ? 1.0 + light * crease : 1.0 - shade * crease;
  }
  if (occlusion > 0.0) {
    color *= 1.0 - occlusion * occludedAt(uv, p, normal, pixel);
  }
  if (outline > 0.0) {
    color *= 1.0 - outline * outlineAt(uv, c, vec4(0.0), steps, pixel);
  }
  out_FragColor = vec4(clamp(color * warm, 0.0, 1.0), sceneColor.a);
}
`,w=new d,T=class extends S{constructor(e,t={}){super(e,{...t,light:t.light??.08,shade:t.shade??.12,outline:t.outline??.25,saturation:t.saturation??0,warm:t.warm??[1,.995,.985]}),this.values_=t.values??[.35,.97],this.poche_=t.poche??.1,this.occlusion_=t.occlusion??.35,this.radius_=t.radius??1.5}shader_(){return C}uniforms_(){return{...super.uniforms_(),values:()=>d.fromArray(this.values_,0,w),poche:()=>this.poche_,occlusion:()=>this.occlusion_,radius:()=>this.radius_}}get values(){return this.values_}set values(e){this.values_=e,this.viewer.scene.requestRender()}get poche(){return this.poche_}set poche(e){this.poche_=e,this.viewer.scene.requestRender()}get occlusion(){return this.occlusion_}set occlusion(e){this.occlusion_=e,this.viewer.scene.requestRender()}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}},E=5e3,D={w:[0,1],arrowup:[0,1],s:[0,-1],arrowdown:[0,-1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]},O=.4,k=450,A=400,j=t.toRadians(15),M=.95,N=60,P=c.QUADRATIC_IN_OUT,F=new d,I=new n(o.UNIT_Z,0),L=new o,R=new o,z=new r,B=new o,V=new o,H=new o,U=class{constructor(e,n={}){this.viewer=e,this.pitch_=t.toRadians(n.pitch??30),this.corner_=t.toRadians(n.heading??45),this.size_=n.size??400,this.minSize_=n.minSize??20,this.maxSize_=n.maxSize??8e3,this.limit_=n.limit,this.orbit_=n.orbit??E,this.active_=!1,this.target_=new o,this.heading_=0,this.pointers_=new Map,this.drag_=void 0,this.held_=new Set,this.turning_=void 0,this.gliding_=void 0,this.frame_=void 0,this.slid_=void 0,this.settling_=void 0,this.moved_=void 0,this.drift_=void 0,this.drifted_=void 0,this.frustum_=void 0,this.listeners_=[[e.scene.canvas,`pointerdown`,e=>this.down_(e)],[e.scene.canvas,`pointermove`,e=>this.move_(e)],[e.scene.canvas,`pointerup`,e=>this.up_(e)],[e.scene.canvas,`pointercancel`,e=>this.up_(e)],[e.scene.canvas,`wheel`,e=>this.wheel_(e)],[e.scene.canvas,`dblclick`,e=>this.glideTo(this.pick_(this.at_(e)))],[e.scene.canvas,`contextmenu`,e=>e.preventDefault()],[window,`keydown`,e=>this.keydown_(e)],[window,`keyup`,e=>this.held_.delete(e.key.toLowerCase())],[window,`blur`,()=>this.held_.clear()],[window,`resize`,()=>this.place_()]]}get active(){return this.active_}set active(e){if(e===this.active_)return;this.active_=e;let{scene:t}=this.viewer;t.screenSpaceCameraController.enableInputs=!e;for(let[t,n,r]of this.listeners_)e?t.addEventListener(n,r,n===`wheel`?{passive:!1}:void 0):t.removeEventListener(n,r);if(e){let{canvas:e,camera:n,globe:i}=t,a=new d(e.clientWidth/2,e.clientHeight/2),s=this.pick_(a);this.target_=s??n.pickEllipsoid(a,t.ellipsoid)??o.clone(n.positionWC),this.heading_=this.cornerAfter_(n.heading,0),this.frustum_=n.frustum.clone(),n.lookAtTransform(r.IDENTITY),n.switchToOrthographicFrustum(),this.place_(),!s&&i?.show&&(this.settling_=i.tileLoadProgressEvent.addEventListener(e=>{let n=u.fromCartesian(this.target_,t.ellipsoid),r=e?void 0:i.getHeight(n);r!==void 0&&(this.settle_(),this.target_=o.fromRadians(n.longitude,n.latitude,r,t.ellipsoid),this.place_())}))}else{this.settle_(),cancelAnimationFrame(this.frame_??0),this.frame_=this.turning_=this.gliding_=this.drag_=this.moved_=this.drift_=this.drifted_=void 0,this.pointers_.clear(),this.held_.clear();let{canvas:e}=t;this.frustum_.aspectRatio!==void 0&&(this.frustum_.aspectRatio=e.clientWidth/e.clientHeight),t.camera.frustum=this.frustum_,t.requestRender()}}get target(){return o.clone(this.target_)}set target(e){this.settle_(),this.target_=o.clone(e),this.active_&&this.place_()}settle_(){this.settling_?.(),this.settling_=void 0}get heading(){return t.toDegrees(this.heading_)}set heading(e){this.turning_=this.drift_=this.drifted_=void 0,this.heading_=t.toRadians(e),this.place_()}get size(){return this.size_}set size(e){this.size_=t.clamp(e,this.minSize_,this.maxSize_),this.place_()}turnTo(e){this.drift_=this.drifted_=void 0,this.anchor_();let n=t.toRadians(e),r=t.negativePiToPi(n-this.heading_);this.turning_={from:this.heading_,to:this.heading_+r,start:performance.now()},this.animate_()}turn(e){this.drift_=this.drifted_=void 0,this.anchor_(),this.turning_={from:this.heading_,to:this.cornerAfter_(this.heading_,-e),start:performance.now()},this.animate_()}zoom(e,n){let{canvas:r}=this.viewer.scene,i=n??new d(r.clientWidth/2,r.clientHeight/2),a=this.ground_(i,this.target_);this.size_=t.clamp(this.size_*e,this.minSize_,this.maxSize_),this.place_(),a&&this.keep_(a,i)}glideTo(e){e&&(this.drift_=this.drifted_=void 0,this.gliding_={from:o.clone(this.target_),to:o.clone(e),start:performance.now()},this.animate_())}place_(){if(!this.active_)return;this.limit_&&(this.target_=o.clone(this.limit_(this.target_),this.target_));let{camera:e,ellipsoid:t}=this.viewer.scene,[n,i,a,s]=[Math.sin(this.heading_),Math.cos(this.heading_),Math.sin(this.pitch_),Math.cos(this.pitch_)],c=l.eastNorthUpToFixedFrame(this.target_,t,z),u=r.multiplyByPointAsVector(c,o.fromElements(n*s,i*s,-a,B),B),d=r.multiplyByPointAsVector(c,o.fromElements(n*a,i*a,s,V),V);r.multiplyByPoint(c,o.fromElements(-n*s*this.orbit_,-i*s*this.orbit_,a*this.orbit_,H),e.position),o.clone(u,e.direction),o.clone(d,e.up),o.cross(u,d,e.right),`width`in e.frustum&&(e.frustum.width=this.width_()),this.viewer.scene.requestRender()}width_(){let{canvas:e}=this.viewer.scene;return this.size_*Math.max(1,e.clientWidth/e.clientHeight)}cornerAfter_(e,n){let r=t.PI_OVER_TWO;return this.corner_+(Math.round((e-this.corner_)/r)+n)*r}at_(e){let t=this.viewer.scene.canvas.getBoundingClientRect();return new d(e.clientX-t.left,e.clientY-t.top)}pick_(e){let{scene:t}=this.viewer,n=t.pickPositionSupported?t.pickPosition(e):void 0,r=n||!t.globe?.show?void 0:t.camera.getPickRay(e);return n??(r&&t.globe.pick(r,t))}ground_(e,t){let{scene:r}=this.viewer,i=r.ellipsoid.geodeticSurfaceNormal(t,L),s=n.fromPointNormal(t,i,I),c=r.camera.getPickRay(d.clone(e,F));return c&&a.rayPlane(c,s,new o)}keep_(e,t){let n=this.ground_(t,e);n&&(o.add(this.target_,o.subtract(e,n,R),this.target_),this.place_())}anchor_(){let{canvas:e}=this.viewer.scene,t=this.pick_(new d(e.clientWidth/2,e.clientHeight/2));t&&(this.target_=t,this.place_())}down_(e){this.viewer.scene.canvas.setPointerCapture(e.pointerId),this.settle_(),this.pointers_.set(e.pointerId,this.at_(e)),this.gliding_=this.drift_=this.drifted_=void 0,this.snapshot_(e.timeStamp),this.drag_=this.start_(e)}start_(e){let t=[...this.pointers_.values()];if(t.length===2){let[e,n]=t,r=d.lerp(e,n,.5,new d);return{grab:this.ground_(r,this.target_),distance:d.distance(e,n),angle:Math.atan2(n.y-e.y,n.x-e.x),twist:0}}let n=e.pointerType===`touch`||e.button===2||e.ctrlKey||e.shiftKey,r=t[0];return n?{grab:this.ground_(new d(r.x,r.y),this.target_)}:{turn:!0,last:r}}move_(e){if(!this.pointers_.has(e.pointerId)||!this.drag_)return;this.pointers_.set(e.pointerId,this.at_(e));let n=this.drag_,r=[...this.pointers_.values()];if(r.length===2&&n.distance!==void 0){let[i,a]=r,o=d.lerp(i,a,.5,new d),[s,c]=[d.distance(i,a),Math.atan2(a.y-i.y,a.x-i.x)];this.size_=t.clamp(this.size_*n.distance/s,this.minSize_,this.maxSize_),this.place_(),n.grab&&this.keep_(n.grab,o);let l=t.negativePiToPi(c-n.angle);n.twist+=l,Math.abs(n.twist)>=j&&(this.heading_-=l,this.place_()),Object.assign(n,{distance:s,angle:c}),this.snapshot_(e.timeStamp)}else{if(n.turn&&n.last){let e=r[0];this.heading_-=t.TWO_PI*(e.x-n.last.x)/this.viewer.scene.canvas.clientHeight,n.last=e,this.place_()}else if(n.grab){let e=r[0];this.keep_(n.grab,new d(e.x,e.y))}this.track_(e.timeStamp)}}snapshot_(e){this.moved_={time:e,heading:this.heading_,target:o.clone(this.target_),turn:0,slide:new o}}track_(e){let t=this.moved_,n=t?e-t.time:0;if(!t||n<=0)return;let r=o.divideByScalar(o.subtract(this.target_,t.target,R),n,R);t.turn=(t.turn+(this.heading_-t.heading)/n)/2,o.divideByScalar(o.add(t.slide,r,t.slide),2,t.slide),Object.assign(t,{time:e,heading:this.heading_,target:o.clone(this.target_,t.target)})}up_(e){if(!this.pointers_.has(e.pointerId))return;if(this.pointers_.delete(e.pointerId),this.drag_=this.pointers_.size?this.start_(e):void 0,this.drag_){this.snapshot_(e.timeStamp);return}let t=this.moved_;this.moved_=void 0,t&&e.timeStamp-t.time<N&&(t.turn||o.magnitude(t.slide))?(this.drift_={turn:t.turn,slide:t.slide},this.animate_()):this.anchor_()}wheel_(e){e.preventDefault(),this.zoom(1.0015**(e.deltaY*(e.deltaMode===1?33:1)),this.at_(e))}keydown_(e){if(e.target?.closest?.(`input, select, textarea`)||e.ctrlKey||e.metaKey||e.altKey)return;let t=e.key.toLowerCase();t===`q`||t===`e`?this.turn(t===`q`?-1:1):t in D&&(this.held_.add(t),e.preventDefault(),this.animate_())}animate_(){if(this.frame_!==void 0)return;let e=n=>{if(this.frame_=void 0,this.active_){if(this.held_.size){let[e,t]=this.held_.values().reduce(([e,t],n)=>[e+(D[n]?.[0]??0),t+(D[n]?.[1]??0)],[0,0]),r=this.width_(),i=O*r*Math.min(.05,(n-(this.slid_??n))/1e3),{canvas:a}=this.viewer.scene,o=new d(a.clientWidth/2,a.clientHeight/2),s=Math.hypot(e,t);if(s){let n=i/r*a.clientWidth;this.keep_(this.target_,new d(o.x-e/s*n,o.y+t/s*n*Math.sin(this.pitch_)))}}if(this.slid_=this.held_.size?n:void 0,this.drift_){let e=Math.min(50,n-(this.drifted_??n));this.heading_+=this.drift_.turn*e,o.add(this.target_,o.multiplyByScalar(this.drift_.slide,e,R),this.target_),this.place_();let t=M**(e*60/1e3);this.drift_.turn*=t,o.multiplyByScalar(this.drift_.slide,t,this.drift_.slide),this.drifted_=n,Math.abs(this.drift_.turn)<1e-5&&o.magnitude(this.drift_.slide)<this.width_()*1e-6&&(this.drift_=this.drifted_=void 0,this.anchor_())}if(this.gliding_){let e=Math.min(1,(n-this.gliding_.start)/A);o.lerp(this.gliding_.from,this.gliding_.to,P(e),this.target_),this.place_(),e===1&&(this.gliding_=void 0)}if(this.turning_){let e=Math.min(1,(n-this.turning_.start)/k);this.heading_=t.lerp(this.turning_.from,this.turning_.to,P(e)),this.place_(),e===1&&(this.turning_=void 0)}(this.held_.size||this.drift_||this.gliding_||this.turning_)&&(this.frame_=requestAnimationFrame(e))}};this.frame_=requestAnimationFrame(e)}},W=`https://3d.geo.admin.ch/ch.swisstopo.swissbuildings3d.3d/v1/tileset.json`;e(`cesiumContainer`,{smooth:!0}).then(async e=>{e.scene.primitives.add(await Cesium.Cesium3DTileset.fromUrl(W,{maximumScreenSpaceError:8})),e.camera.setView({destination:Cesium.Cartesian3.fromDegrees(7.4442,46.9466,2500),orientation:{heading:0,pitch:-Cesium.Math.PI_OVER_TWO}});let t=new U(e,{size:300,maxSize:600});t.active=!0;let n=new S(e,{sky:[Cesium.Color.fromCssColorString(`#fbf1e4`),Cesium.Color.fromCssColorString(`#e9d3bc`)]}),r=new m(e,{focus:()=>t.target,range:.2,blur:2.5,saturation:0}),i=new f(e,{distortion:0,vignette:.15}),a=new T(e,{sky:[Cesium.Color.fromCssColorString(`#dcdedd`),Cesium.Color.fromCssColorString(`#f3f3f1`)]}),o=()=>{let e=document.querySelector(`#style`).value,t=e===`toy`,o=[[n,t],[a,e===`white`],[r,document.querySelector(`#tilt-shift`).checked],[i,t]];o.forEach(([e])=>e.active=!1),o.forEach(([e,t])=>e.active=t)};o(),document.querySelector(`#activate`).addEventListener(`change`,e=>t.active=e.target.checked),document.querySelector(`#style`).addEventListener(`change`,o),document.querySelector(`#tilt-shift`).addEventListener(`change`,o),document.querySelector(`#left`).addEventListener(`click`,()=>t.turn(-1)),document.querySelector(`#right`).addEventListener(`click`,()=>t.turn(1)),document.querySelector(`#in`).addEventListener(`click`,()=>t.zoom(1/1.25)),document.querySelector(`#out`).addEventListener(`click`,()=>t.zoom(1.25))});