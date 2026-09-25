// Snow above an altitude, on slopes gentle enough to hold it, shaded by the sun and by the
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
