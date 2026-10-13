/**
 * A skatepark scaled up for a camera that flies hundreds of metres from its marker,
 * as a height function in a local frame, the ride across it, and the painting of
 * the map and the terrain tiles. No CesiumJS here: this also runs in a worker.
 */

// a synthetic world: a local frame in metres, east and north of a point in the Alps
const LON0 = 7;
const LAT0 = 46;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = M_PER_DEG_LAT * Math.cos((LAT0 * Math.PI) / 180);
export const local = (lon, lat) => [(lon - LON0) * M_PER_DEG_LON, (lat - LAT0) * M_PER_DEG_LAT];
export const degrees = (e, n) => [LON0 + e / M_PER_DEG_LON, LAT0 + n / M_PER_DEG_LAT];

const smoothstep = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
// 1 inside the box, fading to 0 over `edge` metres outside it
const box = (e, n, [e0, e1, n0, n1], edge) =>
  smoothstep((e - e0) / edge + 1) *
  smoothstep((e1 - e) / edge + 1) *
  smoothstep((n - n0) / edge + 1) *
  smoothstep((n1 - n) / edge + 1);
const distanceToSegment = (e, n, [e0, n0], [e1, n1]) => {
  const de = e1 - e0;
  const dn = n1 - n0;
  const t = Math.min(1, Math.max(0, ((e - e0) * de + (n - n0) * dn) / (de * de + dn * dn)));
  return Math.hypot(e - e0 - t * de, n - n0 - t * dn);
};

// A skatepark scaled up for a camera that flies hundreds of metres from its marker,
// south to north: a start bowl, a corner, rollers, a spine, a doorway between two
// blocks, a stair set up to a deck and a quarter pipe off it, a halfpipe through a
// quarter turn whose west leg is a wallride, a long flat, a mound, a pyramid crossed
// over its hips, a peanut bowl with a loop in its deep end, and a snake run that
// deepens as it winds up a slope into an end pocket with a dead-end wall.
const BASE = 500;
// the distance to a polyline, and how far along it the nearest point is, 0 to 1
const nearestOnPolyline = (e, n, points) => {
  let d = Infinity;
  let length = 0;
  let at = 0;
  for (let i = 1; i < points.length; i++) {
    const [[e0, n0], [e1, n1]] = [points[i - 1], points[i]];
    const de = e1 - e0;
    const dn = n1 - n0;
    const k = Math.min(1, Math.max(0, ((e - e0) * de + (n - n0) * dn) / (de * de + dn * dn)));
    const dist = Math.hypot(e - e0 - k * de, n - n0 - k * dn);
    const segment = Math.hypot(de, dn);
    if (dist < d) {
      d = dist;
      at = length + k * segment;
    }
    length += segment;
  }
  return [d, at / length];
};
// No wall steeper than 60 degrees, and a fillet wherever a wall meets a deck or a
// floor: a terrain mesh renders a vertical face or a sharp coping as a sawtooth.
const WALL = Math.PI / 3;
const FILLET = 30;
// max(0, v) rounded over [-w, w]
const softMax0 = (v, w = FILLET) => (v <= -w ? 0 : v >= w ? v : ((v + w) * (v + w)) / (4 * w));
// a concave transition from flat to a wall, as a quarter pipe of radius R: 0 at x = 0,
// a circle up to 60 degrees, then straight at that slope until it reaches R and
// rounds onto the deck
const transition = (x, R) => {
  const xc = R * Math.sin(WALL);
  const h = x <= 0 ? 0 : x <= xc ? R - Math.sqrt(R * R - x * x) : R * (1 - Math.cos(WALL)) + (x - xc) * Math.tan(WALL);
  return R - softMax0(R - h);
};
// a channel with a flat floor and quarter-pipe walls, from the distance to its centreline
const channel = (d, floor, R) => transition(d - floor, R);
// a bowl: a cut below the deck of `depth`, a flat floor of radius `floor`, walls of
// radius R that round onto the deck at the coping
const bowl = (e, n, [ce, cn], floor, R, depth) => softMax0(depth - transition(Math.hypot(e - ce, n - cn) - floor, R));
// an arc of track points around a centre, from one bearing to another in degrees,
// counterclockwise when the second is larger; the radius may vary along the arc
const arc = ([ce, cn], r, from, to, step = 7.5) => {
  const count = Math.max(1, Math.round(Math.abs(to - from) / step));
  return Array.from({length: count + 1}, (_, i) => {
    const t = i / count;
    const a = ((from + (to - from) * t) * Math.PI) / 180;
    const radius = typeof r === 'function' ? r(t) : r;
    return [ce + radius * Math.cos(a), cn + radius * Math.sin(a)];
  });
};
// a line of track points along the north axis, with an east offset as a function of
// the distance along it
const sweep = (e, n0, n1, offset, step = 25) => {
  const count = Math.ceil(Math.abs(n1 - n0) / step);
  return Array.from({length: count + 1}, (_, i) => {
    const d = ((n1 - n0) * i) / count;
    return [e + offset(Math.abs(d)), n0 + d];
  });
};

// the park's footprint: east and north bounds in metres
export const PARK_BOUNDS = [-3300, 1300, -500, 13800];
const START = [[0, 0], 150, 200, 150];
const PIPE_CENTER = [-450, 5900];
const PIPE_RADIUS = 450;
const PIPE_LEGS = [
  [
    [0, 4300],
    [0, 5900],
  ],
  [
    [-450, 6350],
    [-2200, 6350],
  ],
];
const MOUND = [-2000, 7700];
const PYRAMID = [-2000, 9000];
const PEANUT = [
  [[-2000, 9950], 150, 150, 100],
  [[-2000, 10450], 200, 200, 180],
];
// the snake run's centreline: two waves 600 m wide over 1900 m
const SNAKE_WAVE = (d) => 600 * Math.sin((2 * Math.PI * d) / 950);
const SNAKE = sweep(-2000, 10900, 12800, SNAKE_WAVE, 50);
const POCKET = [-2000, 13150];
export const height = (e, n) => {
  let h = BASE;
  // the start: on the floor of a bowl, every way out is up
  h -= bowl(e, n, ...START);
  // the elements on the first straight sit on a strip 1 km wide around the track
  const strip = smoothstep((e - 0) / 100 + 1) * smoothstep((1000 - e) / 100 + 1);
  // three rollers, 50 m high and 300 m long
  if (n >= 1400 && n <= 2300) h += strip * 25 * (1 - Math.cos((2 * Math.PI * (n - 1400)) / 300));
  // a spine: two quarter pipes back to back, 220 m high
  h += strip * transition(300 - Math.abs(n - 2600), 300);
  // a doorway: two blocks 200 m high with a gap between them for the track
  h += 200 * (box(e, n, [50, 335, 2900, 3100], 180) + box(e, n, [665, 950, 2900, 3100], 180));
  // a stair set of ten steps 20 m high up to a deck 200 m high, and a quarter pipe off
  // its north edge
  if (n >= 3400 && n < 4300) {
    const step = (n - 3400) / 35;
    h += strip * Math.min(200, 20 * (Math.floor(step) + smoothstep(((step % 1) * 35 - 25) / 10)));
  } else if (n >= 4300) h += strip * transition(4500 - n, 200);
  // a halfpipe cut into a deck 250 m high: a floor 200 m wide, walls of radius 250, and
  // a rim 300 m wide beyond the coping. Its west leg is a wallride: the south wall is
  // gone, the track runs along the foot of the north wall with open ground beside it
  // (the distances are only measured inside its footprint: the map paints tens of
  // thousands of samples per tile)
  const pipeMask = box(e, n, [-1700, 1000, 4800, 6700], 300);
  if (pipeMask > 0) {
    const [ce, cn] = PIPE_CENTER;
    const angle = Math.atan2(n - cn, e - ce);
    const legs = PIPE_LEGS.map((leg) => distanceToSegment(e, n, ...leg));
    const arc = angle >= 0 && angle <= Math.PI / 2 ? Math.abs(Math.hypot(e - ce, n - cn) - PIPE_RADIUS) : Infinity;
    const walls = [legs[0], arc, e < ce && n < cn + PIPE_RADIUS ? 0 : legs[1]];
    h +=
      pipeMask *
      (1 - smoothstep((Math.min(...legs, arc) - 650) / 200)) *
      Math.min(...walls.map((d) => channel(d, 100, 250)));
  }
  // a mound: a spherical cap 350 m high
  const rm = Math.hypot(e - MOUND[0], n - MOUND[1]);
  if (rm < 712) h += Math.sqrt(900 * 900 - rm * rm) - 550;
  // a pyramid 150 m high on a base 800 m wide; the track crosses it off-axis, over two hips
  h += Math.max(0, 150 * (1 - Math.max(Math.abs(e - PYRAMID[0]), Math.abs(n - PYRAMID[1])) / 400));
  // a peanut bowl: a shallow cavity and a deep one, joined at a waist
  h -= Math.max(...PEANUT.map((cavity) => bowl(e, n, ...cavity)));
  // a snake run winding up a slope 400 m high: a channel with a floor 100 m wide whose
  // walls grow from 30 m to 150 m along the run, opening into an end pocket whose north
  // wall is vertical: the run dead-ends at its foot
  h += box(e, n, [-3000, -1000, 10700, 13600], 450) * 400 * smoothstep((n - 10900) / 1900);
  const snakeMask = box(e, n, [-3000, -1000, 10800, 12900], 200);
  if (snakeMask > 0) {
    const [d, t] = nearestOnPolyline(e, n, SNAKE);
    h += snakeMask * channel(d, 50, 30 + 120 * t);
  }
  h -= bowl(e, n, POCKET, 250, n > POCKET[1] ? 150 : 250, 150);
  return h;
};
// The ride: a spline through these points. It drops in on the start bowl's wall,
// rounds the corner, runs the first straight, weaves up the halfpipe's walls, carves
// the wallride's one wall, sweeps an S on the flat, curves over the mound's shoulder,
// crosses the pyramid on a diagonal, carves the shallow end of the peanut, loops high
// in its deep end, rides the outside of every bend of the snake run, and spirals up
// the pocket's wall to the dead end.
const wave = (amplitude, period) => (d) => amplitude * Math.sin((2 * Math.PI * d) / period);
export const TRACK = [
  ...arc(START[0], 280, -90, 90),
  [0, 500],
  ...arc([150, 650], 150, 180, 90),
  ...arc([350, 950], 150, 270, 360),
  [500, 1200],
  [500, 2850],
  [500, 3300],
  [500, 4600],
  [500, 4700],
  [250, 4900],
  ...sweep(0, 5100, 5900, wave(260, 800)),
  ...arc(PIPE_CENTER, (t) => PIPE_RADIUS + 260 * Math.sin(2 * Math.PI * t), 0, 90).slice(1),
  ...Array.from({length: 63}, (_, i) => [
    -450 - 25 * i,
    6350 + 130 * (1 - Math.cos((2 * Math.PI * 25 * i) / 700)),
  ]).slice(1),
  [-2000, 6600],
  [-1750, 6900],
  [-2250, 7250],
  [-2050, 7500],
  [-1800, 7750],
  [-2000, 8050],
  [-2250, 8350],
  [-2450, 8650],
  [-1600, 9300],
  [-1750, 9550],
  [-2000, 9730],
  ...arc(PEANUT[0][0], 220, -90, -270).slice(1),
  ...arc(PEANUT[1][0], 280, -90, 270).slice(1),
  [-2000, 10600],
  [-2000, 10800],
  ...sweep(-2000, 10900, 12800, (d) => SNAKE_WAVE(d) * 1.2).slice(1),
  ...arc(POCKET, 350, -90, 450).slice(1),
];

// a centripetal Catmull-Rom spline through the track points, so that no junction
// is a kink, sampled every 25 m: the library samples the terrain at the track's
// points, as dense as a GPS track's
export const spline = (points, spacing) => {
  const out = [points[0]];
  const at = (i) => points[Math.min(Math.max(i, 0), points.length - 1)];
  const knot = (a, b) => Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1]));
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    // the clamped ends repeat a point: a knot must still have a length
    const t0 = 0;
    const t1 = t0 + Math.max(knot(p0, p1), 1e-6);
    const t2 = t1 + Math.max(knot(p1, p2), 1e-6);
    const t3 = t2 + Math.max(knot(p2, p3), 1e-6);
    const steps = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing);
    for (let k = 1; k <= steps; k++) {
      const t = t1 + ((t2 - t1) * k) / steps;
      const lerp = (a, b, ta, tb) => a.map((v, j) => ((tb - t) * v + (t - ta) * b[j]) / (tb - ta));
      const a1 = lerp(p0, p1, t0, t1);
      const a2 = lerp(p1, p2, t1, t2);
      const a3 = lerp(p2, p3, t2, t3);
      const b1 = lerp(a1, a2, t0, t2);
      const b2 = lerp(a2, a3, t1, t3);
      out.push(lerp(b1, b2, t1, t2));
    }
  }
  return out;
};
const TINT = [
  [214, 224, 200],
  [188, 194, 184],
  [240, 241, 236],
];
// the tone of the flat deck, and of the ground around the park
export const PLAIN = '#c8d0bd';
const PLAIN_RGB = [200, 208, 189, 255];
const SUN = [Math.SQRT1_2 * Math.SQRT1_2, Math.SQRT1_2 * Math.SQRT1_2, Math.SQRT1_2];
const JOINT_SLOPE = Math.tan((5 * Math.PI) / 180);
// a hash of the cell of `size` metres holding the point, 0 to 1
const speck = (e, n, size) => {
  const v = Math.sin(Math.floor(e / size) * 127.1 + Math.floor(n / size) * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
// the tint spans the park's relief, from the pocket floor to the top of the snake run
const TINT_RANGE = [BASE - 150, BASE + 800];
/**
 * Consecutive identical points would give the spline a zero-length knot.
 * @param {number[][]} points
 */
export const dedupe = (points) =>
  points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);

/**
 * The map, painted tile by tile from the height function at the tile's own resolution:
 * a hypsometric tint under a hillshade and contour lines every 20 m, antialiased from
 * their distance to the pixel.
 * @param {{west: number, north: number, dLon: number, dLat: number, size: number}} tile
 *   the tile's northwest corner in degrees, its pixel size in degrees, its width in pixels
 * @return {Uint8ClampedArray} RGBA
 */
export const paintTile = ({west, north, dLon, dLat, size}) => {
  const image = {data: new Uint8ClampedArray(4 * size * size)};
  // beyond the park the map is the plain tone of the ground around it
  const [e0, e1, n0, n1] = PARK_BOUNDS;
  const [we, nn] = local(west, north);
  const [ee, sn] = local(west + size * dLon, north - size * dLat);
  if (ee < e0 || we > e1 || nn < n0 || sn > n1) {
    for (let i = 0; i < size * size; i++) image.data.set(PLAIN_RGB, 4 * i);
    return image.data;
  }
  const metresPerPixel = dLat * M_PER_DEG_LAT;
  // two rows and columns more, for the slope of the last pixels and its change
  const stride = size + 2;
  const heights = new Float32Array(stride * stride);
  for (let row = 0; row < stride; row++) {
    for (let col = 0; col < stride; col++) {
      heights[row * stride + col] = height(...local(west + col * dLon, north - row * dLat));
    }
  }
  const slopeAt = (row, col) => {
    const h = heights[row * stride + col];
    return Math.hypot(heights[row * stride + col + 1] - h, h - heights[(row + 1) * stride + col]) / metresPerPixel;
  };
  // a line one pixel wide, from the distance in pixels to its centre
  const line = (distance) => Math.max(0, Math.min(1, 1.5 - distance));
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const [e, n] = local(west + col * dLon, north - row * dLat);
      if (e < e0 || e > e1 || n < n0 || n > n1) {
        image.data.set(PLAIN_RGB, 4 * (row * size + col));
        continue;
      }
      const h = heights[row * stride + col];
      const t = Math.max(0, Math.min(1, (h - TINT_RANGE[0]) / (TINT_RANGE[1] - TINT_RANGE[0])));
      const [lower, upper, k] = t < 0.5 ? [TINT[0], TINT[1], 2 * t] : [TINT[1], TINT[2], 2 * t - 1];
      let r = lower[0] + (upper[0] - lower[0]) * k;
      let g = lower[1] + (upper[1] - lower[1]) * k;
      let b = lower[2] + (upper[2] - lower[2]) * k;
      const right = heights[row * stride + col + 1];
      const below = heights[(row + 1) * stride + col];
      // the sun from the northwest, 45 degrees up; a slope facing it is brightest
      const de = (right - h) / metresPerPixel;
      const dn = (h - below) / metresPerPixel;
      const shade = (de * SUN[0] - dn * SUN[1] + SUN[2]) / Math.hypot(de, dn, 1);
      const light = 0.55 + 0.6 * Math.max(0, shade);
      r *= light;
      g *= light;
      b *= light;
      // the contours: the height to the nearest one, over the slope, is the distance
      // to it on the ground; where they would crowd closer than a few pixels they fade
      const slope = Math.hypot(de, dn);
      const contourPixels = 20 / Math.max(slope, 1e-6) / metresPerPixel;
      const nearest = 20 * Math.round(h / 20);
      const distance = Math.abs(h - nearest) / Math.max(slope, 1e-6) / metresPerPixel;
      const crowd = smoothstep((contourPixels - 2) / 4);
      const contour = line(distance) * crowd;
      const major = Math.round(nearest / 100) * 100 === nearest;
      // the concrete: a speckle in cells of 4 m and of 40 m, each fading out where its
      // cells would be smaller than a couple of pixels
      const speckle = 0.06 * (speck(e, n, 4) * smoothstep((2 - metresPerPixel) / 2) + speck(e, n, 40) * smoothstep((20 - metresPerPixel) / 20));
      // the joints: a line where the slope crosses 5 degrees, which is every coping, every
      // foot of a wall and every stair riser; its distance is the slope's excess over its
      // own change from pixel to pixel
      const slopeChange = Math.hypot(slopeAt(row, col + 1) - slope, slopeAt(row + 1, col) - slope);
      const joint = line(Math.abs(slope - JOINT_SLOPE) / Math.max(slopeChange, 1e-6));
      const darken = Math.max(contour * (major ? 0.55 : 0.25), joint * 0.4, speckle);
      image.data[4 * (row * size + col)] = r * (1 - darken);
      image.data[4 * (row * size + col) + 1] = g * (1 - darken);
      image.data[4 * (row * size + col) + 2] = b * (1 - darken);
      image.data[4 * (row * size + col) + 3] = 255;
    }
  }
  return image.data;
};

/**
 * The terrain heights of a tile, row by row from the northwest corner.
 * @param {{west: number, south: number, east: number, north: number, samples: number}} tile
 *   the tile's bounds in degrees, its samples per side
 * @return {Float32Array}
 */
export const terrainTile = ({west, south, east, north, samples}) => {
  const heights = new Float32Array(samples * samples);
  for (let row = 0; row < samples; row++) {
    const lat = north - ((north - south) * row) / (samples - 1);
    for (let col = 0; col < samples; col++) {
      const lon = west + ((east - west) * col) / (samples - 1);
      heights[row * samples + col] = height(...local(lon, lat));
    }
  }
  return heights;
};
