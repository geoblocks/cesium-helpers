import{a as e,n as t,r as n,u as r}from"./lit-BFn1CURT.js";import{a as i,c as a,i as o,n as s,o as c,r as l,s as u,t as d}from"./card-BcpQSzF3.js";import{a as f,c as p,d as m,o as h,s as g}from"./directive-helpers-B0KETb9i.js";import{n as ee,r as te,t as ne}from"./directive-BSZPiF1A.js";import{a as _,i as v,w as y,y as b}from"./cesium-shim-deYMRcZt.js";import{n as re}from"./switch-PsQ7BZQb.js";import{t as ie}from"./button-CI_sKcZA.js";import{a as x,o as S}from"./motion-blur-H9Tf_aeZ.js";import{_ as C,a as w,c as ae,d as T,f as E,l as oe,m as D,n as se,o as O,p as k,s as A,t as j,u as ce}from"./slider-sLn6HB47.js";var M=new WeakMap;function N(e,t){clearInterval(t.interval),t.interval=t.rates.length>0?setInterval(()=>le(e,t),1e3/Math.max(...t.rates)):void 0}function le(e,t){if(e.isDestroyed()){clearInterval(t.interval),M.delete(e);return}e.requestRender()}function P(e,t){let n=M.get(e);n||(n={rates:[],interval:void 0},M.set(e,n)),n.rates.push(t),N(e,n)}function F(e,t){let n=M.get(e),r=n?n.rates.indexOf(t):-1;!n||r<0||(n.rates.splice(r,1),N(e,n),n.rates.length===0&&M.delete(e))}var ue=`// An analog FPV video feed: washed-out colors, color bleeding sideways (the signal carries the
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
`,I=25,de=.4,fe=3,pe=.07,me=2.5,L=e=>e-Math.floor(e);function R(e,t){let n=L(e*.1031),r=L(t*.1031),i=n,a=n*(r+33.33)+r*(i+33.33)+i*(n+33.33);return n+=a,r+=a,i+=a,L((n+r)*i)}function he(e,t,n){let r=e*de,i=L(r),a=t*(R(Math.floor(r),5)+(R(Math.floor(r)+1,5)-R(Math.floor(r),5))*i*i*(3-2*i)),o=+(R(Math.floor(e*I)%1e3,11)<.015*t),s=Array.from({length:fe},(n,r)=>{let i=r*7;return R(Math.floor(e/me+i),i)<t?1-L(e*pe*(1+.3*r)+R(i,1)):-1});return v.fromElements(s[0],s[1],s[2],n),{weak:a,breakup:o}}var ge=class extends S{constructor(e,t={}){super(e),this.noise_=t.noise??.5,this.interference_=t.interference??.15,this.weak_=0,this.breakup_=0,this.lineAt_=new v,this.onPreRender_=()=>{let e=he(performance.now()/1e3,this.interference_,this.lineAt_);this.weak_=e.weak,this.breakup_=e.breakup}}createStage_(){return new y({fragmentShader:x+ue,uniforms:{time:()=>performance.now()/1e3,noise:()=>this.noise_,interference:()=>this.interference_,weak:()=>this.weak_,breakup:()=>this.breakup_,lineAt:()=>this.lineAt_}})}activated_(e){e.preRender.addEventListener(this.onPreRender_),P(e,I)}deactivating_(e){F(e,I),e.preRender.removeEventListener(this.onPreRender_)}get noise(){return this.noise_}set noise(e){this.noise_=e}get interference(){return this.interference_}set interference(e){this.interference_=e}},_e=`// A digital FPV video feed and its breakups: clean, slightly punchy colors, until a weak signal
// breaks the picture into macroblocks, some displaced, strips shifted sideways and the color
// channels split, and at worst a short black screen. A block keeps only its lowest frequencies,
// as a codec that has thrown its detail away: a gradient between its corners, with fewer colors.
// The displaced blocks and strips follow three.js's DigitalGlitch. Without the previous frames,
// there are no freezes.
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
  rgb = mix(vec3(dot(rgb, vec3(0.299, 0.587, 0.114))), rgb, 1.1);
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
`,z=30,ve=2,B=[.4,1.5],ye=.25,be=class extends S{constructor(e,t={}){super(e),this.breakup_=t.breakup??.5,this.episode_=void 0,this.updated_=0,this.severity_=0,this.blackout_=0,this.onPreRender_=()=>this.update_()}createStage_(){return new y({fragmentShader:x+_e,uniforms:{severity:()=>this.severity_,blackout:()=>this.blackout_,frame:()=>Math.floor(performance.now()/1e3*z)%1e5}})}activated_(e){this.updated_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),P(e,z)}deactivating_(e){F(e,z),e.preRender.removeEventListener(this.onPreRender_),this.episode_=void 0}update_(){let e=performance.now()/1e3,t=Math.min(e-this.updated_,1);if(this.updated_=e,this.episode_&&e>this.episode_.start+this.episode_.duration&&(this.episode_=void 0),!this.episode_&&Math.random()<1-Math.exp(-this.breakup_/ve*t)){let t=B[0]+Math.random()*(B[1]-B[0]);this.episode_={start:e,duration:t,blackout:Math.random()<.5*this.breakup_}}let n=this.episode_;if(!n){this.severity_=0,this.blackout_=0;return}let r=(e-n.start)/n.duration;this.severity_=Math.max(0,Math.sin(Math.PI*Math.min(r,1)))**.7*(.4+.6*this.breakup_),this.blackout_=n.blackout&&Math.abs(r-.5)*n.duration<ye/2?1:0}get breakup(){return this.breakup_}set breakup(e){this.breakup_=e}},xe=`// A Betaflight analog OSD, as its MAX7456 chip draws it: 30 columns and 16 rows of 12 x 18
// character cells over the 4:3 picture of an analog feed, thin white glyphs with a black
// outline, blocky. The layout and the artificial horizon follow Betaflight's osd_elements.c, and
// the glyphs its default font's sizes; the glyphs are drawn here, not copied from the font.
// - The horizon: in each of the 9 columns around the middle, a dash 2 pixels wide at one of 9
//   heights in its cell; pitch (at most 20 degrees) and roll (at most 40) move it in ninths of a
//   row, and a dash that leaves the 9 rows around the middle is not drawn. It is a symbol, not
//   lined up with the real horizon.
// - The sidebars, 7 columns out, with level markers pointing in, and the reticle: Betaflight's
//   cross, a ring with ticks across 3 cells, or a custom glyph as operators upload, a V or a
//   heart.
// - The readouts: the battery symbol, filled in 7 steps, and its voltage; the altitude since the
//   display turned on; the link quality.
uniform sampler2D colorTexture;
// 0 to 1
uniform float opacity;
// degrees, negative looking down
uniform float pitch;
// degrees, positive to the right
uniform float roll;
// meters, since the display turned on
uniform float altitude;
// volts
uniform float voltage;
// 0 to 99
uniform float linkQuality;
// 0 for Betaflight's cross, 1 for a V, 2 for a heart
uniform float reticle;
in vec2 v_textureCoordinates;

const float COLUMNS = 30.0;
const float ROWS = 16.0;
// a cell, in the chip's pixels
const float CELL_WIDTH = 12.0;
const float CELL_HEIGHT = 18.0;
// the middle cell, where the cross and the horizon are
const int MIDDLE_COLUMN = 14;
const int MIDDLE_ROW = 7;
// Betaflight's limits of the horizon, in degrees (ah_max_pitch and ah_max_roll)
const float MAX_PITCH = 20.0;
const float MAX_ROLL = 40.0;
// sidebars: columns from the middle, and rows on either side
const int SIDEBAR_COLUMN = 7;
const int SIDEBAR_ROWS = 3;
// battery: volts full and empty, and the steps of its symbol's fill (full, 5 to 1, empty)
const float FULL_VOLTS = 16.8;
const float EMPTY_VOLTS = 14.0;
const float BATTERY_STEPS = 6.0;

// the glyphs, at the chip's 12 x 18 pixels: one row of 12 bits each, the leftmost bit highest;
// the table is written by scripts/osd-font.js from its pixel drawings
const int DOT = 10;
const int SPACE = 11;
const int MINUS = 12;
// the unit of the voltage, and of the altitude
const int VOLT = 13;
const int METER = 14;
// symbols before the altitude and the link quality
const int ALTITUDE = 15;
const int LINK_QUALITY = 16;
// the level markers, pointing right (on the left) and left (on the right)
const int MARKER_RIGHT = 17;
const int MARKER_LEFT = 18;
// the cross, over 3 cells
const int CROSS_LEFT = 19;
const int CROSS_MIDDLE = 20;
const int CROSS_RIGHT = 21;
// custom reticles
const int RETICLE_V = 22;
const int RETICLE_HEART = 23;
const int FONT[432] = int[432](
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
  0, 0, 0, 0, 0, 0, 2031616, 3506336, 2785616, 2785616, 2785616, 2785616, 2785616, 4161536, 0, 0, 0, 0, // m, meters
  0, 0, 0, 0, 0, 15659008, 12223559, 5954114, 1728066, 6019650, 5823090, 16773120, 0, 0, 0, 0, 0, 0, // ALT, the altitude
  0, 15695872, 11043952, 11174992, 11174992, 12092528, 9340688, 16482304, 0, 0, 57344, 237572, 958484, 3842132, 2793812, 4186112, 0, 0, // LQ over a wedge, the link quality
  0, 0, 0, 1835008, 1441920, 1769536, 884768, 442384, 213000, 442384, 884768, 1769536, 1441920, 1835008, 0, 0, 0, 0, // >, the left level marker
  0, 0, 0, 229376, 426000, 884768, 1769536, 3539072, 2883840, 3539072, 1769536, 884768, 426000, 229376, 0, 0, 0, 0, // <, the right level marker
  0, 0, 0, 0, 0, 0, 0, 258048, 135198, 258048, 0, 0, 0, 0, 0, 0, 0, 0, // the cross, left
  0, 0, 0, 0, 0, 983040, 1671264, 16183440, 3591315, 16183440, 1474704, 1671264, 983040, 0, 0, 0, 0, 0, // the cross, a ring in the middle
  0, 0, 0, 0, 0, 0, 0, 16515072, 8652672, 16515072, 0, 0, 0, 0, 0, 0, 0, 0, // the cross, right
  0, 0, 0, 0, 15790080, 5876229, 15692040, 3588240, 1671264, 983040, 0, 0, 0, 0, 0, 0, 0, 0, // a V with wings, a reticle
  0, 0, 0, 0, 0, 4177920, 6709656, 5874276, 6267396, 7299336, 3588240, 1671264, 983040, 0, 0, 0, 0, 0 // a heart, a reticle
);

int digit(float value, float power) {
  return int(mod(floor(value / power), 10.0));
}

// 10 to the n, exactly: pow may be off by a little on the GPU
float powerOfTen(int n) {
  return n == 3 ? 1000.0 : n == 2 ? 100.0 : n == 1 ? 10.0 : 1.0;
}

// the glyph in this cell, or -1
int glyphAt(int column, int row) {
  int offset = column - MIDDLE_COLUMN;
  // the reticle: the cross over 3 cells, or a custom glyph in the middle one; the level markers
  if (row == MIDDLE_ROW && abs(offset) <= 1) {
    if (reticle > 0.5) {
      return offset != 0 ? -1 : reticle > 1.5 ? RETICLE_HEART : RETICLE_V;
    }
    return offset < 0 ? CROSS_LEFT : offset == 0 ? CROSS_MIDDLE : CROSS_RIGHT;
  }
  if (row == MIDDLE_ROW && abs(offset) == SIDEBAR_COLUMN - 1) {
    return offset < 0 ? MARKER_RIGHT : MARKER_LEFT;
  }
  // battery voltage, bottom left after the battery symbol: 16.4v
  if (row == 14 && column >= 2 && column <= 6) {
    float volts = clamp(voltage, 10.0, 99.9);
    int i = column - 2;
    return i == 0 ? digit(volts, 10.0) : i == 1 ? digit(volts, 1.0) : i == 2 ? DOT : i == 3 ? digit(volts * 10.0, 1.0) : VOLT;
  }
  // link quality, bottom right: the symbol and two digits, a space for the tens under 10
  if (row == 14 && column >= 25 && column <= 27) {
    float quality = clamp(floor(linkQuality), 0.0, 99.0);
    int i = column - 25;
    return i == 0 ? LINK_QUALITY : i == 1 ? (quality < 10.0 ? SPACE : digit(quality, 10.0)) : digit(quality, 1.0);
  }
  // altitude, right of the sidebar: the symbol, then whole meters, -12m
  if (row == MIDDLE_ROW && column >= MIDDLE_COLUMN + SIDEBAR_COLUMN + 2) {
    float meters = floor(clamp(altitude, -999.0, 9999.0) + 0.5);
    float size = abs(meters);
    int digits = size >= 1000.0 ? 4 : size >= 100.0 ? 3 : size >= 10.0 ? 2 : 1;
    int i = column - (MIDDLE_COLUMN + SIDEBAR_COLUMN + 2);
    if (i == 0) {
      return ALTITUDE;
    }
    i--;
    if (meters < 0.0) {
      if (i == 0) {
        return MINUS;
      }
      i--;
    }
    return i < digits ? digit(size, powerOfTen(digits - 1 - i)) : i == digits ? METER : -1;
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

// 2 inside the box, 1 on its outline a pixel around, 0 elsewhere; in the chip's pixels
float boxInk(vec2 p, vec2 low, vec2 high) {
  if (all(greaterThanEqual(p, low)) && all(lessThan(p, high))) {
    return 2.0;
  }
  return all(greaterThanEqual(p, low - 1.0)) && all(lessThan(p, high + 1.0)) ? 1.0 : 0.0;
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  // the grid over a 4:3 picture as high as the screen, from its top left, in the chip's pixels
  vec2 size = czm_viewport.zw;
  vec2 cell = vec2(size.y * 4.0 / 3.0 / COLUMNS, size.y / ROWS);
  vec2 fromCorner = vec2(gl_FragCoord.x - czm_viewport.x - 0.5 * (size.x - COLUMNS * cell.x), czm_viewport.y + size.y - gl_FragCoord.y);
  vec2 p = floor(fromCorner / cell * vec2(CELL_WIDTH, CELL_HEIGHT));
  int column = int(floor(p.x / CELL_WIDTH));
  int row = int(floor(p.y / CELL_HEIGHT));
  if (column < 0 || column >= int(COLUMNS) || row < 0 || row >= int(ROWS)) {
    out_FragColor = sceneColor;
    return;
  }
  vec2 inCell = p - vec2(float(column) * CELL_WIDTH, float(row) * CELL_HEIGHT);
  int offset = column - MIDDLE_COLUMN;

  float ink = glyphInk(glyphAt(column, row), int(inCell.x), int(inCell.y));

  // the horizon, with Betaflight's arithmetic in tenths of a degree and ninths of a row: the
  // pitch (positive nose down) moves it by 25 ninths at its limit, the roll by a ninth per 6.4
  // tenths and column, and 41 ninths down from the top of its 9 rows is level; each ninth is 2
  // pixels lower in the cell
  if (abs(offset) <= 4) {
    float pitchNinths = trunc(clamp(-pitch * 10.0, -MAX_PITCH * 10.0, MAX_PITCH * 10.0) * 25.0 / (MAX_PITCH * 10.0));
    float rollTenths = clamp(roll * 10.0, -MAX_ROLL * 10.0, MAX_ROLL * 10.0);
    float y = trunc(-rollTenths * float(offset) / 64.0) - (pitchNinths - 41.0);
    if (y >= 0.0 && y <= 81.0) {
      float top = float(MIDDLE_ROW - 4) * CELL_HEIGHT + floor(y / 9.0) * CELL_HEIGHT + 2.0 * mod(y, 9.0);
      float left = float(column) * CELL_WIDTH + 5.0;
      ink = max(ink, boxInk(p, vec2(left, top), vec2(left + 2.0, top + 1.0)));
    }
  }

  // the sidebars: a short tick in the middle of each cell of their column
  if (abs(offset) == SIDEBAR_COLUMN && abs(row - MIDDLE_ROW) <= SIDEBAR_ROWS) {
    ink = max(ink, boxInk(inCell, vec2(4.0, 8.0), vec2(8.0, 9.0)));
  }

  // the battery symbol, bottom left: a white frame with a cap, filled from the bottom in steps as
  // the voltage drops, black inside above the fill
  if (column == 1 && row == 14) {
    float charge = clamp((voltage - EMPTY_VOLTS) / (FULL_VOLTS - EMPTY_VOLTS), 0.0, 1.0);
    float fillTop = 17.0 - 13.0 * ceil(charge * BATTERY_STEPS) / BATTERY_STEPS;
    float symbol = max(boxInk(inCell, vec2(2.0, 3.0), vec2(10.0, 18.0)), boxInk(inCell, vec2(4.0, 1.0), vec2(8.0, 3.0)));
    if (all(greaterThanEqual(inCell, vec2(3.0, 4.0))) && all(lessThan(inCell, vec2(9.0, 17.0)))) {
      symbol = inCell.y >= fillTop ? 2.0 : 1.0;
    }
    ink = max(ink, symbol);
  }

  vec3 color = ink == 2.0 ? vec3(1.0) : ink == 1.0 ? vec3(0.0) : sceneColor.rgb;
  out_FragColor = vec4(mix(sceneColor.rgb, color, ink > 0.0 ? opacity : 0.0), sceneColor.a);
}
`,Se=16.8,Ce=600,we=[`ring`,`v`,`heart`],Te=class extends S{constructor(e,t={}){super(e),this.opacity_=t.opacity??1,this.reticle_=t.reticle??`v`,this.startTime_=0,this.startHeight_=0}createStage_(e){return new y({fragmentShader:xe,uniforms:{opacity:()=>this.opacity_,pitch:()=>b.toDegrees(e.camera.pitch),roll:()=>b.toDegrees(b.negativePiToPi(e.camera.roll)),altitude:()=>e.camera.positionCartographic.height-this.startHeight_,voltage:()=>this.voltage_(),linkQuality:()=>this.linkQuality_(),reticle:()=>Math.max(we.indexOf(this.reticle_),0)}})}activated_(e){this.startTime_=performance.now()/1e3,this.startHeight_=e.camera.positionCartographic.height}voltage_(){let e=performance.now()/1e3-this.startTime_,t=2.8000000000000007*Math.min(e/Ce,1),n=.1*Math.max(0,Math.sin(e*.7)*Math.sin(e*.23));return Se-t-n}linkQuality_(){let e=performance.now()/1e3-this.startTime_,t=4*Math.abs(Math.sin(e*.9)*Math.sin(e*.37)),n=Math.sin(e*.11)>.97?35:0;return Math.round(99-t-n)}get opacity(){return this.opacity_}set opacity(e){this.opacity_=e,this.viewer.scene.requestRender()}get reticle(){return this.reticle_}set reticle(e){this.reticle_=e,this.viewer.scene.requestRender()}},Ee=`// The jello of a vibrating camera with a rolling shutter: the sensor reads its rows one after
// another, so each row sees the camera at a different moment of its shake, and straight edges
// wobble. After Readout's readout pass (stoatworks-labs, MIT): row r of H is read
// \`readout * (1 - r / H)\` before the frame, the camera's pose is taken at the middle of the row's
// exposure, and the shake is a few sinusoids in x, y and rotation. The phases come from the CPU,
// in double precision; the picture is magnified by zoom so that its edges do not show.
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
`,V=30,H=[1,1.37,2.11,3.07],U=[1,.6,.35,.2],De=U.reduce((e,t)=>e+t,0),W=.015,Oe=[W,.5*W,.008],G=2*Math.PI,K=[`x`,`y`,`z`,`w`],ke=class extends S{constructor(e,t={}){super(e),this.amount_=t.amount??.1,this.frequency_=t.frequency??30,this.offsets_=H.map(()=>[Math.random(),Math.random(),Math.random()].map(e=>e*G)),this.shakeHz_=new _,this.amplitudes_=[new _,new _,new _],this.zoom_=1,this.phases_=[new _,new _,new _],this.updateShape_(),this.onPreRender_=()=>{let e=performance.now()/1e3;H.forEach((t,n)=>{let r=G*(t*this.frequency_*e%1);this.phases_.forEach((e,t)=>{e[K[n]]=(r+this.offsets_[n][t])%G})})}}createStage_(){let e=new y({fragmentShader:Ee,uniforms:{shakeHz:()=>this.shakeHz_,phaseX:()=>this.phases_[0],phaseY:()=>this.phases_[1],phaseRotation:()=>this.phases_[2],amplitudeX:()=>this.amplitudes_[0],amplitudeY:()=>this.amplitudes_[1],amplitudeRotation:()=>this.amplitudes_[2],zoom:()=>this.zoom_}});return e.enabled=this.amount_>0,e}activated_(e){e.preRender.addEventListener(this.onPreRender_),this.amount_>0&&P(e,V)}deactivating_(e){this.amount_>0&&F(e,V),e.preRender.removeEventListener(this.onPreRender_)}updateShape_(){H.forEach((e,t)=>{this.shakeHz_[K[t]]=e*this.frequency_,this.amplitudes_.forEach((e,n)=>{e[K[t]]=U[t]*Oe[n]*this.amount_})}),this.zoom_=1+2*De*this.amount_*.023}get amount(){return this.amount_}set amount(e){let t=this.amount_>0;this.amount_=e,this.updateShape_(),this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?P:F)(this.viewer.scene,V)),this.viewer.scene.requestRender()}get frequency(){return this.frequency_}set frequency(e){this.frequency_=e,this.updateShape_()}},Ae=r`
  :host {
    --tag-max-size: 10ch;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);
  }

  /* Add ellipses to multi select options */
  :host wa-tag::part(content) {
    display: initial;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: var(--tag-max-size);
  }

  :host .disabled [part~='combobox'] {
    opacity: 0.5;
    cursor: not-allowed;
    outline: none;
  }

  :host .enabled:is(.open, :focus-within) [part~='combobox'] {
    outline-color: var(--wa-color-focus);
  }

  /** The popup */
  .select {
    flex: 1 1 auto;
    display: inline-flex;
    width: 100%;
    position: relative;
    vertical-align: middle;

    /* Pass through from select to the popup */
    --show-duration: inherit;
    --hide-duration: inherit;

    &::part(popup) {
      z-index: 900;
    }

    &[data-current-placement^='top']::part(popup) {
      transform-origin: bottom;
    }

    &[data-current-placement^='bottom']::part(popup) {
      transform-origin: top;
    }
  }

  /* Combobox */
  .combobox {
    flex: 1;
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: start;

    min-height: var(--wa-form-control-height);

    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
    border-radius: var(--wa-form-control-border-radius);
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
    color: var(--wa-form-control-value-color);
    cursor: pointer;
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    overflow: hidden;
    padding: 0 var(--wa-form-control-padding-inline);
    position: relative;
    vertical-align: middle;
    transition:
      background-color var(--wa-transition-normal),
      border-color var(--wa-transition-normal),
      outline-color var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);
    outline: var(--wa-focus-ring-style) var(--wa-focus-ring-width) transparent;
    outline-offset: var(--wa-focus-ring-offset);

    /* Pills */
    :host([pill]) & {
      border-radius: var(--wa-border-radius-pill);
    }
  }

  /* Appearance modifiers */
  :host([appearance='outlined']) .combobox {
    background-color: var(--wa-form-control-background-color);
    border-color: var(--wa-form-control-border-color);
  }

  :host([appearance='filled']) .combobox {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-fill-quiet);
  }

  :host([appearance='filled-outlined']) .combobox {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-form-control-border-color);
  }

  .display-input {
    position: relative;
    width: 100%;
    font: inherit;
    border: none;
    background: none;
    line-height: var(--wa-form-control-value-line-height);
    color: var(--wa-form-control-value-color);
    cursor: inherit;
    overflow: hidden;
    padding: 0;
    margin: 0;
    -webkit-appearance: none;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--wa-form-control-placeholder-color);
    }
  }

  /* Manage spacing when tags are present */
  :host([multiple]) {
    --_padding-with-tags: calc(var(--wa-form-control-height) * 0.1 - var(--wa-form-control-border-width));

    & .combobox:has(.tags wa-tag) {
      padding-block: var(--_padding-with-tags);
      padding-inline-start: var(--_padding-with-tags);
    }
  }

  /* Visually hide the display input when multiple is enabled */
  :host([multiple]) .combobox:has(.tags wa-tag) .display-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  .value-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    padding: 0;
    margin: 0;
  }

  .tags {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25em;

    /* Nested inside the box, so a step down from the box's radius */
    & wa-tag:not([pill]) {
      border-radius: var(--wa-border-radius-s);
    }

    .disabled & {
      cursor: not-allowed !important;
    }
  }

  /* Start and End */

  .start,
  .end {
    flex: 0;
    display: inline-flex;
    align-items: center;
    color: var(--wa-color-neutral-on-quiet);
  }

  .end::slotted(*) {
    margin-inline-start: var(--wa-form-control-padding-inline);
  }

  .start::slotted(*) {
    margin-inline-end: var(--wa-form-control-padding-inline);
  }

  :host([multiple]) .combobox:has(.tags wa-tag) .start::slotted(*) {
    margin-inline-start: calc(var(--wa-form-control-padding-inline) - var(--_padding-with-tags));
  }

  /* Clear button */
  [part~='clear-button'] {
    flex: 0 0 auto;
    display: inline-flex;
    align-self: stretch;
    align-items: center;
    justify-content: center;
    inline-size: 1.5em;
    font-size: inherit;
    color: var(--wa-color-neutral-on-quiet);
    border: none;
    background: none;
    padding: 0;
    transition: color var(--wa-transition-normal);
    cursor: pointer;
    /* The box is wider than the glyph, so overhang half that growth on each side. Keeps the glyph
       on the same trailing axis as the segmented-field pickers' clear buttons. */
    margin-inline-start: calc(var(--wa-form-control-padding-inline) - 0.125em);
    margin-inline-end: -0.125em;

    &:focus {
      outline: none;
    }

    @media (hover: hover) {
      &:hover {
        color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
      }
    }

    &:active {
      color: color-mix(in oklab, currentColor, var(--wa-color-mix-active));
    }
  }

  /* Expand icon */
  .expand-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-neutral-on-quiet);
    transition: rotate var(--wa-transition-slow) var(--wa-transition-easing);
    rotate: 0deg;
    margin-inline-start: var(--wa-form-control-padding-inline);

    .open & {
      rotate: -180deg;
    }
  }

  /* Listbox */
  .listbox {
    display: block;
    position: relative;
    font: inherit;
    box-shadow: var(--wa-shadow-m);
    background: var(--wa-color-surface-raised);
    border-color: var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    border-style: var(--wa-border-style);
    border-width: var(--wa-border-width-s);
    padding: 0.25em;
    overflow: auto;
    overscroll-behavior: none;

    /* Make sure it adheres to the popup's auto size */
    max-width: var(--auto-size-available-width);
    max-height: var(--auto-size-available-height);

    &::slotted(wa-divider) {
      --spacing: 0.5em;
    }
  }

  /* Space options with half the listbox's padding */
  .listbox slot:not([name]) {
    display: flex;
    flex-direction: column;
    gap: 0.125em;
  }

  slot:not([name])::slotted(small) {
    display: block;
    font-size: var(--wa-font-size-smaller);
    font-weight: var(--wa-font-weight-semibold);
    color: var(--wa-color-text-quiet);
    padding-block: 0.5em;
    padding-inline: 2.25em;
  }
`,je=class extends Event{constructor(){super(`wa-clear`,{bubbles:!0,cancelable:!1,composed:!0})}},q=class extends ee{constructor(e){if(super(e),this.it=t,e.type!==te.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===t||e==null)return this._t=void 0,this.it=e;if(e===n)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let r=[e];return r.raw=r,this._t={_$litType$:this.constructor.resultType,strings:r,values:[]}}};q.directiveName=`unsafeHTML`,q.resultType=1;var J=ne(q),Y=class extends p{constructor(){super(...arguments),this.assumeInteractionOn=[`blur`,`input`],this.cachedOptions=null,this.hasSlotController=new a(this,`hint`,`label`),this.localize=new f(this),this.selectionOrder=new Map,this.typeToSelectString=``,this.slotChangePending=!1,this.displayLabel=``,this.selectedOptions=[],this.name=``,this._defaultValue=null,this.size=`m`,this.placeholder=``,this.multiple=!1,this.maxOptionsVisible=3,this.disabled=!1,this.withClear=!1,this.open=!1,this.appearance=`outlined`,this.pill=!1,this.label=``,this.placement=`bottom`,this.hint=``,this.withLabel=!1,this.withHint=!1,this.required=!1,this.getTag=t=>e`
        <wa-tag
          part="tag"
          exportparts="
            base:tag__base,
            content:tag__content,
            remove-button:tag__remove-button,
            remove-button__base:tag__remove-button__base
          "
          ?pill=${this.pill}
          size=${this.size}
          with-remove
          data-value=${t.value}
          @wa-remove=${e=>this.handleTagRemove(e,t)}
        >
          ${t.label}
        </wa-tag>
      `,this.handleDocumentFocusIn=e=>{let t=e.composedPath();this&&!t.includes(this)&&this.hide()},this.handleDocumentKeyDown=e=>{let t=e.target,n=t.closest(`[part~="clear-button"]`)!==null,r=t.closest(`wa-button`)!==null;if(!(n||r)){if(e.key===`Escape`&&this.open&&ae(this)&&(e.preventDefault(),e.stopPropagation(),this.hide(),this.displayInput.focus({preventScroll:!0})),e.key===`Enter`||e.key===` `&&this.typeToSelectString===``){if(e.preventDefault(),e.stopImmediatePropagation(),!this.open){this.show();return}this.currentOption&&!this.currentOption.disabled&&(this.valueHasChanged=!0,this.hasInteracted=!0,this.multiple?this.toggleOptionSelection(this.currentOption):this.setSelectedOptions(this.currentOption),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})));return}if([`ArrowUp`,`ArrowDown`,`Home`,`End`].includes(e.key)){let t=this.getAllOptions(),n=t.indexOf(this.currentOption),r=Math.max(0,n);if(e.preventDefault(),!this.open&&(this.show(),this.currentOption))return;e.key===`ArrowDown`?(r=n+1,r>t.length-1&&(r=0)):e.key===`ArrowUp`?(r=n-1,r<0&&(r=t.length-1)):e.key===`Home`?r=0:e.key===`End`&&(r=t.length-1),this.setCurrentOption(t[r])}if(e.key?.length===1||e.key===`Backspace`){let t=this.getAllOptions();if(e.metaKey||e.ctrlKey||e.altKey)return;if(!this.open){if(e.key===`Backspace`)return;this.show()}e.stopPropagation(),e.preventDefault(),clearTimeout(this.typeToSelectTimeout),this.typeToSelectTimeout=window.setTimeout(()=>this.typeToSelectString=``,1e3),e.key===`Backspace`?this.typeToSelectString=this.typeToSelectString.slice(0,-1):this.typeToSelectString+=e.key.toLowerCase();for(let e of t)if(e.label.toLowerCase().startsWith(this.typeToSelectString)){this.setCurrentOption(e);break}}}},this.handleDocumentMouseDown=e=>{let t=e.composedPath();this&&!t.includes(this)&&this.hide()}}static get validators(){let e=[se({validationElement:Object.assign(document.createElement(`select`),{required:!0})})];return[...super.validators,...e]}get validationTarget(){return this.valueInput}set defaultValue(e){this._defaultValue=this.convertDefaultValue(e)}get defaultValue(){return this.convertDefaultValue(this._defaultValue)}rawValuesEqual(e,t){return e==null&&t==null?!0:e==null||t==null||e.length!==t.length?!1:e.every((e,n)=>e===t[n])}convertDefaultValue(e){return!(this.multiple||this.hasAttribute(`multiple`))&&Array.isArray(e)&&(e=e[0]),e}set value(e){let t=this.value;e instanceof FormData&&(e=e.getAll(this.name)),e!=null&&!Array.isArray(e)&&(e=[e]);let n=this._value;this._value=e??null,this.rawValuesEqual(n,this._value)||(this.valueHasChanged=!0,this.requestUpdate(`value`,t))}get value(){let e=this._value??this.defaultValue??null;e!=null&&(e=Array.isArray(e)?e:[e]),this.optionValues=new Set(this.getAllOptions().filter(e=>!e.disabled).map(e=>e.value));let t=e;return e!=null&&(t=e.filter(e=>this.optionValues.has(e)),t=this.multiple?t:t[0],t??=null),t}handleSizeChange(){g(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.processSlotChange(),this.open=!1}disconnectedCallback(){super.disconnectedCallback(),this.removeOpenListeners(),this.cachedOptions=null}updateDefaultValue(){let e=this.getAllOptions().filter(e=>e.hasAttribute(`selected`)||e.defaultSelected);if(e.length>0){let t=e.map(e=>e.value);this._defaultValue=this.multiple?t:t[0]}this.hasAttribute(`value`)&&(this._defaultValue=this.getAttribute(`value`)||null)}addOpenListeners(){document.addEventListener(`focusin`,this.handleDocumentFocusIn),document.addEventListener(`keydown`,this.handleDocumentKeyDown),document.addEventListener(`mousedown`,this.handleDocumentMouseDown),oe(this),this.getRootNode()!==document&&this.getRootNode().addEventListener(`focusin`,this.handleDocumentFocusIn)}removeOpenListeners(){document.removeEventListener(`focusin`,this.handleDocumentFocusIn),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`mousedown`,this.handleDocumentMouseDown),ce(this),this.getRootNode()!==document&&this.getRootNode().removeEventListener(`focusin`,this.handleDocumentFocusIn)}handleFocus(){this.displayInput.setSelectionRange(0,0)}handleLabelClick(){this.displayInput.focus()}handleComboboxClick(e){e.preventDefault()}handleComboboxMouseDown(e){let t=e.composedPath().some(e=>e instanceof Element&&e.tagName.toLowerCase()===`wa-button`);this.disabled||t||(e.preventDefault(),this.displayInput.focus({preventScroll:!0}),this.open=!this.open)}handleComboboxKeyDown(e){e.stopPropagation(),this.handleDocumentKeyDown(e)}handleClearClick(e){e.stopPropagation(),this.hasInteracted=!0,this.valueHasChanged=!0,this.value!==null&&(this.displayLabel=``,this.selectionOrder.clear(),this.setSelectedOptions([]),this.displayInput.focus({preventScroll:!0}),this.updateComplete.then(()=>{this.dispatchEvent(new je),this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}))}handleClearMouseDown(e){e.stopPropagation(),e.preventDefault()}handleOptionClick(e){let t=e.target.closest(`wa-option`);t&&!t.disabled&&(this.hasInteracted=!0,this.valueHasChanged=!0,this.multiple?this.toggleOptionSelection(t):this.setSelectedOptions(t),this.updateComplete.then(()=>this.displayInput.focus({preventScroll:!0})),this.requestUpdate(`value`),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})))}handleDefaultSlotChange(){this.slotChangePending||(this.slotChangePending=!0,queueMicrotask(()=>{this.slotChangePending=!1,this.processSlotChange()}))}processSlotChange(){if(customElements.get(`wa-option`)||customElements.whenDefined(`wa-option`).then(()=>this.handleDefaultSlotChange()),this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleDefaultSlotChange()});return}this.cachedOptions=null;let e=this.getAllOptions();this.updateDefaultValue();let t=this.value;if(t==null||!this.valueHasChanged&&!this.hasInteracted){this.selectionChanged();return}Array.isArray(t)||(t=[t]);let n=e.filter(e=>t.includes(e.value));this.setSelectedOptions(n)}handleTagRemove(e,t){if(e.stopPropagation(),this.disabled)return;this.hasInteracted=!0,this.valueHasChanged=!0;let n=t;if(!n){let t=e.target.closest(`wa-tag[data-value]`);if(t){let e=t.dataset.value;n=this.selectedOptions.find(t=>t.value===e)}}n&&(this.toggleOptionSelection(n,!1),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}))}getAllOptions(){return this.cachedOptions?this.cachedOptions:this?.querySelectorAll?(this.cachedOptions=[...this.querySelectorAll(`wa-option`)],this.cachedOptions):[]}getFirstOption(){return this.querySelector(`wa-option`)}setCurrentOption(e){this.getAllOptions().forEach(e=>{e.current=!1,e.tabIndex=-1}),e&&(this.currentOption=e,e.current=!0,e.tabIndex=0,e.focus({preventScroll:!0}),this.open&&!this.listbox.hidden&&C(e,this.listbox,`vertical`,`auto`))}setSelectedOptions(e){let t=this.getAllOptions(),n=Array.isArray(e)?e:[e];t.forEach(e=>{n.includes(e)||(e.selected=!1)}),n.length&&n.forEach(e=>e.selected=!0),this.selectionChanged()}toggleOptionSelection(e,t){e.selected=t===!0||t===!1?t:!e.selected,this.selectionChanged()}selectionChanged(){let e=this.getAllOptions().filter(e=>{if(!this.hasInteracted&&!this.valueHasChanged){let t=this.defaultValue,n=Array.isArray(t)?t:[t];return e.hasAttribute(`selected`)||e.defaultSelected||e.selected||n?.includes(e.value)}return e.selected}),t=new Set(e.map(e=>e.value));for(let e of this.selectionOrder.keys())t.has(e)||this.selectionOrder.delete(e);let n=(this.selectionOrder.size>0?Math.max(...this.selectionOrder.values()):-1)+1;for(let t of e)this.selectionOrder.has(t.value)||this.selectionOrder.set(t.value,n++);this.selectedOptions=e.sort((e,t)=>(this.selectionOrder.get(e.value)??0)-(this.selectionOrder.get(t.value)??0));let r=new Set(this.selectedOptions.map(e=>e.value));if(r.size>0||this._value){let e=this._value;if(this._value==null){let e=this.defaultValue??[];this._value=Array.isArray(e)?e:[e]}this._value=this._value?.filter(e=>!this.optionValues?.has(e))??null,this._value?.unshift(...r),this.requestUpdate(`value`,e)}if(this.multiple)this.displayLabel=this.placeholder&&!this.value?.length?``:this.localize.term(`numOptionsSelected`,this.selectedOptions.length);else{let e=this.selectedOptions[0];this.displayLabel=e?.label??``}this.updateComplete.then(()=>{this.updateValidity()})}get tags(){return this.selectedOptions.map((t,n)=>{if(n<this.maxOptionsVisible||this.maxOptionsVisible<=0){let e=this.getTag(t,n);return e?typeof e==`string`?J(e):e:null}return n===this.maxOptionsVisible?e`
          <wa-tag
            part="tag"
            exportparts="
              base:tag__base,
              content:tag__content,
              remove-button:tag__remove-button,
              remove-button__base:tag__remove-button__base
            "
            ?pill=${this.pill}
            size=${this.size}
            >+${this.selectedOptions.length-n}</wa-tag
          >
        `:null})}updated(e){super.updated(e),(e.has(`value`)||e.has(`displayLabel`))&&this.customStates.set(`blank`,!this.value&&!this.displayLabel)}handleDisabledChange(){this.disabled&&this.open&&(this.open=!1)}handleValueChange(){let e=this.getAllOptions(),t=Array.isArray(this.value)?this.value:[this.value],n=e.filter(e=>t.includes(e.value));this.setSelectedOptions(n),this.updateValidity()}async handleOpenChange(){if(this.open&&!this.disabled){this.setCurrentOption(this.selectedOptions[0]||this.getFirstOption());let e=new D;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.listbox.hidden=!1,this.popup.active=!0,requestAnimationFrame(()=>{this.setCurrentOption(this.currentOption)}),await O(this.popup.popup,`show`),this.currentOption&&C(this.currentOption,this.listbox,`vertical`,`auto`),this.dispatchEvent(new T)}else{let e=new k;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.removeOpenListeners(),await O(this.popup.popup,`hide`),this.listbox.hidden=!0,this.popup.active=!1,this.dispatchEvent(new E)}}async show(){if(this.open||this.disabled){this.open=!1;return}return this.open=!0,j(this,`wa-after-show`)}async hide(){if(!this.open||this.disabled){this.open=!1;return}return this.open=!1,j(this,`wa-after-hide`)}focus(e){this.displayInput.focus(e)}blur(){this.displayInput.blur()}formResetCallback(){this.selectionOrder.clear(),this.value=this.defaultValue,super.formResetCallback(),this.handleValueChange(),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n,a=(this.hasUpdated||!1)&&this.withClear&&!this.disabled&&(this.displayLabel||this.value&&this.value.length>0);return e`
      <div
        part="form-control"
        class=${d({"form-control":!0,"form-control-has-label":r})}
      >
        <label
          id="label"
          part="form-control-label label"
          class=${d({label:!0,"has-label":r})}
          aria-hidden=${r?`false`:`true`}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <wa-popup
            class=${d({select:!0,open:this.open,disabled:this.disabled,enabled:!this.disabled,multiple:this.multiple})}
            placement=${this.placement}
            flip
            shift
            sync="width"
            auto-size="vertical"
            auto-size-padding="10"
          >
            <div
              part="combobox"
              class="combobox"
              slot="anchor"
              @keydown=${this.handleComboboxKeyDown}
              @mousedown=${this.handleComboboxMouseDown}
              @click=${this.handleComboboxClick}
            >
              <slot part="start" name="start" class="start"></slot>

              <input
                part="display-input"
                class="display-input"
                type="text"
                placeholder=${this.placeholder}
                .disabled=${this.disabled}
                .value=${this.displayLabel}
                ?required=${this.required}
                autocomplete="off"
                spellcheck="false"
                autocapitalize="off"
                readonly
                aria-invalid=${!this.validity.valid}
                aria-controls="listbox"
                aria-expanded=${this.open?`true`:`false`}
                aria-haspopup="listbox"
                aria-labelledby="label"
                aria-disabled=${this.disabled?`true`:`false`}
                aria-describedby="hint"
                role="combobox"
                tabindex="0"
                @focus=${this.handleFocus}
              />

              <!-- Tags need to wait for first hydration before populating otherwise it will create a hydration mismatch. -->
              ${this.multiple&&this.hasUpdated?e`<div part="tags" class="tags" @wa-remove=${this.handleTagRemove}>${this.tags}</div>`:``}

              <input
                class="value-input"
                type="text"
                ?disabled=${this.disabled}
                ?required=${this.required}
                .value=${Array.isArray(this.value)?this.value.join(`, `):this.value}
                tabindex="-1"
                aria-hidden="true"
                @focus=${()=>this.focus()}
              />

              ${a?e`
                    <button
                      part="clear-button"
                      type="button"
                      aria-label=${this.localize.term(`clearEntry`)}
                      @mousedown=${this.handleClearMouseDown}
                      @click=${this.handleClearClick}
                      tabindex="-1"
                    >
                      <slot name="clear-icon">
                        <wa-icon name="circle-xmark" library="system" variant="regular"></wa-icon>
                      </slot>
                    </button>
                  `:``}

              <slot name="end" part="end" class="end"></slot>

              <slot name="expand-icon" part="expand-icon" class="expand-icon">
                <wa-icon library="system" name="chevron-down" variant="solid"></wa-icon>
              </slot>
            </div>

            <div
              id="listbox"
              role="listbox"
              aria-expanded=${this.open?`true`:`false`}
              aria-multiselectable=${this.multiple?`true`:`false`}
              aria-labelledby="label"
              part="listbox"
              class="listbox"
              tabindex="-1"
              @mouseup=${this.handleOptionClick}
            >
              <slot @slotchange=${this.handleDefaultSlotChange}></slot>
            </div>
          </wa-popup>
        </div>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${d({"has-slotted":i})}
          aria-hidden=${i?`false`:`true`}
          >${this.hint}</slot
        >
      </div>
    `}};Y.css=[Ae,re,u],c([m(`.select`)],Y.prototype,`popup`,2),c([m(`.combobox`)],Y.prototype,`combobox`,2),c([m(`.display-input`)],Y.prototype,`displayInput`,2),c([m(`.value-input`)],Y.prototype,`valueInput`,2),c([m(`.listbox`)],Y.prototype,`listbox`,2),c([l()],Y.prototype,`displayLabel`,2),c([l()],Y.prototype,`currentOption`,2),c([l()],Y.prototype,`selectedOptions`,2),c([o({reflect:!0})],Y.prototype,`name`,2),c([o({attribute:!1})],Y.prototype,`defaultValue`,1),c([o({attribute:`value`,reflect:!1})],Y.prototype,`value`,1),c([o({reflect:!0})],Y.prototype,`size`,2),c([h(`size`)],Y.prototype,`handleSizeChange`,1),c([o()],Y.prototype,`placeholder`,2),c([o({type:Boolean,reflect:!0})],Y.prototype,`multiple`,2),c([o({attribute:`max-options-visible`,type:Number})],Y.prototype,`maxOptionsVisible`,2),c([o({type:Boolean})],Y.prototype,`disabled`,2),c([o({attribute:`with-clear`,type:Boolean})],Y.prototype,`withClear`,2),c([o({type:Boolean,reflect:!0})],Y.prototype,`open`,2),c([o({reflect:!0})],Y.prototype,`appearance`,2),c([o({type:Boolean,reflect:!0})],Y.prototype,`pill`,2),c([o()],Y.prototype,`label`,2),c([o({reflect:!0})],Y.prototype,`placement`,2),c([o({attribute:`hint`})],Y.prototype,`hint`,2),c([o({attribute:`with-label`,type:Boolean})],Y.prototype,`withLabel`,2),c([o({attribute:`with-hint`,type:Boolean})],Y.prototype,`withHint`,2),c([o({type:Boolean,reflect:!0})],Y.prototype,`required`,2),c([o({attribute:!1})],Y.prototype,`getTag`,2),c([h(`disabled`,{waitUntilFirstUpdate:!0})],Y.prototype,`handleDisabledChange`,1),c([h(`value`,{waitUntilFirstUpdate:!0})],Y.prototype,`handleValueChange`,1),c([h(`open`,{waitUntilFirstUpdate:!0})],Y.prototype,`handleOpenChange`,1),Y=c([i(`wa-select`)],Y),Y.disableWarning?.(`change-in-update`);var Me=class extends Event{constructor(){super(`wa-remove`,{bubbles:!0,cancelable:!1,composed:!0})}},Ne=r`
  @layer wa-component {
    :host {
      display: inline-flex;
      gap: 0.5em;
      border-radius: var(--wa-border-radius-m);
      align-items: center;
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
      border-style: var(--wa-border-style);
      border-width: var(--wa-border-width-s);
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      font-size: inherit;
      line-height: 1;
      white-space: nowrap;
      user-select: none;
      -webkit-user-select: none;
      height: calc(var(--wa-form-control-height) * 0.8);
      line-height: calc(var(--wa-form-control-height) - var(--wa-form-control-border-width) * 2);
      padding: 0 0.75em;
    }

    /* Appearance modifiers */
    :host([appearance='outlined']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: var(--wa-color-border-loud, var(--wa-color-neutral-border-loud));
    }

    :host([appearance='filled']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: transparent;
    }

    :host([appearance='filled-outlined']) {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
    }

    :host([appearance='accent']) {
      color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
      background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
      border-color: transparent;
    }
  }

  .content {
    font-size: var(--wa-font-size-smaller);
  }

  [part='remove-button'] {
    line-height: 1;
  }

  [part='remove-button']::part(base) {
    padding: 0;
    height: 1em;
    width: 1em;
    color: currentColor;
  }

  @media (hover: hover) {
    :host(:hover) > [part='remove-button']::part(base) {
      background-color: transparent;
      color: color-mix(in oklab, currentColor, var(--wa-color-mix-hover));
    }
  }

  :host(:active) > [part='remove-button']::part(base) {
    background-color: transparent;
    color: color-mix(in oklab, currentColor, var(--wa-color-mix-active));
  }

  /*
   * Pill modifier
   */
  :host([pill]) {
    border-radius: var(--wa-border-radius-pill);
  }
`,X=class extends s{constructor(){super(...arguments),this.localize=new f(this),this.variant=`neutral`,this.appearance=`filled-outlined`,this.size=`m`,this.pill=!1,this.withRemove=!1}handleSizeChange(){g(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new Me)}render(){return e`
      <slot part="content" class="content"></slot>

      ${this.withRemove?e`
            <wa-button
              part="remove-button"
              exportparts="base:remove-button__base"
              class="remove"
              appearance="plain"
              size=${this.size}
              @click=${this.handleRemoveClick}
              tabindex="-1"
            >
              <wa-icon name="xmark" library="system" variant="solid" label=${this.localize.term(`remove`)}></wa-icon>
            </wa-button>
          `:``}
    `}};X.css=[Ne,ie,u],c([o({reflect:!0})],X.prototype,`variant`,2),c([o({reflect:!0})],X.prototype,`appearance`,2),c([o({reflect:!0})],X.prototype,`size`,2),c([h(`size`)],X.prototype,`handleSizeChange`,1),c([o({type:Boolean,reflect:!0})],X.prototype,`pill`,2),c([o({attribute:`with-remove`,type:Boolean})],X.prototype,`withRemove`,2),X=c([i(`wa-tag`)],X);var Pe=r`
  :host {
    --current-text-color: var(--wa-color-brand-on-loud);

    display: block;
    color: var(--wa-color-text-normal);
    -webkit-user-select: none;
    user-select: none;

    position: relative;
    display: flex;
    align-items: center;
    font: inherit;
    padding: 0.5em 1em 0.5em 0.25em;
    border-radius: var(--wa-border-radius-s);
    line-height: var(--wa-line-height-condensed);
    transition: var(--wa-transition-fast) background-color var(--wa-transition-easing);
    cursor: pointer;
  }

  :host(:focus) {
    outline: none;
  }

  @media (hover: hover) {
    :host(:not(:state(disabled), :state(current)):is(:state(hover), :hover)) {
      background-color: var(--wa-color-neutral-fill-normal);
      color: var(--wa-color-neutral-on-normal);
    }
  }

  :host(:state(current)),
  :host(:state(disabled):state(current)) {
    background-color: var(--wa-form-control-activated-color);
    color: var(--current-text-color);
    opacity: 1;
  }

  :host(:state(disabled)) {
    outline: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .label {
    flex: 1 1 auto;
    display: inline-block;
  }

  .check {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--wa-font-size-smaller);
    visibility: hidden;
    width: 2em;
  }

  :host(:state(selected)) .check {
    visibility: visible;
  }

  .start,
  .end {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .start::slotted(*) {
    margin-inline-end: 0.5em;
  }

  .end::slotted(*) {
    margin-inline-start: 0.5em;
  }

  @media (forced-colors: active) {
    :host(:hover:not([aria-disabled='true'])) {
      outline: dashed 1px SelectedItem;
      outline-offset: -1px;
    }
  }
`;function Z(e,t=0){if(!e||!globalThis.Node)return``;if(typeof e[Symbol.iterator]==`function`)return(Array.isArray(e)?e:[...e]).map(e=>Z(e,--t)).join(``);let n=e;if(n.nodeType===Node.TEXT_NODE)return n.textContent??``;if(n.nodeType===Node.ELEMENT_NODE){let e=n;if(e.hasAttribute(`slot`)||e.matches(`style, script`))return``;if(e instanceof HTMLSlotElement){let n=e.assignedNodes({flatten:!0});if(n.length>0)return Z(n,--t)}return t>-1?Z(e,--t):e.textContent??``}return n.hasChildNodes()?Z(n.childNodes,--t):``}var Q=class extends s{constructor(){super(...arguments),this.localize=new f(this),this.cachedDefaultLabel=``,this.isInitialized=!1,this.isDefaultLabelDirty=!0,this.current=!1,this.value=``,this.disabled=!1,this.selected=!1,this.defaultSelected=!1,this._label=``,this.handleHover=e=>{e.type===`mouseenter`?this.customStates.set(`hover`,!0):e.type===`mouseleave`&&this.customStates.set(`hover`,!1)}}set label(e){let t=this._label;this._label=e||``,this._label!==t&&this.requestUpdate(`label`,t)}get label(){return this._label?this._label:this.defaultLabel}get defaultLabel(){return(this.isDefaultLabelDirty||!this.cachedDefaultLabel)&&this.updateDefaultLabel(),this.cachedDefaultLabel}connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`option`),this.setAttribute(`aria-selected`,`false`),this.addEventListener(`mouseenter`,this.handleHover),this.addEventListener(`mouseleave`,this.handleHover)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`mouseenter`,this.handleHover),this.removeEventListener(`mouseleave`,this.handleHover)}handleDefaultSlotChange(){if(this.isDefaultLabelDirty=!0,!this.isInitialized){this.isInitialized=!0;return}let e=this.closest(`wa-select, wa-combobox`);e&&customElements.whenDefined(e.localName).then(()=>e.handleDefaultSlotChange?.())}willUpdate(e){e.has(`defaultSelected`)&&(this.didSSR&&this.hasUpdated||!this.didSSR)&&this.syncDefaultSelected(),super.willUpdate(e)}syncDefaultSelected(){if(`closest`in this&&!this.closest(`wa-combobox, wa-select`)?.hasInteracted&&this.defaultSelected){let e=this.selected;this.selected=this.defaultSelected,this.requestUpdate(`selected`,e)}}updated(e){e.has(`disabled`)&&(this.setAttribute(`aria-disabled`,this.disabled?`true`:`false`),this.customStates.set(`disabled`,this.disabled)),e.has(`selected`)&&(this.setAttribute(`aria-selected`,this.selected?`true`:`false`),this.customStates.set(`selected`,this.selected)),e.has(`value`)&&(typeof this.value!=`string`&&(this.value=String(this.value)),this.handleDefaultSlotChange()),e.has(`current`)&&this.customStates.set(`current`,this.current),super.updated(e)}async firstUpdated(e){if(super.firstUpdated(e),this.didSSR&&!this.hasUpdated&&await this.updateComplete,this.syncDefaultSelected(),this.selected&&!this.defaultSelected){let e=this.closest(`wa-select, wa-combobox`);e&&!e.hasInteracted&&(await customElements.whenDefined(e?.localName),await e.updateComplete,e.selectionChanged?.())}}updateDefaultLabel(){let e=this.cachedDefaultLabel;this.cachedDefaultLabel=Z(this).trim(),this.isDefaultLabelDirty=!1;let t=this.cachedDefaultLabel!==e;return!this._label&&t&&this.requestUpdate(`label`,e),t}render(){let n=this.selected;return this.didSSR&&!this.hasUpdated?(this.updateComplete.then(()=>{this.requestUpdate()}),t):e`
      ${n?e`<wa-icon
            part="checked-icon"
            class="check"
            name="check"
            library="system"
            variant="solid"
            aria-hidden="true"
          ></wa-icon>`:e`<span part="checked-icon" class="check" aria-hidden="true"></span>`}
      <slot part="start" name="start" class="start"></slot>
      <slot part="label" class="label" @slotchange=${this.handleDefaultSlotChange}></slot>
      <slot part="end" name="end" class="end"></slot>
    `}};Q.css=Pe,c([m(`.label`)],Q.prototype,`defaultSlot`,2),c([l()],Q.prototype,`current`,2),c([o({reflect:!0})],Q.prototype,`value`,2),c([o({type:Boolean})],Q.prototype,`disabled`,2),c([o({type:Boolean,attribute:!1})],Q.prototype,`selected`,2),c([o({type:Boolean,attribute:`selected`})],Q.prototype,`defaultSelected`,2),c([o()],Q.prototype,`label`,1),Q=c([i(`wa-option`)],Q);var Fe=r`
  :host {
    --spacing: var(--wa-space-m);
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: block;
  }

  details {
    display: block;
    overflow-anchor: none;
    border: var(--wa-panel-border-width) var(--wa-color-surface-border) var(--wa-panel-border-style);
    background-color: var(--wa-color-surface-default);
    border-radius: var(--wa-panel-border-radius);
    color: var(--wa-color-text-normal);

    /* Print styles */
    @media print {
      background: none;
      border: solid var(--wa-border-width-s) var(--wa-color-surface-border);

      summary {
        list-style: none;
      }
    }
  }

  /* Appearance modifiers */
  :host([appearance='plain']) details {
    background-color: transparent;
    border-color: transparent;
    border-radius: 0;
  }

  :host([appearance='outlined']) details {
    background-color: var(--wa-color-surface-default);
    border-color: var(--wa-color-surface-border);
  }

  :host([appearance='filled']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: transparent;
  }

  :host([appearance='filled-outlined']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-border-quiet);
  }

  :host([disabled]) details {
    opacity: 0.5;
    cursor: not-allowed;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing);
    padding: var(--spacing); /* Add padding here */
    border-radius: calc(var(--wa-panel-border-radius) - var(--wa-panel-border-width));
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;

    &::marker,
    &::-webkit-details-marker {
      display: none;
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: calc(var(--wa-panel-border-width) + var(--wa-focus-ring-offset));
    }
  }

  :host([open]) summary {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  /* 'Start' icon placement */
  :host([icon-placement='start']) summary {
    flex-direction: row-reverse;
    justify-content: start;
  }

  [part~='icon'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-text-quiet);
    transition: rotate var(--wa-transition-normal) var(--wa-transition-easing);
  }

  :host([open]) [part~='icon'] {
    rotate: 90deg;
  }

  :host([open]:dir(rtl)) [part~='icon'] {
    rotate: -90deg;
  }

  :host([open]) slot[name='expand-icon'],
  :host(:not([open])) slot[name='collapse-icon'] {
    display: none;
  }

  .body.animating {
    overflow: hidden;
  }

  .content {
    display: block;
    box-sizing: border-box; /* Ensure contents don't overflow */
    padding-block-start: var(--spacing);
    padding-inline: var(--spacing); /* Add horizontal padding */
    padding-block-end: var(--spacing); /* Add bottom padding */
  }
`,$=class extends s{constructor(){super(...arguments),this.localize=new f(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance=`outlined`,this.iconPlacement=`end`}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?`auto`:`0`,this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(e=>{for(let t of e)t.type===`attributes`&&t.attributeName===`open`&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has(`isAnimating`)&&this.customStates.set(`animating`,this.isAnimating)}handleSummaryClick(e){e.composedPath().some(e=>{if(!(e instanceof HTMLElement))return!1;let t=e.tagName?.toLowerCase();return[`a`,`button`,`input`,`textarea`,`select`].includes(t)?!0:e instanceof p?!(`disabled`in e)||!e.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key===`ArrowUp`||e.key===`ArrowLeft`)&&(e.preventDefault(),this.hide()),(e.key===`ArrowDown`||e.key===`ArrowRight`)&&(e.preventDefault(),this.show())}closeOthersWithSameName(){this.name&&this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(e=>{e!==this&&e.open&&(e.open=!1)})}async handleOpenChange(){this.animationGeneration++;let e=this.animationGeneration;if(this.open){this.details.open=!0;let t=new D;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;let n=A(getComputedStyle(this.body).getPropertyValue(`--show-duration`));if(await w(this.body,[{height:`0`,opacity:`0`},{height:`${this.body.scrollHeight}px`,opacity:`1`}],{duration:n,easing:`linear`}),this.animationGeneration!==e)return;this.body.style.height=`auto`,this.isAnimating=!1,this.dispatchEvent(new T)}else{let t=new k;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;let n=A(getComputedStyle(this.body).getPropertyValue(`--hide-duration`));if(await w(this.body,[{height:`${this.body.scrollHeight}px`,opacity:`1`},{height:`0`,opacity:`0`}],{duration:n,easing:`linear`}),this.animationGeneration!==e)return;this.body.style.height=`0`,this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new E)}}async show(){if(!(this.open||this.disabled))return this.open=!0,j(this,`wa-after-show`)}async hide(){if(this.open&&!this.disabled)return this.open=!1,j(this,`wa-after-hide`)}render(){let t=this.hasUpdated?this.localize.dir()===`rtl`:this.dir===`rtl`;return e`
      <details part="base details">
        <summary
          part="header"
          role="button"
          aria-expanded=${this.open?`true`:`false`}
          aria-controls="content"
          aria-disabled=${this.disabled?`true`:`false`}
          tabindex=${this.disabled?`-1`:`0`}
          @click=${this.handleSummaryClick}
          @keydown=${this.handleSummaryKeyDown}
        >
          <slot name="summary" part="summary">${this.summary}</slot>

          <span part="icon">
            <slot name="expand-icon">
              <wa-icon library="system" variant="solid" name=${t?`chevron-left`:`chevron-right`}></wa-icon>
            </slot>
            <slot name="collapse-icon">
              <wa-icon library="system" variant="solid" name=${t?`chevron-left`:`chevron-right`}></wa-icon>
            </slot>
          </span>
        </summary>

        <div
          class=${d({body:!0,animating:this.isAnimating})}
          role="region"
          aria-labelledby="header"
        >
          <slot part="content" id="content" class="content"></slot>
        </div>
      </details>
    `}};$.css=Fe,c([m(`details`)],$.prototype,`details`,2),c([m(`summary`)],$.prototype,`header`,2),c([m(`.body`)],$.prototype,`body`,2),c([m(`.expand-icon-slot`)],$.prototype,`expandIconSlot`,2),c([l()],$.prototype,`isAnimating`,2),c([o({type:Boolean,reflect:!0})],$.prototype,`open`,2),c([o()],$.prototype,`summary`,2),c([o({reflect:!0})],$.prototype,`name`,2),c([o({type:Boolean,reflect:!0})],$.prototype,`disabled`,2),c([o({reflect:!0})],$.prototype,`appearance`,2),c([o({attribute:`icon-placement`,reflect:!0})],$.prototype,`iconPlacement`,2),c([h(`open`,{waitUntilFirstUpdate:!0})],$.prototype,`handleOpenChange`,1),$=c([i(`wa-details`)],$);export{P as a,ge as i,Te as n,F as o,be as r,ke as t};