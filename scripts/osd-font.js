// Writes the FONT table of the drone display's shader from the pixel drawings below: each glyph is
// drawn at the MAX7456's 12 x 18 pixels, '#' for white, and becomes 18 rows of 24 bits: the
// glyph in the low 12, the leftmost pixel highest, and its black outline, the pixels around it
// within the cell, in the high 12, so that the shader reads one entry per pixel. The glyphs
// follow the sizes of Betaflight's default font but are drawn here. Run it after changing a
// drawing, then build the shaders: node scripts/osd-font.js && npm run build-shaders
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

// in the order of the shader's glyph constants: the digits, DOT, SPACE, MINUS, VOLT, METER,
// ALTITUDE, LINK_QUALITY, MARKER_RIGHT, MARKER_LEFT, CROSS_LEFT, CROSS_MIDDLE, CROSS_RIGHT,
// RETICLE_V, RETICLE_HEART
/** @type {[string, boolean[][]][]} */
const GLYPHS = [
  ...DIGITS.map((drawing, n) => /** @type {[string, boolean[][]]} */ ([String(n), place(drawing, 4, 4)])),
  ['.', place('##\n##', 5, 11)],
  ['space', EMPTY],
  ['-', place('####', 4, 8)],
  ['v, volts', place('#...#\n#...#\n#...#\n.#.#.\n.#.#.\n..#..', 3, 7)],
  ['m, meters', place('.#.#.\n#.#.#\n#.#.#\n#.#.#\n#.#.#\n#.#.#', 3, 7)],
  ['ALT, the altitude', place('.#...#...###\n#.#..#....#.\n###..#....#.\n#.#..#....#.\n#.#..###..#.', 0, 6)],
  [
    'LQ over a wedge, the link quality',
    merge(place('#...###\n#...#.#\n#...#.#\n#...###\n###...#', 1, 2), place('......#\n....#.#\n..#.#.#\n#.#.#.#', 3, 11)),
  ],
  ['>, the left level marker', place('#....\n.#...\n..#..\n...#.\n....#\n...#.\n..#..\n.#...\n#....', 4, 4)],
  ['<, the right level marker', place('....#\n...#.\n..#..\n.#...\n#....\n.#...\n..#..\n...#.\n....#', 3, 4)],
  ['the cross, left', place('####', 7, 8)],
  ['the cross, a ring in the middle', merge(place('.##.\n#..#\n#..#\n#..#\n#..#\n.##.', 4, 6), place('##', 0, 8), place('##', 10, 8))],
  ['the cross, right', place('####', 1, 8)],
  ['a V with wings, a reticle', place('#.#......#.#\n...#....#...\n....#..#....\n.....##.....', 0, 5)],
  ['a heart, a reticle', place('.##..##.\n#..##..#\n#......#\n.#....#.\n..#..#..\n...##...', 2, 6)],
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
