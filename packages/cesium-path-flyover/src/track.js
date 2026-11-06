import {Cartesian3, Color, FixedFrameTransforms, Math as CesiumMath, Matrix3, Matrix4, Quaternion} from "@cesium/core";
import {Resource} from "@cesium/engine";

/** @import {Ellipsoid} from "@cesium/core" */

const scratchA = new Cartesian3();
const scratchB = new Cartesian3();
const scratchMatrix = new Matrix4();
const scratchMatrix3 = new Matrix3();
const scratchQuaternion = new Quaternion();

/**
 * @typedef {[number, number] | [number, number, number]} LonLat longitude and latitude in
 * degrees, then the point's time in seconds since the epoch when the track records it
 */

/**
 * @param {string} text GPX or GeoJSON content
 * @return {LonLat[]}
 */
export function parseTrack(text) {
  const coords = parseGeoJson(text) ?? parseGpx(text);
  if (!coords) {
    throw new Error("No track found: expected a GeoJSON LineString or GPX trkpt or rtept elements");
  }
  if (coords.length < 2) {
    throw new Error("A track needs at least two points");
  }
  return coords;
}

/**
 * @param {string} text GPX or GeoJSON content
 * @return {string | undefined} the name of the track, or of the first named feature
 */
export function parseTrackName(text) {
  const json = parseJson(text);
  if (json) {
    /** @type {any[]} */
    const features = json.type === "FeatureCollection" ? json.features ?? [] : [json];
    return features.find((f) => f.properties?.name)?.properties.name;
  }
  return /<(?:\w+:)?(?:trk|rte)\b[^>]*>\s*<(?:\w+:)?name>([^<]*)<\/(?:\w+:)?name>/.exec(text)?.[1].trim() || undefined;
}

/**
 * @param {string} text
 * @return {any} the parsed JSON, undefined when the text is none
 */
function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * @param {string} text
 * @return {LonLat[] | undefined}
 */
function parseGeoJson(text) {
  const json = parseJson(text);
  if (!json) {
    return undefined;
  }
  const geometries = [];
  if (json.type === "FeatureCollection") {
    for (const feature of json.features ?? []) {
      geometries.push(feature.geometry);
    }
  } else if (json.type === "Feature") {
    geometries.push(json.geometry);
  } else {
    geometries.push(json);
  }
  for (const geometry of geometries) {
    if (geometry?.type === "LineString") {
      return geometry.coordinates.map(toLonLat);
    }
    if (geometry?.type === "MultiLineString") {
      return geometry.coordinates.flat().map(toLonLat);
    }
  }
  return undefined;
}

/**
 * @param {number[]} coordinate
 * @return {LonLat}
 */
function toLonLat(coordinate) {
  return [coordinate[0], coordinate[1]];
}

/**
 * @param {string} text
 * @return {LonLat[] | undefined}
 */
function parseGpx(text) {
  return parseGpxPoints(text, "trkpt") ?? parseGpxPoints(text, "rtept");
}

/**
 * @param {string} text
 * @param {string} tag
 * @return {LonLat[] | undefined}
 */
function parseGpxPoints(text, tag) {
  const coords = [];
  // a point's children up to its closing tag, or none for a self-closing point
  const pattern = new RegExp(`<(?:\\w+:)?${tag}\\b([^>]*?)(/>|>([\\s\\S]*?)</(?:\\w+:)?${tag}>)`, "g");
  for (const [, attributes, , children] of text.matchAll(pattern)) {
    const lat = /\blat\s*=\s*["']([^"']+)["']/.exec(attributes);
    const lon = /\blon\s*=\s*["']([^"']+)["']/.exec(attributes);
    if (lat && lon) {
      const coord = /** @type {LonLat} */ ([parseFloat(lon[1]), parseFloat(lat[1])]);
      const time = children && /<(?:\w+:)?time>([^<]*)</.exec(children);
      const seconds = time ? Date.parse(time[1]) / 1000 : NaN;
      if (!isNaN(seconds)) {
        coord.push(seconds);
      }
      coords.push(coord);
    }
  }
  return coords.length > 0 ? coords : undefined;
}

/**
 * @param {LonLat[]} coords
 * @param {number} minDistance meters
 * @param {Ellipsoid} ellipsoid
 * @return {LonLat[]}
 */
export function decimate(coords, minDistance, ellipsoid) {
  const kept = [coords[0]];
  let last = Cartesian3.fromDegrees(coords[0][0], coords[0][1], 0, ellipsoid, scratchA);
  for (let i = 1; i < coords.length; i++) {
    const current = Cartesian3.fromDegrees(coords[i][0], coords[i][1], 0, ellipsoid, scratchB);
    if (Cartesian3.distance(last, current) >= minDistance) {
      kept.push(coords[i]);
      last = Cartesian3.clone(current, scratchA);
    }
  }
  return kept;
}

// the trail's corners rounded over at most this, meters, in turns of at most CORNER_TURN (see roundCorners)
export const CORNER_TRIM = 5;
export const CORNER_TURN = CesiumMath.toRadians(10);
// meters at most between the trail's points, each at the terrain's height; longer on a long track (see trailPath)
export const TRAIL_STEP = 5;
// a polyline's vertices take 100 to 160 B, and 4 B for the color carrying st.s, 4 a point, in each of the trail's two
// layers: under 30 MB at the cap
export const TRAIL_MAX_POINTS = 20000;

/**
 * Rounds the corners of a polyline: each corner is replaced by an arc from a point before it to a point after it, at
 * most `trim` meters from the corner and 0.4 of each segment (two arcs never meet: Cesium would drop the point they
 * share), in equal turns of at most `maxTurn`, which a polyline's miters join without a notch. A turn back on
 * itself, where the arc has no plane, keeps its corner.
 * @param {Cartesian3[]} points
 * @param {number} trim meters
 * @param {number} maxTurn radians
 * @return {Cartesian3[]} the rounded polyline
 */
export function roundCorners(points, trim, maxTurn) {
  const rounded = [points[0]];
  const ahead = new Cartesian3();
  const out = new Cartesian3();
  const axis = new Cartesian3();
  const chord = new Cartesian3();
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i];
    const inLength = Cartesian3.distance(points[i - 1], corner);
    const outLength = Cartesian3.distance(corner, points[i + 1]);
    Cartesian3.normalize(Cartesian3.subtract(corner, points[i - 1], ahead), ahead);
    Cartesian3.normalize(Cartesian3.subtract(points[i + 1], corner, out), out);
    const turn = Cartesian3.angleBetween(ahead, out);
    const pieces = Math.ceil(turn / maxTurn);
    Cartesian3.cross(ahead, out, axis);
    if (pieces < 2 || Cartesian3.magnitude(axis) < CesiumMath.EPSILON6) {
      rounded.push(corner);
      continue;
    }
    Cartesian3.normalize(axis, axis);
    const t = Math.min(trim, 0.4 * inLength, 0.4 * outLength);
    const start = Cartesian3.subtract(corner, Cartesian3.multiplyByScalar(ahead, t, scratchA), new Cartesian3());
    const end = Cartesian3.add(corner, Cartesian3.multiplyByScalar(out, t, scratchA), new Cartesian3());
    // the arc's chords, each turned by turn / pieces from the one before, the first by half of it
    const directions = Array.from({length: pieces}, (_, k) => {
      const rotation = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(axis, ((k + 0.5) * turn) / pieces, scratchQuaternion), scratchMatrix3);
      return Matrix3.multiplyByVector(rotation, ahead, new Cartesian3());
    });
    Cartesian3.subtract(end, start, chord);
    const sum = directions.reduce((total, d) => Cartesian3.add(total, d, total), new Cartesian3());
    const length = Cartesian3.magnitude(chord) / Cartesian3.magnitude(sum);
    let point = start;
    rounded.push(point);
    for (const direction of directions) {
      point = Cartesian3.add(point, Cartesian3.multiplyByScalar(direction, length, direction), new Cartesian3());
      rounded.push(point);
    }
  }
  if (points.length > 1) {
    rounded.push(points[points.length - 1]);
  }
  return rounded;
}

/**
 * Adds points along a polyline's segments so that none is longer than `step`, each segment cut into equal parts.
 * Cesium's own subdivision (PolylineGeometry's granularity) happens on the GPU's side of the geometry, where the new
 * points cannot get their own terrain heights.
 * @param {Cartesian3[]} points
 * @param {number} step meters
 * @return {Cartesian3[]} the dense polyline
 */
export function densify(points, step) {
  const dense = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const pieces = Math.max(1, Math.ceil(Cartesian3.distance(points[i - 1], points[i]) / step));
    for (let j = 1; j <= pieces; j++) {
      dense.push(Cartesian3.lerp(points[i - 1], points[i], j / pieces, new Cartesian3()));
    }
  }
  return dense;
}

/**
 * The trail's polyline through a track's points: its corners rounded, then points added at most `step` apart, so that
 * heights sampled at its points follow the terrain. At most `maxPoints` points, or the track's own where it has more:
 * the corners' arcs turn in coarser steps where they would take more than half of them, and the step is longer.
 * @param {Cartesian3[]} points
 * @param {number} trim meters, see roundCorners
 * @param {number} maxTurn radians, see roundCorners
 * @param {number} step meters
 * @param {number} maxPoints
 * @return {Cartesian3[]} the polyline
 */
export function trailPath(points, trim, maxTurn, step, maxPoints) {
  let rounded = roundCorners(points, trim, maxTurn);
  for (let turn = 2 * maxTurn; rounded.length > maxPoints / 2 && turn < Math.PI; turn *= 2) {
    rounded = roundCorners(points, trim, turn);
  }
  // densify adds at most a segment's length over the step, plus one, to each segment
  const budget = maxPoints - rounded.length;
  const roundedLength = cumulativeDistances(rounded)[rounded.length - 1];
  return densify(rounded, budget > 0 ? Math.max(step, roundedLength / budget) : Infinity);
}

/**
 * The trail's st.s at each of its points.
 * @param {Float64Array} distances each point's distance along the trail, see cumulativeDistances
 * @param {boolean} byDistance st.s by the distance, else by the points' count, as Cesium spreads it
 * @return {Float64Array} 0 to 1
 */
export function trailAlong(distances, byDistance) {
  const last = distances.length - 1;
  return distances.map((d, i) => (byDistance ? d / distances[last] : i / last));
}

/**
 * Fills the gaps of a series, each missing value interpolated between its nearest neighbors, or the nearest one at
 * an end; 0 where none has a value.
 * @param {(number | undefined)[]} values
 * @return {number[]}
 */
export function fillGaps(values) {
  /** @type {number[]} */
  const known = [];
  values.forEach((v, i) => v !== undefined && known.push(i));
  if (known.length === 0) {
    return values.map(() => 0);
  }
  let next = 0;
  return values.map((v, i) => {
    if (v !== undefined) {
      return v;
    }
    while (next < known.length && known[next] < i) {
      next++;
    }
    const before = known[next - 1];
    const after = known[next];
    if (before === undefined) {
      return /** @type {number} */ (values[after]);
    }
    if (after === undefined) {
      return /** @type {number} */ (values[before]);
    }
    return CesiumMath.lerp(/** @type {number} */ (values[before]), /** @type {number} */ (values[after]), (i - before) / (after - before));
  });
}

/**
 * A fraction in a color's 24 bits, for the trail's shader to read it as its st.s.
 * @param {number} along a fraction, 0 to 1
 * @return {Color}
 */
export function trailColor(along) {
  const bits = Math.round(along * 0xffffff);
  return Color.fromBytes(bits >> 16, (bits >> 8) & 0xff, bits & 0xff, 255);
}

/**
 * @param {Cartesian3[]} points
 * @return {Float64Array} each point's distance along the polyline, meters
 */
export function cumulativeDistances(points) {
  const distances = new Float64Array(points.length);
  for (let i = 1; i < points.length; i++) {
    distances[i] = distances[i - 1] + Cartesian3.distance(points[i - 1], points[i]);
  }
  return distances;
}

/**
 * Weighted average of the forward tangents along the upcoming samples, in the
 * east-north-up frame of the first sample. Nearer steps weigh more.
 * @param {Cartesian3[]} samples current position followed by points ahead
 * @param {number} previous heading returned when the steps cancel or vanish
 * @return {number} heading in radians, 0 is north, clockwise
 */
export function forwardHeading(samples, previous) {
  const enu = FixedFrameTransforms.eastNorthUpToFixedFrame(samples[0], undefined, scratchMatrix);
  const inverse = Matrix4.inverseTransformation(enu, scratchMatrix);
  const steps = samples.length - 1;
  let east = 0;
  let north = 0;
  let last = Matrix4.multiplyByPoint(inverse, samples[0], scratchA);
  for (let i = 1; i <= steps; i++) {
    const current = Matrix4.multiplyByPoint(inverse, samples[i], scratchB);
    const dx = current.x - last.x;
    const dy = current.y - last.y;
    const length = Math.hypot(dx, dy);
    if (length > CesiumMath.EPSILON6) {
      const weight = 1 - (i - 1) / steps;
      east += (dx / length) * weight;
      north += (dy / length) * weight;
    }
    last = Cartesian3.clone(current, scratchA);
  }
  if (Math.hypot(east, north) < CesiumMath.EPSILON6) {
    return previous;
  }
  return Math.atan2(east, north);
}

/**
 * @param {string} url
 * @return {Promise<string>}
 */
export function fetchTrackText(url) {
  return /** @type {Promise<string>} */ (Resource.fetchText({url}));
}

/**
 * Frame-rate independent exponential smoothing.
 * @param {number} current
 * @param {number} target
 * @param {number} dt seconds since the last call
 * @param {number} tau time constant in seconds
 * @return {number}
 */
export function damp(current, target, dt, tau) {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/**
 * Same as damp for angles in radians, taking the short way around.
 * @param {number} current
 * @param {number} target
 * @param {number} dt
 * @param {number} tau
 * @return {number}
 */
export function dampAngle(current, target, dt, tau) {
  return damp(current, current + CesiumMath.negativePiToPi(target - current), dt, tau);
}

const BREATH_PERIODS = [12, 19, 31];

/**
 * A slow drift in [-1, 1]: three sines with incommensurate periods, phases from
 * the seed, so a run replays the same way.
 * @param {number} seconds
 * @param {number} seed
 * @return {number}
 */
export function breathe(seconds, seed) {
  let value = 0;
  BREATH_PERIODS.forEach((period, i) => {
    value += Math.sin((CesiumMath.TWO_PI * seconds) / period + seed * (i + 1));
  });
  return value / BREATH_PERIODS.length;
}

/**
 * Maps a linear time fraction to a path fraction: smoothstep speed ramps over
 * the first and last `ramp` fraction of the time, constant speed in between.
 * @param {number} u time fraction in [0, 1]
 * @param {number} ramp fraction of the time spent in each ramp, at most 0.5
 * @return {number} path fraction in [0, 1]
 */
export function easedProgress(u, ramp) {
  if (ramp <= 0) {
    return u;
  }
  const r = Math.min(ramp, 0.5);
  // integral of smoothstep(x) = 3x^2 - 2x^3 from 0 to x
  const rampDistance = (/** @type {number} */ x) => r * (x ** 3 - x ** 4 / 2);
  const total = 1 - r;
  let distance;
  if (u < r) {
    distance = rampDistance(u / r);
  } else if (u <= 1 - r) {
    distance = r / 2 + (u - r);
  } else {
    distance = total - rampDistance((1 - u) / r);
  }
  return distance / total;
}

/**
 * Inverse of easedProgress: the time fraction at which a path fraction is reached.
 * @param {number} p path fraction in [0, 1]
 * @param {number} ramp fraction of the time spent in each ramp, at most 0.5
 * @return {number} time fraction in [0, 1]
 */
export function easedProgressInverse(p, ramp) {
  // easedProgress rises steadily, a bisection finds the time without solving the ramps' quartic
  let low = 0;
  let high = 1;
  for (let i = 0; i < 50; i++) {
    const middle = (low + high) / 2;
    if (easedProgress(middle, ramp) < p) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}
