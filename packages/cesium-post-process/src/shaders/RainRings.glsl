// Rings where the rain lands: the ground cut into cells of a local frame, in each cell a drop landing, as often as the intensity says, where the
// cell's hash puts it, a ripple growing from it, on what is flat enough. Over water slower and wider. A ripple's front spreads fast, then
// slows: its radius grows with the square root of its age; it fades in over its first moments and out as it grows. Its crest is a Gaussian
// bump, shaded by its slope toward the light along the ground, the side facing the light lighter and the other darker, as a crest added to
// the surface's normal is lit: it reads as relief rather than a painted circle. Each pixel sums the rings of its cell and the 8 around, so a
// ring crosses its cell's edge. The cells are in a local frame, in double precision from the CPU (local-frame.js), so they stay where they
// are as the camera moves and do not step with the globe's size. Only on what is open to the sky. Needs EyeFromDepth, Height, Hash, Normal
// and OpenSky.
precision highp sampler2D;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform mat4 localFromEye;
// 0 to 1: the share of the cells that have a drop
uniform float intensity;
// meters: a cell's size, and how far a ring on the ground grows
uniform float cell;
uniform float reach;
// meters above the ellipsoid, far above anything with no water
uniform float waterLevel;
// radians
uniform float maxSlope;
// rings a second
uniform float rate;
// seconds
uniform float time;
// the color of a ring, its alpha how strongly it shows
uniform vec4 color;
in vec2 v_textureCoordinates;

// a ring over water reaches this much farther, and runs this much slower
const float WATER_REACH = 1.7;
const float WATER_RATE = 0.5;
// meters from the water's level within which a surface is water, and beyond which it is not
const vec2 WET = vec2(0.1, 0.25);
// the narrowest crest, in meters: the Gaussian's width
const float LINE = 0.03;
// a ring fades in over this share of its life
const float FADE_IN = 0.1;
// the color tints the crest by this much of its alpha, and its slope lightens and darkens the scene by this much of it at its steepest
const float TINT = 0.5;
const float RELIEF = 0.8;
// the slope of exp(-x^2) is 2 x exp(-x^2), sqrt(2 / e) at its steepest: this brings it to 1 there
const float SLOPE = 2.3316;
// the light shades the crests as it rises from this sine of its height to the second: none from under the horizon
const vec2 RISING = vec2(-0.02, 0.05);
// a pixel wider than the first, in meters, fades the rings out to none at the second: they would be a speckle
const vec2 SMALL = vec2(0.08, 0.2);
// half the width of the slope limit, in radians
const float SLOPE_EDGE = 0.1;

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec2 local = (localFromEye * vec4(eye.xyz, 1.0)).xy;
  // before any early return, which would leave the derivatives undefined
  float footprint = length(fwidth(local));
  if (intensity <= 0.0 || eye.w == 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  // the rings fade out where a pixel is too wide, under a cover and on steep surfaces: none there, before the normal and the cells
  float shown = color.a * (1.0 - smoothstep(SMALL.x, SMALL.y, footprint));
  if (shown <= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  shown *= openSky(eye.xyz);
  if (shown <= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float slope = acos(clamp(dot(normal, up), -1.0, 1.0));
  shown *= 1.0 - smoothstep(maxSlope - SLOPE_EDGE, maxSlope + SLOPE_EDGE, slope);
  if (shown <= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  float wet = 1.0 - smoothstep(WET.x, WET.y, abs(heightAt(eye.xyz) - waterLevel));
  // the pixel's wetness sets the ring's pace and reach: a ring across the water's edge changes there
  float speed = rate * mix(1.0, WATER_RATE, wet);
  float width = max(LINE, 1.5 * footprint);
  // its crest within a cell of its drop, the farthest the neighboring cells reach
  float grows = clamp(reach * mix(1.0, WATER_REACH, wet), 0.0, max(cell - 3.0 * width, 0.0));
  vec2 here = floor(local / cell);
  // the pixel within its cell, and how far a ring reaches it from a drop: a neighboring cell farther than that is skipped, as it is for most
  // pixels, a ring being smaller than a cell
  vec2 within = local - here * cell;
  float near = grows + 3.0 * width;
  float crest = 0.0;
  // the crests' slope summed, outward from each drop
  vec2 rise = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 side = vec2(x, y);
      // to the near edge of that cell, along each axis it lies along
      vec2 gap = max(-side, 0.0) * within + max(side, 0.0) * (cell - within);
      vec2 id = here + side;
      if (dot(gap, gap) > near * near || hash(id) >= intensity) {
        continue;
      }
      vec2 offset = local - (id + vec2(hash(id + 3.1), hash(id + 7.7))) * cell;
      float distance = length(offset);
      if (distance > near) {
        continue;
      }
      float age = fract(time * speed + hash(id + 11.3));
      float across = (distance - grows * sqrt(age)) / width;
      float bump = exp(-across * across);
      float fade = smoothstep(0.0, FADE_IN, age) * (1.0 - age);
      crest += fade * bump;
      // the crest falls away from its top: its far side faces outward, its near side inward
      rise += fade * across * bump * offset / max(distance, czm_epsilon4);
    }
  }
  // the light's direction along the ground, its length the share of it that does not come from overhead, none once it is under the horizon
  vec3 light = mat3(localFromEye) * czm_lightDirectionEC;
  float relief = SLOPE * dot(rise, light.xy) * smoothstep(RISING.x, RISING.y, light.z);
  vec3 tinted = mix(sceneColor.rgb, color.rgb, min(crest, 1.0) * TINT * shown);
  out_FragColor = vec4(tinted * (1.0 + RELIEF * shown * clamp(relief, -1.0, 1.0)), sceneColor.a);
}
