import{C as e,E as t,M as n,a as r,b as i,c as a,i as o,w as s,y as c}from"./cesium-shim-Dw5GLahM.js";var l=class{constructor(e){this.viewer=e,this.stage_=void 0}get active(){return this.stage_!==void 0}set active(e){let t=this.viewer.scene;if(e){if(this.stage_)return;this.stage_=this.createStage_(t),t.postProcessStages.add(this.stage_),this.activated_(t)}else{if(!this.stage_)return;this.deactivating_(t),t.postProcessStages.remove(this.stage_),this.stage_=void 0}t.requestRender()}createStage_(e){throw Error(`${this.constructor.name} does not implement createStage_`)}activated_(e){}deactivating_(e){}destroy(){this.active=!1}},u=new WeakMap;function d(e,t){clearInterval(t.interval),t.interval=t.rates.length>0?setInterval(()=>ee(e,t),1e3/Math.max(...t.rates)):void 0}function ee(e,t){if(e.isDestroyed()){clearInterval(t.interval),u.delete(e);return}e.requestRender()}function f(e,t){let n=u.get(e);n||(n={rates:[],interval:void 0},u.set(e,n)),n.rates.push(t),d(e,n)}function p(e,t){let n=u.get(e),r=n?n.rates.indexOf(t):-1;!n||r<0||(n.rates.splice(r,1),d(e,n),n.rates.length===0&&u.delete(e))}var m=`// An analog FPV video feed: washed-out colors, color bleeding sideways (the signal carries the
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
`,h=`// random in [0, 1) for a point, without sin, which GPUs compute poorly for large numbers
float hash(vec2 p) {
  vec3 p3 = fract(p.xyx * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// per pixel noise in [0, 1), "interleaved gradient noise" (Jimenez 2014): a dither that
// spreads the sample positions of a blur between neighbouring pixels
float pixelNoise(vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}
`,g=25,_=.4,v=3,y=.07,b=2.5,x=e=>e-Math.floor(e);function S(e,t){let n=x(e*.1031),r=x(t*.1031),i=n,a=n*(r+33.33)+r*(i+33.33)+i*(n+33.33);return n+=a,r+=a,i+=a,x((n+r)*i)}function te(e,t,n){let r=e*_,i=x(r),a=t*(S(Math.floor(r),5)+(S(Math.floor(r)+1,5)-S(Math.floor(r),5))*i*i*(3-2*i)),s=+(S(Math.floor(e*g)%1e3,11)<.015*t),c=Array.from({length:v},(n,r)=>{let i=r*7;return S(Math.floor(e/b+i),i)<t?1-x(e*y*(1+.3*r)+S(i,1)):-1});return o.fromElements(c[0],c[1],c[2],n),{weak:a,breakup:s}}var ne=class extends l{constructor(e,t={}){super(e),this.noise_=t.noise??.5,this.interference_=t.interference??.15,this.weak_=0,this.breakup_=0,this.lineAt_=new o,this.onPreRender_=()=>{let e=te(performance.now()/1e3,this.interference_,this.lineAt_);this.weak_=e.weak,this.breakup_=e.breakup}}createStage_(){return new e({fragmentShader:h+m,uniforms:{time:()=>performance.now()/1e3,noise:()=>this.noise_,interference:()=>this.interference_,weak:()=>this.weak_,breakup:()=>this.breakup_,lineAt:()=>this.lineAt_}})}activated_(e){e.preRender.addEventListener(this.onPreRender_),f(e,g)}deactivating_(e){p(e,g),e.preRender.removeEventListener(this.onPreRender_)}get noise(){return this.noise_}set noise(e){this.noise_=e}get interference(){return this.interference_}set interference(e){this.interference_=e}},re=`// Color isolation: one hue keeps its color, the rest of the scene turns gray. After prod80's
// ReShade Color Isolation (MIT), https://github.com/prod80/prod80-ReShade-Repository
uniform sampler2D colorTexture;
// the hue kept and the half width of the selection, 0 to 1 for the whole circle
uniform float hue;
uniform float range;
// 0 to 1
uniform float strength;
in vec2 v_textureCoordinates;

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 color = clamp(sceneColor.rgb, 0.0, 1.0);
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float h = rgbToHsl(color).x;
  // a triangle around the hue, on the circle
  float r = 1.0 / max(range, 1e-3);
  float weight = max(1.0 - abs((h - hue) * r), 0.0)
    + max(1.0 - abs((h + 1.0 - hue) * r), 0.0)
    + max(1.0 - abs((h - 1.0 - hue) * r), 0.0);
  float w = clamp(weight, 0.0, 1.0);
  float keep = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
  vec3 isolated = mix(vec3(gray), color, keep);
  out_FragColor = vec4(mix(color, isolated, strength), sceneColor.a);
}
`,C=`// Hue (0 to 1, red at 0), saturation and lightness of a color.
vec3 rgbToHsl(vec3 color) {
  float maxc = max(color.r, max(color.g, color.b));
  float minc = min(color.r, min(color.g, color.b));
  float lightness = 0.5 * (maxc + minc);
  float delta = maxc - minc;
  if (delta < 1e-5) {
    return vec3(0.0, 0.0, lightness);
  }
  float saturation = lightness > 0.5 ? delta / (2.0 - maxc - minc) : delta / (maxc + minc);
  float hue = maxc == color.r ? (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0)
    : maxc == color.g ? (color.b - color.r) / delta + 2.0
    : (color.r - color.g) / delta + 4.0;
  return vec3(hue / 6.0, saturation, lightness);
}
`,ie=class extends l{constructor(e,t={}){super(e),this.hue_=t.hue??0,this.range_=t.range??60,this.strength_=t.strength??1}createStage_(){return new e({fragmentShader:C+re,uniforms:{hue:()=>this.hue_/360,range:()=>this.range_/360,strength:()=>this.strength_}})}get hue(){return this.hue_}set hue(e){this.hue_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}},ae=`// A digital FPV video feed and its breakups: clean, slightly punchy colors, until a weak signal
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
`,w=30,oe=2,T=[.4,1.5],E=.25,D=class extends l{constructor(e,t={}){super(e),this.breakup_=t.breakup??.5,this.episode_=void 0,this.updated_=0,this.severity_=0,this.blackout_=0,this.onPreRender_=()=>this.update_()}createStage_(){return new e({fragmentShader:h+ae,uniforms:{severity:()=>this.severity_,blackout:()=>this.blackout_,frame:()=>Math.floor(performance.now()/1e3*w)%1e5}})}activated_(e){this.updated_=performance.now()/1e3,e.preRender.addEventListener(this.onPreRender_),f(e,w)}deactivating_(e){p(e,w),e.preRender.removeEventListener(this.onPreRender_),this.episode_=void 0}update_(){let e=performance.now()/1e3,t=Math.min(e-this.updated_,1);if(this.updated_=e,this.episode_&&e>this.episode_.start+this.episode_.duration&&(this.episode_=void 0),!this.episode_&&Math.random()<1-Math.exp(-this.breakup_/oe*t)){let t=T[0]+Math.random()*(T[1]-T[0]);this.episode_={start:e,duration:t,blackout:Math.random()<.5*this.breakup_}}let n=this.episode_;if(!n){this.severity_=0,this.blackout_=0;return}let r=(e-n.start)/n.duration;this.severity_=Math.max(0,Math.sin(Math.PI*Math.min(r,1)))**.7*(.4+.6*this.breakup_),this.blackout_=n.blackout&&Math.abs(r-.5)*n.duration<E/2?1:0}get breakup(){return this.breakup_}set breakup(e){this.breakup_=e}},se=`// A Betaflight analog OSD, as its MAX7456 chip draws it: 30 columns and 16 rows of 12 x 18
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
`,ce=16.8,le=600,ue=[`ring`,`v`,`heart`],de=class extends l{constructor(e,t={}){super(e),this.opacity_=t.opacity??1,this.reticle_=t.reticle??`v`,this.startTime_=0,this.startHeight_=0}createStage_(t){return new e({fragmentShader:se,uniforms:{opacity:()=>this.opacity_,pitch:()=>c.toDegrees(t.camera.pitch),roll:()=>c.toDegrees(c.negativePiToPi(t.camera.roll)),altitude:()=>t.camera.positionCartographic.height-this.startHeight_,voltage:()=>this.voltage_(),linkQuality:()=>this.linkQuality_(),reticle:()=>Math.max(ue.indexOf(this.reticle_),0)}})}activated_(e){this.startTime_=performance.now()/1e3,this.startHeight_=e.camera.positionCartographic.height}voltage_(){let e=performance.now()/1e3-this.startTime_,t=2.8000000000000007*Math.min(e/le,1),n=.1*Math.max(0,Math.sin(e*.7)*Math.sin(e*.23));return ce-t-n}linkQuality_(){let e=performance.now()/1e3-this.startTime_,t=4*Math.abs(Math.sin(e*.9)*Math.sin(e*.37)),n=Math.sin(e*.11)>.97?35:0;return Math.round(99-t-n)}get opacity(){return this.opacity_}set opacity(e){this.opacity_=e,this.viewer.scene.requestRender()}get reticle(){return this.reticle_}set reticle(e){this.reticle_=e,this.viewer.scene.requestRender()}},fe=`// Black and white infrared film: foliage, which reflects the near infrared, turns bright, the sky
// and water dark. The gray is the lightness raised or lowered by a weight per hue. After prod80's
// ReShade Black & White (MIT), its Infrared preset, https://github.com/prod80/prod80-ReShade-Repository
uniform sampler2D colorTexture;
// 0 to 1
uniform float strength;
in vec2 v_textureCoordinates;

// weights of the red, yellow, green, cyan, blue and magenta hues
const float RED = -1.35;
const float YELLOW = 2.35;
const float GREEN = 1.35;
const float CYAN = -1.35;
const float BLUE = -1.6;
const float MAGENTA = -1.07;
// shape of the hue selections
const float CURVE = 1.5;

float curve(float x, float k) {
  float s = sign(x - 0.5);
  float o = 0.5 * (1.0 + s);
  return o - 0.5 * s * pow(max(2.0 * (o - s * x), 0.0), k);
}

// how much of the hue centered at center there is in hue
float hueWeight(float hue, float center) {
  return curve(max(1.0 - abs((hue - center) * 6.0), 0.0), CURVE);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 hsl = rgbToHsl(clamp(sceneColor.rgb, 0.0, 1.0));
  float h = hsl.x;
  float weight = RED * (hueWeight(h, 0.0) + hueWeight(h, 1.0))
    + YELLOW * hueWeight(h, 1.0 / 6.0)
    + GREEN * hueWeight(h, 2.0 / 6.0)
    + CYAN * hueWeight(h, 3.0 / 6.0)
    + BLUE * hueWeight(h, 4.0 / 6.0)
    + MAGENTA * hueWeight(h, 5.0 / 6.0);
  float saturation = hsl.y * (1.0 - hsl.y) + hsl.y;
  float gray = clamp(hsl.z + hsl.z * weight * saturation * (1.0 - hsl.z), 0.0, 1.0);
  out_FragColor = vec4(mix(sceneColor.rgb, vec3(gray), strength), sceneColor.a);
}
`,O=class extends l{constructor(e,t={}){super(e),this.strength_=t.strength??1}createStage_(){return new e({fragmentShader:C+fe,uniforms:{strength:()=>this.strength_}})}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}},k=`// The jello of a vibrating camera with a rolling shutter: the sensor reads its rows one after
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
`,A=30,j=[1,1.37,2.11,3.07],M=[1,.6,.35,.2],N=M.reduce((e,t)=>e+t,0),P=.015,F=[P,.5*P,.008],I=2*Math.PI,L=[`x`,`y`,`z`,`w`],R=class extends l{constructor(e,t={}){super(e),this.amount_=t.amount??.1,this.frequency_=t.frequency??30,this.offsets_=j.map(()=>[Math.random(),Math.random(),Math.random()].map(e=>e*I)),this.shakeHz_=new r,this.amplitudes_=[new r,new r,new r],this.zoom_=1,this.phases_=[new r,new r,new r],this.updateShape_(),this.onPreRender_=()=>{let e=performance.now()/1e3;j.forEach((t,n)=>{let r=I*(t*this.frequency_*e%1);this.phases_.forEach((e,t)=>{e[L[n]]=(r+this.offsets_[n][t])%I})})}}createStage_(){let t=new e({fragmentShader:k,uniforms:{shakeHz:()=>this.shakeHz_,phaseX:()=>this.phases_[0],phaseY:()=>this.phases_[1],phaseRotation:()=>this.phases_[2],amplitudeX:()=>this.amplitudes_[0],amplitudeY:()=>this.amplitudes_[1],amplitudeRotation:()=>this.amplitudes_[2],zoom:()=>this.zoom_}});return t.enabled=this.amount_>0,t}activated_(e){e.preRender.addEventListener(this.onPreRender_),this.amount_>0&&f(e,A)}deactivating_(e){this.amount_>0&&p(e,A),e.preRender.removeEventListener(this.onPreRender_)}updateShape_(){j.forEach((e,t)=>{this.shakeHz_[L[t]]=e*this.frequency_,this.amplitudes_.forEach((e,n)=>{e[L[t]]=M[t]*F[n]*this.amount_})}),this.zoom_=1+2*N*this.amount_*.023}get amount(){return this.amount_}set amount(e){let t=this.amount_>0;this.amount_=e,this.updateShape_(),this.stage_&&t!==e>0&&(this.stage_.enabled=e>0,(e>0?f:p)(this.viewer.scene,A)),this.viewer.scene.requestRender()}get frequency(){return this.frequency_}set frequency(e){this.frequency_=e,this.updateShape_()}},z=`// The barrel distortion and dark corners of a wide-angle lens, like those of FPV cameras: straight
// lines bend outward away from the middle. The corners stay in place and the middle is
// magnified, so the picture keeps filling the screen.
uniform sampler2D colorTexture;
// 0 to 1
uniform float distortion;
uniform float vignette;
in vec2 v_textureCoordinates;

// strongest distortion: the middle magnified by 1 + this, relative to the corners
const float MAX_DISTORTION = 0.5;

void main() {
  vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
  // from the middle, 1 at the corners
  vec2 fromMiddle = (v_textureCoordinates - 0.5) * aspect / (0.5 * length(aspect));
  float r2 = dot(fromMiddle, fromMiddle);
  float k = distortion * MAX_DISTORTION;
  vec2 uv = 0.5 + (v_textureCoordinates - 0.5) * (1.0 + k * r2) / (1.0 + k);
  vec4 sceneColor = texture(colorTexture, uv);
  float dark = 1.0 - vignette * smoothstep(0.3, 1.0, r2);
  out_FragColor = vec4(sceneColor.rgb * dark, sceneColor.a);
}
`,B=class extends l{constructor(e,t={}){super(e),this.distortion_=t.distortion??.5,this.vignette_=t.vignette??.5}createStage_(){let t=new e({fragmentShader:z,uniforms:{distortion:()=>this.distortion_,vignette:()=>this.vignette_}});return t.enabled=this.enabled_(),t}enabled_(){return this.distortion_>0||this.vignette_>0}get distortion(){return this.distortion_}set distortion(e){this.distortion_=e,this.update_()}get vignette(){return this.vignette_}set vignette(e){this.vignette_=e,this.update_()}update_(){this.stage_&&(this.stage_.enabled=this.enabled_()),this.viewer.scene.requestRender()}},V=new WeakMap;function H(e){let t=e.globe;if(!t)return;let n=V.get(t);if(n){n.count++;return}V.set(t,{count:1,previous:t.depthTestAgainstTerrain}),t.depthTestAgainstTerrain=!0}function U(e){let t=e.globe,n=t&&V.get(t);t&&n&&--n.count===0&&(t.depthTestAgainstTerrain=n.previous,V.delete(t))}var W=`// Eye coordinates of the pixel at uv, from the depth texture; w is 0 for the sky. With a
// logarithmic depth buffer, czm_readDepth's perspective depth is about 1 beyond a few meters,
// so the distance is decoded from the logarithmic depth directly.
vec4 eyeAt(sampler2D depthTexture, vec2 uv) {
  float raw = texture(depthTexture, uv).r;
  // the pixel's view ray, through the near plane
  vec4 ray = czm_inverseProjection * vec4(2.0 * uv - 1.0, -1.0, 1.0);
  ray.xyz /= ray.w;
  if (raw >= 1.0) {
    return vec4(normalize(ray.xyz), 0.0);
  }
#ifdef LOG_DEPTH
  float viewDepth = exp2(raw * czm_log2FarDepthFromNearPlusOne) - 1.0 + czm_currentFrustum.x;
#else
  vec4 eye = czm_inverseProjection * vec4(2.0 * uv - 1.0, 2.0 * raw - 1.0, 1.0);
  float viewDepth = -eye.z / eye.w;
#endif
  return vec4(ray.xyz * (viewDepth / -ray.z), 1.0);
}
`,G=`// Camera motion blur, after "A Reconstruction Filter for Plausible Motion Blur" (McGuire et al.,
// I3D 2012). Only the camera moves, so each pixel's motion follows from its depth and the
// reprojection into the previous frame, and there is no velocity buffer. The blur gathers
// jittered samples along the pixel's motion, weighted by depth so that near terrain and far
// ridges or sky do not smear into each other.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// current eye coordinates to the previous frame's clip coordinates, computed in double
// precision on the CPU
uniform mat4 reprojection;
// exposure time over the time since the previous frame: the blur spans the motion during the
// exposure, whatever the frame rate
uniform float exposureScale;
in vec2 v_textureCoordinates;

const int SAMPLES = 16;
// longest blur, as a fraction of the viewport height
const float MAX_BLUR = 0.05;
// depth difference, relative to the depth, over which a sample goes from in front to behind
const float SOFT_DEPTH = 0.1;


// xy: half the blur of the pixel at uv, in pixels; z: its distance from the camera
vec3 halfBlurAt(vec2 uv) {
  // the sky is a direction: only the camera rotation moves it
  vec4 eye = eyeAt(depthTexture, uv);
  vec4 previous = reprojection * eye;
  vec2 motion = previous.w > 0.0 ? uv - (previous.xy / previous.w * 0.5 + 0.5) : vec2(0.0);
  // in pixels
  motion *= exposureScale * czm_viewport.zw;
  float extent = length(motion);
  float maxExtent = MAX_BLUR * czm_viewport.w;
  if (extent > maxExtent) {
    motion *= maxExtent / extent;
  }
  return vec3(0.5 * motion, eye.w == 0.0 ? 1e30 : length(eye.xyz));
}

// 1 when b is in front of a, 0 when it is SOFT_DEPTH behind
float inFront(float a, float b) {
  return clamp(1.0 - (b - a) / (SOFT_DEPTH * min(a, b)), 0.0, 1.0);
}

// the blur of a pixel with this half blur covers a sample this far away; the extents are kept
// above 0 for samples without blur
float cone(float gap, vec2 halfBlur) {
  return clamp(1.0 - gap / max(length(halfBlur), 1e-3), 0.0, 1.0);
}

// both pixels are blurred over the gap between them
float cylinder(float gap, vec2 halfBlur) {
  float extent = max(length(halfBlur), 1e-3);
  return 1.0 - smoothstep(0.95 * extent, 1.05 * extent, gap);
}

void main() {
  vec3 center = halfBlurAt(v_textureCoordinates);
  vec2 halfBlur = center.xy;
  vec4 centerColor = texture(colorTexture, v_textureCoordinates);
  float extent = length(halfBlur);
  if (extent < 0.5) {
    out_FragColor = centerColor;
    return;
  }

  float weight = 1.0 / extent;
  vec4 color = centerColor * weight;
  // the jitter turns the banding of few samples into fine noise
  float jitter = pixelNoise(gl_FragCoord.xy) - 0.5;
  for (int i = 0; i < SAMPLES; i++) {
    float t = mix(-1.0, 1.0, (float(i) + jitter + 1.0) / float(SAMPLES + 1));
    vec2 uv = v_textureCoordinates + t * halfBlur / czm_viewport.zw;
    vec3 other = halfBlurAt(uv);
    float gap = abs(t) * extent;
    float front = inFront(center.z, other.z);
    float behind = inFront(other.z, center.z);
    // a sample in front counts when its own blur reaches this pixel, one behind when this
    // pixel's blur reaches it, and both when they are blurred together
    float alpha =
      front * cone(gap, other.xy) +
      behind * cone(gap, halfBlur) +
      2.0 * cylinder(gap, other.xy) * cylinder(gap, halfBlur);
    weight += alpha;
    color += alpha * texture(colorTexture, uv);
  }
  out_FragColor = color / weight;
}
`,pe=class extends l{constructor(e,t={}){super(e),this.strength_=t.strength??1,this.exposure_=t.exposure??1/24,this.previousViewProjection_=new i,this.reprojection_=new i,this.previousTime_=0,this.onPostRender_=()=>{let e=this.viewer.scene.camera;i.multiply(e.frustum.projectionMatrix,e.viewMatrix,this.previousViewProjection_),this.previousTime_=performance.now()}}createStage_(t){let n=new e({fragmentShader:W+h+G,uniforms:{reprojection:()=>i.multiply(this.previousViewProjection_,t.camera.inverseViewMatrix,this.reprojection_),exposureScale:()=>this.strength_*this.exposure_/Math.min(Math.max((performance.now()-this.previousTime_)/1e3,1/240),1/10)}});return n.enabled=this.strength_>0,n}activated_(e){H(e),this.onPostRender_(),e.postRender.addEventListener(this.onPostRender_)}deactivating_(e){e.postRender.removeEventListener(this.onPostRender_),U(e)}get strength(){return this.strength_}set strength(e){this.strength_=e,this.stage_&&(this.stage_.enabled=e>0),this.viewer.scene.requestRender()}get exposure(){return this.exposure_}set exposure(e){this.exposure_=e,this.viewer.scene.requestRender()}},me=new o,he=new o;function K(e){return{cameraHeight:()=>e.camera.positionCartographic.height,up:()=>{let t=e.ellipsoid.geodeticSurfaceNormal(e.camera.positionWC,me);return i.multiplyByPointAsVector(e.camera.viewMatrix,t,t)},radius:()=>{let t=e.ellipsoid.scaleToGeodeticSurface(e.camera.positionWC,he);return t?o.magnitude(t):e.ellipsoid.maximumRadius}}}var q=`// Height above the ellipsoid of a point in eye coordinates, computed relative to the camera: in
// world coordinates, single precision would round the position to about half a meter. The
// uniforms come from the CPU in double precision (height.js).
uniform float cameraHeight;
uniform vec3 up;
uniform float radius;

float heightAt(vec3 eye) {
  // the camera is at the origin of eye coordinates; away from it horizontally, the ground falls
  // below the horizontal by the Earth's curvature
  float rise = dot(eye, up);
  float across = dot(eye, eye) - rise * rise;
  return cameraHeight + rise + across / (2.0 * radius);
}
`,J=`// normal at the pixel from its neighbors at this distance in pixels: on each axis the nearer
// side, so that the edges of the scene do not bend it
vec3 normalAt(sampler2D depthTexture, vec2 uv, vec3 center, float distance) {
  vec2 step = distance / czm_viewport.zw;
  vec3 right = eyeAt(depthTexture, uv + vec2(step.x, 0.0)).xyz - center;
  vec3 left = center - eyeAt(depthTexture, uv - vec2(step.x, 0.0)).xyz;
  vec3 above = eyeAt(depthTexture, uv + vec2(0.0, step.y)).xyz - center;
  vec3 below = center - eyeAt(depthTexture, uv - vec2(0.0, step.y)).xyz;
  vec3 dx = dot(right, right) < dot(left, left) ? right : left;
  vec3 dy = dot(above, above) < dot(below, below) ? above : below;
  vec3 normal = normalize(cross(dx, dy));
  // toward the camera
  return normal * sign(dot(normal, -center));
}

// the terrain mesh is made of flat triangles, and so are the normals from the depth buffer:
// averaged over several distances, the facets blend into a smoother surface
vec3 smoothNormalAt(sampler2D depthTexture, vec2 uv, vec3 center) {
  return normalize(normalAt(depthTexture, uv, center, 2.0 * czm_pixelRatio) + normalAt(depthTexture, uv, center, 6.0 * czm_pixelRatio));
}
`,ge=`// Snow above an altitude, on slopes gentle enough to hold it, shaded by the sun and by the
// brightness of the scene so that the relief stays readable. The slope comes from a normal
// rebuilt from the neighboring pixels and smoothed over the facets of the terrain.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// meters above the ellipsoid: half covered at the altitude, over a band transition meters high
uniform float altitude;
uniform float transition;
// radians
uniform float maxSlope;
// 0 to 1
uniform float coverage;
in vec2 v_textureCoordinates;

const vec3 SNOW = vec3(0.92, 0.94, 1.0);
// half width of the slope limit, in radians (8 degrees), so that the snow thins out across the
// facets of the terrain rather than stopping at their edges
const float SLOPE_EDGE = 0.14;

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float slope = acos(clamp(dot(normal, up), -1.0, 1.0));

  float snow = smoothstep(altitude - 0.5 * transition, altitude + 0.5 * transition, heightAt(eye.xyz));
  snow *= 1.0 - smoothstep(maxSlope - SLOPE_EDGE, maxSlope + SLOPE_EDGE, slope);
  // eye.w is 0 for the sky
  snow *= coverage * eye.w;
  float sun = max(dot(normal, czm_sunDirectionEC), 0.0);
  float brightness = dot(sceneColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 lit = SNOW * clamp(0.6 + 0.25 * sun + 0.3 * brightness, 0.0, 1.0);
  out_FragColor = vec4(mix(sceneColor.rgb, lit, snow), sceneColor.a);
}
`,_e=class extends l{constructor(e,t={}){super(e),this.altitude_=t.altitude??2e3,this.transition_=t.transition??200,this.maxSlope_=t.maxSlope??40,this.coverage_=t.coverage??1}createStage_(t){return new e({fragmentShader:W+q+J+ge,uniforms:{...K(t),altitude:()=>this.altitude_,transition:()=>this.transition_,maxSlope:()=>c.toRadians(this.maxSlope_),coverage:()=>this.coverage_}})}activated_(e){H(e)}deactivating_(e){U(e)}get altitude(){return this.altitude_}set altitude(e){this.altitude_=e,this.viewer.scene.requestRender()}get transition(){return this.transition_}set transition(e){this.transition_=e,this.viewer.scene.requestRender()}get maxSlope(){return this.maxSlope_}set maxSlope(e){this.maxSlope_=e,this.viewer.scene.requestRender()}get coverage(){return this.coverage_}set coverage(e){this.coverage_=e,this.viewer.scene.requestRender()}},ve=new o;function Y(e,t,n){let a=typeof t==`function`?t():t;if(!a)return r.fromElements(0,0,0,0,n);let o=i.multiplyByPoint(e.camera.viewMatrix,a,ve);return r.fromElements(o.x,o.y,o.z,1,n)}var ye=`// Speed lines: the picture zooms toward the focus, more toward the edges of the screen, and thin
// streaks radiate from it, a new pattern many times a second, as in comics.
uniform sampler2D colorTexture;
// in eye coordinates; w is 0 for the middle of the screen
uniform vec4 focus;
// 0 to 1
uniform float strength;
// seconds
uniform float time;
in vec2 v_textureCoordinates;

const int BLUR_STEPS = 8;
// length of the zoom blur at full strength, as a fraction of the distance to the focus
const float BLUR = 0.12;
// streaks around the focus, and their changes per second
const float STREAK_COUNT = 360.0;
const float STREAK_RATE = 24.0;
const float STREAK_OPACITY = 0.2;

// the streaks draw their randomness from hash: with a sin, they disappeared for half of each
// cycle of frames
void main() {
  vec2 uv = v_textureCoordinates;
  vec4 clip = czm_projection * vec4(focus.xyz, 1.0);
  // on the screen, in front of the camera
  vec2 center = focus.w > 0.0 && focus.z < 0.0 ? 0.5 * clip.xy / clip.w + 0.5 : vec2(0.5);
  vec2 toCenter = center - uv;
  // distance to the focus, 1 at the half height of the screen
  vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
  float fromCenter = 2.0 * length(toCenter * aspect);
  float edge = smoothstep(0.2, 1.0, fromCenter);

  vec4 sceneColor = texture(colorTexture, uv);
  vec3 color = sceneColor.rgb;
  // zoom blur, from a start that varies with the pixel so that the steps blur into noise; none
  // where it would be shorter than a pixel, around the focus
  float blur = strength * BLUR * edge;
  if (blur * length(toCenter * czm_viewport.zw) > 0.5) {
    float jitter = pixelNoise(gl_FragCoord.xy);
    color = vec3(0.0);
    for (int i = 0; i < BLUR_STEPS; i++) {
      color += texture(colorTexture, uv + toCenter * blur * (float(i) + jitter) / float(BLUR_STEPS)).rgb;
    }
    color /= float(BLUR_STEPS);
  }

  // streaks: noise around the focus, constant along each ray from it, only toward the edges
  float streaks = STREAK_OPACITY * strength * smoothstep(0.5, 1.2, fromCenter);
  if (streaks > 0.0) {
    vec2 direction = toCenter * aspect;
    float frame = mod(floor(time * STREAK_RATE), 1000.0);
    // value noise over the angle, in whole cells so that it closes around the focus
    float around = (atan(direction.y, direction.x) / czm_twoPi + 0.5) * STREAK_COUNT;
    float cell = floor(around);
    float t = fract(around);
    float noise = mix(hash(vec2(cell, frame)), hash(vec2(mod(cell + 1.0, STREAK_COUNT), frame)), t * t * (3.0 - 2.0 * t));
    color = mix(color, vec3(1.0), streaks * smoothstep(0.72, 0.9, noise));
  }
  out_FragColor = vec4(color, sceneColor.a);
}
`,be=new r,xe=class extends l{constructor(e,t={}){super(e),this.focus_=t.focus,this.strength_=t.strength??1}createStage_(t){let n=new e({fragmentShader:h+ye,uniforms:{focus:()=>Y(t,this.focus_,be),strength:()=>this.strength_,time:()=>performance.now()/1e3}});return n.enabled=this.strength_>0,n}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get strength(){return this.strength_}set strength(e){this.strength_=e,this.stage_&&(this.stage_.enabled=e>0),this.viewer.scene.requestRender()}},X=`// random gradient in [-1, 1] at a lattice point
vec3 gradient(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}

// gradient noise, about -0.7 to 0.7. After prod80's ReShade Film Grain (MIT), with gradients
// from a hash instead of a texture
float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(
      mix(dot(gradient(i), f), dot(gradient(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(gradient(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)), dot(gradient(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x),
      u.y),
    mix(
      mix(dot(gradient(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)), dot(gradient(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(gradient(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)), dot(gradient(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x),
      u.y),
    u.z);
}
`,Se=`// A searchlight above the focus, pointing down: it throws a pool of warm light radius meters
// wide on flat ground, with a soft penumbra, shades the relief under it and lights up the haze
// in its beam; the rest of the scene darkens and loses its color. The cone and the falloff
// follow three.js's SpotLight.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// local up direction, in eye coordinates
uniform vec3 up;
// meters
uniform float radius;
// width of the penumbra, as a fraction of the radius
uniform float softness;
// 0 to 1
uniform float darkness;
// brightness of the beam in the air, 0 to 1
uniform float beam;
in vec2 v_textureCoordinates;

const vec3 LIGHT_COLOR = vec3(1.0, 0.93, 0.8);
const float INTENSITY = 1.4;
// height of the light above the focus, in radii: a cone of 53 degrees
const float HEIGHT = 2.0;
// radius of the beam's bright core around the light, in heights: the inverse square is softened
// within it, as the pool's is capped, so that the top of the beam does not burn out
const float BEAM_CORE = 0.25;
// contrast and density of the dust streaks in the beam, across its width
const float STREAKS = 0.2;
const float STREAK_SCALE = 4.0;
// Henyey-Greenstein asymmetry of the haze: it scatters mostly forward, so the beam is brighter
// when looking toward the light
const float PHASE_G = 0.4;

// light reaching a point fromLight away from the light: the cone around the axis with its
// penumbra, and the inverse square, 1 at the focus, capped for what is close to the light
float spotAt(vec3 fromLight, vec3 axis, float height, float coneCos, float penumbraCos) {
  float lightDistance = length(fromLight);
  float spot = smoothstep(coneCos, penumbraCos, dot(fromLight, -axis) / lightDistance);
  return spot * min(height * height / (lightDistance * lightDistance), 4.0);
}

// Henyey-Greenstein phase, 1 across the light
float phase(float cosTheta) {
  float g2 = PHASE_G * PHASE_G;
  return pow((1.0 + g2) / (1.0 + g2 - 2.0 * PHASE_G * cosTheta), 1.5);
}

// the part of the view ray, from the camera at the origin up to the scene, inside the light's
// cone; empty when end <= start
vec2 coneSegment(vec3 ray, float sceneDistance, vec3 lightPosition, vec3 down, float coneCos) {
  // points in the cone: dot(v, down)^2 >= coneCos^2 dot(v, v), with v from the light
  vec3 v = -lightPosition;
  float k2 = coneCos * coneCos;
  float rd = dot(ray, down);
  float vd = dot(v, down);
  float a = rd * rd - k2;
  float b = rd * vd - k2 * dot(ray, v);
  float c = vd * vd - k2 * dot(v, v);
  float discriminant = b * b - a * c;
  if (discriminant < 0.0) {
    return vec2(1.0, 0.0);
  }
  float root = sqrt(discriminant);
  float t1 = (-b - root) / a;
  float t2 = (-b + root) / a;
  vec2 segment = a < 0.0 ? vec2(min(t1, t2), max(t1, t2))
    // a ray steeper than the cone stays in it on one side, of the lit nappe or the other one
    : rd > 0.0 ? vec2(max(t1, t2), 1e30) : vec2(-1e30, min(t1, t2));
  segment = vec2(max(segment.x, 0.0), min(segment.y, sceneDistance));
  // below the light, not in the mirrored cone above it
  return vd + 0.5 * (segment.x + segment.y) * rd > 0.0 ? segment : vec2(1.0, 0.0);
}

// the light scattered toward the camera by the haze in the cone, along the view ray up to the
// scene. The inverse square, softened around the light, is integrated exactly over the part of
// the ray in the cone, after Macklin's analytic in-scattering; the phase is taken where the ray passes closest to the light,
// and the penumbra where it passes closest to the axis.
float beamAlong(vec3 ray, float sceneDistance, vec3 lightPosition, vec3 axis, float height, float coneCos, float penumbraCos) {
  vec3 down = -axis;
  vec2 segment = coneSegment(ray, sceneDistance, lightPosition, down, coneCos);
  if (segment.y <= segment.x) {
    return 0.0;
  }
  vec3 q = ray * segment.x - lightPosition;
  float b = dot(ray, q);
  float core = BEAM_CORE * height;
  float s = inversesqrt(dot(q, q) - b * b + core * core);
  float scattered = s * (atan((segment.y - segment.x + b) * s) - atan(b * s));

  vec3 nearLight = ray * clamp(dot(ray, lightPosition), segment.x, segment.y) - lightPosition;
  float rd = dot(ray, down);
  float across = 1.0 - rd * rd;
  float nearAxisT = across < 1e-6 ? segment.x : (dot(ray, lightPosition) - rd * dot(down, lightPosition)) / across;
  vec3 nearAxis = ray * clamp(nearAxisT, segment.x, segment.y) - lightPosition;
  float spot = smoothstep(coneCos, penumbraCos, dot(normalize(nearAxis), down));
  // dust catching the light: noise across the beam, 1 at its edge, constant along each line from
  // the light so that it streaks, and in world coordinates so that it stays when the camera turns
  float along = max(dot(nearAxis, down), 1e-3);
  vec3 section = czm_inverseViewRotation * ((nearAxis - along * down) * HEIGHT / along);
  float dust = gradientNoise(STREAK_SCALE * section) + 0.25 * gradientNoise(2.0 * STREAK_SCALE * section);
  spot *= 1.0 + STREAKS * dust;
  // times height squared for 1 at the focus, over height for a brightness that keeps with the radius
  return height * scattered * spot * phase(dot(normalize(nearLight), -ray));
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  // no light without a focus in front of the camera (the sky in the middle, a focus behind)
  if (target.w == 0.0 || target.z >= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  vec3 color = sceneColor.rgb;
  vec3 ambient = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), darkness) * (1.0 - darkness);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);

  float height = HEIGHT * radius;
  vec3 lightPosition = target.xyz + height * up;
  // cosines of the angles, from the light's axis, at which the pool ends and its penumbra starts
  float inner = radius * (1.0 - softness);
  float coneCos = height / sqrt(height * height + radius * radius);
  float penumbraCos = height / sqrt(height * height + inner * inner);

  // eye.w is 0 for the sky, where the view ray goes on
  float sceneDistance = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float scattered = beam > 0.0 ? beamAlong(normalize(eye.xyz), sceneDistance, lightPosition, up, height, coneCos, penumbraCos) : 0.0;
  vec3 haze = LIGHT_COLOR * (beam * scattered);
  if (eye.w == 0.0) {
    out_FragColor = vec4(ambient + haze, sceneColor.a);
    return;
  }

  vec3 toLight = lightPosition - eye.xyz;
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float lambert = max(dot(normal, normalize(toLight)), 0.0);
  vec3 light = LIGHT_COLOR * (INTENSITY * spotAt(-toLight, up, height, coneCos, penumbraCos) * lambert);
  out_FragColor = vec4(ambient + color * light + haze, sceneColor.a);
}
`,Ce=new r,we=class extends l{constructor(e,t={}){super(e),this.focus_=t.focus,this.radius_=t.radius??200,this.softness_=t.softness??.5,this.darkness_=t.darkness??.8,this.beam_=t.beam??.25}createStage_(t){return new e({fragmentShader:W+X+J+Se,uniforms:{focus:()=>Y(t,this.focus_,Ce),up:K(t).up,radius:()=>this.radius_,softness:()=>this.softness_,darkness:()=>this.darkness_,beam:()=>this.beam_}})}activated_(e){H(e)}deactivating_(e){U(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get radius(){return this.radius_}set radius(e){this.radius_=e,this.viewer.scene.requestRender()}get softness(){return this.softness_}set softness(e){this.softness_=e,this.viewer.scene.requestRender()}get darkness(){return this.darkness_}set darkness(e){this.darkness_=e,this.viewer.scene.requestRender()}get beam(){return this.beam_}set beam(e){this.beam_=e,this.viewer.scene.requestRender()}};function Z(r){let i=[`x`,`y`].map((i,a)=>new e({name:`${r}_${i}`,fragmentShader:`#define USE_STEP_SIZE\n${n}`,uniforms:{delta:1,sigma:2,stepSize:1,direction:a},sampleMode:t.LINEAR})),a=e=>({get:()=>i[0].uniforms[e],set:t=>{for(let n of i)n.uniforms[e]=t}});return new s({name:r,stages:i,uniforms:Object.defineProperties({},{sigma:a(`sigma`),stepSize:a(`stepSize`)})})}var Q=`// Size of the visible frame of the given width over height, centered in the canvas, in texture
// coordinates: bars above and below when the canvas is narrower than the ratio, on the sides when
// it is wider; the whole canvas for a ratio of 0.
vec2 frameSize(float aspectRatio) {
  if (aspectRatio <= 0.0) {
    return vec2(1.0);
  }
  float canvas = czm_viewport.z / czm_viewport.w;
  return aspectRatio < canvas ? vec2(aspectRatio / canvas, 1.0) : vec2(1.0, canvas / aspectRatio);
}
`,Te=`// A Super 8 home movie: faded warm colors, halation around the highlights, heavy grain, the frame
// drifting in the gate, flicker, light leaks, a strong vignette and the rounded corners of the
// camera gate.
uniform sampler2D colorTexture;
// the scene blurred, for the halation
uniform sampler2D blurTexture;
// seconds
uniform float time;
// 0 to 1
uniform float fade;
uniform float grain;
// in CSS pixels
uniform float weave;
// 0 to 1
uniform float flicker;
uniform float lightLeaks;
uniform float halation;
// width over height of the visible frame, 0 for the whole canvas
uniform float aspectRatio;
in vec2 v_textureCoordinates;

// Super 8 runs at 18 frames per second
const float FRAME_RATE = 18.0;
// radius of the rounded corners, as a fraction of the frame height
const float CORNER = 0.05;
const vec3 LEAK = vec3(1.0, 0.45, 0.15);
// size of the grain clumps, in CSS pixels, and how much they differ between the dye layers
const float GRAIN_SIZE = 2.0;
const float GRAIN_COLOR = 0.3;
// light scattered back through the film base is red-orange
const vec3 HALATION = vec3(1.0, 0.35, 0.15);

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

// smooth noise in [0, 1) over time
float noise(float t) {
  float i = floor(t);
  float f = fract(t);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

void main() {
  vec2 size = czm_viewport.zw;
  // the time of the film frame, and its number for the noise
  float t = floor(time * FRAME_RATE) / FRAME_RATE;
  float frame = mod(floor(time * FRAME_RATE), 1000.0);

  // gate weave: the whole picture drifts by a pixel or two, from frame to frame
  vec2 drift = vec2(noise(t * 3.0), noise(t * 3.0 + 17.0)) * 2.0 - 1.0;
  vec2 uv = v_textureCoordinates + weave * czm_pixelRatio * drift / size;

  // the gate, with rounded corners, in pixels
  vec2 frameHalf = 0.5 * frameSize(aspectRatio) * size;
  float radius = CORNER * 2.0 * frameHalf.y;
  vec2 q = abs((v_textureCoordinates - 0.5) * size) - frameHalf + radius;
  float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float gate = 1.0 - smoothstep(-czm_pixelRatio, czm_pixelRatio, outside);
  // -0.5 to 0.5 inside the frame
  vec2 inFrame = (v_textureCoordinates - 0.5) * size / (2.0 * frameHalf);

  vec3 color = texture(colorTexture, uv).rgb;
  // faded film: less saturation, lifted blacks, a warm cast
  color = mix(color, vec3(luminance(color)), 0.4 * fade);
  color = mix(color, color * vec3(1.05, 0.95, 0.78) * 0.88 + vec3(0.09, 0.07, 0.05), fade);
  // halation: a warm glow bleeding around the highlights
  float glow = smoothstep(0.45, 0.9, luminance(texture(blurTexture, uv).rgb));
  color = 1.0 - (1.0 - color) * (1.0 - halation * glow * HALATION);
  // vignette
  color *= 1.0 - 0.6 * smoothstep(0.35, 0.85, length(inFrame));
  // a warm light leak, drifting along the right edge and coming and going
  vec2 leakAt = vec2(0.6, noise(time * 0.15) - 0.5);
  float leak = lightLeaks * smoothstep(0.3, 0.9, noise(time * 0.3 + 5.0)) * exp(-6.0 * dot(inFrame - leakAt, inFrame - leakAt));
  color = 1.0 - (1.0 - color) * (1.0 - leak * LEAK);
  // flicker: the brightness changes from frame to frame
  color *= 1.0 + flicker * (2.0 * hash(frame) - 1.0);
  // grain: clumps a few pixels wide, a new pattern with each film frame, a little different in
  // each dye layer, heaviest in the shadows and midtones and fading out in the highlights
  vec2 grainAt = gl_FragCoord.xy / (GRAIN_SIZE * czm_pixelRatio);
  float z = frame * 1.7 + 0.5;
  float mono = gradientNoise(vec3(grainAt, z));
  vec3 layers = vec3(gradientNoise(vec3(grainAt, z + 101.0)), gradientNoise(vec3(grainAt, z + 211.0)), gradientNoise(vec3(grainAt, z + 307.0)));
  vec3 noise = mix(vec3(mono), layers, GRAIN_COLOR);
  float y = clamp(luminance(color), 0.0, 1.0);
  color += grain * 1.4 * noise * 2.0 * (1.0 - y) * (0.5 + y);

  out_FragColor = vec4(clamp(color, 0.0, 1.0) * gate, 1.0);
}
`,Ee=6,De=2,$=18,Oe=class extends l{constructor(e,t={}){super(e),this.fade_=t.fade??.5,this.halation_=t.halation??.5,this.grain_=t.grain??.15,this.weave_=t.weave??1.5,this.flicker_=t.flicker??.08,this.lightLeaks_=t.lightLeaks??.5,this.aspectRatio_=t.aspectRatio??4/3}createStage_(){let t=Z(`czm_super8_halation`),n=new s({stages:[t,new e({fragmentShader:Q+X+Te,uniforms:{blurTexture:t.name,time:()=>performance.now()/1e3,fade:()=>this.fade_,halation:()=>this.halation_,grain:()=>this.grain_,weave:()=>this.weave_,flicker:()=>this.flicker_,lightLeaks:()=>this.lightLeaks_,aspectRatio:()=>this.aspectRatio_}})],inputPreviousStageTexture:!1,uniforms:t.uniforms});return n.uniforms.sigma=Ee,n.uniforms.stepSize=De,n}activated_(e){f(e,$)}deactivating_(e){p(e,$)}get fade(){return this.fade_}set fade(e){this.fade_=e}get halation(){return this.halation_}set halation(e){this.halation_=e}get grain(){return this.grain_}set grain(e){this.grain_=e}get weave(){return this.weave_}set weave(e){this.weave_=e}get flicker(){return this.flicker_}set flicker(e){this.flicker_=e}get lightLeaks(){return this.lightLeaks_}set lightLeaks(e){this.lightLeaks_=e}get aspectRatio(){return this.aspectRatio_}set aspectRatio(e){this.aspectRatio_=e}},ke=`// Three-strip Technicolor: the camera split the scene into red, green and blue records, each
// printed with its complementary dye, the three dyes over each other. Each color gains its purity,
// what it has over the other two, and loses some of theirs: grays stay, primaries deepen. After
// prod80's ReShade Technicolor (MIT), https://github.com/prod80/prod80-ReShade-Repository
uniform sampler2D colorTexture;
// 0 to 1
uniform float strength;
// width over height of the visible frame, 0 for the whole canvas
uniform float aspectRatio;
in vec2 v_textureCoordinates;

// how much of the other colors' purity each color loses
const float COLOR_STRENGTH = 0.2;

void main() {
  vec2 inFrame = (v_textureCoordinates - 0.5) / frameSize(aspectRatio);
  if (max(abs(inFrame.x), abs(inFrame.y)) > 0.5) {
    out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 color = sceneColor.rgb;
  // red: r (1 - g) (1 - b), and so on
  vec3 negative = 1.0 - color;
  vec3 purity = color * negative.grg * negative.bbr;
  vec3 taken = COLOR_STRENGTH * purity;
  vec3 printed = color + purity - taken.yxy - taken.zzx;
  out_FragColor = vec4(clamp(mix(color, printed, strength), 0.0, 1.0), sceneColor.a);
}
`,Ae=class extends l{constructor(e,t={}){super(e),this.strength_=t.strength??1,this.aspectRatio_=t.aspectRatio??0}createStage_(){return new e({fragmentShader:Q+ke,uniforms:{strength:()=>this.strength_,aspectRatio:()=>this.aspectRatio_}})}get strength(){return this.strength_}set strength(e){this.strength_=e,this.viewer.scene.requestRender()}get aspectRatio(){return this.aspectRatio_}set aspectRatio(e){this.aspectRatio_=e,this.viewer.scene.requestRender()}},je=`// Tilt-shift: a narrow band of sharpness around the focal distance and the blurred image further
// off, with the punchy colors of miniature photographs. Distances compare as ratios, like a lens:
// sharp within range factors of two of the focal distance, fully blurred at twice that.
uniform sampler2D colorTexture;
uniform sampler2D blurTexture;
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// in factors of two of the focal distance
uniform float range;
// 0 to 1
uniform float saturation;
in vec2 v_textureCoordinates;

void main() {
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  float fromCamera = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  // no blur without a focus in front of the camera (the sky in the middle, a focus behind)
  float blur = target.w > 0.0 && target.z < 0.0
    ? smoothstep(range, 2.0 * range, abs(log2(fromCamera / length(target.xyz))))
    : 0.0;
  vec4 sceneColor = mix(texture(colorTexture, v_textureCoordinates), texture(blurTexture, v_textureCoordinates), blur);

  vec3 color = sceneColor.rgb;
  color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, 1.0 + saturation);
  color = mix(color, smoothstep(0.0, 1.0, color), saturation);
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
`,Me=new r,Ne=class extends l{constructor(e,t={}){super(e),this.focus_=t.focus,this.range_=t.range??.3,this.blur_=t.blur??4,this.saturation_=t.saturation??.3}createStage_(t){let n=Z(`czm_tilt_shift_blur`),r=new s({stages:[n,new e({fragmentShader:W+je,uniforms:{blurTexture:n.name,focus:()=>Y(t,this.focus_,Me),range:()=>this.range_,saturation:()=>this.saturation_}})],inputPreviousStageTexture:!1,uniforms:n.uniforms});return r.uniforms.sigma=this.blur_,r}activated_(e){H(e)}deactivating_(e){U(e)}get focus(){return this.focus_}set focus(e){this.focus_=e,this.viewer.scene.requestRender()}get range(){return this.range_}set range(e){this.range_=e,this.viewer.scene.requestRender()}get blur(){return this.blur_}set blur(e){this.blur_=e,this.stage_&&(this.stage_.uniforms.sigma=e),this.viewer.scene.requestRender()}get saturation(){return this.saturation_}set saturation(e){this.saturation_=e,this.viewer.scene.requestRender()}},Pe=`// Fog filling the valleys below an altitude: the fog along the ray from the camera to the pixel
// is the part of the ray below the top, the density thinning over a soft band under the top.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// meters above the ellipsoid
uniform float top;
// per meter
uniform float density;
// meters
uniform float softness;
uniform vec4 color;
in vec2 v_textureCoordinates;

// the sky is a ray this long, in meters
const float SKY_DISTANCE = 50000.0;
// tint of the fog at night, scaled by fog.minimumBrightness
const vec3 NIGHT = vec3(0.45, 0.55, 0.85);

// the integral of clamp(x, 0, 1)
float ramp(float x) {
  return x <= 0.0 ? 0.0 : x < 1.0 ? 0.5 * x * x : x - 0.5;
}

// mean fraction of the density along a straight ray from height h0 to h1
float fogFraction(float h0, float h1) {
  float band = max(softness, 1e-3);
  if (abs(h1 - h0) < 1e-2) {
    return clamp((top - h0) / band, 0.0, 1.0);
  }
  return band * (ramp((top - h0) / band) - ramp((top - h1) / band)) / (h1 - h0);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  // the sky is a direction
  vec3 end = eye.w == 0.0 ? eye.xyz * SKY_DISTANCE : eye.xyz;
  float amount = 1.0 - exp(-density * length(end) * fogFraction(cameraHeight, heightAt(end)));
  // lit by the sun, as Cesium's fog: the fog color during the day, turning around sunset to a
  // moonlit blue as bright as the scene's fog.minimumBrightness, rather than a flat gray
  float day = smoothstep(-0.1, 0.3, dot(up, czm_sunDirectionEC));
  vec3 fogColor = mix(NIGHT * czm_fogMinimumBrightness, color.rgb, day);
  out_FragColor = vec4(mix(sceneColor.rgb, fogColor, amount * color.a), sceneColor.a);
}
`,Fe=class extends l{constructor(e,t={}){super(e),this.top_=t.top??1500,this.density_=t.density??.005,this.softness_=t.softness??100,this.color_=t.color??new a(.85,.88,.92,1)}createStage_(t){return new e({fragmentShader:W+q+Pe,uniforms:{...K(t),top:()=>this.top_,density:()=>this.density_,softness:()=>this.softness_,color:()=>this.color_}})}activated_(e){H(e)}deactivating_(e){U(e)}get top(){return this.top_}set top(e){this.top_=e,this.viewer.scene.requestRender()}get density(){return this.density_}set density(e){this.density_=e,this.viewer.scene.requestRender()}get softness(){return this.softness_}set softness(e){this.softness_=e,this.viewer.scene.requestRender()}get color(){return this.color_}set color(e){this.color_=e,this.viewer.scene.requestRender()}};export{we as a,pe as c,R as d,O as f,ne as g,ie as h,Oe as i,W as l,D as m,Ne as n,xe as o,de as p,Ae as r,_e as s,Fe as t,B as u};