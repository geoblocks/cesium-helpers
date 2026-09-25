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
import {AnalogVideo, ColorIsolation, DigitalVideo, DroneDisplay, Infrared, Jello, LensDistortion, MotionBlur, SnowLine, SpeedLines, Spotlight, Super8, Technicolor, TiltShift, ValleyFog} from '@geoblocks/cesium-post-process';

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

const motionBlur = new MotionBlur(viewer, {
  strength: 1,      // fraction of the exposure, 0 to 1
  exposure: 1 / 24, // exposure time, in seconds: 1/48 is the 180 degree shutter of film
});
motionBlur.active = true;

const speedLines = new SpeedLines(viewer, {
  focus,
  strength: 1, // zoom blur toward the focus and streaks radiating from it, 0 to 1
});
speedLines.active = true;

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

// the drone camera
const lensDistortion = new LensDistortion(viewer, {
  distortion: 0.5, // barrel distortion of a wide-angle lens, 0 to 1
  vignette: 0.5,   // darkening of the corners, 0 to 1
});
lensDistortion.active = true;

const jello = new Jello(viewer, {
  amount: 0.1,   // shake of the camera, whose rolling shutter makes straight edges wobble, 0 to 1
  frequency: 30, // vibration, in Hz
});
jello.active = true;

const droneDisplay = new DroneDisplay(viewer, {
  opacity: 1,      // a Betaflight analog OSD: horizon, sidebars, cross, altitude, battery, link quality; 0 to 1
  reticle: 'v',    // the mark in the middle: a custom 'v' or 'heart', or 'ring' (Betaflight's)
});
droneDisplay.active = true;

const analogVideo = new AnalogVideo(viewer, {
  noise: 0.5,         // grain, 0 to 1
  interference: 0.15, // how weak the signal gets: interference bands, sparkles, lost color, breakups; 0 to 1
});
analogVideo.active = true;

// or, instead of the analog video
const digitalVideo = new DigitalVideo(viewer, {
  breakup: 0.5, // how often and how badly the signal breaks up into macroblocks, 0 to 1
});
digitalVideo.active = true;
super8.grain = 0.3;
super8.destroy();
```

### Shader chunk

`EyeFromDepth` is the GLSL chunk the depth-based effects prepend to their fragment shaders: `vec4 eyeAt(sampler2D depthTexture, vec2 uv)` gives a pixel's eye coordinates from the depth texture, with `w` 0 for the sky, with or without a logarithmic depth buffer. It is exported for effects of your own, and for `@geoblocks/cesium-flyto`'s depth of field.

### Order of the effects

Cesium runs the stages in the order they are added and cannot insert one elsewhere. Activate the effects in this order: `SnowLine`, `ValleyFog`, `Spotlight`, `TiltShift`, `MotionBlur`, `SpeedLines`, `ColorIsolation`, `Infrared`, `Technicolor`, `Super8`, `LensDistortion`, `Jello`, `DroneDisplay`, `AnalogVideo` or `DigitalVideo`. The snow is then under the fog, the lens effects apply to the whole scene, and the film looks apply to everything, their black bars included. The drone camera comes last, in the order of a real one: its lens bends the picture, its sensor reads it with the jello of its shake, its display is drawn over the picture and stays straight, and the video signal, analog or digital, disturbs both. To activate an effect later, deactivate and activate again the active effects that come after it.

### Notes

`ColorIsolation`, `Infrared`, `Technicolor` and `Super8` work on display colors, after Cesium's tone mapping. `ColorIsolation`, `Infrared` and `Technicolor` follow prod80's [ReShade shaders](https://github.com/prod80/prod80-ReShade-Repository) (MIT). `Technicolor` imitates the three-strip process: the scene is split into red, green and blue records, each printed with its complementary dye, which gives its dense, saturated primaries. `Super8` blurs the highlights into a red-orange halation, as light scattered back through the film base, draws its grain as clumps a few pixels wide that differ slightly between the dye layers, and moves at 18 frames per second (grain, weave and flicker change with each film frame, light leaks drift slowly), so while it is active the scene renders 18 times per second, also with `requestRenderMode`.

`MotionBlur` blurs each pixel along its motion on the screen since the previous frame, over the exposure time, with the depth-weighted gathering of "A Reconstruction Filter for Plausible Motion Blur" (McGuire et al., I3D 2012). Only the camera moves: each pixel's motion follows from its depth and the previous frame's view, without a velocity buffer, and the samples are weighted by depth so that near terrain and far ridges or sky do not smear into each other. Without the paper's neighborhood velocity pass, a pixel only gathers along its own motion: the blur of moving terrain does not spill over a background that does not move, such as the sky, and its outline stays sharp there. The exposure is scaled by the time between frames, so the blur is the same whatever the frame rate; after a pause in `requestRenderMode`, that time is taken as at most a tenth of a second. At strength 0 its stage is disabled.

`LensDistortion` keeps the corners of the picture in place and magnifies its middle, so it keeps filling the screen; at distortion 0 and vignette 0 its stage is disabled. `DroneDisplay` imitates a Betaflight analog OSD, as its MAX7456 chip draws it: 30 columns and 16 rows of 12 x 18 character cells over a 4:3 picture, white blocky glyphs with a black outline. Its layout and its artificial horizon follow Betaflight's `osd_elements.c`: the horizon is a row of bars whose heights follow the camera's pitch (at most 20 degrees) and roll (at most 40) in ninths of a row, a symbol rather than a line on the real horizon, framed by sidebars with level markers, and the cross spans 3 cells; operators often upload their own glyph instead, which the `reticle` option imitates with a V or a heart. The readouts show the altitude since the display turned on, and a battery voltage, after a battery symbol filled in 7 steps as it drains, and a link quality that are made up. The glyphs follow the sizes of Betaflight's default font (1 pixel strokes, a horizon of 2 pixel dashes, a ring for the cross, `ALT` and `LQ` symbols) but are drawn here, not copied from it. `AnalogVideo` follows ntsc-rs's chroma lowpass and delay, ringing and snow, and the artifacts of analog FPV video: the picture moves at 25 frames per second, so while it is active the scene renders 25 times per second, also with `requestRenderMode`.

`Jello` follows the readout pass of [Readout](https://github.com/stoatworks-labs/readout) (MIT): the sensor reads its rows over 20 ms, so each row sees the camera at a different moment of its shake, a few sinusoids in x, y and rotation whose phases are computed in double precision on the CPU; the picture is magnified slightly so that its edges do not show; at amount 0 its stage is disabled and the scene is not rendered for it. `DigitalVideo` breaks the picture at random into 16 pixel macroblocks, each rebuilt from its corners with fewer colors as a codec that has thrown its detail away, some displaced, with strips shifted sideways and the colors split as in three.js's DigitalGlitch, and sometimes a short black screen; without the previous frames, it cannot freeze the picture. Both move, so while one is active the scene renders 30 times per second, also with `requestRenderMode`. Together, the animated effects (`Super8`, `AnalogVideo`, `Jello`, `DigitalVideo`) share one render clock per scene: the scene renders once per frame of the fastest of them, not once for each.

`SpeedLines` draws new streaks, 24 times per second, only when the scene renders: it does not render the scene by itself, so the streaks move while the camera does, or with any animation that renders the scene. At strength 0 its stage is disabled and costs nothing.

`SnowLine` and `ValleyFog` compute each pixel's height relative to the camera, in double precision on the CPU for the camera, so they stay accurate far from the origin. The snow's slope comes from the normal rebuilt from the neighboring pixels. The fog is lit by the sun like Cesium's own fog: its color during the day, a moonlit blue at night, as bright as `scene.fog.minimumBrightness`. Both work in 3D only.

`SnowLine`, `ValleyFog`, `TiltShift`, `Spotlight` and `MotionBlur` read the depth buffer. The post-process stages only get the terrain's depth when it is depth tested, so `globe.depthTestAgainstTerrain` is on while any of them is active and restored when the last one is deactivated: billboards and labels that show through the terrain can be hidden by it meanwhile.
