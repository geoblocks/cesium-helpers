// The red light of the low sun on the peaks while the valleys are already in shadow. Above an
// altitude, the ground is lit in rose on the faces away from the sun and in orange on the faces
// toward it, the scene's colors multiplied rather than replaced so that the relief stays readable;
// below, the ground turns darker and bluer.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// meters above the ellipsoid: half lit at the altitude, over a band transition meters high
uniform float altitude;
uniform float transition;
// 0 to 1
uniform float strength;
in vec2 v_textureCoordinates;

// the light of the glow, little brighter than white in red so that snow turns pink rather than
// grey without clipping to a flat color
const vec3 GLOW_SHADE = vec3(1.05, 0.62, 0.78);
const vec3 GLOW_SUN = vec3(1.1, 0.72, 0.5);
// part of the glow on the faces away from the sun, lit by the pink sky
const float SKY_GLOW = 0.45;
// the valleys in the shadow of the mountains
const vec3 VALLEY_SHADE = vec3(0.55, 0.6, 0.78);

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float sun = max(dot(normal, czm_sunDirectionEC), 0.0);

  float high = smoothstep(altitude - 0.5 * transition, altitude + 0.5 * transition, heightAt(eye.xyz));
  vec3 glow = mix(GLOW_SHADE, GLOW_SUN, sun);
  vec3 light = mix(VALLEY_SHADE, mix(vec3(1.0), glow, mix(SKY_GLOW, 1.0, sun)), high);
  // eye.w is 0 for the sky
  light = mix(vec3(1.0), light, strength * eye.w);
  out_FragColor = vec4(clamp(sceneColor.rgb * light, 0.0, 1.0), sceneColor.a);
}
