# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.4.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-overlay%400.3.0...%40geoblocks%2Fcesium-overlay%400.4.0) (2026-10-23)

### Features

* **overlay:** add lines, SVG over the scene, hidden where the scene is nearer ([f472c0d](https://github.com/geoblocks/cesium-helpers/commit/f472c0d1594f3cdc523cf9fcf5425454850e25e4))
* **overlay:** lines of several polylines, joined runs, no needless render ([ad79ae7](https://github.com/geoblocks/cesium-helpers/commit/ad79ae798d6119e0ee92ab6c4500c69a115f49ac))


# [0.3.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-overlay%400.2.0...%40geoblocks%2Fcesium-overlay%400.3.0) (2026-10-23)

* feat(overlay)!: keep the overlay's stylesheet in its layer, not in the head ([764bbd7](https://github.com/geoblocks/cesium-helpers/commit/764bbd736bcb9b6ea542f28c439725d61ccae0d7))

### BREAKING CHANGES

* installStyle and @geoblocks/cesium-overlay/install-style.js
  are removed. A package that draws over the overlay puts a <style> in its
  own element in the layer, its rules in [@layer](https://github.com/layer) and [@scope](https://github.com/scope) (README, Custom
  styles).


# 0.2.0 (2026-10-23)

### Features

* **overlay:** add cesium-overlay, an HTML layer and pins over a scene ([1532ae6](https://github.com/geoblocks/cesium-helpers/commit/1532ae667564f218e571b7875066a1a1b6333b38))
