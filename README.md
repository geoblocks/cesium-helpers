# CesiumJS Helpers

A collection of helpers and web component for working with [CesiumJS](https://cesium.com/cesiumjs/)

* [cesium-compass](packages/cesium-compass): a compass widget
* [cesium-compass-bar](packages/cesium-compass-bar):
* [cesium-view-cube](packages/cesium-view-cube): a view cube widget
* [cesium-first-person-mode](packages/FirstPersonCameraMode): a first person navigation mode that uses the Pointer Lock API
* [cesium-sphere-camera](packages/cesium-sphere-camera): a camera mode that allows the user to rotate the camera around a position
* [cesium-binoculars](packages/cesium-binoculars): a camera mode that allows the user to use binoculars with the mouse wheel

## Online demos

<https://geoblocks.github.io/cesium-helpers/index.html>

## Running the demos

```bash
npx parcel serve demos/cesium-compass.html --open
npx parcel serve demos/cesium-compass-bar.html --open
npx parcel serve demos/cesium-view-cube.html --open
npx parcel serve demos/cesium-first-person-mode.html --open
npx parcel serve demos/cesium-sphere-camera.html --open
npx parcel serve demos/cesium-binoculars.html --open
```

## Guide

This repository uses [lerna](https://lerna.js.org/) to manage the packages.

```bash
# bootstrap/setup
npm install

# check which packages have changed since the last release.
npx lerna changed

# publish a new npm packages for all the packages
npx lerna publish
```
