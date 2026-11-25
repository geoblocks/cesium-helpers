# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.10.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.9.2...%40geoblocks%2Fcesium-post-process%400.10.0) (2026-11-25)

* feat(cesium-post-process)!: clouds without wind ([9ba8be7](https://github.com/geoblocks/cesium-helpers/commit/9ba8be7e5dac86b45effa569c5b3c2c5cbcacead))

### Bug Fixes

* **cesium-post-process:** light the rain's haze by the clouds above it ([385225c](https://github.com/geoblocks/cesium-helpers/commit/385225c4bda8ff30178ee0b2718f9a6d7e6ccccc))
* **cesium-post-process:** no crease on a flat face seen at a grazing angle ([2113e7f](https://github.com/geoblocks/cesium-helpers/commit/2113e7fb8eef359edcaeef37ec69966d44a4c388))
* **cesium-post-process:** the clouds' history, packing, night and cheap light ([9e8f342](https://github.com/geoblocks/cesium-helpers/commit/9e8f3422395d27d0ed8f4755e94db24f637e4e03))
* **cesium-post-process:** the depth's normal at the screen's border and in an orthographic view ([1f165af](https://github.com/geoblocks/cesium-helpers/commit/1f165af7e98980fba7f438c5f62051aa900bef94))

### Features

* **cesium-post-process:** a matte white model, lit as Blender's solid viewport ([5bf977c](https://github.com/geoblocks/cesium-helpers/commit/5bf977cf648af64e8256cc3e1dfea9d6d3b1e1e0))
* **cesium-post-process:** a silver lining and a warm sun on the clouds ([ffd6847](https://github.com/geoblocks/cesium-helpers/commit/ffd6847908229df8f303d269f4bfcb22576ac27c))
* **cesium-post-process:** build the clouds at full resolution over the frames ([960a882](https://github.com/geoblocks/cesium-helpers/commit/960a88231134f4caec8f3e39b9ddb1945b0cdecc))
* **cesium-post-process:** cauliflower lobes on the clouds' towers ([2c4918f](https://github.com/geoblocks/cesium-helpers/commit/2c4918f72ff7de0201cfaf7f1e223f4f318421b3))
* **cesium-post-process:** erode the clouds' edges with a finer detail noise ([46ce8b6](https://github.com/geoblocks/cesium-helpers/commit/46ce8b6f3ef8f4f5ba411ec6037dfc31f1e4aa8e))
* **cesium-post-process:** evolving billows, moonlit clouds, darker rain clouds ([0a84769](https://github.com/geoblocks/cesium-helpers/commit/0a8476932a0affd013b8620ed224903bffa14985))
* **cesium-post-process:** give the clouds uneven bases and tops ([409f7c5](https://github.com/geoblocks/cesium-helpers/commit/409f7c5e2ea3a0dcc42a7a85708c15bde018637a))
* **cesium-post-process:** light the valley fog by the sky and the sun ([bd29dad](https://github.com/geoblocks/cesium-helpers/commit/bd29dadeea82eb203d40edae02cb27baf37d80ab))
* **cesium-post-process:** make the clouds' map and noise in a worker ([9aaf3a7](https://github.com/geoblocks/cesium-helpers/commit/9aaf3a75d086b47ceecd3d4703cc58eb114c30d8))
* **cesium-post-process:** march the clouds in short steps inside them only ([b7d89ae](https://github.com/geoblocks/cesium-helpers/commit/b7d89aeca56d7f9c7313fb365f6874469ad0b407))
* **cesium-post-process:** read the clouds' history through a Catmull-Rom filter ([1f295be](https://github.com/geoblocks/cesium-helpers/commit/1f295bef471d6081fbbfde1598cf5e5f13cd7092))

### BREAKING CHANGES

* Clouds no longer takes the wind and drift options,
  nor has their properties.


## [0.9.2](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.9.1...%40geoblocks%2Fcesium-post-process%400.9.2) (2026-11-18)

### Bug Fixes

* **cesium-post-process:** clear the depth in a view of the sky alone ([b6cecb8](https://github.com/geoblocks/cesium-helpers/commit/b6cecb8939fe0e49de7eb7409e3b6e67e1bbf7ce))
* **cesium-post-process:** dim by the effect with the most rain at the camera ([41529a5](https://github.com/geoblocks/cesium-helpers/commit/41529a592f29d2a5265cb9bb518438d2fb41a279))
* **cesium-post-process:** dim the ground under the rain in its pass ([299eba4](https://github.com/geoblocks/cesium-helpers/commit/299eba4103dc8657cb4be2281488435fbf91512d))
* **cesium-post-process:** light the clouds' base through the cloud above ([2518bbe](https://github.com/geoblocks/cesium-helpers/commit/2518bbe0d3cd68db9298a148ed8e1e8c97f212cd))
* **cesium-post-process:** no sun through thin spots deep in a cloud deck ([9e21bc3](https://github.com/geoblocks/cesium-helpers/commit/9e21bc32d47790c7ecc68c1d13b8534fbff9e0cd))


## [0.9.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.9.0...%40geoblocks%2Fcesium-post-process%400.9.1) (2026-11-16)

### Performance Improvements

* **cesium-post-process:** the tilt-shift's blur at half resolution ([8d0643b](https://github.com/geoblocks/cesium-helpers/commit/8d0643b3b48e2f7be332021c0a29847930cb0f82))


# [0.9.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.8.1...%40geoblocks%2Fcesium-post-process%400.9.0) (2026-11-10)

### Features

* **cesium-post-process:** a name option for every effect's stage ([aaab714](https://github.com/geoblocks/cesium-helpers/commit/aaab714e3bd96b109572306c8deaeb7960d380e8))


## [0.8.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.8.0...%40geoblocks%2Fcesium-post-process%400.8.1) (2026-11-09)

### Bug Fixes

* **cesium-post-process:** keep the terrain depth count per scene ([06635c5](https://github.com/geoblocks/cesium-helpers/commit/06635c5c44b2acaf96b3258ac38115e8d323bda0))


# [0.8.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.7.0...%40geoblocks%2Fcesium-post-process%400.8.0) (2026-11-06)

* refactor(cesium-post-process)!: keep the state in private fields ([a038b55](https://github.com/geoblocks/cesium-helpers/commit/a038b5528ebab1c93ca805c83a99c0bc4ac4478b))

### Features

* **cesium-path-flyover:** draw the trail as a 3D line above the terrain ([92b299a](https://github.com/geoblocks/cesium-helpers/commit/92b299af4c55d034665a8d5c788449bf828ece64))
* share the terrain's depth testing between packages ([098f77c](https://github.com/geoblocks/cesium-helpers/commit/098f77c662cf14c168d3c868cb6062975ec0449a))

### BREAKING CHANGES

* the classes' name_ members, private by convention, are
  private elements: code that read them gets undefined, code that set them
  changes nothing. DroneDisplay's take-off is read and set with takeoff.


# [0.7.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.6.1...%40geoblocks%2Fcesium-post-process%400.7.0) (2026-11-03)

### Features

* **cesium-post-process:** export the shared render clock ([9265adb](https://github.com/geoblocks/cesium-helpers/commit/9265adb0dc15b41ce1852cf27a881a022d55bfbd))


## [0.6.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.6.0...%40geoblocks%2Fcesium-post-process%400.6.1) (2026-11-02)

### Performance Improvements

* **cesium-post-process:** compute the clouds' wind direction once ([1cba9ee](https://github.com/geoblocks/cesium-helpers/commit/1cba9eee988d7b0f660b9fc292198ef9a19a2072))


# [0.6.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.5.0...%40geoblocks%2Fcesium-post-process%400.6.0) (2026-10-27)

### Features

* **post-process:** OpenSky, what SnowLine and RainRings lie on ([be7eac1](https://github.com/geoblocks/cesium-helpers/commit/be7eac15963c323d5ccf77554bd53990c4deebed))


# [0.5.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.4.0...%40geoblocks%2Fcesium-post-process%400.5.0) (2026-10-26)

### Build System

* publish built JavaScript and type declarations from dist/ ([#185](https://github.com/geoblocks/cesium-helpers/issues/185)) ([327d71e](https://github.com/geoblocks/cesium-helpers/commit/327d71e5ccf4c1e86477f25d262816db785f419b))

### BREAKING CHANGES

* the published files moved from the package root to dist/, so deep imports such as @geoblocks/cesium-compass/cesium-compass.js no longer resolve, and the exports map only exposes the package entry point (cesium-obstacles also exposes ./triangle-mesh.js, ./triangle-trees.js, ./gltf-mesh.js and ./mesh-builder.js).


# [0.4.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.3.0...%40geoblocks%2Fcesium-post-process%400.4.0) (2026-10-25)

### Features

* **post-process:** SnowLine's grain, scene light, steep cover and origin; RainRings' clock ([c52ceb5](https://github.com/geoblocks/cesium-helpers/commit/c52ceb5a4321e44820e89411ba62eada7e9d9d73))


# [0.3.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.2.0...%40geoblocks%2Fcesium-post-process%400.3.0) (2026-10-25)

### Bug Fixes

* **post-process:** a cell with a hash of 0 has no drop at no rain ([ceb4696](https://github.com/geoblocks/cesium-helpers/commit/ceb46962c7040a2d2c6614cddd7f2ce5aaa37ca9))

### Features

* **post-process:** RainRings, rings where the rain lands ([9b194d7](https://github.com/geoblocks/cesium-helpers/commit/9b194d73b69c7c7a8da3b2f76f6f202eb0deaf6a))
* **post-process:** SnowLine's patchiness, water level and sun direction ([7410734](https://github.com/geoblocks/cesium-helpers/commit/74107340a34cf5efd0c5b9b7983600b565660b30))


# [0.2.0](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.1.3...%40geoblocks%2Fcesium-post-process%400.2.0) (2026-10-23)

### Features

* **post-process:** add the Dufour map look ([1061f7a](https://github.com/geoblocks/cesium-helpers/commit/1061f7a885f3d42b4c58913832821cdcdcaa9349))
* **post-process:** export the Height and Normal chunks and heightUniforms ([31f990a](https://github.com/geoblocks/cesium-helpers/commit/31f990a0920d5e30a2ff6eee21d6a36e8bdf7eb5))


## [0.1.3](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.1.2...%40geoblocks%2Fcesium-post-process%400.1.3) (2026-10-15)

### Bug Fixes

* **post-process:** outline a jump against the far side's surface, anti-aliased ([3a1fdae](https://github.com/geoblocks/cesium-helpers/commit/3a1fdaeeaca2193ba6725bfe1a763ea2252cbee2))

### Performance Improvements

* **post-process:** the Toy reads the creases' neighbours only when it lights or shades them ([2a00d7b](https://github.com/geoblocks/cesium-helpers/commit/2a00d7b4227dd339f5e466d98cb9ca32fead984b))


## [0.1.2](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.1.1...%40geoblocks%2Fcesium-post-process%400.1.2) (2026-10-15)

**Note:** Version bump only for package @geoblocks/cesium-post-process





## [0.1.1](https://github.com/geoblocks/cesium-helpers/compare/%40geoblocks%2Fcesium-post-process%400.1.0...%40geoblocks%2Fcesium-post-process%400.1.1) (2026-10-14)

### Bug Fixes

* **post-process:** publish effect.js and the cloud files ([9978341](https://github.com/geoblocks/cesium-helpers/commit/997834112b1e234a06cca994398cf07337cb431c))


# 0.1.0 (2026-10-14)

### Bug Fixes

* **cesium-post-process:** read the depth of an orthographic view ([7301f71](https://github.com/geoblocks/cesium-helpers/commit/7301f71e9dd4be4506398dbe2b00d691e5c37146))
* **post-process:** declare the samplers' precision in each shader chunk ([b788660](https://github.com/geoblocks/cesium-helpers/commit/b78866017436209e3ad33421a8883868cefbcc48)), closes [#247](https://github.com/geoblocks/cesium-helpers/issues/247)
* read the shaders' textures in high precision ([afcf68d](https://github.com/geoblocks/cesium-helpers/commit/afcf68de6f1bfc7867bdec895d6bc24a44a7074e))

### Features

* add cesium-path-flyover, a camera flyover along a GPX or GeoJSON track ([e0e9cd5](https://github.com/geoblocks/cesium-helpers/commit/e0e9cd5ede69fc2bb41034398f3cf57a55109cc8))
* add cesium-post-process, with eight screen-space effects ([accfe11](https://github.com/geoblocks/cesium-helpers/commit/accfe114c5e4d48c81a1f94db3321aeef2a8f3d9))
* **cesium-post-process:** add a precipitation effect, from rain to snow ([8b921cf](https://github.com/geoblocks/cesium-helpers/commit/8b921cfbb2b1bad4a9e595d3a9d16df72295d9f8))
* **cesium-post-process:** add a rain map and volumetric clouds ([56f8a70](https://github.com/geoblocks/cesium-helpers/commit/56f8a701c8229093d17ee97a201cff7360a7dd7a))
* **cesium-post-process:** add a Toy effect, an isometric game's look ([a64a0af](https://github.com/geoblocks/cesium-helpers/commit/a64a0af18750626af03a244713de98314f469782))
* **cesium-post-process:** imitate ArduPilot's HD OSD in DroneDisplay ([d0e0250](https://github.com/geoblocks/cesium-helpers/commit/d0e02507fa16ef116df17959a6cc02935c28cf99))
* **cesium-post-process:** make AnalogVideo degrade like a real FPV feed ([7876640](https://github.com/geoblocks/cesium-helpers/commit/787664044fbecb36533e6571e1c3ce96f66a9b78))
* **cesium-post-process:** more realistic volumetric clouds and rain haze ([318e3d3](https://github.com/geoblocks/cesium-helpers/commit/318e3d3d242b3b08010802b532f95177d27f420a))
* **cesium-post-process:** raymarch the spotlight's beam ([507bdc7](https://github.com/geoblocks/cesium-helpers/commit/507bdc7d76b1f24b817a60053683bd7ead5aa99b))
* **cesium-post-process:** show Betaflight's RXLOSS warning in DroneDisplay ([cb30423](https://github.com/geoblocks/cesium-helpers/commit/cb30423a3277276a74077b653b9a71afa132bbeb))
* **cesium-post-process:** spotlight roll-off, grazing normals, power ([6db0851](https://github.com/geoblocks/cesium-helpers/commit/6db0851d766886b76b84cdbf89cf4511a9f52eb3))
* **cesium-post-process:** strike on heavy rain, glow from above ([30a7198](https://github.com/geoblocks/cesium-helpers/commit/30a71983adc80e0c7967cbb3856bfaf8e129464a))
* **post-process:** add a jump option to Toy, a crease's limit ([d574b88](https://github.com/geoblocks/cesium-helpers/commit/d574b8801e696f0a75fc78da1865f72cda1391fa))
* **post-process:** add WhiteModel, an architect's white model look ([29bfd3b](https://github.com/geoblocks/cesium-helpers/commit/29bfd3b8cca8cbffed24ef6dd52ae7aef913ab56))
* **post-process:** round the toy's edges and outline its silhouettes ([361a54f](https://github.com/geoblocks/cesium-helpers/commit/361a54fcc923151b32844bc726385f811191dfd0))
