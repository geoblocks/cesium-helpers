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

## In a 3D tileset, without reading the depth

`tilesetObstacle(scene, tileset, eye, toward, reach = 1)` finds the obstacle ahead in a 3D tileset by rays
cast on its loaded tiles on the CPU: in any direction, without waiting for the GPU. A second ray, 10 cm
beside the first, gives the wall's direction; walls are taken as upright, as buildings' are. For a walker:

```js
import {ObstacleProbe, tilesetObstacle} from '@geoblocks/cesium-obstacles';

const probe = new ObstacleProbe(viewer.scene);
// the buildings in any direction, the rest of the scene in view
walkMode.obstacleAhead = (toward, key) =>
  tilesetObstacle(viewer.scene, buildings, viewer.camera.positionWC, toward) ?? probe.ahead(toward, key);
```

Each ray takes a few milliseconds: Cesium reads the geometry of the tiles it tests back from the GPU. Only the
tiles loaded are seen, at their level of detail. It relies on Cesium's private `Cesium3DTileset.pick`, until a
public one ([CesiumGS/cesium#13901](https://github.com/CesiumGS/cesium/issues/13901)).

