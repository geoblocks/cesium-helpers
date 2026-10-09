# Cesium Walk

This package provides a camera mode for CesiumJS that lets the user walk around the scene
with the keyboard or a gamepad. The camera is kept at a fixed height above the terrain.

## Controls

| Action | Keyboard | Gamepad (standard mapping) |
|---|---|---|
| Walk | W, A, S, D or the arrows | left stick |
| Sprint, forward | Shift, held | Cross / A (button 0), held |
| Jump | Space | Square / X (button 2) |

The keys are matched by their position (`event.code`), so other keyboard layouts walk with the
keys in the same place.

These are the default bindings, `WALK_BINDINGS`, read with [cesium-input](../cesium-input). The walker
reads its intent from `walkMode.input` on each tick, `{move: {x, y}, sprint, jump}`, so the controls can
be remapped, or come from anywhere else, while the walk is not active:

```javascript
import Controls from '@geoblocks/cesium-input';
import CesiumWalk, {WALK_BINDINGS} from '@geoblocks/cesium-walk';

// J jumps instead of Space
walkMode.input = new Controls({...WALK_BINDINGS, jump: {type: 'button', keys: ['KeyJ'], buttons: [2]}});
// touch controls, an AI, a replay: `move` no longer than 1, x right and y forward
walkMode.input = {read: () => ({move: touchStick.vector, sprint: false, jump: touchButton.tapped})};
```

## Installation

```bash
npm i --save @geoblocks/cesium-walk
```

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-walk.html)

## Usage

```javascript
import {Viewer} from '@cesium/engine';
import CesiumWalk from '@geoblocks/cesium-walk';

const viewer = new Viewer(...);
// speed in meters per second, height above the terrain in meters
const walkMode = new CesiumWalk(viewer, 1.6, 2.0);

// ...
walkMode.active = true;
```

`walkMode.sprintSpeed` (default three times the speed) and `walkMode.jumpSpeed` (default 4 m/s)
can be changed at any time, as can these, all off or as on Earth by default:

- `walkMode.gravity`, in m/s² (default 9.81): the Moon's 1.62, or a game's snappier jumps.
- `walkMode.acceleration`, in m/s² (default `Infinity`, at once): how fast the walker reaches its
  speed, stops and turns.
- `walkMode.stepHeight`, in meters (default `Infinity`, always followed): the deepest drop of the
  ground stepped down; off a deeper one, a ledge or a roof, the walker falls.

In the air, jumping or falling, the walker keeps its height when the ground changes under it, and lands
on the ground it meets.
`walkMode.sprinting` tells whether the walker is sprinting. Set `walkMode.headBob = true` for the camera to bob at each step and dip on landing, as in GTA 5's
first person. Set `walkMode.collision = true` for the walker to stop at the obstacles in view at eye
height (buildings, trees, any opaque 3D tiles or primitives) and to slide along them; walking backward or
sideways, the obstacles out of view do not stop it. Translucent primitives, of an alpha below 0.995, are
not obstacles. The obstacles come from [cesium-obstacles](../cesium-obstacles), read in the depth
of the last frame, which makes the CPU wait for the GPU. For a world known on the CPU, set
`walkMode.obstacleAhead` to a function returning the obstacle ahead in a direction, `{point, normal}`
with the normal toward the walker, or `undefined`: a ray cast stops the walker in every direction,
without waiting.

The walker stands on the terrain by default. To walk on something else, a model's floors, stairs and
tunnels, set `walkMode.groundHeight` to a function returning the ground height in meters above the
ellipsoid at a `Cartographic`, or `undefined` while unknown.

## Walking on a mesh

`@geoblocks/cesium-walk/walk-mesh.js` makes triangles you know on the CPU, a building's floors, stairs and
walls, into both what is seen and what is walked on, with no wait for the GPU:

```javascript
import CesiumWalk from '@geoblocks/cesium-walk';
import {createWalkMesh, walkOn} from '@geoblocks/cesium-walk/walk-mesh.js';

import {Group} from '@geoblocks/cesium-walk/mesh-builder.js';

// groups of triangles of one color each, in meters, z up, in the frame of a model matrix
const floor = new Group([0.8, 0.8, 0.8, 1]);
floor.polygon([[0, 0], [10, 0], [10, 6], [0, 6]], [], () => 0);
const walls = new Group([0.9, 0.9, 0.85, 1]);
walls.box(0, 0, 0, 10, 0.2, 2.5);
const mesh = await createWalkMesh([floor.walkGroup, walls.walkGroup], modelMatrix);
viewer.scene.primitives.add(mesh.primitive);

const walkMode = new CesiumWalk(viewer);
// stand on the highest floor below the knees, climb steps up to 0.4 m, stop at the walls 0.5 m ahead
walkOn(walkMode, mesh, {eye: 1.6, step: 0.4, reach: 0.5});
```

A group can be walked on and not seen (`show: false`), seen and not walked on (`collide: false`), cast no
shadow (`shadows: false`), glow (`emissive`), carry texture coordinates for a custom shader (`uv`,
`customShader`) or a baked light's atlas (`lightmap`). The faces flatter than 60° are floors, the others
walls. `Group` (`mesh-builder.js`) builds the groups face by face: `face`, `polygon` (with holes), `sides`, `box`;
`charts: true` records each face, to lay them out in an atlas. `mesh.floorBelow(x, y, z)` and `mesh.raycast(origin, direction, maxDistance)` answer in the
mesh's frame and on the globe.
