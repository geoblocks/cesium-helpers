// Fog filling the valleys below an altitude: the fog along the ray from the camera to the pixel
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
