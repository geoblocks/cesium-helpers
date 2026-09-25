// The eyepieces, two overlapping circles in a 160x100 box fitted to the canvas, black around
// them. Inside, lens effects: a slight fisheye and color fringes toward the rim, both stronger at
// high magnification, the light falling off and the image softening toward the rim, a depth of
// field focused on the middle of the view that gets shallower as the magnification grows, and the
// warm tint of the coatings. Picking ignores the fisheye, so near the rim the picked point is a
// little off what is shown.
uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
uniform float magnification;
in vec2 v_textureCoordinates;

const vec2 BOX = vec2(160.0, 100.0);
const vec2 LEFT = vec2(52.0, 50.0);
const vec2 RIGHT = vec2(108.0, 50.0);
const float RADIUS = 46.0;
// half width of the soft edge of the eyepieces, in box units
const float EDGE = 2.0;
// the effects only apply within this distance of the rim, in box units, so the middle of the
// view, where the eyepieces overlap, stays clean
const float BAND = 20.0;
// fisheye: on the rim, sample up to this fraction further from the center, at 5x
const float FISHEYE = 0.07;
// color fringe on the rim, in box units, at 5x
const float FRINGE = 1.0;
// light lost on the rim of an eyepiece
const float VIGNETTE = 0.35;
// blur on the rim, off the optical axis
const float RIM_BLUR = 0.6;
// sharp within this many factors of two of the focal distance at 1x, narrower as 1 / magnification
const float FOCUS_RANGE = 2.0;

// offsets in box units for one eyepiece: xy the fisheye, zw the color fringe
vec4 lensOffsets(vec2 toCenter, float strength) {
  float fromCenter = length(toCenter);
  // 0 up to the band, 1 on the rim
  float rim = 1.0 - clamp((RADIUS - fromCenter) / BAND, 0.0, 1.0);
  vec2 direction = toCenter / max(fromCenter, 1e-3);
  return strength * vec4(toCenter * FISHEYE * rim * rim, direction * FRINGE * rim * rim * rim);
}

// the scene at uv, blurred by the depth of field around the focal distance and toward the rim
vec4 sampleAt(vec2 uv, float focalDistance, float rimBlur) {
  vec4 eye = eyeAt(depthTexture, uv);
  float fromCamera = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float range = FOCUS_RANGE / magnification;
  float defocus = focalDistance > 0.0
    ? smoothstep(range, 2.0 * range, abs(log2(fromCamera / focalDistance)))
    : 0.0;
  // no depth of field at 1x, fully from 3x
  defocus *= smoothstep(1.0, 3.0, magnification);
  return mix(texture(colorTexture, uv), texture(blurTexture, uv), max(defocus, rimBlur));
}

void main() {
  vec2 size = czm_viewport.zw;
  float scale = min(size.x / BOX.x, size.y / BOX.y);
  vec2 position = (v_textureCoordinates * size - 0.5 * (size - scale * BOX)) / scale;
  vec2 toLeft = position - LEFT;
  vec2 toRight = position - RIGHT;

  // cheap optics show their flaws more when zoomed in: 0.6 at 1x, 1 at 5x, 2 at 20x and beyond
  float strength = clamp(0.5 + magnification / 10.0, 0.6, 2.0);
  vec4 left = lensOffsets(toLeft, strength);
  vec4 right = lensOffsets(toRight, strength);
  // blend the two eyepieces where they overlap, so there is no seam between them
  float weight = smoothstep(-6.0, 6.0, length(toRight) - length(toLeft));
  vec4 offsets = mix(right, left, weight) * scale / vec4(size, size);

  // focused on what is in the middle of the view; the sky there is at infinity
  vec4 target = eyeAt(depthTexture, vec2(0.5));
  float focalDistance = target.w == 0.0 ? 0.0 : length(target.xyz);
  // 0 in the middle of an eyepiece, 1 on its rim
  float fromAxis = min(length(toLeft), length(toRight)) / RADIUS;
  float rimBlur = RIM_BLUR * smoothstep(0.6, 1.0, fromAxis);

  vec2 uv = v_textureCoordinates + offsets.xy;
  vec4 center = sampleAt(uv, focalDistance, rimBlur);
  vec3 color = vec3(
    sampleAt(uv + offsets.zw, focalDistance, rimBlur).r,
    center.g,
    sampleAt(uv - offsets.zw, focalDistance, rimBlur).b
  );
  color *= vec3(1.0, 0.98, 0.93);
  // the light falls off toward the field stop
  color *= 1.0 - VIGNETTE * smoothstep(0.5, 1.0, fromAxis);
  float open = 1.0 - smoothstep(RADIUS - EDGE, RADIUS + EDGE, min(length(toLeft), length(toRight)));
  out_FragColor = vec4(color * open, center.a);
}
