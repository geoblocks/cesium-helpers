# Cesium Sphere Camera

This package provides a helper for managing a camera in a CesiumJS application that orbits around a sphere.

## Installation

```bash
npm i --save cesium-sphere-camera
```

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-sphere-camera.html)

## Usage

```javascript
import {Viewer} from '@cesium/engine';
import CesiumSphereCamera from 'cesium-sphere-camera';

const viewer = new Viewer(...);
const sphereMode = new CesiumSphereCamera(viewer);

// ...
sphereMode.active = true;
```

`CesiumSphereCamera` is a CesiumJS camera `Controller`: `active` adds it to the widget with `addController` and turns the
default camera controller's inputs off, then gives them back as they were. A drag with the left button turns the camera,
through an event handler of its own; the widget's `screenSpaceEventHandler` is left alone. It needs `@cesium/engine`
26.2 or later (CesiumJS 1.144).
