import {
  ArcType,
  Cartesian3,
  Cartographic,
  CatmullRomSpline,
  Color,
  Event,
  FixedFrameTransforms,
  GeometryInstance,
  Math as CesiumMath,
  Matrix4,
  PolylineGeometry,
} from "@cesium/core";
import {
  KeyboardEventModifier,
  Material,
  PointPrimitiveCollection,
  PolylineMaterialAppearance,
  Primitive,
  PrimitiveCollection,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "@cesium/engine";
import {acquireTerrainDepth, releaseTerrainDepth} from "@geoblocks/cesium-post-process";
import FreeLook from "./free-look.js";
import {
  CORNER_TRIM,
  CORNER_TURN,
  TRAIL_MAX_POINTS,
  TRAIL_STEP,
  cumulativeDistances,
  decimate,
  easedProgress,
  easedProgressInverse,
  fetchTrackText,
  fillGaps,
  parseTrack,
  parseTrackName,
  trailAlong,
  trailColor,
  trailPath,
} from "./track.js";
import TerrainSampler from "./terrain.js";
import {cameraOffsetEnu, sampleProfile} from "./planner.js";
import {EASE_SECONDS, MARKER_HEIGHT, computePath, runDuration} from "./path.js";
import {deriveRun} from "./run.js";
import Trail from "./shaders/Trail.js";

/** @import {Run} from "./run.js" */
/** @import {Ellipsoid} from "@cesium/core" */
/** @import {CesiumWidget} from "@cesium/engine" */

const MIN_POINT_DISTANCE = 10;
// terrain level for every height sample, track and planner alike: within a metre
// of the most detailed level, an order of magnitude fewer tiles, and the same
// tiles for the track and for the planner's corridor around it
const SAMPLE_LEVEL = 16;
// beyond this length the planner's corridor is sampled a level coarser: 27% to
// 56% fewer tiles on a 377 km route, from the middle to the spectator style,
// with the same clearance and occlusions; on a short gorge the coarser mesh
// moves the lift by up to 50 m, and the track's own heights stay at SAMPLE_LEVEL
const LONG_TRACK = 50000; // meters
const LONG_TRACK_PLAN_LEVEL = 15;
const ACCENT = Color.fromCssColorString("#FF680A");
const MARKER_SIZE = 18; // pixels
// pixels: the line of Trail.glsl, 5 px across at most, with a pixel of antialiasing on each side
const TRAIL_LINE_WIDTH = 8;
// pixels: its glow at the marker, its widest, fits in it
const TRAIL_GLOW_WIDTH = 28;
// Two lines of Cesium's polyline shader are replaced, Cesium having no public way to change them.
// Cesium miters a polyline's joins up to twice its width: where a small turn in the world is a sharp one on screen
// (the line running away from the camera), the miter juts out as a barb, painted as the core by Trail.glsl.
// Past a miter of twice the half width (a turn of about 120 degrees on screen), the segments end square instead.
const CESIUM_MITER = "expandWidth = clamp(expandWidth / sinAngle, 0.0, width * 2.0);";
const JOIN = `if (sinAngle < 0.5) {
            leftWC = thisSegmentLeftWC;
        } else {
            expandWidth /= sinAngle;
        }`;
// Cesium's st.s counts the points, which the rounded corners crowd: st.s is the distance along the trail instead,
// carried in 24 bits by the points' colors (see trailColor in track.js)
const CESIUM_ST = "v_st.s = st.s;";
// (floor rather than round, which WebGL 1's GLSL lacks)
const ST_ALONG = "v_st.s = dot(floor(color.rgb * 255.0 + 0.5), vec3(65536.0, 256.0, 1.0)) / 16777215.0;";

const MODIFIERS = [KeyboardEventModifier.SHIFT, KeyboardEventModifier.CTRL, KeyboardEventModifier.ALT];
// none, each, and every combination of them
const MODIFIER_COMBINATIONS = Array.from({length: 2 ** MODIFIERS.length}, (_, bits) => {
  const held = MODIFIERS.filter((_, i) => bits & (1 << i));
  return held.length === 0 ? undefined : held.length === 1 ? held[0] : held;
});

const markerScratch = new Cartesian3();
const targetScratch = new Cartesian3();
const offsetScratch = new Cartesian3();
const cameraScratch = new Cartesian3();
const plannedScratch = new Cartesian3();
const cartographicScratch = new Cartographic();
const enuScratch = new Matrix4();

/** @type {{source: string, byDistance: boolean} | undefined} */
let cachedTrailShader;

/**
 * Cesium's polyline vertex shader with its joins and its st.s changed for the trail, see JOIN and ST_ALONG; Cesium's
 * own lines where a version of Cesium words them otherwise.
 * @return {{source: string, byDistance: boolean}} the shader, and whether its st.s is the distance (see trailAlong)
 */
function trailShader() {
  if (cachedTrailShader === undefined) {
    let source = new PolylineMaterialAppearance().vertexShaderSource;
    for (const [line, replacement] of [[CESIUM_MITER, JOIN], [CESIUM_ST, ST_ALONG]]) {
      if (!source.includes(line)) {
        console.warn(`cesium-path-flyover: Cesium's polyline shader has changed, the trail keeps its line ${line}`);
      }
      source = source.replace(line, replacement);
    }
    const byDistance = source.includes(ST_ALONG);
    cachedTrailShader = {source: byDistance ? `in vec4 color;\n${source}` : source, byDistance};
  }
  return cachedTrailShader;
}

/**
 * @param {Cartographic[]} cartographics
 * @param {(number | undefined)[]} terrain the terrain's height at each, a missing one taken from its neighbors
 * @param {Ellipsoid} ellipsoid
 * @return {Cartesian3[]} the points MARKER_HEIGHT above the terrain
 */
function raised(cartographics, terrain, ellipsoid) {
  const heights = fillGaps(terrain);
  return cartographics.map((c, i) => Cartesian3.fromRadians(c.longitude, c.latitude, heights[i] + MARKER_HEIGHT, ellipsoid));
}

/**
 * The look of the run: two dials, and overrides of any row they derive (see `Run`
 * and `RUN_TABLE` in run.js; `range` is a baseline, wider in bends above style 0.5).
 * Then the mechanics of the run.
 * @typedef {Object} Mechanics
 * @property {number} [style=0.5] 0 the pilot: low, close, tight, banking into turns; 1 the spectator: high, far, wide in bends, climbing over walls
 * @property {number} [motion=0.5] 0 rigid, locked on the path; 1 floating: slow to react, drifting in heading, height and roll
 * @property {number} [clearance=40] minimum camera height above terrain, meters
 * @property {number} [maxLift=250] meters the camera may climb to keep the marker in view; beyond it a brief occlusion is accepted (its own clearance above the terrain is never capped)
 * @property {number | false} [screenSpaceError=false] globe maximumScreenSpaceError while playing, restored on stop; false leaves it alone
 * @property {boolean} [freeLook=true] while playing, drag to look around the marker and wheel to zoom; the camera keeps following
 * @property {number | false} [recenterDelay=2] seconds after the last input before the view returns to the plan; false leaves it until recenter()
 */

/** @typedef {Mechanics & Partial<Run>} Options */
/** @typedef {import("./path.js").Path} Path The camera path (path.js). */

export default class CesiumPathFlyover {
  #run;
  /**
   * Free look while playing: the look, its input handler, and the camera
   * controller's inputs to restore.
   * @type {{look: FreeLook, handler: ScreenSpaceEventHandler, enableInputs: boolean} | undefined}
   */
  #looking = undefined;
  /** @type {CatmullRomSpline | undefined} the marker's path, through the trail's points */
  #spline = undefined;
  /** @type {Cartesian3[] | undefined} the track's points kept, at the marker's height */
  #points = undefined;
  #totalLength = 0;
  /** @type {string | undefined} */
  #name = undefined;
  /** @type {number[] | undefined} the recorded time of each track point, seconds since the epoch */
  #times = undefined;
  /** @type {Path | undefined} */
  #path = undefined;
  /** @type {object | undefined} the load under way */
  #load = undefined;
  #t = 0;
  // the wall clock at progress 0 of the current playback
  #startTime = 0;
  /** @type {{promise: Promise<void>, resolve: (value: void) => void} | undefined} */
  #play = undefined;
  /** @type {number | undefined} */
  #savedScreenSpaceError = undefined;
  /** @type {PrimitiveCollection | undefined} */
  #track = undefined;
  /**
   * The trail's layers' materials, their progress uniform following the marker, and the st.s of each of the
   * trail's points, which are the spline's.
   * @type {{materials: Material[], along: Float64Array} | undefined}
   */
  #trail = undefined;
  // released once, on destroy()
  #terrainDepth = false;
  #markers = new PointPrimitiveCollection();
  #marker;

  /**
   * @param {CesiumWidget} viewer
   * @param {Options} [options]
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.#run = deriveRun(options);
    this.pitch = CesiumMath.toRadians(this.#run.pitch);
    this.clearance = options.clearance ?? 40;
    this.maxLift = options.maxLift ?? 250;
    this.screenSpaceError = options.screenSpaceError ?? false;
    this.freeLook = options.freeLook ?? true;
    this.recenterDelay = options.recenterDelay ?? 2;
    /** @type {Event<(progress: number) => void>} raised with the progress, 0 to 1, whenever the camera is placed */
    this.progressChanged = new Event();
    // else Cesium clears the globe's depth before the primitives, and the trail shows through the relief
    acquireTerrainDepth(viewer.scene);
    this.#terrainDepth = true;

    this.#marker = this.#markers.add({
      pixelSize: MARKER_SIZE,
      color: ACCENT,
      outlineColor: Color.WHITE,
      outlineWidth: 2.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      show: false,
    });
    viewer.scene.primitives.add(this.#markers);
  }

  /**
   * Seconds for the whole run at the run's speed, the ease ramps included; 0 before a track is loaded.
   * @type {number}
   */
  get duration() {
    return this.#totalLength > 0 ? runDuration(this.#totalLength, this.#run) : 0;
  }

  /**
   * @param {string} url GPX or GeoJSON
   */
  async load(url) {
    this.stop();
    // a load started later wins, whichever answers first
    const load = (this.#load = {});
    const scene = this.viewer.scene;
    const text = await fetchTrackText(url);
    if (load !== this.#load) {
      return;
    }
    const coords = decimate(parseTrack(text), MIN_POINT_DISTANCE, scene.ellipsoid);
    if (coords.length < 2) {
      throw new Error(`A track needs at least two points more than ${MIN_POINT_DISTANCE} m apart`);
    }

    // one sampler per load: tiles fetched for the track serve the targets and, on
    // a track up to LONG_TRACK, the planner too
    const sampler = new TerrainSampler(scene.terrainProvider, SAMPLE_LEVEL);
    const cartographics = coords.map(([lon, lat]) => Cartographic.fromDegrees(lon, lat));
    // the trail through the track's points on the ellipsoid, each of its points then raised to the terrain's height,
    // so that it follows the ground between points far apart
    const surface = cartographics.map((c) => Cartesian3.fromRadians(c.longitude, c.latitude, 0, scene.ellipsoid));
    const trail = trailPath(surface, CORNER_TRIM, CORNER_TURN, TRAIL_STEP, TRAIL_MAX_POINTS);
    const ground = scene.ellipsoid.cartesianArrayToCartographicArray(trail);
    const terrain = await sampler.heightsAt(cartographics.concat(ground));
    if (load !== this.#load) {
      return;
    }
    this.#points = raised(cartographics, terrain.slice(0, cartographics.length), scene.ellipsoid);
    // the marker follows the trail, on the ground between points far apart as the trail is
    const positions = raised(ground, terrain.slice(cartographics.length), scene.ellipsoid);
    const distances = cumulativeDistances(positions);
    this.#totalLength = distances[distances.length - 1];
    // the previous track stays on screen until this one is drawn
    this.#removeTrack();
    this.#track = scene.primitives.add(this.#createTrack(positions, distances));
    scene.requestRender();
    this.#spline = new CatmullRomSpline({
      points: positions,
      times: Array.from(distances, (d) => d / this.#totalLength),
    });
    this.#name = parseTrackName(text);
    this.#times = coords.every((c) => c.length > 2) ? coords.map((c) => /** @type {number} */ (c[2])) : undefined;
    const planSampler = this.#totalLength > LONG_TRACK ? new TerrainSampler(scene.terrainProvider, LONG_TRACK_PLAN_LEVEL) : sampler;
    const path = await computePath(
      {spline: this.#spline, length: this.#totalLength},
      {
        run: this.#run,
        pitch: this.pitch,
        clearance: this.clearance,
        maxLift: this.maxLift,
        ellipsoid: scene.ellipsoid,
        terrainProvider: scene.terrainProvider,
      },
      sampler,
      planSampler
    );
    if (load !== this.#load) {
      return;
    }
    this.#path = path;
    this.#t = 0;
    // a scrub during the load placed the split on the previous track's path
    this.#setTrailProgress(0);
    this.#marker.position = positions[0];
    this.#marker.show = true;
    scene.requestRender();
  }

  /**
   * The trail: a 3D line through its points, and its glow under it.
   * Cesium draws a polyline as quads on screen, joined by miters, which this works around three ways: the track's
   * corners are rounded (a miter cut short leaves a notch at a sharp turn), a turn sharp only on screen ends its
   * segments square (JOIN), and the line and its glow are two polylines (a join's distortion is as wide as its
   * polyline, the line's hard edges show it, the glow's soft ones hardly).
   * @param {Cartesian3[]} positions the trail's points
   * @param {Float64Array} distances each one's distance along the trail
   * @return {PrimitiveCollection}
   */
  #createTrack(positions, distances) {
    const {source: vertexShaderSource, byDistance} = trailShader();
    const along = trailAlong(distances, byDistance);
    const length = distances[distances.length - 1];
    // Cesium's own st.s needs no colors
    const colors = byDistance ? {colors: Array.from(along, trailColor), colorsPerVertex: true} : {};
    const track = new PrimitiveCollection();
    /** @type {Material[]} */
    const materials = [];
    for (const [width, glow] of [[TRAIL_GLOW_WIDTH, 1], [TRAIL_LINE_WIDTH, 0]]) {
      const material = new Material({
        translucent: true,
        fabric: {uniforms: {color: ACCENT, progress: 0, width, trackLength: length, glow}, source: Trail},
      });
      materials.push(material);
      track.add(
        this.createPrimitive_({
          allowPicking: false,
          geometryInstances: new GeometryInstance({
            geometry: new PolylineGeometry({
              positions,
              width,
              ...colors,
              // no subdivision: Cesium would interpolate the colors' bytes apart, garbling the distances they carry
              arcType: ArcType.NONE,
              vertexFormat: PolylineMaterialAppearance.VERTEX_FORMAT,
            }),
          }),
          appearance: new PolylineMaterialAppearance({material, vertexShaderSource}),
        })
      );
    }
    this.#trail = {materials, along};
    return track;
  }

  /**
   * One of the trail's layers: a test without WebGL makes its own.
   * @protected
   * @param {ConstructorParameters<typeof Primitive>[0]} options
   * @return {Primitive}
   */
  createPrimitive_(options) {
    return new Primitive(options);
  }

  /**
   * @param {number} progress the marker's place on the trail, as its st.s
   */
  #setTrailProgress(progress) {
    for (const material of this.#trail?.materials ?? []) {
      material.uniforms.progress = progress;
    }
  }

  /**
   * @return {Promise<void>} resolves when the end of the track is reached
   */
  play() {
    if (this.#play) {
      return this.#play.promise;
    }
    if (!this.#path) {
      throw new Error("Call load() before play()");
    }
    if (this.#t >= 1) {
      this.#t = 0;
    }
    this.#startTime = this.#now() - this.#t * this.duration;
    this.#play = Promise.withResolvers();
    this.viewer.scene.preUpdate.addEventListener(this.#update, this);
    // fewer, coarser tiles keep terrain streaming up with a fast camera
    const globe = this.viewer.scene.globe;
    if (globe && this.screenSpaceError !== false) {
      this.#savedScreenSpaceError = globe.maximumScreenSpaceError;
      globe.maximumScreenSpaceError = this.screenSpaceError;
    }
    if (this.freeLook) {
      this.#installFreeLook();
    }
    return this.#play.promise;
  }

  stop() {
    this.viewer.scene.preUpdate.removeEventListener(this.#update, this);
    if (this.#savedScreenSpaceError !== undefined) {
      this.viewer.scene.globe.maximumScreenSpaceError = this.#savedScreenSpaceError;
      this.#savedScreenSpaceError = undefined;
    }
    this.#removeFreeLook();
    this.#play?.resolve();
    this.#play = undefined;
  }

  /**
   * Position along the run, 0 to 1. Setting it jumps there: while playing, playback
   * goes on from the new position; while stopped, the camera and marker are placed
   * at once.
   * @return {number}
   */
  get progress() {
    return this.#t;
  }

  set progress(value) {
    this.#t = CesiumMath.clamp(value, 0, 1);
    if (this.#play) {
      this.#startTime = this.#now() - this.#t * this.duration;
    } else if (this.#path) {
      this.#placeFrame();
    }
  }

  /**
   * Position of the marker, undefined before a track is loaded.
   * @return {Cartesian3 | undefined}
   */
  get position() {
    return this.#marker.show ? this.#marker.position : undefined;
  }

  /**
   * The track's points kept, at the marker's height above the terrain; undefined before a
   * track is loaded. The marker follows the trail's line through them, which rounds their
   * corners. Not to be modified.
   * @return {Cartesian3[] | undefined}
   */
  get points() {
    return this.#points;
  }

  /**
   * Name of the track, undefined before a track is loaded or when the file has none.
   * @return {string | undefined}
   */
  get name() {
    return this.#name;
  }

  /**
   * Recorded time of each of the points, seconds since the epoch; undefined before a
   * track is loaded or when a point has no time. Not to be modified.
   * @return {number[] | undefined}
   */
  get times() {
    return this.#times;
  }

  /**
   * Distance of the marker along the track in meters, undefined before a track is loaded.
   * Setting it moves the run there, as setting the progress does.
   * @return {number | undefined}
   */
  get distance() {
    return this.#spline ? easedProgress(this.#t, EASE_SECONDS / this.duration) * this.#totalLength : undefined;
  }

  /**
   * @param {number} value
   */
  set distance(value) {
    if (this.#spline) {
      this.progress = easedProgressInverse(value / this.#totalLength, EASE_SECONDS / this.duration);
    }
  }

  /**
   * Starts the return of the view to the planned camera.
   */
  recenter() {
    this.#looking?.look.recenter(this.#now());
  }

  /**
   * @return {{heading: number, pitch: number, zoom: number}} the viewer's offsets: radians, radians, range factor
   */
  get view() {
    const view = this.#looking?.look.view;
    return view ? {heading: view.headingDelta, pitch: view.pitchDelta, zoom: view.zoom} : {heading: 0, pitch: 0, zoom: 1};
  }

  /** @return {number} seconds */
  #now() {
    return performance.now() / 1000;
  }

  #installFreeLook() {
    const scene = this.viewer.scene;
    const look = new FreeLook({pitch: this.pitch, recenterDelay: this.recenterDelay});
    const handler = new ScreenSpaceEventHandler(scene.canvas);
    this.#looking = {look, handler, enableInputs: scene.screenSpaceCameraController.enableInputs};
    scene.screenSpaceCameraController.enableInputs = false;
    // no render requests here: the frame loop renders every frame while playing. The
    // handler sends an event to the action registered with the modifier keys held,
    // and to it alone, so the drag listens under every combination: a button
    // released with Shift, or Shift and Ctrl, down must still end it
    const dragStart = () => look.dragStart(this.#now());
    const drag = (/** @type {{startPosition: {x: number, y: number}, endPosition: {x: number, y: number}}} */ movement) =>
      look.drag(movement.endPosition.x - movement.startPosition.x, movement.endPosition.y - movement.startPosition.y, this.#now());
    const dragEnd = () => look.dragEnd(this.#now());
    for (const modifier of MODIFIER_COMBINATIONS) {
      handler.setInputAction(dragStart, ScreenSpaceEventType.LEFT_DOWN, modifier);
      handler.setInputAction(drag, ScreenSpaceEventType.MOUSE_MOVE, modifier);
      handler.setInputAction(dragEnd, ScreenSpaceEventType.LEFT_UP, modifier);
    }
    handler.setInputAction((/** @type {number} */ delta) => look.wheel(delta, this.#now()), ScreenSpaceEventType.WHEEL);
    // the runtime passes {distance: {startPosition, endPosition}} with the finger
    // distances in y (the typings describe another shape); fingers moving apart zoom in
    handler.setInputAction(
      (/** @type {any} */ movement) => look.zoomBy(movement.distance.startPosition.y / movement.distance.endPosition.y, this.#now()),
      ScreenSpaceEventType.PINCH_MOVE
    );
  }

  #removeFreeLook() {
    if (this.#looking) {
      this.#looking.handler.destroy();
      this.viewer.scene.screenSpaceCameraController.enableInputs = this.#looking.enableInputs;
      this.#looking = undefined;
    }
  }

  destroy() {
    this.stop();
    this.#removeTrack();
    this.viewer.scene.primitives.remove(this.#markers);
    if (this.#terrainDepth) {
      releaseTerrainDepth(this.viewer.scene);
      this.#terrainDepth = false;
    }
  }

  #removeTrack() {
    if (this.#track) {
      this.viewer.scene.primitives.remove(this.#track);
      this.#track = undefined;
    }
    this.#trail = undefined;
  }

  #update() {
    if (this.viewer.scene.mode === SceneMode.MORPHING) {
      return;
    }
    this.#t = Math.min((this.#now() - this.#startTime) / this.duration, 1);
    this.#placeFrame();
    if (this.#t >= 1) {
      this.stop();
    }
  }

  /**
   * How far a camera at `offset` in the `enu` frame sits below the clearance over
   * the terrain the loaded tiles know about; 0 when clear or unknown.
   * @param {Matrix4} enu
   * @param {Cartesian3} offset
   * @return {number} meters
   */
  #shortfall(enu, offset) {
    const scene = this.viewer.scene;
    const cartographic = Cartographic.fromCartesian(Matrix4.multiplyByPoint(enu, offset, cameraScratch), scene.ellipsoid, cartographicScratch);
    const ground = scene.globe?.getHeight(cartographic);
    return ground === undefined ? 0 : Math.max(0, ground + this.clearance - cartographic.height);
  }

  /**
   * Places the marker and the camera for the current progress.
   */
  #placeFrame() {
    const scene = this.viewer.scene;
    const spline = /** @type {CatmullRomSpline} */ (this.#spline);
    const path = /** @type {Path} */ (this.#path);
    const along = easedProgress(this.#t, EASE_SECONDS / this.duration);
    this.#marker.position = spline.evaluate(along, markerScratch);
    if (this.#trail) {
      const i0 = spline.findTimeInterval(along);
      const times = spline.times;
      const st = this.#trail.along;
      this.#setTrailProgress(CesiumMath.lerp(st[i0], st[i0 + 1], (along - times[i0]) / (times[i0 + 1] - times[i0])));
    }

    const index = this.#t * (path.targets.length - 1);
    const i = Math.min(Math.floor(index), path.targets.length - 1);
    const target = Cartesian3.lerp(path.targets[i], path.targets[Math.min(i + 1, path.targets.length - 1)], index - i, targetScratch);
    const heading = sampleProfile(path.headings, this.#t);
    const range = sampleProfile(path.range, this.#t);
    const lift = sampleProfile(path.lift, this.#t);
    const planned = cameraOffsetEnu(heading, range, this.pitch, lift, plannedScratch);
    let offset = planned;
    const look = this.#looking?.look;
    if (look) {
      const view = look.update(this.#now());
      if (look.active) {
        offset = cameraOffsetEnu(heading + view.headingDelta, range * view.zoom, this.pitch + view.pitchDelta, lift, offsetScratch);
        // the plan cleared the planned camera, not one the viewer swung aside: lift
        // this one by what it lacks beyond what the planned one lacks against the
        // loaded tiles, so the lift is zero at zero offsets and never jumps
        const enu = FixedFrameTransforms.eastNorthUpToFixedFrame(target, scene.ellipsoid, enuScratch);
        offset.z += Math.max(0, this.#shortfall(enu, offset) - this.#shortfall(enu, planned));
      }
    }
    scene.camera.lookAt(target, offset);
    scene.camera.lookAtTransform(Matrix4.IDENTITY);
    // lookAt levels the horizon, so the twist is the whole roll
    scene.camera.twistRight(sampleProfile(path.roll, this.#t));
    scene.requestRender();
    this.progressChanged.raiseEvent(this.#t);
  }
}
