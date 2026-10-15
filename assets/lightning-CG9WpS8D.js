import{C as e,O as t,S as n,a as r,f as i,i as a,o}from"./cesium-shim-CaB5chxw.js";import{i as s,n as c,r as l,t as u}from"./EyeFromDepth-DmDC5MHh.js";import{n as d,t as f}from"./frame-clock-JIPNaZFQ.js";import{t as p}from"./Hash-CBIEOLtO.js";import{u as m}from"./precipitation-_wsDY9cy.js";function h(e,t,n,r,i,a){for(let n=e.length-1;n>=0;n--)t-e[n].start>1&&e.splice(n,1);if(e.length<4&&i()<1-Math.exp(-r*n)){let n=a(t);n&&e.push(n)}}var g=`// Lightning, cloud-to-ground strikes: a branching channel from the cloud base to the ground, with 2 to 4
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
// less with its distance to the strike, and the sky toward the cloud above it. Seen from above the cloud
// base, the channel is hidden in the cloud, and the flash lights the cloud over the strike from inside, as
// a glow. Needs EyeFromDepth and Hash.
precision highp sampler2D;
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
// the glow of each strike in the clouds, in eye coordinates, and the map's intensity at the strike,
// 0 for none; and 0 below the cloud base to 1 above it, where the glow replaces the channel
uniform vec4 strikeGlow[STRIKES];
uniform float above;
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
// the glow in the clouds above a strike, seen from above: as wide as this, in meters, and as bright
const float GLOW_RADIUS = 4000.0;
const float GLOW_BRIGHTNESS = 0.9;
// seen from above, most of the way to the glow is through thin air: its light is dimmed by at most
// this many meters of the air near the ground, about the height over which the air thins by e
const float GLOW_AIR = 8000.0;

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

    // seen from above, the flash lights the cloud over the strike from inside: a glow around the
    // point of the view ray nearest to it, hidden behind nearer terrain
    vec4 glow = strikeGlow[k];
    float along = dot(glow.xyz, normalize(eye.xyz));
    if (above > 0.0 && glow.w > 0.0 && along > 0.0 && sceneDistance > along * 0.98) {
      float across = length(glow.xyz - normalize(eye.xyz) * along);
      light += FLASH_COLOR * transmittance(min(along, GLOW_AIR)) * flash * glow.w * above * GLOW_BRIGHTNESS * exp(-across * across / (GLOW_RADIUS * GLOW_RADIUS));
    }

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
      channel += (1.0 - above) * bolt * transmittance(boltDistance) * (profile.x + profile.y * HALO_COLOR);
    }
  }
  out_FragColor = vec4(color + light + channel, sceneColor.a);
}
`,_=30,v=.4,y=300,b=500,x=.1,S=n.TWO_PI,C=5,w=.7,T=[.25,.75],E=n.PI/6,D=[.5,.9],O=15e4,k=16,A=8,j=1500,M=200;function N(e,t,r){let i=n.clamp((r-e)/(t-e),0,1);return i*i*(3-2*i)}var P=new a,F=class extends s{constructor(t,a={}){super(t),this.intensity_=a.intensity??.5,this.cloudBase_=a.cloudBase??2500,this.radius_=a.radius??5e3,this.inFront_=a.inFront??!1,this.weatherMap_=new m(1),this.weatherMap_.map=a.map,this.strikes_=[],this.strikeTop_=Array.from({length:4},()=>new r),this.strikeBottom_=Array.from({length:4},()=>new r(0,0,0,-1)),this.strikeBranches_=Array.from({length:4*C},()=>new r),this.strikeGlow_=Array.from({length:4},()=>new r),this.above_=0,this.lastTime_=0,this.strikeEvent=new i,this.onPreRender_=()=>{let t=this.viewer.scene,i=performance.now()/1e3,a=Math.min(i-this.lastTime_,x);this.lastTime_=i;let o=Math.min((this.usedRadius_()/this.radius_)**2,k);h(this.strikes_,i,a,this.intensity_*v*o,Math.random,e=>{let t=this.createStrike_(e);return t&&this.strikeEvent.raiseEvent(t.ground),t}),this.above_=n.clamp((t.camera.positionCartographic.height-this.cloudBase_+M)/400,0,1);let s=t.camera.viewMatrix;for(let t=0;t<4;t++){let n=this.strikes_[t];if(!n)this.strikeBottom_[t].w=-1,this.strikeGlow_[t].w=0;else{e.multiplyByPoint(s,n.top,P),r.fromElements(P.x,P.y,P.z,n.seed,this.strikeTop_[t]),e.multiplyByPoint(s,n.ground,P),r.fromElements(P.x,P.y,P.z,i-n.start,this.strikeBottom_[t]);for(let e=0;e<C;e++){let[i,a,o]=n.branches[e];r.fromElements(i,Math.cos(a),Math.sin(a),o,this.strikeBranches_[t*C+e])}e.multiplyByPoint(s,n.glow,P),r.fromElements(P.x,P.y,P.z,n.glowIntensity,this.strikeGlow_[t])}}}}usedRadius_(){let e=this.viewer.scene.camera.positionCartographic.height;return Math.min(Math.max(this.radius_,e),O)}createStrike_(e){let t=this.viewer.scene,{longitude:n,latitude:r}=t.camera.positionCartographic,i=t.ellipsoid.maximumRadius;for(let a=0;a<A;a++){let a=this.inFront_?t.camera.heading+(Math.random()*2-1)*E:Math.random()*S,o=y+Math.max(this.usedRadius_()-y,0)*Math.sqrt(Math.random()),s=n+o*Math.sin(a)/(i*Math.cos(r)),c=r+o*Math.cos(a)/i,l=this.weatherMap_.intensityAt(s,c);if(!this.weatherMap_.map||Math.random()<N(D[0],D[1],l))return this.strikeAt_(e,s,c,l)}}strikeAt_(e,t,n,r){let i=this.viewer.scene,s=Array.from({length:C},()=>{let e=.1+.7*Math.random();return[e,(Math.random()<.5?-1:1)*(T[0]+(T[1]-T[0])*Math.random()),Math.random()<w?(1-e)*(.25+.4*Math.random()):0]}),c=i.globe?.getHeight(new o(t,n))??0;return{start:e,seed:Math.random()*100,branches:s,ground:a.fromRadians(t,n,c,i.ellipsoid),top:a.fromRadians(t,n,Math.max(this.cloudBase_,c+b),i.ellipsoid),glow:a.fromRadians(t,n,this.cloudBase_+j,i.ellipsoid),glowIntensity:r}}createStage_(e){let n=new t({fragmentShader:p+u+g,uniforms:{strikeTop:()=>this.strikeTop_,strikeBottom:()=>this.strikeBottom_,strikeBranches:()=>this.strikeBranches_,strikeGlow:()=>this.strikeGlow_,above:()=>this.above_}});return n.enabled=this.intensity_>0,n}activated_(e){this.lastTime_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),c(e),this.intensity_>0&&f(e,_)}deactivating_(e){this.intensity_>0&&d(e,_),l(e),e.preRender.removeEventListener(this.onPreRender_),this.strikes_.length=0;for(let e of this.strikeBottom_)e.w=-1;for(let e of this.strikeGlow_)e.w=0}get intensity(){return this.intensity_}set intensity(e){let t=this.intensity_>0;this.intensity_=e,this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?f:d)(this.viewer.scene,_)),this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get inFront(){return this.inFront_}set inFront(e){this.inFront_=e}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}get map(){return this.weatherMap_.map}set map(e){this.weatherMap_.map=e}};export{F as t};