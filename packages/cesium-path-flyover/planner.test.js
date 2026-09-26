import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, Ellipsoid, Math as CesiumMath, Matrix4, Transforms} from "@cesium/engine";
import {cameraOffsetEnu, curvature, gaussianSmooth, maxWindow, planCamera, reliefProfile, SAMPLE_SPACING, sampleProfile, smoothConstraint, smoothPositions, viterbi} from "./planner.js";
import {dampAngle} from "./track.js";
import {deriveRun} from "./run.js";

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const pitch = CesiumMath.toRadians(-25);

test("cameraOffsetEnu places the camera behind the heading and above, plus lift", () => {
  const north = cameraOffsetEnu(0, 400, pitch, 25, new Cartesian3());
  near(north.x, 0);
  near(north.y, -400 * Math.cos(pitch));
  near(north.z, 400 * Math.sin(-pitch) + 25);
  const east = cameraOffsetEnu(Math.PI / 2, 400, pitch, 0, new Cartesian3());
  near(east.x, -400 * Math.cos(pitch));
  near(east.y, 0);
});

// viterbi reads the costs through a function; the tests hold them in a table
const tabled = (/** @type {number[][]} */ costs) => /** @type {const} */ ([costs.length, (/** @type {number} */ i, /** @type {number} */ j) => costs[i][j]]);

test("viterbi picks the cheapest coherent path and does not alternate between equal minima", () => {
  const values = [-1, 0, 1];
  const costs = Array.from({length: 6}, () => [0, 10, 0]);
  const path = viterbi(...tabled(costs), values, 1);
  assert.equal(new Set(path).size, 1, `alternating path ${path}`);
  assert.deepEqual(viterbi(...tabled([[3, 1, 2]]), values, 1), [1]);
});

test("viterbi pays a transition to reach a much cheaper candidate", () => {
  const values = [-1, 0, 1];
  const costs = [[0, 5, 5], [0, 5, 5], [50, 50, 0], [50, 50, 0]];
  assert.deepEqual(viterbi(...tabled(costs), values, 1), [0, 0, 2, 2]);
});

test("viterbi with a maximum step climbs to a cheap candidate one step at a time", () => {
  const values = [0, 1, 2, 3];
  const costs = [[0, 5, 5, 5], [0, 5, 5, 5], [0, 5, 5, 5], [0, 5, 5, 5], [100, 100, 100, 0], [100, 100, 100, 0]];
  assert.deepEqual(viterbi(...tabled(costs), values, 1, 1), [0, 0, 1, 2, 3, 3]);
  assert.deepEqual(viterbi(...tabled(costs), values, 1), [0, 0, 0, 0, 3, 3]);
});

test("maxWindow looks back and ahead and clamps at both ends", () => {
  const values = [0, 0, 0, 9, 0, 0];
  assert.deepEqual(maxWindow(values, 0, 2), [0, 9, 9, 9, 0, 0]);
  assert.deepEqual(maxWindow(values, 1, 0), [0, 0, 0, 9, 9, 0]);
  assert.deepEqual(maxWindow([1, 2], 5, 5), [2, 2]);
});

test("gaussianSmooth preserves a constant, spreads a spike and keeps its mass", () => {
  assert.deepEqual(gaussianSmooth([4, 4, 4, 4], 1).map((v) => +v.toFixed(9)), [4, 4, 4, 4]);
  const spike = Array(21).fill(0);
  spike[10] = 100;
  const smooth = gaussianSmooth(spike, 2);
  assert.ok(smooth[10] < 25 && smooth[10] > 15, `peak ${smooth[10]}`);
  near(smooth.reduce((a, b) => a + b, 0), 100, 1e-6);
  for (let i = 1; i < smooth.length; i++) {
    assert.ok(Math.abs(smooth[i] - smooth[i - 1]) < 20, `step at ${i}`);
  }
  assert.deepEqual(gaussianSmooth([1, 2, 3], 0), [1, 2, 3]);
});

test("smoothConstraint never drops below the raw requirement, including at the ends", () => {
  const endSpike = Array(40).fill(0);
  endSpike[38] = 60;
  endSpike[39] = 60;
  const smoothedEnd = smoothConstraint(endSpike, 3, 5);
  smoothedEnd.forEach((v, i) => assert.ok(v >= endSpike[i] - 1e-9, `below requirement at ${i}: ${v}`));
  assert.ok(smoothedEnd[30] > 10, "climbs ahead of the obstacle");
  const midSpike = Array(60).fill(0);
  midSpike[30] = 100;
  const smoothedMid = smoothConstraint(midSpike, 3, 5);
  smoothedMid.forEach((v, i) => assert.ok(v >= midSpike[i] - 1e-9, `below requirement at ${i}: ${v}`));
  for (let i = 1; i < smoothedMid.length; i++) {
    assert.ok(Math.abs(smoothedMid[i] - smoothedMid[i - 1]) < 15, `step at ${i}`);
  }
  assert.ok(smoothConstraint(Array(10).fill(0), 3, 5).every((v) => v === 0));
});

test("smoothPositions flattens a zigzag and keeps the ends in place", () => {
  const zigzag = Array.from({length: 41}, (_, i) => new Cartesian3(i * 20, i % 2 ? 4 : -4, 0));
  const smooth = smoothPositions(zigzag, 1.5);
  assert.equal(smooth.length, zigzag.length);
  for (let i = 5; i < 36; i++) {
    assert.ok(Math.abs(smooth[i].y) < 0.2, `zigzag left at ${i}: ${smooth[i].y}`);
    near(smooth[i].x, i * 20, 1e-9);
  }
  // nearest-edge padding pulls the ends inward, by less than one sample spacing
  assert.ok(Cartesian3.distance(smooth[0], zigzag[0]) < 20, "start stays close");
  assert.ok(Cartesian3.distance(smooth[40], zigzag[40]) < 20, "end stays close");
});

test("curvature is zero on a straight and the inverse radius on an arc", () => {
  assert.deepEqual(curvature([0, 0, 0, 0], 20), [0, 0, 0, 0]);
  // 20 m steps around a 100 m radius circle: 11.46 degrees per step
  const step = 20 / 100;
  const arc = curvature([0, step, 2 * step, 3 * step], 20);
  assert.equal(arc[0], 0);
  for (let i = 1; i < arc.length; i++) {
    near(arc[i], CesiumMath.toDegrees(step) / 20, 1e-9);
  }
  // wraps around the +-pi seam
  const seam = curvature([Math.PI - 0.1, -Math.PI + 0.1], 20);
  near(seam[1], CesiumMath.toDegrees(0.2) / 20, 1e-9);
});

test("sampleProfile interpolates linearly and clamps both ends", () => {
  const values = [0, 10, 30];
  near(sampleProfile(values, 0), 0);
  near(sampleProfile(values, 0.25), 5);
  near(sampleProfile(values, 0.5), 10);
  near(sampleProfile(values, 1), 30);
  near(sampleProfile(values, 1.2), 30);
  near(sampleProfile([7, 9], 1), 9);
  near(sampleProfile([7], 0.5), 7);
});

// Synthetic terrain: local metres around an origin, x east, y north.
const LON0 = 6.5;
const LAT0 = 46.8;
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LON = 111320 * Math.cos(CesiumMath.toRadians(LAT0));
const toLocal = (carto) => ({
  x: (CesiumMath.toDegrees(carto.longitude) - LON0) * M_PER_DEG_LON,
  y: (CesiumMath.toDegrees(carto.latitude) - LAT0) * M_PER_DEG_LAT,
});
const fromLocal = (x, y, height) =>
  Cartesian3.fromDegrees(LON0 + x / M_PER_DEG_LON, LAT0 + y / M_PER_DEG_LAT, height);
const makeSampler = (heightAt) => async (cartographics) =>
  cartographics.map((c) => {
    const {x, y} = toLocal(c);
    return heightAt(x, y);
  });
const options = {pitch, clearance: 40, ahead: 3, maxTurn: CesiumMath.toRadians(5), maxLift: 1000, offsetCost: 1.5, ellipsoid: Ellipsoid.WGS84};
// straight track north along x = 0, from y = 0 to y = length, ground 500 m
const straightNorth = (length) => {
  const n = Math.ceil(length / SAMPLE_SPACING) + 1;
  const positions = [];
  const headings = [];
  for (let i = 0; i < n; i++) {
    positions.push(fromLocal(0, (length * i) / (n - 1), 502));
    headings.push(0);
  }
  return {positions, headings, ranges: Array(n).fill(400), rise: Array(n).fill(0)};
};
const deg = (rad) => CesiumMath.toDegrees(rad);
const heightsOf = (/** @type {Cartesian3[]} */ positions) => positions.map((p) => Cartographic.fromCartesian(p).height);
// 100 m wide corridor closed 200 m south of the start, 300 m higher ground everywhere else
const corridor = (x, y) => (y >= -200 && Math.abs(x) <= 50 ? 500 : 800);

// Re-project the final plan onto the synthetic terrain: clearance of the camera and of
// the line of sight to the marker, per sample, as the runtime will place them.
const worstClearance = (plan, samples, heightAt) => {
  let camera = Infinity;
  let sight = Infinity;
  samples.positions.forEach((marker, i) => {
    const enu = Transforms.eastNorthUpToFixedFrame(marker);
    const heading = samples.headings[i] + plan.headingOffset[i];
    const offset = cameraOffsetEnu(heading, samples.ranges[i], options.pitch, plan.lift[i] + samples.rise[i], new Cartesian3());
    const cameraPosition = Matrix4.multiplyByPoint(enu, offset, new Cartesian3());
    for (let k = 0; k < 40; k++) {
      const point = Cartesian3.lerp(cameraPosition, marker, k / 40, new Cartesian3());
      const carto = Cartographic.fromCartesian(point);
      const {x, y} = toLocal(carto);
      const clearance = carto.height - heightAt(x, y);
      if (k === 0) camera = Math.min(camera, clearance);
      else sight = Math.min(sight, clearance);
    }
  });
  return {camera, sight};
};
const assertClear = (plan, samples, heightAt) => {
  const worst = worstClearance(plan, samples, heightAt);
  assert.ok(worst.camera >= options.clearance - 1, `camera clearance ${worst.camera}`);
  assert.ok(worst.sight >= -1, `line of sight clearance ${worst.sight}`);
};

test("planCamera returns zero profiles on a flat plain", async () => {
  const plan = await planCamera(straightNorth(2000), options, makeSampler(() => 500));
  assert.equal(plan.lift.length, 101);
  assert.ok(plan.lift.every((v) => v === 0));
  assert.ok(plan.headingOffset.every((v) => v === 0));
});

test("planCamera samples the terrain in bounded batches on a long track", async () => {
  const samples = straightNorth(20000);
  const batches = [];
  const sampler = makeSampler(() => 500);
  const plan = await planCamera(samples, options, (cartographics) => {
    batches.push(cartographics.length);
    return sampler(cartographics);
  });
  assert.equal(plan.lift.length, samples.positions.length);
  // 9 candidates and 11 points along each line of sight, for at most 512 samples at a time
  assert.ok(Math.max(...batches) <= 512 * 9 * 11, `largest batch ${Math.max(...batches)} positions`);
  assert.ok(batches.length > 2, `${batches.length} batches`);
});

test("planCamera with no turn allowed keeps the heading and lifts instead", async () => {
  // panRate 0, the rigid extreme: the search must not loop forever on a zero step
  const samples = straightNorth(2000);
  const plan = await planCamera(samples, {...options, maxTurn: 0}, makeSampler(corridor));
  assert.ok(plan.headingOffset.every((v) => v === plan.headingOffset[0]), "a constant offset");
  assert.ok(plan.lift[0] > 400, `lift at start ${plan.lift[0]}`);
});

test("planCamera lifts at a corridor start where every turn leads into high ground", async () => {
  const samples = straightNorth(2000);
  const plan = await planCamera(samples, options, makeSampler(corridor));
  // the line of sight from the start crosses the closed end 200 m back, 45% of the
  // way to the camera: the camera at 671 m needs about 440 m of lift to see over it
  assert.ok(plan.lift[0] > 400, `lift at start ${plan.lift[0]}`);
  assert.ok(Math.abs(deg(plan.headingOffset[0])) < 5, `offset at start ${deg(plan.headingOffset[0])}`);
  assert.ok(plan.lift.at(-1) < 1, "clear far from the start");
  assertClear(plan, samples, corridor);
});

test("planCamera caps the line-of-sight lift, never the camera's own clearance", async () => {
  // a wall across the line of sight 100 to 150 m behind the marker, the camera itself
  // on the plain: seeing over it would take about 700 m, the cap accepts a brief occlusion
  const wall = (x, y) => (y > -150 && y < -100 ? 800 : 500);
  const plan = await planCamera(straightNorth(2000), {...options, maxLift: 200}, makeSampler(wall));
  assert.ok(Math.abs(plan.lift[0] - 200) < 1, `lift at start ${plan.lift[0]}`);
  assert.ok(plan.lift.every((v) => v <= 200 + 1e-9), `lift above the cap: ${Math.max(...plan.lift)}`);
  // a corridor closed by a 700 m step behind the start puts the camera itself 570 m
  // inside the high ground: that lift is not capped
  const highCorridor = (x, y) => (y >= -200 && Math.abs(x) <= 50 ? 500 : 1200);
  const corridorPlan = await planCamera(straightNorth(2000), {...options, maxLift: 200}, makeSampler(highCorridor));
  assert.ok(corridorPlan.lift[0] > 500, `camera clearance capped: ${corridorPlan.lift[0]}`);
});

test("planCamera leaves a track alone when a wall is beside it but not behind", async () => {
  const wall = (x) => (x < -150 ? 900 : 500);
  const plan = await planCamera(straightNorth(2000), options, makeSampler(wall));
  assert.ok(plan.lift.every((v) => v === 0));
  assert.ok(plan.headingOffset.every((v) => v === 0));
});

test("planCamera turns onto the corridor in a gorge bend instead of climbing", async () => {
  // leg 1: north 1000 m along x = 0; leg 2: heading 60 deg for 1000 m. The camera
  // heading is damped like the runtime does (time constant of 5 samples)
  const legTurn = CesiumMath.toRadians(60);
  const positions = [];
  const headings = [];
  for (let d = 0; d <= 2000; d += SAMPLE_SPACING) {
    if (d <= 1000) {
      positions.push(fromLocal(0, d, 502));
      headings.push(0);
    } else {
      positions.push(fromLocal(Math.sin(legTurn) * (d - 1000), 1000 + Math.cos(legTurn) * (d - 1000), 502));
      headings.push(dampAngle(headings.at(-1), legTurn, 1, 5));
    }
  }
  const distanceToPolyline = (x, y) => {
    const d1 = y <= 1000 ? Math.abs(x) : Math.hypot(x, y - 1000);
    const along = x * Math.sin(legTurn) + (y - 1000) * Math.cos(legTurn);
    const across = Math.abs(x * Math.cos(legTurn) - (y - 1000) * Math.sin(legTurn));
    const d2 = along >= 0 ? across : Math.hypot(x, y - 1000);
    return Math.min(d1, d2);
  };
  const gorge = (x, y) => (distanceToPolyline(x, y) <= 100 ? 500 : 900);
  const samples = {positions, headings, ranges: positions.map(() => 400), rise: positions.map(() => 0)};
  const plan = await planCamera(samples, options, makeSampler(gorge));
  // just after the bend the damped heading has the trailing camera drifting into
  // the western wall; the plan turns it back onto the first leg instead of climbing
  const turn = Math.min(...plan.headingOffset.slice(50, 63).map(deg));
  assert.ok(turn <= -10, `strongest turn after the bend ${turn}`);
  const liftAfterBend = Math.max(...plan.lift.slice(50, 63));
  assert.ok(liftAfterBend < 50, `lift after the bend ${liftAfterBend}`);
  // the offsets are smoothed so the camera pans gradually, a few degrees per sample
  for (let k = 1; k < plan.headingOffset.length; k++) {
    assert.ok(Math.abs(deg(plan.headingOffset[k] - plan.headingOffset[k - 1])) <= 5 + 1e-9, `jump at ${k}`);
  }
  assertClear(plan, samples, gorge);
});

test("planCamera places each candidate camera at that sample's range", async () => {
  // high ground more than 400 m behind the start: a 400 m camera (363 m back) never
  // reaches it, an 800 m camera (725 m back) sits in it
  const wall = (x, y) => (y < -400 ? 900 : 500);
  const near = await planCamera(straightNorth(2000), options, makeSampler(wall));
  assert.ok(near.lift[0] < 1, `lift with the near camera ${near.lift[0]}`);
  const samples = straightNorth(2000);
  samples.ranges[0] = 800;
  const far = await planCamera(samples, options, makeSampler(wall));
  assert.ok(far.lift[0] > 60, `lift with the far camera ${far.lift[0]}`);
  assert.ok(far.lift[30] < 1, `lift away from it ${far.lift[30]}`);
});

test("planCamera sees a boulder a few metres behind the marker after a sharp bend", async () => {
  // north 1000 m, then east 1000 m; a 60 m high block hugs the outside of the corner,
  // so the camera trailing the eastbound marker looks through it in the last 10% of
  // its line of sight
  const positions = [];
  const headings = [];
  for (let d = 0; d <= 2000; d += SAMPLE_SPACING) {
    positions.push(d <= 1000 ? fromLocal(0, d, 502) : fromLocal(d - 1000, 1000, 502));
    headings.push(d <= 1000 ? 0 : CesiumMath.PI_OVER_TWO);
  }
  const boulder = (x, y) => (x >= -30 && x <= -2 && y >= 995 && y <= 1005 ? 560 : 500);
  const samples = {positions, headings, ranges: positions.map(() => 400), rise: positions.map(() => 0)};
  const plan = await planCamera(samples, options, makeSampler(boulder));
  assert.ok(Math.max(...plan.lift) < 100, `climbs over the block: ${Math.max(...plan.lift)}`);
  assertClear(plan, samples, boulder);
});

test("planCamera treats unsampled heights as unconstrained", async () => {
  const sampler = async (cartographics) => cartographics.map(() => undefined);
  const plan = await planCamera(straightNorth(200), options, sampler);
  assert.ok(plan.lift.every((v) => v === 0));
});

test("planCamera handles a two-sample track", async () => {
  const plan = await planCamera(straightNorth(SAMPLE_SPACING), options, makeSampler(() => 500));
  assert.deepEqual(plan.lift, [0, 0]);
  assert.deepEqual(plan.headingOffset, [0, 0]);
});

test("a low offset cost turns and a high one climbs, in the gorge bend", async () => {
  const build = () => {
    const legTurn = CesiumMath.toRadians(60);
    const positions = [];
    const headings = [];
    for (let d = 0; d <= 2000; d += SAMPLE_SPACING) {
      if (d <= 1000) {
        positions.push(fromLocal(0, d, 502));
        headings.push(0);
      } else {
        positions.push(fromLocal(Math.sin(legTurn) * (d - 1000), 1000 + Math.cos(legTurn) * (d - 1000), 502));
        headings.push(dampAngle(headings.at(-1), legTurn, 1, 5));
      }
    }
    const distanceToPolyline = (x, y) => {
      const d1 = y <= 1000 ? Math.abs(x) : Math.hypot(x, y - 1000);
      const along = x * Math.sin(legTurn) + (y - 1000) * Math.cos(legTurn);
      const across = Math.abs(x * Math.cos(legTurn) - (y - 1000) * Math.sin(legTurn));
      const d2 = along >= 0 ? across : Math.hypot(x, y - 1000);
      return Math.min(d1, d2);
    };
    const gorge = (x, y) => (distanceToPolyline(x, y) <= 100 ? 500 : 900);
    return {samples: {positions, headings, ranges: positions.map(() => 400), rise: positions.map(() => 0)}, gorge};
  };
  const {samples, gorge} = build();
  // the table's own ends: the pilot must turn here, the spectator must climb
  const turning = await planCamera(samples, {...options, offsetCost: deriveRun({style: 0}).turnCost}, makeSampler(gorge));
  const climbing = await planCamera(samples, {...options, offsetCost: deriveRun({style: 1}).turnCost}, makeSampler(gorge));
  const turn = (plan) => Math.max(...plan.headingOffset.map((v) => Math.abs(deg(v))));
  assert.ok(turn(turning) >= 10, `turns ${turn(turning)}`);
  assert.ok(turn(climbing) < 1, `still turns ${turn(climbing)}`);
  assert.ok(Math.max(...climbing.lift) > Math.max(...turning.lift), "climbs instead");
  assertClear(climbing, samples, gorge);
});

test("the search stays fast on a long calm run", async () => {
  const samples = straightNorth(16000);
  const started = performance.now();
  await planCamera(samples, {...options, maxTurn: CesiumMath.toRadians(1.2)}, makeSampler(() => 500));
  assert.ok(performance.now() - started < 2000, `${performance.now() - started} ms`);
});

test("planCamera checks the camera at its rise", async () => {
  // the start's camera (363 m back, 671 m up) sits on a 700 m plateau that begins
  // 300 m behind the track: it needs about 100 m of lift, or a rise that lifts it
  // and its line of sight over the plateau's edge
  const samples = straightNorth(400);
  const plateau = (x, y) => (y < -300 ? 700 : 500);
  const flat = await planCamera(samples, options, makeSampler(plateau));
  assert.ok(flat.lift[0] > 60, `lift without rise ${flat.lift[0]}`);
  samples.rise = samples.rise.map(() => 130);
  const risen = await planCamera(samples, options, makeSampler(plateau));
  assert.ok(risen.lift[0] < 1, `lift with rise ${risen.lift[0]}`);
});

test("reliefProfile is the height of the surrounding terrain above the target, smoothed", async () => {
  const samples = straightNorth(2000);
  // flat plain: nothing around rises above the track
  const flat = await reliefProfile(samples.positions, heightsOf(samples.positions), samples.ranges, Ellipsoid.WGS84, makeSampler(() => 500));
  assert.equal(flat.length, samples.positions.length);
  assert.ok(flat.every((v) => v === 0));
  // a trench: 200 m walls 150 m either side of the track along its whole length,
  // within reach of a ring at the 400 m range
  const trench = (x) => (Math.abs(x) > 150 ? 700 : 500);
  const walls = await reliefProfile(samples.positions, heightsOf(samples.positions), samples.ranges, Ellipsoid.WGS84, makeSampler(trench));
  walls.forEach((v, i) => assert.ok(Math.abs(v - 198) < 2, `relief ${v} at ${i}`));
  // walls along 200 m of track only: the profile rises and falls without steps
  const stretch = (x, y) => (Math.abs(x) > 150 && y > 900 && y < 1100 ? 700 : 500);
  const bump = await reliefProfile(samples.positions, heightsOf(samples.positions), samples.ranges, Ellipsoid.WGS84, makeSampler(stretch));
  assert.ok(Math.max(...bump) > 100, `peak ${Math.max(...bump)}`);
  assert.ok(bump[10] === 0 && bump[90] === 0, "flat far from the walls");
  for (let i = 1; i < bump.length; i++) {
    assert.ok(Math.abs(bump[i] - bump[i - 1]) < 30, `step at ${i}`);
  }
});

test("reliefProfile samples a ring of eight points at the range around each target", async () => {
  const seen = [];
  const sampler = async (cartographics) =>
    cartographics.map((c) => {
      seen.push(toLocal(c));
      return 500;
    });
  const samples = straightNorth(SAMPLE_SPACING);
  await reliefProfile(samples.positions, heightsOf(samples.positions), samples.ranges, Ellipsoid.WGS84, sampler);
  assert.equal(seen.length, 16);
  const first = seen.slice(0, 8);
  // the local metre-per-degree constants are approximate at the 0.5% level
  first.forEach(({x, y}) => near(Math.hypot(x, y), 400, 5));
});
