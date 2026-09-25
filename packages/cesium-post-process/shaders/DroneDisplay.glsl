// A Betaflight analog OSD, as its MAX7456 chip draws it: 30 columns and 16 rows of 12 x 18
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
