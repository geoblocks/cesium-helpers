import {Cartesian3, Cartographic, Math as CesiumMath} from "@cesium/core";
import {EllipsoidTerrainProvider} from "@cesium/engine";
import {breathe, dampAngle, easedProgress, forwardHeading} from "./track.js";
import {SAMPLE_SPACING, curvature, gaussianSmooth, planCamera, reliefProfile, sampleProfile, smoothPositions} from "./planner.js";

/** @import {CatmullRomSpline, Ellipsoid} from "@cesium/core" */
/** @import {TerrainProvider} from "@cesium/engine" */
/** @import {Run} from "./run.js" */
/** @import TerrainSampler from "./terrain.js" */

export const MARKER_HEIGHT = 2;
export const EASE_SECONDS = 3;
const HEADING_SAMPLES = 8;
const ANTICIPATION_SECONDS = 1;
const TARGET_SIGMA = 1.5; // samples; the look-at target is the track blurred over about 30 m
const CURVATURE_SIGMA = 5; // samples, 100 m
// net turning, degrees per metre after the 100 m smoothing, that doubles the range
// at bendZoom 1: a hairpin reaches it, a GPS zigzag on a straight stays near zero
const FULL_ZOOM_CURVATURE = 0.5;
const BREATH_HEADING = CesiumMath.toRadians(5); // at breathing 1
const BREATH_HEIGHT = 10; // meters, at breathing 1
const BREATH_ROLL = CesiumMath.toRadians(2); // at breathing 1
const FULL_BANK_RATE = CesiumMath.toRadians(30); // heading rate, per second, at which the bank is full
const BANK_SIGMA = 2; // samples; the planner's offsets step on a grid

const sampleScratches = Array.from({length: HEADING_SAMPLES + 1}, () => new Cartesian3());
const pairScratch = sampleScratches.slice(0, 2);

/**
 * The camera path, sampled uniformly over the playback time. The camera looks at
 * `targets`, the marker path smoothed over a few samples so that the zigzags of a
 * track do not shake the camera, with the given heading.
 * @typedef {Object} Path
 * @property {Cartesian3[]} targets
 * @property {number[]} headings radians, with the terrain planner's offsets
 * @property {number[]} range meters, per sample: the run's range, wider in bends
 * @property {number[]} lift meters, per sample: the terrain planner's lift, the climb toward the surrounding relief and the breathing drift
 * @property {number[]} roll radians, per sample: the bank into the turns of the heading plus the breathing drift, positive leans right
 * @property {number[]} ground per spline point, its fraction of the track's length on the ground, where the trail measures it
 */

/**
 * The marker's track, as a spline over the fraction of its length.
 * @typedef {Object} Track
 * @property {CatmullRomSpline} spline
 * @property {number} length meters
 */

/**
 * What the camera path is planned for: the run, the camera's pitch and terrain
 * limits, and the scene's ellipsoid and terrain.
 * @typedef {Object} PathOptions
 * @property {Run} run
 * @property {number} pitch radians
 * @property {number} clearance minimum camera height above terrain, meters
 * @property {number} maxLift meters the camera may climb to keep the marker in view
 * @property {Ellipsoid} ellipsoid
 * @property {TerrainProvider} terrainProvider
 */

/**
 * Seconds for the whole run at the run's speed, the ease ramps included.
 * @param {number} length meters
 * @param {Run} run
 * @return {number}
 */
export function runDuration(length, run) {
  return length / run.speed + EASE_SECONDS;
}

/**
 * Tabulates the smoothed look-at target and the damped heading over the playback
 * time, then plans the terrain offsets and lifts on exactly that path.
 * @param {Track} track
 * @param {PathOptions} options
 * @param {TerrainSampler} sampler for the targets
 * @param {TerrainSampler} [planSampler] for the planner's corridor, the targets' by default
 * @return {Promise<Path>}
 */
export async function computePath(track, options, sampler, planSampler = sampler) {
  const {run, ellipsoid} = options;
  const {spline, length} = track;
  const count = Math.ceil(length / SAMPLE_SPACING) + 1;
  const duration = runDuration(length, run);
  const dt = duration / (count - 1);
  const ramp = EASE_SECONDS / duration;
  const panRate = CesiumMath.toRadians(run.panRate);
  const positions = [];
  /** @type {number[]} */
  const headings = [];
  /** @type {number[]} */
  const rise = [];
  const progresses = [];
  let heading = headingAt(track, run, 0, 0);
  for (let k = 0; k < count; k++) {
    const progress = easedProgress(k / (count - 1), ramp);
    progresses.push(progress);
    if (k > 0) {
      // damped, and never faster than the pan limit: the damping alone swings
      // through a hairpin at up to 75 degrees per second
      const damped = dampAngle(heading, headingAt(track, run, progress, heading), dt, run.headingTau);
      heading += CesiumMath.clamp(CesiumMath.negativePiToPi(damped - heading), -panRate * dt, panRate * dt);
    }
    // the drift rides on the damped heading (its own rate stays under 3 degrees
    // per second at full amplitude) and the planner plans on the drifting one
    const breath = run.breathing * breathe(k * dt, length);
    positions.push(spline.evaluate(progress, new Cartesian3()));
    headings.push(heading + BREATH_HEADING * breath);
    rise.push(BREATH_HEIGHT * run.breathing * breathe(k * dt, length + 100));
  }
  const range = rangeProfile(track, run, progresses);
  const {targets, heights} = await smoothTargets(positions, sampler, ellipsoid);
  if (!(options.terrainProvider instanceof EllipsoidTerrainProvider)) {
    const heightsAt = (/** @type {Cartographic[]} */ cartographics) => planSampler.heightsAt(cartographics);
    if (run.reliefRise > 0) {
      // a spectator sees over the ridges around the track; the camera keeps
      // looking at the target, so the rise only steepens the view
      const relief = await reliefProfile(targets, heights, range, ellipsoid, heightsAt);
      relief.forEach((r, k) => {
        rise[k] += run.reliefRise * r;
      });
    }
    const plan = await planCamera(
      {positions: targets, headings, ranges: range, rise},
      {
        pitch: options.pitch,
        clearance: options.clearance,
        ahead: Math.ceil(ANTICIPATION_SECONDS / dt),
        maxTurn: panRate * dt,
        maxLift: options.maxLift,
        offsetCost: run.turnCost,
        ellipsoid,
      },
      heightsAt
    );
    plan.headingOffset.forEach((offset, k) => {
      headings[k] += offset;
      rise[k] += plan.lift[k];
    });
  }
  return {targets, headings, range, lift: rise, roll: rollProfile(headings, dt, run, length), ground: groundFractions(spline, ellipsoid)};
}

/**
 * Each spline point's fraction of the track's length on the ground: the marker
 * runs on the climbs too, the trail's length along the line is flat.
 * @param {CatmullRomSpline} spline
 * @param {Ellipsoid} ellipsoid
 * @return {number[]}
 */
function groundFractions(spline, ellipsoid) {
  const flat = spline.points.map((p) => ellipsoid.scaleToGeodeticSurface(p, new Cartesian3()));
  const distances = [0];
  for (let i = 1; i < flat.length; i++) {
    distances.push(distances[i - 1] + Cartesian3.distance(flat[i - 1], flat[i]));
  }
  const total = distances[distances.length - 1];
  return distances.map((d) => d / total);
}

/**
 * The bank into the turns of the heading, and the breathing drift on top.
 * @param {number[]} headings
 * @param {number} dt seconds between samples
 * @param {Run} run
 * @param {number} length the track's, meters, which seeds the drift
 * @return {number[]}
 */
function rollProfile(headings, dt, run, length) {
  const count = headings.length;
  const full = CesiumMath.toRadians(run.bank);
  const bank = headings.map((h, k) => {
    const rate = CesiumMath.negativePiToPi(headings[Math.min(k + 1, count - 1)] - h) / dt;
    return full * CesiumMath.clamp(rate / FULL_BANK_RATE, -1, 1);
  });
  return gaussianSmooth(bank, BANK_SIGMA).map((b, k) => b + BREATH_ROLL * run.breathing * breathe(k * dt, length + 200));
}

/**
 * The run's range, widened where the track curls so a bend reads as a shape:
 * up to twice at full bendZoom on a bend of FULL_ZOOM_CURVATURE or tighter. The
 * curl is the track's own, measured on a uniform grid along its length: the
 * camera heading has the look-ahead window's smoothing in it already, and the
 * time-sampled path has steps too short to carry a direction in the speed ramps.
 * @param {Track} track
 * @param {Run} run
 * @param {number[]} progresses progress of each time sample, one per grid step
 * @return {number[]}
 */
function rangeProfile(track, run, progresses) {
  const {spline, length} = track;
  const count = progresses.length;
  const half = Math.min(SAMPLE_SPACING / 2 / length, 0.5);
  /** @type {number[]} */
  const directions = [];
  for (let j = 0; j < count; j++) {
    const s = j / (count - 1);
    spline.evaluate(Math.max(s - half, 0), pairScratch[0]);
    spline.evaluate(Math.min(s + half, 1), pairScratch[1]);
    directions.push(forwardHeading(pairScratch, directions[j - 1] ?? 0));
  }
  // smooth the signed turning first: the zigzags of a GPS track cancel out
  // instead of adding up, which read as a bend on every straight; then the
  // factor again: what a zigzag leaves after the abs (a fifth of the zoom on a
  // straight of the fixtures) thins out under the threshold, and the range
  // changes by less between samples
  const bends = gaussianSmooth(curvature(directions, SAMPLE_SPACING), CURVATURE_SIGMA).map(Math.abs);
  const factor = gaussianSmooth(
    bends.map((c) => 1 + run.bendZoom * Math.min(c / FULL_ZOOM_CURVATURE, 1)),
    CURVATURE_SIGMA
  );
  return progresses.map((p) => run.range * sampleProfile(factor, p));
}

/**
 * The marker path blurred over TARGET_SIGMA samples. The blur cuts the corners
 * of bends, into a slope by up to 16 m on the alpine fixtures, so the heights
 * are raised to the marker's height above the ground there and blurred again:
 * the raise alone would put the kinks back that the blur removed.
 * @param {Cartesian3[]} positions
 * @param {TerrainSampler} sampler
 * @param {Ellipsoid} ellipsoid
 * @return {Promise<{targets: Cartesian3[], heights: number[]}>} with the targets' heights above the ellipsoid
 */
async function smoothTargets(positions, sampler, ellipsoid) {
  const targets = smoothPositions(positions, TARGET_SIGMA);
  const cartographics = targets.map((p) => Cartographic.fromCartesian(p, ellipsoid));
  const terrain = await sampler.heightsAt(cartographics);
  const raised = cartographics.map((c, i) => Math.max(c.height, (terrain[i] ?? -Infinity) + MARKER_HEIGHT));
  const heights = gaussianSmooth(raised, TARGET_SIGMA);
  return {targets: cartographics.map((c, i) => Cartesian3.fromRadians(c.longitude, c.latitude, heights[i], ellipsoid)), heights};
}

/**
 * Path heading at a progress value, from the weighted tangents over a lookAhead
 * meters window starting at the marker. Near the end the window slides back so it
 * keeps its full length: the heading settles on the track's final stretch instead
 * of jittering on a collapsing window.
 * @param {Track} track
 * @param {Run} run
 * @param {number} progress
 * @param {number} previous heading returned when the tangents vanish
 * @return {number}
 */
function headingAt(track, run, progress, previous) {
  const window = Math.min(run.lookAhead / track.length, 1);
  const start = Math.min(progress, 1 - window);
  for (let k = 0; k <= HEADING_SAMPLES; k++) {
    track.spline.evaluate(start + (k * window) / HEADING_SAMPLES, sampleScratches[k]);
  }
  return forwardHeading(sampleScratches, previous);
}
