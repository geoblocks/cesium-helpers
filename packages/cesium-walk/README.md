# walk mode for CesiumJS

Control the camera in CesiumJS as if you were walking around.
Use `w`, `a`, `s` and `d` keys to move.

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-walk.html)

## Installation

```bash
npm i --save @geoblocks/cesium-walk
```

### Usage

```js
import {Viewer} from 'cesium';
import WalkCameraMode from '@geoblocks/cesium-walk';

const viewer = new Viewer(...);
const mode = new WalkCameraMode(viewer.scene);

// ...
mode.active = true;
```
