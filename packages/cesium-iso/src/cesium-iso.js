import {Cartesian2, Cartesian3, Cartographic, FixedFrameTransforms, IntersectionTests, Math as CesiumMath, Matrix4, Plane} from '@cesium/core';
import {EasingFunction} from '@cesium/engine';

/** @import {CesiumWidget} from '@cesium/engine' */

// in meters, how far the camera stays from its target by default, out of the scene's way: an orthographic view's
// size does not depend on it, its depth's precision does (32-bit floats: half a millimeter at 5 km)
const ORBIT = 5000;
// the keys, as in the Sims: Q and E turn, WASD or the arrows slide across the ground while held, [x, y] on the screen
/** @type {Record<string, [number, number]>} */
const PAN = {w: [0, 1], arrowup: [0, 1], s: [0, -1], arrowdown: [0, -1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0]};
// how fast the keys slide the view, a share of the screen's width a second; how long a turn and a glide take, in ms;
// how far two fingers turn before the view turns with them, so that a pinch does not turn it
const PAN_SPEED = 0.4;
const TURN_TIME = 450;
const GLIDE_TIME = 400;
const TWIST = CesiumMath.toRadians(15);
// after a drag, the view drifts on, slowing down by this share of its speed a frame (as three.js's OrbitControls' damping
// of 0.05), if let go within LET_GO ms of the last move
const DAMPING = 0.95;
const LET_GO = 60;

const easeInOut = EasingFunction.QUADRATIC_IN_OUT;
const positionScratch = new Cartesian2();
const planeScratch = new Plane(Cartesian3.UNIT_Z, 0);
const normalScratch = new Cartesian3();
const deltaScratch = new Cartesian3();
const frameScratch = new Matrix4();
const directionScratch = new Cartesian3();
const upScratch = new Cartesian3();
const orbitScratch = new Cartesian3();

/**
 * An isometric view, as in a game: an orthographic camera at a fixed pitch, looking from a corner. A drag turns the
 * view, a right drag (or Ctrl or Shift with the left) and one finger slide it across the ground, the wheel and a pinch
 * zoom where they point, two fingers twist it; Q and E turn it a quarter, WASD and the arrows slide it, a double click
 * glides to the spot.
 */
export default class CesiumIso {
  #pitch;
  #corner;
  #size;
  #minSize;
  #maxSize;
  #limit;
  #orbit;
  #active = false;
  // the camera controller's inputs before activation, given back as they were
  #inputsBefore = true;
  #target = new Cartesian3();
  #heading = 0;
  /** @type {Map<number, Cartesian2>} */
  #pointers = new Map();
  /** @type {{grab?: Cartesian3 | undefined, turn?: boolean, last?: {x: number, y: number}, distance?: number, angle?: number, twist?: number} | undefined} */
  #drag = undefined;
  /** @type {Set<string>} */
  #held = new Set();
  /** @type {{from: number, to: number, start: number} | undefined} */
  #turning = undefined;
  /** @type {{from: Cartesian3, to: Cartesian3, start: number} | undefined} */
  #gliding = undefined;
  /** @type {number | undefined} */
  #frame = undefined;
  /** @type {number | undefined} */
  #slid = undefined;
  /** @type {(() => void) | undefined} */
  #settling = undefined;
  // the view's last move during a drag, and how fast it moved then: turning in radians, sliding in meters, a ms
  /** @type {{time: number, heading: number, target: Cartesian3, turn: number, slide: Cartesian3} | undefined} */
  #moved = undefined;
  /** @type {{turn: number, slide: Cartesian3} | undefined} */
  #drift = undefined;
  /** @type {number | undefined} */
  #drifted = undefined;
  // the camera's frustum before, given back on deactivation
  /** @type {any} */
  #frustum = undefined;
  /** @type {[EventTarget, string, (e: any) => void][]} */
  #listeners;

  /**
   * @param {CesiumWidget} viewer
   * @param {{pitch?: number, heading?: number, size?: number, minSize?: number, maxSize?: number,
   *   limit?: (target: Cartesian3) => Cartesian3, orbit?: number}} [options] The pitch, in degrees down from the horizon; a
   *   corner's heading, in degrees, the others a quarter turn apart; the size, in meters across the screen's shorter side,
   *   and its bounds; a limit, a target moved back where the view may stand: it stops sliding there; the orbit, in meters
   *   from the target to the camera, beyond the scene: closer, faces a fraction of a millimeter apart do not fight.
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.#pitch = CesiumMath.toRadians(options.pitch ?? 30);
    this.#corner = CesiumMath.toRadians(options.heading ?? 45);
    this.#size = options.size ?? 400;
    this.#minSize = options.minSize ?? 20;
    this.#maxSize = options.maxSize ?? 8000;
    this.#limit = options.limit;
    this.#orbit = options.orbit ?? ORBIT;
    this.#listeners = [
      [viewer.scene.canvas, 'pointerdown', e => this.#down(e)],
      [viewer.scene.canvas, 'pointermove', e => this.#move(e)],
      [viewer.scene.canvas, 'pointerup', e => this.#up(e)],
      [viewer.scene.canvas, 'pointercancel', e => this.#up(e)],
      [viewer.scene.canvas, 'wheel', e => this.#wheel(e)],
      [viewer.scene.canvas, 'dblclick', e => this.glideTo(this.#pick(this.#at(e)))],
      [viewer.scene.canvas, 'contextmenu', e => e.preventDefault()],
      [window, 'keydown', e => this.#keydown(e)],
      [window, 'keyup', e => this.#held.delete(e.key.toLowerCase())],
      [window, 'blur', () => this.#held.clear()],
      [window, 'resize', () => this.place_()],
    ];
  }

  get active() {
    return this.#active;
  }

  set active(active) {
    if (active === this.#active) {
      return;
    }
    this.#active = active;
    const {scene} = this.viewer;
    const controller = scene.screenSpaceCameraController;
    for (const [target, type, listener] of this.#listeners) {
      if (active) {
        target.addEventListener(type, listener, type === 'wheel' ? {passive: false} : undefined);
      } else {
        target.removeEventListener(type, listener);
      }
    }
    if (active) {
      this.#inputsBefore = controller.enableInputs;
      controller.enableInputs = false;
      // about the ground in the middle of the screen, from the nearest corner; before the scene has loaded, the
      // ellipsoid there, raised to the terrain once its tiles are in, if the globe is shown
      const {canvas, camera, globe} = scene;
      const middle = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
      const picked = this.#pick(middle);
      this.#target = picked ?? camera.pickEllipsoid(middle, scene.ellipsoid) ?? Cartesian3.clone(camera.positionWC);
      this.#heading = this.#cornerAfter(camera.heading, 0);
      this.#frustum = camera.frustum.clone();
      // off any transform the camera was fixed to (once: Cesium reads the depth back here)
      camera.lookAtTransform(Matrix4.IDENTITY);
      camera.switchToOrthographicFrustum();
      this.place_();
      if (!picked && globe?.show) {
        this.#settling = globe.tileLoadProgressEvent.addEventListener(queued => {
          const spot = Cartographic.fromCartesian(this.#target, scene.ellipsoid);
          const height = queued ? undefined : globe.getHeight(spot);
          if (height !== undefined) {
            this.#settle();
            this.#target = Cartesian3.fromRadians(spot.longitude, spot.latitude, height, scene.ellipsoid);
            this.place_();
          }
        });
      }
    } else {
      controller.enableInputs = this.#inputsBefore;
      this.#settle();
      cancelAnimationFrame(this.#frame ?? 0);
      this.#frame = this.#turning = this.#gliding = this.#drag = this.#moved = this.#drift = this.#drifted = undefined;
      this.#pointers.clear();
      this.#held.clear();
      const {canvas} = scene;
      if (this.#frustum.aspectRatio !== undefined) {
        this.#frustum.aspectRatio = canvas.clientWidth / canvas.clientHeight;
      }
      scene.camera.frustum = this.#frustum;
      scene.requestRender();
    }
  }

  /**
   * What the view turns about, in the middle of the screen, a copy; set once active, the view moves there at once.
   */
  get target() {
    return Cartesian3.clone(this.#target);
  }

  set target(position) {
    this.#settle();
    this.#target = Cartesian3.clone(position);
    if (this.#active) {
      this.place_();
    }
  }

  /**
   * No more waiting for the terrain under the first target.
   */
  #settle() {
    this.#settling?.();
    this.#settling = undefined;
  }

  /**
   * The view's heading, in degrees, clockwise from the north, where the camera looks.
   */
  get heading() {
    return CesiumMath.toDegrees(this.#heading);
  }

  /**
   * The heading set, in degrees: the view turned there at once, with no easing (turnTo eases); an animation under way,
   * a drift or a turn, is dropped. While active.
   * @param {number} heading
   */
  set heading(heading) {
    this.#turning = this.#drift = this.#drifted = undefined;
    this.#heading = CesiumMath.toRadians(heading);
    this.place_();
  }

  /**
   * The view's size, in meters across the screen's shorter side; set, within its bounds, the view zooms at once about
   * its target (zoom zooms about a point of the screen).
   */
  get size() {
    return this.#size;
  }

  set size(size) {
    this.#size = CesiumMath.clamp(size, this.#minSize, this.#maxSize);
    this.place_();
  }

  /**
   * A turn, eased, to a heading, in degrees, the shorter way round: the view toward a side a place is seen from.
   * @param {number} heading
   */
  turnTo(heading) {
    this.#drift = this.#drifted = undefined;
    this.#anchor();
    const to = CesiumMath.toRadians(heading);
    const delta = CesiumMath.negativePiToPi(to - this.#heading);
    this.#turning = {from: this.#heading, to: this.#heading + delta, start: performance.now()};
    this.#animate();
  }

  /**
   * A quarter turn, eased, to the next corner: the camera clockwise about the middle, seen from above (-1, as Q), or
   * the other way (1, as E); 0 to the nearest.
   * @param {number} sign
   */
  turn(sign) {
    this.#drift = this.#drifted = undefined;
    this.#anchor();
    this.#turning = {from: this.#heading, to: this.#cornerAfter(this.#heading, -sign), start: performance.now()};
    this.#animate();
  }

  /**
   * Zooms in (a factor below 1) or out, toward a point on the screen, by default its middle.
   * @param {number} factor
   * @param {Cartesian2} [at]
   */
  zoom(factor, at) {
    const {canvas} = this.viewer.scene;
    const point = at ?? new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const before = this.#ground(point, this.#target);
    this.#size = CesiumMath.clamp(this.#size * factor, this.#minSize, this.#maxSize);
    this.place_();
    if (before) {
      this.#keep(before, point);
    }
  }

  /**
   * Glides the view's middle to a position, eased.
   * @param {Cartesian3 | undefined} position
   */
  glideTo(position) {
    if (!position) {
      return;
    }
    this.#drift = this.#drifted = undefined;
    this.#gliding = {from: Cartesian3.clone(this.#target), to: Cartesian3.clone(position), start: performance.now()};
    this.#animate();
  }

  /**
   * The view stopped where it is: a drift after a drag, a turn or a glide under way, dropped, and
   * the view turning about the ground in the middle again, as when one ends.
   */
  stop() {
    const moving = this.#drift || this.#turning || this.#gliding;
    this.#drift = this.#drifted = this.#turning = this.#gliding = undefined;
    if (moving) {
      this.#anchor();
    }
  }

  /**
   * How many pointers are down on the view: two or more, a pinch.
   */
  get pointers() {
    return this.#pointers.size;
  }

  /**
   * The camera on its orbit about the target, the frustum as wide as the size on the shorter side. Set straight: in
   * the target's east-north-up frame, looking along the heading, down by the pitch; Cesium's lookAt and setView would
   * read the depth under the middle back from the GPU to size an orthographic frustum, a stall at each move.
   * @protected
   */
  place_() {
    if (!this.#active) {
      return;
    }
    if (this.#limit) {
      this.#target = Cartesian3.clone(this.#limit(this.#target), this.#target);
    }
    const {camera, ellipsoid} = this.viewer.scene;
    const [sh, ch, sp, cp] = [Math.sin(this.#heading), Math.cos(this.#heading), Math.sin(this.#pitch), Math.cos(this.#pitch)];
    const frame = FixedFrameTransforms.eastNorthUpToFixedFrame(this.#target, ellipsoid, frameScratch);
    const direction = Matrix4.multiplyByPointAsVector(frame, Cartesian3.fromElements(sh * cp, ch * cp, -sp, directionScratch), directionScratch);
    const up = Matrix4.multiplyByPointAsVector(frame, Cartesian3.fromElements(sh * sp, ch * sp, cp, upScratch), upScratch);
    Matrix4.multiplyByPoint(frame, Cartesian3.fromElements(-sh * cp * this.#orbit, -ch * cp * this.#orbit, sp * this.#orbit, orbitScratch), camera.position);
    Cartesian3.clone(direction, camera.direction);
    Cartesian3.clone(up, camera.up);
    Cartesian3.cross(direction, up, camera.right);
    // the orthographic frustum's width
    // the orthographic frustum's width; a subclass placing the camera on a perspective frustum has none to set
    if ('width' in camera.frustum) {
      camera.frustum.width = this.width_();
    }
    this.viewer.scene.requestRender();
  }

  /**
   * The view's width, in meters: the size on the screen's shorter side.
   * @protected
   */
  width_() {
    const {canvas} = this.viewer.scene;
    return this.#size * Math.max(1, canvas.clientWidth / canvas.clientHeight);
  }

  /**
   * The heading of the corner after the nearest, by a sign.
   * @param {number} heading
   * @param {number} sign
   */
  #cornerAfter(heading, sign) {
    const quarter = CesiumMath.PI_OVER_TWO;
    return this.#corner + (Math.round((heading - this.#corner) / quarter) + sign) * quarter;
  }

  /**
   * A point of the canvas, from a pointer event.
   * @param {MouseEvent} e
   */
  #at(e) {
    const rect = this.viewer.scene.canvas.getBoundingClientRect();
    return new Cartesian2(e.clientX - rect.left, e.clientY - rect.top);
  }

  /**
   * What is seen at a point of the canvas: the scene, else the globe, if shown.
   * @param {Cartesian2} point
   * @returns {Cartesian3 | undefined}
   */
  #pick(point) {
    const {scene} = this.viewer;
    const position = scene.pickPositionSupported ? scene.pickPosition(point) : undefined;
    const ray = position || !scene.globe?.show ? undefined : scene.camera.getPickRay(point);
    return position ?? (ray && scene.globe.pick(ray, scene));
  }

  /**
   * Where a point of the canvas meets the ground's plane through a position.
   * @param {Cartesian2} point
   * @param {Cartesian3} through
   * @returns {Cartesian3 | undefined}
   */
  #ground(point, through) {
    const {scene} = this.viewer;
    const normal = scene.ellipsoid.geodeticSurfaceNormal(through, normalScratch);
    const plane = Plane.fromPointNormal(through, normal, planeScratch);
    const ray = scene.camera.getPickRay(Cartesian2.clone(point, positionScratch));
    return ray && IntersectionTests.rayPlane(ray, plane, new Cartesian3());
  }

  /**
   * Slides the view so that a position of the ground is under a point of the canvas.
   * @param {Cartesian3} position
   * @param {Cartesian2} point
   */
  #keep(position, point) {
    const now = this.#ground(point, position);
    if (now) {
      Cartesian3.add(this.#target, Cartesian3.subtract(position, now, deltaScratch), this.#target);
      this.place_();
    }
  }

  /**
   * The target moved onto what is seen in the middle of the screen: the view does not change, being orthographic, but
   * it turns about the ground there.
   */
  #anchor() {
    const {canvas} = this.viewer.scene;
    const ground = this.#pick(new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2));
    if (ground) {
      this.#target = ground;
      this.place_();
    }
  }

  /**
   * @param {PointerEvent} e
   */
  #down(e) {
    const canvas = this.viewer.scene.canvas;
    canvas.setPointerCapture(e.pointerId);
    this.#settle();
    this.#pointers.set(e.pointerId, this.#at(e));
    this.#gliding = this.#drift = this.#drifted = undefined;
    this.#snapshot(e.timeStamp);
    this.#drag = this.#start(e);
  }

  /**
   * What the pointers down do: one finger, the right button, or the left with Ctrl or Shift slide the view; the left
   * turns it; two fingers pinch, slide and twist it.
   * @param {PointerEvent} e
   */
  #start(e) {
    const points = [...this.#pointers.values()];
    if (points.length === 2) {
      const [a, b] = points;
      const middle = Cartesian2.lerp(a, b, 0.5, new Cartesian2());
      return {grab: this.#ground(middle, this.#target), distance: Cartesian2.distance(a, b), angle: Math.atan2(b.y - a.y, b.x - a.x), twist: 0};
    }
    const slide = e.pointerType === 'touch' || e.button === 2 || e.ctrlKey || e.shiftKey;
    const point = /** @type {{x: number, y: number}} */ (points[0]);
    return slide ? {grab: this.#ground(new Cartesian2(point.x, point.y), this.#target)} : {turn: true, last: point};
  }

  /**
   * @param {PointerEvent} e
   */
  #move(e) {
    if (!this.#pointers.has(e.pointerId) || !this.#drag) {
      return;
    }
    this.#pointers.set(e.pointerId, this.#at(e));
    const drag = this.#drag;
    const points = [...this.#pointers.values()];
    if (points.length === 2 && drag.distance !== undefined) {
      const [a, b] = /** @type {[Cartesian2, Cartesian2]} */ (points);
      const middle = Cartesian2.lerp(a, b, 0.5, new Cartesian2());
      const [distance, angle] = [Cartesian2.distance(a, b), Math.atan2(b.y - a.y, b.x - a.x)];
      this.#size = CesiumMath.clamp(this.#size * drag.distance / distance, this.#minSize, this.#maxSize);
      this.place_();
      if (drag.grab) {
        this.#keep(drag.grab, middle);
      }
      const turned = CesiumMath.negativePiToPi(angle - /** @type {number} */ (drag.angle));
      drag.twist = /** @type {number} */ (drag.twist) + turned;
      if (Math.abs(drag.twist) >= TWIST) {
        // the screen's y down: the fingers turning clockwise on it turn the ground clockwise under them
        this.#heading -= turned;
        this.place_();
      }
      Object.assign(drag, {distance, angle});
      // no drift after a pinch
      this.#snapshot(e.timeStamp);
      return;
    } else if (drag.turn && drag.last) {
      const point = /** @type {{x: number, y: number}} */ (points[0]);
      this.#heading -= CesiumMath.TWO_PI * (point.x - drag.last.x) / this.viewer.scene.canvas.clientHeight;
      drag.last = point;
      this.place_();
    } else if (drag.grab) {
      const point = /** @type {{x: number, y: number}} */ (points[0]);
      this.#keep(drag.grab, new Cartesian2(point.x, point.y));
    }
    this.#track(e.timeStamp);
  }

  /**
   * Where the view is, to measure its next move from.
   * @param {number} time
   */
  #snapshot(time) {
    this.#moved = {time, heading: this.#heading, target: Cartesian3.clone(this.#target), turn: 0, slide: new Cartesian3()};
  }

  /**
   * How fast the view moves under the drag, smoothed over the last moves.
   * @param {number} time
   */
  #track(time) {
    const moved = this.#moved;
    const dt = moved ? time - moved.time : 0;
    if (!moved || dt <= 0) {
      return;
    }
    const slide = Cartesian3.divideByScalar(Cartesian3.subtract(this.#target, moved.target, deltaScratch), dt, deltaScratch);
    moved.turn = (moved.turn + (this.#heading - moved.heading) / dt) / 2;
    Cartesian3.divideByScalar(Cartesian3.add(moved.slide, slide, moved.slide), 2, moved.slide);
    Object.assign(moved, {time, heading: this.#heading, target: Cartesian3.clone(this.#target, moved.target)});
  }

  /**
   * @param {PointerEvent} e
   */
  #up(e) {
    // a pointer pressed elsewhere (on a control over the canvas) and let go here was never the view's
    if (!this.#pointers.has(e.pointerId)) {
      return;
    }
    this.#pointers.delete(e.pointerId);
    // a finger lifted: the other slides on, from here
    this.#drag = this.#pointers.size ? this.#start(e) : undefined;
    if (this.#drag) {
      this.#snapshot(e.timeStamp);
      return;
    }
    // let go while moving: the view drifts on, slowing down; else it turns about the ground in the middle
    const moved = this.#moved;
    this.#moved = undefined;
    if (moved && e.timeStamp - moved.time < LET_GO && (moved.turn || Cartesian3.magnitude(moved.slide))) {
      this.#drift = {turn: moved.turn, slide: moved.slide};
      this.#animate();
    } else {
      this.#anchor();
    }
  }

  /**
   * @param {WheelEvent} e
   */
  #wheel(e) {
    e.preventDefault();
    this.zoom(Math.pow(1.0015, e.deltaY * (e.deltaMode === 1 ? 33 : 1)), this.#at(e));
  }

  /**
   * @param {KeyboardEvent} e
   */
  #keydown(e) {
    const target = /** @type {Element | null} */ (e.target);
    if (target?.closest?.('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'q' || key === 'e') {
      this.turn(key === 'q' ? -1 : 1);
    } else if (key in PAN) {
      this.#held.add(key);
      e.preventDefault();
      this.#animate();
    }
  }

  /**
   * The keys held, the drift, the turn and the glide, a frame at a time, until they are done.
   */
  #animate() {
    if (this.#frame !== undefined) {
      return;
    }
    const step = (/** @type {number} */ now) => {
      this.#frame = undefined;
      if (!this.#active) {
        return;
      }
      if (this.#held.size) {
        const [x, y] = this.#held.values().reduce(([x, y], key) => [x + (PAN[key]?.[0] ?? 0), y + (PAN[key]?.[1] ?? 0)], [0, 0]);
        const width = this.width_();
        const meters = PAN_SPEED * width * Math.min(0.05, (now - (this.#slid ?? now)) / 1000);
        const {canvas} = this.viewer.scene;
        const middle = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
        const length = Math.hypot(x, y);
        if (length) {
          // the ground in the middle kept under a point of the screen as far from it as the keys slide, the other way;
          // up the screen, the ground foreshortened by the pitch
          const pixels = meters / width * canvas.clientWidth;
          this.#keep(this.#target, new Cartesian2(middle.x - x / length * pixels, middle.y + y / length * pixels * Math.sin(this.#pitch)));
        }
      }
      this.#slid = this.#held.size ? now : undefined;
      if (this.#drift) {
        const dt = Math.min(50, now - (this.#drifted ?? now));
        this.#heading += this.#drift.turn * dt;
        Cartesian3.add(this.#target, Cartesian3.multiplyByScalar(this.#drift.slide, dt, deltaScratch), this.#target);
        this.place_();
        const keep = DAMPING ** (dt * 60 / 1000);
        this.#drift.turn *= keep;
        Cartesian3.multiplyByScalar(this.#drift.slide, keep, this.#drift.slide);
        this.#drifted = now;
        // stopped: under a pixel a second
        if (Math.abs(this.#drift.turn) < 1e-5 && Cartesian3.magnitude(this.#drift.slide) < this.width_() * 1e-6) {
          this.#drift = this.#drifted = undefined;
          this.#anchor();
        }
      }
      if (this.#gliding) {
        const t = Math.min(1, (now - this.#gliding.start) / GLIDE_TIME);
        Cartesian3.lerp(this.#gliding.from, this.#gliding.to, easeInOut(t), this.#target);
        this.place_();
        if (t === 1) {
          this.#gliding = undefined;
        }
      }
      if (this.#turning) {
        const t = Math.min(1, (now - this.#turning.start) / TURN_TIME);
        this.#heading = CesiumMath.lerp(this.#turning.from, this.#turning.to, easeInOut(t));
        this.place_();
        if (t === 1) {
          this.#turning = undefined;
        }
      }
      if (this.#held.size || this.#drift || this.#gliding || this.#turning) {
        this.#frame = requestAnimationFrame(step);
      }
    };
    this.#frame = requestAnimationFrame(step);
  }
}
