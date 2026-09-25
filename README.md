# CesiumJS Helpers

A collection of helpers and web component for working with [CesiumJS](https://cesium.com/cesiumjs/)

* [cesium-compass](packages/cesium-compass): a compass widget
* [cesium-compass-bar](packages/cesium-compass-bar): a horizontal compass bar widget showing the camera heading
* [cesium-view-cube](packages/cesium-view-cube): a view cube widget
* [cesium-first-person-mode](packages/FirstPersonCameraMode): a first person navigation mode that uses the Pointer Lock API
* [cesium-flyto](packages/cesium-flyto): a camera mode that flies toward the double-clicked position, with motion blur and depth of field
* [cesium-sphere-camera](packages/cesium-sphere-camera): a camera mode that allows the user to rotate the camera around a position
* [cesium-binoculars](packages/cesium-binoculars): a camera mode that allows the user to use binoculars with the mouse wheel
* [cesium-post-process](packages/cesium-post-process): screen-space effects (Technicolor and Super 8 film looks, infrared, color isolation, tilt-shift, a spotlight, valley fog and a snow line)

## Sponsorship

[![camptocamp logo](https://raw.githubusercontent.com/geoblocks/etter/main/images/camptocamp-logo.png)](https://www.camptocamp.com)

The development of this library is sponsored by [Camptocamp](https://www.camptocamp.com).

## Online demos

<https://geoblocks.github.io/cesium-helpers/index.html>

## Running the demos

```bash
npm run dev
```

Then open `http://localhost:5173` and navigate to the demo of your choice.

## Guide

This repository uses [lerna](https://lerna.js.org/) to manage the packages.

```bash
# bootstrap/setup
npm install

# check which packages have changed since the last release.
npx lerna changed

# publish a new npm packages for all the changed packages.
# Versions and changelogs are derived from the conventional commit messages,
# and a GitHub release is created for each package (requires GH_TOKEN).
npx lerna publish
```

The shaders are written in `packages/*/shaders/*.glsl` and converted to JavaScript modules
next to them, as in CesiumJS. `npm install` and `npm run dev` generate these modules; run
`npm run build-shaders` after editing a shader otherwise.
