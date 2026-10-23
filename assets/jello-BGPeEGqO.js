import{S as e,a as t,i as n,k as r}from"./cesium-shim-DLIYJZws.js";import{i}from"./EyeFromDepth-DmDC5MHh.js";import{n as a,t as o}from"./frame-clock-JIPNaZFQ.js";import{t as s}from"./Hash-CBIEOLtO.js";var c=`// An analog FPV video feed, as in the recordings of FPV pilots' goggles: a soft PAL picture,
// washed out, its color bleeding sideways (the signal carries the brightness at a higher
// resolution than the color, yet smeared a little), with ringing beside sharp edges and lines
// that jitter sideways. As the signal weakens (low over the ground, behind obstacles), the
// color goes first, the picture washes out toward a cold white and fills with colored streaks:
// short dashes along the video lines, the clicks of FM video below its threshold. Now and then
// the receiver loses the sync for a frame or two: the picture tears, a white band and black
// below it. Without a signal, the receiver shows its own noise: a dark field of colored
// streaks, the picture and its display gone. After ntsc-rs's chroma lowpass and delay, luma
// smear and ringing, and the recordings of FPV drones flying low and crashing.
precision highp sampler2D;
uniform sampler2D colorTexture;
// seconds
uniform float time;
// 0 to 1
uniform float noise;
// per frame: how weak the signal is now, 0 to 1, 1 without a signal; where the picture tears,
// as a fraction of its height from the top, or -1
uniform float weak;
uniform float tear;
in vec2 v_textureCoordinates;

// PAL video runs at 25 frames per second, in 576 lines of about 720 samples
const float FRAME_RATE = 25.0;
const vec2 VIDEO = vec2(720.0, 576.0);
// in video samples: the color spread on either side, and shifted to the right; the overshoot
// beside edges; the brightness trailing to the right, as through a lowpass filter
const float BLEED = 3.0;
const float BLEED_SHIFT = 1.0;
const float RING_DISTANCE = 1.5;
const float RING = 0.5;
const float SMEAR = 1.0;
// the white band of a tear, as a fraction of the picture height
const float TEAR_BAND = 0.07;

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

float luma(vec2 uv) {
  return toYuv(texture(colorTexture, uv).rgb).x;
}

// the streaks of one layer on a video line: at most one starts in each cell of the line, and runs
// for up to maxSpan samples, shorter than a cell so that only the previous cell reaches this one;
// with this chance per cell; its color, and its coverage in alpha
vec4 streaks(float x, float line, float frame, float cell, float maxSpan, float chance, float seed) {
  float index = floor(x / cell);
  vec4 streak = vec4(0.0);
  for (int i = 0; i < 2; i++) {
    // a new pattern each frame, offset by more cells than a line holds so that frames do not repeat
    vec2 id = vec2(index - float(i) + frame * 61.0 + seed, line);
    float start = (index - float(i) + hash(id + 0.5)) * cell;
    float span = 2.0 + (maxSpan - 2.0) * hash(id + 1.5) * hash(id + 1.5);
    float along = (x - start) / span;
    float on = step(hash(id), chance) * step(0.0, along) * step(along, 1.0);
    float shape = on * smoothstep(0.0, 0.15, along) * (1.0 - smoothstep(0.7, 1.0, along));
    if (shape > streak.a) {
      // bright, whitish or colored: magenta, green, blue, yellow
      float angle = 6.2832 * hash(id + 3.5);
      vec3 yuv = vec3(0.55 + 0.45 * hash(id + 2.5), 0.22 * hash(id + 4.5) * vec2(cos(angle), sin(angle)));
      streak = vec4(toRgb(yuv), shape);
    }
  }
  return streak;
}

void main() {
  float frame = mod(floor(time * FRAME_RATE), 1000.0);
  // the video line, counted from the top, and the sample along it
  float fromTop = 1.0 - v_textureCoordinates.y;
  float line = floor(fromTop * VIDEO.y);
  // the lines jitter sideways, more as the signal weakens
  float shake = (hash(vec2(line, frame)) - 0.5) * (0.4 + 2.0 * weak);
  vec2 uv = vec2(v_textureCoordinates.x + shake / VIDEO.x, 1.0 - (line + 0.5) / VIDEO.y);
  float x = uv.x * VIDEO.x;

  // the brightness smeared to the right, with ringing beside the edges; the color averaged sideways
  // and shifted
  vec4 sceneColor = texture(colorTexture, uv);
  vec3 yuv = toYuv(sceneColor.rgb);
  float texel = 1.0 / VIDEO.x;
  yuv.x = 0.5 * yuv.x + 0.3 * luma(uv - vec2(0.5 * SMEAR * texel, 0.0)) + 0.2 * luma(uv - vec2(SMEAR * texel, 0.0));
  float left = luma(uv - vec2(RING_DISTANCE * texel, 0.0));
  float right = luma(uv + vec2(RING_DISTANCE * texel, 0.0));
  yuv.x += RING * (yuv.x - 0.5 * (left + right));
  vec2 color = vec2(0.0);
  for (int i = -2; i <= 2; i++) {
    float offset = (BLEED_SHIFT + BLEED * float(i) / 2.0) * texel;
    color += toYuv(texture(colorTexture, uv - vec2(offset, 0.0)).rgb).yz;
  }
  yuv.yz = color / 5.0;

  // washed out: less color and contrast, lifted blacks; as the signal weakens, the color lost and
  // the picture washed out toward a cold white
  float wash = smoothstep(0.4, 0.85, weak);
  yuv.yz *= 0.75 * (1.0 - smoothstep(0.35, 0.6, weak));
  yuv.x = 0.06 + 0.86 * yuv.x;
  yuv.x = mix(yuv.x, 0.55 + 0.45 * yuv.x, 0.6 * wash);
  yuv.yz += vec2(0.04, -0.02) * wash;
  vec3 rgb = toRgb(yuv);

  // grain, one value per video sample and a new pattern each frame, heavier in the dark
  float grain = hash(vec2(floor(x), line) + vec2(frame * 37.0, frame * 17.0)) - 0.5;
  rgb += grain * noise * 0.2 * (1.0 - 0.6 * yuv.x);

  // the sync lost: below the tear, a white band, then black
  if (tear >= 0.0) {
    float below = step(tear, fromTop);
    rgb = mix(rgb, vec3(0.02 + 0.05 * grain), below);
    rgb = mix(rgb, vec3(0.92), below * (1.0 - smoothstep(0.0, TEAR_BAND, fromTop - tear)));
  }

  // no signal: the receiver's dark noise instead of the picture
  rgb = mix(rgb, vec3(0.08 + 0.12 * grain), smoothstep(0.92, 1.0, weak));

  // the streaks, rare in a good signal, everywhere without one: long ones, and short ones as the
  // signal fails
  vec4 longStreak = streaks(x, line, frame, 24.0, 18.0, 0.35 * weak * weak * weak, 0.0);
  vec4 shortStreak = streaks(x, line, frame, 8.0, 6.0, 0.6 * smoothstep(0.5, 1.0, weak), 500.0);
  vec4 streak = longStreak.a > shortStreak.a ? longStreak : shortStreak;
  rgb = mix(rgb, streak.rgb, 0.85 * streak.a);
  out_FragColor = vec4(clamp(rgb, 0.0, 1.0), sceneColor.a);
}
`,l=25,u=.4,d=1.5,f=e=>e-Math.floor(e);function p(e,t){let n=f(e*.1031),r=f(t*.1031),i=n,a=n*(r+33.33)+r*(i+33.33)+i*(n+33.33);return n+=a,r+=a,i+=a,f((n+r)*i)}function m(t,n){let r=t*u,i=f(r),a=p(Math.floor(r),5)+(p(Math.floor(r)+1,5)-p(Math.floor(r),5))*i*i*(3-2*i),o=n>=1?1:n*(.75+.25*a),s=Math.floor(t*l/2)%1e3,c=2*d/l*e.clamp((n-.3)/.5,0,1);return{weak:o,tear:n<1&&p(s,11)<c?.2+.6*p(s,13):-1}}var h=class extends i{constructor(e,t={}){super(e),this.noise_=t.noise??.5,this.interference_=t.interference??.15,this.weak_=0,this.tear_=-1,this.onPreRender_=()=>{let e=m(performance.now()/1e3,this.interference_);this.weak_=e.weak,this.tear_=e.tear}}createStage_(){return new r({fragmentShader:s+c,uniforms:{time:()=>performance.now()/1e3,noise:()=>this.noise_,weak:()=>this.weak_,tear:()=>this.tear_}})}activated_(e){e.preRender.addEventListener(this.onPreRender_),o(e,l)}deactivating_(e){a(e,l),e.preRender.removeEventListener(this.onPreRender_)}get noise(){return this.noise_}set noise(e){this.noise_=e}get interference(){return this.interference_}set interference(e){this.interference_=e}},g=`// A digital FPV video feed and its breakups: clean, slightly punchy colors, until a weak signal
// breaks the picture into macroblocks, some displaced, strips shifted sideways and the color
// channels split, and at worst a short black screen. A block keeps only its lowest frequencies,
// as a codec that has thrown its detail away: a gradient between its corners, with fewer colors.
// The displaced blocks and strips follow three.js's DigitalGlitch. Without the previous frames,
// there are no freezes.
precision highp sampler2D;
uniform sampler2D colorTexture;
// how broken the picture is, 0 to 1, and 1 during a black screen
uniform float severity;
uniform float blackout;
// the video frame number, for the random patterns
uniform float frame;
in vec2 v_textureCoordinates;

// a macroblock, in CSS pixels
const float BLOCK = 16.0;

void main() {
  vec2 size = czm_viewport.zw;
  vec2 pixel = gl_FragCoord.xy / czm_pixelRatio;
  vec2 uv = v_textureCoordinates;
  vec4 sceneColor = texture(colorTexture, uv);
  // clean: slightly crushed blacks, a little more color
  vec3 rgb = sceneColor.rgb;
  rgb = czm_saturation(rgb, 1.1);
  rgb = max(rgb - 0.02, 0.0) / 0.98;

  if (severity > 0.0) {
    // the pattern changes every few frames, as the decoder stutters
    float pattern = floor(frame / 3.0);
    // strips shifted sideways
    float strip = floor(pixel.y / (BLOCK * 2.0));
    if (hash(vec2(strip, pattern + 7.0)) < 0.25 * severity) {
      uv.x += (hash(vec2(strip, pattern + 11.0)) - 0.5) * 0.2 * severity;
    }
    // macroblocks: more of them as the signal gets worse; some show the picture displaced
    vec2 block = floor(uv * size / czm_pixelRatio / BLOCK);
    if (hash(block + pattern * 0.37) < 1.2 * severity) {
      vec2 displaced = hash(block + pattern + 3.0) < 0.3
        ? floor((vec2(hash(block + 5.0), hash(block + 9.0)) - 0.5) * 4.0)
        : vec2(0.0);
      vec2 cell = BLOCK * czm_pixelRatio / size;
      vec2 origin = (block + displaced) * cell;
      // the block's corners, and a gradient between them
      vec2 inset = 0.5 / size;
      vec3 c00 = texture(colorTexture, origin + inset).rgb;
      vec3 c10 = texture(colorTexture, origin + vec2(cell.x - inset.x, inset.y)).rgb;
      vec3 c01 = texture(colorTexture, origin + vec2(inset.x, cell.y - inset.y)).rgb;
      vec3 c11 = texture(colorTexture, origin + cell - inset).rgb;
      vec2 f = fract(uv * size / czm_pixelRatio / BLOCK);
      rgb = mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);
      // fewer colors
      float levels = mix(24.0, 6.0, severity);
      rgb = floor(rgb * levels + 0.5) / levels;
    } else if (uv != v_textureCoordinates) {
      rgb = texture(colorTexture, uv).rgb;
    }
    // the color channels split sideways
    vec2 split = vec2(3.0 * severity * czm_pixelRatio / size.x, 0.0);
    rgb.r = mix(rgb.r, texture(colorTexture, uv + split).r, severity);
    rgb.b = mix(rgb.b, texture(colorTexture, uv - split).b, severity);
  }
  out_FragColor = vec4(rgb * (1.0 - blackout), sceneColor.a);
}
`,_=30,v=2,y=[.4,1.5],b=.25,x=class extends i{constructor(e,t={}){super(e),this.breakup_=t.breakup??.5,this.episode_=void 0,this.updated_=0,this.severity_=0,this.blackout_=0,this.onPreRender_=()=>this.update_()}createStage_(){return new r({fragmentShader:s+g,uniforms:{severity:()=>this.severity_,blackout:()=>this.blackout_,frame:()=>Math.floor(performance.now()/1e3*_)%1e5}})}activated_(e){this.updated_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),o(e,_)}deactivating_(e){a(e,_),e.preRender.removeEventListener(this.onPreRender_),this.episode_=void 0}update_(){let t=performance.now()/1e3,n=Math.min(t-this.updated_,1);if(this.updated_=t,this.episode_&&t>this.episode_.start+this.episode_.duration&&(this.episode_=void 0),!this.episode_&&Math.random()<1-Math.exp(-this.breakup_/v*n)){let e=y[0]+Math.random()*(y[1]-y[0]);this.episode_={start:t,duration:e,blackout:Math.random()<.5*this.breakup_}}let r=this.episode_;if(!r){this.severity_=0,this.blackout_=0;return}let i=(t-r.start)/r.duration;this.severity_=Math.max(0,Math.sin(e.PI*Math.min(i,1)))**.7*(.4+.6*this.breakup_),this.blackout_=r.blackout&&Math.abs(i-.5)*r.duration<b/2?1:0}get breakup(){return this.breakup_}set breakup(e){this.breakup_=e}},S=`// A drone's OSD, as ArduPilot draws it on an HD video system: 50 columns and 18 rows of 12 x 18
// pixel character cells over the whole picture, with the readouts near its edges, here in the
// blocky white glyphs of an analog chip with their black outline, and some in color. The layout
// follows a fixed-wing plane's display; the glyphs are drawn here, not copied from a font.
// - The horizon: 9 dots of 2 x 2 pixels around the middle, as ArduPilot's draw_horizon: pitch (at
//   most 20 degrees) moves it a row per 5 degrees, and roll tilts it at its angle on the screen;
//   each dot is at one of 9 heights in its cell, or past 45 degrees of roll, one per row at one of
//   9 places across its cell. A dot more than 4 cells from the middle is not drawn, and upside
//   down the horizon blinks. It is a symbol, not lined up with the real horizon.
// - The flight mode, top left: FBWA, RTL in failsafe; the heading, top middle.
// - Top right, the link bar, green, orange then red as the link quality drops, and the battery,
//   its symbol filled in green in 7 steps, and its voltage.
// - The right column: the altitude since the display turned on, under a mountain with a green
//   dot; the vertical speed, with one or two green arrows; the throttle.
// - The air speed, bottom middle, after its pale blue label.
// - The FAILSAFE warning, blinking red in the lower part of the middle while the control link is
//   lost.
precision highp sampler2D;
uniform sampler2D colorTexture;
// 0 to 1
uniform float opacity;
// degrees, negative looking down
uniform float pitch;
// degrees, positive to the right
uniform float roll;
// degrees, 0 to 360
uniform float heading;
// meters, since the display turned on
uniform float altitude;
// m/s, positive climbing
uniform float verticalSpeed;
// km/h
uniform float speed;
// volts
uniform float voltage;
// 0 to 99
uniform float linkQuality;
// percent
uniform float throttle;
// 1 while the control link is lost, 0 otherwise
uniform float failsafe;
// 1 or 0, twice per second: the blinking of the warning and of the horizon upside down
uniform float blink;
in vec2 v_textureCoordinates;

const float COLUMNS = 50.0;
const float ROWS = 18.0;
// a cell, in pixels
const float CELL_WIDTH = 12.0;
const float CELL_HEIGHT = 18.0;
// the middle cell, where the horizon is
const int MIDDLE_COLUMN = 24;
const int MIDDLE_ROW = 8;
// ArduPilot's horizon: its limit in pitch, rows per degree of it (16 rows per 80 degrees), and
// rows per column at 45 degrees of roll, for the line to tilt at its angle
const float MAX_PITCH = 20.0;
const float ROWS_PER_DEGREE = 0.2;
const float RATIO = CELL_WIDTH / CELL_HEIGHT;
// battery: volts full and empty of a 3S, and the steps of its symbol's fill (full, 5 to 1, empty)
const float FULL_VOLTS = 12.6;
const float EMPTY_VOLTS = 10.5;
const float BATTERY_STEPS = 6.0;
// the right column: the units in its last column, right of the numbers
const int UNIT_COLUMN = 41;
// the link bar: its first column, and its length in cells
const int LINK_COLUMN = 36;
const float LINK_CELLS = 6.0;

const vec3 WHITE = vec3(1.0);
const vec3 GREEN = vec3(0.2, 0.85, 0.35);
const vec3 ORANGE = vec3(1.0, 0.6, 0.1);
const vec3 RED = vec3(0.95, 0.15, 0.15);
const vec3 PALE_BLUE = vec3(0.55, 0.75, 0.95);

// the glyphs, at 12 x 18 pixels: one row of 12 bits each, the leftmost bit highest; the table is
// written by scripts/osd-font.js from its pixel drawings
const int DOT = 10;
const int SPACE = 11;
const int MINUS = 12;
const int VOLT = 13;
const int DEGREE = 14;
const int PERCENT = 15;
// the units of the altitude, the vertical speed and the air speed, and the air speed's label
const int ALTITUDE = 16;
const int METERS_PER_SECOND = 17;
const int KILOMETERS_PER_HOUR = 18;
const int AIR_SPEED = 19;
// the vertical speed's arrows
const int UP = 20;
const int UP_TWO = 21;
const int DOWN = 22;
const int DOWN_TWO = 23;
// the letters of the flight modes and the warning
const int LETTER_F = 24;
const int LETTER_B = 25;
const int LETTER_W = 26;
const int LETTER_A = 27;
const int LETTER_R = 28;
const int LETTER_T = 29;
const int LETTER_L = 30;
const int LETTER_I = 31;
const int LETTER_E = 32;
const int LETTER_S = 33;
// the warning's row and first column: FAILSAFE, centered under the middle
const int WARNING_ROW = 12;
const int WARNING_COLUMN = 21;

const int FONT[612] = int[612](
  0, 0, 0, 983040, 1671264, 1474704, 1474704, 1474704, 1474704, 1474704, 1474704, 1474704, 1671264, 983040, 0, 0, 0, 0, // 0
  0, 0, 0, 917504, 1704000, 1179840, 1704000, 655424, 655424, 655424, 655424, 1769536, 1114336, 2031616, 0, 0, 0, 0, // 1
  0, 0, 0, 983040, 1671264, 1474704, 1998864, 426000, 884768, 1769536, 1441920, 1540224, 1081584, 2064384, 0, 0, 0, 0, // 2
  0, 0, 0, 2031616, 1147104, 1998864, 163856, 950288, 622688, 950288, 163856, 1998864, 1147104, 2031616, 0, 0, 0, 0, // 3
  0, 0, 0, 2064384, 1474704, 1474704, 1474704, 1474704, 1081584, 1998864, 163856, 163856, 163856, 229376, 0, 0, 0, 0, // 4
  0, 0, 0, 2064384, 1081584, 1540224, 1507456, 1147104, 1998864, 163856, 1998864, 1474704, 1671264, 983040, 0, 0, 0, 0, // 5
  0, 0, 0, 983040, 1638496, 1507456, 1507456, 1147104, 1474704, 1474704, 1474704, 1474704, 1671264, 983040, 0, 0, 0, 0, // 6
  0, 0, 0, 2064384, 1081584, 1998864, 426000, 360480, 852000, 720960, 655424, 655424, 655424, 917504, 0, 0, 0, 0, // 7
  0, 0, 0, 983040, 1671264, 1474704, 1474704, 1474704, 1671264, 1474704, 1474704, 1474704, 1671264, 983040, 0, 0, 0, 0, // 8
  0, 0, 0, 983040, 1671264, 1474704, 1474704, 1474704, 1605744, 950288, 163856, 950288, 622688, 983040, 0, 0, 0, 0, // 9
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 983040, 589920, 589920, 983040, 0, 0, 0, 0, // .
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // space
  0, 0, 0, 0, 0, 0, 0, 2064384, 1081584, 2064384, 0, 0, 0, 0, 0, 0, 0, 0, // -
  0, 0, 0, 0, 0, 0, 3899392, 2785552, 2785552, 3047696, 3506336, 1376416, 1769536, 917504, 0, 0, 0, 0, // v, volts
  0, 0, 1966080, 3342528, 2949408, 2949408, 3342528, 1966080, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // °, degrees
  0, 0, 0, 0, 7979008, 4932360, 5161744, 8224800, 1769536, 3653760, 7225624, 5915160, 7585792, 0, 0, 0, 0, 0, // %
  1835008, 3539072, 7061824, 14508584, 11973652, 6543362, 12611584, 0, 4128768, 2195936, 2785616, 2785616, 2785616, 4161536, 0, 0, 0, 0, // a mountain over m, the altitude; the shader adds a green dot inside
  0, 4128768, 2195936, 2785616, 2785616, 2785616, 4161536, 0, 983040, 1638496, 1507456, 1769536, 1900576, 1245376, 1966080, 0, 0, 0, // m over s, meters per second
  14680064, 12567552, 11036024, 10135124, 11183444, 11183444, 16769024, 917504, 655424, 720960, 622688, 688208, 688208, 1015808, 0, 0, 0, 0, // km over h, kilometers per hour
  0, 8257536, 14410304, 11445524, 9070424, 11191632, 11175248, 16744448, 15757312, 2022914, 7575750, 1400490, 13849290, 1547910, 16576512, 0, 0, 0, // Air over Spd, the air speed
  0, 0, 0, 0, 0, 0, 917504, 1769536, 3244256, 6341104, 4211704, 8372224, 0, 0, 0, 0, 0, 0, // an arrow up
  0, 0, 917504, 1769536, 3244256, 6341104, 4211704, 8372224, 0, 917504, 1769536, 3244256, 6341104, 4211704, 8372224, 0, 0, 0, // two arrows up
  0, 0, 0, 0, 0, 0, 8372224, 4211704, 6341104, 3244256, 1769536, 917504, 0, 0, 0, 0, 0, 0, // an arrow down
  0, 0, 8372224, 4211704, 6341104, 3244256, 1769536, 917504, 0, 8372224, 4211704, 6341104, 3244256, 1769536, 917504, 0, 0, 0, // two arrows down
  0, 0, 0, 2064384, 1081584, 1540224, 1310848, 1507456, 1114336, 1507456, 1310848, 1310848, 1310848, 1835008, 0, 0, 0, 0, // F
  0, 0, 0, 2031616, 1147104, 1474704, 1474704, 1474704, 1147104, 1474704, 1474704, 1474704, 1147104, 2031616, 0, 0, 0, 0, // B
  0, 0, 0, 3899392, 2785552, 2785552, 2785552, 3047696, 2785616, 2785616, 2785616, 2785616, 3506336, 2031616, 0, 0, 0, 0, // W
  0, 0, 0, 983040, 1671264, 1474704, 1474704, 1474704, 1081584, 1474704, 1474704, 1474704, 1474704, 2064384, 0, 0, 0, 0, // A
  0, 0, 0, 2031616, 1147104, 1474704, 1474704, 1474704, 1147104, 1409184, 1474704, 1474704, 1474704, 2064384, 0, 0, 0, 0, // R
  0, 0, 0, 4161536, 2130416, 3899456, 655424, 655424, 655424, 655424, 655424, 655424, 655424, 917504, 0, 0, 0, 0, // T
  0, 0, 0, 1835008, 1310848, 1310848, 1310848, 1310848, 1310848, 1310848, 1310848, 1540224, 1081584, 2064384, 0, 0, 0, 0, // L
  0, 0, 0, 2031616, 1114336, 1769536, 655424, 655424, 655424, 655424, 655424, 1769536, 1114336, 2031616, 0, 0, 0, 0, // I
  0, 0, 0, 2064384, 1081584, 1540224, 1310848, 1507456, 1114336, 1507456, 1310848, 1540224, 1081584, 2064384, 0, 0, 0, 0, // E
  0, 0, 0, 1015808, 1605744, 1540224, 1310848, 1507456, 1671264, 950288, 163856, 1998864, 1147104, 2031616, 0, 0, 0, 0 // S
);

int digit(float value, float power) {
  return int(mod(floor(value / power), 10.0));
}

// 10 to the n, exactly: pow may be off by a little on the GPU
float powerOfTen(int n) {
  return n == 3 ? 1000.0 : n == 2 ? 100.0 : n == 1 ? 10.0 : 1.0;
}

// a number right-aligned to end at the column last: its whole part, and its tenths after a dot,
// and a minus before it when negative; -1 left of it
int numberAt(float value, bool tenths, int column, int last) {
  float scaled = floor(abs(value) * (tenths ? 10.0 : 1.0) + 0.5);
  float whole = tenths ? floor(scaled / 10.0) : scaled;
  int digits = whole >= 1000.0 ? 4 : whole >= 100.0 ? 3 : whole >= 10.0 ? 2 : 1;
  int i = last - column;
  if (tenths) {
    if (i == 0) {
      return digit(scaled, 1.0);
    }
    if (i == 1) {
      return DOT;
    }
    i -= 2;
  }
  if (i >= 0 && i < digits) {
    return digit(whole, powerOfTen(i));
  }
  return i == digits && value < 0.0 && scaled > 0.0 ? MINUS : -1;
}

// the glyph in this cell and its color, or -1
int glyphAt(int column, int row, out vec3 color) {
  color = WHITE;
  // the flight mode, top left
  if (row == 1 && column >= 3 && column <= 6) {
    int i = column - 3;
    if (failsafe > 0.5) {
      return i == 0 ? LETTER_R : i == 1 ? LETTER_T : i == 2 ? LETTER_L : -1;
    }
    return i == 0 ? LETTER_F : i == 1 ? LETTER_B : i == 2 ? LETTER_W : LETTER_A;
  }
  // the heading, top middle
  if (row == 1 && column >= 23 && column <= 26) {
    return column == 26 ? DEGREE : numberAt(mod(floor(heading + 0.5), 360.0), false, column, 25);
  }
  // the battery voltage, top right after its symbol: 12.0v
  if (row == 2 && column > LINK_COLUMN && column <= UNIT_COLUMN) {
    return column == UNIT_COLUMN ? VOLT : numberAt(clamp(voltage, 0.0, 99.9), true, column, UNIT_COLUMN - 1);
  }
  // the right column: the altitude, the vertical speed after its arrows, the throttle
  bool right = column >= UNIT_COLUMN - 6 && column <= UNIT_COLUMN;
  if (row == MIDDLE_ROW && right) {
    return column == UNIT_COLUMN ? ALTITUDE : numberAt(clamp(altitude, -999.0, 9999.0), false, column, UNIT_COLUMN - 1);
  }
  if (row == MIDDLE_ROW + 1 && right) {
    if (column == UNIT_COLUMN) {
      return METERS_PER_SECOND;
    }
    float climb = min(abs(verticalSpeed), 99.9);
    int width = climb >= 9.95 ? 4 : 3;
    if (column == UNIT_COLUMN - 1 - width) {
      color = GREEN;
      bool up = verticalSpeed > 0.0;
      return climb < 0.05 ? -1 : climb < 5.0 ? (up ? UP : DOWN) : (up ? UP_TWO : DOWN_TWO);
    }
    return numberAt(climb, true, column, UNIT_COLUMN - 1);
  }
  if (row == MIDDLE_ROW + 3 && right) {
    return column == UNIT_COLUMN ? PERCENT : numberAt(clamp(throttle, 0.0, 100.0), false, column, UNIT_COLUMN - 1);
  }
  // the warning
  if (failsafe > 0.5 && blink > 0.5 && row == WARNING_ROW && column >= WARNING_COLUMN && column < WARNING_COLUMN + 8) {
    int i = column - WARNING_COLUMN;
    color = RED;
    return i == 0 ? LETTER_F : i == 1 ? LETTER_A : i == 2 ? LETTER_I : i == 3 ? LETTER_L : i == 4 ? LETTER_S : i == 5 ? LETTER_A : i == 6 ? LETTER_F : LETTER_E;
  }
  // the air speed, bottom middle: its label, whole km/h and the unit
  if (row == 16 && column >= 20 && column <= 25) {
    if (column == 20) {
      color = PALE_BLUE;
      return AIR_SPEED;
    }
    return column == 25 ? KILOMETERS_PER_HOUR : numberAt(clamp(speed, 0.0, 999.0), false, column, 24);
  }
  return -1;
}

// 2 where the glyph is drawn, 1 on its black outline, 0 elsewhere; x and y in the cell's pixels.
// A row of the table holds the glyph in its low 12 bits and the outline in the 12 above, the
// leftmost pixel highest
float glyphInk(int glyph, int x, int y) {
  if (glyph < 0) {
    return 0.0;
  }
  int row = FONT[glyph * int(CELL_HEIGHT) + y] >> (int(CELL_WIDTH) - 1 - x);
  return (row & 1) == 1 ? 2.0 : ((row >> int(CELL_WIDTH)) & 1) == 1 ? 1.0 : 0.0;
}

// 2 inside the box, 1 on its outline a pixel around, 0 elsewhere; in pixels
float boxInk(vec2 p, vec2 low, vec2 high) {
  if (all(greaterThanEqual(p, low)) && all(lessThan(p, high))) {
    return 2.0;
  }
  return all(greaterThanEqual(p, low - 1.0)) && all(lessThan(p, high + 1.0)) ? 1.0 : 0.0;
}

// what is drawn over what is under it, its outline under what is drawn
void paint(inout float ink, inout vec3 fill, float layer, vec3 color) {
  if (layer > ink) {
    ink = layer;
    fill = color;
  }
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  // the grid as large as fits the screen, centered, from its top left, in pixels
  vec2 size = czm_viewport.zw;
  vec2 grid = vec2(COLUMNS * CELL_WIDTH, ROWS * CELL_HEIGHT);
  float scale = min(size.x / grid.x, size.y / grid.y);
  vec2 fromCorner = vec2(gl_FragCoord.x - czm_viewport.x, czm_viewport.y + size.y - gl_FragCoord.y) - 0.5 * (size - grid * scale);
  vec2 p = floor(fromCorner / scale);
  int column = int(floor(p.x / CELL_WIDTH));
  int row = int(floor(p.y / CELL_HEIGHT));
  if (column < 0 || column >= int(COLUMNS) || row < 0 || row >= int(ROWS)) {
    out_FragColor = sceneColor;
    return;
  }
  vec2 inCell = p - vec2(float(column) * CELL_WIDTH, float(row) * CELL_HEIGHT);

  vec3 glyphColor;
  int glyph = glyphAt(column, row, glyphColor);
  float ink = 0.0;
  vec3 fill = WHITE;
  paint(ink, fill, glyphInk(glyph, int(inCell.x), int(inCell.y)), glyphColor);

  // the horizon, as ArduPilot's draw_horizon in rows and columns from the middle cell, with the
  // pitch (positive nose down) raising it: a dot per column, at its height in the cell in ninths,
  // or past 45 degrees of roll a dot per row, at its place across the cell in ninths
  bool nearMiddle = abs(column - MIDDLE_COLUMN) <= 5 && abs(row - MIDDLE_ROW) <= 5;
  if (nearMiddle && (abs(roll) < 90.0 || blink > 0.5)) {
    float level = clamp(-pitch, -MAX_PITCH, MAX_PITCH) * ROWS_PER_DEGREE;
    float ky = sin(radians(roll));
    float kx = cos(radians(roll));
    bool steep = abs(ky) >= abs(kx);
    for (int k = -4; k <= 4; k++) {
      float along = steep ? (float(k) - level) / RATIO * kx / ky + 0.5 : RATIO * float(k) * ky / kx + level + 0.5;
      float cell = floor(along);
      float ninth = floor((along - cell) * 9.0);
      if (abs(cell) > 4.0) {
        continue;
      }
      vec2 center = steep
        ? vec2(float(MIDDLE_COLUMN) + cell, float(MIDDLE_ROW - k)) * vec2(CELL_WIDTH, CELL_HEIGHT) + vec2(2.0 + ninth, 9.0)
        : vec2(float(MIDDLE_COLUMN + k), float(MIDDLE_ROW) - cell) * vec2(CELL_WIDTH, CELL_HEIGHT) + vec2(6.0, 17.0 - 2.0 * ninth);
      float d = length(p + 0.5 - center);
      paint(ink, fill, d < 1.0 ? 2.0 : d < 2.0 ? 1.0 : 0.0, WHITE);
    }
  }

  // the link bar, top right: as long as the link quality, its color by it; full and red in
  // failsafe
  if (row == 1) {
    float quality = failsafe > 0.5 ? 99.0 : clamp(linkQuality, 0.0, 99.0);
    vec3 color = failsafe > 0.5 || quality < 40.0 ? RED : quality < 70.0 ? ORANGE : GREEN;
    float left = float(LINK_COLUMN) * CELL_WIDTH;
    float bar = floor(LINK_CELLS * CELL_WIDTH * (quality + 1.0) / 100.0);
    if (bar > 0.0) {
      paint(ink, fill, boxInk(p, vec2(left, CELL_HEIGHT + 7.0), vec2(left + bar, CELL_HEIGHT + 11.0)), color);
    }
  }

  // the battery symbol, top right before its voltage: a white frame with a cap, filled in green
  // from the bottom in steps as the voltage drops, black inside above the fill
  if (column == LINK_COLUMN && row == 2) {
    float charge = clamp((voltage - EMPTY_VOLTS) / (FULL_VOLTS - EMPTY_VOLTS), 0.0, 1.0);
    float fillTop = 17.0 - 13.0 * ceil(charge * BATTERY_STEPS) / BATTERY_STEPS;
    paint(ink, fill, max(boxInk(inCell, vec2(2.0, 3.0), vec2(10.0, 18.0)), boxInk(inCell, vec2(4.0, 1.0), vec2(8.0, 3.0))), WHITE);
    if (all(greaterThanEqual(inCell, vec2(3.0, 4.0))) && all(lessThan(inCell, vec2(9.0, 17.0)))) {
      ink = inCell.y >= fillTop ? 2.0 : 1.0;
      fill = GREEN;
    }
  }

  // the green dot inside the altitude's mountain
  if (glyph == ALTITUDE) {
    paint(ink, fill, all(greaterThanEqual(inCell, vec2(3.0, 4.0))) && all(lessThan(inCell, vec2(5.0, 6.0))) ? 2.0 : 0.0, GREEN);
  }

  vec3 color = ink == 2.0 ? fill : ink == 1.0 ? vec3(0.0) : sceneColor.rgb;
  out_FragColor = vec4(mix(sceneColor.rgb, color, ink > 0.0 ? opacity : 0.0), sceneColor.a);
}
`,C=12.6,w=2400,T=.4,E=70,D=5,O=.5,k=.5,A=class extends i{constructor(e,t={}){super(e),this.opacity_=t.opacity??1,this.rxLoss_=!1,this.startTime_=0,this.startHeight_=0,this.speed_=0,this.verticalSpeed_=0,this.previousPosition_=new n,this.previousHeight_=0,this.previousTime_=0,this.drained_=0,this.onPostRender_=()=>this.measure_(!1)}createStage_(t){return new r({fragmentShader:S,uniforms:{opacity:()=>this.opacity_,pitch:()=>e.toDegrees(t.camera.pitch),roll:()=>e.toDegrees(e.negativePiToPi(t.camera.roll)),heading:()=>e.toDegrees(t.camera.heading),altitude:()=>t.camera.positionCartographic.height-this.startHeight_,verticalSpeed:()=>this.verticalSpeed_,speed:()=>this.speed_*3.6,voltage:()=>this.voltage_(),linkQuality:()=>this.linkQuality_(),throttle:()=>this.throttle_(),failsafe:()=>+!!this.rxLoss_,blink:()=>+(Math.floor(performance.now()/250)%2==0)}})}activated_(e){this.startTime_=performance.now()/1e3,this.startHeight_=e.camera.positionCartographic.height,this.speed_=0,this.verticalSpeed_=0,this.drained_=0,this.measure_(!0),e.postRender.addEventListener(this.onPostRender_)}deactivating_(e){e.postRender.removeEventListener(this.onPostRender_)}measure_(e){let t=this.viewer.scene.camera,r=performance.now()/1e3,i=t.positionCartographic.height,a=r-this.previousTime_;if(!e&&a>0&&a<k){let e=1-Math.exp(-a/O);this.speed_+=(n.distance(t.positionWC,this.previousPosition_)/a-this.speed_)*e,this.verticalSpeed_+=((i-this.previousHeight_)/a-this.verticalSpeed_)*e}e||(this.drained_+=a/w*(this.throttle_()/E)),n.clone(t.positionWC,this.previousPosition_),this.previousHeight_=i,this.previousTime_=r}voltage_(){return C-2.0999999999999996*Math.min(this.drained_,1)-T*this.throttle_()/100}linkQuality_(){let e=performance.now()/1e3-this.startTime_,t=4*Math.abs(Math.sin(e*.9)*Math.sin(e*.37)),n=Math.sin(e*.11)>.97?35:0;return Math.round(99-t-n)}throttle_(){let t=performance.now()/1e3-this.startTime_,n=2*Math.sin(t*.3)*Math.sin(t*.13+1);return Math.round(e.clamp(E+D*this.verticalSpeed_+n,0,100))}get opacity(){return this.opacity_}set opacity(e){this.opacity_=e,this.viewer.scene.requestRender()}get rxLoss(){return this.rxLoss_}set rxLoss(e){this.rxLoss_=e,this.viewer.scene.requestRender()}},j=`// The jello of a vibrating camera with a rolling shutter: the sensor reads its rows one after
// another, so each row sees the camera at a different moment of its shake, and straight edges
// wobble. After Readout's readout pass (stoatworks-labs, MIT): row r of H is read
// \`readout * (1 - r / H)\` before the frame, the camera's pose is taken at the middle of the row's
// exposure, and the shake is a few sinusoids in x, y and rotation. The phases come from the CPU,
// in double precision; the picture is magnified by zoom so that its edges do not show.
precision highp sampler2D;
uniform sampler2D colorTexture;
// the shake: frequencies in Hz, phases at the frame's time in radians, amplitudes in picture
// heights (x, y) and radians (rotation)
uniform vec4 shakeHz;
uniform vec4 phaseX;
uniform vec4 phaseY;
uniform vec4 phaseRotation;
uniform vec4 amplitudeX;
uniform vec4 amplitudeY;
uniform vec4 amplitudeRotation;
uniform float zoom;
in vec2 v_textureCoordinates;

// seconds to read all the rows, top down, and to expose each
const float READOUT = 0.02;
const float EXPOSURE = 0.004;

void main() {
  vec2 size = czm_viewport.zw;
  // the row, from the top, and how long before the frame it was read, at the middle of its exposure
  float row = floor((1.0 - v_textureCoordinates.y) * size.y);
  float tau = READOUT * (1.0 - row / size.y) + 0.5 * EXPOSURE;
  vec4 arg = czm_twoPi * shakeHz * tau;
  vec2 shift = vec2(dot(amplitudeX, sin(phaseX - arg)), dot(amplitudeY, sin(phaseY - arg)));
  float rotation = dot(amplitudeRotation, sin(phaseRotation - arg));

  // centred, in picture heights, so that a rotation is not a shear
  float aspect = size.x / size.y;
  vec2 p = vec2((v_textureCoordinates.x - 0.5) * aspect, v_textureCoordinates.y - 0.5);
  float c = cos(rotation);
  float s = sin(rotation);
  p = (vec2(p.x * c - p.y * s, p.x * s + p.y * c) + shift) / zoom;
  out_FragColor = texture(colorTexture, vec2(p.x / aspect + 0.5, p.y + 0.5));
}
`,M=30,N=[1,1.37,2.11,3.07],P=[1,.6,.35,.2],F=P.reduce((e,t)=>e+t,0),I=.015,L=[I,.5*I,.008],R=e.TWO_PI,z=[`x`,`y`,`z`,`w`],B=class extends i{constructor(e,n={}){super(e),this.amount_=n.amount??.1,this.frequency_=n.frequency??30,this.offsets_=N.map(()=>[Math.random(),Math.random(),Math.random()].map(e=>e*R)),this.shakeHz_=new t,this.amplitudes_=[new t,new t,new t],this.zoom_=1,this.phases_=[new t,new t,new t],this.updateShape_(),this.onPreRender_=()=>{let e=performance.now()/1e3;N.forEach((t,n)=>{let r=R*(t*this.frequency_*e%1);this.phases_.forEach((e,t)=>{e[z[n]]=(r+this.offsets_[n][t])%R})})}}createStage_(){let e=new r({fragmentShader:j,uniforms:{shakeHz:()=>this.shakeHz_,phaseX:()=>this.phases_[0],phaseY:()=>this.phases_[1],phaseRotation:()=>this.phases_[2],amplitudeX:()=>this.amplitudes_[0],amplitudeY:()=>this.amplitudes_[1],amplitudeRotation:()=>this.amplitudes_[2],zoom:()=>this.zoom_}});return e.enabled=this.amount_>0,e}activated_(e){e.preRender.addEventListener(this.onPreRender_),this.amount_>0&&o(e,M)}deactivating_(e){this.amount_>0&&a(e,M),e.preRender.removeEventListener(this.onPreRender_)}updateShape_(){N.forEach((e,t)=>{this.shakeHz_[z[t]]=e*this.frequency_,this.amplitudes_.forEach((e,n)=>{e[z[t]]=P[t]*L[n]*this.amount_})}),this.zoom_=1+2*F*this.amount_*.023}get amount(){return this.amount_}set amount(e){let t=this.amount_>0;this.amount_=e,this.updateShape_(),this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?o:a)(this.viewer.scene,M)),this.viewer.scene.requestRender()}get frequency(){return this.frequency_}set frequency(e){this.frequency_=e,this.updateShape_()}};export{h as i,A as n,x as r,B as t};