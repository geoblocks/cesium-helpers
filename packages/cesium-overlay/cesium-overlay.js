// An HTML layer over a CesiumJS scene, one a widget, shared by whoever draws over it, and pins: elements kept on a point of the
// world as the camera moves. The layer is in the canvas's parent, over the canvas's box and clipped to it, its pixels the canvas's;
// it takes no pointer, its content may (pointer-events: auto). It lives as long as the widget, which takes it away with its own
// element. The pins are under what else is drawn in the layer (a tool's line, its label), the nearest of them on top.
//
// A pin is an anchor moved to its point's place on every render, the size of the layer, laid out as a flex row from its corner:
// the element in it keeps its own width, in flow or positioned (its containing block the layer's size, not nothing), and its
// own transform, to stand above the point or to pop up. Hidden while its point is behind the camera or the globe's horizon, or,
// asked, behind what the scene shows in front of it.

import {Cartesian3, EllipsoidalOccluder} from '@cesium/core';
import {SceneTransforms} from '@cesium/engine';

/**
 * Where a pin stands: a point, a function read on every render (a thing that moves), or none (hidden).
 * @typedef {Cartesian3 | (() => Cartesian3 | undefined) | undefined} Position
 */
/**
 * @typedef {object} PinOptions
 * @property {[number, number]} [offset] In pixels, right and down, from the point's place.
 * @property {boolean | 'depth'} [occlude] Hidden behind the globe's horizon (true, by default), also behind what the scene shows
 *     in front of the point ('depth': a read of the depth buffer a render, a perspective view's), or never (false).
 * @property {boolean} [live] A position read as it changes, the scene rendered on every frame while the pin is: for a point that
 *     moves by itself in a scene that renders on request (requestRenderMode).
 */
/**
 * @typedef {object} Pin
 * @property {HTMLElement} element The element pinned.
 * @property {HTMLDivElement} anchor What holds it, moved to the point's place.
 * @property {(position: Position) => void} move
 * @property {boolean} hidden Hidden whatever its position, which it keeps: for a pin shown now and then on the same point.
 * @property {() => void} remove The pin taken away, its element put back where it was, if it was somewhere.
 */
/**
 * @typedef {object} Overlay
 * @property {HTMLDivElement} element The layer over the canvas: what is appended to it is drawn over the pins.
 * @property {(element: HTMLElement, position?: Position, options?: PinOptions) => Pin} pin
 */

// in the layer, scoped to it, and in a cascade layer: a page's rule wins whatever its specificity
const STYLE = `
@layer cesium-overlay {
  @scope {
    :scope {
      position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 5;
      /* the tools' palette, theirs to read (--overlay-*), a page's to set (--cesium-overlay-*) */
      --overlay-core: var(--cesium-overlay-core, #fffaf3);
      --overlay-edge: var(--cesium-overlay-edge, #2b1d10);
      --overlay-glow: var(--cesium-overlay-glow, #ff9a3c);
      --overlay-label-background: var(--cesium-overlay-label-background, color-mix(in srgb, var(--overlay-core) 93%, transparent));
      --overlay-label-color: var(--cesium-overlay-label-color, var(--overlay-edge));
      --overlay-hint-background: var(--cesium-overlay-hint-background, #333e);
      --overlay-hint-color: var(--cesium-overlay-hint-color, #fff);
      --overlay-font: var(--cesium-overlay-font, 12px/1.3 system-ui, sans-serif);
    }
    .cesium-overlay-pins { position: absolute; inset: 0; isolation: isolate; }
    .cesium-overlay-pin { position: absolute; inset: 0; display: flex; align-items: flex-start; }
    /* important: a layer's normal rule loses to any of a page's, its display among them */
    [hidden] { display: none !important; }
    /* the palette's two pills, for a page's pins: a value (a length, a depth) and a hint (what to do) */
    .cesium-overlay-label, .cesium-overlay-hint { padding: 3px 8px; border-radius: 8px; white-space: nowrap; font: var(--overlay-font); }
    .cesium-overlay-label { background: var(--overlay-label-background); color: var(--overlay-label-color); box-shadow: 0 1px 6px #0003; }
    .cesium-overlay-hint { background: var(--overlay-hint-background); color: var(--overlay-hint-color); }
  }
}
`;
// in meters: how much nearer than a pin's point what the scene shows there may be, still taken for the pinned thing itself
const DEPTH_TOLERANCE = 0.5;

// the scene's overlay kept on the scene, by a key every copy of this module shares: two copies bundled find the same layer
const KEY = Symbol.for('@geoblocks/cesium-overlay');

/**
 * The scene's overlay: made by the first to ask, the same for the others.
 * @param {import('@cesium/engine').Scene | {scene: import('@cesium/engine').Scene}} target A scene, or a Viewer or CesiumWidget.
 * @return {Overlay}
 */
export function overlayOf(target) {
  const scene = 'scene' in target ? target.scene : target;
  // the scene seen as a holder of the key: Cesium's types know nothing of it
  const holder = /** @type {{[KEY]?: Overlay}} */ (/** @type {unknown} */ (scene));
  const known = holder[KEY];
  if (known) {
    return known;
  }
  const {canvas, camera} = scene;
  const doc = canvas.ownerDocument;
  // the layer is placed in its parent's box: a parent left static (Cesium's stylesheet not loaded) made relative
  const parent = canvas.parentElement ?? doc.body;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }
  const element = doc.createElement('div');
  element.className = 'cesium-overlay';
  const style = doc.createElement('style');
  style.textContent = STYLE;
  const layer = doc.createElement('div');
  layer.className = 'cesium-overlay-pins';
  element.append(layer, style);
  parent.append(element);
  /** @type {Set<{anchor: HTMLDivElement, at: () => Cartesian3 | undefined, hidden: boolean, offset: [number, number], occlude: boolean | 'depth', live: boolean, shown: string}>} */
  const pins = new Set();
  const occluder = new EllipsoidalOccluder(scene.ellipsoid);
  const picked = new Cartesian3();
  const place = () => {
    occluder.cameraPosition = camera.positionWC;
    /** @type {[HTMLDivElement, number][]} */
    const near = [];
    let live = false;
    for (const pin of pins) {
      live ||= pin.live && !pin.hidden;
      const point = pin.hidden ? undefined : pin.at();
      let shown = point && (pin.occlude === false || occluder.isPointVisible(point)) ? SceneTransforms.worldToWindowCoordinates(scene, point) : undefined;
      if (shown && point && pin.occlude === 'depth' && scene.pickPositionSupported) {
        const front = scene.pickPosition(shown, picked);
        if (front && Cartesian3.distance(camera.positionWC, front) < Cartesian3.distance(camera.positionWC, point) - DEPTH_TOLERANCE) {
          shown = undefined;
        }
      }
      const translate = shown ? `${shown.x + pin.offset[0]}px ${shown.y + pin.offset[1]}px` : '';
      if (translate !== pin.shown) {
        pin.shown = translate;
        pin.anchor.hidden = !shown;
        if (shown) {
          pin.anchor.style.translate = translate;
        }
      }
      if (shown && point && pins.size > 1) {
        near.push([pin.anchor, Cartesian3.distanceSquared(camera.positionWC, point)]);
      }
    }
    // the nearest on top
    near.sort(([, a], [, b]) => b - a).forEach(([anchor], k) => anchor.style.zIndex = String(k));
    if (live) {
      scene.requestRender();
    }
  };
  scene.postRender.addEventListener(place);
  const overlay = {
    /** The layer: append to it what is drawn over the scene without a point of its own (it is over the pins). */
    element,
    /**
     * @param {HTMLElement} content
     * @param {Position} [position]
     * @param {PinOptions} [options]
     * @return {Pin}
     */
    pin(content, position, {offset = [0, 0], occlude = true, live = false} = {}) {
      const anchor = doc.createElement('div');
      anchor.className = 'cesium-overlay-pin';
      anchor.hidden = true;
      // where the element was, to put it back
      const [home, next] = [content.parentNode, content.nextSibling];
      anchor.append(content);
      layer.append(anchor);
      const pin = {anchor, at: /** @type {() => Cartesian3 | undefined} */ (() => undefined), hidden: false, offset, occlude, live, shown: ''};
      pins.add(pin);
      /** @param {Position} to */
      const move = to => {
        pin.at = typeof to === 'function' ? to : () => to;
        place();
        scene.requestRender();
      };
      move(position);
      return {
        element: content,
        anchor,
        move,
        get hidden() {
          return pin.hidden;
        },
        set hidden(hidden) {
          pin.hidden = hidden;
          place();
          scene.requestRender();
        },
        remove() {
          pins.delete(pin);
          if (home) {
            home.insertBefore(content, next?.parentNode === home ? next : null);
          } else {
            content.remove();
          }
          anchor.remove();
        },
      };
    },
  };
  holder[KEY] = overlay;
  return overlay;
}
