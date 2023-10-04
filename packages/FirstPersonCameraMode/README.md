# FirstPerson camera mode for CesiumJS

## Installation

```bash
npm i --save @geoblocks/cesium-first-person-mode
```

### Usage

```js
import {Viewer} from 'cesium';
import FirstPersonCameraMode from '@geoblocks/cesium-first-person-mode';

const viewer = new Viewer(...);
const mode = new FirstPersonCameraMode(viewer.scene);

// ...
mode.active = true;
```
