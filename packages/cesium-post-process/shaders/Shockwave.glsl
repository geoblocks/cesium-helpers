// Shockwave: from each impact, a ring of refraction spreads over the picture, pushing it
// outward, with a faint bright rim, and dies out. The ring is measured in meters at the
// impact's depth, so a far impact makes a small ring.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
const int MAX_IMPACTS = 8;
// in eye coordinates; w is the age in seconds, negative for an unused slot
uniform vec4 impacts[MAX_IMPACTS];
// 0 to 1
uniform float strength;
// meters per second
uniform float speed;
// seconds
uniform float duration;
in vec2 v_textureCoordinates;

// meters, at full strength
const float WIDTH = 0.4;
const float AMPLITUDE = 0.1;
const float GLOW = 0.06;
// an impact this far behind the depth under it is hidden, meters
const float OCCLUSION = 0.5;

void main() {
  vec2 uv = v_textureCoordinates;
  vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
  // in half screen heights, from the middle of the screen
  vec2 pixel = (2.0 * uv - 1.0) * aspect;
  vec2 offset = vec2(0.0);
  float glow = 0.0;
  for (int i = 0; i < MAX_IMPACTS; i++) {
    vec4 impact = impacts[i];
    if (impact.w < 0.0 || impact.w > duration || impact.z >= 0.0) {
      continue;
    }
    vec4 clip = czm_projection * vec4(impact.xyz, 1.0);
    vec2 center = clip.xy / clip.w;
    vec4 under = eyeAt(depthTexture, 0.5 * center + 0.5);
    if (under.w != 0.0 && length(under.xyz) < length(impact.xyz) - OCCLUSION) {
      continue;
    }
    // meters at the impact's depth to half screen heights
    float scale = czm_projection[1][1] / -impact.z;
    vec2 toPixel = pixel - center * aspect;
    float distance = length(toPixel) / scale;
    float radius = speed * impact.w;
    float band = exp(-pow((distance - radius) / WIDTH, 2.0));
    float decay = strength * pow(1.0 - impact.w / duration, 2.0);
    vec2 direction = distance > 0.0 ? normalize(toPixel) : vec2(0.0);
    // pushed outward: the pixel shows what was nearer the center
    offset -= direction * AMPLITUDE * scale * band * decay;
    glow += GLOW * band * decay;
  }
  // half screen heights to texture coordinates
  vec4 color = texture(colorTexture, clamp(uv + 0.5 * offset / aspect, 0.0, 1.0));
  out_FragColor = vec4(color.rgb + glow, color.a);
}
