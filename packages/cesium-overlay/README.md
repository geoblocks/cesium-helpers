# HTML overlay for CesiumJS

An HTML layer over a CesiumJS scene, and pins: elements kept on a point of the world as the camera moves. A tool's line and label,
a character's speech bubble, a place's card: plain HTML and CSS, crisp at any zoom, laid over the canvas.

- one layer a scene, shared: whoever asks gets the same, its pixels the canvas's, clipped to the canvas's box
- a pin keeps an element on a point, hidden behind the camera and the globe's horizon, or, asked, behind what the scene shows in
  front of it; the nearest pin on top
- the element keeps its own layout and transform: in flow or positioned, centred or lifted above the point by its own CSS
- TypeScript declarations included

## Installation

```bash
npm i --save @geoblocks/cesium-overlay
```

## Usage

```js
import {overlayOf} from '@geoblocks/cesium-overlay';

const overlay = overlayOf(viewer);                 // a Viewer, a CesiumWidget or a scene
const card = Object.assign(document.createElement('div'), {className: 'card', textContent: 'Lausanne'});
const pin = overlay.pin(card, Cartesian3.fromDegrees(6.63, 46.52, 500), {offset: [0, -8]});
pin.move(() => train.position);                    // read on every render
pin.hidden = true;                                 // hidden, its position kept; false shows it again
pin.remove();                                      // the card put back where it was, if it was somewhere
```

```css
/* above the point, its middle on it; clickable */
.card { translate: -50% -100%; pointer-events: auto; }
```

## API

`overlayOf(target)` returns the scene's overlay, made by the first call; it lives as long as the widget.

| Name          | Description
| ------------- | -----------
| `element`     | The layer, `div.cesium-overlay`: what is appended to it is drawn over the pins (a tool's line, its label)
| `pin(element, position?, options?)` | Keeps `element` on `position`, a `Cartesian3`, a function returning one, or `undefined` (hidden): returns a pin

A pin is `{element, anchor, move(position), hidden, remove()}`: `element` the one pinned, `anchor` what holds it, moved to the
point's place; `hidden` hides it whatever its position, which it keeps (a pin shown now and then on the same point); `remove()`
puts the element back where it was taken from, or out of the document if it was nowhere.

| Option    | Default  | Description
| --------- | -------- | -----------
| `offset`  | `[0, 0]` | In pixels, right and down, from the point's place
| `occlude` | `true`   | `true`: hidden behind the globe's horizon (Cesium's labels' test, cheap); `'depth'`: also behind what the scene shows in front of the point, by a read of the depth buffer a render (a perspective view's: an orthographic one's depth is not read back); `false`: never hidden
| `live`    | `false`  | The scene rendered on every frame while the pin is: for a position function that changes by itself in a scene that renders on request (`requestRenderMode`); else a render, from the camera or `scene.requestRender()`, moves it

The pins are placed after every render: a scene rendering on request moves them when it renders.

## Styling

| Class                 | Default
| --------------------- | -------
| `.cesium-overlay`     | `position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 5`
| `.cesium-overlay-pins` | `position: absolute; inset: 0; isolation: isolate`: the pins, first in the layer, under what else is appended to it
| `.cesium-overlay-pin` | `position: absolute; inset: 0; display: flex; align-items: flex-start`, moved by `translate`: the layer's size, its corner on the point, so that the element in it has room to lay out
| `.cesium-overlay-label` | A value's pill (a length, a depth), in the palette's label colors and font, for a page's own pin
| `.cesium-overlay-hint`  | A hint's pill (what to do), in the palette's hint colors and font

```js
const depth = Object.assign(document.createElement('div'), {className: 'cesium-overlay-label', textContent: '470 m deep'});
overlay.pin(depth, point, {offset: [10, 0]});
```

The tools drawn in the layer (`@geoblocks/cesium-measure`, `@geoblocks/cesium-arrange`) share its palette, custom properties
read with their defaults on `.cesium-overlay`: set them on the widget's container or on `:root` to restyle them all, or a tool's own
(`--cesium-measure-core`, ...) for one.

| Custom property                     | Default
| ----------------------------------- | -------
| `--cesium-overlay-core`             | `#fffaf3`, the lines' light core, the points' fill
| `--cesium-overlay-edge`             | `#2b1d10`, the lines' dark edge, seen on a light ground and a dark one
| `--cesium-overlay-glow`             | `#ff9a3c`, what glows: an edge snapped to, a guide, a halo
| `--cesium-overlay-label-background` | the core, 93% opaque: a value's pill (a length, an angle)
| `--cesium-overlay-label-color`      | the edge: a value's text
| `--cesium-overlay-hint-background`  | `#333e`, a hint's pill (what to do)
| `--cesium-overlay-hint-color`       | `#fff`, a hint's text
| `--cesium-overlay-font`             | `12px/1.3 system-ui, sans-serif`

What is in the layer, a page's pins included, reads the palette resolved, the page's value or the default, as `--overlay-*`,
declared on `.cesium-overlay`: `--overlay-core`, `--overlay-edge`, `--overlay-glow`, `--overlay-label-background`,
`--overlay-label-color`, `--overlay-hint-background`, `--overlay-hint-color`, `--overlay-font`. Read them, never set them.

The layer takes no pointer; give `pointer-events: auto` to what in it should. The styles are installed by the first `overlayOf`,
first in the head: a page's rule of the same specificity wins.

`installStyle(document, id, css)` (`@geoblocks/cesium-overlay/install-style.js`, or the main export) puts a stylesheet in a
document once, first in the head: for a package that draws over the overlay and ships its styles in its module, as
`@geoblocks/cesium-measure` does.

## Limits

- `occlude: 'depth'` reads the depth buffer once a pin a render: a few pins, not hundreds.
- One element a pin, moved every render it changes: hundreds of names are a `LabelCollection`'s job.
