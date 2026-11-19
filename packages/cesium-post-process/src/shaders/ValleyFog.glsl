// Fog filling the valleys below an altitude: the fog along the ray from the camera to the pixel
// is the part of the ray below the top, the density thinning over a soft band under the top. Its
// light toward the eye is the light it scatters: the sky's, its color tinted by the clear sky toward
// the view, warm toward the sun and blue away from it, and the sun's, scattered forward by its
// droplets in a broad lobe around the sun, through the clouds' gaps when Clouds is active, so the
// fog glows looking toward a low sun and not away from it. Needs EyeFromDepth, Height, Fog, Phase,
// CloudLight, RainHaze and CloudsShadow.
precision highp sampler2D;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// meters above the ellipsoid
uniform float top;
// per meter
uniform float density;
// meters
uniform float softness;
uniform vec4 color;
// from the flat color, 0, to the light of the sky and the sun, 1
uniform float lighting;
// 1 while Clouds draws clouds in the scene, whose shadow map cuts the sun's light
uniform float shadowed;
in vec2 v_textureCoordinates;

// the asymmetry of the light the fog's droplets scatter, a few to tens of micrometers across: a
// forward lobe as Mie scattering's, about 0.8 (Hillaire 2016's 0.76 for clouds)
const float FOG_ASYMMETRY = 0.8;

// the fog's light toward the eye through a point of it in eye coordinates, where the light it
// scatters comes from, by full daylight
vec3 fogLight(vec3 point) {
  if (lighting <= 0.0) {
    return color.rgb;
  }
  vec3 view = normalize(point);
  float sunlit = shadowed > 0.0 ? exp(-shadowDepth((czm_inverseView * vec4(point, 1.0)).xyz)) : 1.0;
  // the sun in its hue through the air, warm and dimmer near the horizon
  return scatteredLight(view, color.rgb * mix(vec3(1.0), skyHueOf(skyFromTable(view)), lighting), sunOnClouds() * lighting * sunlit, FOG_ASYMMETRY);
}

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
  float rayLength = length(end);
  float amount = (1.0 - exp(-density * rayLength * fogFraction(cameraHeight, heightAt(end)))) * color.a;
  if (amount <= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  // most of the fog's light comes from a mean free path into it, from where the ray enters it,
  // under the top when the camera is above it: there, its light and the clouds' shadow on it
  vec3 view = end / rayLength;
  float down = -dot(view, up);
  float entry = cameraHeight <= top ? 0.0 : down > 0.0 ? (cameraHeight - top) / down : rayLength;
  // lit by the sky and the sun by day, turning around sunset to a moonlit blue as bright as the
  // scene's fog.minimumBrightness, as Cesium's fog
  vec3 fogColor = byDaylight(fogLight(view * min(entry + 1.0 / density, rayLength)), daylight());
  out_FragColor = vec4(mix(sceneColor.rgb, fogColor, amount), sceneColor.a);
}
