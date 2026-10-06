import{N as e,T as t,a as n,b as r,f as i,i as a,o,w as s}from"./cesium-shim-xDTaFLvd.js";import{a as c,i as l,n as u,r as d,t as f}from"./EyeFromDepth-OMdZ3JZV.js";import{n as p,t as m}from"./frame-clock-Jp45dJBg.js";var h=new WeakMap;function g(e){h.set(e,(h.get(e)??0)+1)}function _(e){let t=(h.get(e)??0)-1;t>0?h.set(e,t):h.delete(e)}function v(e){return h.has(e)}var ee=new a,y=new a;function b(e){return{cameraHeight:()=>e.camera.positionCartographic.height,up:()=>{let t=e.ellipsoid.geodeticSurfaceNormal(e.camera.positionWC,ee);return r.multiplyByPointAsVector(e.camera.viewMatrix,t,t)},radius:()=>{let t=e.ellipsoid.scaleToGeodeticSurface(e.camera.positionWC,y);return t?a.magnitude(t):e.ellipsoid.maximumRadius}}}var x=`// Height above the ellipsoid of a point in eye coordinates, computed relative to the camera: in
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

// the part below a height of the ray from the camera to a point in eye coordinates, as shares of
// it, from its start to its end, the height taken as linear along it; none when both ends are above
vec2 belowHeight(vec3 rayEnd, float height) {
  float h0 = cameraHeight;
  float h1 = heightAt(rayEnd);
  if (min(h0, h1) >= height) {
    return vec2(0.0);
  }
  return vec2(h0 > height ? (h0 - height) / (h0 - h1) : 0.0, h1 > height ? (height - h0) / (h1 - h0) : 1.0);
}
`,S=`// The haze of the rain or the snow, which Precipitation and Clouds share: the visibility in it, its
// opacity over a length of the ray in it, and its color, lit by the sun as ValleyFog's fog, a
// moonlit blue at night. Needs Height.

// visibility in meters at intensity 0 and 1, in the rain and in the snow
const vec2 RAIN_VISIBILITY = vec2(40000.0, 4000.0);
const vec2 SNOW_VISIBILITY = vec2(20000.0, 500.0);
// the haze never quite hides the sky and the far terrain
const float MAX_HAZE = 0.9;
// tint of the haze at night, scaled by fog.minimumBrightness
const vec3 NIGHT = vec3(0.45, 0.55, 0.85);
// the haze under the clouds by day, a brighter gray under snow clouds
const vec3 RAIN_HAZE = vec3(0.6, 0.64, 0.68);
const vec3 SNOW_HAZE = vec3(0.7, 0.72, 0.76);

// the visibility, in meters, from the rain's to the snow's, shorter as it rains harder
float rainVisibility(float intensity, float snow) {
  vec2 range = RAIN_VISIBILITY * pow(SNOW_VISIBILITY / RAIN_VISIBILITY, vec2(snow));
  return range.x * pow(range.y / range.x, intensity);
}

// the haze's opacity over this many meters of the ray in the rain: 3.912 / visibility is the
// extinction that leaves 2 % of the light
float rainHaze(float rainLength, float visibility) {
  return MAX_HAZE * (1.0 - exp(-3.912 * rainLength / visibility));
}

// 0 at night to 1 by day, from the sun's height at the camera
float daylight() {
  return smoothstep(-0.1, 0.3, dot(up, czm_sunDirectionEC));
}

vec3 rainHazeColor(float day, float snow) {
  return mix(NIGHT * czm_fogMinimumBrightness, mix(RAIN_HAZE, SNOW_HAZE, snow), day);
}
`,C=`// Where it rains: the map of the local intensity, 0 to 1 in its red channel, over a rectangle of
// longitudes and latitudes, sampled bilinearly, which fades the rain in over a cell at its edges.
// Without a map, a pixel over the whole globe: rain everywhere for Precipitation, none for Clouds.
uniform sampler2D map;
// the rectangle in the ellipsoid's texture coordinates: its west and south, and one over its width
// and height
uniform vec4 mapBounds;

// the local intensity at a point in world coordinates: single precision rounds it to about half a
// meter, nothing at the scale of a map
float mapAt(vec3 positionWC) {
  vec3 normal = normalize(positionWC * czm_ellipsoidInverseRadii * czm_ellipsoidInverseRadii);
  vec2 uv = (czm_ellipsoidTextureCoordinates(normal) - mapBounds.xy) * mapBounds.zw;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
    return 0.0;
  }
  return texture(map, uv).r;
}
`,w=2*Math.PI,T=class{constructor(e){this.empty_=e,this.map_=void 0,this.data_=void 0,this.bounds=new n(0,0,1,1),this.texture_=void 0}get map(){return this.map_}set map(e){if(this.map_=e,!e)this.data_=void 0,n.fromElements(0,0,1,1,this.bounds);else{let{image:t,rectangle:r}=e;this.data_=`data`in t?t:t.getContext(`2d`,{willReadFrequently:!0})?.getImageData(0,0,t.width,t.height),n.fromElements(r.west/w+.5,r.south/Math.PI+.5,w/(r.east-r.west),Math.PI/(r.north-r.south),this.bounds)}this.texture_=this.texture_?.destroy()}intensityAt(e,t){if(!this.map_||!this.data_)return this.empty_;let{west:n,south:r,east:i,north:a}=this.map_.rectangle,o=(e-n)/(i-n),s=(t-r)/(a-r);if(o<0||o>1||s<0||s>1)return 0;let{width:c,height:l,data:u}=this.data_,d=Math.min(Math.max(o*c-.5,0),c-1),f=Math.min(Math.max((1-s)*l-.5,0),l-1),p=Math.floor(d),m=Math.floor(f),h=Math.min(p+1,c-1),g=Math.min(m+1,l-1),_=(e,t)=>u[4*(t*c+e)]/255,v=_(p,m)+(_(h,m)-_(p,m))*(d-p);return v+(_(p,g)+(_(h,g)-_(p,g))*(d-p)-v)*(f-m)}texture(t){if(!this.texture_){let n=255*this.empty_;this.texture_=new e({context:t,source:this.map_?.image??new ImageData(new Uint8ClampedArray([n,n,n,255]),1,1)})}return this.texture_}destroy(){this.texture_=this.texture_?.destroy()}};function te(e,t,n,r,i,a){for(let n=e.length-1;n>=0;n--)t-e[n].start>1&&e.splice(n,1);if(e.length<4&&i()<1-Math.exp(-r*n)){let n=a(t);n&&e.push(n)}}var ne=`// Lightning, cloud-to-ground strikes: a branching channel from the cloud base to the ground, with 2 to 4
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
`,E=30,D=.4,O=300,k=500,A=.1,re=2*Math.PI,j=5,ie=.7,M=[.25,.75],ae=Math.PI/6,N=[.5,.9],oe=15e4,se=16,ce=8,le=1500,ue=200;function P(e,t,n){let r=Math.min(Math.max((n-e)/(t-e),0),1);return r*r*(3-2*r)}var F=new a,I=class extends c{constructor(e,t={}){super(e),this.intensity_=t.intensity??.5,this.cloudBase_=t.cloudBase??2500,this.radius_=t.radius??5e3,this.inFront_=t.inFront??!1,this.weatherMap_=new T(1),this.weatherMap_.map=t.map,this.strikes_=[],this.strikeTop_=Array.from({length:4},()=>new n),this.strikeBottom_=Array.from({length:4},()=>new n(0,0,0,-1)),this.strikeBranches_=Array.from({length:4*j},()=>new n),this.strikeGlow_=Array.from({length:4},()=>new n),this.above_=0,this.lastTime_=0,this.strikeEvent=new i,this.onPreRender_=()=>{let e=this.viewer.scene,t=performance.now()/1e3,i=Math.min(t-this.lastTime_,A);this.lastTime_=t;let a=Math.min((this.usedRadius_()/this.radius_)**2,se);te(this.strikes_,t,i,this.intensity_*D*a,Math.random,e=>{let t=this.createStrike_(e);return t&&this.strikeEvent.raiseEvent(t.ground),t}),this.above_=Math.min(Math.max((e.camera.positionCartographic.height-this.cloudBase_+ue)/400,0),1);let o=e.camera.viewMatrix;for(let e=0;e<4;e++){let i=this.strikes_[e];if(!i){this.strikeBottom_[e].w=-1,this.strikeGlow_[e].w=0;continue}r.multiplyByPoint(o,i.top,F),n.fromElements(F.x,F.y,F.z,i.seed,this.strikeTop_[e]),r.multiplyByPoint(o,i.ground,F),n.fromElements(F.x,F.y,F.z,t-i.start,this.strikeBottom_[e]);for(let t=0;t<j;t++){let[r,a,o]=i.branches[t];n.fromElements(r,Math.cos(a),Math.sin(a),o,this.strikeBranches_[e*j+t])}r.multiplyByPoint(o,i.glow,F),n.fromElements(F.x,F.y,F.z,i.glowIntensity,this.strikeGlow_[e])}}}usedRadius_(){let e=this.viewer.scene.camera.positionCartographic.height;return Math.min(Math.max(this.radius_,e),oe)}createStrike_(e){let t=this.viewer.scene,{longitude:n,latitude:r}=t.camera.positionCartographic,i=t.ellipsoid.maximumRadius;for(let a=0;a<ce;a++){let a=this.inFront_?t.camera.heading+(Math.random()*2-1)*ae:Math.random()*re,o=O+Math.max(this.usedRadius_()-O,0)*Math.sqrt(Math.random()),s=n+o*Math.sin(a)/(i*Math.cos(r)),c=r+o*Math.cos(a)/i,l=this.weatherMap_.intensityAt(s,c);if(!this.weatherMap_.map||Math.random()<P(N[0],N[1],l))return this.strikeAt_(e,s,c,l)}}strikeAt_(e,t,n,r){let i=this.viewer.scene,s=Array.from({length:j},()=>{let e=.1+.7*Math.random();return[e,(Math.random()<.5?-1:1)*(M[0]+(M[1]-M[0])*Math.random()),Math.random()<ie?(1-e)*(.25+.4*Math.random()):0]}),c=i.globe?.getHeight(new o(t,n))??0;return{start:e,seed:Math.random()*100,branches:s,ground:a.fromRadians(t,n,c,i.ellipsoid),top:a.fromRadians(t,n,Math.max(this.cloudBase_,c+k),i.ellipsoid),glow:a.fromRadians(t,n,this.cloudBase_+le,i.ellipsoid),glowIntensity:r}}createStage_(e){let t=new s({fragmentShader:l+f+ne,uniforms:{strikeTop:()=>this.strikeTop_,strikeBottom:()=>this.strikeBottom_,strikeBranches:()=>this.strikeBranches_,strikeGlow:()=>this.strikeGlow_,above:()=>this.above_}});return t.enabled=this.intensity_>0,t}activated_(e){this.lastTime_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),u(e),this.intensity_>0&&m(e,E)}deactivating_(e){this.intensity_>0&&p(e,E),d(e),e.preRender.removeEventListener(this.onPreRender_),this.strikes_.length=0;for(let e of this.strikeBottom_)e.w=-1;for(let e of this.strikeGlow_)e.w=0}get intensity(){return this.intensity_}set intensity(e){let t=this.intensity_>0;this.intensity_=e,this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?m:p)(this.viewer.scene,E)),this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get inFront(){return this.inFront_}set inFront(e){this.inFront_=e}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}get map(){return this.weatherMap_.map}set map(e){this.weatherMap_.map=e}},L=`// random gradient in [-1, 1] at a lattice point
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
`,R=`// Precipitation, rain or snow: streaks of falling drops in four layers, nearer ones larger, faster
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
// Where it rains comes from the map: the shafts and the share of each ray in the rain from the
// shafts' pass, the drops from the map's intensity at the camera, read on the CPU. The haze's length
// below the cloud base is this pass's, from each pixel's depth, sharp at the ridges. Seen from
// above, where Clouds draws the clouds, they hide the rain under them: no shafts nor haze.
// Needs EyeFromDepth, Hash, Height, PrecipitationWind and RainHaze.
const int LAYERS = 4;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the shafts' opacity and the share of the ray in the rain, from PrecipitationShafts.glsl at a
// fraction of the resolution
uniform sampler2D shaftTexture;
// 1 when Clouds draws the clouds, 0 otherwise
uniform float clouds;
// the map's intensity at the camera, 0 to 1
uniform float localIntensity;
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
// a drop is a capsule from a point in its cell, its trail within a cell: the cells are taller than
// wide in the rain, square in the snow
// how far a flake flutters across its cell, in cells, and a streak wavers in the gusts
const float FLUTTER = 0.12;
const float WAVER = 0.08;
// the drops refract the haze's light, whiter than they would, as the milk film crews add to the
// water, for rain that shows; the flakes scatter it, near white
const float RAIN_MILK = 0.25;
const float SNOW_MILK = 0.35;
// the shafts' shade of the haze: darker in the rain, lighter in the snow
const float RAIN_SHAFT_SHADE = 0.75;
const float SNOW_SHAFT_SHADE = 1.1;
// the shafts' resolution, precipitation.js's SHAFT_SCALE
const float SHAFT_SCALE = 0.125;

// the shafts' opacity and the share of the ray in the rain, blurred by PrecipitationShaftBlur.glsl
// and upsampled bilinearly from their texture, which is read at its nearest texel
vec2 shafts() {
  // the size Cesium gives the texture
  vec2 size = ceil(czm_viewport.zw * SHAFT_SCALE);
  vec2 p = v_textureCoordinates * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 center = (i + 0.5) / size;
  vec2 texel = 1.0 / size;
  vec2 bottom = mix(texture(shaftTexture, center).rg, texture(shaftTexture, center + vec2(texel.x, 0.0)).rg, f.x);
  vec2 top = mix(texture(shaftTexture, center + vec2(0.0, texel.y)).rg, texture(shaftTexture, center + texel).rg, f.x);
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

  // none above the cloud base; as hard as it rains at the camera
  float raining = 1.0 - smoothstep(cloudBase - 50.0, cloudBase + 50.0, cameraHeight);

  // the haze over the part of the ray below the cloud base, as rainy as the shafts' pass found it,
  // from the rain's to the snow's color; from above, hidden by the clouds where Clouds draws them
  vec2 below = belowHeight(view * sceneDistance, cloudBase);
  vec2 shaft = shafts() * (1.0 - clouds * (1.0 - raining));
  float haze = rainHaze((below.y - below.x) * sceneDistance * shaft.y, rainVisibility(intensity, snow));
  vec3 hazeColor = rainHazeColor(daylight(), snow);
  vec3 color = mix(sceneColor.rgb, hazeColor, haze);

  color = mix(color, min(mix(RAIN_SHAFT_SHADE, SNOW_SHAFT_SHADE, snow) * hazeColor, vec3(1.0)), shaft.x);
  float local = intensity * localIntensity;
  // in eye coordinates: the direction the drops fall toward, tilted toward the east by the wind,
  // and north across it
  vec3 fall = czm_viewRotation * (sin(tilt) * eastWorld - cos(tilt) * upWorld);
  vec3 north = czm_viewRotation * northWorld;
  vec3 across = normalize(north - dot(north, fall) * fall);
  vec3 dropColor = min(hazeColor + mix(RAIN_MILK, SNOW_MILK, snow), vec3(1.0));

  float cosTheta = dot(view, fall);
  float sinTheta = sqrt(max(1.0 - cosTheta * cosTheta, 0.0));
  // none toward the poles, where the cells shrink below a pixel
  if (raining > 0.0 && local > 0.0 && sinTheta > 0.01) {
    float around = atan(dot(view, cross(fall, across)), dot(view, across));
    float along = log(sinTheta / max(1.0 + cosTheta, 1e-6));
    float density = DENSITY * local;
    float streak = trail;
    float amplitude = mix(WAVER, FLUTTER, snow);
    // a pixel in radians, around the pole of the fall, where cells shrink
    float pixelOverSin = pixel / sinTheta;
    float brightness = raining * (0.5 + 0.5 * local);
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
`,z=`// The shafts' opacity and the share of the ray in the rain, blurred over the neighboring texels at
// their own resolution: they fade out around the ridges in front of them rather than stopping at
// their outline. A 3 x 3 binomial kernel here costs a 64th of the reads the same blur would take
// at the full resolution.
uniform sampler2D shaftTexture;
in vec2 v_textureCoordinates;

void main() {
  // czm_viewport is this pass's texture, the size of the shafts'
  vec2 texel = 1.0 / czm_viewport.zw;
  vec2 sum = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      sum += weight * texture(shaftTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel).rg;
    }
  }
  out_FragColor = vec4(sum / 16.0, 0.0, 1.0);
}
`,B=`// The shafts of the rain or the snow, at a fraction of the resolution: their opacity along each
// view ray, for Precipitation.glsl to shade, and the share of the ray in the rain, for its haze,
// which it computes at its own resolution, sharp at the ridges. Both are over the part of the ray
// below the cloud base, where it rains, found from the scene's depth before it is sampled:
// from far above, a pixel shows the rain in the column under it. Along that part, patches of noise
// on the ground under each sample, more of them as it rains harder, slanting with the wind from the
// cloud base and drifting with it, where the map has rain. Not dithered: at this resolution the
// dither shows as dots, where the patches are too soft to band. Needs EyeFromDepth, Noise, Height,
// PrecipitationWind and WeatherMap.
uniform sampler2D depthTexture;
in vec2 v_textureCoordinates;

// samples along the part of each ray below the cloud base, as far as SHAFT_DISTANCE from its
// start, size of the patches in meters, extinction inside them per meter, about 6 km of visibility
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
// the sky is a ray this long, Precipitation.glsl's SKY_DISTANCE
const float SKY_DISTANCE = 50000.0;

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 rayEnd = eye.w == 0.0 ? eye.xyz * SKY_DISTANCE : eye.xyz;
  // the part of the ray below the cloud base, and the part of it that is sampled
  vec2 below = belowHeight(rayEnd, cloudBase);
  float t0 = below.x;
  float t1 = below.y;
  float opacity = 0.0;
  float share = 0.0;
  if (t1 > t0) {
    float rayLength = length(rayEnd);
    float sampled = min(t1, t0 + SHAFT_DISTANCE / rayLength);
    // the ray in world coordinates, once rather than for each sample
    vec3 rayWC = czm_inverseViewRotation * rayEnd;
    vec3 upWorld = upWC();
    vec3 eastWorld = eastWC();
    float threshold = mix(0.4, 0.0, intensity);
    // the gusts sway the shafts, but they drift with the steady wind
    float slant = tan(gustingTilt());
    float drift = DRIFT_VELOCITY * speed * tan(radians(wind)) * time;
    float raining = 0.0;
    float density = 0.0;
    for (int i = 0; i < SHAFT_STEPS; i++) {
      float t = mix(t0, sampled, (float(i) + 0.5) / float(SHAFT_STEPS));
      float h = heightAt(rayEnd * t);
      vec3 ground = czm_viewerPositionWC + rayWC * t - upWorld * h;
      float local = mapAt(ground);
      raining += local;
      ground -= eastWorld * ((cloudBase - h) * slant + drift);
      float top = clamp((cloudBase - h) / SHAFT_TOP, 0.0, 1.0);
      density += local * top * smoothstep(threshold - 0.3, threshold + 0.3, gradientNoise(ground / SHAFT_SIZE));
    }
    // the whole part below the cloud base is as rainy as its sampled part
    share = raining / float(SHAFT_STEPS);
    float depth = mix(SHAFT_EXTINCTION.x, SHAFT_EXTINCTION.y, snow) * (0.5 + 0.5 * intensity) * density * (sampled - t0) * rayLength / float(SHAFT_STEPS);
    opacity = 1.0 - exp(-depth);
  }
  out_FragColor = vec4(opacity, share, 0.0, 1.0);
}
`,V=`// What the passes of the precipitation share: the local frame at the camera and the wind, in gusts.
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
`,H=30,U=3600,W=9,de=1,G=4.44,fe=20,K=2,q=1/30,pe=1/90,me=1,J=2*Math.PI,Y=4,he=20,ge=4,_e=1e3,ve=.1,X=.125,Z=.5,Q=50;function ye(e,t,n){let r=Math.min(Math.max((n-e)/(t-e),0),1);return r*r*(3-2*r)}var $=new WeakMap;function be(e){let t=$.get(e);if(t){t.count++;return}$.set(e,{count:1,light:e.light,intensity:e.light.intensity,shadows:e.shadowMap.enabled}),e.light.intensity*=Z,e.shadowMap.enabled=!1}function xe(e,t){let n=$.get(e);n&&(n.light.intensity=n.intensity*(1-.5*t),e.shadowMap.enabled=n.shadows&&t<.5)}function Se(e){let t=$.get(e);!t||--t.count>0||(t.light.intensity=t.intensity,e.shadowMap.enabled=t.shadows,$.delete(e))}var Ce=class extends c{constructor(e,t={}){super(e),this.intensity_=t.intensity??.5,this.wind_=t.wind??10,this.speed_=t.speed??1,this.cloudBase_=t.cloudBase??2500,this.snow_=t.snow??0,this.weatherMap_=new T(1),this.weatherMap_.map=t.map,this.localIntensity_=1,this.offset_=0,this.lastTime_=0,this.layerShape_=Array.from({length:Y},()=>new n),this.layerLook_=Array.from({length:Y},()=>new n),this.onPreRender_=()=>{let e=performance.now()/1e3,t=Math.min(e-this.lastTime_,ve);this.lastTime_=e,this.offset_=(this.offset_+t*this.fallSpeed_()*this.cellsAlong_()/K)%_e,this.updateLayers_();let{longitude:n,latitude:r,height:i}=this.viewer.scene.camera.positionCartographic;this.localIntensity_=this.weatherMap_.intensityAt(n,r);let a=1-ye(this.cloudBase_-Q,this.cloudBase_+Q,i);xe(this.viewer.scene,this.localIntensity_*a)}}fallSpeed_(){return this.speed_*W*(de/W)**this.snow_}updateLayers_(){let e=this.cellsAlong_();for(let t=0;t<Y;t++){let r=2**t,i=Math.floor(J*he*r+.5);n.fromElements(i/J,e*r,i,K*r,this.layerShape_[t]);let a=Math.max(.5,1-.25*t),o=Math.max(ge/r,.75),s=.45-.07*t,c=.8-.12*t,l=t===0?1.4*o*1.8:1.4*o+.5;n.fromElements(s+(c-s)*this.snow_,a+.5+(l-a-.5)*this.snow_,a,o,this.layerLook_[t])}}trail_(){let e=q*(pe/q)**this.snow_;return Math.min(this.fallSpeed_()*e*this.cellsAlong_()/K,me)}cellsAlong_(){return G*(fe/G)**this.snow_}createStage_(e){let n={...b(e),time:()=>performance.now()/1e3%U,wind:()=>this.wind_,speed:()=>this.speed_,cloudBase:()=>this.cloudBase_,intensity:()=>this.intensity_,snow:()=>this.snow_},r=new s({fragmentShader:f+L+x+V+C+B,uniforms:{...n,map:()=>this.weatherMap_.texture(e.context),mapBounds:()=>this.weatherMap_.bounds},textureScale:X}),i=new s({fragmentShader:z,uniforms:{shaftTexture:r.name},textureScale:X}),a=new t({stages:[r,i,new s({fragmentShader:f+l+x+V+S+R,uniforms:{...n,shaftTexture:i.name,localIntensity:()=>this.localIntensity_,clouds:()=>+!!v(e),trail:()=>this.trail_(),layerShape:()=>this.layerShape_,layerLook:()=>this.layerLook_,offset:()=>this.offset_}})],inputPreviousStageTexture:!1});return a.enabled=this.intensity_>0,a}activated_(e){this.lastTime_=performance.now()/1e3,this.updateLayers_(),e.preRender.addEventListener(this.onPreRender_),u(e),be(e),this.intensity_>0&&m(e,H)}deactivating_(e){this.intensity_>0&&p(e,H),Se(e),d(e),e.preRender.removeEventListener(this.onPreRender_),this.weatherMap_.destroy()}get map(){return this.weatherMap_.map}get localIntensity(){return this.localIntensity_}set map(e){this.weatherMap_.map=e,this.viewer.scene.requestRender()}get intensity(){return this.intensity_}set intensity(e){let t=this.intensity_>0;this.intensity_=e,this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?m:p)(this.viewer.scene,H)),this.viewer.scene.requestRender()}get wind(){return this.wind_}set wind(e){this.wind_=e,this.viewer.scene.requestRender()}get speed(){return this.speed_}set speed(e){this.speed_=e,this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get snow(){return this.snow_}set snow(e){this.snow_=e,this.viewer.scene.requestRender()}};export{C as a,b as c,T as i,g as l,L as n,S as o,I as r,x as s,Ce as t,_ as u};