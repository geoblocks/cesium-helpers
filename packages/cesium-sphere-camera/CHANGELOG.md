# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-sphere-camera%400.2.0...%40geoblocks%2Fcesium-sphere-camera%400.3.0) (2026-11-09)

* feat(cesium-sphere-camera)!: look around as a Cesium camera controller ([5efd92f](https://github.com/geoblocks/cesium-helpers/commit/5efd92fe3a8b1d3c04a52e2ed786f59658b619a7))

### BREAKING CHANGES

* @cesium/engine 26.2.0 (CesiumJS 1.144) or later is
  needed, and the public handleDownEvent and handleUpEvent methods are
  removed.


# [0.2.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-sphere-camera%400.1.1...%40geoblocks%2Fcesium-sphere-camera%400.2.0) (2026-11-06)

* refactor(cesium-sphere-camera)!: keep the state in private fields ([ef35329](https://github.com/geoblocks/cesium-helpers/commit/ef35329ad58bb232ac097497c87c0d86ba888064))

### BREAKING CHANGES

* the classes' name_ members, private by convention, are
  private elements: code that read them gets undefined, code that set them
  changes nothing.


## [0.1.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-sphere-camera%400.1.0...%40geoblocks%2Fcesium-sphere-camera%400.1.1) (2026-11-02)

**Note:** Version bump only for package @geoblocks/cesium-sphere-camera





# [0.1.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-sphere-camera%400.0.2...%40geoblocks%2Fcesium-sphere-camera%400.1.0) (2026-10-26)

### Bug Fixes

* add readme for cesium-sphere-camera ([07ae574](https://github.com/geoblocks/cesium-helpers/commit/07ae57471614898291d47f8f72af4511babae1e0))
* **cesium-sphere-camera:** avoid per-event Cartesian3 allocation ([e17a2d9](https://github.com/geoblocks/cesium-helpers/commit/e17a2d90c8c455cae32f752b7a847b308147b63a))

### Build System

* publish built JavaScript and type declarations from dist/ ([#185](https://github.com/geoblocks/cesium-helpers/issues/185)) ([327d71e](https://github.com/geoblocks/cesium-helpers/commit/327d71e5ccf4c1e86477f25d262816db785f419b))

### BREAKING CHANGES

* the published files moved from the package root to dist/, so deep imports such as @geoblocks/cesium-compass/cesium-compass.js no longer resolve, and the exports map only exposes the package entry point (cesium-obstacles also exposes ./triangle-mesh.js, ./triangle-trees.js, ./gltf-mesh.js and ./mesh-builder.js).
