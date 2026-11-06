import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, CatmullRomSpline, Ellipsoid, Event, Math as CesiumMath, Matrix4} from "@cesium/core";
import {
  EllipsoidTerrainProvider,
  GeographicTilingScheme,
  KeyboardEventModifier,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
} from "@cesium/engine";
import {acquireTerrainDepth, releaseTerrainDepth} from "@geoblocks/cesium-post-process";
import Flyover from "./cesium-path-flyover.js";
import {computePath, runDuration} from "./path.js";
import {deriveRun} from "./run.js";
import {CORNER_TRIM, CORNER_TURN, TRAIL_MAX_POINTS, TRAIL_STEP, easedProgress, trailPath} from "./track.js";
import {MARKER_HEIGHT} from "./path.js";
import {sampleProfile} from "./planner.js";
import TerrainSampler from "./terrain.js";

// what a load needs of a browser to draw the track: the classes a material checks
// its uniforms against
for (const name of ["HTMLCanvasElement", "HTMLImageElement", "ImageBitmap", "OffscreenCanvas"]) {
  globalThis[name] ??= class {};
}

// a flyover whose track, without WebGL, is the options its primitive would be made with
class CesiumPathFlyover extends Flyover {
  createPrimitive_(options) {
    return {...options, isDestroyed: () => false, destroy: () => {}};
  }
}

// the tests run on the ellipsoid, where the sampler answers no heights
const sampler = new TerrainSampler(new EllipsoidTerrainProvider(), 16);

const fakeViewer = () => ({
  scene: {
    ellipsoid: Ellipsoid.WGS84,
    terrainProvider: new EllipsoidTerrainProvider(),
    mode: SceneMode.SCENE3D,
    primitives: {
      added: [],
      add(primitive) {
        this.added.push(primitive);
        return primitive;
      },
      remove: () => {},
    },
    globe: {maximumScreenSpaceError: 2},
    preUpdate: new Event(),
    requestRender: () => {},
    camera: {lookAt: () => {}, lookAtTransform: () => {}, twistRight: () => {}},
  },
});

// loads the line through [lon, lat] coordinates, served as GeoJSON
const loadLine = async (flyover, coordinates) => {
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({type: "LineString", coordinates}));
  try {
    await flyover.load("track.json");
  } finally {
    globalThis.fetch = fetch;
  }
};

// [lon, lat] coordinates of a [lon, lat, height, ...] array
const lonLats = (degrees) => Array.from({length: degrees.length / 3}, (_, i) => [degrees[3 * i], degrees[3 * i + 1]]);

// the track a load makes of its points: a spline over the fraction of its length
const trackThrough = (points) => {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Cartesian3.distance(points[i - 1], points[i]));
  }
  const length = distances.at(-1);
  return {spline: new CatmullRomSpline({points, times: distances.map((d) => d / length)}), length};
};

// the line a load makes its marker follow on the ellipsoid: the trail through the track's points, at the marker's height
const trailThrough = (points) =>
  trailPath(
    points.map((p) => Ellipsoid.WGS84.scaleToGeodeticSurface(p, new Cartesian3())),
    CORNER_TRIM,
    CORNER_TURN,
    TRAIL_STEP,
    TRAIL_MAX_POINTS
  ).map((p) => {
    const c = Cartographic.fromCartesian(p);
    return Cartesian3.fromRadians(c.longitude, c.latitude, MARKER_HEIGHT);
  });

// the path a flyover with these options plans through the points, on the
// ellipsoid, and the seconds between its samples
const planPath = async (points, options = {}) => {
  const track = trackThrough(points);
  const run = deriveRun(options);
  const path = await computePath(
    track,
    {run, pitch: CesiumMath.toRadians(run.pitch), clearance: 40, maxLift: 250, ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()},
    sampler
  );
  return {path, dt: runDuration(track.length, run) / (path.headings.length - 1)};
};

// east 300 m, climbing 20 m
const STRAIGHT = [6.5, 46.8, 800, 6.502, 46.8, 810, 6.504, 46.8, 820];
// north 300 m, 20 m east, back south 300 m
const HAIRPIN = [6.5, 46.8, 800, 6.5, 46.8027, 800, 6.50026, 46.8027, 800, 6.50026, 46.8, 800];

test("play coarsens the globe's screen-space error and stop restores what the scene had", async () => {
  const viewer = fakeViewer();
  viewer.scene.globe.maximumScreenSpaceError = 1.5;
  const flyover = new CesiumPathFlyover(viewer, {screenSpaceError: 4, freeLook: false});
  await loadLine(flyover, lonLats(STRAIGHT));
  flyover.play();
  assert.equal(viewer.scene.globe.maximumScreenSpaceError, 4);
  flyover.stop();
  flyover.stop();
  assert.equal(viewer.scene.globe.maximumScreenSpaceError, 1.5);
});

test("the flyover keeps the terrain's depth for its trail until destroyed, then puts back what the scene had", () => {
  const viewer = fakeViewer();
  viewer.scene.globe.depthTestAgainstTerrain = false;
  const flyover = new CesiumPathFlyover(viewer, {freeLook: false});
  assert.equal(viewer.scene.globe.depthTestAgainstTerrain, true);
  flyover.destroy();
  assert.equal(viewer.scene.globe.depthTestAgainstTerrain, false);
});

test("the flyover shares the terrain's depth with others, released once however often destroyed", () => {
  const viewer = fakeViewer();
  viewer.scene.globe.depthTestAgainstTerrain = false;
  const flyover = new CesiumPathFlyover(viewer, {freeLook: false});
  acquireTerrainDepth(viewer.scene);
  flyover.destroy();
  flyover.destroy();
  assert.equal(viewer.scene.globe.depthTestAgainstTerrain, true);
  releaseTerrainDepth(viewer.scene);
  assert.equal(viewer.scene.globe.depthTestAgainstTerrain, false);
});

test("the screen-space error option can be changed or switched off", async () => {
  const viewer = fakeViewer();
  const flyover = new CesiumPathFlyover(viewer, {screenSpaceError: 3, freeLook: false});
  await loadLine(flyover, lonLats(STRAIGHT));
  flyover.play();
  assert.equal(viewer.scene.globe.maximumScreenSpaceError, 3);
  flyover.stop();
  // the default
  const untouched = fakeViewer();
  const off = new CesiumPathFlyover(untouched, {freeLook: false});
  await loadLine(off, lonLats(STRAIGHT));
  off.play();
  assert.equal(untouched.scene.globe.maximumScreenSpaceError, 2);
  off.stop();
});

test("the camera looks at a point beside the marker, not at one trailing it", async () => {
  const targets = [];
  const viewer = fakeViewer();
  viewer.scene.camera.lookAt = (target) => targets.push(Cartesian3.clone(target));
  const flyover = new CesiumPathFlyover(viewer, {speed: 150});
  await loadLine(flyover, lonLats(STRAIGHT));
  // straight track: a damped target would trail by 20 m at this speed
  flyover.progress = 0.5;
  assert.equal(targets.length, 1);
  const distance = Cartesian3.distance(targets[0], flyover.position);
  assert.ok(distance < 2, `target ${distance} m from the marker`);
});

const hairpin = Cartesian3.fromDegreesArrayHeights(HAIRPIN);

test("the heading turns through a hairpin no faster than the pan limit", async () => {
  const {path, dt} = await planPath(hairpin, {speed: 90});
  const limit = CesiumMath.toRadians(30) * dt;
  for (let k = 1; k < path.headings.length; k++) {
    const step = Math.abs(CesiumMath.negativePiToPi(path.headings[k] - path.headings[k - 1]));
    assert.ok(step <= limit + 1e-9, `turn of ${CesiumMath.toDegrees(step / dt)} deg/s at sample ${k}`);
  }
  // and it does turn around (the 400 m heading window still sees part of the first leg at the end)
  const total = Math.abs(CesiumMath.negativePiToPi(path.headings.at(-1) - path.headings[0]));
  assert.ok(total > CesiumMath.toRadians(120), `turned ${CesiumMath.toDegrees(total)} deg`);
});

test("a calm motion limits the heading turn to its own pan rate", async () => {
  // breathing off: the drift rides on top of the limited heading at its own slow rate
  const {path, dt} = await planPath(hairpin, {speed: 90, motion: 1, breathing: 0});
  const limit = CesiumMath.toRadians(15) * dt;
  for (let k = 1; k < path.headings.length; k++) {
    const step = Math.abs(CesiumMath.negativePiToPi(path.headings[k] - path.headings[k - 1]));
    assert.ok(step <= limit + 1e-9, `turn of ${CesiumMath.toDegrees(step / dt)} deg/s at sample ${k}`);
  }
});

test("the style dial sets the camera distance unless range is given", async () => {
  // the camera's distance halfway along a straight line north: no bend widens it,
  // no breathing lifts the camera
  const placed = async (options) => {
    let offset;
    const viewer = fakeViewer();
    viewer.scene.camera.lookAt = (target, o) => (offset = Cartesian3.clone(o));
    const flyover = new CesiumPathFlyover(viewer, options);
    await loadLine(flyover, [[6.5, 46.8], [6.5, 46.81]]);
    flyover.progress = 0.5;
    return {flyover, range: Cartesian3.magnitude(offset)};
  };
  const far = await placed({style: 1});
  assert.ok(Math.abs(far.range - 900) < 1e-6, `range ${far.range}`);
  assert.equal(far.flyover.pitch, CesiumMath.toRadians(-45));
  const near = await placed({style: 1, range: 300});
  assert.ok(Math.abs(near.range - 300) < 1e-6, `range ${near.range}`);
});

test("the duration is the length at the run's speed plus the ease ramps, 0 before a track", async () => {
  const flyover = new CesiumPathFlyover(fakeViewer(), {speed: 100});
  assert.equal(flyover.duration, 0);
  // about 1 km north; at the end the marker's distance is the track's length
  const line = [[6.5, 46.8], [6.5, 46.809]];
  await loadLine(flyover, line);
  flyover.progress = 1;
  assert.ok(Math.abs(flyover.distance - 1000) < 10, `length ${flyover.distance}`);
  assert.equal(flyover.duration, flyover.distance / 100 + 3);
  // the middle style's 200 m/s
  const middle = new CesiumPathFlyover(fakeViewer());
  await loadLine(middle, line);
  middle.progress = 1;
  assert.equal(middle.duration, middle.distance / 200 + 3);
});

test("the range widens in the hairpin at full bend zoom and stays put on the straights", async () => {
  // the style's 700 m look-ahead averages this 620 m track into one camera heading:
  // the bend must be read from the track itself, not from the camera
  const {path} = await planPath(hairpin, {speed: 90, style: 1, range: 400});
  const n = path.range.length;
  assert.equal(n, path.headings.length);
  assert.ok(Math.max(...path.range) > 450, `widest ${Math.max(...path.range)}`);
  assert.ok(Math.max(...path.range) - Math.min(...path.range) > 50, "straights narrower than the bend");
  for (let k = 1; k < n; k++) {
    assert.ok(Math.abs(path.range[k] - path.range[k - 1]) < 40, `step at ${k}`);
  }
  const {path: rigid} = await planPath(hairpin, {speed: 90, range: 400});
  assert.ok(rigid.range.every((r) => r === 400));
});

test("a two-sample track gets two-entry profiles", async () => {
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.5002, 46.8, 800]);
  const {path} = await planPath(points, {style: 1, motion: 1});
  assert.equal(path.range.length, 2);
  assert.equal(path.lift.length, 2);
  assert.equal(path.headings.length, 2);
});

test("breathing drifts the heading and height within its amplitude and is off by default", async () => {
  assert.ok((await planPath(hairpin, {speed: 90})).path.lift.every((v) => v === 0));
  // same calm rows, breathing off, so the headings differ by the drift alone
  const {path: still} = await planPath(hairpin, {speed: 90, motion: 1, breathing: 0});
  const {path: floating} = await planPath(hairpin, {speed: 90, motion: 1});
  // no terrain, so the lift is the drift alone
  assert.equal(floating.lift.length, floating.headings.length);
  assert.ok(Math.max(...floating.lift.map(Math.abs)) <= 10 + 1e-9);
  assert.ok(Math.max(...floating.lift.map(Math.abs)) > 2, "drifts in height");
  const drift = floating.headings.map((h, k) => Math.abs(CesiumMath.negativePiToPi(h - still.headings[k])));
  assert.ok(Math.max(...drift) > CesiumMath.toRadians(1), "drifts in heading");
  assert.ok(floating.roll.every((r) => Math.abs(r) <= CesiumMath.toRadians(2) + 1e-9));
  assert.ok(Math.max(...floating.roll.map(Math.abs)) > CesiumMath.toRadians(0.3), "drifts in roll");
});

test("the pilot banks into the hairpin, up to the bank angle, and the default run stays level", async () => {
  const {path: level} = await planPath(hairpin, {speed: 90});
  assert.ok(level.roll.every((r) => r === 0));
  const {path: pilot} = await planPath(hairpin, {speed: 90, style: 0});
  assert.equal(pilot.roll.length, pilot.headings.length);
  const most = Math.max(...pilot.roll);
  assert.ok(most <= CesiumMath.toRadians(12) + 1e-9, `banks ${CesiumMath.toDegrees(most)} deg`);
  assert.ok(most > CesiumMath.toRadians(6), `banks only ${CesiumMath.toDegrees(most)} deg`);
  // the track turns right and the pilot leans right the whole way
  assert.ok(pilot.roll.every((r) => r >= 0), "leans left somewhere");
});

test("the points are the track's positions once loaded, undefined before", async () => {
  const viewer = fakeViewer();
  const coordinates = [[6.5, 46.8], [6.51, 46.8], [6.52, 46.81]];
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({type: "LineString", coordinates}));
  try {
    const flyover = new CesiumPathFlyover(viewer);
    assert.equal(flyover.points, undefined);
    await flyover.load("track.json");
    assert.equal(flyover.points.length, coordinates.length);
    const last = Cartographic.fromCartesian(flyover.points[2]);
    assert.ok(Math.abs(CesiumMath.toDegrees(last.longitude) - 6.52) < 1e-9);
    assert.ok(Math.abs(CesiumMath.toDegrees(last.latitude) - 46.81) < 1e-9);
  } finally {
    globalThis.fetch = fetch;
  }
});

test("the name, the times and the marker's distance follow the loaded track, the distance can be set", async () => {
  const viewer = fakeViewer();
  // 0.001 deg of latitude is about 111 m
  const gpx = `<gpx><trk><name>Rive</name><trkseg>
    <trkpt lat="46.8" lon="6.5"><time>2019-08-11T09:00:00Z</time></trkpt>
    <trkpt lat="46.801" lon="6.5"><time>2019-08-11T09:01:00Z</time></trkpt>
    <trkpt lat="46.802" lon="6.5"><time>2019-08-11T09:03:00Z</time></trkpt>
  </trkseg></trk></gpx>`;
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(gpx);
  try {
    const flyover = new CesiumPathFlyover(viewer, {freeLook: false});
    assert.equal(flyover.name, undefined);
    assert.equal(flyover.times, undefined);
    assert.equal(flyover.distance, undefined);
    await flyover.load("track.gpx");
    assert.equal(flyover.name, "Rive");
    assert.deepEqual(flyover.times, [1565514000, 1565514060, 1565514180]);
    assert.equal(flyover.distance, 0);
    flyover.progress = 1;
    assert.ok(Math.abs(flyover.distance - 222) < 2, `distance ${flyover.distance}`);
    flyover.distance = 100;
    assert.ok(Math.abs(flyover.distance - 100) < 1e-6, `distance ${flyover.distance}`);
    assert.ok(flyover.progress > 0 && flyover.progress < 1);
  } finally {
    globalThis.fetch = fetch;
  }
});

test("a track without times has none", async () => {
  const viewer = fakeViewer();
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({type: "LineString", coordinates: [[6.5, 46.8], [6.5, 46.801]]}));
  try {
    const flyover = new CesiumPathFlyover(viewer);
    await flyover.load("track.json");
    assert.equal(flyover.name, undefined);
    assert.equal(flyover.times, undefined);
  } finally {
    globalThis.fetch = fetch;
  }
});

test("of two loads under way, the later one wins whichever answers first", async () => {
  const viewer = fakeViewer();
  const line = (/** @type {number} */ km) =>
    JSON.stringify({type: "LineString", coordinates: [[6.5, 46.8], [6.5 + (km * 0.5) / 76, 46.8], [6.5 + km / 76, 46.8]]});
  /** @type {Map<string, (text: string) => void>} */
  const answers = new Map();
  const fetch = globalThis.fetch;
  globalThis.fetch = (/** @type {string} */ url) =>
    new Promise((resolve) => answers.set(url, (text) => resolve(new Response(text))));
  try {
    const flyover = new CesiumPathFlyover(viewer);
    const first = flyover.load("short.json");
    const second = flyover.load("long.json");
    answers.get("long.json")("" + line(2));
    await second;
    const points = flyover.points;
    answers.get("short.json")("" + line(1));
    await first;
    assert.equal(flyover.points, points, "the earlier load overwrote the later one");
    const end = CesiumMath.toDegrees(Cartographic.fromCartesian(points.at(-1)).longitude);
    assert.ok(Math.abs(end - (6.5 + 2 / 76)) < 1e-9, `ends at ${end}, not on the 2 km line`);
  } finally {
    globalThis.fetch = fetch;
  }
});

test("a long track plans the camera on coarser terrain tiles than the track's own", async () => {
  /** @type {Set<number>} */
  const levels = new Set();
  const provider = {
    tilingScheme: new GeographicTilingScheme(),
    getTileDataAvailable: () => true,
    requestTileGeometry: (x, y, level) => {
      levels.add(level);
      return Promise.resolve({interpolateHeight: () => 500});
    },
  };
  const viewer = fakeViewer();
  viewer.scene.terrainProvider = provider;
  const line = (/** @type {number} */ km) => JSON.stringify({type: "LineString", coordinates: [[6.5, 46.8], [6.5, 46.8 + km / 111]]});
  const fetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(line(2));
    const short = new CesiumPathFlyover(viewer);
    await short.load("short.json");
    assert.deepEqual([...levels], [16], "a short track samples everything at level 16");
    levels.clear();
    globalThis.fetch = async () => new Response(line(60));
    const long = new CesiumPathFlyover(viewer);
    await long.load("long.json");
    assert.deepEqual([...levels].sort(), [15, 16], "the track at level 16, the planner's corridor at 15");
  } finally {
    globalThis.fetch = fetch;
  }
});

test("bend zoom ignores the zigzags of a GPS track on a straight", async () => {
  // 2 km north with 3 m of lateral jitter every 10 m, deterministic
  const coords = [];
  for (let i = 0; i <= 200; i++) {
    const jitter = 3 * Math.sin(i * 12.9898) * Math.cos(i * 4.1414);
    coords.push(6.5 + jitter / 76000, 46.8 + (i * 10) / 111000, 800);
  }
  const {path} = await planPath(Cartesian3.fromDegreesArrayHeights(coords), {speed: 120, style: 1, range: 400});
  assert.ok(Math.max(...path.range) < 440, `widest ${Math.max(...path.range)} on a straight`);
});

test("bend zoom doubles the range in a hairpin and returns to the baseline on the straights", async () => {
  // north 1 km, 20 m east, back south 1 km
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.5, 46.809, 800, 6.50026, 46.809, 800, 6.50026, 46.8, 800]);
  const {path} = await planPath(points, {speed: 75, style: 1, range: 400});
  const n = path.range.length;
  assert.ok(Math.max(...path.range) > 720, `peak ${Math.max(...path.range)}`);
  assert.ok(path.range[Math.round(n * 0.2)] < 420, `first straight ${path.range[Math.round(n * 0.2)]}`);
  assert.ok(path.range[Math.round(n * 0.8)] < 420, `second straight ${path.range[Math.round(n * 0.8)]}`);
});

test("the frame twists the camera right by the sampled roll on a right turn", async () => {
  const twists = [];
  const viewer = fakeViewer();
  viewer.scene.camera.twistRight = (angle) => twists.push(angle);
  const flyover = new CesiumPathFlyover(viewer, {speed: 90, style: 0});
  await loadLine(flyover, lonLats(HAIRPIN));
  flyover.progress = 0.5;
  assert.equal(twists.length, 1);
  // the path the flyover planned, planned again on its points
  const {path} = await planPath(trailThrough(flyover.points), {speed: 90, style: 0});
  const roll = sampleProfile(path.roll, 0.5);
  assert.ok(roll > 0, "the hairpin turns right");
  assert.ok(Math.abs(twists[0] - roll) < 1e-6, `twist ${twists[0]} for roll ${roll}`);
});

// a flyover on a straight track with a stubbed scene and clock, the actions of
// its input handlers recorded; `at` runs a frame at a given time
const lookingFlyover = async (t, options = {}) => {
  const calls = [];
  const handler = {actions: new Map(), destroyed: false};
  // keyed by the event type, and its modifier after a "+" when there is one
  t.mock.method(ScreenSpaceEventHandler.prototype, "setInputAction", (action, type, modifier) => {
    handler.actions.set(modifier === undefined ? type : `${type}+${modifier}`, action);
  });
  t.mock.method(ScreenSpaceEventHandler.prototype, "destroy", () => {
    handler.destroyed = true;
  });
  let now = 0;
  t.mock.method(performance, "now", () => now * 1000);
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {
    // a handler listens to its canvas alone, the wheel included
    canvas: {addEventListener: () => {}, removeEventListener: () => {}, disableRootEvents: true, onwheel: null},
    screenSpaceCameraController: {enableInputs: true},
    camera: {
      lookAt: (target, offset) => calls.push({target: Cartesian3.clone(target), offset: Cartesian3.clone(offset)}),
      lookAtTransform: () => {},
      twistRight: () => {},
    },
  });
  viewer.scene.globe.getHeight = () => undefined;
  const flyover = new CesiumPathFlyover(viewer, {speed: 44, ...options});
  await loadLine(flyover, lonLats(STRAIGHT));
  // the scene raises preUpdate every frame; playback started at now 0 is at its start
  const at = (seconds) => {
    now = seconds;
    viewer.scene.preUpdate.raiseEvent();
    return calls.at(-1);
  };
  const headingOf = (offset) => Math.atan2(-offset.x, -offset.y);
  return {flyover, viewer, handler, calls, at, headingOf};
};

test("play installs the input handler and stop destroys it", async (t) => {
  const {flyover, viewer, handler} = await lookingFlyover(t);
  flyover.play();
  const dragEvents = [ScreenSpaceEventType.LEFT_DOWN, ScreenSpaceEventType.LEFT_UP, ScreenSpaceEventType.MOUSE_MOVE];
  // each modifier key, and every combination of them
  const {SHIFT, CTRL, ALT} = KeyboardEventModifier;
  const held = [SHIFT, CTRL, ALT, [SHIFT, CTRL], [SHIFT, ALT], [CTRL, ALT], [SHIFT, CTRL, ALT]];
  const modified = dragEvents.flatMap((type) => held.map((modifier) => `${type}+${modifier}`));
  assert.deepEqual(
    handler.actions.keys().map(String).toArray().sort(),
    [...dragEvents, ScreenSpaceEventType.PINCH_MOVE, ScreenSpaceEventType.WHEEL, ...modified].map(String).sort()
  );
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
  flyover.stop();
  assert.equal(handler.destroyed, true);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, true);
});

test("a drag released with modifier keys held ends the drag", async (t) => {
  const {flyover, handler, at} = await lookingFlyover(t, {recenterDelay: false});
  flyover.play();
  at(0);
  for (const released of [KeyboardEventModifier.SHIFT, [KeyboardEventModifier.SHIFT, KeyboardEventModifier.CTRL]]) {
    handler.actions.get(ScreenSpaceEventType.LEFT_DOWN)({position: {x: 0, y: 0}});
    handler.actions.get(ScreenSpaceEventType.MOUSE_MOVE)({startPosition: {x: 0, y: 0}, endPosition: {x: 100, y: 0}});
    handler.actions.get(`${ScreenSpaceEventType.LEFT_UP}+${released}`)({position: {x: 100, y: 0}});
    const heading = flyover.view.heading;
    // the mouse moves again without a button: the view must not turn
    handler.actions.get(ScreenSpaceEventType.MOUSE_MOVE)({startPosition: {x: 100, y: 0}, endPosition: {x: 300, y: 0}});
    assert.equal(flyover.view.heading, heading, `after a release with ${released}`);
  }
  flyover.stop();
});

test("freeLook false leaves the inputs alone", async (t) => {
  const {flyover, viewer, handler} = await lookingFlyover(t, {freeLook: false});
  flyover.play();
  assert.equal(handler.actions.size, 0);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, true);
  flyover.stop();
});

test("a drag turns the camera around the target and the view reports it", async (t) => {
  const {flyover, handler, at, headingOf} = await lookingFlyover(t, {recenterDelay: false});
  flyover.play();
  const planned = headingOf(at(0).offset);
  handler.actions.get(ScreenSpaceEventType.LEFT_DOWN)({position: {x: 100, y: 100}});
  handler.actions.get(ScreenSpaceEventType.MOUSE_MOVE)({startPosition: {x: 100, y: 100}, endPosition: {x: 200, y: 100}});
  handler.actions.get(ScreenSpaceEventType.LEFT_UP)({position: {x: 200, y: 100}});
  let last;
  for (let t = 0.05; t <= 3; t += 0.05) {
    last = at(t);
  }
  const turned = CesiumMath.negativePiToPi(headingOf(last.offset) - planned);
  assert.ok(Math.abs(CesiumMath.toDegrees(turned) - 30) < 0.5, `turned ${CesiumMath.toDegrees(turned)}`);
  assert.ok(Math.abs(flyover.view.heading - CesiumMath.toRadians(30)) < CesiumMath.toRadians(0.5), `view ${CesiumMath.toDegrees(flyover.view.heading)}`);
  assert.equal(flyover.view.zoom, 1);
  flyover.stop();
});

test("the wheel changes the range and recenter brings it back", async (t) => {
  const {flyover, handler, at} = await lookingFlyover(t, {recenterDelay: false});
  flyover.play();
  const range = Cartesian3.magnitude(at(0).offset);
  handler.actions.get(ScreenSpaceEventType.WHEEL)(1);
  let last;
  for (let t = 0.05; t <= 3; t += 0.05) {
    last = at(t);
  }
  assert.ok(Math.abs(Cartesian3.magnitude(last.offset) / range - 1 / 1.1) < 1e-3, "zoomed in one notch");
  flyover.recenter();
  for (let t = 3.05; t <= 5; t += 0.05) {
    last = at(t);
  }
  assert.ok(Math.abs(Cartesian3.magnitude(last.offset) - range) < 1e-6, "back at the planned range");
  flyover.stop();
});

test("while looking, the camera is lifted above the loaded terrain", async (t) => {
  const {flyover, viewer, handler, at} = await lookingFlyover(t, {recenterDelay: false});
  flyover.play();
  const plannedCall = at(0);
  const heightOf = (call) =>
    Cartographic.fromCartesian(Matrix4.multiplyByPoint(Transforms.eastNorthUpToFixedFrame(call.target), call.offset, new Cartesian3())).height;
  // zoom in hard: the camera comes closer and tens of metres lower than the planned one
  for (let i = 0; i < 10; i++) {
    handler.actions.get(ScreenSpaceEventType.WHEEL)(1);
  }
  const free = at(0.1);
  assert.ok(free.offset.z < plannedCall.offset.z - 20, "zooming in lowers the camera");
  // the planned camera at this instant is the free offset before the zoom; put the
  // ground exactly clearance below it, so only the lower camera is short
  const plannedOffset = Cartesian3.divideByScalar(free.offset, flyover.view.zoom, new Cartesian3());
  const plannedHeight = heightOf({target: free.target, offset: plannedOffset});
  viewer.scene.globe.getHeight = () => plannedHeight - flyover.clearance;
  const lifted = at(0.15);
  assert.ok(lifted.offset.z > free.offset.z + 5, "lifted");
  assert.ok(Math.abs(heightOf(lifted) - plannedHeight) < 2, `camera at ${heightOf(lifted)}, expected about ${plannedHeight}`);
  // tiles not loaded: the camera stays where the offsets put it
  viewer.scene.globe.getHeight = () => undefined;
  const again = at(0.2);
  assert.ok(again.offset.z <= plannedCall.offset.z + 1e-6, "not lifted without terrain: zooming in only lowers");
  flyover.stop();
});

test("stop during a drag drops the offsets and the next play starts clean", async (t) => {
  const {flyover, handler, at, headingOf} = await lookingFlyover(t, {recenterDelay: false});
  flyover.play();
  const planned = headingOf(at(0).offset);
  handler.actions.get(ScreenSpaceEventType.LEFT_DOWN)({position: {x: 0, y: 0}});
  handler.actions.get(ScreenSpaceEventType.MOUSE_MOVE)({startPosition: {x: 0, y: 0}, endPosition: {x: 300, y: 0}});
  at(1);
  flyover.stop();
  assert.equal(handler.destroyed, true);
  assert.deepEqual(flyover.view, {heading: 0, pitch: 0, zoom: 1});
  flyover.progress = 0.5;
  flyover.play();
  const again = headingOf(at(1.05).offset);
  assert.ok(Math.abs(CesiumMath.negativePiToPi(again - planned)) < 1e-6, "planned heading again");
  flyover.stop();
});

test("the terrain lift only adds what the swung camera needs beyond the planned one", async (t) => {
  const {flyover, viewer, handler, at} = await lookingFlyover(t, {recenterDelay: 1});
  flyover.play();
  const planned = at(0);
  const plannedHeight = Cartographic.fromCartesian(Matrix4.multiplyByPoint(Transforms.eastNorthUpToFixedFrame(planned.target), planned.offset, new Cartesian3())).height;
  // loaded tiles put the ground 20 m higher than the plan allowed for: the planned camera is short of the clearance
  viewer.scene.globe.getHeight = () => plannedHeight - flyover.clearance + 20;
  // click and hold without moving: nothing should jump
  handler.actions.get(ScreenSpaceEventType.LEFT_DOWN)({position: {x: 0, y: 0}});
  const held = at(0.05);
  assert.ok(Math.abs(held.offset.z - planned.offset.z) < 1e-6, `jumped by ${held.offset.z - planned.offset.z} m on click`);
  handler.actions.get(ScreenSpaceEventType.LEFT_UP)({position: {x: 0, y: 0}});
  // a drag, then the automatic return: the last frame of the return sits on the planned offset
  handler.actions.get(ScreenSpaceEventType.LEFT_DOWN)({position: {x: 0, y: 0}});
  handler.actions.get(ScreenSpaceEventType.MOUSE_MOVE)({startPosition: {x: 0, y: 0}, endPosition: {x: 100, y: 0}});
  handler.actions.get(ScreenSpaceEventType.LEFT_UP)({position: {x: 100, y: 0}});
  let last;
  for (let t = 0.1; t <= 4; t += 0.05) {
    last = at(t);
  }
  assert.ok(Math.abs(last.offset.z - planned.offset.z) < 1e-6, `off by ${last.offset.z - planned.offset.z} m after the return`);
  flyover.stop();
});

test("setting progress while stopped places the camera there and raises progressChanged", async (t) => {
  const {flyover, calls} = await lookingFlyover(t, {freeLook: false});
  const seen = [];
  flyover.progressChanged.addEventListener((p) => seen.push(p));
  flyover.progress = 0.3;
  assert.equal(flyover.progress, 0.3);
  assert.equal(calls.length, 1);
  assert.deepEqual(seen, [0.3]);
  const expected = trackThrough(trailThrough(flyover.points)).spline.evaluate(easedProgress(0.3, 3 / flyover.duration), new Cartesian3());
  assert.ok(Cartesian3.distance(flyover.position, expected) < 1e-6, "marker at 30% of the run");
  flyover.progress = 2;
  assert.equal(flyover.progress, 1);
});

test("setting progress while playing rebases the clock and playback goes on from there", async (t) => {
  const {flyover, at} = await lookingFlyover(t, {freeLook: false});
  const seen = [];
  flyover.progressChanged.addEventListener((p) => seen.push(p));
  flyover.play();
  at(0);
  flyover.progress = 0.8;
  at(0.5); // half a second later
  const expected = 0.8 + 0.5 / flyover.duration;
  assert.ok(Math.abs(flyover.progress - expected) < 1e-9, `progress ${flyover.progress}`);
  assert.ok(seen.some((p) => Math.abs(p - expected) < 1e-9), `raised ${seen}`);
  flyover.stop();
});

test("the trail splits at the marker's place along the line it draws, the climb included", async () => {
  // 100 m east climbing 100 m, then 100 m east on the flat
  const heightAt = (longitude) => 800 + 100 * CesiumMath.clamp((CesiumMath.toDegrees(longitude) - 6.5) / 0.0013, 0, 1);
  const viewer = fakeViewer();
  viewer.scene.terrainProvider = {
    tilingScheme: new GeographicTilingScheme(),
    getTileDataAvailable: () => true,
    requestTileGeometry: () => Promise.resolve({interpolateHeight: (rectangle, longitude) => heightAt(longitude)}),
  };
  const flyover = new CesiumPathFlyover(viewer, {freeLook: false});
  await loadLine(flyover, [[6.5, 46.8], [6.5013, 46.8], [6.5026, 46.8]]);
  const layers = viewer.scene.primitives.added.at(-1);
  flyover.progress = 0.5;
  // the marker's fraction of the run, the trail's own length
  const expected = easedProgress(0.5, 3 / flyover.duration);
  const marker = Cartographic.fromCartesian(flyover.position);
  const flat = (CesiumMath.toDegrees(marker.longitude) - 6.5) / 0.0026;
  assert.ok(flat < expected - 0.05, `the climb holds more than half of the line: ${flat} on the flat, ${expected} along`);
  for (let i = 0; i < layers.length; i++) {
    const actual = layers.get(i).appearance.material.uniforms.progress;
    assert.ok(Math.abs(actual - expected) < 1e-6, `trail split at ${actual}, marker at ${expected}`);
  }
});

test("the previous track stays on screen until the next one's heights are in", async () => {
  const viewer = fakeViewer();
  const removed = [];
  viewer.scene.primitives.remove = (primitive) => removed.push(primitive);
  const flyover = new CesiumPathFlyover(viewer, {freeLook: false});
  await loadLine(flyover, [[6.5, 46.8], [6.51, 46.8]]);
  const first = viewer.scene.primitives.added.at(-1);
  // the next track's terrain answers once released
  const {promise: released, resolve: release} = Promise.withResolvers();
  viewer.scene.terrainProvider = {
    tilingScheme: new GeographicTilingScheme(),
    getTileDataAvailable: () => true,
    requestTileGeometry: () => released.then(() => ({interpolateHeight: () => 500})),
  };
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({type: "LineString", coordinates: [[6.5, 46.8], [6.5, 46.81]]}));
  try {
    const next = flyover.load("track.json");
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(removed, [], "the first track was removed before the next one could be drawn");
    release();
    await next;
  } finally {
    globalThis.fetch = fetch;
  }
  assert.deepEqual(removed, [first]);
  assert.notEqual(viewer.scene.primitives.added.at(-1), first);
});

test("a finished load puts the trail's split back at the start with the marker", async () => {
  const viewer = fakeViewer();
  const flyover = new CesiumPathFlyover(viewer);
  await loadLine(flyover, [[6.5, 46.8], [6.51, 46.8]]);
  // a scrub during the next load, once its track is drawn and while its heights
  // load, places the new trail's split on the previous track's path
  let trail;
  let scrubbed;
  viewer.scene.primitives.add = (primitive) => {
    trail = primitive.get(0).appearance.material;
    flyover.progress = 0.7;
    scrubbed = trail.uniforms.progress;
    return primitive;
  };
  await loadLine(flyover, [[6.5, 46.8], [6.5, 46.81]]);
  assert.ok(scrubbed > 0.5, `the scrub left the split at ${scrubbed}`);
  assert.equal(trail.uniforms.progress, 0);
});
