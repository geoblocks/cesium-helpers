# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.2.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-walk%400.2.0...%40geoblocks%2Fcesium-walk%400.2.1) (2026-10-15)

**Note:** Version bump only for package @geoblocks/cesium-walk





# [0.2.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-walk%400.1.1...%40geoblocks%2Fcesium-walk%400.2.0) (2026-10-15)

* refactor(obstacles)!: move the triangle mesh from cesium-walk to here ([38b3a6f](https://github.com/geoblocks/cesium-helpers/commit/38b3a6fcf3df2666fb5681bb7c252a300fb3e625))

### Features

* **walk:** read a glTF's triangles in the walker's frame ([4de18cd](https://github.com/geoblocks/cesium-helpers/commit/4de18cdf7ef7b617b34733a4213cb43a7dde0fc3))
* **walk:** walk on a glTF's triangles, createWalkMeshFromGltf ([1623165](https://github.com/geoblocks/cesium-helpers/commit/16231655fdda2280b68decf750843f49227f0128))

### BREAKING CHANGES

* @geoblocks/cesium-walk/walk-mesh.js (createWalkMesh,
  toGlb, walkOn, rayHeights) and @geoblocks/cesium-walk/mesh-builder.js
  (Group) are gone: walkOn and rayHeights come from @geoblocks/cesium-walk,
  Group and the mesh from @geoblocks/cesium-obstacles; nothing draws the
  groups any more.


## [0.1.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-walk%400.1.0...%40geoblocks%2Fcesium-walk%400.1.1) (2026-10-14)

### Bug Fixes

* **walk, obstacles:** walk without a globe ([f2ef2b0](https://github.com/geoblocks/cesium-helpers/commit/f2ef2b08f1d51bea4742d4925d4742471262ac94))
* **walk:** write the walk mesh's positions in floats ([1b934cc](https://github.com/geoblocks/cesium-helpers/commit/1b934cc85a760cf3d2ef9fe1919419ac0ccc48a2))
