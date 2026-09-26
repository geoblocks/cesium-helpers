import {test} from "node:test";
import assert from "node:assert/strict";
import {Cartesian3, Cartographic, CatmullRomSpline, Ellipsoid, EllipsoidTerrainProvider, KeyboardEventModifier, Math as CesiumMath, Matrix4, SceneMode, ScreenSpaceEventType, Transforms} from "@cesium/engine";
import CesiumPathFlyover from "./cesium-path-flyover.js";
import {easedProgress} from "./track.js";
import {sampleProfile} from "./planner.js";
import TerrainSampler from "./terrain.js";

// the tests run on the ellipsoid, where the sampler answers no heights
const sampler = new TerrainSampler(new EllipsoidTerrainProvider(), 16);

const fakeViewer = () => ({
  scene: {
    primitives: {add: () => {}, remove: () => {}},
    globe: {maximumScreenSpaceError: 2},
    preUpdate: {addEventListener: () => () => {}, removeEventListener: () => true},
  },
});

test("play coarsens the globe's screen-space error and stop restores what the scene had", () => {
  const viewer = fakeViewer();
  viewer.scene.globe.maximumScreenSpaceError = 1.5;
  const flyover = new CesiumPathFlyover(viewer, {freeLook: false});
  flyover.path_ = /** @type {any} */ ({});
  flyover.play();
  assert.equal(viewer.scene.globe.maximumScreenSpaceError, 4);
  flyover.stop();
  flyover.stop();
  assert.equal(viewer.scene.globe.maximumScreenSpaceError, 1.5);
});

test("the screen-space error option can be changed or switched off", () => {
  const viewer = fakeViewer();
  const flyover = new CesiumPathFlyover(viewer, {screenSpaceError: 3, freeLook: false});
  flyover.path_ = /** @type {any} */ ({});
  flyover.play();
  assert.equal(viewer.scene.globe.maximumScreenSpaceError, 3);
  flyover.stop();
  const untouched = fakeViewer();
  const off = new CesiumPathFlyover(untouched, {screenSpaceError: false, freeLook: false});
  off.path_ = /** @type {any} */ ({});
  off.play();
  assert.equal(untouched.scene.globe.maximumScreenSpaceError, 2);
  off.stop();
});

test("the camera looks at a point beside the marker, not at one trailing it", async () => {
  const targets = [];
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {
    ellipsoid: Ellipsoid.WGS84,
    terrainProvider: new EllipsoidTerrainProvider(),
    mode: SceneMode.SCENE3D,
    requestRender: () => {},
    camera: {lookAt: (target) => targets.push(Cartesian3.clone(target)), lookAtTransform: () => {}, twistRight: () => {}},
  });
  const flyover = new CesiumPathFlyover(viewer, {duration: 5});
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.502, 46.8, 810, 6.504, 46.8, 820]);
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Cartesian3.distance(points[i - 1], points[i]));
  }
  flyover.totalLength_ = distances[2];
  flyover.spline_ = new CatmullRomSpline({points, times: distances.map((d) => d / distances[2])});
  flyover.path_ = await flyover.computePath_(sampler);
  // straight track: a damped target would trail by 20 m at this speed
  flyover.startTime_ = flyover.now_() - 0.5 * flyover.duration;
  flyover.update_();
  assert.equal(targets.length, 1);
  const distance = Cartesian3.distance(targets[0], flyover.marker_.position);
  assert.ok(distance < 2, `target ${distance} m from the marker`);
});

const hairpinFlyover = (viewer, options) => {
  const flyover = new CesiumPathFlyover(viewer, options);
  // north 300 m, 20 m east, back south 300 m
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.5, 46.8027, 800, 6.50026, 46.8027, 800, 6.50026, 46.8, 800]);
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Cartesian3.distance(points[i - 1], points[i]));
  }
  flyover.totalLength_ = distances[3];
  flyover.spline_ = new CatmullRomSpline({points, times: distances.map((d) => d / distances[3])});
  return flyover;
};

test("the heading turns through a hairpin no faster than the pan limit", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  const flyover = hairpinFlyover(viewer, {duration: 10});
  const path = await flyover.computePath_(sampler);
  const dt = 10 / (path.headings.length - 1);
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
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  // breathing off: the drift rides on top of the limited heading at its own slow rate
  const flyover = hairpinFlyover(viewer, {duration: 10, motion: 1, breathing: 0});
  const path = await flyover.computePath_(sampler);
  const dt = 10 / (path.headings.length - 1);
  const limit = CesiumMath.toRadians(15) * dt;
  for (let k = 1; k < path.headings.length; k++) {
    const step = Math.abs(CesiumMath.negativePiToPi(path.headings[k] - path.headings[k - 1]));
    assert.ok(step <= limit + 1e-9, `turn of ${CesiumMath.toDegrees(step / dt)} deg/s at sample ${k}`);
  }
});

test("the style dial sets the camera distance unless range is given", () => {
  const far = new CesiumPathFlyover(fakeViewer(), {style: 1});
  assert.equal(far.run_.range, 900);
  assert.equal(far.pitch, CesiumMath.toRadians(-45));
  const near = new CesiumPathFlyover(fakeViewer(), {style: 1, range: 300});
  assert.equal(near.run_.range, 300);
});

test("the range widens in the hairpin at full bend zoom and stays put on the straights", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  // the style's 700 m look-ahead averages this 620 m track into one camera heading:
  // the bend must be read from the track itself, not from the camera
  const path = await hairpinFlyover(viewer, {duration: 10, style: 1, range: 400}).computePath_(sampler);
  const n = path.range.length;
  assert.equal(n, path.headings.length);
  assert.ok(Math.max(...path.range) > 450, `widest ${Math.max(...path.range)}`);
  assert.ok(Math.max(...path.range) - Math.min(...path.range) > 50, "straights narrower than the bend");
  for (let k = 1; k < n; k++) {
    assert.ok(Math.abs(path.range[k] - path.range[k - 1]) < 40, `step at ${k}`);
  }
  const rigid = await hairpinFlyover(viewer, {duration: 10, range: 400}).computePath_(sampler);
  assert.ok(rigid.range.every((r) => r === 400));
});

test("a two-sample track gets two-entry profiles", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  const flyover = new CesiumPathFlyover(viewer, {duration: 2, style: 1, motion: 1});
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.5002, 46.8, 800]);
  flyover.totalLength_ = Cartesian3.distance(points[0], points[1]);
  flyover.spline_ = new CatmullRomSpline({points, times: [0, 1]});
  const path = await flyover.computePath_(sampler);
  assert.equal(path.range.length, 2);
  assert.equal(path.lift.length, 2);
  assert.equal(path.headings.length, 2);
});

test("breathing drifts the heading and height within its amplitude and is off by default", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  assert.ok((await hairpinFlyover(viewer, {duration: 10}).computePath_(sampler)).lift.every((v) => v === 0));
  // same calm rows, breathing off, so the headings differ by the drift alone
  const still = await hairpinFlyover(viewer, {duration: 10, motion: 1, breathing: 0}).computePath_(sampler);
  const floating = await hairpinFlyover(viewer, {duration: 10, motion: 1}).computePath_(sampler);
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
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  const level = await hairpinFlyover(viewer, {duration: 10}).computePath_(sampler);
  assert.ok(level.roll.every((r) => r === 0));
  const pilot = await hairpinFlyover(viewer, {duration: 10, style: 0}).computePath_(sampler);
  assert.equal(pilot.roll.length, pilot.headings.length);
  const most = Math.max(...pilot.roll);
  assert.ok(most <= CesiumMath.toRadians(12) + 1e-9, `banks ${CesiumMath.toDegrees(most)} deg`);
  assert.ok(most > CesiumMath.toRadians(6), `banks only ${CesiumMath.toDegrees(most)} deg`);
  // the track turns right and the pilot leans right the whole way
  assert.ok(pilot.roll.every((r) => r >= 0), "leans left somewhere");
});

test("of two loads under way, the later one wins whichever answers first", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider(), requestRender: () => {}});
  const line = (/** @type {number} */ km) =>
    JSON.stringify({type: "LineString", coordinates: [[6.5, 46.8], [6.5 + (km * 0.5) / 76, 46.8], [6.5 + km / 76, 46.8]]});
  /** @type {Map<string, (text: string) => void>} */
  const answers = new Map();
  const fetch = globalThis.fetch;
  globalThis.fetch = (/** @type {string} */ url) =>
    new Promise((resolve) => answers.set(url, (text) => resolve(new Response(text))));
  try {
    const flyover = new CesiumPathFlyover(viewer, {duration: 5});
    // a primitive needs a GL context
    flyover.createTrack_ = () => ({});
    const first = flyover.load("short.json");
    const second = flyover.load("long.json");
    answers.get("long.json")("" + line(2));
    await second;
    const length = flyover.totalLength_;
    answers.get("short.json")("" + line(1));
    await first;
    assert.equal(flyover.totalLength_, length, "the earlier load overwrote the later one");
    assert.ok(length > 1500, `${length} m`);
  } finally {
    globalThis.fetch = fetch;
  }
});

const trackFlyover = (viewer, options, points) => {
  const flyover = new CesiumPathFlyover(viewer, options);
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Cartesian3.distance(points[i - 1], points[i]));
  }
  const total = distances.at(-1);
  flyover.totalLength_ = total;
  flyover.spline_ = new CatmullRomSpline({points, times: distances.map((d) => d / total)});
  return flyover;
};

test("bend zoom ignores the zigzags of a GPS track on a straight", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  // 2 km north with 3 m of lateral jitter every 10 m, deterministic
  const coords = [];
  for (let i = 0; i <= 200; i++) {
    const jitter = 3 * Math.sin(i * 12.9898) * Math.cos(i * 4.1414);
    coords.push(6.5 + jitter / 76000, 46.8 + (i * 10) / 111000, 800);
  }
  const path = await trackFlyover(viewer, {duration: 20, style: 1, range: 400}, Cartesian3.fromDegreesArrayHeights(coords)).computePath_(sampler);
  assert.ok(Math.max(...path.range) < 440, `widest ${Math.max(...path.range)} on a straight`);
});

test("bend zoom doubles the range in a hairpin and returns to the baseline on the straights", async () => {
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {ellipsoid: Ellipsoid.WGS84, terrainProvider: new EllipsoidTerrainProvider()});
  // north 1 km, 20 m east, back south 1 km
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.5, 46.809, 800, 6.50026, 46.809, 800, 6.50026, 46.8, 800]);
  const path = await trackFlyover(viewer, {duration: 30, style: 1, range: 400}, points).computePath_(sampler);
  const n = path.range.length;
  assert.ok(Math.max(...path.range) > 720, `peak ${Math.max(...path.range)}`);
  assert.ok(path.range[Math.round(n * 0.2)] < 420, `first straight ${path.range[Math.round(n * 0.2)]}`);
  assert.ok(path.range[Math.round(n * 0.8)] < 420, `second straight ${path.range[Math.round(n * 0.8)]}`);
});

test("the frame twists the camera right by the sampled roll on a right turn", async () => {
  const twists = [];
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {
    ellipsoid: Ellipsoid.WGS84,
    terrainProvider: new EllipsoidTerrainProvider(),
    mode: SceneMode.SCENE3D,
    requestRender: () => {},
    camera: {lookAt: () => {}, lookAtTransform: () => {}, twistRight: (angle) => twists.push(angle)},
  });
  const flyover = hairpinFlyover(viewer, {duration: 10, style: 0});
  flyover.path_ = await flyover.computePath_(sampler);
  flyover.startTime_ = flyover.now_() - 0.5 * flyover.duration;
  flyover.update_();
  assert.equal(twists.length, 1);
  const roll = sampleProfile(flyover.path_.roll, 0.5);
  assert.ok(roll > 0, "the hairpin turns right");
  // update_ read the clock a moment after startTime_
  assert.ok(Math.abs(twists[0] - roll) < 1e-6, `twist ${twists[0]} for roll ${roll}`);
});

// a flyover on a straight track with a stubbed scene, ready to update_ at a given time
const lookingFlyover = async (options = {}) => {
  const calls = [];
  const handler = {
    actions: new Map(),
    destroyed: false,
    // keyed by the event type, and its modifier after a "+" when there is one
    setInputAction(action, type, modifier) {
      this.actions.set(modifier === undefined ? type : `${type}+${modifier}`, action);
    },
    destroy() {
      this.destroyed = true;
    },
  };
  const viewer = fakeViewer();
  Object.assign(viewer.scene, {
    ellipsoid: Ellipsoid.WGS84,
    terrainProvider: new EllipsoidTerrainProvider(),
    mode: SceneMode.SCENE3D,
    canvas: {},
    requestRender: () => {},
    screenSpaceCameraController: {enableInputs: true},
    camera: {
      lookAt: (target, offset) => calls.push({target: Cartesian3.clone(target), offset: Cartesian3.clone(offset)}),
      lookAtTransform: () => {},
      twistRight: () => {},
    },
  });
  viewer.scene.globe.getHeight = () => undefined;
  const flyover = new CesiumPathFlyover(viewer, {duration: 10, ...options});
  const points = Cartesian3.fromDegreesArrayHeights([6.5, 46.8, 800, 6.502, 46.8, 810, 6.504, 46.8, 820]);
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Cartesian3.distance(points[i - 1], points[i]));
  }
  flyover.totalLength_ = distances[2];
  flyover.spline_ = new CatmullRomSpline({points, times: distances.map((d) => d / distances[2])});
  flyover.path_ = await flyover.computePath_(sampler);
  let now = 0;
  flyover.now_ = () => now;
  flyover.createInputHandler_ = () => handler;
  // update_ reads the wall clock through now_ for playback time too: at now 0, halfway
  flyover.startTime_ = -0.5 * flyover.duration;
  const at = (seconds) => {
    now = seconds;
    flyover.update_();
    return calls.at(-1);
  };
  const headingOf = (offset) => Math.atan2(-offset.x, -offset.y);
  return {flyover, viewer, handler, calls, at, headingOf};
};

test("play installs the input handler and stop destroys it", async () => {
  const {flyover, viewer, handler} = await lookingFlyover();
  flyover.play();
  const dragEvents = [ScreenSpaceEventType.LEFT_DOWN, ScreenSpaceEventType.LEFT_UP, ScreenSpaceEventType.MOUSE_MOVE];
  // each modifier key, and every combination of them
  const {SHIFT, CTRL, ALT} = KeyboardEventModifier;
  const held = [SHIFT, CTRL, ALT, [SHIFT, CTRL], [SHIFT, ALT], [CTRL, ALT], [SHIFT, CTRL, ALT]];
  const modified = dragEvents.flatMap((type) => held.map((modifier) => `${type}+${modifier}`));
  assert.deepEqual(
    [...handler.actions.keys()].map(String).sort(),
    [...dragEvents, ScreenSpaceEventType.PINCH_MOVE, ScreenSpaceEventType.WHEEL, ...modified].map(String).sort()
  );
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, false);
  flyover.stop();
  assert.equal(handler.destroyed, true);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, true);
});

test("a drag released with modifier keys held ends the drag", async () => {
  const {flyover, handler, at} = await lookingFlyover({recenterDelay: false});
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

test("freeLook false leaves the inputs alone", async () => {
  const {flyover, viewer, handler} = await lookingFlyover({freeLook: false});
  flyover.play();
  assert.equal(handler.actions.size, 0);
  assert.equal(viewer.scene.screenSpaceCameraController.enableInputs, true);
  flyover.stop();
});

test("a drag turns the camera around the target and the view reports it", async () => {
  const {flyover, handler, at, headingOf} = await lookingFlyover({recenterDelay: false});
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

test("the wheel changes the range and recenter brings it back", async () => {
  const {flyover, handler, at} = await lookingFlyover({recenterDelay: false});
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

test("while looking, the camera is lifted above the loaded terrain", async () => {
  const {flyover, viewer, handler, at} = await lookingFlyover({recenterDelay: false});
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

test("stop during a drag drops the offsets and the next play starts clean", async () => {
  const {flyover, handler, at, headingOf} = await lookingFlyover({recenterDelay: false});
  flyover.play();
  const planned = headingOf(at(0).offset);
  handler.actions.get(ScreenSpaceEventType.LEFT_DOWN)({position: {x: 0, y: 0}});
  handler.actions.get(ScreenSpaceEventType.MOUSE_MOVE)({startPosition: {x: 0, y: 0}, endPosition: {x: 300, y: 0}});
  at(1);
  flyover.stop();
  assert.equal(handler.destroyed, true);
  assert.deepEqual(flyover.view, {heading: 0, pitch: 0, zoom: 1});
  flyover.t_ = 0.5;
  flyover.play();
  const again = headingOf(at(1.05).offset);
  assert.ok(Math.abs(CesiumMath.negativePiToPi(again - planned)) < 1e-6, "planned heading again");
  flyover.stop();
});

test("the terrain lift only adds what the swung camera needs beyond the planned one", async () => {
  const {flyover, viewer, handler, at} = await lookingFlyover({recenterDelay: 1});
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

test("setting progress while stopped places the camera there and raises progressChanged", async () => {
  const {flyover, calls} = await lookingFlyover({freeLook: false});
  const seen = [];
  flyover.progressChanged.addEventListener((p) => seen.push(p));
  flyover.progress = 0.3;
  assert.equal(flyover.progress, 0.3);
  assert.equal(calls.length, 1);
  assert.deepEqual(seen, [0.3]);
  const expected = flyover.spline_.evaluate(easedProgress(0.3, 3 / 10), new Cartesian3());
  assert.ok(Cartesian3.distance(flyover.marker_.position, expected) < 1e-6, "marker at 30% of the run");
  flyover.progress = 2;
  assert.equal(flyover.progress, 1);
});

test("setting progress while playing rebases the clock and playback goes on from there", async () => {
  const {flyover, at} = await lookingFlyover({freeLook: false});
  const seen = [];
  flyover.progressChanged.addEventListener((p) => seen.push(p));
  flyover.play();
  at(0);
  flyover.progress = 0.8;
  at(0.5); // half a second later on a 10 s run
  assert.ok(Math.abs(flyover.progress - 0.85) < 1e-9, `progress ${flyover.progress}`);
  assert.ok(seen.some((p) => Math.abs(p - 0.85) < 1e-9), `raised ${seen}`);
  flyover.stop();
});
