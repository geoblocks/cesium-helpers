# Obstacles in view for CesiumJS

Collision for camera modes: the obstacles ahead of a mover, read from the depth of the last frame, and the
step to take toward them, in full, along them, or none. Used by `cesium-walk`.

## Installation

```bash
npm i --save @geoblocks/cesium-obstacles
```

## Usage

```js
import {ObstacleProbe, blockedStep} from '@geoblocks/cesium-obstacles';

const probe = new ObstacleProbe(viewer.scene);

// each tick, for a step of `length` meters along the unit vector `toward`
const obstacle = probe.ahead(toward, 'forward');
const step = blockedStep(toward, length, viewer.camera.positionWC, obstacle, new Cartesian3());
if (step.length > 0) {
  viewer.camera.move(step.direction, step.length);
}
```

`probe.ahead(toward, key)` reads the depth along the steps, and a little beside and above, for the obstacle's
plane: walls, roofs or overhangs. Reading the depth stalls the frame until the GPU is done, so each kind of
steps, named by `key`, looks again at most every 100 ms, or when it turns by more than 10 degrees.

`blockedStep` keeps the mover 0.4 m from the obstacle: a step that would come nearer slides along it, or
stops when straight at it. A step shorter than asked for means the obstacle was reached.

### Limits

- Only what is in view is seen: a step out of the camera's view, backward or sideways, finds no obstacle.
  Cesium's ways to look there render the scene once more, 50 to 100 ms on an integrated GPU.
- Only opaque surfaces are obstacles, terrain included: primitives of an alpha below 0.995 are not.
- Between two looks, 100 ms apart, a fast mover can miss a thin obstacle.
