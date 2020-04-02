# FirstPerson camera mode for Cesium

## Installation

```bash
npm i --save @geoblocks/cesium-fps
```

### Usage

```js
import Viewer from 'cesium/Widgets/Viewer/Viewer';
import {FirstPersonCameraMode} from '@geoblocks/cesium-helpers';

const viewer = new Viewer(...);
const fpsMode = new FirstPersonCameraMode(viewer.scene);

fpsMode.active = true;
```
