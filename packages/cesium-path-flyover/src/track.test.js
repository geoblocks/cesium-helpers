import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Color, Ellipsoid, Math as CesiumMath} from "@cesium/core";
import {damp, dampAngle, decimate, densify, easedProgress, easedProgressInverse, fetchTrackText, forwardHeading, parseTrack, parseTrackName, roundCorners, trailColor, trailAlong, trailPath, fillGaps, breathe} from "./track.js";

const gpx = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="46.1" lon="6.1"><ele>400</ele></trkpt>
  <trkpt lon="6.2" lat="46.2" extra="x"><ele>401</ele></trkpt>
</trkseg><trkseg>
  <trkpt lat="46.3" lon="6.3"/>
</trkseg></trk></gpx>`;

test("parseTrack reads GPX trkpt in document order, any attribute order", () => {
  assert.deepEqual(parseTrack(gpx), [[6.1, 46.1], [6.2, 46.2], [6.3, 46.3]]);
});

test("parseTrack keeps a GPX point's time as a third element, seconds since the epoch", () => {
  const text = `<gpx><trk><trkseg>
    <trkpt lat="46.1" lon="6.1"><ele>400</ele><time>2019-08-11T09:55:18Z</time></trkpt>
    <trkpt lat="46.2" lon="6.2"><time>2019-08-11T09:55:48.500Z</time></trkpt>
    <trkpt lat="46.3" lon="6.3"/>
  </trkseg></trk></gpx>`;
  assert.deepEqual(parseTrack(text), [[6.1, 46.1, 1565517318], [6.2, 46.2, 1565517348.5], [6.3, 46.3]]);
});

test("parseTrackName reads the GPX track name, the GeoJSON feature name, or nothing", () => {
  assert.equal(parseTrackName("<gpx><trk><name>Tour du Mont de Baulmes</name><trkseg/></trk></gpx>"), "Tour du Mont de Baulmes");
  assert.equal(parseTrackName('<gpx><metadata><name>file</name></metadata><trk><trkseg/></trk></gpx>'), undefined);
  const feature = {type: "Feature", geometry: {type: "LineString", coordinates: []}, properties: {name: "Suchet"}};
  assert.equal(parseTrackName(JSON.stringify(feature)), "Suchet");
  assert.equal(parseTrackName(JSON.stringify({type: "FeatureCollection", features: [feature]})), "Suchet");
  assert.equal(parseTrackName(JSON.stringify({type: "LineString", coordinates: []})), undefined);
});

test("parseTrack reads a bare GeoJSON LineString and drops heights", () => {
  const text = JSON.stringify({type: "LineString", coordinates: [[6.1, 46.1, 400], [6.2, 46.2, 500]]});
  assert.deepEqual(parseTrack(text), [[6.1, 46.1], [6.2, 46.2]]);
});

test("parseTrack finds the LineString in a FeatureCollection after a Point", () => {
  const text = JSON.stringify({
    type: "FeatureCollection",
    features: [
      {type: "Feature", geometry: {type: "Point", coordinates: [1, 2]}, properties: {}},
      {type: "Feature", geometry: {type: "LineString", coordinates: [[6.1, 46.1], [6.2, 46.2]]}, properties: {}},
    ],
  });
  assert.deepEqual(parseTrack(text), [[6.1, 46.1], [6.2, 46.2]]);
});

test("parseTrack concatenates MultiLineString parts", () => {
  const text = JSON.stringify({
    type: "Feature",
    geometry: {type: "MultiLineString", coordinates: [[[6.1, 46.1], [6.2, 46.2]], [[6.3, 46.3]]]},
    properties: {},
  });
  assert.deepEqual(parseTrack(text), [[6.1, 46.1], [6.2, 46.2], [6.3, 46.3]]);
});

test("parseTrack throws on unknown content and on fewer than two points", () => {
  assert.throws(() => parseTrack("<html></html>"), /no track/i);
  assert.throws(() => parseTrack('{"type":"Point","coordinates":[1,2]}'), /no track/i);
  assert.throws(() => parseTrack('<gpx><trkpt lat="1" lon="2"/></gpx>'), /at least two/i);
});

test("decimate keeps the first point and points at least minDistance apart", () => {
  // 0.0001 deg of latitude is about 11 m
  const coords = [[6, 46], [6, 46.00001], [6, 46.00002], [6, 46.0001], [6, 46.00011], [6, 46.0002]];
  assert.deepEqual(decimate(coords, 10, Ellipsoid.WGS84), [[6, 46], [6, 46.0001], [6, 46.0002]]);
});

test("decimate of a standing log leaves a single point", () => {
  const coords = [[6, 46], [6, 46.00001], [6.00001, 46]];
  assert.deepEqual(decimate(coords, 10, Ellipsoid.WGS84), [[6, 46]]);
});

test("densify cuts each segment into equal parts no longer than the step", () => {
  const points = [new Cartesian3(0, 0, 0), new Cartesian3(12, 0, 0), new Cartesian3(12, 4, 0)];
  assert.deepEqual(densify(points, 5).map((p) => [p.x, p.y]), [[0, 0], [4, 0], [8, 0], [12, 0], [12, 4]]);
});

test("roundCorners turns a right angle in equal small steps within the trim, and leaves a straight line", () => {
  const corner = [new Cartesian3(-20, 0, 0), new Cartesian3(0, 0, 0), new Cartesian3(0, 20, 0)];
  const points = roundCorners(corner, 5, CesiumMath.toRadians(10));
  // 90 degrees in turns of 10: 9 pieces from 5 m before the corner to 5 m after it
  assert.equal(points.length, 2 + 10);
  assert.ok(Cartesian3.equalsEpsilon(points[1], new Cartesian3(-5, 0, 0), 0, 1e-9));
  assert.ok(Cartesian3.equalsEpsilon(points[10], new Cartesian3(0, 5, 0), 0, 1e-9));
  for (let i = 1; i < points.length - 1; i++) {
    const turn = Math.PI - Cartesian3.angleBetween(Cartesian3.subtract(points[i - 1], points[i], new Cartesian3()), Cartesian3.subtract(points[i + 1], points[i], new Cartesian3()));
    assert.ok(turn <= CesiumMath.toRadians(10) + 1e-9, `turn ${CesiumMath.toDegrees(turn)} at ${i}`);
  }
  const straight = [new Cartesian3(0, 0, 0), new Cartesian3(10, 0, 0), new Cartesian3(20, 0, 0)];
  assert.deepEqual(roundCorners(straight, 5, CesiumMath.toRadians(10)), straight);
});

test("roundCorners turns a hairpin in steps of at most the max turn, ending on the way out", () => {
  const turn = CesiumMath.toRadians(170);
  const hairpin = [new Cartesian3(-20, 0, 0), new Cartesian3(0, 0, 0), new Cartesian3(20 * Math.cos(turn), 20 * Math.sin(turn), 0)];
  const points = roundCorners(hairpin, 5, CesiumMath.toRadians(10));
  for (let i = 1; i < points.length - 1; i++) {
    const step = Cartesian3.angleBetween(Cartesian3.subtract(points[i], points[i - 1], new Cartesian3()), Cartesian3.subtract(points[i + 1], points[i], new Cartesian3()));
    assert.ok(step <= CesiumMath.toRadians(10) + 1e-9, `step ${CesiumMath.toDegrees(step)} at ${i}`);
  }
  const end = new Cartesian3(5 * Math.cos(turn), 5 * Math.sin(turn), 0);
  assert.ok(Cartesian3.equalsEpsilon(points[points.length - 2], end, 0, 1e-9));
});

test("trailPath rounds the track's corners, then cuts its segments to the step", () => {
  const straight = [new Cartesian3(0, 0, 0), new Cartesian3(10, 0, 0), new Cartesian3(30, 0, 0)];
  assert.deepEqual(trailPath(straight, 5, CesiumMath.toRadians(10), 5, 1000).map((p) => p.x), [0, 5, 10, 15, 20, 25, 30]);
  const corner = [new Cartesian3(-20, 0, 0), new Cartesian3(0, 0, 0), new Cartesian3(0, 20, 0)];
  const points = trailPath(corner, 5, CesiumMath.toRadians(10), 5, 1000);
  // the right angle's arc, 5 m each way, passes 5 (sqrt 2 - 1) m from the corner at its nearest
  const nearest = Math.min(...points.map((p) => Cartesian3.magnitude(p)));
  assert.ok(Math.abs(nearest - 5 * (Math.SQRT2 - 1)) < 0.1, `${nearest} m from the corner`);
});

test("trailAlong gives st.s by the distance along the line, or by the points' count", () => {
  // the crowded points of an arc, then a long stretch
  const distances = new Float64Array([0, 1, 2, 30]);
  assert.deepEqual(Array.from(trailAlong(distances, true)), [0, 1 / 30, 2 / 30, 1]);
  assert.deepEqual(Array.from(trailAlong(distances, false)), [0, 1 / 3, 2 / 3, 1]);
});

test("fillGaps takes a missing value from its neighbors, the nearest one at an end", () => {
  assert.deepEqual(fillGaps([undefined, 10, undefined, undefined, 40, undefined]), [10, 10, 20, 30, 40, 40]);
  assert.deepEqual(fillGaps([undefined, undefined]), [0, 0]);
  assert.deepEqual(fillGaps([1, 2]), [1, 2]);
});

test("trailPath keeps to its points, the arcs coarser and the step longer", () => {
  // a zigzag of 30 degree turns every 10 m, 10 km long
  const zigzag = Array.from({length: 1001}, (_, i) => new Cartesian3(10 * i, i % 2 ? 2.7 : 0, 0));
  const points = trailPath(zigzag, 5, CesiumMath.toRadians(10), 5, 2000);
  assert.ok(points.length <= 2000, `${points.length} points`);
});

test("trailColor carries a fraction in 24 bits, as the trail's shader reads it", () => {
  for (const along of [0, 1e-7, 0.123456789, 0.5, 1]) {
    const color = trailColor(along);
    const bytes = [color.red, color.green, color.blue].map(Color.floatToByte);
    assert.ok(Math.abs((bytes[0] * 65536 + bytes[1] * 256 + bytes[2]) / 0xffffff - along) < 1e-7, `${along}`);
  }
});

test("roundCorners trims at most 0.4 of a short segment", () => {
  const points = [new Cartesian3(-4, 0, 0), new Cartesian3(0, 0, 0), new Cartesian3(0, 20, 0)];
  const rounded = roundCorners(points, 5, CesiumMath.toRadians(10));
  assert.ok(Cartesian3.equalsEpsilon(rounded[1], new Cartesian3(-1.6, 0, 0), 0, 1e-9));
});

test("roundCorners leaves no two points in one place, two corners at the ends of a segment of twice the trim", () => {
  const points = [new Cartesian3(0, -20, 0), new Cartesian3(0, 0, 0), new Cartesian3(10, 0, 0), new Cartesian3(10, 20, 0)];
  const rounded = roundCorners(points, 5, CesiumMath.toRadians(10));
  for (let i = 1; i < rounded.length; i++) {
    assert.ok(Cartesian3.distance(rounded[i - 1], rounded[i]) > 0.1, `points ${i - 1} and ${i} in one place`);
  }
});

const at = (lon, lat) => Cartesian3.fromDegrees(lon, lat, 500);

test("forwardHeading is pi/2 along a line due east and 0 due north", () => {
  const east = [at(6.5, 46.8), at(6.501, 46.8), at(6.502, 46.8)];
  const north = [at(6.5, 46.8), at(6.5, 46.801), at(6.5, 46.802)];
  assert.ok(Math.abs(forwardHeading(east, 0) - Math.PI / 2) < 1e-3);
  assert.ok(Math.abs(forwardHeading(north, 0)) < 1e-3);
});

test("forwardHeading weights the nearest step most", () => {
  // two steps north then one step east: heading must be between 0 and pi/4
  const samples = [at(6.5, 46.8), at(6.5, 46.801), at(6.5, 46.802), at(6.501, 46.802)];
  const heading = forwardHeading(samples, 0);
  assert.ok(heading > 0.05 && heading < Math.PI / 4, `got ${heading}`);
});

test("forwardHeading keeps the previous heading when steps cancel or vanish", () => {
  const p = at(6.5, 46.8);
  assert.equal(forwardHeading([p, Cartesian3.clone(p)], 1.23), 1.23);
  assert.equal(forwardHeading([p], 1.23), 1.23);
});

test("parseTrack accepts single-quoted, spaced and namespaced GPX attributes", () => {
  const text = `<gpx:gpx><gpx:trkpt lat = '46.1' lon='6.1'/><gpx:trkpt lon="6.2" lat="46.2"/></gpx:gpx>`;
  assert.deepEqual(parseTrack(text), [[6.1, 46.1], [6.2, 46.2]]);
});

test("parseTrack falls back to GPX rtept when there is no trkpt", () => {
  const route = `<gpx><rte><rtept lat="46.1" lon="6.1"/><rtept lat="46.2" lon="6.2"/></rte></gpx>`;
  assert.deepEqual(parseTrack(route), [[6.1, 46.1], [6.2, 46.2]]);
  const both = `<gpx><rte><rtept lat="1" lon="1"/><rtept lat="2" lon="2"/></rte>
    <trk><trkseg><trkpt lat="46.1" lon="6.1"/><trkpt lat="46.2" lon="6.2"/></trkseg></trk></gpx>`;
  assert.deepEqual(parseTrack(both), [[6.1, 46.1], [6.2, 46.2]]);
});

test("fetchTrackText rejects with the status on a failed response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html>not found</html>", {status: 404});
  try {
    await assert.rejects(() => fetchTrackText("http://example.test/track.gpx"), (error) => error.statusCode === 404);
  } finally {
    globalThis.fetch = original;
  }
});

test("damp moves about 63% of the way to the target when dt equals tau", () => {
  assert.ok(Math.abs(damp(0, 10, 1, 1) - 6.321) < 1e-3);
  assert.equal(damp(5, 10, 0, 1), 5);
  assert.ok(Math.abs(damp(0, 10, 100, 1) - 10) < 1e-6);
});

test("dampAngle takes the short way around the wrap", () => {
  // from 170 deg toward -170 deg: the short way is +20 deg through 180
  const from = (170 * Math.PI) / 180;
  const to = (-170 * Math.PI) / 180;
  const result = dampAngle(from, to, 100, 1);
  assert.ok(Math.abs(Math.atan2(Math.sin(result - to), Math.cos(result - to))) < 1e-6);
  assert.ok(result > from, "moved forward through 180, not backward");
});

test("easedProgress keeps the ends, the middle and monotonicity", () => {
  assert.equal(easedProgress(0, 0.2), 0);
  assert.equal(easedProgress(1, 0.2), 1);
  assert.ok(Math.abs(easedProgress(0.5, 0.2) - 0.5) < 1e-9);
  let previous = 0;
  for (let u = 0.01; u <= 1; u += 0.01) {
    const p = easedProgress(u, 0.2);
    assert.ok(p > previous, `not monotonic at ${u}`);
    previous = p;
  }
});

test("easedProgress starts slowly and runs at constant speed in the middle", () => {
  assert.ok(easedProgress(0.02, 0.2) < 0.002, "slow start");
  const speedMiddle = (easedProgress(0.55, 0.2) - easedProgress(0.45, 0.2)) / 0.1;
  const speedLater = (easedProgress(0.75, 0.2) - easedProgress(0.65, 0.2)) / 0.1;
  assert.ok(Math.abs(speedMiddle - speedLater) < 1e-9, "constant middle speed");
  assert.ok(speedMiddle > 1, "middle faster than average to make up for the ramps");
});

test("easedProgress with no ramp is linear", () => {
  assert.ok(Math.abs(easedProgress(0.3, 0) - 0.3) < 1e-12);
});

test("easedProgressInverse gives back the time fraction, in the ramps and between", () => {
  for (const ramp of [0, 0.1, 0.2, 0.5]) {
    for (let u = 0; u <= 1; u += 0.05) {
      const back = easedProgressInverse(easedProgress(u, ramp), ramp);
      assert.ok(Math.abs(back - u) < 1e-9, `ramp ${ramp}, u ${u}: ${back}`);
    }
  }
  // the speed falls to nothing at the ends, where the path fraction is what must come back
  for (const p of [0, 1e-6, 1 - 1e-6, 1]) {
    assert.ok(Math.abs(easedProgress(easedProgressInverse(p, 0.2), 0.2) - p) < 1e-9, `p ${p}`);
  }
});

test("breathe is a slow, bounded, seeded drift", () => {
  const a = Array.from({length: 600}, (_, i) => breathe(i / 10, 1234));
  const b = Array.from({length: 600}, (_, i) => breathe(i / 10, 1234));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, Array.from({length: 600}, (_, i) => breathe(i / 10, 99)));
  assert.ok(a.every((v) => v >= -1 && v <= 1));
  assert.ok(Math.max(...a) > 0.3 && Math.min(...a) < -0.3, "moves");
  for (let i = 1; i < a.length; i++) {
    assert.ok(Math.abs(a[i] - a[i - 1]) < 0.06, `jump at ${i}`); // under 0.6 per second
  }
});
