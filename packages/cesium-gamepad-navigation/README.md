# Gamepad navigation for CesiumJS

Navigates the globe with a gamepad, alongside the mouse: the left stick pans over the ground, the right one
orbits around the point at the center of the view, and the triggers zoom to it, as fast as they are pressed.

| Action | Gamepad (standard mapping) |
|---|---|
| Pan forward, backward and sideways | left stick |
| Orbit around the center of the view, turn and tilt; look around while panning | right stick |
| Zoom in / out | R2 / L2 (RT / LT), as fast as pressed |
| Climb / descend | R1 / L1 (RB / LB) |
| Turn to north, around the center of the view | R3 (RS), the right stick pressed |

The sticks and the triggers are squared, gentle for a slight push and as fast at full deflection, and the motion
eases in and out of them. The camera is kept `clearance` meters above the ground (2 by default), so that it rides
up a slope instead of going into it. The pan's speed follows the height above the ground and the zoom is relative to the distance, so that both
feel the same close up and far away. The orbit stays above the horizon of the point it turns around, and the
zoom within the camera controller's `minimumZoomDistance` and `maximumZoomDistance`. While the left stick
moves, as in a game, and with nothing at the center of the view, the sky, the right stick turns the view in place
and the triggers move it forward and backward.

The gamepad must be in the browser's standard layout (`mapping` is `'standard'`, as for Xbox and PlayStation
pads in Chrome), and the browser shows it to the page once one of its buttons is pressed.

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-gamepad-navigation.html)

## Installation

```bash
npm i --save @geoblocks/cesium-gamepad-navigation
```

## Usage

```javascript
import GamepadNavigation from '@geoblocks/cesium-gamepad-navigation';

const navigation = new GamepadNavigation(viewer);
navigation.panRate = 1;                         // pan and climb at full stick, in heights above the ground per second
navigation.orbitRate = Cesium.Math.toRadians(90); // at full stick, in radians per second
navigation.zoomRate = 1.5;                      // with a trigger fully pressed, in e-folds of the distance per second
navigation.active = true;
```

The sticks, the triggers and the buttons are the default bindings, `NAVIGATION_BINDINGS`, read with
[cesium-input](../cesium-input). The navigation reads its intent from `navigation.input` on each tick,
`{pan: {x, y}, orbit: {x, y}, zoom, climb, north}`, from -1 to 1 and `north` true while held, so the controls can
be remapped, or come from anywhere else while the navigation is not active:

```javascript
import Controls from '@geoblocks/cesium-input';
import GamepadNavigation, {NAVIGATION_BINDINGS} from '@geoblocks/cesium-gamepad-navigation';

// the arrow keys pan as well
navigation.input = new Controls({
  ...NAVIGATION_BINDINGS,
  pan: {...NAVIGATION_BINDINGS.pan, keys: {up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight']}},
});
```
