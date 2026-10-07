# Cesium Drone

An arcade drone for CesiumJS: it stays level, holds its altitude when the sticks are released, slides
along the terrain when it touches it slowly, stops against slopes steeper than 45 degrees, and crashes
when it runs into the terrain fast: its descent and its speed times the slope ahead of it. It is flown with the
keyboard or a gamepad, as the two sticks of a "Mode 2" radio.

| Action | Keyboard | Gamepad |
|---|---|---|
| Climb / descend | W / S | left stick up / down |
| Turn left / right | A / D | left stick left / right |
| Forward / backward | Up / Down | right stick up / down |
| Sideways left / right | Left / Right | right stick left / right |
| Boost | Shift | right trigger |
| Camera tilt down / up | R / F | right / left bumper |

The keys are matched by their position, so the same keys work on AZERTY and QWERTZ keyboards. They are
left alone with Ctrl, Alt or Cmd held, and in text fields.

## Installation

```bash
npm i --save @geoblocks/cesium-drone
```

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-drone.html)

## Usage

```javascript
import CesiumDrone from '@geoblocks/cesium-drone';

const drone = new CesiumDrone(viewer, {
  speed: 15,       // horizontal speed at full stick, in m/s
  boostSpeed: 30,  // horizontal speed at full stick with boost, in m/s, twice the speed by default
  climbSpeed: 6,   // vertical speed at full stick, in m/s
  turnRate: 90,    // turn speed at full stick, in degrees per second
  clearance: 2,    // lowest height above the terrain, in meters
  crashSpeed: 8,   // speed into the terrain above which touching it is a crash, in m/s
  cameraTilt: 20,  // the camera's tilt up on the frame at take-off, in degrees: level when cruising nose down
});
drone.active = true; // takes the camera from where it is (its position and heading), and the mouse navigation off

drone.crashed.addEventListener((position, impact) => {
  // the drone ignores the controls until it respawns, hovering above where it crashed
  setTimeout(() => drone.respawn(), 1000);
});

drone.speedNow;  // current speed, in m/s
drone.heightNow; // height above the terrain, in m, or undefined where it is not loaded
```

Only the terrain is checked, not 3D Tiles. The demo adds the drone camera effects of
[cesium-post-process](../cesium-post-process): a wide lens, jello, a display and the video signal.
