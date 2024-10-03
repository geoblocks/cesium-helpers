# compass bar widget for CesiumJS

## Installation

```bash
npm i --save @geoblocks/cesium-compass-bar
```

## Usage

```html
 <cesium-compass-bar .scene="${viewer.scene}"></cesium-compass-bar>
```

## API

### Properties/Attributes

| Name            | Type             | Default         | Description
| --------------- | ---------------- | --------------- | -----------
| `scene`         | `Cesium.Scene`   |                 | A [Cesium Scene instance](https://cesium.com/docs/cesiumjs-ref-doc/Scene.html)

### CSS Custom Properties

| Name                                       | Default | Description
| ------------------------------------------ | ------- | -----------
| `--cesium-compass-bar-tick-color`          | `#000`  | Ticks and font color
| `--cesium-compass-bar-intercardinal-width` | `100px` | Width in pixels between intercardinal divs

### CSS Shadow Parts

| Part name     | Description
| ------------- | -----------
| `label`       | The compass label
| `tick`        | The compass tick div
| `center-tick` | The compass center tick div
