// The clouds at the full resolution, built over the frames from the march, which marches one pixel
// of each block of 4 x 4 at each frame (Schneider 2015's temporal reprojection, a 16th of the
// pixels a frame): the pixel marched this frame blends its new sample into its history, the others
// take their history, reprojected to where they are seen now through the distance of the clouds
// the march saw (Sakmary 2022), read through a Catmull-Rom filter, where a bilinear read would
// blur it a little more at each frame, and while the view moves, clamped around the fresh samples
// upsampled to the pixel, by their range, so that it does not trail behind what moved;
// where there is no history, the fresh samples upsampled. A pixel whose scene is nearer than where
// its ray enters the slab has no cloud in front of it, history or not: a ridge moving in front of
// a cloud does not keep the cloud's light for 16 frames. Needs EyeFromDepth, Height and CloudsSlab.
precision highp sampler2D;
uniform sampler2D depthTexture;
// this frame's march, packed (CloudsMarch.glsl's packCloud), and the previous frames' clouds
uniform sampler2D cloudTexture;
uniform sampler2D historyTexture;
// from the eye coordinates of this frame to the clip coordinates of the previous one
uniform mat4 reprojection;
// whether there is a history to take, none yet or another map's clouds
uniform bool hasHistory;
// the pixel of each block marched this frame, and the share of its new sample in its clouds, from
// clouds.js: 1 / n for its n-th since the view last changed, a running mean; 1 in the first round
// of the blocks' pixels after a change, while the view moves and the history is clamped. Once still
// for a round, the reprojection is exact, each pixel's history its own samples, and a clamp to the
// noisy fresh samples around it would only add their noise
uniform vec2 frameOffset;
uniform float fresh;
in vec2 v_textureCoordinates;


// the march's sample of a block, its light and transmittance, and the distance of what it saw
vec4 freshLight(ivec2 block, out float distance) {
  vec4 packed = texelFetch(cloudTexture, clamp(block, ivec2(0), textureSize(cloudTexture, 0) - 1), 0);
  distance = packed.b;
  return vec4(unpackHalf2x16(floatBitsToUint(packed.r)), packed.g, packed.a);
}

vec4 freshLight(ivec2 block) {
  float unused;
  return freshLight(block, unused);
}

// the history at a point, through a Catmull-Rom filter in 5 bilinear reads, its corners left out
// (Jimenez 2016, "Filmic SMAA", sec. 5): the cubic's negative lobes keep it sharp; its overshoot
// cut at 0, as light and transmittance are
vec4 historyAt(vec2 uv, vec2 size) {
  vec2 position = uv * size;
  vec2 center = floor(position - 0.5) + 0.5;
  vec2 f = position - center;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (center - 1.0) / size;
  vec2 t3 = (center + 2.0) / size;
  vec2 t12 = (center + w2 / w12) / size;
  vec4 sum = texture(historyTexture, vec2(t12.x, t0.y)) * w12.x * w0.y
    + texture(historyTexture, vec2(t0.x, t12.y)) * w0.x * w12.y
    + texture(historyTexture, t12) * w12.x * w12.y
    + texture(historyTexture, vec2(t3.x, t12.y)) * w3.x * w12.y
    + texture(historyTexture, vec2(t12.x, t3.y)) * w12.x * w3.y;
  float weight = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  return max(sum / weight, vec4(0.0));
}

void main() {
  // czm_viewport is this pass's texture, the scene's size, and the history's
  vec2 size = czm_viewport.zw;
  vec2 pixel = floor(gl_FragCoord.xy);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 direction = normalize(eye.xyz);
  // nothing in the slab in front of the scene: no cloud
  vec2 inSlab = slab(dot(direction, up), eye.w == 0.0 ? BEYOND_SLAB : length(eye.xyz), slabTop);
  if (inSlab.y <= inSlab.x) {
    out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  // this pixel's block, whose sample was marched at frameOffset in it, and the 2 x 2 samples
  // around the pixel, for the bounds and the upsampling
  ivec2 block = ivec2(floor(pixel / BLOCK));
  float distance;
  vec4 current = freshLight(block, distance);
  vec2 grid = (pixel - frameOffset) / BLOCK;
  ivec2 corner = ivec2(floor(grid));
  vec2 f = fract(grid);
  vec4 c00 = freshLight(corner);
  vec4 c10 = freshLight(corner + ivec2(1, 0));
  vec4 c01 = freshLight(corner + ivec2(0, 1));
  vec4 c11 = freshLight(corner + ivec2(1, 1));
  vec4 upsampled = mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);
  // the history is clamped within the fresh samples' range around their bilinear upsampling: the
  // bounds of the 2 x 2 samples themselves are the same for a block of pixels, which their clamp
  // turned into squares
  vec4 range = max(max(c00, c10), max(c01, c11)) - min(min(c00, c10), min(c01, c11));
  // through the clouds' distance; where the ray meets no slab, nothing is there to move: only the
  // view turns
  vec4 point = distance > 0.0 ? vec4(direction * distance, 1.0) : vec4(direction, 0.0);
  vec4 clip = reprojection * point;
  vec2 previous = clip.xy / clip.w * 0.5 + 0.5;
  bool seen = hasHistory && clip.w > 0.0 && all(greaterThanEqual(previous, vec2(0.0))) && all(lessThanEqual(previous, vec2(1.0)));
  bool marched = all(equal(pixel - BLOCK * vec2(block), frameOffset));
  // the history read only where it is taken: not where it is off screen, nor for a pixel marched in
  // the first round after a change, whose new sample is all of it
  if (!seen || (marched && fresh >= 1.0)) {
    out_FragColor = marched ? current : upsampled;
    return;
  }
  vec4 history = historyAt(previous, size);
  if (fresh >= 1.0) {
    history = clamp(history, upsampled - range, upsampled + range);
  }
  out_FragColor = marched ? mix(history, current, fresh) : history;
}
