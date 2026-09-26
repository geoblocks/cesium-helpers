import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, Ellipsoid} from "@cesium/engine";
import {damp, dampAngle, decimate, easedProgress, fetchTrackText, forwardHeading, parseTrack, breathe} from "./track.js";

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

test("fetchTrackText throws with the status and URL on a failed response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html>not found</html>", {status: 404});
  try {
    await assert.rejects(() => fetchTrackText("http://example.test/track.gpx"), /404.*track\.gpx/);
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
