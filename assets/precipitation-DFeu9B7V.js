import{C as e,O as t,P as n,a as r,i,k as a,m as o,z as s}from"./cesium-shim-e6hyQueX.js";import{i as c,n as l,r as u,t as d}from"./EyeFromDepth-DmDC5MHh.js";import{n as f,t as p}from"./frame-clock-JIPNaZFQ.js";import{t as m}from"./Hash-CBIEOLtO.js";var h=new WeakMap;function ee(e,t){h.set(e,[...h.get(e)??[],t])}function g(e,t){let n=(h.get(e)??[]).filter(e=>e!==t);n.length>0?h.set(e,n):h.delete(e)}function te(e){return h.has(e)}function _(e){return h.get(e)?.at(-1)}var v=2*Math.PI,y=4;function b(e){return`data`in e?e:e.getContext(`2d`,{willReadFrequently:!0})?.getImageData(0,0,e.width,e.height)}function x(e){if(!(`data`in e)||typeof ImageData<`u`&&e instanceof ImageData)return e;let{width:t,height:n,data:r}=e;return{width:t,height:n,arrayBufferView:new Uint8Array(r.buffer,r.byteOffset,r.length)}}function S(e){let t=[0,0,0,0],n=e?.data??[];for(let e=0;e<n.length;e+=4)for(let r=0;r<4;r++)t[r]=Math.max(t[r],n[e+r]);return t.map(e=>e/255)}function C(e){let{width:t,height:n}=e[0],r=Math.ceil(t/y),i=Math.ceil(n/y),a=new Uint8Array(r*i*4);for(let i of e)if(i)for(let e=0;e<n;e++)for(let n=0;n<t;n++){let o=4*(Math.floor(e/y)*r+Math.floor(n/y));for(let r=0;r<4;r++)a[o+r]=Math.max(a[o+r],i.data[4*(e*t+n)+r])}let o=new Uint8Array(r*i*4);for(let e=0;e<i;e++)for(let t=0;t<r;t++)for(let n=0;n<4;n++){let s=0;for(let o=Math.max(e-1,0);o<=Math.min(e+1,i-1);o++)for(let e=Math.max(t-1,0);e<=Math.min(t+1,r-1);e++)s=Math.max(s,a[4*(o*r+e)+n]);o[4*(e*r+t)+n]=s}return{width:r,height:i,data:o}}var w=class{constructor(e){this.empty_=e,this.map_=void 0,this.data_=void 0,this.nextMap_=void 0,this.nextData_=void 0,this.blend=0,this.bounds=new r(0,0,1,1),this.maxIntensity=e,this.maxValues=[e,e,e,e],this.texture_=void 0,this.nextTexture_=void 0,this.maxImage_=void 0,this.maxTexture_=void 0}get map(){return this.map_}set map(e){if(this.map_=e,!e)this.data_=void 0,r.fromElements(0,0,1,1,this.bounds),this.maxIntensity=this.empty_;else{let{image:t,rectangle:n}=e;this.data_=b(t),r.fromElements(n.west/v+.5,n.south/Math.PI+.5,v/(n.east-n.west),Math.PI/(n.north-n.south),this.bounds)}this.updateMaxIntensity_(),this.texture_=this.texture_?.destroy(),this.clearMaxImage_()}get nextMap(){return this.nextMap_}set nextMap(e){this.nextMap_=e,this.nextData_=e&&b(e.image),this.updateMaxIntensity_(),this.nextTexture_=this.nextTexture_?.destroy(),this.clearMaxImage_()}clearMaxImage_(){this.maxImage_=void 0,this.maxTexture_=this.maxTexture_?.destroy()}maxImage(){return this.map_&&!this.maxImage_&&(this.maxImage_=C([this.data_,this.nextData_])),this.maxImage_}updateMaxIntensity_(){let e=S(this.data_),t=S(this.nextMap_?this.nextData_:void 0);this.maxValues=this.map_?e.map((e,n)=>Math.max(e,t[n])):[this.empty_,this.empty_,this.empty_,this.empty_],this.maxIntensity=this.maxValues[0]}intensityAt(e,t){if(!this.map_||!this.data_)return this.empty_;let{west:n,south:r,east:i,north:a}=this.map_.rectangle,o=(e-n)/(i-n),s=(t-r)/(a-r);if(o<0||o>1||s<0||s>1)return 0;let c=this.sample_(this.data_,o,s);return this.nextData_?c+(this.sample_(this.nextData_,o,s)-c)*this.blend:c}sample_(e,t,n){let{width:r,height:i,data:a}=e,o=Math.min(Math.max(t*r-.5,0),r-1),s=Math.min(Math.max((1-n)*i-.5,0),i-1),c=Math.floor(o),l=Math.floor(s),u=Math.min(c+1,r-1),d=Math.min(l+1,i-1),f=(e,t)=>a[4*(t*r+e)]/255,p=f(c,l)+(f(u,l)-f(c,l))*(o-c);return p+(f(c,d)+(f(u,d)-f(c,d))*(o-c)-p)*(s-l)}texture(e){if(!this.texture_){let t=255*this.empty_;this.texture_=new s({context:e,source:x(this.map_?.image??new ImageData(new Uint8ClampedArray([t,t,t,255]),1,1))})}return this.texture_}nextTexture(e){return this.nextMap_?(this.nextTexture_??=new s({context:e,source:x(this.nextMap_.image)}),this.nextTexture_):this.texture(e)}maxTexture(e){if(!this.maxTexture_){let t=255*this.empty_,{width:n,height:r,data:i}=this.maxImage()??{width:1,height:1,data:new Uint8Array([t,t,t,255])};this.maxTexture_=new s({context:e,source:{width:n,height:r,arrayBufferView:i}})}return this.maxTexture_}destroy(){this.texture_=this.texture_?.destroy(),this.nextTexture_=this.nextTexture_?.destroy(),this.maxTexture_=this.maxTexture_?.destroy()}},T=new i,E=new i;function D(t){return{cameraHeight:()=>t.camera.positionCartographic.height,up:()=>{let n=t.ellipsoid.geodeticSurfaceNormal(t.camera.positionWC,T);return e.multiplyByPointAsVector(t.camera.viewMatrix,n,n)},radius:()=>{let e=t.ellipsoid.scaleToGeodeticSurface(t.camera.positionWC,E);return e?i.magnitude(e):t.ellipsoid.maximumRadius}}}var O=`// The clouds' shadow map, a Beer shadow map: across an area around the camera, seen from the sun,
// the optical depth of the clouds along the sun's rays, from the top of the slab down to each
// quarter of its height, so that a point finds how much cloud lies between it and the sun. One
// read rather than a march toward the sun, as Unreal's (it loses only the "volumetric self shadow
// color") and three-clouds' in WebGL2.
precision highp sampler2D;
uniform sampler2D shadowMap;
// the ground point the map is centered on, in world coordinates, and the base and the top of the
// slab it covers, in meters above the ellipsoid, from clouds.js
uniform vec3 shadowCenter;
// the map's side, in meters, wider as the camera is higher, from clouds.js
uniform float shadowExtent;
uniform float shadowBase;
uniform float shadowTop;

// the shadow fades out over the outer share of the map's half side, so that its edge does not show
const float SHADOW_FADE = 0.2;

// the axes of the map, across the sun's rays: the sun's direction in world coordinates crossed
// with the up at its center, and the third direction
void shadowAxes(out vec3 across, out vec3 along) {
  vec3 up = normalize(shadowCenter);
  across = cross(czm_lightDirectionWC, up);
  across = dot(across, across) > 1e-6 ? normalize(across) : normalize(cross(czm_lightDirectionWC, vec3(1.0, 0.0, 0.0)));
  along = cross(czm_lightDirectionWC, across);
}

// a point's height above the sphere through the map's center: over the map, it differs from the
// height above the ellipsoid by meters
float shadowHeight(vec3 positionWC) {
  return length(positionWC) - length(shadowCenter);
}

// the optical depth of the clouds between a point in world coordinates and the sun, 0 off the map
float shadowDepth(vec3 positionWC) {
  vec3 across;
  vec3 along;
  shadowAxes(across, along);
  vec3 offset = positionWC - shadowCenter;
  vec2 uv = vec2(dot(offset, across), dot(offset, along)) / shadowExtent + 0.5;
  float edge = 2.0 * max(abs(uv.x - 0.5), abs(uv.y - 0.5));
  if (edge >= 1.0) {
    return 0.0;
  }
  float fade = 1.0 - smoothstep(1.0 - SHADOW_FADE, 1.0, edge);
  vec4 depths = texture(shadowMap, uv);
  // the share of the slab above the point, in quarters, through the depths at each
  float f = 4.0 * clamp((shadowTop - shadowHeight(positionWC)) / max(shadowTop - shadowBase, 1.0), 0.0, 1.0);
  return fade * (f < 1.0 ? f * depths.x : f < 2.0 ? mix(depths.x, depths.y, f - 1.0) : f < 3.0 ? mix(depths.y, depths.z, f - 2.0) : mix(depths.z, depths.w, f - 3.0));
}
`,k=`// What ValleyFog's fog and the rain's and the snow's haze share: the sky as a ray this long, and
// their light, lit by the sun as Cesium's fog, turning around sunset to a moonlit blue as bright as
// the scene's fog.minimumBrightness, rather than a flat gray. Needs Height.

// the sky is a ray this long, in meters
const float SKY_DISTANCE = 50000.0;
// tint of the fog at night, scaled by fog.minimumBrightness
const vec3 NIGHT = vec3(0.45, 0.55, 0.85);

// 0 at night to 1 by day, from the sun's height at the camera
float daylight() {
  return smoothstep(-0.1, 0.3, dot(up, czm_sunDirectionEC));
}

// a fog's color by day, turning to the moonlit blue at night
vec3 byDaylight(vec3 color, float day) {
  return mix(NIGHT * czm_fogMinimumBrightness, color, day);
}
`,A=`// Height above the ellipsoid of a point in eye coordinates, computed relative to the camera: in
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
`,j=`// Henyey-Greenstein's phase function, normalized: 1 / (4 pi) for light scattered alike in all
// directions, which the haze and the clouds share.
float henyeyGreenstein(float cosTheta, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * czm_pi * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}
`,M=`// The haze of the rain or the snow, which Precipitation and Clouds share: its extinction, its
// opacity over an optical depth, and its color. The rain has no color of its own: its extinction
// is the same at all wavelengths for drops above 0.2 mm (Montero-Martinez et al. 2025), so the
// haze is the light of the sky and the sun it scatters toward the eye, L_in = (1 - T) * (the light
// scattered toward the eye) (Hillaire 2020): the clear sky of Cesium's atmosphere at the horizon,
// warm toward the sun and blue away from it, turning under thick clouds to the gray of an
// overcast sky, brighter overhead, and the sun's forward glow through thin clouds. A moonlit blue
// at night, as ValleyFog's. Needs Height, Fog and Phase.
precision highp sampler2D;

// the light intensity of the sky's atmosphere, which is not the scene's atmosphere's: 50 rather than
// 10 by default
uniform float skyLightIntensity;
// the clear sky toward the horizon and overhead, from SkyTable.glsl
uniform sampler2D skyTable;

// the rain rate, in mm/h, at intensity 1, the map's intensity being sqrt(R / RAIN_RATE), as the
// weather demo draws it from MeteoSwiss' radar
const float RAIN_RATE = 10.0;
// the extinction per meter of the rain, 0.11 R^0.85 per km at R mm/h, added to the clear air's, 0.1
// per km (Montero-Martinez et al. 2025): 39 km of visibility in dry air, 11.5 km at 2.5 mm/h, 4.4 km
// at 10 mm/h
const vec2 RAIN_LAW = vec2(0.00011, 0.85);
// layers of haze thinning out with the height, their extinction per meter at sea level and their
// scale height in meters, summed in optical depth with the rain's: the clear air's, 0.1 per km at
// the ground, over an aerosol's scale height of 1 to 2 km; and a mist lying low, 1 per km at the
// Swiss plateau's 500 m, that fills the valleys and leaves the ridges above it. Both scale heights
// and the mist's extinction are not from a source
const vec2 CLEAR_AIR = vec2(0.0001, 1200.0);
const vec2 MIST = vec2(0.0035, 400.0);
// the rain's extinction drifts in bands, by this share around its mean: sigma_rain *=
// mix(0.6, 1.4, noise) (Wronski 2014, "procedural Perlin noise animated by wind")
const float RAIN_BANDS = 0.4;
// visibility in meters at intensity 0 and 1 in the snow
const vec2 SNOW_VISIBILITY = vec2(20000.0, 500.0);
// the haze never quite hides the sky and the far terrain
const float MAX_HAZE = 0.9;
// the overcast sky at the horizon by day, a brighter gray under snow clouds; overhead, it is three
// times as bright, the CIE's overcast sky, L / L_zenith = (1 + 2 sin(elevation)) / 3 (CIE 2003),
// and darker under thick clouds, by up to this share: the report's 0.6 left the haze under the
// heaviest rain at a quarter of the brightness, darker than the scene it veils, which the overcast
// only dims by half
const vec3 RAIN_HAZE = vec3(0.6, 0.64, 0.68);
const vec3 SNOW_HAZE = vec3(0.7, 0.72, 0.76);
const float THICK_CLOUDS = 0.3;
// the asymmetry of the light scattered by the rain and by the snow, from the haze's 0.7 to the
// rain's 0.9 to 1 (arXiv 1403.2977)
const vec2 HAZE_ASYMMETRY = vec2(0.9, 0.75);
// the sky toward the horizon is a ray this long, out of the atmosphere
const float SKY_RAY = 1e7;
// the clear sky at the horizon is read this far above it, in radians, 5 degrees: right at it,
// Cesium's atmosphere turns a pale cyan that its sky, interpolated from the vertices of its dome,
// never shows
const float SKY_ELEVATION = 0.087;
// the sky table's texels toward the horizon, besides the one overhead, SkyTable.glsl's
const float SKY_TABLE = 64.0;

// the extinction per meter, from the rain's to the snow's, as hard as it rains: 3.912 / visibility
// is the extinction that leaves 2 % of the light. None where it does not rain, rising from 0 at the
// edge of the rain: the dry air is Cesium's fog's
float rainExtinction(float intensity, float snow) {
  float rain = max(RAIN_LAW.x * pow(RAIN_RATE * intensity * intensity, RAIN_LAW.y), 1e-9);
  float snowfall = 3.912 / (SNOW_VISIBILITY.x * pow(SNOW_VISIBILITY.y / SNOW_VISIBILITY.x, intensity));
  return smoothstep(0.0, 0.15, intensity) * rain * pow(snowfall / rain, snow);
}

// the optical depth of a layer of haze along a straight ray this long from height h0 to h1, its
// height linear along it: the line integral of exponential height fog,
// (a / b) exp(-b h0) (1 - exp(-b dh)) / dh per unit of length (Quilez), with the first terms of its
// Taylor series where the ray is level, as Flax's ExponentialHeightFog.hlsl
float layerDepth(vec2 layer, float h0, float h1, float rayLength) {
  float x = (h1 - h0) / layer.y;
  float level = abs(x) < 1e-3 ? 1.0 - 0.5 * x : (1.0 - exp(-x)) / x;
  return layer.x * rayLength * exp(-h0 / layer.y) * level;
}

// the haze's opacity over an optical depth in the rain
float rainHaze(float opticalDepth) {
  return MAX_HAZE * (1.0 - exp(-opticalDepth));
}

// the clear sky in a direction in world coordinates from a point at a height, as the sky shader of Cesium's atmosphere
// renders it without high dynamic range, its inner radius lowered as SkyAtmosphereCommon.glsl
// lowers it: from the ellipsoid's surface, a ray toward the horizon would cross the densest air
// for hundreds of kilometers and turn a dim yellow
vec3 clearSkyFrom(vec3 originWC, float height, vec3 directionWC, vec3 lightWC) {
  czm_ray ray = czm_ray(originWC, directionWC);
  float radiiDifference = czm_ellipsoidRadii.x - czm_ellipsoidRadii.z;
  float adjust = 0.5 * radiiDifference * clamp((height - 0.25 * czm_ellipsoidRadii.x) / (0.75 * czm_ellipsoidRadii.x), 0.0, 1.0);
  float innerRadius = length(originWC) - height - 0.25 * radiiDifference - adjust;
  vec3 rayleigh;
  vec3 mie;
  float opacity;
  czm_computeScattering(ray, SKY_RAY, lightWC, innerRadius, rayleigh, mie, opacity);
  vec3 color = czm_computeAtmosphereColor(ray, lightWC, rayleigh, mie, opacity).rgb * skyLightIntensity / czm_atmosphereLightIntensity;
  return czm_inverseGamma(czm_pbrNeutralTonemapping(color));
}

// the clear sky seen from the camera
vec3 clearSky(vec3 directionWC, vec3 lightWC) {
  return clearSkyFrom(czm_viewerPositionWC, czm_eyeHeight, directionWC, lightWC);
}

// the clear sky seen from under the camera at a height, or from the camera if it is lower: from
// far above, the camera sees the black of space overhead, not the sky the clouds and the haze see,
// whose color divided by its luminance would turn to any hue
vec3 clearSkyBelow(float height, vec3 directionWC, vec3 lightWC) {
  float h = min(czm_eyeHeight, height);
  return clearSkyFrom(czm_viewerPositionWC - normalize(czm_viewerPositionWC) * (czm_eyeHeight - h), h, directionWC, lightWC);
}

// the clear sky toward a view direction in eye coordinates, at its azimuth and at an elevation
// above the horizon, in radians, lit by the scene's light, as the sky's atmosphere is lit by
// default: the scene's atmosphere is lit from overhead by default, and would turn the horizon cyan
// at any time of day
vec3 skyToward(vec3 view, float elevation) {
  vec3 level = view - dot(view, up) * up;
  level = dot(level, level) > 1e-6 ? normalize(level) : normalize(cross(up, vec3(1.0, 0.0, 0.0)));
  return clearSky(czm_inverseViewRotation * (cos(elevation) * level + sin(elevation) * up), czm_lightDirectionWC);
}

// the clear sky toward a view direction in eye coordinates, from the sky table: at its azimuth from
// the sun's, SKY_ELEVATION above the horizon, toward overhead as it looks up
vec3 skyFromTable(vec3 view) {
  vec3 level = view - dot(view, up) * up;
  vec3 sun = czm_lightDirectionEC - dot(czm_lightDirectionEC, up) * up;
  float cosAzimuth = dot(level, level) > 1e-6 && dot(sun, sun) > 1e-6 ? dot(normalize(level), normalize(sun)) : 1.0;
  float u = (acos(clamp(cosAzimuth, -1.0, 1.0)) / czm_pi * (SKY_TABLE - 1.0) + 0.5) / (SKY_TABLE + 1.0);
  vec3 horizon = texture(skyTable, vec2(u, 0.5)).rgb;
  vec3 zenith = texture(skyTable, vec2((SKY_TABLE + 0.5) / (SKY_TABLE + 1.0), 0.5)).rgb;
  return mix(horizon, zenith, max(dot(view, up), 0.0));
}

// the haze's light toward the eye along a view direction in eye coordinates, under an overcast as
// thick as it rains at the camera or along the ray, 0 to 1: the sky's, from the clear sky to the
// overcast gray, and the sun's through the clouds, as much of it as reaches the haze, 0 to 1.
// Drops scatter nearly all the light they intercept: an albedo of 1
vec3 rainHazeColor(vec3 view, float day, float snow, float overcast, float sunlit) {
  float elevation = max(dot(view, up), 0.0);
  vec3 sky = skyFromTable(view);
  vec3 overcastSky = mix(RAIN_HAZE, SNOW_HAZE, snow) * (1.0 + 2.0 * elevation) * (1.0 - THICK_CLOUDS * overcast);
  vec3 sun = czm_lightColor * sunlit * henyeyGreenstein(dot(view, czm_lightDirectionEC), mix(HAZE_ASYMMETRY.x, HAZE_ASYMMETRY.y, snow));
  vec3 color = min(mix(sky, overcastSky, overcast) + sun, vec3(1.0));
  return byDaylight(color, day);
}
`,N=`// Where it rains: the map of the local intensity, 0 to 1 in its red channel, over a rectangle of
// longitudes and latitudes, sampled bilinearly, which fades the rain in over a cell at its edges.
// Without a map, a pixel over the whole globe: rain everywhere for Precipitation, none for Clouds.
// A next map over the same rectangle crossfades from it by the blend, as the radar from one hour to
// the next; without one, the map again.
precision highp sampler2D;
uniform sampler2D map;
uniform sampler2D nextMap;
uniform float mapBlend;
// the rectangle in the ellipsoid's texture coordinates: its west and south, and one over its width
// and height
uniform vec4 mapBounds;

// a point in world coordinates on the map, 0 to 1 over its rectangle: single precision rounds it to
// about half a meter, nothing at the scale of a map
vec2 mapUv(vec3 positionWC) {
  vec3 normal = normalize(positionWC * czm_ellipsoidInverseRadii * czm_ellipsoidInverseRadii);
  return (czm_ellipsoidTextureCoordinates(normal) - mapBounds.xy) * mapBounds.zw;
}

// the map's texel at a point in world coordinates, all its channels, 0 outside the map
vec4 mapTexelAt(vec3 positionWC) {
  vec2 uv = mapUv(positionWC);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
    return vec4(0.0);
  }
  return mix(texture(map, uv), texture(nextMap, uv), mapBlend);
}

// the local intensity at a point in world coordinates, 0 outside the map
float mapAt(vec3 positionWC) {
  return mapTexelAt(positionWC).r;
}
`,P=`// random gradient in [-1, 1] at a lattice point
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
`,F=`// Precipitation, rain or snow: streaks of falling drops in four layers, nearer ones larger, faster
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
// Needs EyeFromDepth, Hash, Height, PrecipitationWind, Fog, Phase and RainHaze.
precision highp sampler2D;
const int LAYERS = 4;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the shafts' opacity, the ray's extinction, the share of it in the rain and the share of the rain
// in the sun, from PrecipitationShafts.glsl at a fraction of the resolution
uniform sampler2D shaftTexture;
// 1 when Clouds draws the clouds, 0 otherwise
uniform float clouds;
// 1 when their shadow map lights the haze, 0 otherwise
uniform float shadowed;
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

// the shafts' opacity, the ray's extinction, the share of it in the rain and the share of the rain
// in the sun, blurred by PrecipitationShaftBlur.glsl and upsampled bilinearly from their texture,
// which is read at its nearest texel
vec4 shafts() {
  // the size Cesium gives the texture
  vec2 size = ceil(czm_viewport.zw * SHAFT_SCALE);
  vec2 p = v_textureCoordinates * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 center = (i + 0.5) / size;
  vec2 texel = 1.0 / size;
  vec4 bottom = mix(texture(shaftTexture, center), texture(shaftTexture, center + vec2(texel.x, 0.0)), f.x);
  vec4 top = mix(texture(shaftTexture, center + vec2(0.0, texel.y)), texture(shaftTexture, center + texel), f.x);
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
  vec4 sampled = shafts();
  vec3 shaft = sampled.xyz * (1.0 - clouds * (1.0 - raining));
  // the rain's, in its bands, and the clear air's and the mist's over the share of the ray in the
  // rain, thinning out with the height, summed in optical depth
  float rainLength = (below.y - below.x) * sceneDistance;
  float h0 = heightAt(view * sceneDistance * below.x);
  float h1 = heightAt(view * sceneDistance * below.y);
  float layers = layerDepth(CLEAR_AIR, h0, h1, rainLength) + layerDepth(MIST, h0, h1, rainLength);
  float haze = rainHaze(rainLength * shaft.y * (1.0 + RAIN_BANDS) * rainExtinction(intensity, snow) + shaft.z * layers);
  // a rain cell seen from a dry spot is still under its own clouds
  float overcast = max(localIntensity, min(shaft.y * (1.0 + RAIN_BANDS), 1.0));
  // the sun through the gaps of the clouds, from their shadow map, or as much as the overcast lets
  float sunlit = shadowed > 0.0 ? sampled.w : 1.0 - overcast;
  vec3 hazeColor = rainHazeColor(view, daylight(), snow, overcast, sunlit);
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
`,I=`// The shafts' opacity, the ray's extinction, the share of it in the rain and the share of the rain
// in the sun, blurred over the neighboring texels at
// their own resolution: they fade out around the ridges in front of them rather than stopping at
// their outline. A 3 x 3 binomial kernel here costs a 64th of the reads the same blur would take
// at the full resolution.
precision highp sampler2D;
uniform sampler2D shaftTexture;
in vec2 v_textureCoordinates;

void main() {
  // czm_viewport is this pass's texture, the size of the shafts'
  vec2 texel = 1.0 / czm_viewport.zw;
  vec4 sum = vec4(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      sum += weight * texture(shaftTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel);
    }
  }
  out_FragColor = sum / 16.0;
}
`,L=`// The shafts of the rain or the snow, at a fraction of the resolution: their opacity along each
// view ray, for Precipitation.glsl to shade, and the ray's mean extinction, as a share of the
// extinction where the map is full, for its haze, which it computes at its own resolution, sharp at
// the ridges. Both are over the part of the ray below the cloud base, where it rains, found from the
// scene's depth before it is sampled:
// from far above, a pixel shows the rain in the column under it. Along that part, patches of noise
// on the ground under each sample, more of them as it rains harder, slanting with the wind from the
// cloud base and drifting with it, where the map has rain. Not dithered: at this resolution the
// dither shows as dots, where the patches are too soft to band. Needs EyeFromDepth, Noise, Height,
// PrecipitationWind, WeatherMap, Fog, Phase, RainHaze and CloudsShadow. With clouds in the scene, it also finds
// the share of the rain along the ray that the sun lights through their gaps, from their shadow map:
// the haze's light shafts (Wronski 2014's front-to-back march, on the clouds' shadow map as
// Hillaire 2016, sec. 5.9).
precision highp sampler2D;
uniform sampler2D depthTexture;
// 1 when the clouds' shadow map is there to read, 0 otherwise
uniform float shadowed;
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

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 rayEnd = eye.w == 0.0 ? eye.xyz * SKY_DISTANCE : eye.xyz;
  // the part of the ray below the cloud base, and the part of it that is sampled
  vec2 below = belowHeight(rayEnd, cloudBase);
  float t0 = below.x;
  float t1 = below.y;
  float opacity = 0.0;
  float share = 0.0;
  float wet = 0.0;
  float lit = 1.0;
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
    float sunlit = 0.0;
    float density = 0.0;
    for (int i = 0; i < SHAFT_STEPS; i++) {
      float t = mix(t0, sampled, (float(i) + 0.5) / float(SHAFT_STEPS));
      float h = heightAt(rayEnd * t);
      vec3 ground = czm_viewerPositionWC + rayWC * t - upWorld * h;
      float local = mapAt(ground);
      ground -= eastWorld * ((cloudBase - h) * slant + drift);
      float patches = gradientNoise(ground / SHAFT_SIZE);
      // in bands drifting with the shafts, the noise being about -0.7 to 0.7
      float extinction = rainExtinction(intensity * local, snow) * (1.0 + RAIN_BANDS * patches / 0.7);
      raining += extinction;
      // the sun through the clouds above the sample, weighted by how much it scatters there
      vec3 sampleWC = czm_viewerPositionWC + rayWC * t;
      sunlit += extinction * (shadowed > 0.0 ? exp(-shadowDepth(sampleWC)) : 1.0);
      wet += smoothstep(0.0, 0.15, local);
      float top = clamp((cloudBase - h) / SHAFT_TOP, 0.0, 1.0);
      density += local * top * smoothstep(threshold - 0.3, threshold + 0.3, patches);
    }
    // the whole part below the cloud base is as rainy as its sampled part, its extinction as a
    // share of the heaviest bands', and the share of it in the rain
    share = raining / (float(SHAFT_STEPS) * (1.0 + RAIN_BANDS) * rainExtinction(intensity, snow));
    wet /= float(SHAFT_STEPS);
    lit = raining > 0.0 ? sunlit / raining : 1.0;
    float depth = mix(SHAFT_EXTINCTION.x, SHAFT_EXTINCTION.y, snow) * (0.5 + 0.5 * intensity) * density * (sampled - t0) * rayLength / float(SHAFT_STEPS);
    opacity = 1.0 - exp(-depth);
  }
  out_FragColor = vec4(opacity, share, wet, lit);
}
`,R=`// What the passes of the precipitation share: the local frame at the camera and the wind, in gusts.
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
`,ne=`// The clear sky the haze scatters, drawn by precipitation.js into a small table at each frame,
// rather than computed twice for each pixel: its first SKY_TABLE texels at SKY_ELEVATION above the
// horizon, at azimuths from the sun's to its opposite, the sky being symmetric about the sun's
// vertical plane, and its last overhead, seen from no higher than the cloud base. In world
// coordinates, the camera's up the ellipsoid's normal under it, so that the camera turning between
// frames does not skew it. Needs Height, Fog, Phase and RainHaze.
// meters above the ellipsoid, the precipitation's
uniform float cloudBase;
in vec2 v_textureCoordinates;

void main() {
  vec3 upWC = normalize(czm_viewerPositionWC * czm_ellipsoidInverseRadii * czm_ellipsoidInverseRadii);
  float i = floor(v_textureCoordinates.x * (SKY_TABLE + 1.0));
  if (i >= SKY_TABLE) {
    out_FragColor = vec4(clearSkyBelow(cloudBase, upWC, czm_lightDirectionWC), 1.0);
    return;
  }
  vec3 sun = czm_lightDirectionWC - dot(czm_lightDirectionWC, upWC) * upWC;
  sun = dot(sun, sun) > 1e-6 ? normalize(sun) : normalize(cross(upWC, vec3(1.0, 0.0, 0.0)));
  float azimuth = czm_pi * i / (SKY_TABLE - 1.0);
  vec3 level = cos(azimuth) * sun + sin(azimuth) * cross(upWC, sun);
  out_FragColor = vec4(clearSkyBelow(cloudBase, cos(SKY_ELEVATION) * level + sin(SKY_ELEVATION) * upWC, czm_lightDirectionWC), 1.0);
}
`,z=30,B=3600,V=9,H=1,U=4.44,W=20,G=2,K=1/30,q=1/90,J=1,Y=2*Math.PI,X=4,re=20,ie=4,ae=1e3,oe=.1,Z=.125,se=.5,Q=50;function ce(e,t,n){let r=Math.min(Math.max((n-e)/(t-e),0),1);return r*r*(3-2*r)}var $=new WeakMap;function le(e){let t=$.get(e);t?t.count++:($.set(e,{count:1,light:e.light,intensity:e.light.intensity,shadows:e.shadowMap.enabled}),e.light.intensity*=se,e.shadowMap.enabled=!1)}function ue(e,t){let n=$.get(e);n&&(n.light.intensity=n.intensity*(1-.5*t),e.shadowMap.enabled=n.shadows&&t<.5)}function de(e){let t=$.get(e);!t||--t.count>0||(t.light.intensity=t.intensity,e.shadowMap.enabled=t.shadows,$.delete(e))}var fe=class extends c{constructor(e,t={}){super(e),this.intensity_=t.intensity??.5,this.wind_=t.wind??10,this.speed_=t.speed??1,this.cloudBase_=t.cloudBase??2500,this.snow_=t.snow??0,this.weatherMap_=new w(1),this.weatherMap_.map=t.map,this.localIntensity_=1,this.offset_=0,this.lastTime_=0,this.layerShape_=Array.from({length:X},()=>new r),this.layerLook_=Array.from({length:X},()=>new r),this.onPreRender_=()=>{let e=performance.now()/1e3,t=Math.min(e-this.lastTime_,oe);this.lastTime_=e,this.offset_=(this.offset_+t*this.fallSpeed_()*this.cellsAlong_()/G)%ae,this.updateLayers_();let{longitude:n,latitude:r,height:i}=this.viewer.scene.camera.positionCartographic;this.localIntensity_=this.weatherMap_.intensityAt(n,r);let a=1-ce(this.cloudBase_-Q,this.cloudBase_+Q,i);ue(this.viewer.scene,this.localIntensity_*a),this.drawSkyTable_(this.viewer.scene)},this.skyTable_=void 0,this.skyTableFramebuffer_=void 0,this.skyTableCommand_=void 0}drawSkyTable_(e){let t=e.context;t&&(this.skyTable_||(this.skyTable_=new s({context:t,width:65,height:1}),this.skyTableFramebuffer_=new o({context:t,colorTextures:[this.skyTable_],destroyAttachments:!1}),this.skyTableCommand_=t.createViewportQuadCommand(A+k+j+M+ne,{framebuffer:this.skyTableFramebuffer_,renderState:n.fromCache({viewport:{x:0,y:0,width:65,height:1}}),uniformMap:{skyLightIntensity:()=>e.skyAtmosphere?.atmosphereLightIntensity??50,cloudBase:()=>this.cloudBase_}})),this.skyTableCommand_.execute(t))}destroySkyTable_(){this.skyTableCommand_?.shaderProgram?.destroy(),this.skyTableCommand_=void 0,this.skyTableFramebuffer_=this.skyTableFramebuffer_?.destroy(),this.skyTable_=this.skyTable_?.destroy()}fallSpeed_(){return this.speed_*V*(H/V)**this.snow_}updateLayers_(){let e=this.cellsAlong_();for(let t=0;t<X;t++){let n=2**t,i=Math.floor(Y*re*n+.5);r.fromElements(i/Y,e*n,i,G*n,this.layerShape_[t]);let a=Math.max(.5,1-.25*t),o=Math.max(ie/n,.75),s=.45-.07*t,c=.8-.12*t,l=t===0?1.4*o*1.8:1.4*o+.5;r.fromElements(s+(c-s)*this.snow_,a+.5+(l-a-.5)*this.snow_,a,o,this.layerLook_[t])}}trail_(){let e=K*(q/K)**this.snow_;return Math.min(this.fallSpeed_()*e*this.cellsAlong_()/G,J)}cellsAlong_(){return U*(W/U)**this.snow_}createStage_(e){let n={...D(e),time:()=>performance.now()/1e3%B,wind:()=>this.wind_,speed:()=>this.speed_,cloudBase:()=>this.cloudBase_,intensity:()=>this.intensity_,snow:()=>this.snow_},r=new t({fragmentShader:d+P+A+R+N+k+j+M+O+L,uniforms:{...n,shadowed:()=>+!!_(e),shadowMap:()=>_(e)?.texture()??e.context.defaultTexture,shadowCenter:()=>_(e)?.center??i.ZERO,shadowExtent:()=>_(e)?.extent()??1,shadowBase:()=>_(e)?.base()??0,shadowTop:()=>_(e)?.top()??0,map:()=>this.weatherMap_.texture(e.context),nextMap:()=>this.weatherMap_.nextTexture(e.context),mapBlend:()=>this.weatherMap_.blend,mapBounds:()=>this.weatherMap_.bounds},textureScale:Z}),o=new t({fragmentShader:I,uniforms:{shaftTexture:r.name},textureScale:Z}),s=new a({stages:[r,o,new t({fragmentShader:d+m+A+R+k+j+M+F,uniforms:{...n,shaftTexture:o.name,localIntensity:()=>this.localIntensity_,clouds:()=>+!!te(e),shadowed:()=>+!!_(e),skyTable:()=>this.skyTable_??e.context.defaultTexture,trail:()=>this.trail_(),layerShape:()=>this.layerShape_,layerLook:()=>this.layerLook_,offset:()=>this.offset_}})],inputPreviousStageTexture:!1});return s.enabled=this.intensity_>0,s}activated_(e){this.lastTime_=performance.now()/1e3,this.updateLayers_(),e.preRender.addEventListener(this.onPreRender_),l(e),le(e),this.intensity_>0&&p(e,z)}deactivating_(e){this.intensity_>0&&f(e,z),de(e),u(e),e.preRender.removeEventListener(this.onPreRender_),this.destroySkyTable_(),this.weatherMap_.destroy()}get map(){return this.weatherMap_.map}get localIntensity(){return this.localIntensity_}set map(e){this.weatherMap_.map=e,this.viewer.scene.requestRender()}get nextMap(){return this.weatherMap_.nextMap}set nextMap(e){this.weatherMap_.nextMap=e,this.viewer.scene.requestRender()}get mapBlend(){return this.weatherMap_.blend}set mapBlend(e){this.weatherMap_.blend=e,this.viewer.scene.requestRender()}get intensity(){return this.intensity_}set intensity(e){let t=this.intensity_>0;this.intensity_=e,this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?p:f)(this.viewer.scene,z)),this.viewer.scene.requestRender()}get wind(){return this.wind_}set wind(e){this.wind_=e,this.viewer.scene.requestRender()}get speed(){return this.speed_}set speed(e){this.speed_=e,this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get snow(){return this.snow_}set snow(e){this.snow_=e,this.viewer.scene.requestRender()}};export{j as a,O as c,b as d,ee as f,M as i,D as l,P as n,A as o,g as p,N as r,k as s,fe as t,w as u};