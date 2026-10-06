import"./lit-BFn1CURT.js";/* empty css                   */import"./card-BcpQSzF3.js";import{t as e}from"./setup-DMh09s7J.js";import{D as t,N as n,T as r,a as i,b as a,c as o,i as s,o as c,w as l,x as u,y as d}from"./cesium-shim-deYMRcZt.js";import"./switch-PsQ7BZQb.js";import"./button-CI_sKcZA.js";import{a as f,i as p,n as m,o as h,r as g,t as ee}from"./motion-blur-H9Tf_aeZ.js";import{a as _,i as v,n as te,o as y,r as ne,t as re}from"./details-DWYmLCUG.js";import"./slider-sLn6HB47.js";var ie=`// Color isolation: one hue keeps its color, the rest of the scene turns gray. After prod80's
// ReShade Color Isolation (MIT), https://github.com/prod80/prod80-ReShade-Repository
uniform sampler2D colorTexture;
// the hue kept and the half width of the selection, 0 to 1 for the whole circle
uniform float hue;
uniform float range;
// 0 to 1
uniform float strength;
in vec2 v_textureCoordinates;

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 color = clamp(sceneColor.rgb, 0.0, 1.0);
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float h = rgbToHsl(color).x;
  // a triangle around the hue, on the circle
  float r = 1.0 / max(range, 1e-3);
  float weight = max(1.0 - abs((h - hue) * r), 0.0)
    + max(1.0 - abs((h + 1.0 - hue) * r), 0.0)
    + max(1.0 - abs((h - 1.0 - hue) * r), 0.0);
  float w = clamp(weight, 0.0, 1.0);
  float keep = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
  vec3 isolated = mix(vec3(gray), color, keep);
  out_FragColor = vec4(mix(color, isolated, strength), sceneColor.a);
}
`,b=`// Hue (0 to 1, red at 0), saturation and lightness of a color.
vec3 rgbToHsl(vec3 color) {
  float maxc = max(color.r, max(color.g, color.b));
  float minc = min(color.r, min(color.g, color.b));
  float lightness = 0.5 * (maxc + minc);
  float delta = maxc - minc;
  if (delta < 1e-5) {
    return vec3(0.0, 0.0, lightness);
  }
  float saturation = lightness > 0.5 ? delta / (2.0 - maxc - minc) : delta / (maxc + minc);
  float hue = maxc == color.r ? (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0)
    : maxc == color.g ? (color.b - color.r) / delta + 2.0
    : (color.r - color.g) / delta + 4.0;
  return vec3(hue / 6.0, saturation, lightness);
}
`,x=class extends h{constructor(e,t={}){super(e),this.hue_=t.hue??0,this.range_=t.range??60,this.strength_=t.strength??1}createStage_(){return new l({fragmentShader:b+ie,uniforms:{hue:()=>this.hue_/360,range:()=>this.range_/360,strength:()=>this.strength_}})}get hue(){return this.hue_}set hue(e){this.hue_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}},S=`// Black and white infrared film: foliage, which reflects the near infrared, turns bright, the sky
// and water dark. The gray is the lightness raised or lowered by a weight per hue. After prod80's
// ReShade Black & White (MIT), its Infrared preset, https://github.com/prod80/prod80-ReShade-Repository
uniform sampler2D colorTexture;
// 0 to 1
uniform float strength;
in vec2 v_textureCoordinates;

// weights of the red, yellow, green, cyan, blue and magenta hues
const float RED = -1.35;
const float YELLOW = 2.35;
const float GREEN = 1.35;
const float CYAN = -1.35;
const float BLUE = -1.6;
const float MAGENTA = -1.07;
// shape of the hue selections
const float CURVE = 1.5;

float curve(float x, float k) {
  float s = sign(x - 0.5);
  float o = 0.5 * (1.0 + s);
  return o - 0.5 * s * pow(max(2.0 * (o - s * x), 0.0), k);
}

// how much of the hue centered at center there is in hue
float hueWeight(float hue, float center) {
  return curve(max(1.0 - abs((hue - center) * 6.0), 0.0), CURVE);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 hsl = rgbToHsl(clamp(sceneColor.rgb, 0.0, 1.0));
  float h = hsl.x;
  float weight = RED * (hueWeight(h, 0.0) + hueWeight(h, 1.0))
    + YELLOW * hueWeight(h, 1.0 / 6.0)
    + GREEN * hueWeight(h, 2.0 / 6.0)
    + CYAN * hueWeight(h, 3.0 / 6.0)
    + BLUE * hueWeight(h, 4.0 / 6.0)
    + MAGENTA * hueWeight(h, 5.0 / 6.0);
  float saturation = hsl.y * (1.0 - hsl.y) + hsl.y;
  float gray = clamp(hsl.z + hsl.z * weight * saturation * (1.0 - hsl.z), 0.0, 1.0);
  out_FragColor = vec4(mix(sceneColor.rgb, vec3(gray), strength), sceneColor.a);
}
`,C=class extends h{constructor(e,t={}){super(e),this.strength_=t.strength??1}createStage_(){return new l({fragmentShader:b+S,uniforms:{strength:()=>this.strength_}})}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}},w=`// The barrel distortion and dark corners of a wide-angle lens, like those of FPV cameras: straight
// lines bend outward away from the middle. The corners stay in place and the middle is
// magnified, so the picture keeps filling the screen.
uniform sampler2D colorTexture;
// 0 to 1
uniform float distortion;
uniform float vignette;
in vec2 v_textureCoordinates;

// strongest distortion: the middle magnified by 1 + this, relative to the corners
const float MAX_DISTORTION = 0.5;

void main() {
  vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
  // from the middle, 1 at the corners
  vec2 fromMiddle = (v_textureCoordinates - 0.5) * aspect / (0.5 * length(aspect));
  float r2 = dot(fromMiddle, fromMiddle);
  float k = distortion * MAX_DISTORTION;
  vec2 uv = 0.5 + (v_textureCoordinates - 0.5) * (1.0 + k * r2) / (1.0 + k);
  vec4 sceneColor = texture(colorTexture, uv);
  float dark = 1.0 - vignette * smoothstep(0.3, 1.0, r2);
  out_FragColor = vec4(sceneColor.rgb * dark, sceneColor.a);
}
`,ae=class extends h{constructor(e,t={}){super(e),this.distortion_=t.distortion??.5,this.vignette_=t.vignette??.5}createStage_(){let e=new l({fragmentShader:w,uniforms:{distortion:()=>this.distortion_,vignette:()=>this.vignette_}});return e.enabled=this.enabled_(),e}enabled_(){return this.distortion_>0||this.vignette_>0}get distortion(){return this.distortion_}set distortion(e){this.distortion_=e,this.update_()}get vignette(){return this.vignette_}set vignette(e){this.vignette_=e,this.update_()}update_(){this.stage_&&(this.stage_.enabled=this.enabled_()),this.viewer.scene.requestRender()}};function oe(e,t,n,r,i,a){for(let n=e.length-1;n>=0;n--)t-e[n].start>1&&e.splice(n,1);e.length<4&&i()<1-Math.exp(-r*n)&&e.push(a(t))}var se=`// Lightning, cloud-to-ground strikes: a branching channel from the cloud base to the ground, with 2 to 4
// return strokes tens of milliseconds apart, down one channel, and a flash that follows their flicker, as
// in the descriptions of the lightning flash (Rakov and Uman, "Lightning: Physics and Effects", 2003). The
// channel is drawn over the picture in screen space as a hot core in a halo, at least a pixel and a half
// wide: a channel is centimeters wide, and a thousand meters away it would not show at its true width. It
// is a line from the cloud to the ground that wanders to either side, by value noise of the position along
// it in four octaves, pinned at both ends, with branches that leave it downward at an angle and wander the
// same way, fading toward their ends. The distance to it is the pixel's across the line, less the wander,
// over the slope of the wander, so that the width stays the same where it zigzags: a function of the
// position along the line, a handful of noise lookups for each channel, not a polyline for each pixel.
// The channel is hidden behind nearer terrain. The flash lights each pixel in proportion to its own color,
// less with its distance to the strike, and the sky toward the cloud above it. Needs EyeFromDepth and Hash.
const int STRIKES = 4;
const int BRANCHES = 5;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the top of each strike's channel, at the cloud base, in eye coordinates, and its seed; and its foot
// and its age in seconds, negative when there is no strike in the slot
uniform vec4 strikeTop[STRIKES];
uniform vec4 strikeBottom[STRIKES];
// the branches of each strike's channel, from the CPU: where along the channel they leave it, the cosine
// and the sine of their angle from it, and their length as a share of the channel's, 0 for none
uniform vec4 strikeBranches[STRIKES * BRANCHES];
in vec2 v_textureCoordinates;

const int MAX_STROKES = 4;
// how far the main channel and the branches wander to either side, as a fraction of their length
const float MAIN_WANDER = 0.7;
const float BRANCH_WANDER = 0.6;
// the brightness of the branches against the main channel's
const float BRANCH_BRIGHTNESS = 0.5;
// how far from the line between its ends a channel reaches, as a fraction of its length: the main one's
// wander, then its branches; and the widest halo in pixels. Pixels farther than that skip the channel
const float MAIN_REACH = 0.35;
const float BRANCH_REACH = 0.5;
const float MAX_HALO = 80.0;
const float MAX_SLOPE = 2.5;
// the channel's flicker under which it is not drawn
const float FAINT = 0.01;
// the width of the core and of the halo, in meters: scaled to pixels by the distance, the core to no
// less than a pixel and a half
const float CORE_WIDTH = 1.0;
const float HALO_WIDTH = 25.0;
// how bright the halo is against the core
const float HALO = 0.35;
// the channel is white at its core and blue around it, from the nitrogen lines of a 30000 K plasma, with a
// violet cast from the hydrogen line of the water in a storm's air (Kieu et al., 2021)
const vec3 HALO_COLOR = vec3(0.68, 0.66, 1.0);
const vec3 FLASH_COLOR = vec3(0.8, 0.82, 1.0);
// the extinction of the light of a strike per meter, in red, green and blue: the scattering of the air goes
// with the wavelength to the minus 4, so far strikes turn yellow, then red, as at sunset
const vec3 EXTINCTION = vec3(1.0, 1.9, 3.4) * 2e-5;
// the distance, in meters, at which the flash on the land has fallen to half
const float FLASH_REACH = 3000.0;
// the sky is a ray this long
const float SKY_DISTANCE = 20000.0;
// time constants of the channel's flicker and of the flash, in seconds
const float BOLT_DECAY = 0.05;
const float FLASH_DECAY = 0.15;

// noise of one coordinate, in [-0.5, 0.5), and its slope: linear between the random values of the whole
// numbers, not smoothed, so that the path is made of straight segments with sharp turns, as a bolt is
vec2 valueNoise(float x, float seed) {
  float cell = floor(x);
  float low = hash(vec2(cell, seed));
  float high = hash(vec2(cell + 1.0, seed));
  return vec2(mix(low, high, fract(x)) - 0.5, high - low);
}

// four octaves of it along a channel, from 4 segments to 34: the wander at s and its slope
vec2 wander(float s, float seed) {
  vec2 sum = vec2(0.0);
  float amplitude = 1.0;
  float frequency = 4.0;
  for (int i = 0; i < 4; i++) {
    sum += amplitude * valueNoise(s * frequency, seed + 7.0 * float(i)) * vec2(1.0, frequency);
    amplitude *= 0.45;
    frequency *= 2.1;
  }
  return sum;
}

// how far a channel is from its line at s, in its lengths, and the slope of that: the wander held to 0
// at the start, by a smoothstep over the first quarter of a branch, and at both ends of the main
// channel, by a sine, so that it leaves the cloud and reaches the ground upright
vec2 offsetAt(float s, float seed, bool main) {
  vec2 w = wander(s, seed);
  float envelope = sin(czm_pi * s);
  float slope = czm_pi * cos(czm_pi * s);
  if (!main) {
    float u = clamp(4.0 * s, 0.0, 1.0);
    envelope = u * u * (3.0 - 2.0 * u);
    slope = 24.0 * u * (1.0 - u);
  }
  return vec2(w.x * envelope, w.y * envelope + w.x * slope);
}

// the distance in pixels from p to a channel that leaves a along dir, len pixels long, and the share s
// of the way along it where p is nearest
float channelDistance(vec2 p, vec2 a, vec2 dir, float len, float amplitude, float seed, bool main, out float s) {
  vec2 r = p - a;
  float along = dot(r, dir);
  s = clamp(along / len, 0.0, 1.0);
  vec2 offset = offsetAt(s, seed, main);
  float across = dot(r, vec2(-dir.y, dir.x)) - amplitude * len * offset.x;
  // the estimate holds near the channel only: past a slope of a few, the halo of a steep segment would
  // stretch sideways
  float slope = clamp(amplitude * offset.y, -MAX_SLOPE, MAX_SLOPE);
  // past the ends, the distance to the end
  return length(vec2(across / sqrt(1.0 + slope * slope), along - s * len));
}

// the core and the halo of the channel at a distance in pixels
vec2 channelProfile(float d, float core, float halo) {
  return vec2(exp(-d * d / (core * core)), HALO * exp(-d / halo));
}

// the light of a strike seen from this far, in each color
vec3 transmittance(float d) {
  return exp(-EXTINCTION * d);
}

// the flicker of the channel and the light of the flash, at an age in seconds: each stroke lights it up
// at once and fades, the first one the brightest, and a dimmer current keeps the channel lit between them
void strokes(float age, float seed, out float bolt, out float flash) {
  bolt = 0.3 * exp(-age / 0.3);
  flash = 0.0;
  float count = 2.0 + floor(3.0 * hash(vec2(seed, 91.0)));
  float start = 0.0;
  for (int i = 0; i < MAX_STROKES; i++) {
    if (float(i) >= count) {
      break;
    }
    float strength = i == 0 ? 1.0 : 0.35 + 0.5 * hash(vec2(seed, 50.0 + float(i)));
    float since = age - start;
    if (since >= 0.0) {
      bolt += strength * exp(-since / BOLT_DECAY);
      flash += strength * exp(-since / FLASH_DECAY);
    }
    start += 0.04 + 0.08 * hash(vec2(seed, 70.0 + float(i)));
  }
}

vec2 screenPoint(vec3 eye) {
  vec4 clip = czm_projection * vec4(eye, 1.0);
  return (0.5 * clip.xy / clip.w + 0.5) * czm_viewport.zw;
}

// the distance from p to the segment ab
float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  return length(p - a - ab * clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0));
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec4 sceneColor = texture(colorTexture, uv);
  vec3 color = sceneColor.rgb;
  vec4 eye = eyeAt(depthTexture, uv);
  float sceneDistance = eye.w > 0.0 ? length(eye.xyz) : 1e9;
  vec3 pixelEye = eye.w > 0.0 ? eye.xyz : eye.xyz * SKY_DISTANCE;
  vec2 pixel = uv * czm_viewport.zw;
  // the focal length in pixels
  float focal = 0.5 * czm_projection[1][1] * czm_viewport.w;

  vec3 light = vec3(0.0);
  vec3 channel = vec3(0.0);
  for (int k = 0; k < STRIKES; k++) {
    float age = strikeBottom[k].w;
    if (age < 0.0) {
      continue;
    }
    vec3 top = strikeTop[k].xyz;
    vec3 bottom = strikeBottom[k].xyz;
    float seed = strikeTop[k].w;
    float bolt;
    float flash;
    strokes(age, seed, bolt, flash);

    // the land around the foot of the strike, and the sky toward the cloud above it
    float reach = distance(pixelEye, bottom) / FLASH_REACH;
    float sky = eye.w > 0.0 ? 0.0 : pow(max(dot(eye.xyz, normalize(top)), 0.0), 6.0);
    vec3 seen = transmittance(length(bottom));
    light += FLASH_COLOR * seen * flash * (color * 1.2 + 0.08) / (1.0 + reach * reach);
    light += FLASH_COLOR * seen * flash * sky * 0.5;

    // the channel, when both its ends are in front of the camera, and the pixel is near it
    if (top.z > -1.0 || bottom.z > -1.0) {
      continue;
    }
    vec2 a = screenPoint(top);
    vec2 b = screenPoint(bottom);
    float len = distance(a, b);
    // the halo's widest reach, around the middle of the channel: pixels farther than that skip the channel
    float margin = 3.0 * clamp(HALO_WIDTH * focal / length(0.5 * (top + bottom)), 4.0, MAX_HALO);
    // the branches reach further from the line than the main channel's wander does
    float fromLine = segmentDistance(pixel, a, b);
    if (bolt < FAINT || len < 2.0 || fromLine > BRANCH_REACH * len + margin) {
      continue;
    }
    vec2 dir = (b - a) / len;
    float s = clamp(dot(pixel - a, dir) / len, 0.0, 1.0);
    float boltDistance = length(mix(top, bottom, s));
    float core = max(1.5, CORE_WIDTH * focal / boltDistance);
    float halo = clamp(HALO_WIDTH * focal / boltDistance, 4.0, MAX_HALO);
    vec2 profile = vec2(0.0);
    if (fromLine < MAIN_REACH * len + margin) {
      profile = channelProfile(channelDistance(pixel, a, dir, len, MAIN_WANDER, seed, true, s), core, halo);
    }
    for (int j = 0; j < BRANCHES; j++) {
      vec4 branch = strikeBranches[k * BRANCHES + j];
      float branchLen = len * branch.w;
      if (branchLen <= 0.0) {
        continue;
      }
      float at = branch.x;
      vec2 branchDir = vec2(branch.y * dir.x - branch.z * dir.y, branch.z * dir.x + branch.y * dir.y);
      // nowhere near the branch, which stays within its length and wander of its middle, and the main
      // channel's wander of its line
      vec2 onLine = a + dir * len * at;
      if (distance(pixel, onLine + branchDir * 0.5 * branchLen) > (0.5 + 0.5 * BRANCH_WANDER) * branchLen + MAIN_REACH * len + margin) {
        continue;
      }
      vec2 base = onLine + vec2(-dir.y, dir.x) * MAIN_WANDER * len * offsetAt(at, seed, true).x;
      float along;
      float branchDistance = channelDistance(pixel, base, branchDir, branchLen, BRANCH_WANDER, seed + 5.0 * float(j + 1), false, along);
      profile = max(profile, BRANCH_BRIGHTNESS * (1.0 - 0.7 * along) * channelProfile(branchDistance, core, halo));
    }
    // hidden behind terrain nearer than the channel at this height
    if (sceneDistance > boltDistance * 0.98 - 30.0) {
      channel += bolt * transmittance(boltDistance) * (profile.x + profile.y * HALO_COLOR);
    }
  }
  out_FragColor = vec4(color + light + channel, sceneColor.a);
}
`,T=30,ce=.4,E=300,le=500,ue=.1,de=2*Math.PI,D=5,fe=.7,O=[.25,.75],pe=Math.PI/6,k=new s,me=class extends h{constructor(e,t={}){super(e),this.intensity_=t.intensity??.5,this.cloudBase_=t.cloudBase??2500,this.radius_=t.radius??5e3,this.inFront_=t.inFront??!1,this.strikes_=[],this.strikeTop_=Array.from({length:4},()=>new i),this.strikeBottom_=Array.from({length:4},()=>new i(0,0,0,-1)),this.strikeBranches_=Array.from({length:4*D},()=>new i),this.lastTime_=0,this.onPreRender_=()=>{let e=this.viewer.scene,t=performance.now()/1e3,n=Math.min(t-this.lastTime_,ue);this.lastTime_=t;let r=e.camera.positionCartographic.height<this.cloudBase_;oe(this.strikes_,t,n,r?this.intensity_*ce:0,Math.random,e=>this.createStrike_(e));let o=e.camera.viewMatrix;for(let e=0;e<4;e++){let n=this.strikes_[e];if(!n){this.strikeBottom_[e].w=-1;continue}a.multiplyByPoint(o,n.top,k),i.fromElements(k.x,k.y,k.z,n.seed,this.strikeTop_[e]),a.multiplyByPoint(o,n.ground,k),i.fromElements(k.x,k.y,k.z,t-n.start,this.strikeBottom_[e]);for(let t=0;t<D;t++){let[r,a,o]=n.branches[t];i.fromElements(r,Math.cos(a),Math.sin(a),o,this.strikeBranches_[e*D+t])}}}}createStrike_(e){let t=this.viewer.scene,{longitude:n,latitude:r}=t.camera.positionCartographic,i=this.inFront_?t.camera.heading+(Math.random()*2-1)*pe:Math.random()*de,a=E+Math.max(this.radius_-E,0)*Math.sqrt(Math.random()),o=t.ellipsoid.maximumRadius,l=n+a*Math.sin(i)/(o*Math.cos(r)),u=r+a*Math.cos(i)/o,d=Array.from({length:D},()=>{let e=.1+.7*Math.random();return[e,(Math.random()<.5?-1:1)*(O[0]+(O[1]-O[0])*Math.random()),Math.random()<fe?(1-e)*(.25+.4*Math.random()):0]}),f=t.globe?.getHeight(new c(l,u))??0;return{start:e,seed:Math.random()*100,branches:d,ground:s.fromRadians(l,u,f,t.ellipsoid),top:s.fromRadians(l,u,Math.max(this.cloudBase_,f+le),t.ellipsoid)}}createStage_(e){let t=new l({fragmentShader:f+m+se,uniforms:{strikeTop:()=>this.strikeTop_,strikeBottom:()=>this.strikeBottom_,strikeBranches:()=>this.strikeBranches_}});return t.enabled=this.intensity_>0,t}activated_(e){this.lastTime_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),g(e),this.intensity_>0&&_(e,T)}deactivating_(e){this.intensity_>0&&y(e,T),p(e),e.preRender.removeEventListener(this.onPreRender_),this.strikes_.length=0;for(let e of this.strikeBottom_)e.w=-1}get intensity(){return this.intensity_}set intensity(e){let t=this.intensity_>0;this.intensity_=e,this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?_:y)(this.viewer.scene,T)),this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get inFront(){return this.inFront_}set inFront(e){this.inFront_=e}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}},he=new s,ge=new s;function A(e){return{cameraHeight:()=>e.camera.positionCartographic.height,up:()=>{let t=e.ellipsoid.geodeticSurfaceNormal(e.camera.positionWC,he);return a.multiplyByPointAsVector(e.camera.viewMatrix,t,t)},radius:()=>{let t=e.ellipsoid.scaleToGeodeticSurface(e.camera.positionWC,ge);return t?s.magnitude(t):e.ellipsoid.maximumRadius}}}var j=`// Height above the ellipsoid of a point in eye coordinates, computed relative to the camera: in
// world coordinates, single precision would round the position to about half a meter. The
// uniforms come from the CPU in double precision (height.js).
uniform float cameraHeight;
uniform vec3 up;
uniform float radius;

float heightAt(vec3 eye) {
  // the camera is at the origin of eye coordinates; away from it horizontally, the ground falls
  // below the horizontal by the Earth's curvature
  float rise = dot(eye, up);
  float across = dot(eye, eye) - rise * rise;
  return cameraHeight + rise + across / (2.0 * radius);
}
`,M=`// random gradient in [-1, 1] at a lattice point
vec3 gradient(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}

// gradient noise, about -0.7 to 0.7. After prod80's ReShade Film Grain (MIT), with gradients
// from a hash instead of a texture
float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(
      mix(dot(gradient(i), f), dot(gradient(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(gradient(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)), dot(gradient(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x),
      u.y),
    mix(
      mix(dot(gradient(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)), dot(gradient(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(gradient(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)), dot(gradient(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x),
      u.y),
    u.z);
}

// random gradient in [-1, 1] at a lattice point of the plane, for a seed
vec2 gradient(vec2 p, float seed) {
  vec3 p3 = fract(vec3(p, seed) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

// gradient noise over the plane, about -0.7 to 0.7, a new pattern for each seed: half the
// hashes of the volume's, for a pattern that only has to change by whole frames
float gradientNoise(vec2 p, float seed) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(dot(gradient(i, seed), f), dot(gradient(i + vec2(1.0, 0.0), seed), f - vec2(1.0, 0.0)), u.x),
    mix(dot(gradient(i + vec2(0.0, 1.0), seed), f - vec2(0.0, 1.0)), dot(gradient(i + vec2(1.0, 1.0), seed), f - vec2(1.0, 1.0)), u.x),
    u.y);
}
`,N=`// Precipitation, rain or snow: streaks of falling drops in four layers, nearer ones larger, faster
// and more opaque, in one pass over the scene, after the composite rainfall of ToyShop (Tatarchuk
// 2006). The drops are laid out on the sphere of view directions, around the direction they fall
// toward: drops falling along parallel lines appear on great circles through it, so in its Mercator
// coordinates (the angle around it, and log(tan(theta / 2)) of the angle theta from it) the drops
// of a layer, at one distance, are a regular grid scrolling at a constant rate: their size and
// speed on the sphere both go with sin(theta). The streaks fall down the screen at the horizon and
// radiate from below the camera when it looks down. The drops are hidden behind what is nearer than
// their layer, and the rain veils the distance in an overcast haze, whose light the drops refract,
// and in shafts of heavier rain hanging below the cloud base. The wind comes in gusts. The snow,
// from 0 to 1, turns the rain to snow in one population: the drops slow down from 9 m/s to 1 m/s,
// which shortens their streak, and grow from thin sharp lines into soft round flakes that flutter,
// the nearest layer out of focus as in Andrew Baldwin's "Just snow", in a thicker, whiter haze.
// Needs EyeFromDepth, Hash, Height and PrecipitationWind.
const int LAYERS = 4;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the shafts' opacity, from PrecipitationShafts.glsl at a fraction of the resolution
uniform sampler2D shaftTexture;
// from the CPU, as they change with the snow: the length of a drop's trail, its motion over the
// exposure, in cells, and the scroll of the grid along the fall, in cells, wrapped at PERIOD, which
// has to follow the speed without a jump
uniform float trail;
uniform float offset;
// what the layers share, from the CPU rather than computed for each pixel: the cells around and
// along the fall per radian, the number of cells around, and the distance in meters; and the
// brightness, how far the largest drop's shape reaches around its trail in pixels, the radius of a
// streak and the radius of the largest flake in pixels
uniform vec4 layerShape[LAYERS];
uniform vec4 layerLook[LAYERS];
in vec2 v_textureCoordinates;

// cells along the fall, for the random drops to repeat seamlessly as they scroll
const float PERIOD = 1000.0;
// the nearest layer is 2 m away, each further layer twice as far; at the horizon, a drop every
// 0.05 rad around
const float NEAREST = 2.0;
// share of the cells with a drop, at full intensity
const float DENSITY = 0.6;
// the sky is a ray this long
const float SKY_DISTANCE = 50000.0;
// the haze never quite hides the sky and the far terrain
const float MAX_HAZE = 0.9;
// tint of the haze at night, scaled by fog.minimumBrightness
const vec3 NIGHT = vec3(0.45, 0.55, 0.85);
// a drop is a capsule from a point in its cell, its trail within a cell: the cells are taller than
// wide in the rain, square in the snow
// how far a flake flutters across its cell, in cells, and a streak wavers in the gusts
const float FLUTTER = 0.12;
const float WAVER = 0.08;
// visibility, in meters, from intensity 0 to 1: much less in the snow than in the rain
const vec2 RAIN_VISIBILITY = vec2(40000.0, 4000.0);
const vec2 SNOW_VISIBILITY = vec2(20000.0, 500.0);
// the haze under the clouds by day, a brighter gray under snow clouds
const vec3 RAIN_HAZE = vec3(0.6, 0.64, 0.68);
const vec3 SNOW_HAZE = vec3(0.7, 0.72, 0.76);
// the drops refract the haze's light, whiter than they would, as the milk film crews add to the
// water, for rain that shows; the flakes scatter it, near white
const float RAIN_MILK = 0.25;
const float SNOW_MILK = 0.35;
// the shafts' shade of the haze: darker in the rain, lighter in the snow
const float RAIN_SHAFT_SHADE = 0.75;
const float SNOW_SHAFT_SHADE = 1.1;
// the shafts' resolution, precipitation.js's SHAFT_SCALE
const float SHAFT_SCALE = 0.125;

// the shafts' opacity, blurred by PrecipitationShaftBlur.glsl and upsampled bilinearly from their texture,
// which is read at its nearest texel
float shaftOpacity() {
  // the size Cesium gives the texture
  vec2 size = ceil(czm_viewport.zw * SHAFT_SCALE);
  vec2 p = v_textureCoordinates * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 center = (i + 0.5) / size;
  vec2 texel = 1.0 / size;
  float bottom = mix(texture(shaftTexture, center).r, texture(shaftTexture, center + vec2(texel.x, 0.0)).r, f.x);
  float top = mix(texture(shaftTexture, center + vec2(0.0, texel.y)).r, texture(shaftTexture, center + texel).r, f.x);
  return mix(bottom, top, f.y);
}

// the opacity at the pixel of the drop with its head in the cell \`back\` cells above its own, if it
// has one: f is the pixel's place in its own cell. The drop morphs from a thin, sharp, long streak
// to a round, soft, short flake with the snow: its radius and softness, brightness and flutter.
float drop(vec4 look, float index, float count, float density, float streak, float amplitude, vec2 reach, vec2 pixelCells, vec2 cell, vec2 f, float back) {
  vec2 id = vec2(mod(cell.x, count), mod(cell.y - back, PERIOD) + PERIOD * index);
  float h = hash(id);
  if (h >= density) {
    return 0.0;
  }
  // the drop's random values, from the one hash: uniform in [0, 1) for the cells with a drop; its
  // head somewhere in the middle of its cell, and the pixel's place around its trail
  h /= density;
  vec2 head = vec2(0.25 + 0.5 * fract(h * 13.7), 0.25 + 0.5 * fract(h * 71.3));
  vec2 toHead = vec2(f.x, f.y + back) - head;
  // most drops are nowhere near the pixel: the rest of the shape is for the few that are
  if (abs(toHead.x) > amplitude + reach.x || toHead.y < -reach.y || toHead.y > streak + reach.y) {
    return 0.0;
  }
  // wavering in the gusts or fluttering across the cell at its own rate
  float rate = mix(1.7, 1.0 + 2.0 * fract(h * 5.1), snow);
  toHead.x -= amplitude * sin(rate * time + czm_twoPi * fract(h * 7.3));
  float t = streak > 0.0 ? clamp(toHead.y / streak, 0.0, 1.0) : 0.0;
  // the distance to the trail, in pixels
  float distanceToTrail = length(vec2(toHead.x, toHead.y - t * streak) / pixelCells);
  float radius = mix(look.z, look.w * (0.6 + 0.8 * fract(h * 3.7)), snow);
  // the nearest layer's flakes out of focus, soft and wide; the others sharp
  float soft = mix(0.5, index == 0.0 ? 0.8 * radius : 0.5, snow);
  float coverage = 1.0 - smoothstep(radius - soft, radius + soft, distanceToTrail);
  // fading out along a streak, not along a flake
  float taper = mix(1.0, 4.0 * t * (1.0 - t), streak);
  return look.x * (0.55 + 0.45 * fract(h * 37.1)) * coverage * taper;
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  // the pixel's view direction and distance, the sky far away, and the angle a pixel covers
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 view = normalize(eye.xyz);
  float sceneDistance = eye.w == 0.0 ? SKY_DISTANCE : length(eye.xyz);
  float pixel = 2.0 / (czm_projection[1][1] * czm_viewport.w);

  // the local frame at the camera, in world coordinates
  vec3 upWorld = upWC();
  vec3 eastWorld = eastWC();
  vec3 northWorld = cross(upWorld, eastWorld);
  float tilt = gustingTilt();

  // the haze, as thick as the visibility: 3.912 / visibility is the extinction that leaves 2 %
  // of the light; lit by the sun as ValleyFog's fog, a moonlit blue at night
  // from the rain's to the snow's, in proportion
  vec2 range = RAIN_VISIBILITY * pow(SNOW_VISIBILITY / RAIN_VISIBILITY, vec2(snow));
  float visibility = range.x * pow(range.y / range.x, intensity);
  float haze = MAX_HAZE * (1.0 - exp(-3.912 * sceneDistance / visibility));
  float day = smoothstep(-0.1, 0.3, dot(up, czm_sunDirectionEC));
  vec3 hazeColor = mix(NIGHT * czm_fogMinimumBrightness, mix(RAIN_HAZE, SNOW_HAZE, snow), day);
  vec3 color = mix(sceneColor.rgb, hazeColor, haze);

  color = mix(color, min(mix(RAIN_SHAFT_SHADE, SNOW_SHAFT_SHADE, snow) * hazeColor, vec3(1.0)), shaftOpacity());

  // none above the cloud base
  float raining = 1.0 - smoothstep(cloudBase - 50.0, cloudBase + 50.0, cameraHeight);
  // in eye coordinates: the direction the drops fall toward, tilted toward the east by the wind,
  // and north across it
  vec3 fall = czm_viewRotation * (sin(tilt) * eastWorld - cos(tilt) * upWorld);
  vec3 north = czm_viewRotation * northWorld;
  vec3 across = normalize(north - dot(north, fall) * fall);
  vec3 dropColor = min(hazeColor + mix(RAIN_MILK, SNOW_MILK, snow), vec3(1.0));

  float cosTheta = dot(view, fall);
  float sinTheta = sqrt(max(1.0 - cosTheta * cosTheta, 0.0));
  // none toward the poles, where the cells shrink below a pixel
  if (raining > 0.0 && sinTheta > 0.01) {
    float around = atan(dot(view, cross(fall, across)), dot(view, across));
    float along = log(sinTheta / max(1.0 + cosTheta, 1e-6));
    float density = DENSITY * intensity;
    float streak = trail;
    float amplitude = mix(WAVER, FLUTTER, snow);
    // a pixel in radians, around the pole of the fall, where cells shrink
    float pixelOverSin = pixel / sinTheta;
    float brightness = raining * (0.5 + 0.5 * intensity);
    for (int i = 0; i < LAYERS; i++) {
      vec4 shape = layerShape[i];
      // hidden behind what is nearer than the layer
      float depthFade = smoothstep(0.5, 1.0, sceneDistance / shape.w);
      // a pixel in cells; the layer fades out as its cells get a few pixels wide
      vec2 pixelCells = pixelOverSin * shape.xy;
      float fade = brightness * depthFade * (1.0 - smoothstep(0.15, 0.4, pixelCells.x));
      if (fade <= 0.0) {
        continue;
      }
      float index = float(i);
      vec2 p = vec2(around * shape.x, along * shape.y + offset + 0.37 * index);
      vec2 cell = floor(p);
      vec2 f = p - cell;
      vec4 look = layerLook[i];
      vec2 reach = look.y * pixelCells;
      // the drops with their head in the pixel's cell, and in the cell above, whose trail or soft
      // edge may reach into it
      float alpha = drop(look, index, shape.z, density, streak, amplitude, reach, pixelCells, cell, f, 0.0);
      if (f.y <= streak) {
        alpha = 1.0 - (1.0 - alpha) * (1.0 - drop(look, index, shape.z, density, streak, amplitude, reach, pixelCells, cell, f, 1.0));
      }
      color = mix(color, dropColor, alpha * fade);
    }
  }
  out_FragColor = vec4(color, sceneColor.a);
}
`,P=`// The shafts' opacity, blurred over the neighboring texels at their own resolution: they fade out
// around the ridges in front of them rather than stopping at their outline. A 3 x 3 binomial
// kernel here costs a 64th of the reads the same blur would take at the full resolution.
uniform sampler2D shaftTexture;
in vec2 v_textureCoordinates;

void main() {
  // czm_viewport is this pass's texture, the size of the shafts'
  vec2 texel = 1.0 / czm_viewport.zw;
  float sum = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      sum += weight * texture(shaftTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel).r;
    }
  }
  out_FragColor = vec4(sum / 16.0, 0.0, 0.0, 1.0);
}
`,F=`// The shafts of the rain or the snow, at a fraction of the resolution: their opacity along each
// view ray, for Precipitation.glsl to shade. Along the part of the ray below the cloud base,
// patches of noise on the ground under each sample, more of them as it rains harder, slanting with
// the wind from the cloud base and drifting with it. Not dithered: at this resolution the dither
// shows as dots, where the patches are too soft to band. Needs EyeFromDepth, Noise, Height and
// PrecipitationWind.
uniform sampler2D depthTexture;
in vec2 v_textureCoordinates;

// samples along each ray, as far as SHAFT_DISTANCE, size of the patches in meters, extinction
// inside them per meter, about 6 km of visibility
const int SHAFT_STEPS = 12;
const float SHAFT_DISTANCE = 20000.0;
const float SHAFT_SIZE = 2500.0;
// snow hides more, about 2.5 km
const vec2 SHAFT_EXTINCTION = vec2(0.0006, 0.0015);
// the wind's speed, from its tilt of the drops' fall at 9 m/s, also in the snow: a drift changing
// with the snow would move the shafts
const float DRIFT_VELOCITY = 9.0;
// the shafts thin out over this height below the cloud base, into the clouds
const float SHAFT_TOP = 1000.0;

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 rayEnd = eye.w == 0.0 ? eye.xyz * SHAFT_DISTANCE : eye.xyz * min(1.0, SHAFT_DISTANCE / length(eye.xyz));
  float h0 = cameraHeight;
  float h1 = heightAt(rayEnd);
  float opacity = 0.0;
  if (min(h0, h1) < cloudBase) {
    float t0 = h0 > cloudBase ? (h0 - cloudBase) / (h0 - h1) : 0.0;
    float t1 = h1 > cloudBase ? (cloudBase - h0) / (h1 - h0) : 1.0;
    float threshold = mix(0.4, 0.0, intensity);
    vec3 upWorld = upWC();
    vec3 eastWorld = eastWC();
    // the gusts sway the shafts, but they drift with the steady wind
    float slant = tan(gustingTilt());
    float drift = DRIFT_VELOCITY * speed * tan(radians(wind)) * time;
    // the ray in world coordinates, once rather than for each sample
    vec3 rayWC = czm_inverseViewRotation * rayEnd;
    float density = 0.0;
    for (int i = 0; i < SHAFT_STEPS; i++) {
      float t = mix(t0, t1, (float(i) + 0.5) / float(SHAFT_STEPS));
      float h = heightAt(rayEnd * t);
      vec3 ground = czm_viewerPositionWC + rayWC * t - upWorld * h;
      ground -= eastWorld * ((cloudBase - h) * slant + drift);
      float top = clamp((cloudBase - h) / SHAFT_TOP, 0.0, 1.0);
      density += top * smoothstep(threshold - 0.3, threshold + 0.3, gradientNoise(ground / SHAFT_SIZE));
    }
    float depth = mix(SHAFT_EXTINCTION.x, SHAFT_EXTINCTION.y, snow) * (0.5 + 0.5 * intensity) * density * (t1 - t0) * length(rayEnd) / float(SHAFT_STEPS);
    opacity = 1.0 - exp(-depth);
  }
  out_FragColor = vec4(opacity, 0.0, 0.0, 1.0);
}
`,I=`// What the passes of the precipitation share: the local frame at the camera and the wind, in gusts.
// Needs Height.
// seconds, wrapped at an hour
uniform float time;
// tilt of the fall toward the east, in degrees
uniform float wind;
// speed of the drops, 1 at their terminal velocity
uniform float speed;
// meters above the ellipsoid
uniform float cloudBase;
// 0 to 1
uniform float intensity;
// share of the precipitation that is snow, 0 to 1
uniform float snow;

// the gusts: the wind's tilt varies by this share, over periods of 18 and 7.2 s that divide the
// hour the time wraps at
const float GUSTS = 0.35;

// up and east at the camera, in world coordinates
vec3 upWC() {
  return czm_inverseViewRotation * up;
}

vec3 eastWC() {
  return normalize(cross(vec3(0.0, 0.0, 1.0), upWC()));
}

// the wind's tilt, in radians, in gusts
float gustingTilt() {
  float gust = 1.0 + GUSTS * (0.6 * sin(czm_twoPi * time / 18.0) + 0.4 * sin(czm_twoPi * time / 7.2 + 1.3));
  return radians(wind) * gust;
}
`,L=30,_e=3600,R=9,ve=1,z=4.44,ye=20,B=2,V=1/30,be=1/90,xe=1,H=2*Math.PI,U=4,Se=20,Ce=4,we=1e3,Te=.1,W=.125,Ee=.5,G=new WeakMap;function De(e){let t=G.get(e);if(t){t.count++;return}G.set(e,{count:1,light:e.light,intensity:e.light.intensity,shadows:e.shadowMap.enabled}),e.light.intensity*=Ee,e.shadowMap.enabled=!1}function Oe(e){let t=G.get(e);!t||--t.count>0||(t.light.intensity=t.intensity,e.shadowMap.enabled=t.shadows,G.delete(e))}var ke=class extends h{constructor(e,t={}){super(e),this.intensity_=t.intensity??.5,this.wind_=t.wind??10,this.speed_=t.speed??1,this.cloudBase_=t.cloudBase??2500,this.snow_=t.snow??0,this.offset_=0,this.lastTime_=0,this.layerShape_=Array.from({length:U},()=>new i),this.layerLook_=Array.from({length:U},()=>new i),this.onPreRender_=()=>{let e=performance.now()/1e3,t=Math.min(e-this.lastTime_,Te);this.lastTime_=e,this.offset_=(this.offset_+t*this.fallSpeed_()*this.cellsAlong_()/B)%we,this.updateLayers_()}}fallSpeed_(){return this.speed_*R*(ve/R)**this.snow_}updateLayers_(){let e=this.cellsAlong_();for(let t=0;t<U;t++){let n=2**t,r=Math.floor(H*Se*n+.5);i.fromElements(r/H,e*n,r,B*n,this.layerShape_[t]);let a=Math.max(.5,1-.25*t),o=Math.max(Ce/n,.75),s=.45-.07*t,c=.8-.12*t,l=t===0?1.4*o*1.8:1.4*o+.5;i.fromElements(s+(c-s)*this.snow_,a+.5+(l-a-.5)*this.snow_,a,o,this.layerLook_[t])}}trail_(){let e=V*(be/V)**this.snow_;return Math.min(this.fallSpeed_()*e*this.cellsAlong_()/B,xe)}cellsAlong_(){return z*(ye/z)**this.snow_}createStage_(e){let t={...A(e),time:()=>performance.now()/1e3%_e,wind:()=>this.wind_,speed:()=>this.speed_,cloudBase:()=>this.cloudBase_,intensity:()=>this.intensity_,snow:()=>this.snow_},n=new l({fragmentShader:m+M+j+I+F,uniforms:t,textureScale:W}),i=new l({fragmentShader:P,uniforms:{shaftTexture:n.name},textureScale:W}),a=new r({stages:[n,i,new l({fragmentShader:m+f+j+I+N,uniforms:{...t,shaftTexture:i.name,trail:()=>this.trail_(),layerShape:()=>this.layerShape_,layerLook:()=>this.layerLook_,offset:()=>this.offset_}})],inputPreviousStageTexture:!1});return a.enabled=this.intensity_>0,a}activated_(e){this.lastTime_=performance.now()/1e3,this.updateLayers_(),e.preRender.addEventListener(this.onPreRender_),g(e),De(e),this.intensity_>0&&_(e,L)}deactivating_(e){this.intensity_>0&&y(e,L),Oe(e),p(e),e.preRender.removeEventListener(this.onPreRender_)}get intensity(){return this.intensity_}set intensity(e){let t=this.intensity_>0;this.intensity_=e,this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?_:y)(this.viewer.scene,L)),this.viewer.scene.requestRender()}get wind(){return this.wind_}set wind(e){this.wind_=e,this.viewer.scene.requestRender()}get speed(){return this.speed_}set speed(e){this.speed_=e,this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get snow(){return this.snow_}set snow(e){this.snow_=e,this.viewer.scene.requestRender()}},K=`// normal at the pixel from its neighbors at this distance in pixels: on each axis the nearer
// side, so that the edges of the scene do not bend it
vec3 normalAt(sampler2D depthTexture, vec2 uv, vec3 center, float distance) {
  vec2 step = distance / czm_viewport.zw;
  vec3 right = eyeAt(depthTexture, uv + vec2(step.x, 0.0)).xyz - center;
  vec3 left = center - eyeAt(depthTexture, uv - vec2(step.x, 0.0)).xyz;
  vec3 above = eyeAt(depthTexture, uv + vec2(0.0, step.y)).xyz - center;
  vec3 below = center - eyeAt(depthTexture, uv - vec2(0.0, step.y)).xyz;
  vec3 dx = dot(right, right) < dot(left, left) ? right : left;
  vec3 dy = dot(above, above) < dot(below, below) ? above : below;
  vec3 normal = normalize(cross(dx, dy));
  // toward the camera
  return normal * sign(dot(normal, -center));
}

// the terrain mesh is made of flat triangles, and so are the normals from the depth buffer:
// averaged over several distances, the facets blend into a smoother surface
vec3 smoothNormalAt(sampler2D depthTexture, vec2 uv, vec3 center) {
  return normalize(normalAt(depthTexture, uv, center, 2.0 * czm_pixelRatio) + normalAt(depthTexture, uv, center, 6.0 * czm_pixelRatio));
}
`,Ae=`// Snow above an altitude, on slopes gentle enough to hold it, shaded by the sun and by the
// brightness of the scene so that the relief stays readable. The slope comes from a normal
// rebuilt from the neighboring pixels and smoothed over the facets of the terrain. Noise anchored
// to the ground breaks up the edge of the snow, which lasts lower on the slopes away from the sun.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// meters above the ellipsoid: half covered at the altitude, over a band transition meters high
uniform float altitude;
uniform float transition;
// radians
uniform float maxSlope;
// 0 to 1
uniform float coverage;
in vec2 v_textureCoordinates;

const vec3 SNOW_SHADE = vec3(0.80, 0.87, 1.0);
const vec3 SNOW_SUN = vec3(1.0, 0.98, 0.94);
// meters the snow line moves down on a slope facing away from the sun, and up on one facing it
const float ASPECT_SHIFT = 0.6;
// meters the noise moves the snow line, as a fraction of the transition
const float NOISE_SHIFT = 0.8;
// part of the snow that still covers the steep slopes at the limit, as a fraction of the coverage
const float STEEP_SNOW = 0.35;
// half width of the slope limit, in radians (8 degrees), so that the snow thins out across the
// facets of the terrain rather than stopping at their edges
const float SLOPE_EDGE = 0.14;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

// 0 to 1, from a few octaves anchored to the ground
float groundNoise(vec3 world) {
  return 0.55 * valueNoise(world / 90.0) + 0.3 * valueNoise(world / 30.0) + 0.15 * valueNoise(world / 10.0);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float slope = acos(clamp(dot(normal, up), -1.0, 1.0));

  float sun = max(dot(normal, czm_sunDirectionEC), 0.0);
  float noise = groundNoise((czm_inverseView * vec4(eye.xyz, 1.0)).xyz) - 0.5;
  // lower on the slopes away from the sun, irregular along the edge
  float shift = transition * (NOISE_SHIFT * noise + ASPECT_SHIFT * (0.5 - sun));
  float snowLine = altitude + shift;
  float snow = smoothstep(snowLine - 0.5 * transition, snowLine + 0.5 * transition, heightAt(eye.xyz));
  // opaque before the top of the band, so that the imagery does not show through the snow
  snow = smoothstep(0.0, 0.7, snow);
  // the steep slopes keep a thin, patchy cover, and the rock shows through
  float steep = smoothstep(maxSlope - SLOPE_EDGE, maxSlope + SLOPE_EDGE, slope);
  snow *= 1.0 - steep * (1.0 - STEEP_SNOW * smoothstep(0.35, 0.65, noise + 0.5));
  // eye.w is 0 for the sky
  snow *= coverage * eye.w;
  float brightness = dot(sceneColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  // blue in the shade, warm in the sun, with the relief of the scene kept in the brightness
  vec3 lit = mix(SNOW_SHADE, SNOW_SUN, sun) * clamp(0.68 + 0.25 * sun + 0.1 * brightness, 0.0, 1.0);
  out_FragColor = vec4(mix(sceneColor.rgb, lit, snow), sceneColor.a);
}
`,je=class extends h{constructor(e,t={}){super(e),this.altitude_=t.altitude??2e3,this.transition_=t.transition??200,this.maxSlope_=t.maxSlope??50,this.coverage_=t.coverage??1}createStage_(e){return new l({fragmentShader:m+j+K+Ae,uniforms:{...A(e),altitude:()=>this.altitude_,transition:()=>this.transition_,maxSlope:()=>d.toRadians(this.maxSlope_),coverage:()=>this.coverage_}})}activated_(e){g(e)}deactivating_(e){p(e)}get altitude(){return this.altitude_}set altitude(e){this.altitude_=e,this.viewer.scene.requestRender()}get transition(){return this.transition_}set transition(e){this.transition_=e,this.viewer.scene.requestRender()}get maxSlope(){return this.maxSlope_}set maxSlope(e){this.maxSlope_=e,this.viewer.scene.requestRender()}get coverage(){return this.coverage_}set coverage(e){this.coverage_=e,this.viewer.scene.requestRender()}},Me=new s;function q(e,t,n){let r=typeof t==`function`?t():t;if(!r)return i.fromElements(0,0,0,0,n);let o=a.multiplyByPoint(e.camera.viewMatrix,r,Me);return i.fromElements(o.x,o.y,o.z,1,n)}var Ne=`// Speed lines: the picture zooms toward the focus, more toward the edges of the screen, and thin
// streaks radiate from it, a new pattern many times a second, as in comics.
uniform sampler2D colorTexture;
// in eye coordinates; w is 0 for the middle of the screen
uniform vec4 focus;
// 0 to 1
uniform float strength;
// seconds
uniform float time;
in vec2 v_textureCoordinates;

const int BLUR_STEPS = 8;
// length of the zoom blur at full strength, as a fraction of the distance to the focus
const float BLUR = 0.12;
// streaks around the focus, and their changes per second
const float STREAK_COUNT = 360.0;
const float STREAK_RATE = 24.0;
const float STREAK_OPACITY = 0.2;

// the streaks draw their randomness from hash: with a sin, they disappeared for half of each
// cycle of frames
void main() {
  vec2 uv = v_textureCoordinates;
  vec4 clip = czm_projection * vec4(focus.xyz, 1.0);
  // on the screen, in front of the camera
  vec2 center = focus.w > 0.0 && focus.z < 0.0 ? 0.5 * clip.xy / clip.w + 0.5 : vec2(0.5);
  vec2 toCenter = center - uv;
  // distance to the focus, 1 at the half height of the screen
  vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
  float fromCenter = 2.0 * length(toCenter * aspect);
  float edge = smoothstep(0.2, 1.0, fromCenter);

  vec4 sceneColor = texture(colorTexture, uv);
  vec3 color = sceneColor.rgb;
  // zoom blur, from a start that varies with the pixel so that the steps blur into noise; none
  // where it would be shorter than a pixel, around the focus
  float blur = strength * BLUR * edge;
  if (blur * length(toCenter * czm_viewport.zw) > 0.5) {
    float jitter = pixelNoise(gl_FragCoord.xy);
    color = vec3(0.0);
    for (int i = 0; i < BLUR_STEPS; i++) {
      color += texture(colorTexture, uv + toCenter * blur * (float(i) + jitter) / float(BLUR_STEPS)).rgb;
    }
    color /= float(BLUR_STEPS);
  }

  // streaks: noise around the focus, constant along each ray from it, only toward the edges
  float streaks = STREAK_OPACITY * strength * smoothstep(0.5, 1.2, fromCenter);
  if (streaks > 0.0) {
    vec2 direction = toCenter * aspect;
    float frame = mod(floor(time * STREAK_RATE), 1000.0);
    // value noise over the angle, in whole cells so that it closes around the focus
    float around = (atan(direction.y, direction.x) / czm_twoPi + 0.5) * STREAK_COUNT;
    float cell = floor(around);
    float t = fract(around);
    float noise = mix(hash(vec2(cell, frame)), hash(vec2(mod(cell + 1.0, STREAK_COUNT), frame)), t * t * (3.0 - 2.0 * t));
    color = mix(color, vec3(1.0), streaks * smoothstep(0.72, 0.9, noise));
  }
  out_FragColor = vec4(color, sceneColor.a);
}
`,Pe=new i,Fe=class extends h{constructor(e,t={}){super(e),this.focus_=t.focus,this.strength_=t.strength??1}createStage_(e){let t=new l({fragmentShader:f+Ne,uniforms:{focus:()=>q(e,this.focus_,Pe),strength:()=>this.strength_,time:()=>performance.now()/1e3}});return t.enabled=this.strength_>0,t}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get strength(){return this.strength_}set strength(e){this.strength_=e,this.stage_&&(this.stage_.enabled=e>0),this.viewer.scene.requestRender()}},Ie=`// The beam of a cone of light in the haze, for the spotlight and for lights of your own:
// raymarched along the part of the view ray inside the cone, found analytically, so that no
// sample is wasted and pixels next to each other see the same stretch of it. Needs Hash, and
// Noise for the dust.

struct Beam {
  // the cone: its apex and the direction it points, in eye coordinates
  vec3 apex;
  vec3 forward;
  // cosines of its half angle, and of the angle within which its core is hot
  float edgeCos;
  float coreCos;
  // brightness of the core over the rest of the cone, 0 for a plain penumbra
  float hotCore;
  // the light's position, from which the haze's brightness falls off as reference^2 over
  // (core^2 + distance^2): 1 at the reference distance for a small core, softened within it
  vec3 light;
  float reference;
  float core;
  // how far along the view ray the haze is lit, meters, and its extinction on the way, per meter
  float reach;
  float extinction;
  // Henyey-Greenstein asymmetry, 0 to 1: forward scattering
  float anisotropy;
  // exponent of the spacing of the samples along the ray: 1 for even, 2 for dense at the start
  float spacing;
  // the lit haze fades in over this stretch of the view ray, meters; none when empty
  vec2 nearFade;
  // dust catching the light: noise across the beam, constant along each line from the light so
  // that it streaks, in world coordinates so that it stays when the camera turns; its contrast
  // and its density across the width of the beam
  float dust;
  float dustScale;
};

const int BEAM_SAMPLES = 8;

// the part of the view ray, from the camera at the origin, inside the cone: entry and exit
// distances, exit before entry when the ray misses it
vec2 coneSegment(vec3 ray, vec3 apex, vec3 forward, float edgeCos) {
  // points t * ray in the cone: dot(p, forward)^2 >= edgeCos^2 dot(p, p), with p from the apex
  vec3 v = -apex;
  float k2 = edgeCos * edgeCos;
  float rd = dot(ray, forward);
  float vd = dot(v, forward);
  float a = rd * rd - k2;
  // a ray along the surface of the cone would divide by zero
  a = abs(a) < 1e-7 ? -1e-7 : a;
  float b = rd * vd - k2 * dot(ray, v);
  float c = vd * vd - k2 * dot(v, v);
  float discriminant = b * b - a * c;
  if (discriminant < 0.0) {
    return vec2(1.0, 0.0);
  }
  float root = sqrt(discriminant);
  float t1 = (-b - root) / a;
  float t2 = (-b + root) / a;
  vec2 segment = a < 0.0 ? vec2(min(t1, t2), max(t1, t2))
    // a ray steeper than the cone stays in it on one side, of the lit nappe or the other one
    : rd > 0.0 ? vec2(max(t1, t2), 1e30) : vec2(-1e30, min(t1, t2));
  // ahead of the apex, not in the mirrored cone behind it
  return vd + 0.5 * (segment.x + segment.y) * rd > 0.0 ? segment : vec2(1.0, 0.0);
}

// Henyey-Greenstein phase, normalized over the sphere
float henyeyGreenstein(float cosTheta, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * czm_pi * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

// the haze lit by the beam along the view ray up to sceneDistance: samples over the part of the
// ray inside the cone, each weighted by the softness of the cone with its core, the dust, the
// falloff from the light and what the haze has dimmed so far, dithered per pixel so that they do
// not band, then scattered toward the camera
float beamAlong(vec3 ray, float sceneDistance, Beam beam) {
  vec2 segment = coneSegment(ray, beam.apex, beam.forward, beam.edgeCos);
  float start = max(segment.x, 0.0);
  float end = min(min(segment.y, sceneDistance), beam.reach);
  if (end <= start) {
    return 0.0;
  }
  float length_ = end - start;
  float jitter = pixelNoise(gl_FragCoord.xy);
  float scattered = 0.0;
  float transmittance = exp(-beam.extinction * start);
  for (int i = 0; i < BEAM_SAMPLES; i++) {
    float u = (float(i) + jitter) / float(BEAM_SAMPLES);
    float t = start + length_ * pow(u, beam.spacing);
    // pow(0, 0) is undefined, a NaN on some GPUs, where the jitter is 0
    float step = length_ * beam.spacing * pow(max(u, 1e-6), beam.spacing - 1.0) / float(BEAM_SAMPLES);
    vec3 p = ray * t;
    vec3 fromApex = p - beam.apex;
    float cosine = dot(fromApex, beam.forward) / length(fromApex);
    float cone = smoothstep(beam.edgeCos, beam.coreCos, cosine) + beam.hotCore * smoothstep(beam.coreCos, 1.0, cosine);
    vec3 fromLight = p - beam.light;
    if (beam.dust > 0.0) {
      float along = max(dot(fromLight, beam.forward), 1e-3);
      vec3 section = czm_inverseViewRotation * ((fromLight - along * beam.forward) * 2.0 / along);
      float noise = gradientNoise(beam.dustScale * section) + 0.25 * gradientNoise(2.0 * beam.dustScale * section);
      cone *= 1.0 + beam.dust * noise;
    }
    float falloff = beam.reference * beam.reference / (beam.core * beam.core + dot(fromLight, fromLight));
    float fade = beam.nearFade.y > beam.nearFade.x ? smoothstep(beam.nearFade.x, beam.nearFade.y, t) : 1.0;
    scattered += transmittance * cone * falloff * fade * step;
    transmittance *= exp(-beam.extinction * step);
  }
  return scattered * henyeyGreenstein(dot(ray, beam.forward), beam.anisotropy);
}
`,Le=`// a filmic roll-off (ACES, Narkowicz's fit) for the effects that add light to the picture: Cesium
// has already tone mapped it, so their light would clip to flat white without it
vec3 filmic(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
`,Re=`// A searchlight above the focus, pointing down: it throws a pool of warm light radius meters
// wide on flat ground, with a soft penumbra, shades the relief under it and lights up the haze
// in its beam, from SpotlightBeam.glsl; the rest of the scene darkens and loses its color. The
// cone and the falloff follow three.js's SpotLight. Needs EyeFromDepth, Normal, Filmic and
// SpotlightCone.
uniform sampler2D colorTexture;
// the beam's haze and the log2 of the scene distance, at a fraction of the resolution
uniform sampler2D beamTexture;
// 0 to 1
uniform float darkness;
// brightness of the beam in the air, 0 to 1
uniform float beam;
// brightness of the light, 1 for the searchlight: the pool and the beam scale with it
uniform float power;
in vec2 v_textureCoordinates;

const vec3 LIGHT_COLOR = vec3(1.0, 0.93, 0.8);
const float INTENSITY = 1.4;
// difference of the log2 of the distances, about 10 %, under which the beam's texels around a
// pixel are interpolated
const float SOFT_DEPTH = 0.14;

// light reaching a point fromLight away from the light: the cone around the axis with its
// penumbra, and the inverse square, 1 at the focus, capped for what is close to the light
float spotAt(vec3 fromLight, vec3 axis, float height, float coneCos, float penumbraCos) {
  float lightDistance = length(fromLight);
  float spot = smoothstep(coneCos, penumbraCos, dot(fromLight, -axis) / lightDistance);
  return spot * min(height * height / (lightDistance * lightDistance), 4.0);
}

// the beam's haze at the pixel, from the four texels of its lower resolution around it:
// interpolated where they are all at the pixel's distance, else the one nearest to it, so that the
// haze stops at the ridges in front of it rather than spilling onto them
float beamAt(vec2 uv, float depth) {
  ivec2 size = textureSize(beamTexture, 0);
  vec2 position = uv * vec2(size) - 0.5;
  ivec2 base = ivec2(floor(position));
  vec2 f = fract(position);
  float interpolated = 0.0;
  float nearest = 0.0;
  float nearestGap = 1e38;
  float widestGap = 0.0;
  for (int i = 0; i < 4; i++) {
    ivec2 offset = ivec2(i & 1, i >> 1);
    vec2 texel = texelFetch(beamTexture, clamp(base + offset, ivec2(0), size - 1), 0).rg;
    float gap = abs(texel.g - depth);
    vec2 weights = mix(1.0 - f, f, vec2(offset));
    interpolated += weights.x * weights.y * texel.r;
    if (gap < nearestGap) {
      nearestGap = gap;
      nearest = texel.r;
    }
    widestGap = max(widestGap, gap);
  }
  return widestGap < SOFT_DEPTH ? interpolated : nearest;
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  Cone spot;
  if (!spotlightCone(spot)) {
    out_FragColor = sceneColor;
    return;
  }
  vec3 color = sceneColor.rgb;
  vec3 ambient = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), darkness) * (1.0 - darkness);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);

  // eye.w is 0 for the sky, where the view ray goes on
  float sceneDistance = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float scattered = beam > 0.0 ? beamAt(v_textureCoordinates, log2(sceneDistance)) : 0.0;
  vec3 haze = LIGHT_COLOR * (power * beam * scattered);
  if (eye.w == 0.0) {
    out_FragColor = vec4(filmic(ambient + haze), sceneColor.a);
    return;
  }

  vec3 toLight = spot.light - eye.xyz;
  // the normal over wider steps where the surface is seen at a grazing angle, where the facets
  // of the terrain mesh would show as blotches; over fine ones elsewhere, for the relief
  vec3 coarse = normalize(normalAt(depthTexture, v_textureCoordinates, eye.xyz, 6.0 * czm_pixelRatio)
    + normalAt(depthTexture, v_textureCoordinates, eye.xyz, 18.0 * czm_pixelRatio));
  float grazing = smoothstep(0.7, 0.95, 1.0 - abs(dot(coarse, normalize(-eye.xyz))));
  vec3 normal = normalize(mix(smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz), coarse, grazing));
  float lambert = max(dot(normal, normalize(toLight)), 0.0);
  vec3 light = LIGHT_COLOR * (power * INTENSITY * spotAt(-toLight, up, spot.height, spot.coneCos, spot.penumbraCos) * lambert);
  out_FragColor = vec4(filmic(ambient + color * light + haze), sceneColor.a);
}
`,ze=`// The haze lit by the searchlight's beam, at a fraction of the resolution, as in Killzone Shadow
// Fall's volumetrics (Valient, SIGGRAPH 2014): r is the light scattered along the view ray, g the
// log2 of the scene distance for SpotlightBeamBlur.glsl and the upsampling: half floats hold it, and
// distances compare as ratios. Needs EyeFromDepth, Hash, Noise, SpotlightCone and Beam.
// brightness of the beam in the air, 0 to 1
uniform float beam;
// Henyey-Greenstein asymmetry of the haze, 0 to 1: it scatters mostly forward, so the beam is
// brighter when looking toward the light
uniform float beamAnisotropy;
in vec2 v_textureCoordinates;

// radius of the beam's bright core around the light, in heights: the inverse square is softened
// within it, as the pool's is capped, so that the top of the beam does not burn out
const float BEAM_CORE = 0.25;
// brightness of the lit haze, over the height so that it keeps with the radius, matched to the
// searchlight's former analytic beam at the default anisotropy
const float BEAM_DENSITY = 19.0;
// contrast and density of the dust streaks in the beam, across its width
const float STREAKS = 0.2;
const float STREAK_SCALE = 4.0;

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  // eye.w is 0 for the sky, where the view ray goes on
  float sceneDistance = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  Cone spot;
  if (beam <= 0.0 || !spotlightCone(spot)) {
    out_FragColor = vec4(0.0, log2(sceneDistance), 0.0, 1.0);
    return;
  }
  Beam cone;
  cone.apex = spot.light;
  cone.forward = -up;
  cone.edgeCos = spot.coneCos;
  cone.coreCos = spot.penumbraCos;
  cone.hotCore = 0.0;
  cone.light = spot.light;
  cone.reference = spot.height;
  cone.core = BEAM_CORE * spot.height;
  cone.reach = 1e30;
  cone.extinction = 0.0;
  cone.anisotropy = beamAnisotropy;
  cone.spacing = 1.0;
  cone.nearFade = vec2(0.0);
  cone.dust = STREAKS;
  cone.dustScale = STREAK_SCALE;
  float scattered = BEAM_DENSITY / spot.height * beamAlong(normalize(eye.xyz), sceneDistance, cone);
  out_FragColor = vec4(scattered, log2(sceneDistance), 0.0, 1.0);
}
`,Be=`// The beam's haze, blurred over the neighboring texels at its own resolution, each weighted by how
// close its scene distance is to the texel's: the dither of the samples along the rays smooths
// out, but the haze in front of a ridge does not spill onto the ridge.
uniform sampler2D beamTexture;
in vec2 v_textureCoordinates;

// difference of the log2 of the distances at which a neighbor no longer counts, about 10 %
const float SOFT_DEPTH = 0.14;

void main() {
  // czm_viewport is this pass's texture, the size of the beam's
  vec2 texel = 1.0 / czm_viewport.zw;
  float centerDepth = texture(beamTexture, v_textureCoordinates).g;
  float sum = 0.0;
  float total = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 sample_ = texture(beamTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel).rg;
      float gap = abs(sample_.g - centerDepth);
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0) * clamp(1.0 - gap / SOFT_DEPTH, 0.0, 1.0);
      sum += weight * sample_.r;
      total += weight;
    }
  }
  out_FragColor = vec4(sum / total, centerDepth, 0.0, 1.0);
}
`,J=`// The searchlight's cone, for its beam and for its pool of light: the light hangs above the focus,
// pointing down. Needs EyeFromDepth.
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// local up direction, in eye coordinates
uniform vec3 up;
// meters
uniform float radius;
// width of the penumbra, as a fraction of the radius
uniform float softness;

// height of the light above the focus, in radii: a cone of 53 degrees
const float HEIGHT = 2.0;

struct Cone {
  vec3 light;
  float height;
  // cosines of the angles, from the light's axis, at which the pool ends and its penumbra starts
  float coneCos;
  float penumbraCos;
};

// false without a focus in front of the camera (the sky in the middle, a focus behind)
bool spotlightCone(out Cone cone) {
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  if (target.w == 0.0 || target.z >= 0.0) {
    return false;
  }
  cone.height = HEIGHT * radius;
  cone.light = target.xyz + cone.height * up;
  float inner = radius * (1.0 - softness);
  cone.coneCos = cone.height / sqrt(cone.height * cone.height + radius * radius);
  cone.penumbraCos = cone.height / sqrt(cone.height * cone.height + inner * inner);
  return true;
}
`,Ve=new i,He=class extends h{constructor(e,t={}){super(e),this.focus_=t.focus,this.power_=t.power??1,this.radius_=t.radius??200,this.softness_=t.softness??.5,this.darkness_=t.darkness??.8,this.beam_=t.beam??.25,this.beamAnisotropy_=t.beamAnisotropy??.4}createStage_(e){let t={focus:()=>q(e,this.focus_,Ve),up:A(e).up,radius:()=>this.radius_,softness:()=>this.softness_},n=new l({fragmentShader:m+f+M+J+Ie+ze,uniforms:{...t,beam:()=>this.beam_,beamAnisotropy:()=>this.beamAnisotropy_},textureScale:.5,pixelDatatype:u.HALF_FLOAT}),i=new l({fragmentShader:Be,uniforms:{beamTexture:n.name},textureScale:.5,pixelDatatype:u.HALF_FLOAT});return new r({stages:[n,i,new l({fragmentShader:m+K+Le+J+Re,uniforms:{...t,beamTexture:i.name,darkness:()=>this.darkness_,beam:()=>this.beam_,power:()=>this.power_}})],inputPreviousStageTexture:!1})}activated_(e){g(e)}deactivating_(e){p(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get power(){return this.power_}set power(e){this.power_=e,this.viewer.scene.requestRender()}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}get softness(){return this.softness_}set softness(e){this.softness_=e,this.viewer.scene.requestRender()}get darkness(){return this.darkness_}set darkness(e){this.darkness_=e,this.viewer.scene.requestRender()}get beam(){return this.beam_}set beam(e){this.beam_=e,this.viewer.scene.requestRender()}get beamAnisotropy(){return this.beamAnisotropy_}set beamAnisotropy(e){this.beamAnisotropy_=e,this.viewer.scene.requestRender()}};function Y(e,i=1){let a=[`x`,`y`].map((r,a)=>new l({name:`${e}_${r}`,fragmentShader:`#define USE_STEP_SIZE\n${n}`,uniforms:{delta:1,sigma:2,stepSize:1,direction:a},sampleMode:t.LINEAR,textureScale:i})),o=e=>({get:()=>a[0].uniforms[e],set:t=>{for(let n of a)n.uniforms[e]=t}});return new r({name:e,stages:a,uniforms:Object.defineProperties({},{sigma:o(`sigma`),stepSize:o(`stepSize`)})})}var X=`// Size of the visible frame of the given width over height, centered in the canvas, in texture
// coordinates: bars above and below when the canvas is narrower than the ratio, on the sides when
// it is wider; the whole canvas for a ratio of 0.
vec2 frameSize(float aspectRatio) {
  if (aspectRatio <= 0.0) {
    return vec2(1.0);
  }
  float canvas = czm_viewport.z / czm_viewport.w;
  return aspectRatio < canvas ? vec2(aspectRatio / canvas, 1.0) : vec2(1.0, canvas / aspectRatio);
}
`,Ue=`// A Super 8 home movie: faded warm colors, halation around the highlights, heavy grain, the frame
// drifting in the gate, flicker, light leaks, a strong vignette and the rounded corners of the
// camera gate.
uniform sampler2D colorTexture;
// the scene blurred, for the halation
uniform sampler2D blurTexture;
// seconds
uniform float time;
// 0 to 1
uniform float fade;
uniform float grain;
// in CSS pixels
uniform float weave;
// 0 to 1
uniform float flicker;
uniform float lightLeaks;
uniform float halation;
// width over height of the visible frame, 0 for the whole canvas
uniform float aspectRatio;
in vec2 v_textureCoordinates;

// Super 8 runs at 18 frames per second
const float FRAME_RATE = 18.0;
// radius of the rounded corners, as a fraction of the frame height
const float CORNER = 0.05;
const vec3 LEAK = vec3(1.0, 0.45, 0.15);
// size of the grain clumps, in CSS pixels, and how much they differ between the dye layers
const float GRAIN_SIZE = 2.0;
const float GRAIN_COLOR = 0.3;
// light scattered back through the film base is red-orange
const vec3 HALATION = vec3(1.0, 0.35, 0.15);

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

// smooth noise in [0, 1) over time
float noise(float t) {
  float i = floor(t);
  float f = fract(t);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

void main() {
  vec2 size = czm_viewport.zw;
  // the time of the film frame, and its number for the noise
  float t = floor(time * FRAME_RATE) / FRAME_RATE;
  float frame = mod(floor(time * FRAME_RATE), 1000.0);

  // gate weave: the whole picture drifts by a pixel or two, from frame to frame
  vec2 drift = vec2(noise(t * 3.0), noise(t * 3.0 + 17.0)) * 2.0 - 1.0;
  vec2 uv = v_textureCoordinates + weave * czm_pixelRatio * drift / size;

  // the gate, with rounded corners, in pixels
  vec2 frameHalf = 0.5 * frameSize(aspectRatio) * size;
  float radius = CORNER * 2.0 * frameHalf.y;
  vec2 q = abs((v_textureCoordinates - 0.5) * size) - frameHalf + radius;
  float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float gate = 1.0 - smoothstep(-czm_pixelRatio, czm_pixelRatio, outside);
  // -0.5 to 0.5 inside the frame
  vec2 inFrame = (v_textureCoordinates - 0.5) * size / (2.0 * frameHalf);

  vec3 color = texture(colorTexture, uv).rgb;
  // faded film: less saturation, lifted blacks, a warm cast
  color = mix(color, vec3(luminance(color)), 0.4 * fade);
  color = mix(color, color * vec3(1.05, 0.95, 0.78) * 0.88 + vec3(0.09, 0.07, 0.05), fade);
  // halation: a warm glow bleeding around the highlights
  float glow = smoothstep(0.45, 0.9, luminance(texture(blurTexture, uv).rgb));
  color = 1.0 - (1.0 - color) * (1.0 - halation * glow * HALATION);
  // vignette
  color *= 1.0 - 0.6 * smoothstep(0.35, 0.85, length(inFrame));
  // a warm light leak, drifting along the right edge and coming and going
  vec2 leakAt = vec2(0.6, noise(time * 0.15) - 0.5);
  float leak = lightLeaks * smoothstep(0.3, 0.9, noise(time * 0.3 + 5.0)) * exp(-6.0 * dot(inFrame - leakAt, inFrame - leakAt));
  color = 1.0 - (1.0 - color) * (1.0 - leak * LEAK);
  // flicker: the brightness changes from frame to frame
  color *= 1.0 + flicker * (2.0 * hash(frame) - 1.0);
  // grain: clumps a few pixels wide, a new pattern with each film frame, a little different in
  // each dye layer, heaviest in the shadows and midtones and fading out in the highlights
  vec2 grainAt = gl_FragCoord.xy / (GRAIN_SIZE * czm_pixelRatio);
  float z = frame * 1.7 + 0.5;
  float mono = gradientNoise(grainAt, z);
  vec3 layers = vec3(gradientNoise(grainAt, z + 101.0), gradientNoise(grainAt, z + 211.0), gradientNoise(grainAt, z + 307.0));
  vec3 noise = mix(vec3(mono), layers, GRAIN_COLOR);
  float y = clamp(luminance(color), 0.0, 1.0);
  color += grain * 1.4 * noise * 2.0 * (1.0 - y) * (0.5 + y);

  out_FragColor = vec4(clamp(color, 0.0, 1.0) * gate, 1.0);
}
`,Z=6,We=1,Ge=.5,Q=18,Ke=class extends h{constructor(e,t={}){super(e),this.fade_=t.fade??.5,this.halation_=t.halation??.5,this.grain_=t.grain??.15,this.weave_=t.weave??1.5,this.flicker_=t.flicker??.08,this.lightLeaks_=t.lightLeaks??.5,this.aspectRatio_=t.aspectRatio??4/3}createStage_(){let e=Y(`czm_super8_halation`,Ge),t=new r({stages:[e,new l({fragmentShader:X+M+Ue,uniforms:{blurTexture:e.name,time:()=>performance.now()/1e3,fade:()=>this.fade_,halation:()=>this.halation_,grain:()=>this.grain_,weave:()=>this.weave_,flicker:()=>this.flicker_,lightLeaks:()=>this.lightLeaks_,aspectRatio:()=>this.aspectRatio_}})],inputPreviousStageTexture:!1,uniforms:e.uniforms});return t.uniforms.sigma=Z,t.uniforms.stepSize=We,t}activated_(e){_(e,Q)}deactivating_(e){y(e,Q)}get fade(){return this.fade_}set fade(e){this.fade_=e}get halation(){return this.halation_}set halation(e){this.halation_=e}get grain(){return this.grain_}set grain(e){this.grain_=e}get weave(){return this.weave_}set weave(e){this.weave_=e}get flicker(){return this.flicker_}set flicker(e){this.flicker_=e}get lightLeaks(){return this.lightLeaks_}set lightLeaks(e){this.lightLeaks_=e}get aspectRatio(){return this.aspectRatio_}set aspectRatio(e){this.aspectRatio_=e}},qe=`// Three-strip Technicolor: the camera split the scene into red, green and blue records, each
// printed with its complementary dye, the three dyes over each other. Each color gains its purity,
// what it has over the other two, and loses some of theirs: grays stay, primaries deepen. After
// prod80's ReShade Technicolor (MIT), https://github.com/prod80/prod80-ReShade-Repository
uniform sampler2D colorTexture;
// 0 to 1
uniform float strength;
// width over height of the visible frame, 0 for the whole canvas
uniform float aspectRatio;
in vec2 v_textureCoordinates;

// how much of the other colors' purity each color loses
const float COLOR_STRENGTH = 0.2;

void main() {
  vec2 inFrame = (v_textureCoordinates - 0.5) / frameSize(aspectRatio);
  if (max(abs(inFrame.x), abs(inFrame.y)) > 0.5) {
    out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 color = sceneColor.rgb;
  // red: r (1 - g) (1 - b), and so on
  vec3 negative = 1.0 - color;
  vec3 purity = color * negative.grg * negative.bbr;
  vec3 taken = COLOR_STRENGTH * purity;
  vec3 printed = color + purity - taken.yxy - taken.zzx;
  out_FragColor = vec4(clamp(mix(color, printed, strength), 0.0, 1.0), sceneColor.a);
}
`,Je=class extends h{constructor(e,t={}){super(e),this.strength_=t.strength??1,this.aspectRatio_=t.aspectRatio??0}createStage_(){return new l({fragmentShader:X+qe,uniforms:{strength:()=>this.strength_,aspectRatio:()=>this.aspectRatio_}})}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}get aspectRatio(){return this.aspectRatio_}set aspectRatio(e){this.aspectRatio_=e,this.viewer.scene.requestRender()}},Ye=`// Tilt-shift: a narrow band of sharpness around the focal distance and the blurred image further
// off, with the punchy colors of miniature photographs. Distances compare as ratios, like a lens:
// sharp within range factors of two of the focal distance, fully blurred at twice that.
uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// in factors of two of the focal distance
uniform float range;
// 0 to 1
uniform float saturation;
in vec2 v_textureCoordinates;

void main() {
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  float fromCamera = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  // no blur without a focus in front of the camera (the sky in the middle, a focus behind)
  float blur = target.w > 0.0 && target.z < 0.0
    ? smoothstep(range, 2.0 * range, abs(log2(fromCamera / length(target.xyz))))
    : 0.0;
  vec4 sceneColor = mix(texture(colorTexture, v_textureCoordinates), texture(blurTexture, v_textureCoordinates), blur);

  vec3 color = sceneColor.rgb;
  color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, 1.0 + saturation);
  color = mix(color, smoothstep(0.0, 1.0, color), saturation);
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
`,Xe=new i,Ze=class extends h{constructor(e,t={}){super(e),this.focus_=t.focus,this.range_=t.range??.3,this.blur_=t.blur??4,this.saturation_=t.saturation??.3}createStage_(e){let t=Y(`czm_tilt_shift_blur`),n=new r({stages:[t,new l({fragmentShader:m+Ye,uniforms:{blurTexture:t.name,focus:()=>q(e,this.focus_,Xe),range:()=>this.range_,saturation:()=>this.saturation_}})],inputPreviousStageTexture:!1,uniforms:t.uniforms});return n.uniforms.sigma=this.blur_,n}activated_(e){g(e)}deactivating_(e){p(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get blur(){return this.blur_}set blur(e){this.blur_=e,this.stage_&&(this.stage_.uniforms.sigma=e),this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}},Qe=`// Fog filling the valleys below an altitude: the fog along the ray from the camera to the pixel
// is the part of the ray below the top, the density thinning over a soft band under the top.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// meters above the ellipsoid
uniform float top;
// per meter
uniform float density;
// meters
uniform float softness;
uniform vec4 color;
in vec2 v_textureCoordinates;

// the sky is a ray this long, in meters
const float SKY_DISTANCE = 50000.0;
// tint of the fog at night, scaled by fog.minimumBrightness
const vec3 NIGHT = vec3(0.45, 0.55, 0.85);

// the integral of clamp(x, 0, 1)
float ramp(float x) {
  return x <= 0.0 ? 0.0 : x < 1.0 ? 0.5 * x * x : x - 0.5;
}

// mean fraction of the density along a straight ray from height h0 to h1
float fogFraction(float h0, float h1) {
  float band = max(softness, 1e-3);
  if (abs(h1 - h0) < 1e-2) {
    return clamp((top - h0) / band, 0.0, 1.0);
  }
  return band * (ramp((top - h0) / band) - ramp((top - h1) / band)) / (h1 - h0);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  // the sky is a direction
  vec3 end = eye.w == 0.0 ? eye.xyz * SKY_DISTANCE : eye.xyz;
  float amount = 1.0 - exp(-density * length(end) * fogFraction(cameraHeight, heightAt(end)));
  // lit by the sun, as Cesium's fog: the fog color during the day, turning around sunset to a
  // moonlit blue as bright as the scene's fog.minimumBrightness, rather than a flat gray
  float day = smoothstep(-0.1, 0.3, dot(up, czm_sunDirectionEC));
  vec3 fogColor = mix(NIGHT * czm_fogMinimumBrightness, color.rgb, day);
  out_FragColor = vec4(mix(sceneColor.rgb, fogColor, amount * color.a), sceneColor.a);
}
`,$e=class extends h{constructor(e,t={}){super(e),this.top_=t.top??1500,this.density_=t.density??.005,this.softness_=t.softness??100,this.color_=t.color??new o(.85,.88,.92,1)}createStage_(e){return new l({fragmentShader:m+j+Qe,uniforms:{...A(e),top:()=>this.top_,density:()=>this.density_,softness:()=>this.softness_,color:()=>this.color_}})}activated_(e){g(e)}deactivating_(e){p(e)}get top(){return this.top_}set top(e){this.top_=e,this.viewer.scene.requestRender()}get density(){return this.density_}set density(e){this.density_=e,this.viewer.scene.requestRender()}get softness(){return this.softness_}set softness(e){this.softness_=e,this.viewer.scene.requestRender()}get color(){return this.color_}set color(e){this.color_=e,this.viewer.scene.requestRender()}},et={m:e=>`${e} m`,deg:e=>`${e}°`,percent:e=>`${Math.round(e*100)} %`,shutter:e=>`1/${Math.round(1/e)} s`,px:e=>`${+e.toFixed(1)} px`,hz:e=>`${e} Hz`,"per-m":e=>`${+e.toFixed(4)} /m`};for(let e of document.querySelectorAll(`#controls wa-slider[data-unit]`))e.valueFormatter=et[e.dataset.unit];var $=[`snowLine`,`valleyFog`,`spotlight`,`precipitation`,`lightning`,`tiltShift`,`motionBlur`,`speedLines`,`colorIsolation`,`infrared`,`technicolor`,`super8`,`lensDistortion`,`jello`,`droneDisplay`,`analogVideo`,`digitalVideo`];e(`cesiumContainer`).then(e=>{e.clock.currentTime=Cesium.JulianDate.fromIso8601(`2026-09-25T14:00:00+02:00`),e.clock.shouldAnimate=!1;let t={snowLine:new je(e),valleyFog:new $e(e),tiltShift:new Ze(e),motionBlur:new ee(e,{exposure:.04}),speedLines:new Fe(e),spotlight:new He(e),precipitation:new ke(e),lightning:new me(e),colorIsolation:new x(e),infrared:new C(e),technicolor:new Je(e),super8:new Ke(e),lensDistortion:new ae(e),jello:new re(e),droneDisplay:new te(e),analogVideo:new v(e),digitalVideo:new ne(e)},n=!1;document.querySelector(`#controls`).addEventListener(`input`,e=>{let{name:r,value:i,checked:a}=e.target,o=e.target.closest(`[data-effect]`).dataset.effect;if(r===`followCursor`){n=a;return}if(r===`inFront`){t.lightning.inFront=a;return}if(r!==`active`){let e=Number(i);t[o][r]=Number.isNaN(e)?i:e;return}if(t[o].active=a,a){e.target.closest(`wa-details`).open=!0;for(let e of $.slice($.indexOf(o)+1))t[e].active&&(t[e].active=!1,t[e].active=!0)}});let r=e=>{t.tiltShift.focus=e,t.spotlight.focus=e,t.speedLines.focus=e};e.screenSpaceEventHandler.setInputAction(({position:t})=>{let n=e.scene.pickPosition(t);n&&r(n)},Cesium.ScreenSpaceEventType.LEFT_CLICK),e.screenSpaceEventHandler.setInputAction(({endPosition:r})=>{let i=n&&e.scene.pickPosition(r);i&&(t.spotlight.focus=i)},Cesium.ScreenSpaceEventType.MOUSE_MOVE),document.querySelector(`#center`).addEventListener(`click`,()=>r(void 0))});