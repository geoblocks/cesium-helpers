# compass view cube for CesiumJS

## Installation

```bash
npm i --save @geoblocks/cesium-view-cube
```

## Usage

```html
 <cesium-view-cube .scene="${viewer.scene}"></cesium-view-cube>
```

## API

### Properties/Attributes

| Name           | Type             | Description
| -------------- | ---------------- | -----------
| `scene`        | `Cesium.Scene`   | A [Cesium Scene instance](https://cesium.com/docs/cesiumjs-ref-doc/Scene.html)

### CSS Custom Properties

| Name                                  | Default | Description
| ------------------------------------- | ------- | -----------
| `--cesium-view-cube-stroke-color`     |         | Stroke color
| `--cesium-view-cube-fill-color`       |         | Fill color
