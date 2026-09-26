# Cesium Walk

This package provides a camera mode for CesiumJS that lets the user walk around the scene
with the `W`, `A`, `S` and `D` keys. The camera is kept at a fixed height above the terrain.

## Installation

```bash
npm i --save @geoblocks/cesium-walk
```

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-walk.html)

## Usage

```javascript
import {Viewer} from '@cesium/engine';
import CesiumWalk from '@geoblocks/cesium-walk';

const viewer = new Viewer(...);
// speed in meters per second, height above the terrain in meters
const walkMode = new CesiumWalk(viewer, 1.6, 2.0);

// ...
walkMode.active = true;
```
