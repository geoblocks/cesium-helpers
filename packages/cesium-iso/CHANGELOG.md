# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.4.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-iso%400.4.0...%40geoblocks%2Fcesium-iso%400.4.1) (2026-11-09)

### Bug Fixes

* give the camera controller's inputs back as they were ([7b013fc](https://github.com/geoblocks/cesium-helpers/commit/7b013fc01b0727798a9bdcfe3db7cc3025dde8cc))


# [0.4.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-iso%400.3.1...%40geoblocks%2Fcesium-iso%400.4.0) (2026-11-06)

* refactor(cesium-iso)!: keep the view's state in private fields ([dc30450](https://github.com/geoblocks/cesium-helpers/commit/dc30450cc62d6d6070ec2af9d7bdba6bdd285afe))

### Features

* **cesium-iso:** stop the view, and count the pointers down ([023c937](https://github.com/geoblocks/cesium-helpers/commit/023c9375d952c0911364f3d71cfa1f68f2005b91))

### BREAKING CHANGES

* the classes' name_ members, private by convention, are
  private elements: code that read them gets undefined, code that set them
  changes nothing. A page reads heading and size, and turns the view with
  the heading setter.


## [0.3.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-iso%400.3.0...%40geoblocks%2Fcesium-iso%400.3.1) (2026-11-02)

**Note:** Version bump only for package @geoblocks/cesium-iso





# [0.3.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-iso%400.2.0...%40geoblocks%2Fcesium-iso%400.3.0) (2026-10-26)

### Build System

* publish built JavaScript and type declarations from dist/ ([#185](https://github.com/geoblocks/cesium-helpers/issues/185)) ([327d71e](https://github.com/geoblocks/cesium-helpers/commit/327d71e5ccf4c1e86477f25d262816db785f419b))

### BREAKING CHANGES

* the published files moved from the package root to dist/, so deep imports such as @geoblocks/cesium-compass/cesium-compass.js no longer resolve, and the exports map only exposes the package entry point (cesium-obstacles also exposes ./triangle-mesh.js, ./triangle-trees.js, ./gltf-mesh.js and ./mesh-builder.js).


# [0.2.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-iso%400.1.1...%40geoblocks%2Fcesium-iso%400.2.0) (2026-10-15)

### Features

* **iso:** set the heading and the size at once, as public properties ([48fee09](https://github.com/geoblocks/cesium-helpers/commit/48fee09e03640db14fcf0fad9d1c8f7513101733))


## [0.1.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-iso%400.1.0...%40geoblocks%2Fcesium-iso%400.1.1) (2026-10-15)

**Note:** Version bump only for package @geoblocks/cesium-iso





# 0.1.0 (2026-10-14)

### Features

* add cesium-iso, an isometric view as in a game ([89b9442](https://github.com/geoblocks/cesium-helpers/commit/89b9442d9a6fd9598e4c34c67022cd4d0cc8b881))
* **iso:** add a limit option, where the view may stand ([121ed47](https://github.com/geoblocks/cesium-helpers/commit/121ed47edf048310bc2c334a885df70d78931840))
* **iso:** add an orbit option, the camera's distance from its target ([d5a7745](https://github.com/geoblocks/cesium-helpers/commit/d5a7745ef531095e69b23ffd97db2cd9e423e0ca))
* **iso:** turn to a heading, eased, and read the heading ([a8ac010](https://github.com/geoblocks/cesium-helpers/commit/a8ac0109a8c41f14eff71f378b747e255e22e2fd))
