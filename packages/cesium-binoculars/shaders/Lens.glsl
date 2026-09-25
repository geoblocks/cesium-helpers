// The eyepieces, two overlapping circles in a 160x100 box fitted to the canvas, black around
// them. Inside, lens effects: a slight fisheye and color fringes toward the rim, and the warm
// tint of the coatings. Picking ignores the fisheye, so near the rim the picked point is a
// little off what is shown.
uniform sampler2D colorTexture;
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
// fisheye: on the rim, sample up to this fraction further from the center
const float FISHEYE = 0.07;
// color fringe on the rim, in box units
const float FRINGE = 1.0;

// offsets in box units for one eyepiece: xy the fisheye, zw the color fringe
vec4 lensOffsets(vec2 toCenter) {
  float fromCenter = length(toCenter);
  // 0 up to the band, 1 on the rim
  float rim = 1.0 - clamp((RADIUS - fromCenter) / BAND, 0.0, 1.0);
  vec2 direction = toCenter / max(fromCenter, 1e-3);
  return vec4(toCenter * FISHEYE * rim * rim, direction * FRINGE * rim * rim * rim);
}

void main() {
  vec2 size = czm_viewport.zw;
  float scale = min(size.x / BOX.x, size.y / BOX.y);
  vec2 position = (v_textureCoordinates * size - 0.5 * (size - scale * BOX)) / scale;
  vec2 toLeft = position - LEFT;
  vec2 toRight = position - RIGHT;

  vec4 left = lensOffsets(toLeft);
  vec4 right = lensOffsets(toRight);
  // blend the two eyepieces where they overlap, so there is no seam between them
  float weight = smoothstep(-6.0, 6.0, length(toRight) - length(toLeft));
  vec4 offsets = mix(right, left, weight) * scale / vec4(size, size);

  vec2 uv = v_textureCoordinates + offsets.xy;
  vec4 center = texture(colorTexture, uv);
  vec3 color = vec3(
    texture(colorTexture, uv + offsets.zw).r,
    center.g,
    texture(colorTexture, uv - offsets.zw).b
  );
  color *= vec3(1.0, 0.98, 0.93);
  float open = 1.0 - smoothstep(RADIUS - EDGE, RADIUS + EDGE, min(length(toLeft), length(toRight)));
  out_FragColor = vec4(color * open, center.a);
}
