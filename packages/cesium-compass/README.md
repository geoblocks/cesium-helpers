# compass widget for Cesium

Note: the code is based on the Compass class from [TerriaJS](https://github.com/TerriaJS/terriajs/blob/master/lib/ReactViews/Map/Navigation/Compass.jsx)

## Installation

```bash
npm i --save @geoblocks/cesium-compass
```

## Usage

```html
 <cesium-compass .scene="${viewer.scene}" .clock="${viewer.clock}"></cesium-compass>
```

## API

### Properties/Attributes

| Name           | Type             | Description
| -------------- | ---------------- | -----------
| `scene`        | `Cesium.Scene`   | A [Cesium Scene instance](https://cesium.com/docs/cesiumjs-ref-doc/Scene.html)
| `clock`        | `Cesium.Clock`   | A [Cesium Clock instance](https://cesium.com/docs/cesiumjs-ref-doc/Clock.html)

### CSS Custom Properties

| Name                                | Default | Description
| ----------------------------------- | ------- | -----------
| `--cesium-compass-stroke-color`     |         | Stroke color
| `--cesium-compass-fill-color`       |         | Fill color
