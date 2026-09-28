import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,i as r,n as i,o as a,r as o,t as ee}from"./card-58mEaPX-.js";import{a as s,c as te,d as c,o as l}from"./directive-helpers-B5gL4DMf.js";import{t as u}from"./setup-Duq8wk3i.js";import{D as d,N as f,T as p,a as m,b as h,c as ne,i as g,w as _,y as v}from"./cesium-shim-deYMRcZt.js";import"./switch-BktEAscN.js";import"./button-C4a7i2eR.js";import{a as y,i as b,n as x,o as S,r as C,t as re}from"./motion-blur-H9Tf_aeZ.js";import{_ as ie,a as w,b as ae,d as oe,f as se,g as ce,l as T,r as E,t as D,u as O,v as k,x as A,y as j}from"./slider-BbZRZLSJ.js";var M=`// Color isolation: one hue keeps its color, the rest of the scene turns gray. After prod80's
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
`,N=`// Hue (0 to 1, red at 0), saturation and lightness of a color.
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
`,P=class extends S{constructor(e,t={}){super(e),this.hue_=t.hue??0,this.range_=t.range??60,this.strength_=t.strength??1}createStage_(){return new _({fragmentShader:N+M,uniforms:{hue:()=>this.hue_/360,range:()=>this.range_/360,strength:()=>this.strength_}})}get hue(){return this.hue_}set hue(e){this.hue_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}},F=`// Black and white infrared film: foliage, which reflects the near infrared, turns bright, the sky
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
`,I=class extends S{constructor(e,t={}){super(e),this.strength_=t.strength??1}createStage_(){return new _({fragmentShader:N+F,uniforms:{strength:()=>this.strength_}})}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}},L=`// The barrel distortion and dark corners of a wide-angle lens, like those of FPV cameras: straight
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
`,R=class extends S{constructor(e,t={}){super(e),this.distortion_=t.distortion??.5,this.vignette_=t.vignette??.5}createStage_(){let e=new _({fragmentShader:L,uniforms:{distortion:()=>this.distortion_,vignette:()=>this.vignette_}});return e.enabled=this.enabled_(),e}enabled_(){return this.distortion_>0||this.vignette_>0}get distortion(){return this.distortion_}set distortion(e){this.distortion_=e,this.update_()}get vignette(){return this.vignette_}set vignette(e){this.vignette_=e,this.update_()}update_(){this.stage_&&(this.stage_.enabled=this.enabled_()),this.viewer.scene.requestRender()}},z=new g,B=new g;function V(e){return{cameraHeight:()=>e.camera.positionCartographic.height,up:()=>{let t=e.ellipsoid.geodeticSurfaceNormal(e.camera.positionWC,z);return h.multiplyByPointAsVector(e.camera.viewMatrix,t,t)},radius:()=>{let t=e.ellipsoid.scaleToGeodeticSurface(e.camera.positionWC,B);return t?g.magnitude(t):e.ellipsoid.maximumRadius}}}var H=`// Height above the ellipsoid of a point in eye coordinates, computed relative to the camera: in
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
`,U=`// normal at the pixel from its neighbors at this distance in pixels: on each axis the nearer
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
`,W=`// Snow above an altitude, on slopes gentle enough to hold it, shaded by the sun and by the
// brightness of the scene so that the relief stays readable. The slope comes from a normal
// rebuilt from the neighboring pixels and smoothed over the facets of the terrain.
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

const vec3 SNOW = vec3(0.92, 0.94, 1.0);
// half width of the slope limit, in radians (8 degrees), so that the snow thins out across the
// facets of the terrain rather than stopping at their edges
const float SLOPE_EDGE = 0.14;

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float slope = acos(clamp(dot(normal, up), -1.0, 1.0));

  float snow = smoothstep(altitude - 0.5 * transition, altitude + 0.5 * transition, heightAt(eye.xyz));
  snow *= 1.0 - smoothstep(maxSlope - SLOPE_EDGE, maxSlope + SLOPE_EDGE, slope);
  // eye.w is 0 for the sky
  snow *= coverage * eye.w;
  float sun = max(dot(normal, czm_sunDirectionEC), 0.0);
  float brightness = dot(sceneColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 lit = SNOW * clamp(0.6 + 0.25 * sun + 0.3 * brightness, 0.0, 1.0);
  out_FragColor = vec4(mix(sceneColor.rgb, lit, snow), sceneColor.a);
}
`,G=class extends S{constructor(e,t={}){super(e),this.altitude_=t.altitude??2e3,this.transition_=t.transition??200,this.maxSlope_=t.maxSlope??40,this.coverage_=t.coverage??1}createStage_(e){return new _({fragmentShader:x+H+U+W,uniforms:{...V(e),altitude:()=>this.altitude_,transition:()=>this.transition_,maxSlope:()=>v.toRadians(this.maxSlope_),coverage:()=>this.coverage_}})}activated_(e){C(e)}deactivating_(e){b(e)}get altitude(){return this.altitude_}set altitude(e){this.altitude_=e,this.viewer.scene.requestRender()}get transition(){return this.transition_}set transition(e){this.transition_=e,this.viewer.scene.requestRender()}get maxSlope(){return this.maxSlope_}set maxSlope(e){this.maxSlope_=e,this.viewer.scene.requestRender()}get coverage(){return this.coverage_}set coverage(e){this.coverage_=e,this.viewer.scene.requestRender()}},le=new g;function K(e,t,n){let r=typeof t==`function`?t():t;if(!r)return m.fromElements(0,0,0,0,n);let i=h.multiplyByPoint(e.camera.viewMatrix,r,le);return m.fromElements(i.x,i.y,i.z,1,n)}var ue=`// Speed lines: the picture zooms toward the focus, more toward the edges of the screen, and thin
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
`,de=new m,fe=class extends S{constructor(e,t={}){super(e),this.focus_=t.focus,this.strength_=t.strength??1}createStage_(e){let t=new _({fragmentShader:y+ue,uniforms:{focus:()=>K(e,this.focus_,de),strength:()=>this.strength_,time:()=>performance.now()/1e3}});return t.enabled=this.strength_>0,t}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get strength(){return this.strength_}set strength(e){this.strength_=e,this.stage_&&(this.stage_.enabled=e>0),this.viewer.scene.requestRender()}},pe=`// The beam of a cone of light in the haze, for the spotlight and for lights of your own:
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

const int BEAM_SAMPLES = 16;

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
    float step = length_ * beam.spacing * pow(u, beam.spacing - 1.0) / float(BEAM_SAMPLES);
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
`,me=`// a filmic roll-off (ACES, Narkowicz's fit) for the effects that add light to the picture: Cesium
// has already tone mapped it, so their light would clip to flat white without it
vec3 filmic(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
`,q=`// random gradient in [-1, 1] at a lattice point
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
`,he=`// A searchlight above the focus, pointing down: it throws a pool of warm light radius meters
// wide on flat ground, with a soft penumbra, shades the relief under it and lights up the haze
// in its beam, raymarched; the rest of the scene darkens and loses its color. The cone and the
// falloff follow three.js's SpotLight.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// local up direction, in eye coordinates
uniform vec3 up;
// meters
uniform float radius;
// width of the penumbra, as a fraction of the radius
uniform float softness;
// 0 to 1
uniform float darkness;
// brightness of the beam in the air, 0 to 1
uniform float beam;
// brightness of the light, 1 for the searchlight: the pool and the beam scale with it
uniform float power;
// Henyey-Greenstein asymmetry of the haze, 0 to 1: it scatters mostly forward, so the beam is
// brighter when looking toward the light
uniform float beamAnisotropy;
in vec2 v_textureCoordinates;

const vec3 LIGHT_COLOR = vec3(1.0, 0.93, 0.8);
const float INTENSITY = 1.4;
// height of the light above the focus, in radii: a cone of 53 degrees
const float HEIGHT = 2.0;
// radius of the beam's bright core around the light, in heights: the inverse square is softened
// within it, as the pool's is capped, so that the top of the beam does not burn out
const float BEAM_CORE = 0.25;
// brightness of the lit haze, over the height so that it keeps with the radius, matched to the
// searchlight's former analytic beam at the default anisotropy
const float BEAM_DENSITY = 19.0;
// contrast and density of the dust streaks in the beam, across its width
const float STREAKS = 0.2;
const float STREAK_SCALE = 4.0;

// light reaching a point fromLight away from the light: the cone around the axis with its
// penumbra, and the inverse square, 1 at the focus, capped for what is close to the light
float spotAt(vec3 fromLight, vec3 axis, float height, float coneCos, float penumbraCos) {
  float lightDistance = length(fromLight);
  float spot = smoothstep(coneCos, penumbraCos, dot(fromLight, -axis) / lightDistance);
  return spot * min(height * height / (lightDistance * lightDistance), 4.0);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  // no light without a focus in front of the camera (the sky in the middle, a focus behind)
  if (target.w == 0.0 || target.z >= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  vec3 color = sceneColor.rgb;
  vec3 ambient = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), darkness) * (1.0 - darkness);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);

  float height = HEIGHT * radius;
  vec3 lightPosition = target.xyz + height * up;
  // cosines of the angles, from the light's axis, at which the pool ends and its penumbra starts
  float inner = radius * (1.0 - softness);
  float coneCos = height / sqrt(height * height + radius * radius);
  float penumbraCos = height / sqrt(height * height + inner * inner);

  // eye.w is 0 for the sky, where the view ray goes on
  float sceneDistance = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float scattered = 0.0;
  if (beam > 0.0) {
    Beam cone;
    cone.apex = lightPosition;
    cone.forward = -up;
    cone.edgeCos = coneCos;
    cone.coreCos = penumbraCos;
    cone.hotCore = 0.0;
    cone.light = lightPosition;
    cone.reference = height;
    cone.core = BEAM_CORE * height;
    cone.reach = 1e30;
    cone.extinction = 0.0;
    cone.anisotropy = beamAnisotropy;
    cone.spacing = 1.0;
    cone.nearFade = vec2(0.0);
    cone.dust = STREAKS;
    cone.dustScale = STREAK_SCALE;
    scattered = BEAM_DENSITY / height * beamAlong(normalize(eye.xyz), sceneDistance, cone);
  }
  vec3 haze = LIGHT_COLOR * (power * beam * scattered);
  if (eye.w == 0.0) {
    out_FragColor = vec4(filmic(ambient + haze), sceneColor.a);
    return;
  }

  vec3 toLight = lightPosition - eye.xyz;
  // the normal over wider steps where the surface is seen at a grazing angle, where the facets
  // of the terrain mesh would show as blotches; over fine ones elsewhere, for the relief
  vec3 coarse = normalize(normalAt(depthTexture, v_textureCoordinates, eye.xyz, 6.0 * czm_pixelRatio)
    + normalAt(depthTexture, v_textureCoordinates, eye.xyz, 18.0 * czm_pixelRatio));
  float grazing = smoothstep(0.7, 0.95, 1.0 - abs(dot(coarse, normalize(-eye.xyz))));
  vec3 normal = normalize(mix(smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz), coarse, grazing));
  float lambert = max(dot(normal, normalize(toLight)), 0.0);
  vec3 light = LIGHT_COLOR * (power * INTENSITY * spotAt(-toLight, up, height, coneCos, penumbraCos) * lambert);
  out_FragColor = vec4(filmic(ambient + color * light + haze), sceneColor.a);
}
`,ge=new m,_e=class extends S{constructor(e,t={}){super(e),this.focus_=t.focus,this.power_=t.power??1,this.radius_=t.radius??200,this.softness_=t.softness??.5,this.darkness_=t.darkness??.8,this.beam_=t.beam??.25,this.beamAnisotropy_=t.beamAnisotropy??.4}createStage_(e){return new _({fragmentShader:x+y+q+U+pe+me+he,uniforms:{focus:()=>K(e,this.focus_,ge),up:V(e).up,radius:()=>this.radius_,softness:()=>this.softness_,darkness:()=>this.darkness_,beam:()=>this.beam_,power:()=>this.power_,beamAnisotropy:()=>this.beamAnisotropy_}})}activated_(e){C(e)}deactivating_(e){b(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get power(){return this.power_}set power(e){this.power_=e,this.viewer.scene.requestRender()}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}get softness(){return this.softness_}set softness(e){this.softness_=e,this.viewer.scene.requestRender()}get darkness(){return this.darkness_}set darkness(e){this.darkness_=e,this.viewer.scene.requestRender()}get beam(){return this.beam_}set beam(e){this.beam_=e,this.viewer.scene.requestRender()}get beamAnisotropy(){return this.beamAnisotropy_}set beamAnisotropy(e){this.beamAnisotropy_=e,this.viewer.scene.requestRender()}};function J(e,t=1){let n=[`x`,`y`].map((n,r)=>new _({name:`${e}_${n}`,fragmentShader:`#define USE_STEP_SIZE\n${f}`,uniforms:{delta:1,sigma:2,stepSize:1,direction:r},sampleMode:d.LINEAR,textureScale:t})),r=e=>({get:()=>n[0].uniforms[e],set:t=>{for(let r of n)r.uniforms[e]=t}});return new p({name:e,stages:n,uniforms:Object.defineProperties({},{sigma:r(`sigma`),stepSize:r(`stepSize`)})})}var Y=`// Size of the visible frame of the given width over height, centered in the canvas, in texture
// coordinates: bars above and below when the canvas is narrower than the ratio, on the sides when
// it is wider; the whole canvas for a ratio of 0.
vec2 frameSize(float aspectRatio) {
  if (aspectRatio <= 0.0) {
    return vec2(1.0);
  }
  float canvas = czm_viewport.z / czm_viewport.w;
  return aspectRatio < canvas ? vec2(aspectRatio / canvas, 1.0) : vec2(1.0, canvas / aspectRatio);
}
`,ve=`// A Super 8 home movie: faded warm colors, halation around the highlights, heavy grain, the frame
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
`,ye=6,be=1,xe=.5,X=18,Se=class extends S{constructor(e,t={}){super(e),this.fade_=t.fade??.5,this.halation_=t.halation??.5,this.grain_=t.grain??.15,this.weave_=t.weave??1.5,this.flicker_=t.flicker??.08,this.lightLeaks_=t.lightLeaks??.5,this.aspectRatio_=t.aspectRatio??4/3}createStage_(){let e=J(`czm_super8_halation`,xe),t=new p({stages:[e,new _({fragmentShader:Y+q+ve,uniforms:{blurTexture:e.name,time:()=>performance.now()/1e3,fade:()=>this.fade_,halation:()=>this.halation_,grain:()=>this.grain_,weave:()=>this.weave_,flicker:()=>this.flicker_,lightLeaks:()=>this.lightLeaks_,aspectRatio:()=>this.aspectRatio_}})],inputPreviousStageTexture:!1,uniforms:e.uniforms});return t.uniforms.sigma=ye,t.uniforms.stepSize=be,t}activated_(e){ae(e,X)}deactivating_(e){A(e,X)}get fade(){return this.fade_}set fade(e){this.fade_=e}get halation(){return this.halation_}set halation(e){this.halation_=e}get grain(){return this.grain_}set grain(e){this.grain_=e}get weave(){return this.weave_}set weave(e){this.weave_=e}get flicker(){return this.flicker_}set flicker(e){this.flicker_=e}get lightLeaks(){return this.lightLeaks_}set lightLeaks(e){this.lightLeaks_=e}get aspectRatio(){return this.aspectRatio_}set aspectRatio(e){this.aspectRatio_=e}},Z=`// Three-strip Technicolor: the camera split the scene into red, green and blue records, each
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
`,Ce=class extends S{constructor(e,t={}){super(e),this.strength_=t.strength??1,this.aspectRatio_=t.aspectRatio??0}createStage_(){return new _({fragmentShader:Y+Z,uniforms:{strength:()=>this.strength_,aspectRatio:()=>this.aspectRatio_}})}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}get aspectRatio(){return this.aspectRatio_}set aspectRatio(e){this.aspectRatio_=e,this.viewer.scene.requestRender()}},we=`// Tilt-shift: a narrow band of sharpness around the focal distance and the blurred image further
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
`,Te=new m,Ee=class extends S{constructor(e,t={}){super(e),this.focus_=t.focus,this.range_=t.range??.3,this.blur_=t.blur??4,this.saturation_=t.saturation??.3}createStage_(e){let t=J(`czm_tilt_shift_blur`),n=new p({stages:[t,new _({fragmentShader:x+we,uniforms:{blurTexture:t.name,focus:()=>K(e,this.focus_,Te),range:()=>this.range_,saturation:()=>this.saturation_}})],inputPreviousStageTexture:!1,uniforms:t.uniforms});return n.uniforms.sigma=this.blur_,n}activated_(e){C(e)}deactivating_(e){b(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get blur(){return this.blur_}set blur(e){this.blur_=e,this.stage_&&(this.stage_.uniforms.sigma=e),this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}},De=`// Fog filling the valleys below an altitude: the fog along the ray from the camera to the pixel
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
`,Oe=class extends S{constructor(e,t={}){super(e),this.top_=t.top??1500,this.density_=t.density??.005,this.softness_=t.softness??100,this.color_=t.color??new ne(.85,.88,.92,1)}createStage_(e){return new _({fragmentShader:x+H+De,uniforms:{...V(e),top:()=>this.top_,density:()=>this.density_,softness:()=>this.softness_,color:()=>this.color_}})}activated_(e){C(e)}deactivating_(e){b(e)}get top(){return this.top_}set top(e){this.top_=e,this.viewer.scene.requestRender()}get density(){return this.density_}set density(e){this.density_=e,this.viewer.scene.requestRender()}get softness(){return this.softness_}set softness(e){this.softness_=e,this.viewer.scene.requestRender()}get color(){return this.color_}set color(e){this.color_=e,this.viewer.scene.requestRender()}},ke=t`
  :host {
    --spacing: var(--wa-space-m);
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: block;
  }

  details {
    display: block;
    overflow-anchor: none;
    border: var(--wa-panel-border-width) var(--wa-color-surface-border) var(--wa-panel-border-style);
    background-color: var(--wa-color-surface-default);
    border-radius: var(--wa-panel-border-radius);
    color: var(--wa-color-text-normal);

    /* Print styles */
    @media print {
      background: none;
      border: solid var(--wa-border-width-s) var(--wa-color-surface-border);

      summary {
        list-style: none;
      }
    }
  }

  /* Appearance modifiers */
  :host([appearance='plain']) details {
    background-color: transparent;
    border-color: transparent;
    border-radius: 0;
  }

  :host([appearance='outlined']) details {
    background-color: var(--wa-color-surface-default);
    border-color: var(--wa-color-surface-border);
  }

  :host([appearance='filled']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: transparent;
  }

  :host([appearance='filled-outlined']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-border-quiet);
  }

  :host([disabled]) details {
    opacity: 0.5;
    cursor: not-allowed;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing);
    padding: var(--spacing); /* Add padding here */
    border-radius: calc(var(--wa-panel-border-radius) - var(--wa-panel-border-width));
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;

    &::marker,
    &::-webkit-details-marker {
      display: none;
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: calc(var(--wa-panel-border-width) + var(--wa-focus-ring-offset));
    }
  }

  :host([open]) summary {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  /* 'Start' icon placement */
  :host([icon-placement='start']) summary {
    flex-direction: row-reverse;
    justify-content: start;
  }

  [part~='icon'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-text-quiet);
    transition: rotate var(--wa-transition-normal) var(--wa-transition-easing);
  }

  :host([open]) [part~='icon'] {
    rotate: 90deg;
  }

  :host([open]:dir(rtl)) [part~='icon'] {
    rotate: -90deg;
  }

  :host([open]) slot[name='expand-icon'],
  :host(:not([open])) slot[name='collapse-icon'] {
    display: none;
  }

  .body.animating {
    overflow: hidden;
  }

  .content {
    display: block;
    box-sizing: border-box; /* Ensure contents don't overflow */
    padding-block-start: var(--spacing);
    padding-inline: var(--spacing); /* Add horizontal padding */
    padding-block-end: var(--spacing); /* Add bottom padding */
  }
`,Q=class extends i{constructor(){super(...arguments),this.localize=new s(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance=`outlined`,this.iconPlacement=`end`}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?`auto`:`0`,this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(e=>{for(let t of e)t.type===`attributes`&&t.attributeName===`open`&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has(`isAnimating`)&&this.customStates.set(`animating`,this.isAnimating)}handleSummaryClick(e){e.composedPath().some(e=>{if(!(e instanceof HTMLElement))return!1;let t=e.tagName?.toLowerCase();return[`a`,`button`,`input`,`textarea`,`select`].includes(t)?!0:e instanceof te?!(`disabled`in e)||!e.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key===`ArrowUp`||e.key===`ArrowLeft`)&&(e.preventDefault(),this.hide()),(e.key===`ArrowDown`||e.key===`ArrowRight`)&&(e.preventDefault(),this.show())}closeOthersWithSameName(){this.name&&this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(e=>{e!==this&&e.open&&(e.open=!1)})}async handleOpenChange(){this.animationGeneration++;let e=this.animationGeneration;if(this.open){this.details.open=!0;let t=new se;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;let n=w(getComputedStyle(this.body).getPropertyValue(`--show-duration`));if(await E(this.body,[{height:`0`,opacity:`0`},{height:`${this.body.scrollHeight}px`,opacity:`1`}],{duration:n,easing:`linear`}),this.animationGeneration!==e)return;this.body.style.height=`auto`,this.isAnimating=!1,this.dispatchEvent(new T)}else{let t=new oe;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;let n=w(getComputedStyle(this.body).getPropertyValue(`--hide-duration`));if(await E(this.body,[{height:`${this.body.scrollHeight}px`,opacity:`1`},{height:`0`,opacity:`0`}],{duration:n,easing:`linear`}),this.animationGeneration!==e)return;this.body.style.height=`0`,this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new O)}}async show(){if(!(this.open||this.disabled))return this.open=!0,D(this,`wa-after-show`)}async hide(){if(this.open&&!this.disabled)return this.open=!1,D(this,`wa-after-hide`)}render(){let t=this.hasUpdated?this.localize.dir()===`rtl`:this.dir===`rtl`;return e`
      <details part="base details">
        <summary
          part="header"
          role="button"
          aria-expanded=${this.open?`true`:`false`}
          aria-controls="content"
          aria-disabled=${this.disabled?`true`:`false`}
          tabindex=${this.disabled?`-1`:`0`}
          @click=${this.handleSummaryClick}
          @keydown=${this.handleSummaryKeyDown}
        >
          <slot name="summary" part="summary">${this.summary}</slot>

          <span part="icon">
            <slot name="expand-icon">
              <wa-icon library="system" variant="solid" name=${t?`chevron-left`:`chevron-right`}></wa-icon>
            </slot>
            <slot name="collapse-icon">
              <wa-icon library="system" variant="solid" name=${t?`chevron-left`:`chevron-right`}></wa-icon>
            </slot>
          </span>
        </summary>

        <div
          class=${ee({body:!0,animating:this.isAnimating})}
          role="region"
          aria-labelledby="header"
        >
          <slot part="content" id="content" class="content"></slot>
        </div>
      </details>
    `}};Q.css=ke,a([c(`details`)],Q.prototype,`details`,2),a([c(`summary`)],Q.prototype,`header`,2),a([c(`.body`)],Q.prototype,`body`,2),a([c(`.expand-icon-slot`)],Q.prototype,`expandIconSlot`,2),a([o()],Q.prototype,`isAnimating`,2),a([r({type:Boolean,reflect:!0})],Q.prototype,`open`,2),a([r()],Q.prototype,`summary`,2),a([r({reflect:!0})],Q.prototype,`name`,2),a([r({type:Boolean,reflect:!0})],Q.prototype,`disabled`,2),a([r({reflect:!0})],Q.prototype,`appearance`,2),a([r({attribute:`icon-placement`,reflect:!0})],Q.prototype,`iconPlacement`,2),a([l(`open`,{waitUntilFirstUpdate:!0})],Q.prototype,`handleOpenChange`,1),Q=a([n(`wa-details`)],Q);var Ae={m:e=>`${e} m`,deg:e=>`${e}°`,percent:e=>`${Math.round(e*100)} %`,shutter:e=>`1/${Math.round(1/e)} s`,px:e=>`${+e.toFixed(1)} px`,hz:e=>`${e} Hz`,"per-m":e=>`${+e.toFixed(4)} /m`};for(let e of document.querySelectorAll(`#controls wa-slider[data-unit]`))e.valueFormatter=Ae[e.dataset.unit];var $=[`snowLine`,`valleyFog`,`spotlight`,`tiltShift`,`motionBlur`,`speedLines`,`colorIsolation`,`infrared`,`technicolor`,`super8`,`lensDistortion`,`jello`,`droneDisplay`,`analogVideo`,`digitalVideo`];u(`cesiumContainer`).then(e=>{e.clock.currentTime=Cesium.JulianDate.fromIso8601(`2026-09-25T14:00:00+02:00`),e.clock.shouldAnimate=!1;let t={snowLine:new G(e),valleyFog:new Oe(e),tiltShift:new Ee(e),motionBlur:new re(e,{exposure:.04}),speedLines:new fe(e),spotlight:new _e(e),colorIsolation:new P(e),infrared:new I(e),technicolor:new Ce(e),super8:new Se(e),lensDistortion:new R(e),jello:new ce(e),droneDisplay:new ie(e),analogVideo:new j(e),digitalVideo:new k(e)},n=!1;document.querySelector(`#controls`).addEventListener(`input`,e=>{let{name:r,value:i,checked:a}=e.target,o=e.target.closest(`[data-effect]`).dataset.effect;if(r===`followCursor`){n=a;return}if(r!==`active`){let e=Number(i);t[o][r]=Number.isNaN(e)?i:e;return}if(t[o].active=a,a){e.target.closest(`wa-details`).open=!0;for(let e of $.slice($.indexOf(o)+1))t[e].active&&(t[e].active=!1,t[e].active=!0)}});let r=e=>{t.tiltShift.focus=e,t.spotlight.focus=e,t.speedLines.focus=e};e.screenSpaceEventHandler.setInputAction(({position:t})=>{let n=e.scene.pickPosition(t);n&&r(n)},Cesium.ScreenSpaceEventType.LEFT_CLICK),e.screenSpaceEventHandler.setInputAction(({endPosition:r})=>{let i=n&&e.scene.pickPosition(r);i&&(t.spotlight.focus=i)},Cesium.ScreenSpaceEventType.MOUSE_MOVE),document.querySelector(`#center`).addEventListener(`click`,()=>r(void 0))});