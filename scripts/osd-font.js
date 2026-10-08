// Writes the FONT table of the drone display's shader from the pixel drawings below: each glyph is
// drawn at the MAX7456's 12 x 18 pixels, '#' for white, and becomes 18 rows of 24 bits: the
// glyph in the low 12, the leftmost pixel highest, and its black outline, the pixels around it
// within the cell, in the high 12, so that the shader reads one entry per pixel. The digits keep
// the sizes of Betaflight's default font; the units and icons imitate ArduPilot's HD OSD, all
// drawn here. Run it after changing a drawing, then build the shaders:
// node scripts/osd-font.js && npm run build-shaders
import {readFile, writeFile} from 'node:fs/promises';

const SHADER = 'packages/cesium-post-process/shaders/DroneDisplay.glsl';
const WIDTH = 12;
const HEIGHT = 18;

/**
 * A drawing placed in a cell at x, y.
 * @param {string} drawing lines of '#' and '.'
 * @param {number} x
 * @param {number} y
 * @return {boolean[][]}
 */
function place(drawing, x, y) {
  const cell = Array.from({length: HEIGHT}, () => new Array(WIDTH).fill(false));
  drawing
    .trim()
    .split('\n')
    .forEach((line, j) => [...line].forEach((c, i) => (cell[y + j][x + i] ||= c === '#')));
  return cell;
}

/**
 * @param {...boolean[][]} cells
 * @return {boolean[][]}
 */
function merge(...cells) {
  return cells[0].map((row, j) => row.map((_, i) => cells.some((cell) => cell[j][i])));
}

const EMPTY = Array.from({length: HEIGHT}, () => new Array(WIDTH).fill(false));

// digits, 4 x 9 pixels in the middle of the cell
const DIGITS = [
  '.##.\n#..#\n#..#\n#..#\n#..#\n#..#\n#..#\n#..#\n.##.',
  '.#..\n##..\n.#..\n.#..\n.#..\n.#..\n.#..\n.#..\n###.',
  '.##.\n#..#\n...#\n...#\n..#.\n.#..\n#...\n#...\n####',
  '###.\n...#\n...#\n...#\n.##.\n...#\n...#\n...#\n###.',
  '#..#\n#..#\n#..#\n#..#\n####\n...#\n...#\n...#\n...#',
  '####\n#...\n#...\n###.\n...#\n...#\n...#\n#..#\n.##.',
  '.##.\n#...\n#...\n###.\n#..#\n#..#\n#..#\n#..#\n.##.',
  '####\n...#\n...#\n..#.\n..#.\n.#..\n.#..\n.#..\n.#..',
  '.##.\n#..#\n#..#\n#..#\n.##.\n#..#\n#..#\n#..#\n.##.',
  '.##.\n#..#\n#..#\n#..#\n.###\n...#\n...#\n...#\n.##.',
];

// the letters of the flight modes and the warning, as the digits; T and W are 5 pixels wide
const LETTERS = {
  F: '####\n#...\n#...\n#...\n###.\n#...\n#...\n#...\n#...',
  B: '###.\n#..#\n#..#\n#..#\n###.\n#..#\n#..#\n#..#\n###.',
  W: '#...#\n#...#\n#...#\n#...#\n#.#.#\n#.#.#\n#.#.#\n#.#.#\n.#.#.',
  A: '.##.\n#..#\n#..#\n#..#\n####\n#..#\n#..#\n#..#\n#..#',
  R: '###.\n#..#\n#..#\n#..#\n###.\n#.#.\n#..#\n#..#\n#..#',
  T: '#####\n..#..\n..#..\n..#..\n..#..\n..#..\n..#..\n..#..\n..#..',
  L: '#...\n#...\n#...\n#...\n#...\n#...\n#...\n#...\n####',
  I: '###\n.#.\n.#.\n.#.\n.#.\n.#.\n.#.\n.#.\n###',
  E: '####\n#...\n#...\n#...\n###.\n#...\n#...\n#...\n####',
  S: '.###\n#...\n#...\n#...\n.##.\n...#\n...#\n...#\n###.',
};

// the small letters of the labels and the units, 3 x 5 pixels, m 5 wide
const SMALL = {
  A: '.#.\n#.#\n###\n#.#\n#.#',
  i: '#\n.\n#\n#\n#',
  r: '...\n#.#\n##.\n#..\n#..',
  S: '###\n#..\n###\n..#\n###',
  p: '...\n##.\n#.#\n##.\n#..',
  d: '..#\n.##\n#.#\n#.#\n.##',
  k: '#..\n#.#\n##.\n#.#\n#.#',
  m: '.....\n####.\n#.#.#\n#.#.#\n#.#.#',
  h: '#..\n#..\n##.\n#.#\n#.#',
  s: '.##\n#..\n.#.\n..#\n##.',
};

/**
 * Small letters in a row from x, y, a pixel apart.
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @return {boolean[][]}
 */
function small(text, x, y) {
  const cells = [];
  for (const letter of text) {
    const drawing = SMALL[/** @type {keyof typeof SMALL} */ (letter)];
    cells.push(place(drawing, x, y));
    x += drawing.split('\n')[0].length + 1;
  }
  return merge(...cells);
}

const UP = '...#...\n..###..\n.#####.\n#######';
const DOWN = '#######\n.#####.\n..###..\n...#...';

// in the order of the shader's glyph constants: the digits, DOT, SPACE, MINUS, VOLT, DEGREE,
// PERCENT, ALTITUDE, METERS_PER_SECOND, KILOMETERS_PER_HOUR, AIR_SPEED, UP, UP_TWO, DOWN,
// DOWN_TWO, then the letters F, B, W, A, R, T, L, I, E, S
/** @type {[string, boolean[][]][]} */
const GLYPHS = [
  ...DIGITS.map((drawing, n) => /** @type {[string, boolean[][]]} */ ([String(n), place(drawing, 4, 4)])),
  ['.', place('##\n##', 5, 11)],
  ['space', EMPTY],
  ['-', place('####', 4, 8)],
  ['v, volts', place('#...#\n#...#\n#...#\n.#.#.\n.#.#.\n..#..', 3, 7)],
  ['°, degrees', place('.##.\n#..#\n#..#\n.##.', 3, 3)],
  ['%', place('##....#\n##...#.\n....#..\n...#...\n..#....\n.#...##\n#....##', 2, 5)],
  [
    'a mountain over m, the altitude; the shader adds a green dot inside',
    merge(place('....#......\n...#.#.....\n..#...#.#..\n.#.....#.#.\n#.........#', 0, 1), small('m', 3, 8)),
  ],
  ['m over s, meters per second', merge(small('m', 3, 1), small('s', 4, 9))],
  ['km over h, kilometers per hour', merge(small('km', 1, 1), small('h', 5, 8))],
  ['Air over Spd, the air speed', merge(small('Air', 1, 2), small('Spd', 0, 9))],
  ['an arrow up', place(UP, 2, 7)],
  ['two arrows up', merge(place(UP, 2, 3), place(UP, 2, 10))],
  ['an arrow down', place(DOWN, 2, 7)],
  ['two arrows down', merge(place(DOWN, 2, 3), place(DOWN, 2, 10))],
  ...Object.entries(LETTERS).map(([letter, drawing]) => /** @type {[string, boolean[][]]} */ ([letter, place(drawing, drawing.indexOf('\n') === 5 ? 3 : 4, 4)])),
];

/**
 * @param {boolean[][]} cell
 * @return {boolean[][]} the pixels next to the glyph, within the cell
 */
function outline(cell) {
  const on = (/** @type {number} */ j, /** @type {number} */ i) => cell[j]?.[i] ?? false;
  return cell.map((row, j) =>
    row.map((_, i) => !on(j, i) && [-1, 0, 1].some((dj) => [-1, 0, 1].some((di) => on(j + dj, i + di))))
  );
}

/**
 * @param {boolean[]} row
 * @return {number}
 */
const bits = (row) => row.reduce((value, on) => (value << 1) | (on ? 1 : 0), 0);

const size = GLYPHS.length * HEIGHT;
const rows = GLYPHS.map(([name, cell], k) => {
  const around = outline(cell);
  const values = cell.map((row, j) => bits(row) | (bits(around[j]) << WIDTH));
  return `  ${values.join(', ')}${k === GLYPHS.length - 1 ? '' : ','} // ${name}`;
});
const table = `const int FONT[${size}] = int[${size}](\n${rows.join('\n')}\n);`;

const shader = await readFile(SHADER, 'utf8');
const updated = shader.replace(/const int FONT\[\d+\] = int\[\d+\]\([^)]*\);/, table);
if (updated === shader && !shader.includes(table)) {
  throw new Error(`no FONT table in ${SHADER}`);
}
await writeFile(SHADER, updated);
