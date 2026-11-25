// The edges found in the depth, shared by Toy and WhiteModel, after EyeFromDepth: how far a pixel
// lies, how large a pixel is there, the depth's neighbors around it, how sharply it bends between
// them (a crease, not across a jump: an edge in front of something farther, nor the gentle bends
// between the terrain's triangles), the outline on the near side of a jump; the sky's gradient.
// its samplers read in high precision, whatever comes before (a phone's GPU's default is low)
precision highp sampler2D;
uniform sampler2D depthTexture;

// how much the depth bends, in pixels' sizes, to start and to end lighting an edge
const vec2 CREASE = vec2(0.6, 1.6);
// how far the depth jumps, in pixels' sizes, to be an edge in front of something farther, not a crease
uniform float jump;
// the bevel's widest, in pixels: its neighbors read that far at the most
const float BEVEL = 8.0;
// the sky's depth, far off
const float SKY = 1e9;

// how far the pixel at uv lies, in meters: in an orthographic view past its near plane, small
// numbers whose differences keep their precision (its camera thousands of meters back: some
// phones' GPUs, Mali, lose it subtracting depths that large), in a perspective one from the camera
float depthAt(vec2 uv) {
  if (czm_orthographicIn3D == 1.0) {
    float raw = texture(depthTexture, uv).r;
    return raw >= 1.0 ? SKY : raw * (czm_currentFrustum.y - czm_currentFrustum.x);
  }
  vec4 eye = eyeAt(depthTexture, uv);
  return eye.w == 0.0 ? SKY : -eye.z;
}

// a pixel's size in meters at a depth: an orthographic view's the same everywhere, a perspective's
// growing with the depth
float pixelAt(float depth) {
  return 2.0 / (czm_projection[0][0] * czm_viewport.z) * (czm_orthographicIn3D == 1.0 ? 1.0 : depth);
}

// the depths of the neighbors steps pixels away from uv, less its own c: right, left, up, down
vec4 neighborsAt(vec2 uv, float c, float steps) {
  vec2 o = steps / czm_viewport.zw;
  return vec4(depthAt(uv + vec2(o.x, 0.0)), depthAt(uv - vec2(o.x, 0.0)), depthAt(uv + vec2(0.0, o.y)), depthAt(uv - vec2(0.0, o.y))) - c;
}

// how sharply the depth bends at c between its neighbors n, a span of meters apart, from -1 to 1: positive where the
// surface bends outward (convex, the neighbors farther than the middle), negative inward; none across a jump, fading
// out over a quarter of it each way as the outline fades in. The bend is measured where the depth is affine on the
// screen, as farSide's: an orthographic view's depth, a perspective one's reciprocal, scaled back to meters. A plane
// at any slope then bends by nothing: the depth's own second difference grows toward a plane's vanishing line, a floor
// seen at a grazing angle lit in a band. The jump is counted in pixels' sizes whatever the span: neighbors read a
// bevel away lie that much farther along a slope, so a bevel drops the crease of a wall receding steeply (all of
// them with a low jump), but a jump counted in spans shades a band of the face behind every silhouette
float creaseOf(vec4 n, float c, float span, float pixel) {
  float far = max(max(abs(n.x), abs(n.y)), max(abs(n.z), abs(n.w)));
  vec2 bend = vec2(n.x + n.y, n.z + n.w);
  if (czm_orthographicIn3D != 1.0) {
    vec4 ratio = c / (n + c);
    bend = c * (2.0 - ratio.xz - ratio.yw);
  }
  float limit = jump * pixel;
  float sharp = smoothstep(CREASE.x, CREASE.y, (abs(bend.x) + abs(bend.y)) / span) * (1.0 - smoothstep(0.75 * limit, 1.25 * limit, far));
  return bend.x + bend.y > 0.0 ? sharp : -sharp;
}

// how far the surface beyond the pixel at uv lies behind it, in one direction o (a pixel's step): the two neighbours
// that way extrapolated back to the pixel, linearly in an orthographic view, where the depth is affine on the screen,
// in its reciprocal in a perspective one. A plane at any slope extrapolates exactly to the pixel, so a face seen at a
// grazing angle is never a jump, only a nearer thing standing in front of a farther one. The nearer of the extrapolation
// and the neighbour itself: beside a thin thing two pixels away, the extrapolation through it runs far behind the pixel
float farSide(vec2 uv, vec2 o, float c) {
  float d1 = depthAt(uv + o);
  float d2 = depthAt(uv + 2.0 * o);
  if (d1 == SKY) {
    return SKY;
  }
  if (czm_orthographicIn3D == 1.0) {
    return min(d1, d2 == SKY ? d1 : 2.0 * d1 - d2) - c;
  }
  float r = d2 == SKY ? 1.0 / d1 : 2.0 / d1 - 1.0 / d2;
  return (r <= 0.0 ? d1 : min(d1, 1.0 / r)) - c;
}

// the outline, a pixel wide, on the near side of a jump: the farthest of the four directions' surfaces behind the pixel,
// against the jump, anti-aliased over a quarter of it each way
float outlineAt(vec2 uv, float c, float pixel) {
  vec2 texel = 1.0 / czm_viewport.zw;
  float farther = max(max(farSide(uv, vec2(texel.x, 0.0), c), farSide(uv, vec2(-texel.x, 0.0), c)),
    max(farSide(uv, vec2(0.0, texel.y), c), farSide(uv, vec2(0.0, -texel.y), c)));
  float limit = jump * pixel;
  return smoothstep(0.75 * limit, 1.25 * limit, farther);
}

// the sky's gradient at uv, from the top of the screen to its bottom
vec3 skyAt(vec2 uv, vec4 top, vec4 bottom) {
  return mix(bottom.rgb, top.rgb, smoothstep(0.0, 1.0, uv.y));
}
