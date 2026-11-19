// The clouds accumulated over the frames, at the march's resolution: each frame's march, jittered
// anew, blended into the clouds of the previous frames, reprojected to where they are seen now, as
// Frostbite's, whose 14 samples a frame "look converged" (Hillaire 2016, sec. 5.5.3). The previous
// frames' clouds are reprojected through where the ray enters the slab, near what is seen of them
// from outside, rather than through their transmittance-weighted distance (Sakmary 2022), which the
// march has no channel left for. They are read through a Catmull-Rom filter, where a bilinear read
// would blur them a little more at each frame, and clamped to the current frame's 3 x 3
// neighborhood so that they do not trail behind what moved: clipped toward its mean along the line
// between them (Pedersen 2016) instead, they were noisier and no sharper. Needs EyeFromDepth,
// Height and CloudsSlab.
precision highp sampler2D;
uniform sampler2D depthTexture;
// the farthest distance of the scene in this texel's block of pixels, from CloudsDepth.glsl
uniform sampler2D cloudDepth;
// this frame's march, and the accumulation of the previous frames, from clouds.js
uniform sampler2D cloudTexture;
uniform sampler2D historyTexture;
// from the eye coordinates of this frame to the clip coordinates of the previous one
uniform mat4 reprojection;
// the share of the previous frames in the blend, 0 when there are none
uniform float historyWeight;
in vec2 v_textureCoordinates;

// inside the slab, the clouds are reprojected through a point this far along the ray, in meters
const float INSIDE_DISTANCE = 2000.0;

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
  vec4 current = texture(cloudTexture, v_textureCoordinates);
  // czm_viewport is this pass's texture, the march's size, and the history's
  vec2 size = czm_viewport.zw;
  vec2 texel = 1.0 / size;
  vec4 low = current;
  vec4 high = current;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec4 neighbor = texture(cloudTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel);
      low = min(low, neighbor);
      high = max(high, neighbor);
    }
  }
  vec3 direction = normalize(eyeAt(depthTexture, v_textureCoordinates).xyz);
  vec2 segment = slab(dot(direction, up), texture(cloudDepth, v_textureCoordinates).r, slabTop);
  // where the ray misses the slab, nothing is there to move: only the view turns
  vec4 point = segment.y > segment.x ? vec4(direction * max(segment.x, min(segment.y, INSIDE_DISTANCE)), 1.0) : vec4(direction, 0.0);
  vec4 clip = reprojection * point;
  vec2 previous = clip.xy / clip.w * 0.5 + 0.5;
  bool seen = clip.w > 0.0 && all(greaterThanEqual(previous, vec2(0.0))) && all(lessThanEqual(previous, vec2(1.0)));
  vec4 history = clamp(historyAt(previous, size), low, high);
  out_FragColor = mix(current, history, seen ? historyWeight : 0.0);
}
