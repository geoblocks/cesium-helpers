// Trails: a glowing streak along the recent positions of each moving thing, fading with age.
// The streak is measured in meters at its depth, with a floor of a few pixels so that a far one
// still shows, and is hidden where the scene is in front of it.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
const int MAX_POINTS = 64;
// in eye coordinates, consecutive points of a trail; w is the age in seconds, negative for a
// break between trails or an unused slot
uniform vec4 trail[MAX_POINTS];
// seconds
uniform float fade;
// half width of the streak, meters
uniform float width;
uniform vec3 color;
in vec2 v_textureCoordinates;

// pixels
const float MIN_WIDTH = 1.5;
// brightness of a streak at its center, fresh
const float INTENSITY = 0.5;
// a point this far behind the depth under it is hidden, meters
const float OCCLUSION = 0.5;

void main() {
  vec2 uv = v_textureCoordinates;
  vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
  vec2 pixel = (2.0 * uv - 1.0) * aspect;
  float minWidth = MIN_WIDTH * czm_pixelRatio * 2.0 / czm_viewport.w;
  vec4 under = eyeAt(depthTexture, uv);
  float underDistance = under.w != 0.0 ? length(under.xyz) : 1e30;

  float glow = 0.0;
  for (int i = 0; i < MAX_POINTS - 1; i++) {
    vec4 a = trail[i];
    vec4 b = trail[i + 1];
    if (a.w < 0.0 || b.w < 0.0 || a.z >= 0.0 || b.z >= 0.0 || a.w > fade) {
      continue;
    }
    vec4 clipA = czm_projection * vec4(a.xyz, 1.0);
    vec4 clipB = czm_projection * vec4(b.xyz, 1.0);
    vec2 pa = clipA.xy / clipA.w * aspect;
    vec2 pb = clipB.xy / clipB.w * aspect;
    vec2 ab = pb - pa;
    float t = clamp(dot(pixel - pa, ab) / max(dot(ab, ab), 1e-12), 0.0, 1.0);
    float distance = length(pixel - (pa + t * ab));
    float depth = mix(-a.z, -b.z, t);
    if (mix(length(a.xyz), length(b.xyz), t) > underDistance + OCCLUSION) {
      continue;
    }
    float halfWidth = max(width * czm_projection[1][1] / depth, minWidth);
    float age = mix(a.w, b.w, t);
    glow += exp(-pow(distance / halfWidth, 2.0)) * (1.0 - age / fade);
  }
  vec4 sceneColor = texture(colorTexture, uv);
  out_FragColor = vec4(sceneColor.rgb + color * INTENSITY * min(glow, 1.0), sceneColor.a);
}
