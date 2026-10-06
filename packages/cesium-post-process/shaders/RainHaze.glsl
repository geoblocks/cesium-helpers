// The haze of the rain or the snow, which Precipitation and Clouds share: the visibility in it, its
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
