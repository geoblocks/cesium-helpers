# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.2](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-path-flyover%400.3.1...%40geoblocks%2Fcesium-path-flyover%400.3.2) (2026-11-10)

### Bug Fixes

* peer on cesium-post-process 0.8 or 0.9 ([a3e04da](https://github.com/geoblocks/cesium-helpers/commit/a3e04da2ba204e86f78784c5c0b33b2d364f73e0))


## [0.3.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-path-flyover%400.3.0...%40geoblocks%2Fcesium-path-flyover%400.3.1) (2026-11-09)

### Bug Fixes

* **cesium-path-flyover:** keep the previous track on screen while the next one loads ([cde87fc](https://github.com/geoblocks/cesium-helpers/commit/cde87fc7b03269c078f3c397e396ed8dee6f2cdf))


# [0.3.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-path-flyover%400.2.2...%40geoblocks%2Fcesium-path-flyover%400.3.0) (2026-11-06)

* refactor(cesium-path-flyover)!: keep the state in private fields ([2c3f7da](https://github.com/geoblocks/cesium-helpers/commit/2c3f7daa0c8121e88d4314f2677787990c4c9b88))

### Bug Fixes

* peer on cesium-post-process 0.8, which exports the terrain depth helpers ([8b43da6](https://github.com/geoblocks/cesium-helpers/commit/8b43da6f3b976346eb49b3b88d1a209ec3cb049a))

### Features

* **cesium-path-flyover:** draw the trail as a 3D line above the terrain ([92b299a](https://github.com/geoblocks/cesium-helpers/commit/92b299af4c55d034665a8d5c788449bf828ece64))
* **cesium-path-flyover:** draw the trail as a thin line on a dark edge ([d8fbffa](https://github.com/geoblocks/cesium-helpers/commit/d8fbffa88b8122d39e2c1a201c149bffd1c81926))

### BREAKING CHANGES

* the classes' name_ members, private by convention, are
  private elements: code that read them gets undefined, code that set them
  changes nothing.


## [0.2.2](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-path-flyover%400.2.1...%40geoblocks%2Fcesium-path-flyover%400.2.2) (2026-11-03)

### Bug Fixes

* import eastNorthUpToFixedFrame from @cesium/core ([e543083](https://github.com/geoblocks/cesium-helpers/commit/e543083ee05b504bd3fad3ee46c868b5c972fb11))


## [0.2.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-path-flyover%400.2.0...%40geoblocks%2Fcesium-path-flyover%400.2.1) (2026-11-02)

**Note:** Version bump only for package @geoblocks/cesium-path-flyover





# [0.2.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-path-flyover%400.1.0...%40geoblocks%2Fcesium-path-flyover%400.2.0) (2026-10-26)

### Build System

* publish built JavaScript and type declarations from dist/ ([#185](https://github.com/geoblocks/cesium-helpers/issues/185)) ([327d71e](https://github.com/geoblocks/cesium-helpers/commit/327d71e5ccf4c1e86477f25d262816db785f419b))

### BREAKING CHANGES

* the published files moved from the package root to dist/, so deep imports such as @geoblocks/cesium-compass/cesium-compass.js no longer resolve, and the exports map only exposes the package entry point (cesium-obstacles also exposes ./triangle-mesh.js, ./triangle-trees.js, ./gltf-mesh.js and ./mesh-builder.js).


# 0.1.0 (2026-10-15)

### Features

* add cesium-path-flyover, a camera flyover along a GPX or GeoJSON track ([e0e9cd5](https://github.com/geoblocks/cesium-helpers/commit/e0e9cd5ede69fc2bb41034398f3cf57a55109cc8))
* **demos:** add the flyover studio, a GPX to video page for end users ([5e43cac](https://github.com/geoblocks/cesium-helpers/commit/5e43cac988d16a9552d01ae98d2895df88429f01))
