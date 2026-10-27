# CesiumJS Helpers

A collection of helpers and web component for working with [CesiumJS](https://cesium.com/cesiumjs/)

* [cesium-compass](packages/cesium-compass): a compass widget
* [cesium-compass-bar](packages/cesium-compass-bar): a horizontal compass bar widget showing the camera heading
* [cesium-view-cube](packages/cesium-view-cube): a view cube widget
* [cesium-first-person-mode](packages/FirstPersonCameraMode): a first person navigation mode that uses the Pointer Lock API
* [cesium-flyto](packages/cesium-flyto): a camera mode that flies toward the double-clicked position, with motion blur and depth of field
* [cesium-iso](packages/cesium-iso): an isometric view, as in a game: an orthographic camera at a fixed pitch, turned a quarter at a time
* [cesium-sphere-camera](packages/cesium-sphere-camera): a camera mode that allows the user to rotate the camera around a position
* [cesium-binoculars](packages/cesium-binoculars): a camera mode that allows the user to use binoculars with the mouse wheel
* [cesium-post-process](packages/cesium-post-process): screen-space effects (Technicolor and Super 8 film looks, infrared, color isolation, tilt-shift, a toy's look, motion blur, speed lines, a spotlight, valley fog, a snow line, rain turning to snow, and a drone camera: wide lens, jello, display, analog and digital video)
* [cesium-path-flyover](packages/cesium-path-flyover): a camera animation that follows a GPX or GeoJSON track
* [cesium-walk](packages/cesium-walk): a camera mode that allows the user to walk around the scene with the keyboard
* [cesium-obstacles](packages/cesium-obstacles): collision with the obstacles in view, for camera modes
* [cesium-bvh](packages/cesium-bvh): a bounding volume hierarchy over triangles: rays and the nearest triangle to a point, in flat typed arrays, with no dependency
* [cesium-overlay](packages/cesium-overlay): an HTML layer over the scene, and pins: elements kept on a point of the world as the camera moves
* [cesium-input](packages/cesium-input): the keyboard, the mouse buttons and the gamepad read into named actions, for camera modes
* [cesium-drone](packages/cesium-drone): an arcade drone flown with the keyboard or a gamepad
* [cesium-gamepad-navigation](packages/cesium-gamepad-navigation): the globe navigated with a gamepad, the triggers zooming as fast as they are pressed
* [cesium-audio](packages/cesium-audio): a spatialized sound located on the globe, using the Web Audio API

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

## Exporting a flyover video

The [path flyover demo](demos/cesium-path-flyover.html) has an export button: the run is
rendered frame by frame, each frame waiting for every tile in view, encoded with WebCodecs
and muxed to an mp4 by [mediabunny](https://mediabunny.dev), then downloaded. Nothing is
real time, so the clip has no dropped frames and no tiles popping in, whatever the GPU.

## Guide

This repository uses [lerna](https://lerna.js.org/) to manage the packages.

```bash
# bootstrap/setup
npm install

# type check the sources.
npm run typecheck

# build the packages: JavaScript and type declarations in packages/*/dist.
npm run build

# check which packages have changed since the last release.
npx lerna changed

# release from an up to date master.
git checkout master
git pull --ff-only

# bump the versions of the changed packages: versions and changelogs are derived from the
# conventional commit messages, then lerna commits, tags and pushes them (no GitHub token needed).
npx lerna version

# check the release commit and the tags it created.
git log -1
git tag --points-at HEAD

# publish to npm the packages tagged on the current commit (needs npm credentials only);
# each package is built first.
npx lerna publish from-git
```

The shaders are written in `packages/*/src/shaders/*.glsl` and converted to JavaScript modules
next to them, as in CesiumJS. `npm install` and `npm run dev` generate these modules; run
`npm run build-shaders` after editing a shader otherwise.
