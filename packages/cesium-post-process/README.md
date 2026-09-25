# Cesium Post Process

Screen-space effects for any CesiumJS scene, each one a post-process stage that exists only while the effect is active.

## Installation

```bash
npm i --save @geoblocks/cesium-post-process
```

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-post-process.html)

## Usage

Each effect is inactive after construction. Every option is also a property, applied live.

```javascript
import {Color} from '@cesium/engine';
import {ColorIsolation, Infrared, SnowLine, Spotlight, Super8, Technicolor, TiltShift, ValleyFog} from '@geoblocks/cesium-post-process';

const snowLine = new SnowLine(viewer, {
  altitude: 2000,  // meters above the ellipsoid where the snow is half covering
  transition: 200, // height of the band over which the snow thins out, in meters
  maxSlope: 40,    // steepest slope that holds snow, in degrees
  coverage: 1,     // opacity of the snow, 0 to 1
});
snowLine.active = true;

const valleyFog = new ValleyFog(viewer, {
  top: 1500,       // altitude of the top of the fog, meters above the ellipsoid
  density: 0.005,  // per meter, about 1 / visibility
  softness: 100,   // height of the band under the top over which the fog thins out, in meters
  color: new Color(0.85, 0.88, 0.92, 1),
});
valleyFog.active = true;

// what the focus effects look at: a position, a function returning one (called every frame, for a
// moving target), or undefined for what is in the middle of the screen
const focus = () => marker.position;

const spotlight = new Spotlight(viewer, {
  focus,
  radius: 200,   // radius of the pool of light on flat ground, in meters
  softness: 0.5, // width of the penumbra, as a fraction of the radius
  darkness: 0.8, // darkening and desaturation outside the light, 0 to 1
  beam: 0.25,    // brightness of the beam in the air, 0 to 1
});
spotlight.active = true;

const tiltShift = new TiltShift(viewer, {
  focus,
  range: 0.3,      // width of the sharp band, in factors of two of the focal distance
  blur: 4,         // blur away from the focus, the sigma of Cesium's blur stage
  saturation: 0.3, // color and contrast boost of miniature photographs, 0 to 1
});
tiltShift.active = true;

// the colors
const colorIsolation = new ColorIsolation(viewer, {
  hue: 0,        // hue kept in color, in degrees: 0 red, 60 yellow, 120 green, 180 cyan, 240 blue, 300 magenta
  range: 60,     // half width of the hues kept, in degrees
  strength: 1,   // how gray the rest turns, 0 to 1
});
colorIsolation.active = true;

const infrared = new Infrared(viewer, {
  strength: 1,   // black and white infrared film: bright foliage, dark sky and water; 0 to 1
});
infrared.active = true;

// the film looks: one or the other, or Technicolor under Super 8
const technicolor = new Technicolor(viewer, {
  strength: 1,     // how far from the original colors, 0 to 1
  aspectRatio: 0,  // width over height of the visible frame, black bars around it; 1.37 is the Academy ratio; 0 for none
});
technicolor.active = true;

const super8 = new Super8(viewer, {
  fade: 0.5,         // faded colors: less saturation, lifted blacks, a warm cast; 0 to 1
  halation: 0.5,     // warm glow bleeding around the highlights, 0 to 1
  grain: 0.15,       // film grain, 0 to 1
  weave: 1.5,        // drift of the picture in the gate, in CSS pixels
  flicker: 0.08,     // change of brightness from frame to frame, 0 to 1
  lightLeaks: 0.5,   // warm light leaks along the edge, 0 to 1
  aspectRatio: 4 / 3, // width over height of the frame, with rounded corners; 0 for the whole canvas
});
super8.active = true;
super8.grain = 0.3;
super8.destroy();
```

### Order of the effects

Cesium runs the stages in the order they are added and cannot insert one elsewhere. Activate the effects in this order: `SnowLine`, `ValleyFog`, `Spotlight`, `TiltShift`, `ColorIsolation`, `Infrared`, `Technicolor`, `Super8`. The snow is then under the fog, the lens effects apply to the whole scene, and the film looks apply to everything, their black bars included. To activate an effect later, deactivate and activate again the active effects that come after it.

### Notes

`ColorIsolation`, `Infrared`, `Technicolor` and `Super8` work on display colors, after Cesium's tone mapping. `ColorIsolation`, `Infrared` and `Technicolor` follow prod80's [ReShade shaders](https://github.com/prod80/prod80-ReShade-Repository) (MIT). `Technicolor` imitates the three-strip process: the scene is split into red, green and blue records, each printed with its complementary dye, which gives its dense, saturated primaries. `Super8` blurs the highlights into a red-orange halation, as light scattered back through the film base, draws its grain as clumps a few pixels wide that differ slightly between the dye layers, and moves at 18 frames per second (grain, weave and flicker change with each film frame, light leaks drift slowly), so while it is active the scene renders 18 times per second, also with `requestRenderMode`.

`SnowLine` and `ValleyFog` compute each pixel's height relative to the camera, in double precision on the CPU for the camera, so they stay accurate far from the origin. The snow's slope comes from the normal rebuilt from the neighboring pixels. The fog is lit by the sun like Cesium's own fog: its color during the day, a moonlit blue at night, as bright as `scene.fog.minimumBrightness`. Both work in 3D only.

`SnowLine`, `ValleyFog`, `TiltShift` and `Spotlight` read the depth buffer. The post-process stages only get the terrain's depth when it is depth tested, so `globe.depthTestAgainstTerrain` is on while any of them is active and restored when the last one is deactivated: billboards and labels that show through the terrain can be hidden by it meanwhile.
