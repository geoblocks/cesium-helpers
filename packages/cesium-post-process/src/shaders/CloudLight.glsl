// The light on the clouds, which Clouds' march and the rain's haze under them share: the sun's,
// in its hue through the air, and the clear sky's on their top, and how much of it reaches their
// base. Needs Height.
// the asymmetry of the light the droplets of a cloud scatter, about 0.85 in the visible
const float CLOUD_ASYMMETRY = 0.85;
// the sun's light on the clouds, as a share of the scene's, and the share of its hue through the air
// they take
const float SUN = 0.8;
const float SUN_TINT = 0.75;
// the sky's color on the clouds' tops is desaturated toward its gray, keeping this share of it: in
// full, its hue turns the tops sky blue, where the sun's white light dominates them (Hillaire 2016,
// sec. 5.5.1, lets artists desaturate the sky's light)
const float SKY_SATURATION = 0.3;

// the share of the light on the top of a layer of clouds of optical depth tau that reaches its
// base, scattered many times: the transmission of a layer that scatters without absorbing, in the
// two-stream (Eddington) approximation, 1 / (1 + 0.75 (1 - g) tau)
float twoStream(float tau) {
  return 1.0 / (1.0 + 0.75 * (1.0 - CLOUD_ASYMMETRY) * tau);
}

// the hue of the sky overhead on the clouds, at a luminance of 1
vec3 skyHueOf(vec3 zenith) {
  return mix(vec3(1.0), zenith / max(czm_luminance(zenith), 1e-3), SKY_SATURATION);
}

// the sun's light after its way through the air, as a share of a sun's overhead: the extinction of
// Cesium's atmosphere, its Rayleigh and Mie coefficients over their scale heights, times the air
// mass at the sun's elevation (Kasten and Young 1989), for which Cesium has no function; white
// overhead, warmer toward the horizon, as the clouds are lit at dawn and dusk. Its hue only, as
// bright as a sun overhead, while the sun is high: Cesium lights the globe with a white sun as
// bright at any height, which the clouds would look dull beside; all of its dimming within a few
// degrees of the horizon. SUN_TINT of its hue: in full, a sun 12 degrees high turned the clouds the
// color of sand, about (1.2, 0.9, 0.5), where its 4000 K is about (1, 0.82, 0.6)
vec3 sunThroughAir() {
  float sine = max(dot(up, czm_lightDirectionEC), 0.0);
  float airMass = 1.0 / (sine + 0.50572 * pow(degrees(asin(sine)) + 6.07995, -1.6364));
  vec3 column = czm_atmosphereRayleighCoefficient * czm_atmosphereRayleighScaleHeight + czm_atmosphereMieCoefficient * czm_atmosphereMieScaleHeight;
  vec3 through = mix(vec3(1.0), exp(-column * (airMass - 1.0)), SUN_TINT);
  return mix(through, through / max(czm_luminance(through), 1e-3), smoothstep(0.05, 0.3, sine));
}

// the sun's light on the clouds, in its hue through the air
vec3 sunOnClouds() {
  return SUN * czm_lightColor * sunThroughAir();
}

// the sun, sunOnClouds' light, and the clear sky on the top of the clouds, on a level surface, by
// day: Cesium's sky overhead, in the tops' desaturated hue; raised as CloudsMarch.glsl's skyAbove
// is, for the tops not to look gray, it would light the bases brighter than the sun does
vec3 lightOnClouds(vec3 zenith, float day, vec3 sun) {
  return day * (sun * max(dot(up, czm_lightDirectionEC), 0.0) + skyHueOf(zenith) * czm_luminance(zenith));
}
