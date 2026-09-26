// An analog FPV video feed: washed-out colors, color bleeding sideways (the signal carries the
// brightness at a higher resolution than the color, yet smeared a little), ringing beside sharp
// edges, lines that jitter sideways, grain changing with each video frame, and a signal that
// fades in and out: broken bright bands drifting down the picture, as from another transmitter,
// sparkles (the clicks of FM video near its threshold: short streaks with a fading tail, white
// on the dark, black on the bright), the color lost when the signal is weakest, and rare
// breakups into static. After ntsc-rs's chroma lowpass and delay, luma smear, ringing and snow,
// and the analog FPV artifacts of troubleshooting guides.
uniform sampler2D colorTexture;
// seconds
uniform float time;
// 0 to 1
uniform float noise;
uniform float interference;
// per frame, from the time and the interference: how weak the signal is now, 0 to 1; 1 in the
// rare frames where it breaks up into static; where each interference band is, as a fraction
// of the picture height from the bottom, negative while it is away
uniform float weak;
uniform float breakup;
uniform vec3 lineAt;
in vec2 v_textureCoordinates;

// PAL video runs at 25 frames per second
const float FRAME_RATE = 25.0;
// the color is spread over this many CSS pixels on either side, and shifted to the right
const float BLEED = 4.0;
const float BLEED_SHIFT = 1.5;
// ringing: the overshoot beside edges, at this distance in CSS pixels
const float RING_DISTANCE = 2.5;
const float RING = 0.6;
// the brightness trails to the right over this many CSS pixels, as through a lowpass filter
const float SMEAR = 1.5;
// each video line jitters sideways by up to this many CSS pixels, a new offset each frame
const float JITTER = 0.6;
// interference bands
const int LINES = 3;
// sparkles: at most one starts in each cell of this many CSS pixels of a video line, and runs
// for up to SPARKLE_LENGTH, shorter than a cell so that only the previous cell reaches this one
const float SPARKLE_CELL = 40.0;
const float SPARKLE_LENGTH = 30.0;
// BT.601 luma and color differences
vec3 toYuv(vec3 rgb) {
  float y = dot(rgb, vec3(0.299, 0.587, 0.114));
  return vec3(y, 0.492 * (rgb.b - y), 0.877 * (rgb.r - y));
}

vec3 toRgb(vec3 yuv) {
  float b = yuv.x + yuv.y / 0.492;
  float r = yuv.x + yuv.z / 0.877;
  return vec3(r, (yuv.x - 0.299 * r - 0.114 * b) / 0.587, b);
}

void main() {
  vec2 size = czm_viewport.zw;
  float frame = mod(floor(time * FRAME_RATE), 1000.0);
  // the pixel, and its video line, in CSS pixels, for effects along the lines
  vec2 pixel = floor(gl_FragCoord.xy / czm_pixelRatio);
  float row = pixel.y;
  // interference bands: a few lines high and broken into flickering segments; the video lines
  // near one shake sideways
  float lines = 0.0;
  float near = 0.0;
  for (int i = 0; i < LINES; i++) {
    if (lineAt[i] < 0.0) {
      continue;
    }
    float seed = float(i) * 7.0;
    float gap = abs(gl_FragCoord.y - lineAt[i] * size.y) / czm_pixelRatio;
    float segments = 0.6 * hash(vec2(floor(pixel.x / 12.0), frame * 3.0 + seed))
      + 0.4 * hash(vec2(floor(pixel.x / 37.0), frame * 5.0 + seed));
    lines = max(lines, (1.0 - smoothstep(1.0, 2.5, gap)) * smoothstep(0.35, 0.85, segments));
    near = max(near, exp(-gap * gap / 16.0));
  }
  // the video lines jitter a little, and more near the interference lines
  float shake = (hash(vec2(row, frame)) - 0.5) * (6.0 * near + 2.0 * JITTER * (0.5 + interference)) * czm_pixelRatio;
  vec2 uv = v_textureCoordinates + vec2(shake / size.x, 0.0);

  // the brightness smeared to the right, with ringing beside the edges; the color averaged sideways
  // and shifted
  vec4 sceneColor = texture(colorTexture, uv);
  vec3 yuv = toYuv(sceneColor.rgb);
  vec2 smearStep = vec2(SMEAR * czm_pixelRatio / size.x, 0.0);
  yuv.x = 0.5 * yuv.x + 0.3 * toYuv(texture(colorTexture, uv - 0.5 * smearStep).rgb).x
    + 0.2 * toYuv(texture(colorTexture, uv - smearStep).rgb).x;
  vec2 ringStep = vec2(RING_DISTANCE * czm_pixelRatio / size.x, 0.0);
  float left = toYuv(texture(colorTexture, uv - ringStep).rgb).x;
  float right = toYuv(texture(colorTexture, uv + ringStep).rgb).x;
  yuv.x += RING * (yuv.x - 0.5 * (left + right));
  vec2 color = vec2(0.0);
  for (int i = -2; i <= 2; i++) {
    float offset = (BLEED_SHIFT + BLEED * float(i) / 2.0) * czm_pixelRatio / size.x;
    color += toYuv(texture(colorTexture, uv - vec2(offset, 0.0)).rgb).yz;
  }
  yuv.yz = color / 5.0;

  // washed out: less color and contrast, lifted blacks; no color at all when the signal is weakest
  yuv.yz *= 0.75 * (1.0 - smoothstep(0.5, 0.9, weak));
  yuv.x = 0.06 + 0.86 * yuv.x;
  vec3 rgb = toRgb(yuv);

  // grain, a new pattern with each frame, heavier in the dark; the interference bands, and static
  // all over the picture in the rare frames where the signal breaks up
  float grain = hash(pixel + vec2(frame * 37.0, frame * 17.0)) - 0.5;
  rgb += grain * noise * 0.25 * (1.0 - 0.6 * yuv.x);
  rgb = mix(rgb, vec3(0.85 + 0.3 * grain), 0.7 * lines);

  // sparkles, more as the signal weakens: the one starting in this cell of the line or in the
  // previous one, bright at its head and fading along its tail
  float sparkle = 0.0;
  float cell = floor(pixel.x / SPARKLE_CELL);
  for (int i = 0; i < 2; i++) {
    // a new pattern each frame, offset by more cells than a line holds so that frames do not repeat
    vec2 id = vec2(cell - float(i) + frame * 61.0, row);
    float start = (cell - float(i) + hash(id + 0.5)) * SPARKLE_CELL;
    float span = 3.0 + (SPARKLE_LENGTH - 3.0) * hash(id + 1.5) * hash(id + 1.5);
    float along = (pixel.x - start) / span;
    float on = step(hash(id), 0.08 * weak * weak);
    sparkle = max(sparkle, on * step(0.0, along) * step(along, 1.0) * (1.0 - along) * (1.0 - along));
  }
  rgb = mix(rgb, vec3(step(yuv.x, 0.5)), 0.9 * sparkle);
  rgb = mix(rgb, vec3(grain + 0.5), 0.7 * breakup * interference);
  out_FragColor = vec4(clamp(rgb, 0.0, 1.0), sceneColor.a);
}
