import{a as e,n as t,r as n,u as r}from"./lit-BFn1CURT.js";import{a as i,c as a,i as o,n as s,o as c,r as l,s as u,t as d}from"./card-58mEaPX-.js";import{a as f,c as p,d as m,o as h,s as g}from"./directive-helpers-B5gL4DMf.js";import{n as _,r as v,t as y}from"./directive-BSZPiF1A.js";import{a as b,i as x,w as S,y as C}from"./cesium-shim-deYMRcZt.js";import{t as w}from"./switch-BktEAscN.js";import{t as T}from"./style-map-ly-_uhSr.js";import{t as E}from"./button-C4a7i2eR.js";import{a as ee,o as D}from"./motion-blur-H9Tf_aeZ.js";var O=new WeakMap;function te(e,t){clearInterval(t.interval),t.interval=t.rates.length>0?setInterval(()=>ne(e,t),1e3/Math.max(...t.rates)):void 0}function ne(e,t){if(e.isDestroyed()){clearInterval(t.interval),O.delete(e);return}e.requestRender()}function k(e,t){let n=O.get(e);n||(n={rates:[],interval:void 0},O.set(e,n)),n.rates.push(t),te(e,n)}function re(e,t){let n=O.get(e),r=n?n.rates.indexOf(t):-1;!n||r<0||(n.rates.splice(r,1),te(e,n),n.rates.length===0&&O.delete(e))}var ie=`// An analog FPV video feed: washed-out colors, color bleeding sideways (the signal carries the
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
`,ae=25,oe=.4,se=3,ce=.07,le=2.5,ue=e=>e-Math.floor(e);function A(e,t){let n=ue(e*.1031),r=ue(t*.1031),i=n,a=n*(r+33.33)+r*(i+33.33)+i*(n+33.33);return n+=a,r+=a,i+=a,ue((n+r)*i)}function de(e,t,n){let r=e*oe,i=ue(r),a=t*(A(Math.floor(r),5)+(A(Math.floor(r)+1,5)-A(Math.floor(r),5))*i*i*(3-2*i)),o=+(A(Math.floor(e*ae)%1e3,11)<.015*t),s=Array.from({length:se},(n,r)=>{let i=r*7;return A(Math.floor(e/le+i),i)<t?1-ue(e*ce*(1+.3*r)+A(i,1)):-1});return x.fromElements(s[0],s[1],s[2],n),{weak:a,breakup:o}}var fe=class extends D{constructor(e,t={}){super(e),this.noise_=t.noise??.5,this.interference_=t.interference??.15,this.weak_=0,this.breakup_=0,this.lineAt_=new x,this.onPreRender_=()=>{let e=de(performance.now()/1e3,this.interference_,this.lineAt_);this.weak_=e.weak,this.breakup_=e.breakup}}createStage_(){return new S({fragmentShader:ee+ie,uniforms:{time:()=>performance.now()/1e3,noise:()=>this.noise_,interference:()=>this.interference_,weak:()=>this.weak_,breakup:()=>this.breakup_,lineAt:()=>this.lineAt_}})}activated_(e){e.preRender.addEventListener(this.onPreRender_),k(e,ae)}deactivating_(e){re(e,ae),e.preRender.removeEventListener(this.onPreRender_)}get noise(){return this.noise_}set noise(e){this.noise_=e}get interference(){return this.interference_}set interference(e){this.interference_=e}},pe=`// A digital FPV video feed and its breakups: clean, slightly punchy colors, until a weak signal
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
`,me=30,he=2,ge=[.4,1.5],_e=.25,ve=class extends D{constructor(e,t={}){super(e),this.breakup_=t.breakup??.5,this.episode_=void 0,this.updated_=0,this.severity_=0,this.blackout_=0,this.onPreRender_=()=>this.update_()}createStage_(){return new S({fragmentShader:ee+pe,uniforms:{severity:()=>this.severity_,blackout:()=>this.blackout_,frame:()=>Math.floor(performance.now()/1e3*me)%1e5}})}activated_(e){this.updated_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),k(e,me)}deactivating_(e){re(e,me),e.preRender.removeEventListener(this.onPreRender_),this.episode_=void 0}update_(){let e=performance.now()/1e3,t=Math.min(e-this.updated_,1);if(this.updated_=e,this.episode_&&e>this.episode_.start+this.episode_.duration&&(this.episode_=void 0),!this.episode_&&Math.random()<1-Math.exp(-this.breakup_/he*t)){let t=ge[0]+Math.random()*(ge[1]-ge[0]);this.episode_={start:e,duration:t,blackout:Math.random()<.5*this.breakup_}}let n=this.episode_;if(!n){this.severity_=0,this.blackout_=0;return}let r=(e-n.start)/n.duration;this.severity_=Math.max(0,Math.sin(Math.PI*Math.min(r,1)))**.7*(.4+.6*this.breakup_),this.blackout_=n.blackout&&Math.abs(r-.5)*n.duration<_e/2?1:0}get breakup(){return this.breakup_}set breakup(e){this.breakup_=e}},ye=`// A Betaflight analog OSD, as its MAX7456 chip draws it: 30 columns and 16 rows of 12 x 18
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
`,be=16.8,xe=600,Se=[`ring`,`v`,`heart`],Ce=class extends D{constructor(e,t={}){super(e),this.opacity_=t.opacity??1,this.reticle_=t.reticle??`v`,this.startTime_=0,this.startHeight_=0}createStage_(e){return new S({fragmentShader:ye,uniforms:{opacity:()=>this.opacity_,pitch:()=>C.toDegrees(e.camera.pitch),roll:()=>C.toDegrees(C.negativePiToPi(e.camera.roll)),altitude:()=>e.camera.positionCartographic.height-this.startHeight_,voltage:()=>this.voltage_(),linkQuality:()=>this.linkQuality_(),reticle:()=>Math.max(Se.indexOf(this.reticle_),0)}})}activated_(e){this.startTime_=performance.now()/1e3,this.startHeight_=e.camera.positionCartographic.height}voltage_(){let e=performance.now()/1e3-this.startTime_,t=2.8000000000000007*Math.min(e/xe,1),n=.1*Math.max(0,Math.sin(e*.7)*Math.sin(e*.23));return be-t-n}linkQuality_(){let e=performance.now()/1e3-this.startTime_,t=4*Math.abs(Math.sin(e*.9)*Math.sin(e*.37)),n=Math.sin(e*.11)>.97?35:0;return Math.round(99-t-n)}get opacity(){return this.opacity_}set opacity(e){this.opacity_=e,this.viewer.scene.requestRender()}get reticle(){return this.reticle_}set reticle(e){this.reticle_=e,this.viewer.scene.requestRender()}},we=`// The jello of a vibrating camera with a rolling shutter: the sensor reads its rows one after
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
`,Te=30,Ee=[1,1.37,2.11,3.07],De=[1,.6,.35,.2],Oe=De.reduce((e,t)=>e+t,0),ke=.015,Ae=[ke,.5*ke,.008],je=2*Math.PI,Me=[`x`,`y`,`z`,`w`],Ne=class extends D{constructor(e,t={}){super(e),this.amount_=t.amount??.1,this.frequency_=t.frequency??30,this.offsets_=Ee.map(()=>[Math.random(),Math.random(),Math.random()].map(e=>e*je)),this.shakeHz_=new b,this.amplitudes_=[new b,new b,new b],this.zoom_=1,this.phases_=[new b,new b,new b],this.updateShape_(),this.onPreRender_=()=>{let e=performance.now()/1e3;Ee.forEach((t,n)=>{let r=je*(t*this.frequency_*e%1);this.phases_.forEach((e,t)=>{e[Me[n]]=(r+this.offsets_[n][t])%je})})}}createStage_(){let e=new S({fragmentShader:we,uniforms:{shakeHz:()=>this.shakeHz_,phaseX:()=>this.phases_[0],phaseY:()=>this.phases_[1],phaseRotation:()=>this.phases_[2],amplitudeX:()=>this.amplitudes_[0],amplitudeY:()=>this.amplitudes_[1],amplitudeRotation:()=>this.amplitudes_[2],zoom:()=>this.zoom_}});return e.enabled=this.amount_>0,e}activated_(e){e.preRender.addEventListener(this.onPreRender_),this.amount_>0&&k(e,Te)}deactivating_(e){this.amount_>0&&re(e,Te),e.preRender.removeEventListener(this.onPreRender_)}updateShape_(){Ee.forEach((e,t)=>{this.shakeHz_[Me[t]]=e*this.frequency_,this.amplitudes_.forEach((e,n)=>{e[Me[t]]=De[t]*Ae[n]*this.amount_})}),this.zoom_=1+2*Oe*this.amount_*.023}get amount(){return this.amount_}set amount(e){let t=this.amount_>0;this.amount_=e,this.updateShape_(),this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?k:re)(this.viewer.scene,Te)),this.viewer.scene.requestRender()}get frequency(){return this.frequency_}set frequency(e){this.frequency_=e,this.updateShape_()}};function Pe(e,t){return{top:Math.round(e.getBoundingClientRect().top-t.getBoundingClientRect().top),left:Math.round(e.getBoundingClientRect().left-t.getBoundingClientRect().left)}}function Fe(e,t){let n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var Ie=new Set;function Le(){let e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function Re(){let e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,``));return isNaN(e)||!e?0:e}function ze(e){if(Ie.add(e),!document.documentElement.classList.contains(`wa-scroll-lock`)){let e=Le()+Re(),t=getComputedStyle(document.documentElement).scrollbarGutter;(!t||t===`auto`)&&(t=`stable`),e<2&&(t=``),document.documentElement.style.setProperty(`--wa-scroll-lock-gutter`,t),document.documentElement.classList.add(`wa-scroll-lock`),document.documentElement.style.setProperty(`--wa-scroll-lock-size`,`${e}px`)}}function Be(e){Ie.delete(e),Ie.size===0&&(document.documentElement.classList.remove(`wa-scroll-lock`),document.documentElement.style.removeProperty(`--wa-scroll-lock-size`))}function Ve(e,t,n=`vertical`,r=`smooth`){let i=Pe(e,t),a=i.top+t.scrollTop,o=i.left+t.scrollLeft,s=t.scrollLeft,c=t.scrollLeft+t.offsetWidth,l=t.scrollTop,u=t.scrollTop+t.offsetHeight;(n===`horizontal`||n===`both`)&&(o<s?t.scrollTo({left:o,behavior:r}):o+e.clientWidth>c&&t.scrollTo({left:o-t.offsetWidth+e.clientWidth,behavior:r})),(n===`vertical`||n===`both`)&&(a<l?t.scrollTo({top:a,behavior:r}):a+e.clientHeight>u&&t.scrollTo({top:a-t.offsetHeight+e.clientHeight,behavior:r}))}var He=class extends Event{constructor(){super(`wa-show`,{bubbles:!0,cancelable:!0,composed:!0})}},Ue=class extends Event{constructor(e){super(`wa-hide`,{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}},We=class extends Event{constructor(){super(`wa-after-hide`,{bubbles:!0,cancelable:!1,composed:!0})}},Ge=class extends Event{constructor(){super(`wa-after-show`,{bubbles:!0,cancelable:!1,composed:!0})}},j=[];function Ke(e){qe(e),j.push(e)}function qe(e){for(let t=j.length-1;t>=0;t--)if(j[t]===e){j.splice(t,1);break}}function Je(e){return j.length>0&&j[j.length-1]===e}async function Ye(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function Xe(e,t){return new Promise(n=>{let r=new AbortController,{signal:i}=r;if(e.classList.contains(t))return;e.classList.add(t);let a=!1,o=()=>{a||(a=!0,e.classList.remove(t),n(),r.abort())};e.addEventListener(`animationend`,o,{once:!0,signal:i}),e.addEventListener(`animationcancel`,o,{once:!0,signal:i}),requestAnimationFrame(()=>{!a&&e.getAnimations().length===0&&o()})})}function Ze(e){return e=e.toString().toLowerCase(),e.indexOf(`ms`)>-1?parseFloat(e)||0:e.indexOf(`s`)>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}var Qe=`useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict`,$e=(e=21)=>{let t=``,n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=Qe[n[e]&63];return t};function M(e,t,n){return(e=>Object.is(e,-0)?0:e)(e<t?t:e>n?n:e)}function et(e=``){return`${e}${$e()}`}var tt=r`
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
`,nt=class extends Event{constructor(){super(`wa-clear`,{bubbles:!0,cancelable:!1,composed:!0})}},rt=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<`u`&&`createElement`in document&&(t=Object.assign(document.createElement(`input`),{required:!0})),n||=`value`;let r={observedAttributes:[`required`],message:t?.validationMessage,checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]};return(e.required??e.hasAttribute(`required`))&&(e[n]||(t.message=typeof r.message==`function`?r.message(e):r.message||``,t.isValid=!1,t.invalidKeys.push(`valueMissing`))),t}};return r};function it(e,t){return new Promise(n=>{function r(i){i.target===e&&(e.removeEventListener(t,r),n())}e.addEventListener(t,r)})}var at=class extends _{constructor(e){if(super(e),this.it=t,e.type!==v.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===t||e==null)return this._t=void 0,this.it=e;if(e===n)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let r=[e];return r.raw=r,this._t={_$litType$:this.constructor.resultType,strings:r,values:[]}}};at.directiveName=`unsafeHTML`,at.resultType=1;var ot=y(at),N=class extends p{constructor(){super(...arguments),this.assumeInteractionOn=[`blur`,`input`],this.cachedOptions=null,this.hasSlotController=new a(this,`hint`,`label`),this.localize=new f(this),this.selectionOrder=new Map,this.typeToSelectString=``,this.slotChangePending=!1,this.displayLabel=``,this.selectedOptions=[],this.name=``,this._defaultValue=null,this.size=`m`,this.placeholder=``,this.multiple=!1,this.maxOptionsVisible=3,this.disabled=!1,this.withClear=!1,this.open=!1,this.appearance=`outlined`,this.pill=!1,this.label=``,this.placement=`bottom`,this.hint=``,this.withLabel=!1,this.withHint=!1,this.required=!1,this.getTag=t=>e`
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
      `,this.handleDocumentFocusIn=e=>{let t=e.composedPath();this&&!t.includes(this)&&this.hide()},this.handleDocumentKeyDown=e=>{let t=e.target,n=t.closest(`[part~="clear-button"]`)!==null,r=t.closest(`wa-button`)!==null;if(!(n||r)){if(e.key===`Escape`&&this.open&&Je(this)&&(e.preventDefault(),e.stopPropagation(),this.hide(),this.displayInput.focus({preventScroll:!0})),e.key===`Enter`||e.key===` `&&this.typeToSelectString===``){if(e.preventDefault(),e.stopImmediatePropagation(),!this.open){this.show();return}this.currentOption&&!this.currentOption.disabled&&(this.valueHasChanged=!0,this.hasInteracted=!0,this.multiple?this.toggleOptionSelection(this.currentOption):this.setSelectedOptions(this.currentOption),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})));return}if([`ArrowUp`,`ArrowDown`,`Home`,`End`].includes(e.key)){let t=this.getAllOptions(),n=t.indexOf(this.currentOption),r=Math.max(0,n);if(e.preventDefault(),!this.open&&(this.show(),this.currentOption))return;e.key===`ArrowDown`?(r=n+1,r>t.length-1&&(r=0)):e.key===`ArrowUp`?(r=n-1,r<0&&(r=t.length-1)):e.key===`Home`?r=0:e.key===`End`&&(r=t.length-1),this.setCurrentOption(t[r])}if(e.key?.length===1||e.key===`Backspace`){let t=this.getAllOptions();if(e.metaKey||e.ctrlKey||e.altKey)return;if(!this.open){if(e.key===`Backspace`)return;this.show()}e.stopPropagation(),e.preventDefault(),clearTimeout(this.typeToSelectTimeout),this.typeToSelectTimeout=window.setTimeout(()=>this.typeToSelectString=``,1e3),e.key===`Backspace`?this.typeToSelectString=this.typeToSelectString.slice(0,-1):this.typeToSelectString+=e.key.toLowerCase();for(let e of t)if(e.label.toLowerCase().startsWith(this.typeToSelectString)){this.setCurrentOption(e);break}}}},this.handleDocumentMouseDown=e=>{let t=e.composedPath();this&&!t.includes(this)&&this.hide()}}static get validators(){let e=[rt({validationElement:Object.assign(document.createElement(`select`),{required:!0})})];return[...super.validators,...e]}get validationTarget(){return this.valueInput}set defaultValue(e){this._defaultValue=this.convertDefaultValue(e)}get defaultValue(){return this.convertDefaultValue(this._defaultValue)}rawValuesEqual(e,t){return e==null&&t==null?!0:e==null||t==null||e.length!==t.length?!1:e.every((e,n)=>e===t[n])}convertDefaultValue(e){return!(this.multiple||this.hasAttribute(`multiple`))&&Array.isArray(e)&&(e=e[0]),e}set value(e){let t=this.value;e instanceof FormData&&(e=e.getAll(this.name)),e!=null&&!Array.isArray(e)&&(e=[e]);let n=this._value;this._value=e??null,this.rawValuesEqual(n,this._value)||(this.valueHasChanged=!0,this.requestUpdate(`value`,t))}get value(){let e=this._value??this.defaultValue??null;e!=null&&(e=Array.isArray(e)?e:[e]),this.optionValues=new Set(this.getAllOptions().filter(e=>!e.disabled).map(e=>e.value));let t=e;return e!=null&&(t=e.filter(e=>this.optionValues.has(e)),t=this.multiple?t:t[0],t??=null),t}handleSizeChange(){g(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.processSlotChange(),this.open=!1}disconnectedCallback(){super.disconnectedCallback(),this.removeOpenListeners(),this.cachedOptions=null}updateDefaultValue(){let e=this.getAllOptions().filter(e=>e.hasAttribute(`selected`)||e.defaultSelected);if(e.length>0){let t=e.map(e=>e.value);this._defaultValue=this.multiple?t:t[0]}this.hasAttribute(`value`)&&(this._defaultValue=this.getAttribute(`value`)||null)}addOpenListeners(){document.addEventListener(`focusin`,this.handleDocumentFocusIn),document.addEventListener(`keydown`,this.handleDocumentKeyDown),document.addEventListener(`mousedown`,this.handleDocumentMouseDown),Ke(this),this.getRootNode()!==document&&this.getRootNode().addEventListener(`focusin`,this.handleDocumentFocusIn)}removeOpenListeners(){document.removeEventListener(`focusin`,this.handleDocumentFocusIn),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`mousedown`,this.handleDocumentMouseDown),qe(this),this.getRootNode()!==document&&this.getRootNode().removeEventListener(`focusin`,this.handleDocumentFocusIn)}handleFocus(){this.displayInput.setSelectionRange(0,0)}handleLabelClick(){this.displayInput.focus()}handleComboboxClick(e){e.preventDefault()}handleComboboxMouseDown(e){let t=e.composedPath().some(e=>e instanceof Element&&e.tagName.toLowerCase()===`wa-button`);this.disabled||t||(e.preventDefault(),this.displayInput.focus({preventScroll:!0}),this.open=!this.open)}handleComboboxKeyDown(e){e.stopPropagation(),this.handleDocumentKeyDown(e)}handleClearClick(e){e.stopPropagation(),this.hasInteracted=!0,this.valueHasChanged=!0,this.value!==null&&(this.displayLabel=``,this.selectionOrder.clear(),this.setSelectedOptions([]),this.displayInput.focus({preventScroll:!0}),this.updateComplete.then(()=>{this.dispatchEvent(new nt),this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}))}handleClearMouseDown(e){e.stopPropagation(),e.preventDefault()}handleOptionClick(e){let t=e.target.closest(`wa-option`);t&&!t.disabled&&(this.hasInteracted=!0,this.valueHasChanged=!0,this.multiple?this.toggleOptionSelection(t):this.setSelectedOptions(t),this.updateComplete.then(()=>this.displayInput.focus({preventScroll:!0})),this.requestUpdate(`value`),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})))}handleDefaultSlotChange(){this.slotChangePending||(this.slotChangePending=!0,queueMicrotask(()=>{this.slotChangePending=!1,this.processSlotChange()}))}processSlotChange(){if(customElements.get(`wa-option`)||customElements.whenDefined(`wa-option`).then(()=>this.handleDefaultSlotChange()),this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleDefaultSlotChange()});return}this.cachedOptions=null;let e=this.getAllOptions();this.updateDefaultValue();let t=this.value;if(t==null||!this.valueHasChanged&&!this.hasInteracted){this.selectionChanged();return}Array.isArray(t)||(t=[t]);let n=e.filter(e=>t.includes(e.value));this.setSelectedOptions(n)}handleTagRemove(e,t){if(e.stopPropagation(),this.disabled)return;this.hasInteracted=!0,this.valueHasChanged=!0;let n=t;if(!n){let t=e.target.closest(`wa-tag[data-value]`);if(t){let e=t.dataset.value;n=this.selectedOptions.find(t=>t.value===e)}}n&&(this.toggleOptionSelection(n,!1),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}))}getAllOptions(){return this.cachedOptions?this.cachedOptions:this?.querySelectorAll?(this.cachedOptions=[...this.querySelectorAll(`wa-option`)],this.cachedOptions):[]}getFirstOption(){return this.querySelector(`wa-option`)}setCurrentOption(e){this.getAllOptions().forEach(e=>{e.current=!1,e.tabIndex=-1}),e&&(this.currentOption=e,e.current=!0,e.tabIndex=0,e.focus({preventScroll:!0}),this.open&&!this.listbox.hidden&&Ve(e,this.listbox,`vertical`,`auto`))}setSelectedOptions(e){let t=this.getAllOptions(),n=Array.isArray(e)?e:[e];t.forEach(e=>{n.includes(e)||(e.selected=!1)}),n.length&&n.forEach(e=>e.selected=!0),this.selectionChanged()}toggleOptionSelection(e,t){e.selected=t===!0||t===!1?t:!e.selected,this.selectionChanged()}selectionChanged(){let e=this.getAllOptions().filter(e=>{if(!this.hasInteracted&&!this.valueHasChanged){let t=this.defaultValue,n=Array.isArray(t)?t:[t];return e.hasAttribute(`selected`)||e.defaultSelected||e.selected||n?.includes(e.value)}return e.selected}),t=new Set(e.map(e=>e.value));for(let e of this.selectionOrder.keys())t.has(e)||this.selectionOrder.delete(e);let n=(this.selectionOrder.size>0?Math.max(...this.selectionOrder.values()):-1)+1;for(let t of e)this.selectionOrder.has(t.value)||this.selectionOrder.set(t.value,n++);this.selectedOptions=e.sort((e,t)=>(this.selectionOrder.get(e.value)??0)-(this.selectionOrder.get(t.value)??0));let r=new Set(this.selectedOptions.map(e=>e.value));if(r.size>0||this._value){let e=this._value;if(this._value==null){let e=this.defaultValue??[];this._value=Array.isArray(e)?e:[e]}this._value=this._value?.filter(e=>!this.optionValues?.has(e))??null,this._value?.unshift(...r),this.requestUpdate(`value`,e)}if(this.multiple)this.displayLabel=this.placeholder&&!this.value?.length?``:this.localize.term(`numOptionsSelected`,this.selectedOptions.length);else{let e=this.selectedOptions[0];this.displayLabel=e?.label??``}this.updateComplete.then(()=>{this.updateValidity()})}get tags(){return this.selectedOptions.map((t,n)=>{if(n<this.maxOptionsVisible||this.maxOptionsVisible<=0){let e=this.getTag(t,n);return e?typeof e==`string`?ot(e):e:null}return n===this.maxOptionsVisible?e`
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
        `:null})}updated(e){super.updated(e),(e.has(`value`)||e.has(`displayLabel`))&&this.customStates.set(`blank`,!this.value&&!this.displayLabel)}handleDisabledChange(){this.disabled&&this.open&&(this.open=!1)}handleValueChange(){let e=this.getAllOptions(),t=Array.isArray(this.value)?this.value:[this.value],n=e.filter(e=>t.includes(e.value));this.setSelectedOptions(n),this.updateValidity()}async handleOpenChange(){if(this.open&&!this.disabled){this.setCurrentOption(this.selectedOptions[0]||this.getFirstOption());let e=new He;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.listbox.hidden=!1,this.popup.active=!0,requestAnimationFrame(()=>{this.setCurrentOption(this.currentOption)}),await Xe(this.popup.popup,`show`),this.currentOption&&Ve(this.currentOption,this.listbox,`vertical`,`auto`),this.dispatchEvent(new Ge)}else{let e=new Ue;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.removeOpenListeners(),await Xe(this.popup.popup,`hide`),this.listbox.hidden=!0,this.popup.active=!1,this.dispatchEvent(new We)}}async show(){if(this.open||this.disabled){this.open=!1;return}return this.open=!0,it(this,`wa-after-show`)}async hide(){if(!this.open||this.disabled){this.open=!1;return}return this.open=!1,it(this,`wa-after-hide`)}focus(e){this.displayInput.focus(e)}blur(){this.displayInput.blur()}formResetCallback(){this.selectionOrder.clear(),this.value=this.defaultValue,super.formResetCallback(),this.handleValueChange(),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n,a=(this.hasUpdated||!1)&&this.withClear&&!this.disabled&&(this.displayLabel||this.value&&this.value.length>0);return e`
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
    `}};N.css=[tt,w,u],c([m(`.select`)],N.prototype,`popup`,2),c([m(`.combobox`)],N.prototype,`combobox`,2),c([m(`.display-input`)],N.prototype,`displayInput`,2),c([m(`.value-input`)],N.prototype,`valueInput`,2),c([m(`.listbox`)],N.prototype,`listbox`,2),c([l()],N.prototype,`displayLabel`,2),c([l()],N.prototype,`currentOption`,2),c([l()],N.prototype,`selectedOptions`,2),c([o({reflect:!0})],N.prototype,`name`,2),c([o({attribute:!1})],N.prototype,`defaultValue`,1),c([o({attribute:`value`,reflect:!1})],N.prototype,`value`,1),c([o({reflect:!0})],N.prototype,`size`,2),c([h(`size`)],N.prototype,`handleSizeChange`,1),c([o()],N.prototype,`placeholder`,2),c([o({type:Boolean,reflect:!0})],N.prototype,`multiple`,2),c([o({attribute:`max-options-visible`,type:Number})],N.prototype,`maxOptionsVisible`,2),c([o({type:Boolean})],N.prototype,`disabled`,2),c([o({attribute:`with-clear`,type:Boolean})],N.prototype,`withClear`,2),c([o({type:Boolean,reflect:!0})],N.prototype,`open`,2),c([o({reflect:!0})],N.prototype,`appearance`,2),c([o({type:Boolean,reflect:!0})],N.prototype,`pill`,2),c([o()],N.prototype,`label`,2),c([o({reflect:!0})],N.prototype,`placement`,2),c([o({attribute:`hint`})],N.prototype,`hint`,2),c([o({attribute:`with-label`,type:Boolean})],N.prototype,`withLabel`,2),c([o({attribute:`with-hint`,type:Boolean})],N.prototype,`withHint`,2),c([o({type:Boolean,reflect:!0})],N.prototype,`required`,2),c([o({attribute:!1})],N.prototype,`getTag`,2),c([h(`disabled`,{waitUntilFirstUpdate:!0})],N.prototype,`handleDisabledChange`,1),c([h(`value`,{waitUntilFirstUpdate:!0})],N.prototype,`handleValueChange`,1),c([h(`open`,{waitUntilFirstUpdate:!0})],N.prototype,`handleOpenChange`,1),N=c([i(`wa-select`)],N),N.disableWarning?.(`change-in-update`);var st=class extends Event{constructor(){super(`wa-remove`,{bubbles:!0,cancelable:!1,composed:!0})}},ct=r`
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
`,P=class extends s{constructor(){super(...arguments),this.localize=new f(this),this.variant=`neutral`,this.appearance=`filled-outlined`,this.size=`m`,this.pill=!1,this.withRemove=!1}handleSizeChange(){g(this.localName,this.size)}handleRemoveClick(){this.dispatchEvent(new st)}render(){return e`
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
    `}};P.css=[ct,E,u],c([o({reflect:!0})],P.prototype,`variant`,2),c([o({reflect:!0})],P.prototype,`appearance`,2),c([o({reflect:!0})],P.prototype,`size`,2),c([h(`size`)],P.prototype,`handleSizeChange`,1),c([o({type:Boolean,reflect:!0})],P.prototype,`pill`,2),c([o({attribute:`with-remove`,type:Boolean})],P.prototype,`withRemove`,2),P=c([i(`wa-tag`)],P);var lt=r`
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
`;function ut(e,t=0){if(!e||!globalThis.Node)return``;if(typeof e[Symbol.iterator]==`function`)return(Array.isArray(e)?e:[...e]).map(e=>ut(e,--t)).join(``);let n=e;if(n.nodeType===Node.TEXT_NODE)return n.textContent??``;if(n.nodeType===Node.ELEMENT_NODE){let e=n;if(e.hasAttribute(`slot`)||e.matches(`style, script`))return``;if(e instanceof HTMLSlotElement){let n=e.assignedNodes({flatten:!0});if(n.length>0)return ut(n,--t)}return t>-1?ut(e,--t):e.textContent??``}return n.hasChildNodes()?ut(n.childNodes,--t):``}var F=class extends s{constructor(){super(...arguments),this.localize=new f(this),this.cachedDefaultLabel=``,this.isInitialized=!1,this.isDefaultLabelDirty=!0,this.current=!1,this.value=``,this.disabled=!1,this.selected=!1,this.defaultSelected=!1,this._label=``,this.handleHover=e=>{e.type===`mouseenter`?this.customStates.set(`hover`,!0):e.type===`mouseleave`&&this.customStates.set(`hover`,!1)}}set label(e){let t=this._label;this._label=e||``,this._label!==t&&this.requestUpdate(`label`,t)}get label(){return this._label?this._label:this.defaultLabel}get defaultLabel(){return(this.isDefaultLabelDirty||!this.cachedDefaultLabel)&&this.updateDefaultLabel(),this.cachedDefaultLabel}connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`option`),this.setAttribute(`aria-selected`,`false`),this.addEventListener(`mouseenter`,this.handleHover),this.addEventListener(`mouseleave`,this.handleHover)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`mouseenter`,this.handleHover),this.removeEventListener(`mouseleave`,this.handleHover)}handleDefaultSlotChange(){if(this.isDefaultLabelDirty=!0,!this.isInitialized){this.isInitialized=!0;return}let e=this.closest(`wa-select, wa-combobox`);e&&customElements.whenDefined(e.localName).then(()=>e.handleDefaultSlotChange?.())}willUpdate(e){e.has(`defaultSelected`)&&(this.didSSR&&this.hasUpdated||!this.didSSR)&&this.syncDefaultSelected(),super.willUpdate(e)}syncDefaultSelected(){if(`closest`in this&&!this.closest(`wa-combobox, wa-select`)?.hasInteracted&&this.defaultSelected){let e=this.selected;this.selected=this.defaultSelected,this.requestUpdate(`selected`,e)}}updated(e){e.has(`disabled`)&&(this.setAttribute(`aria-disabled`,this.disabled?`true`:`false`),this.customStates.set(`disabled`,this.disabled)),e.has(`selected`)&&(this.setAttribute(`aria-selected`,this.selected?`true`:`false`),this.customStates.set(`selected`,this.selected)),e.has(`value`)&&(typeof this.value!=`string`&&(this.value=String(this.value)),this.handleDefaultSlotChange()),e.has(`current`)&&this.customStates.set(`current`,this.current),super.updated(e)}async firstUpdated(e){if(super.firstUpdated(e),this.didSSR&&!this.hasUpdated&&await this.updateComplete,this.syncDefaultSelected(),this.selected&&!this.defaultSelected){let e=this.closest(`wa-select, wa-combobox`);e&&!e.hasInteracted&&(await customElements.whenDefined(e?.localName),await e.updateComplete,e.selectionChanged?.())}}updateDefaultLabel(){let e=this.cachedDefaultLabel;this.cachedDefaultLabel=ut(this).trim(),this.isDefaultLabelDirty=!1;let t=this.cachedDefaultLabel!==e;return!this._label&&t&&this.requestUpdate(`label`,e),t}render(){let n=this.selected;return this.didSSR&&!this.hasUpdated?(this.updateComplete.then(()=>{this.requestUpdate()}),t):e`
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
    `}};F.css=lt,c([m(`.label`)],F.prototype,`defaultSlot`,2),c([l()],F.prototype,`current`,2),c([o({reflect:!0})],F.prototype,`value`,2),c([o({type:Boolean})],F.prototype,`disabled`,2),c([o({type:Boolean,attribute:!1})],F.prototype,`selected`,2),c([o({type:Boolean,attribute:`selected`})],F.prototype,`defaultSelected`,2),c([o()],F.prototype,`label`,1),F=c([i(`wa-option`)],F);var dt=class extends Event{constructor(){super(`wa-reposition`,{bubbles:!0,cancelable:!1,composed:!0})}},ft=r`
  :host {
    --arrow-color: black;
    --arrow-size: var(--wa-tooltip-arrow-size);
    --popup-border-width: 0px;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45) to calculate the length of the arrow after rotation.
     *
     * The diamond will be translated inward by --arrow-base-offset, the border thickness, to centralise it on
     * the inner edge of the popup border. This also means we need to increase the size of the arrow by the
     * same amount to compensate.
     *
     * A diamond shaped clipping mask is used to avoid overlap of popup content. This extends slightly inward so
     * the popup border is covered with no sub-pixel rounding artifacts. The diamond corners are mitred at 22.5º
     * to properly merge any arrow border with the popup border. The constant 1.4142 is derived from 1 + tan(22.5).
     *
     */
    --arrow-base-offset: var(--popup-border-width);
    --arrow-size-diagonal: calc((var(--arrow-size) + var(--arrow-base-offset)) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));
    --arrow-size-div: calc(var(--arrow-size-diagonal) * 2);
    --arrow-clipping-corner: calc(var(--arrow-base-offset) * 1.4142);

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);

    /* Clear UA styles for [popover] */
    :where(&) {
      inset: unset;
      padding: unset;
      margin: unset;
      width: unset;
      height: unset;
      color: unset;
      background: unset;
      border: unset;
      overflow: unset;
    }
  }

  .popup-fixed {
    position: fixed;
  }

  .popup:not(.popup-active) {
    display: none;
  }

  .arrow {
    position: absolute;
    width: var(--arrow-size-div);
    height: var(--arrow-size-div);
    background: var(--arrow-color);
    z-index: 3;
    clip-path: polygon(
      var(--arrow-clipping-corner) 100%,
      var(--arrow-base-offset) calc(100% - var(--arrow-base-offset)),
      calc(var(--arrow-base-offset) - 2px) calc(100% - var(--arrow-base-offset)),
      calc(100% - var(--arrow-base-offset)) calc(var(--arrow-base-offset) - 2px),
      calc(100% - var(--arrow-base-offset)) var(--arrow-base-offset),
      100% var(--arrow-clipping-corner),
      100% 100%
    );
    rotate: 45deg;
  }

  :host([data-current-placement|='left']) .arrow {
    rotate: -45deg;
  }

  :host([data-current-placement|='right']) .arrow {
    rotate: 135deg;
  }

  :host([data-current-placement|='bottom']) .arrow {
    rotate: 225deg;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge-visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: 899;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }

  /* Built-in animations */
  .show {
    animation: show var(--show-duration) ease;
  }

  .hide {
    animation: show var(--hide-duration) ease reverse;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .show-with-scale {
    animation: show-with-scale var(--show-duration) ease;
  }

  .hide-with-scale {
    animation: show-with-scale var(--hide-duration) ease reverse;
  }

  @keyframes show-with-scale {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
`,I=Math.min,L=Math.max,pt=Math.round,mt=Math.floor,R=e=>({x:e,y:e}),ht={left:`right`,right:`left`,bottom:`top`,top:`bottom`};function gt(e,t,n){return L(e,I(t,n))}function z(e,t){return typeof e==`function`?e(t):e}function B(e){return e.split(`-`)[0]}function V(e){return e.split(`-`)[1]}function _t(e){return e===`x`?`y`:`x`}function vt(e){return e===`y`?`height`:`width`}function H(e){let t=e[0];return t===`t`||t===`b`?`y`:`x`}function yt(e){return _t(H(e))}function bt(e,t,n){n===void 0&&(n=!1);let r=V(e),i=yt(e),a=vt(i),o=i===`x`?r===(n?`end`:`start`)?`right`:`left`:r===`start`?`bottom`:`top`;return t.reference[a]>t.floating[a]&&(o=kt(o)),[o,kt(o)]}function xt(e){let t=kt(e);return[St(e),t,St(t)]}function St(e){return e.includes(`start`)?e.replace(`start`,`end`):e.replace(`end`,`start`)}var Ct=[`left`,`right`],wt=[`right`,`left`],Tt=[`top`,`bottom`],Et=[`bottom`,`top`];function Dt(e,t,n){switch(e){case`top`:case`bottom`:return n?t?wt:Ct:t?Ct:wt;case`left`:case`right`:return t?Tt:Et;default:return[]}}function Ot(e,t,n,r){let i=V(e),a=Dt(B(e),n===`start`,r);return i&&(a=a.map(e=>e+`-`+i),t&&(a=a.concat(a.map(St)))),a}function kt(e){let t=B(e);return ht[t]+e.slice(t.length)}function At(e){return{top:e.top??0,right:e.right??0,bottom:e.bottom??0,left:e.left??0}}function jt(e){return typeof e==`number`?{top:e,right:e,bottom:e,left:e}:At(e)}function Mt(e){let{x:t,y:n,width:r,height:i}=e;return{width:r,height:i,top:n,left:t,right:t+r,bottom:n+i,x:t,y:n}}function Nt(e,t,n){let{reference:r,floating:i}=e,a=H(t),o=yt(t),s=vt(o),c=B(t),l=a===`y`,u=r.x+r.width/2-i.width/2,d=r.y+r.height/2-i.height/2,f=r[s]/2-i[s]/2,p;switch(c){case`top`:p={x:u,y:r.y-i.height};break;case`bottom`:p={x:u,y:r.y+r.height};break;case`right`:p={x:r.x+r.width,y:d};break;case`left`:p={x:r.x-i.width,y:d};break;default:p={x:r.x,y:r.y}}let m=V(t);return m&&(p[o]+=f*(m===`end`?1:-1)*(n&&l?-1:1)),p}async function Pt(e,t){t===void 0&&(t={});let{x:n,y:r,platform:i,rects:a,elements:o,strategy:s}=e,{boundary:c=`clippingAncestors`,rootBoundary:l=`viewport`,elementContext:u=`floating`,altBoundary:d=!1,padding:f=0}=z(t,e),p=jt(f),m=o[d?u===`floating`?`reference`:`floating`:u],h=Mt(await i.getClippingRect({element:await(i.isElement==null?void 0:i.isElement(m))??!0?m:m.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(o.floating)),boundary:c,rootBoundary:l,strategy:s})),g=u===`floating`?{x:n,y:r,width:a.floating.width,height:a.floating.height}:a.reference,_=await(i.getOffsetParent==null?void 0:i.getOffsetParent(o.floating)),v=await(i.isElement==null?void 0:i.isElement(_))&&await(i.getScale==null?void 0:i.getScale(_))||{x:1,y:1},y=Mt(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:o,rect:g,offsetParent:_,strategy:s}):g);return{top:(h.top-y.top+p.top)/v.y,bottom:(y.bottom-h.bottom+p.bottom)/v.y,left:(h.left-y.left+p.left)/v.x,right:(y.right-h.right+p.right)/v.x}}var Ft=50,It=async(e,t,n)=>{let{placement:r=`bottom`,strategy:i=`absolute`,middleware:a=[],platform:o}=n,s=o.detectOverflow?o:{...o,detectOverflow:Pt},c=await(o.isRTL==null?void 0:o.isRTL(t)),l=await o.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:d}=Nt(l,r,c),f=r,p=0,m={};for(let n=0;n<a.length;n++){let h=a[n];if(!h)continue;let{name:g,fn:_}=h,{x:v,y,data:b,reset:x}=await _({x:u,y:d,initialPlacement:r,placement:f,strategy:i,middlewareData:m,rects:l,platform:s,elements:{reference:e,floating:t}});u=v??u,d=y??d,m[g]={...m[g],...b},x&&p<Ft&&(p++,typeof x==`object`&&(x.placement&&(f=x.placement),x.rects&&(l=x.rects===!0?await o.getElementRects({reference:e,floating:t,strategy:i}):x.rects),{x:u,y:d}=Nt(l,f,c)),n=-1)}return{x:u,y:d,placement:f,strategy:i,middlewareData:m}},Lt=e=>({name:`arrow`,options:e,async fn(t){let{x:n,y:r,placement:i,rects:a,platform:o,elements:s,middlewareData:c}=t,{element:l,padding:u=0}=z(e,t)||{};if(l==null)return{};let d=jt(u),f={x:n,y:r},p=yt(i),m=vt(p),h=await o.getDimensions(l),g=p===`y`,_=g?`top`:`left`,v=g?`bottom`:`right`,y=g?`clientHeight`:`clientWidth`,b=a.reference[m]+a.reference[p]-f[p]-a.floating[m],x=f[p]-a.reference[p],S=await(o.getOffsetParent==null?void 0:o.getOffsetParent(l)),C=S?S[y]:0;(!C||!await(o.isElement==null?void 0:o.isElement(S)))&&(C=s.floating[y]||a.floating[m]);let w=b/2-x/2,T=C/2-h[m]/2-1,E=I(d[_],T),ee=I(d[v],T),D=C-h[m]-ee,O=C/2-h[m]/2+w,te=gt(E,O,D),ne=!c.arrow&&V(i)!=null&&O!==te&&a.reference[m]/2-(O<E?E:ee)-h[m]/2<0,k=ne?O<E?O-E:O-D:0;return{[p]:f[p]+k,data:{[p]:te,centerOffset:O-te-k,...ne&&{alignmentOffset:k}},reset:ne}}}),Rt=function(e){return e===void 0&&(e={}),{name:`flip`,options:e,async fn(t){var n;let{placement:r,middlewareData:i,rects:a,initialPlacement:o,platform:s,elements:c}=t,{mainAxis:l=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:f=`bestFit`,fallbackAxisSideDirection:p=`none`,flipAlignment:m=!0,...h}=z(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};let g=B(r),_=H(o),v=B(o)===o,y=await(s.isRTL==null?void 0:s.isRTL(c.floating)),b=d||(v||!m?[kt(o)]:xt(o)),x=p!==`none`;!d&&x&&b.push(...Ot(o,m,p,y));let S=[o,...b],C=await s.detectOverflow(t,h),w=[],T=i.flip?.overflows||[];if(l&&w.push(C[g]),u){let e=bt(r,a,y);w.push(C[e[0]],C[e[1]])}if(T=[...T,{placement:r,overflows:w}],!w.every(e=>e<=0)){let e=(i.flip?.index||0)+1,t=S[e];if(t&&(u!==`alignment`||_===H(t)||T.every(e=>H(e.placement)!==_||e.overflows[0]>0)))return{data:{index:e,overflows:T},reset:{placement:t}};let n=T.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0]?.placement;if(!n)switch(f){case`bestFit`:{let e=T.filter(e=>{if(x){let t=H(e.placement);return t===_||t===`y`}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0]?.[0];e&&(n=e);break}case`initialPlacement`:n=o}if(r!==n)return{reset:{placement:n}}}return{}}}},zt=new Set([`left`,`top`]);async function Bt(e,t){let{placement:n,platform:r,elements:i}=e,a=await(r.isRTL==null?void 0:r.isRTL(i.floating)),o=B(n),s=V(n),c=H(n)===`y`,l=zt.has(o)?-1:1,u=a&&c?-1:1,d=z(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}=typeof d==`number`?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return s&&typeof m==`number`&&(p=s===`end`?m*-1:m),c?{x:p*u,y:f*l}:{x:f*l,y:p*u}}var Vt=function(e){return e===void 0&&(e=0),{name:`offset`,options:e,async fn(t){var n;let{x:r,y:i,placement:a,middlewareData:o}=t,s=await Bt(t,e);return a===o.offset?.placement&&(n=o.arrow)!=null&&n.alignmentOffset?{}:{x:r+s.x,y:i+s.y,data:{...s,placement:a}}}}},Ht=function(e){return e===void 0&&(e={}),{name:`shift`,options:e,async fn(t){let{x:n,y:r,placement:i,platform:a}=t,{mainAxis:o=!0,crossAxis:s=!1,limiter:c={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=z(e,t),u={x:n,y:r},d=await a.detectOverflow(t,l),f=H(i),p=_t(f),m=u[p],h=u[f],g=(e,t)=>gt(t+d[e===`y`?`top`:`left`],t,t-d[e===`y`?`bottom`:`right`]);o&&(m=g(p,m)),s&&(h=g(f,h));let _=c.fn({...t,[p]:m,[f]:h});return{..._,data:{x:_.x-n,y:_.y-r,enabled:{[p]:o,[f]:s}}}}}},Ut=function(e){return e===void 0&&(e={}),{name:`size`,options:e,async fn(t){let{placement:n,rects:r,platform:i,elements:a}=t,{apply:o=()=>{},...s}=z(e,t),c=await i.detectOverflow(t,s),l=B(n),u=V(n),d=H(n)===`y`,{width:f,height:p}=r.floating,m,h;l===`top`||l===`bottom`?(m=l,h=u===(await(i.isRTL==null?void 0:i.isRTL(a.floating))?`start`:`end`)?`left`:`right`):(h=l,m=u===`end`?`top`:`bottom`);let g=p-c.top-c.bottom,_=f-c.left-c.right,v=I(p-c[m],g),y=I(f-c[h],_),b=t.middlewareData.shift,x=!b,S=v,C=y;b!=null&&b.enabled.x&&(C=_),b!=null&&b.enabled.y&&(S=g),x&&!u&&(d?C=f-2*L(c.left,c.right):S=p-2*L(c.top,c.bottom)),await o({...t,availableWidth:C,availableHeight:S});let w=await i.getDimensions(a.floating);return f!==w.width||p!==w.height?{reset:{rects:!0}}:{}}}};function Wt(){return typeof window<`u`}function Gt(e){return Kt(e)?(e.nodeName||``).toLowerCase():`#document`}function U(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function W(e){return((Kt(e)?e.ownerDocument:e.document)||window.document)?.documentElement}function Kt(e){return Wt()?e instanceof Node||e instanceof U(e).Node:!1}function G(e){return Wt()?e instanceof Element||e instanceof U(e).Element:!1}function K(e){return Wt()?e instanceof HTMLElement||e instanceof U(e).HTMLElement:!1}function qt(e){return!Wt()||typeof ShadowRoot>`u`?!1:e instanceof ShadowRoot||e instanceof U(e).ShadowRoot}function Jt(e){let{overflow:t,overflowX:n,overflowY:r,display:i}=J(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&i!==`inline`&&i!==`contents`}function Yt(e){return/^(table|td|th)$/.test(Gt(e))}function Xt(e){try{if(e.matches(`:popover-open`))return!0}catch{}try{return e.matches(`:modal`)}catch{return!1}}var Zt=/transform|translate|scale|rotate|perspective|filter/,Qt=/paint|layout|strict|content/,q=e=>!!e&&e!==`none`,$t;function en(e){let t=G(e)?J(e):e;return q(t.transform)||q(t.translate)||q(t.scale)||q(t.rotate)||q(t.perspective)||!nn()&&(q(t.backdropFilter)||q(t.filter))||Zt.test(t.willChange||``)||Qt.test(t.contain||``)}function tn(e){let t=Y(e);for(;K(t)&&!rn(t);){if(en(t))return t;if(Xt(t))return null;t=Y(t)}return null}function nn(){return $t??=typeof CSS<`u`&&CSS.supports&&CSS.supports(`-webkit-backdrop-filter`,`none`),$t}function rn(e){return/^(html|body|#document)$/.test(Gt(e))}function J(e){return U(e).getComputedStyle(e)}function an(e){return G(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function Y(e){if(Gt(e)===`html`)return e;let t=e.assignedSlot||e.parentNode||qt(e)&&e.host||W(e);return qt(t)?t.host:t}function on(e){let t=Y(e);return rn(t)?(e.ownerDocument||e).body:K(t)&&Jt(t)?t:on(t)}function sn(e,t,n){t===void 0&&(t=[]),n===void 0&&(n=!0);let r=on(e),i=r===e.ownerDocument?.body,a=U(r);if(i){let e=cn(a);return t.concat(a,a.visualViewport||[],Jt(r)?r:[],e&&n?sn(e):[])}return t.concat(r,sn(r,[],n))}function cn(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function ln(e){let t=J(e),n=parseFloat(t.width)||0,r=parseFloat(t.height)||0,i=K(e),a=i?e.offsetWidth:n,o=i?e.offsetHeight:r,s=pt(n)!==a||pt(r)!==o;return s&&(n=a,r=o),{width:n,height:r,$:s}}function un(e){return G(e)?e:e.contextElement}function dn(e){let t=un(e);if(!K(t))return R(1);let n=t.getBoundingClientRect(),{width:r,height:i,$:a}=ln(t),o=(a?pt(n.width):n.width)/r,s=(a?pt(n.height):n.height)/i;return(!o||!Number.isFinite(o))&&(o=1),(!s||!Number.isFinite(s))&&(s=1),{x:o,y:s}}var fn=R(0);function pn(e){let t=U(e);return!nn()||!t.visualViewport?fn:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function mn(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===U(e)}function X(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=un(e),o=R(1);t&&(r?G(r)&&(o=dn(r)):o=dn(e));let s=mn(a,n,r)?pn(a):R(0),c=(i.left+s.x)/o.x,l=(i.top+s.y)/o.y,u=i.width/o.x,d=i.height/o.y;if(a&&r){let e=U(a),t=G(r)?U(r):r,n=e,i=cn(n);for(;i&&t!==n;){let e=dn(i),t=i.getBoundingClientRect(),r=J(i),a=t.left+(i.clientLeft+parseFloat(r.paddingLeft))*e.x,o=t.top+(i.clientTop+parseFloat(r.paddingTop))*e.y;c*=e.x,l*=e.y,u*=e.x,d*=e.y,c+=a,l+=o,n=U(i),i=cn(n)}}return Mt({width:u,height:d,x:c,y:l})}function hn(e,t){let n=an(e).scrollLeft;return t?t.left+n:X(W(e)).left+n}function gn(e,t){let n=e.getBoundingClientRect();return{x:n.left+t.scrollLeft-hn(e,n),y:n.top+t.scrollTop}}function _n(e){let{elements:t,rect:n,offsetParent:r,strategy:i}=e,a=i===`fixed`,o=W(r),s=t?Xt(t.floating):!1;if(r===o||s&&a)return n;let c={scrollLeft:0,scrollTop:0},l=R(1),u=R(0),d=K(r);if((d||!a)&&((Gt(r)!==`body`||Jt(o))&&(c=an(r)),d)){let e=X(r);l=dn(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}let f=o&&!d&&!a?gn(o,c):R(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+u.x+f.x,y:n.y*l.y-c.scrollTop*l.y+u.y+f.y}}function vn(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function yn(e){let t=an(e),n=e.ownerDocument.body,r=L(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),i=L(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight),a=-t.scrollLeft+hn(e),o=-t.scrollTop;return J(n).direction===`rtl`&&(a+=L(e.clientWidth,n.clientWidth)-r),{width:r,height:i,x:a,y:o}}var bn=25;function xn(e,t,n){n===void 0&&(n=`viewport`);let r=n===`layoutViewport`,i=U(e),a=W(e),o=i.visualViewport,s=a.clientWidth,c=a.clientHeight,l=0,u=0;if(o){let e=!nn()||t===`fixed`;r?e||(l=-o.offsetLeft,u=-o.offsetTop):(s=o.width,c=o.height,e&&(l=o.offsetLeft,u=o.offsetTop))}if(hn(a)<=0){let e=a.ownerDocument,t=e.body,n=getComputedStyle(t),r=e.compatMode===`CSS1Compat`&&parseFloat(n.marginLeft)+parseFloat(n.marginRight)||0,i=Math.abs(a.clientWidth-t.clientWidth-r),o=getComputedStyle(a).scrollbarGutter===`stable both-edges`?i/2:i;o<=bn&&(s-=o)}return{width:s,height:c,x:l,y:u}}function Sn(e,t){let n=X(e,!0,t===`fixed`),r=n.top+e.clientTop,i=n.left+e.clientLeft,a=dn(e);return{width:e.clientWidth*a.x,height:e.clientHeight*a.y,x:i*a.x,y:r*a.y}}function Cn(e,t,n){let r;if(t===`viewport`||t===`layoutViewport`)r=xn(e,n,t);else if(t===`document`)r=yn(W(e));else if(G(t))r=Sn(t,n);else{let n=pn(e);r={x:t.x-n.x,y:t.y-n.y,width:t.width,height:t.height}}return Mt(r)}function wn(e,t){let n=t.get(e);if(n)return n;let r=sn(e,[],!1).filter(e=>G(e)&&Gt(e)!==`body`),i=null,a=J(e).position===`fixed`,o=a?Y(e):e;for(;G(o)&&!rn(o);){let e=J(o),t=en(o),n=i?i.position:a?`fixed`:``;!t&&(n===`fixed`||n===`absolute`&&e.position===`static`)?r=r.filter(e=>e!==o):i=e,o=Y(o)}return t.set(e,r),r}function Tn(e){let{element:t,boundary:n,rootBoundary:r,strategy:i}=e,a=[...n===`clippingAncestors`?Xt(t)?[]:wn(t,this._c):[].concat(n),r],o=Cn(t,a[0],i),s=o.top,c=o.right,l=o.bottom,u=o.left;for(let e=1;e<a.length;e++){let n=Cn(t,a[e],i);s=L(n.top,s),c=I(n.right,c),l=I(n.bottom,l),u=L(n.left,u)}return{width:c-u,height:l-s,x:u,y:s}}function En(e){let{width:t,height:n}=ln(e);return{width:t,height:n}}function Dn(e,t,n){let r=K(t),i=W(t),a=n===`fixed`,o=X(e,!0,a,t),s={scrollLeft:0,scrollTop:0},c=R(0);if((r||!a)&&((Gt(t)!==`body`||Jt(i))&&(s=an(t)),r)){let e=X(t,!0,a,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!r&&i&&(c.x=hn(i));let l=i&&!r&&!a?gn(i,s):R(0);return{x:o.left+s.scrollLeft-c.x-l.x,y:o.top+s.scrollTop-c.y-l.y,width:o.width,height:o.height}}function On(e){return J(e).position===`static`}function kn(e,t){if(!K(e)||J(e).position===`fixed`)return null;if(t)return t(e);let n=e.offsetParent;return W(e)===n&&(n=n.ownerDocument.body),n}function An(e,t){let n=U(e);if(Xt(e))return n;if(!K(e)){let t=Y(e);for(;t&&!rn(t);){if(G(t)&&!On(t))return t;t=Y(t)}return n}let r=kn(e,t);for(;r&&Yt(r)&&On(r);)r=kn(r,t);return r&&rn(r)&&On(r)&&!en(r)?n:r||tn(e)||n}var jn=async function(e){let t=this.getOffsetParent||An,n=this.getDimensions,r=await n(e.floating);return{reference:Dn(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function Mn(e){return J(e).direction===`rtl`}var Nn={convertOffsetParentRelativeRectToViewportRelativeRect:_n,getDocumentElement:W,getClippingRect:Tn,getOffsetParent:An,getElementRects:jn,getClientRects:vn,getDimensions:En,getScale:dn,isElement:G,isRTL:Mn};function Pn(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function Fn(e,t,n){let r=null,i,a=W(e);function o(){var e;clearTimeout(i),(e=r)==null||e.disconnect(),r=null}function s(n,c){n===void 0&&(n=!1),c===void 0&&(c=1),o();let l=e.getBoundingClientRect(),{left:u,top:d,width:f,height:p}=l;if(n||t(),!f||!p)return;let m=mt(d),h=mt(a.clientWidth-(u+f)),g=mt(a.clientHeight-(d+p)),_=mt(u),v={rootMargin:-m+`px `+-h+`px `+-g+`px `+-_+`px`,threshold:L(0,I(1,c))||1},y=!0;function b(t){let n=t[0].intersectionRatio;if(!Pn(l,e.getBoundingClientRect()))return s();if(n!==c){if(!y)return s();n?s(!1,n):i=setTimeout(()=>{s(!1,1e-7)},1e3)}y=!1}try{r=new IntersectionObserver(b,{...v,root:a.ownerDocument})}catch{r=new IntersectionObserver(b,v)}r.observe(e)}let c=U(e),l=()=>s(n);return c.addEventListener(`resize`,l),s(!0),()=>{c.removeEventListener(`resize`,l),o()}}function In(e,t,n,r){r===void 0&&(r={});let{ancestorScroll:i=!0,ancestorResize:a=!0,elementResize:o=typeof ResizeObserver==`function`,layoutShift:s=typeof IntersectionObserver==`function`,animationFrame:c=!1}=r,l=un(e),u=i||a?[...l?sn(l):[],...t?sn(t):[]]:[];u.forEach(e=>{i&&e.addEventListener(`scroll`,n),a&&e.addEventListener(`resize`,n)});let d=l&&s?Fn(l,n,a):null,f=-1,p=null;o&&(p=new ResizeObserver(e=>{let[r]=e;r&&r.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(f),f=requestAnimationFrame(()=>{var e;(e=p)==null||e.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let m,h=c?X(e):null;c&&g();function g(){let t=X(e);h&&!Pn(h,t)&&n(),h=t,m=requestAnimationFrame(g)}return n(),()=>{var e;u.forEach(e=>{i&&e.removeEventListener(`scroll`,n),a&&e.removeEventListener(`resize`,n)}),d?.(),(e=p)==null||e.disconnect(),p=null,c&&cancelAnimationFrame(m)}}var Ln=Vt,Rn=Ht,zn=Rt,Bn=Ut,Vn=Lt,Hn=(e,t,n)=>{let r=new Map,i=n??{},a={...Nn,...i.platform,_c:r};return It(e,t,{...i,platform:a})};function Un(e){return Gn(e)}function Wn(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function Gn(e){for(let t=e;t;t=Wn(t))if(t instanceof Element&&getComputedStyle(t).display===`none`)return null;for(let t=Wn(e);t;t=Wn(t)){if(!(t instanceof Element))continue;let e=getComputedStyle(t);if(e.display!==`contents`&&(e.position!==`static`||en(e)||t.tagName===`BODY`))return t}return null}function Kn(e){return typeof e==`object`&&!!e&&`getBoundingClientRect`in e&&(`contextElement`in e?e instanceof Element:!0)}var qn=!!globalThis?.HTMLElement?.prototype.hasOwnProperty(`popover`),Z=class extends s{constructor(){super(...arguments),this.localize=new f(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement=`top`,this.boundary=`viewport`,this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement=`anchor`,this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements=``,this.flipFallbackStrategy=`best-fit`,this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){let e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes(`top`)||this.placement.includes(`bottom`),r=0,i=0,a=0,o=0,s=0,c=0,l=0,u=0;n?e.top<t.top?(r=e.left,i=e.bottom,a=e.right,o=e.bottom,s=t.left,c=t.top,l=t.right,u=t.top):(r=t.left,i=t.bottom,a=t.right,o=t.bottom,s=e.left,c=e.top,l=e.right,u=e.top):e.left<t.left?(r=e.right,i=e.top,a=t.left,o=t.top,s=e.right,c=e.bottom,l=t.left,u=t.bottom):(r=t.right,i=t.top,a=e.left,o=e.top,s=t.right,c=t.bottom,l=e.left,u=e.bottom),this.style.setProperty(`--hover-bridge-top-left-x`,`${r}px`),this.style.setProperty(`--hover-bridge-top-left-y`,`${i}px`),this.style.setProperty(`--hover-bridge-top-right-x`,`${a}px`),this.style.setProperty(`--hover-bridge-top-right-y`,`${o}px`),this.style.setProperty(`--hover-bridge-bottom-left-x`,`${s}px`),this.style.setProperty(`--hover-bridge-bottom-left-y`,`${c}px`),this.style.setProperty(`--hover-bridge-bottom-right-x`,`${l}px`),this.style.setProperty(`--hover-bridge-bottom-right-y`,`${u}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=qn,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has(`active`)&&(this.active?this.start():this.stop()),e.has(`anchor`)&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor==`string`){let e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchorEl=this.anchor instanceof Element||Kn(this.anchor)?this.anchor:this.querySelector(`[slot="anchor"]`);this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){this.anchorEl&&this.active&&this.isConnected&&(this.popup?.showPopover?.(),this.cleanup=In(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute(`data-current-placement`),this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;let e=[Ln({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(Bn({apply:({rects:e})=>{let t=this.sync===`width`||this.sync===`both`,n=this.sync===`height`||this.sync===`both`;this.popup.style.width=t?`${e.reference.width}px`:``,this.popup.style.height=n?`${e.reference.height}px`:``}})):(this.popup.style.width=``,this.popup.style.height=``);let t;this.SUPPORTS_POPOVER&&!Kn(this.anchor)&&this.boundary===`scroll`&&(t=sn(this.anchorEl).filter(e=>e instanceof Element)),this.flip&&e.push(zn({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy===`best-fit`?`bestFit`:`initialPlacement`,padding:this.flipPadding})),this.shift&&e.push(Rn({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(Bn({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:e,availableHeight:t})=>{this.autoSize===`vertical`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-height`,`${t}px`):this.style.removeProperty(`--auto-size-available-height`),this.autoSize===`horizontal`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-width`,`${e}px`):this.style.removeProperty(`--auto-size-available-width`)}})):(this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`)),this.arrow&&e.push(Vn({element:this.arrowEl,padding:this.arrowPadding}));let n=this.SUPPORTS_POPOVER?e=>Nn.getOffsetParent(e,Un):Nn.getOffsetParent;Hn(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?`absolute`:`fixed`,platform:{...Nn,getOffsetParent:n}}).then(({x:e,y:t,middlewareData:n,placement:r})=>{let i=this.localize.dir()===`rtl`,a={top:`bottom`,right:`left`,bottom:`top`,left:`right`}[r.split(`-`)[0]];if(this.setAttribute(`data-current-placement`,r),Object.assign(this.popup.style,{left:`${e}px`,top:`${t}px`}),this.arrow){let e=n.arrow.x,t=n.arrow.y,r=``,o=``,s=``,c=``;if(this.arrowPlacement===`start`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;r=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``,o=i?n:``,c=i?``:n}else if(this.arrowPlacement===`end`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;o=i?``:n,c=i?n:``,s=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``}else this.arrowPlacement===`center`?(c=typeof e==`number`?`calc(50% - var(--arrow-size-diagonal))`:``,r=typeof t==`number`?`calc(50% - var(--arrow-size-diagonal))`:``):(c=typeof e==`number`?`${e}px`:``,r=typeof t==`number`?`${t}px`:``);Object.assign(this.arrowEl.style,{top:r,right:o,bottom:s,left:c,[a]:`calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))`})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new dt)}render(){return e`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${d({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${d({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?e`<div part="arrow" class="arrow" role="presentation"></div>`:``}
      </div>
    `}};Z.css=ft,c([m(`.popup`)],Z.prototype,`popup`,2),c([m(`.arrow`)],Z.prototype,`arrowEl`,2),c([o({attribute:!1,type:Boolean})],Z.prototype,`SUPPORTS_POPOVER`,2),c([o()],Z.prototype,`anchor`,2),c([o({type:Boolean,reflect:!0})],Z.prototype,`active`,2),c([o({reflect:!0})],Z.prototype,`placement`,2),c([o()],Z.prototype,`boundary`,2),c([o({type:Number})],Z.prototype,`distance`,2),c([o({type:Number})],Z.prototype,`skidding`,2),c([o({type:Boolean})],Z.prototype,`arrow`,2),c([o({attribute:`arrow-placement`})],Z.prototype,`arrowPlacement`,2),c([o({attribute:`arrow-padding`,type:Number})],Z.prototype,`arrowPadding`,2),c([o({type:Boolean})],Z.prototype,`flip`,2),c([o({attribute:`flip-fallback-placements`,converter:{fromAttribute:e=>e.split(` `).map(e=>e.trim()).filter(e=>e!==``),toAttribute:e=>e.join(` `)}})],Z.prototype,`flipFallbackPlacements`,2),c([o({attribute:`flip-fallback-strategy`})],Z.prototype,`flipFallbackStrategy`,2),c([o({type:Object})],Z.prototype,`flipBoundary`,2),c([o({attribute:`flip-padding`,type:Number})],Z.prototype,`flipPadding`,2),c([o({type:Boolean})],Z.prototype,`shift`,2),c([o({type:Object})],Z.prototype,`shiftBoundary`,2),c([o({attribute:`shift-padding`,type:Number})],Z.prototype,`shiftPadding`,2),c([o({attribute:`auto-size`})],Z.prototype,`autoSize`,2),c([o()],Z.prototype,`sync`,2),c([o({type:Object})],Z.prototype,`autoSizeBoundary`,2),c([o({attribute:`auto-size-padding`,type:Number})],Z.prototype,`autoSizePadding`,2),c([o({attribute:`hover-bridge`,type:Boolean})],Z.prototype,`hoverBridge`,2),Z=c([i(`wa-popup`)],Z);var Jn=r`
  :host {
    --track-size: 0.5em;
    --thumb-width: 1.4em;
    --thumb-height: 1.4em;
    --marker-width: 0.1875em;
    --marker-height: 0.1875em;
  }

  :host([orientation='vertical']) {
    width: auto;
  }

  #label:has(~ .vertical) {
    display: block;
    order: 2;
    max-width: none;
    text-align: center;
  }

  #description:has(~ .vertical) {
    order: 3;
    text-align: center;
  }

  /* Add extra space between slider and label, when present */
  #label.has-label ~ #slider {
    &.horizontal {
      margin-block-start: 0.5em;
    }
    &.vertical {
      margin-block-end: 0.5em;
    }
  }

  #slider {
    touch-action: none;

    &:focus {
      outline: none;
    }

    &:focus-visible:not(.disabled) #thumb,
    &:focus-visible:not(.disabled) #thumb-min,
    &:focus-visible:not(.disabled) #thumb-max {
      outline: var(--wa-focus-ring);
      /* intentionally no offset due to border */
    }
  }

  #track {
    position: relative;
    border-radius: 9999px;
    background: var(--wa-color-neutral-fill-normal);
    isolation: isolate;
  }

  /* Orientation */
  .horizontal #track {
    height: var(--track-size);
  }

  .vertical #track {
    order: 1;
    width: var(--track-size);
    height: 200px;
  }

  /* Disabled */
  .disabled #track {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Indicator */
  #indicator {
    position: absolute;
    border-radius: inherit;
    background-color: var(--wa-form-control-activated-color);

    &:dir(ltr) {
      right: calc(100% - max(var(--start), var(--end)));
      left: min(var(--start), var(--end));
    }

    &:dir(rtl) {
      right: min(var(--start), var(--end));
      left: calc(100% - max(var(--start), var(--end)));
    }
  }

  .horizontal #indicator {
    top: 0;
    height: 100%;
  }

  .vertical #indicator {
    top: calc(100% - var(--end));
    bottom: var(--start);
    left: 0;
    width: 100%;
  }

  /* Thumbs */
  #thumb,
  #thumb-min,
  #thumb-max {
    z-index: 3;
    position: absolute;
    width: var(--thumb-width);
    height: var(--thumb-height);
    border: solid 0.125em var(--wa-color-surface-default);
    border-radius: 50%;
    background-color: var(--wa-form-control-activated-color);
    cursor: pointer;
  }

  .disabled #thumb,
  .disabled #thumb-min,
  .disabled #thumb-max {
    cursor: inherit;
  }

  .horizontal #thumb,
  .horizontal #thumb-min,
  .horizontal #thumb-max {
    top: calc(50% - var(--thumb-height) / 2);

    &:dir(ltr) {
      right: auto;
      left: calc(var(--position) - var(--thumb-width) / 2);
    }

    &:dir(rtl) {
      right: calc(var(--position) - var(--thumb-width) / 2);
      left: auto;
    }
  }

  .vertical #thumb,
  .vertical #thumb-min,
  .vertical #thumb-max {
    bottom: calc(var(--position) - var(--thumb-height) / 2);
    left: calc(50% - var(--thumb-width) / 2);
  }

  /* Range-specific thumb styles */
  :host([range]) {
    #thumb-min:focus-visible,
    #thumb-max:focus-visible {
      z-index: 4; /* Ensure focused thumb appears on top */
      outline: var(--wa-focus-ring);
      /* intentionally no offset due to border */
    }
  }

  /* Markers */
  #markers {
    pointer-events: none;
  }

  .marker {
    z-index: 2;
    position: absolute;
    width: var(--marker-width);
    height: var(--marker-height);
    border-radius: 50%;
    background-color: var(--wa-color-surface-default);
  }

  .marker:first-of-type,
  .marker:last-of-type {
    display: none;
  }

  .horizontal .marker {
    top: calc(50% - var(--marker-height) / 2);
    left: calc(var(--position) - var(--marker-width) / 2);
  }

  .vertical .marker {
    top: calc(var(--position) - var(--marker-height) / 2);
    left: calc(50% - var(--marker-width) / 2);
  }

  /* Marker labels */
  #references {
    position: relative;

    slot {
      display: flex;
      justify-content: space-between;
      height: 100%;
    }

    ::slotted(*) {
      color: var(--wa-color-text-quiet);
      font-size: 0.875em;
      line-height: 1;
    }
  }

  .horizontal {
    #references {
      margin-block-start: 0.5em;
    }
  }

  .vertical {
    display: flex;
    margin-inline: auto;

    #track {
      order: 1;
    }

    #references {
      order: 2;
      width: min-content;
      margin-inline-start: 0.75em;

      slot {
        flex-direction: column;
      }
    }
  }

  .vertical #references slot {
    flex-direction: column;
  }
`;function*Yn(e=document.activeElement){e!=null&&(yield e,`shadowRoot`in e&&e.shadowRoot&&e.shadowRoot.mode!==`closed`&&(yield*Yn(e.shadowRoot.activeElement)))}function Xn(e,t){let n=e.metaKey||e.ctrlKey||e.shiftKey||e.altKey;e.key===`Enter`&&!n&&setTimeout(()=>{!e.defaultPrevented&&!e.isComposing&&er(t)})}var Zn=new Map([[`input`,!0],[`wa-input`,!0],[`wa-tag-input`,!0],[`wa-number-input`,!0],[`wa-otp-input`,!0],[`wa-slider`,!0]]),Qn=new Map([[`button`,!1],[`checkbox`,!1],[`color`,!1],[`date`,!1],[`datetime-local`,!1],[`email`,!0],[`file`,!1],[`hidden`,!1],[`image`,!1],[`month`,!1],[`number`,!0],[`password`,!0],[`radio`,!1],[`range`,!1],[`reset`,!0],[`search`,!0],[`submit`,!1],[`tel`,!0],[`text`,!0],[`time`,!1],[`url`,!0],[`week`,!1]]),$n=e=>{let t=e?.localName;if(!t||!Zn.get(t))return!1;if(t!==`input`&&t!==`wa-input`)return!0;let n=e.type;return!!Qn.get(n)};function er(e){let t=null;if(`form`in e&&(t=e.form),!t&&`getForm`in e&&(t=e.getForm()),!t)return;let n=Array.from(t.elements),r=0;for(let e of n)$n(e)&&(r+=1);if(r===1){t.requestSubmit(null);return}let i=n.find(e=>e.type===`submit`&&!e.matches(`:disabled`));i&&([`input`,`button`].includes(i.localName)?t.requestSubmit(i):i.click())}var tr=typeof window<`u`&&`ontouchstart`in window,nr=class{constructor(e,t){this.isActive=!1,this.isDragging=!1,this.handleDragStart=e=>{let t=`touches`in e?e.touches[0].clientX:e.clientX,n=`touches`in e?e.touches[0].clientY:e.clientY;this.isDragging||!tr&&e.buttons>1||(this.isDragging=!0,document.addEventListener(`pointerup`,this.handleDragStop),document.addEventListener(`pointermove`,this.handleDragMove),document.addEventListener(`pointercancel`,this.handleDragStop),document.addEventListener(`touchend`,this.handleDragStop),document.addEventListener(`touchmove`,this.handleDragMove),document.addEventListener(`touchcancel`,this.handleDragStop),this.options.start(t,n))},this.handleDragStop=e=>{let t=`changedTouches`in e?e.changedTouches[0].clientX:e.clientX,n=`changedTouches`in e?e.changedTouches[0].clientY:e.clientY;this.isDragging=!1,document.removeEventListener(`pointerup`,this.handleDragStop),document.removeEventListener(`pointermove`,this.handleDragMove),document.removeEventListener(`pointercancel`,this.handleDragStop),document.removeEventListener(`touchend`,this.handleDragStop),document.removeEventListener(`touchmove`,this.handleDragMove),document.removeEventListener(`touchcancel`,this.handleDragStop),this.options.stop(t,n)},this.handleDragMove=e=>{let t=`touches`in e?e.touches[0].clientX:e.clientX,n=`touches`in e?e.touches[0].clientY:e.clientY;window.getSelection()?.removeAllRanges(),this.options.move(t,n)},this.element=e,this.options={start:()=>void 0,stop:()=>void 0,move:()=>void 0,...t},this.start()}start(){this.isActive||=(this.element.addEventListener(`pointerdown`,this.handleDragStart),tr&&this.element.addEventListener(`touchstart`,this.handleDragStart),!0)}stop(){document.removeEventListener(`pointerup`,this.handleDragStop),document.removeEventListener(`pointermove`,this.handleDragMove),document.removeEventListener(`pointercancel`,this.handleDragStop),document.removeEventListener(`touchend`,this.handleDragStop),document.removeEventListener(`touchmove`,this.handleDragMove),document.removeEventListener(`touchcancel`,this.handleDragStop),this.element.removeEventListener(`pointerdown`,this.handleDragStart),tr&&this.element.removeEventListener(`touchstart`,this.handleDragStart),this.isActive=!1,this.isDragging=!1}toggle(e){(e===void 0?!this.isActive:e)?this.start():this.stop()}};function rr(e,t,n){let r=(e-t)/n;return Math.abs(r-Math.round(r))>1e-9}var ir=()=>({observedAttributes:[`min`,`max`,`step`],checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]},n=(e,t,n,r)=>{if(typeof document>`u`)return``;let i=document.createElement(`input`);return i.type=`range`,i.min=String(t),i.max=String(n),i.step=String(r),i.value=String(e),i.checkValidity(),i.validationMessage};if(e.isRange){let r=e.minValue,i=e.maxValue;if(r<e.min)return t.isValid=!1,t.invalidKeys.push(`rangeUnderflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be greater than or equal to ${e.min}.`,t;if(i>e.max)return t.isValid=!1,t.invalidKeys.push(`rangeOverflow`),t.message=n(i,e.min,e.max,e.step)||`Value must be less than or equal to ${e.max}.`,t;if(e.step&&e.step!==1){let a=rr(r,e.min,e.step),o=rr(i,e.min,e.step);if(a||o)return t.isValid=!1,t.invalidKeys.push(`stepMismatch`),t.message=n(a?r:i,e.min,e.max,e.step)||`Value must be a multiple of ${e.step}.`,t}}else{let r=e.value;if(r<e.min)return t.isValid=!1,t.invalidKeys.push(`rangeUnderflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be greater than or equal to ${e.min}.`,t;if(r>e.max)return t.isValid=!1,t.invalidKeys.push(`rangeOverflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be less than or equal to ${e.max}.`,t;if(e.step&&e.step!==1&&rr(r,e.min,e.step))return t.isValid=!1,t.invalidKeys.push(`stepMismatch`),t.message=n(r,e.min,e.max,e.step)||`Value must be a multiple of ${e.step}.`,t}return t}}),Q=class extends p{constructor(){super(...arguments),this.draggableThumbMin=null,this.draggableThumbMax=null,this.hasSlotController=new a(this,`hint`,`label`),this.localize=new f(this),this.activeThumb=null,this.lastTrackPosition=null,this.label=``,this.hint=``,this.minValue=0,this.maxValue=50,this.defaultValue=this.getAttribute(`value`)==null?this.minValue:Number(this.getAttribute(`value`)),this._value=null,this.range=!1,this.disabled=!1,this.readonly=!1,this.orientation=`horizontal`,this.size=`m`,this.min=0,this.max=100,this.step=1,this.tooltipDistance=8,this.tooltipPlacement=`top`,this.withMarkers=!1,this.withTooltip=!1,this.withLabel=!1,this.withHint=!1}static get validators(){return[...super.validators,ir()]}get focusableAnchor(){return this.isRange&&this.thumbMin||this.slider}get validationTarget(){return this.focusableAnchor}get value(){return this.valueHasChanged?M(this._value??this.minValue??0,this.min,this.max):M(this._value??this.defaultValue,this.min,this.max)}set value(e){e=Number(e)??this.minValue,this._value!==e&&(this.valueHasChanged=!0,this._value=e)}get isRange(){return this.range}handleSizeChange(){g(this.localName,this.size)}firstUpdated(e){super.firstUpdated(e),this.isRange?(this.draggableThumbMin=new nr(this.thumbMin,{start:()=>{this.activeThumb=`min`,this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.minValue,this.customStates.set(`dragging`,!0),this.showRangeTooltips()},move:(e,t)=>{this.setThumbValueFromCoordinates(e,t,`min`)},stop:()=>{this.minValue!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}}),this.draggableThumbMax=new nr(this.thumbMax,{start:()=>{this.activeThumb=`max`,this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.maxValue,this.customStates.set(`dragging`,!0),this.showRangeTooltips()},move:(e,t)=>{this.setThumbValueFromCoordinates(e,t,`max`)},stop:()=>{this.maxValue!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}}),this.draggableTrack=new nr(this.track,{start:(e,t)=>{if(this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.activeThumb)this.valueWhenDraggingStarted=this.activeThumb===`min`?this.minValue:this.maxValue;else{let n=this.getValueFromCoordinates(e,t),r=Math.abs(n-this.minValue),i=Math.abs(n-this.maxValue);if(r===i){if(n>this.maxValue)this.activeThumb=`max`;else if(n<this.minValue)this.activeThumb=`min`;else{let n=this.localize.dir()===`rtl`,r=this.orientation===`vertical`,i=r?t:e,a=this.lastTrackPosition||i;this.lastTrackPosition=i;let o=i>a!==n&&!r||i<a&&r;this.activeThumb=o?`max`:`min`}}else this.activeThumb=r<=i?`min`:`max`;this.valueWhenDraggingStarted=this.activeThumb===`min`?this.minValue:this.maxValue}this.customStates.set(`dragging`,!0),this.setThumbValueFromCoordinates(e,t,this.activeThumb),this.showRangeTooltips()},move:(e,t)=>{this.activeThumb&&this.setThumbValueFromCoordinates(e,t,this.activeThumb)},stop:()=>{this.activeThumb&&(this.activeThumb===`min`?this.minValue:this.maxValue)!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}})):this.draggableTrack=new nr(this.slider,{start:(e,t)=>{this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.value,this.customStates.set(`dragging`,!0),this.setValueFromCoordinates(e,t),this.showTooltip()},move:(e,t)=>{this.setValueFromCoordinates(e,t)},stop:()=>{this.value!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideTooltip(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0}})}willUpdate(e){this.isRange&&(e.has(`minValue`)||e.has(`maxValue`)||e.has(`min`)||e.has(`max`))&&(this.minValue=M(this.minValue,this.min,this.maxValue),this.maxValue=M(this.maxValue,this.minValue,this.max)),super.willUpdate(e)}updated(e){if(this.isRange&&(e.has(`minValue`)||e.has(`maxValue`))&&this.updateFormValue(),e.has(`disabled`)||e.has(`readonly`)){let e=!(this.disabled||this.readonly);this.isRange&&(this.draggableThumbMin&&this.draggableThumbMin.toggle(e),this.draggableThumbMax&&this.draggableThumbMax.toggle(e)),this.draggableTrack&&this.draggableTrack.toggle(e)}super.updated(e)}formDisabledCallback(e){this.disabled=e}formResetCallback(){this.isRange?(this.minValue=parseFloat(this.getAttribute(`min-value`)??String(this.min)),this.maxValue=parseFloat(this.getAttribute(`max-value`)??String(this.max))):(this._value=null,this.defaultValue=this.defaultValue??parseFloat(this.getAttribute(`value`)??String(this.min))),this.valueHasChanged=!1,this.hasInteracted=!1,super.formResetCallback()}clampAndRoundToStep(e){let t=(String(this.step).split(`.`)[1]||``).replace(/0+$/g,``).length,n=Number(this.step),r=Number(this.min),i=Number(this.max);return e=Math.round(e/n)*n,e=M(e,r,i),parseFloat(e.toFixed(t))}getPercentageFromValue(e){return(e-this.min)/(this.max-this.min)*100}getValueFromCoordinates(e,t){let n=this.localize.dir()===`rtl`,r=this.orientation===`vertical`,{top:i,right:a,bottom:o,left:s,height:c,width:l}=this.trackBoundingClientRect,u=r?t:e,d=r?{start:i,end:o,size:c}:{start:s,end:a,size:l},f=(r||n?d.end-u:u-d.start)/d.size;return this.clampAndRoundToStep(this.min+(this.max-this.min)*f)}handleBlur(){this.isRange?requestAnimationFrame(()=>{let e=this.shadowRoot?.activeElement;e!==this.thumbMin&&e!==this.thumbMax&&this.hideRangeTooltips()}):this.hideTooltip(),this.customStates.set(`focused`,!1),this.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0,composed:!0}))}handleFocus(e){let t=e.target;this.isRange?(t===this.thumbMin?this.activeThumb=`min`:t===this.thumbMax&&(this.activeThumb=`max`),this.showRangeTooltips()):this.showTooltip(),this.customStates.set(`focused`,!0),this.dispatchEvent(new FocusEvent(`focus`,{bubbles:!0,composed:!0}))}handleKeyDown(e){let t=this.localize.dir()===`rtl`,n=e.target;if(this.disabled||this.readonly||this.isRange&&(n===this.thumbMin?this.activeThumb=`min`:n===this.thumbMax&&(this.activeThumb=`max`),!this.activeThumb))return;let r=this.isRange?this.activeThumb===`min`?this.minValue:this.maxValue:this.value,i=r;switch(e.key){case`ArrowUp`:case t?`ArrowLeft`:`ArrowRight`:e.preventDefault(),i=this.clampAndRoundToStep(r+this.step);break;case`ArrowDown`:case t?`ArrowRight`:`ArrowLeft`:e.preventDefault(),i=this.clampAndRoundToStep(r-this.step);break;case`Home`:e.preventDefault(),i=this.isRange&&this.activeThumb===`min`?this.min:this.isRange?this.minValue:this.min;break;case`End`:e.preventDefault(),i=this.isRange&&this.activeThumb===`max`?this.max:this.isRange?this.maxValue:this.max;break;case`PageUp`:e.preventDefault();let n=Math.max(r+(this.max-this.min)/10,r+this.step);i=this.clampAndRoundToStep(n);break;case`PageDown`:e.preventDefault();let a=Math.min(r-(this.max-this.min)/10,r-this.step);i=this.clampAndRoundToStep(a);break;case`Enter`:Xn(e,this);return}i!==r&&(this.isRange?(this.activeThumb===`min`?i>this.maxValue?(this.maxValue=i,this.minValue=i):this.minValue=Math.max(this.min,i):i<this.minValue?(this.minValue=i,this.maxValue=i):this.maxValue=Math.min(this.max,i),this.updateFormValue()):this.value=M(i,this.min,this.max),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0)}handleLabelPointerDown(e){e.preventDefault(),this.disabled||(this.isRange?this.thumbMin?.focus():this.slider.focus())}setValueFromCoordinates(e,t){let n=this.value;this.value=this.getValueFromCoordinates(e,t),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))})}setThumbValueFromCoordinates(e,t,n){let r=this.getValueFromCoordinates(e,t),i=n===`min`?this.minValue:this.maxValue;n===`min`?r>this.maxValue?(this.maxValue=r,this.minValue=r):this.minValue=Math.max(this.min,r):r<this.minValue?(this.minValue=r,this.maxValue=r):this.maxValue=Math.min(this.max,r),i!==(n===`min`?this.minValue:this.maxValue)&&(this.updateFormValue(),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))}))}showTooltip(){this.withTooltip&&this.tooltip&&(this.tooltip.open=!0)}hideTooltip(){this.withTooltip&&this.tooltip&&(this.tooltip.open=!1)}showRangeTooltips(){if(!this.withTooltip)return;let e=this.shadowRoot?.getElementById(`tooltip-thumb-min`),t=this.shadowRoot?.getElementById(`tooltip-thumb-max`);this.activeThumb===`min`?(e&&(e.open=!0),t&&(t.open=!1)):this.activeThumb===`max`&&(t&&(t.open=!0),e&&(e.open=!1))}hideRangeTooltips(){if(!this.withTooltip)return;let e=this.shadowRoot?.getElementById(`tooltip-thumb-min`),t=this.shadowRoot?.getElementById(`tooltip-thumb-max`);e&&(e.open=!1),t&&(t.open=!1)}updateFormValue(e){if(this.isRange){let e=new FormData;e.append(this.name||``,String(this.minValue)),e.append(this.name||``,String(this.maxValue)),this.setValue(e,e);return}super.updateFormValue(e)}focus(){this.isRange?this.thumbMin?.focus():this.slider.focus()}blur(){if(this.isRange){for(let e of Yn())if(e===this.thumbMin){this.thumbMin.blur();break}else if(e===this.thumbMax){this.thumbMax.blur();break}}else this.slider.blur()}stepDown(){if(this.isRange){let e=this.clampAndRoundToStep(this.minValue-this.step);this.minValue=M(e,this.min,this.maxValue),this.updateFormValue()}else{let e=this.clampAndRoundToStep(this.value-this.step);this.value=e}}stepUp(){if(this.isRange){let e=this.clampAndRoundToStep(this.maxValue+this.step);this.maxValue=M(e,this.minValue,this.max),this.updateFormValue()}else{let e=this.clampAndRoundToStep(this.value+this.step);this.value=e}}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n,a=this.hasSlotController.test(`reference`),o=d({xs:this.size===`xs`,s:this.size===`s`||this.size===`small`,m:this.size===`m`||this.size===`medium`,l:this.size===`l`||this.size===`large`,xl:this.size===`xl`,small:this.size===`small`||this.size===`s`,medium:this.size===`medium`||this.size===`m`,large:this.size===`large`||this.size===`l`,horizontal:this.orientation===`horizontal`,vertical:this.orientation===`vertical`,disabled:this.disabled}),s=[];if(this.withMarkers)for(let e=this.min;e<=this.max;e+=this.step)s.push(this.getPercentageFromValue(e));let c=e`
      <label
        id="label"
        part="label"
        for=${this.isRange?`thumb-min`:`text-box`}
        class=${d({vh:!r,"has-label":r})}
        @pointerdown=${this.handleLabelPointerDown}
      >
        <slot name="label">${this.label}</slot>
      </label>
    `,l=e`
      <div
        id="hint"
        part="hint"
        class=${d({"has-slotted":i})}
      >
        <slot name="hint">${this.hint}</slot>
      </div>
    `,u=this.withMarkers?e`
          <div id="markers" part="markers">
            ${s.map(t=>e`<span part="marker" class="marker" style=${T({"--position":`${t}%`})}></span>`)}
          </div>
        `:``,f=a?e`
          <div id="references" part="references" aria-hidden="true">
            <slot name="reference"></slot>
          </div>
        `:``,p=(t,n)=>this.withTooltip?e`
            <wa-tooltip
              id=${`tooltip${t===`thumb`?``:`-`+t}`}
              part="tooltip"
              exportparts="
                base:tooltip__base,
                tooltip:tooltip__tooltip,
                body:tooltip__body,
                arrow:tooltip__arrow
              "
              trigger="manual"
              distance=${this.tooltipDistance}
              placement=${this.tooltipPlacement}
              for=${t}
              activation="manual"
              dir=${this.localize.dir()}
            >
              <span aria-hidden="true">
                ${typeof this.valueFormatter==`function`?this.valueFormatter(n):this.localize.number(n)}
              </span>
            </wa-tooltip>
          `:``;if(this.isRange){let t=M(this.getPercentageFromValue(this.minValue),0,100),n=M(this.getPercentageFromValue(this.maxValue),0,100);return e`
        ${c}

        <div id="slider" part="slider" class=${o}>
          <div id="track" part="track">
            <div
              id="indicator"
              part="indicator"
              style=${T({"--start":`${Math.min(t,n)}%`,"--end":`${Math.max(t,n)}%`})}
            ></div>

            ${u}

            <span
              id="thumb-min"
              part="thumb thumb-min"
              style=${T({"--position":`${t}%`})}
              role="slider"
              aria-valuemin=${this.min}
              aria-valuenow=${this.minValue}
              aria-valuetext=${typeof this.valueFormatter==`function`?this.valueFormatter(this.minValue):this.localize.number(this.minValue)}
              aria-valuemax=${this.max}
              aria-label="${this.label?`${this.label} (minimum value)`:`Minimum value`}"
              aria-orientation=${this.orientation}
              aria-disabled=${this.disabled?`true`:`false`}
              aria-readonly=${this.readonly?`true`:`false`}
              tabindex=${this.disabled?-1:0}
              @blur=${this.handleBlur}
              @focus=${this.handleFocus}
              @keydown=${this.handleKeyDown}
            ></span>

            <span
              id="thumb-max"
              part="thumb thumb-max"
              style=${T({"--position":`${n}%`})}
              role="slider"
              aria-valuemin=${this.min}
              aria-valuenow=${this.maxValue}
              aria-valuetext=${typeof this.valueFormatter==`function`?this.valueFormatter(this.maxValue):this.localize.number(this.maxValue)}
              aria-valuemax=${this.max}
              aria-label="${this.label?`${this.label} (maximum value)`:`Maximum value`}"
              aria-orientation=${this.orientation}
              aria-disabled=${this.disabled?`true`:`false`}
              aria-readonly=${this.readonly?`true`:`false`}
              tabindex=${this.disabled?-1:0}
              @blur=${this.handleBlur}
              @focus=${this.handleFocus}
              @keydown=${this.handleKeyDown}
            ></span>
          </div>

          ${f} ${l}
        </div>

        ${p(`thumb-min`,this.minValue)} ${p(`thumb-max`,this.maxValue)}
      `}{let t=M(this.getPercentageFromValue(this.value),0,100),n=M(this.getPercentageFromValue(typeof this.indicatorOffset==`number`?this.indicatorOffset:this.min),0,100);return e`
        ${c}

        <div
          id="slider"
          part="slider"
          class=${o}
          role="slider"
          aria-disabled=${this.disabled?`true`:`false`}
          aria-readonly=${this.disabled?`true`:`false`}
          aria-orientation=${this.orientation}
          aria-valuemin=${this.min}
          aria-valuenow=${this.value}
          aria-valuetext=${typeof this.valueFormatter==`function`?this.valueFormatter(this.value):this.localize.number(this.value)}
          aria-valuemax=${this.max}
          aria-labelledby="label"
          aria-describedby="hint"
          tabindex=${this.disabled?-1:0}
          @blur=${this.handleBlur}
          @focus=${this.handleFocus}
          @keydown=${this.handleKeyDown}
        >
          <div id="track" part="track">
            <div
              id="indicator"
              part="indicator"
              style=${T({"--start":`${n}%`,"--end":`${t}%`})}
            ></div>

            ${u}
            <span id="thumb" part="thumb" style=${T({"--position":`${t}%`})}></span>
          </div>

          ${f} ${l}
        </div>

        ${p(`thumb`,this.value)}
      `}}};Q.formAssociated=!0,Q.observeSlots=!0,Q.css=[u,w,Jn],c([m(`#slider`)],Q.prototype,`slider`,2),c([m(`#thumb`)],Q.prototype,`thumb`,2),c([m(`#thumb-min`)],Q.prototype,`thumbMin`,2),c([m(`#thumb-max`)],Q.prototype,`thumbMax`,2),c([m(`#track`)],Q.prototype,`track`,2),c([m(`#tooltip`)],Q.prototype,`tooltip`,2),c([o()],Q.prototype,`label`,2),c([o({attribute:`hint`})],Q.prototype,`hint`,2),c([o({reflect:!0})],Q.prototype,`name`,2),c([o({type:Number,attribute:`min-value`})],Q.prototype,`minValue`,2),c([o({type:Number,attribute:`max-value`})],Q.prototype,`maxValue`,2),c([o({attribute:`value`,reflect:!0,type:Number})],Q.prototype,`defaultValue`,2),c([l()],Q.prototype,`value`,1),c([o({type:Boolean,reflect:!0})],Q.prototype,`range`,2),c([o({type:Boolean})],Q.prototype,`disabled`,2),c([o({type:Boolean,reflect:!0})],Q.prototype,`readonly`,2),c([o({reflect:!0})],Q.prototype,`orientation`,2),c([o({reflect:!0})],Q.prototype,`size`,2),c([h(`size`)],Q.prototype,`handleSizeChange`,1),c([o({attribute:`indicator-offset`,type:Number})],Q.prototype,`indicatorOffset`,2),c([o({type:Number})],Q.prototype,`min`,2),c([o({type:Number})],Q.prototype,`max`,2),c([o({type:Number})],Q.prototype,`step`,2),c([o({type:Boolean})],Q.prototype,`autofocus`,2),c([o({attribute:`tooltip-distance`,type:Number})],Q.prototype,`tooltipDistance`,2),c([o({attribute:`tooltip-placement`,reflect:!0})],Q.prototype,`tooltipPlacement`,2),c([o({attribute:`with-markers`,type:Boolean})],Q.prototype,`withMarkers`,2),c([o({attribute:`with-tooltip`,type:Boolean})],Q.prototype,`withTooltip`,2),c([o({attribute:`with-label`,type:Boolean})],Q.prototype,`withLabel`,2),c([o({attribute:`with-hint`,type:Boolean})],Q.prototype,`withHint`,2),c([o({attribute:!1})],Q.prototype,`valueFormatter`,2),Q=c([i(`wa-slider`)],Q);var ar=r`
  :host {
    --max-width: 30ch;

    /** These styles are added so we don't interfere in the DOM. */
    display: inline-block;
    position: absolute;

    /** Defaults for inherited CSS properties */
    color: var(--wa-tooltip-content-color);
    font-size: var(--wa-tooltip-font-size);
    line-height: var(--wa-tooltip-line-height);
    text-align: start;
    white-space: normal;
  }

  .tooltip {
    --arrow-size: var(--wa-tooltip-arrow-size);
    --arrow-color: var(--wa-tooltip-background-color);
  }

  .tooltip::part(popup) {
    z-index: 1000;
  }

  .tooltip[placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .tooltip[placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .tooltip[placement^='left']::part(popup) {
    transform-origin: right;
  }

  .tooltip[placement^='right']::part(popup) {
    transform-origin: left;
  }

  .body {
    display: block;
    width: max-content;
    max-width: var(--max-width);
    border-radius: var(--wa-tooltip-border-radius);
    background-color: var(--wa-tooltip-background-color);
    border: var(--wa-tooltip-border-width) var(--wa-tooltip-border-style) var(--wa-tooltip-border-color);
    padding: 0.25em 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  .tooltip {
    --popup-border-width: var(--wa-tooltip-border-width);

    /* Inset box-shadow, not a border: Safari seams a clip-path edge that runs along a border. */
    &::part(arrow) {
      box-shadow: inset calc(-1 * var(--wa-tooltip-border-width)) calc(-1 * var(--wa-tooltip-border-width)) 0 0
        var(--wa-tooltip-border-color);
    }
  }
`;function or(e,t){for(;t;){if(t===e)return!0;t=t instanceof Element&&t.assignedSlot?t.assignedSlot:t.parentNode?t.parentNode:t instanceof ShadowRoot?t.host:null}return!1}var $=class extends s{constructor(){super(...arguments),this.dismissedByPress=!1,this.placement=`top`,this.disabled=!1,this.distance=8,this.open=!1,this.skidding=0,this.showDelay=150,this.hideDelay=0,this.trigger=`hover focus`,this.withoutArrow=!1,this.for=null,this.anchor=null,this.eventController=new AbortController,this.handleBlur=()=>{this.dismissedByPress=!1,this.hasTrigger(`focus`)&&this.hide()},this.handleClick=()=>{if(this.hasTrigger(`click`)){this.open?this.hide():this.show();return}this.hasTrigger(`manual`)||this.lightDismiss()},this.handleFocus=()=>{this.dismissedByPress||this.hasTrigger(`focus`)&&this.show()},this.handleMouseDown=()=>{this.hasTrigger(`click`)||this.hasTrigger(`manual`)||this.lightDismiss()},this.handleDocumentKeyDown=e=>{this.hasTrigger(`manual`)||e.key===`Escape`&&this.open&&Je(this)&&(e.preventDefault(),e.stopPropagation(),this.hide())},this.handleDocumentClick=e=>{this.hasTrigger(`manual`)||this.anchor&&e.composedPath().includes(this.anchor)||this.hide()},this.handleMouseOver=()=>{this.dismissedByPress||this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>this.show(),this.showDelay))},this.handleMouseOut=e=>{let t=e.relatedTarget,n=!!(t&&this.anchor&&or(this.anchor,t)),r=!!(t&&or(this,t));n||r||(this.dismissedByPress=!1,this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>{this.hide()},this.hideDelay)))}}connectedCallback(){super.connectedCallback(),typeof document<`u`&&(this.eventController.signal.aborted&&(this.eventController=new AbortController),this.addEventListener(`mouseout`,this.handleMouseOut),this.dismissedByPress=!1,this.open&&(this.open=!1,this.updateComplete.then(()=>{this.open=!0})),this.id||=et(`wa-tooltip-`),this.for&&this.anchor?(this.anchor=null,this.handleForChange()):this.for&&this.handleForChange())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),qe(this),this.eventController.abort(),this.anchor&&this.removeFromAriaLabelledBy(this.anchor,this.id)}firstUpdated(e){this.body.hidden=!this.open,this.open&&(this.popup.active=!0,this.popup.reposition()),super.firstUpdated(e)}lightDismiss(){clearTimeout(this.hoverTimeout),this.dismissedByPress=!0,this.hide()}hasTrigger(e){return this.trigger.split(` `).includes(e)}addToAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean);n.includes(t)||(n.push(t),e.setAttribute(`aria-labelledby`,n.join(` `)))}removeFromAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean).filter(e=>e!==t);n.length>0?e.setAttribute(`aria-labelledby`,n.join(` `)):e.removeAttribute(`aria-labelledby`)}async handleOpenChange(){if(this.open){if(this.disabled)return;let e=new He;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.hasTrigger(`manual`)||(document.addEventListener(`keydown`,this.handleDocumentKeyDown,{signal:this.eventController.signal}),document.addEventListener(`click`,this.handleDocumentClick,{signal:this.eventController.signal}),Ke(this)),this.body.hidden=!1,this.popup.active=!0,await Xe(this.popup.popup,`show-with-scale`),this.popup.reposition(),this.dispatchEvent(new Ge)}else{let e=new Ue;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),qe(this),await Xe(this.popup.popup,`hide-with-scale`),this.popup.active=!1,this.body.hidden=!0,this.dispatchEvent(new We)}}handleForChange(){let e=this.getRootNode?.();if(!e)return;let t=this.for?e.getElementById?.(this.for):null,n=this.anchor;if(t===n)return;this.dismissedByPress=!1;let{signal:r}=this.eventController;t&&(this.addToAriaLabelledBy(t,this.id),t.addEventListener(`blur`,this.handleBlur,{capture:!0,signal:r}),t.addEventListener(`focus`,this.handleFocus,{capture:!0,signal:r}),t.addEventListener(`click`,this.handleClick,{signal:r}),t.addEventListener(`mousedown`,this.handleMouseDown,{signal:r}),t.addEventListener(`mouseover`,this.handleMouseOver,{signal:r}),t.addEventListener(`mouseout`,this.handleMouseOut,{signal:r})),n&&(this.removeFromAriaLabelledBy(n,this.id),n.removeEventListener(`blur`,this.handleBlur,{capture:!0}),n.removeEventListener(`focus`,this.handleFocus,{capture:!0}),n.removeEventListener(`click`,this.handleClick),n.removeEventListener(`mousedown`,this.handleMouseDown),n.removeEventListener(`mouseover`,this.handleMouseOver),n.removeEventListener(`mouseout`,this.handleMouseOut)),this.anchor=t}async handleOptionsChange(){this.hasUpdated&&(await this.updateComplete,this.popup.reposition())}handleDisabledChange(){this.disabled&&this.open&&this.hide()}async show(){if(!this.open)return this.open=!0,it(this,`wa-after-show`)}async hide(){if(this.open)return this.open=!1,it(this,`wa-after-hide`)}render(){return e`
      <wa-popup
        part="base tooltip"
        exportparts="
          popup:base__popup,
          arrow:base__arrow
        "
        class=${d({tooltip:!0,"tooltip-open":this.open})}
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        flip
        shift
        ?arrow=${!this.withoutArrow}
        hover-bridge
        .anchor=${this.anchor}
      >
        <div part="body" class="body">
          <slot></slot>
        </div>
      </wa-popup>
    `}};$.css=ar,$.dependencies={"wa-popup":Z},c([m(`slot:not([name])`)],$.prototype,`defaultSlot`,2),c([m(`.body`)],$.prototype,`body`,2),c([m(`wa-popup`)],$.prototype,`popup`,2),c([o()],$.prototype,`placement`,2),c([o({type:Boolean,reflect:!0})],$.prototype,`disabled`,2),c([o({type:Number})],$.prototype,`distance`,2),c([o({type:Boolean,reflect:!0})],$.prototype,`open`,2),c([o({type:Number})],$.prototype,`skidding`,2),c([o({attribute:`show-delay`,type:Number})],$.prototype,`showDelay`,2),c([o({attribute:`hide-delay`,type:Number})],$.prototype,`hideDelay`,2),c([o()],$.prototype,`trigger`,2),c([o({attribute:`without-arrow`,type:Boolean,reflect:!0})],$.prototype,`withoutArrow`,2),c([o()],$.prototype,`for`,2),c([l()],$.prototype,`anchor`,2),c([h(`open`,{waitUntilFirstUpdate:!0})],$.prototype,`handleOpenChange`,1),c([h(`for`)],$.prototype,`handleForChange`,1),c([h([`distance`,`placement`,`skidding`])],$.prototype,`handleOptionsChange`,1),c([h(`disabled`)],$.prototype,`handleDisabledChange`,1),$=c([i(`wa-tooltip`)],$);export{Ce as _,Ze as a,k as b,qe as c,Ue as d,He as f,Ne as g,Be as h,Xe as i,Ge as l,ze as m,M as n,Je as o,Fe as p,Ye as r,Ke as s,it as t,We as u,ve as v,re as x,fe as y};