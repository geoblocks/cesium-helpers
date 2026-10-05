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
import {AnalogVideo, ColorIsolation, DigitalVideo, DroneDisplay, Infrared, Jello, LensDistortion, Lightning, MotionBlur, Precipitation, SnowLine, SpeedLines, Spotlight, Super8, Technicolor, TiltShift, ValleyFog} from '@geoblocks/cesium-post-process';

const snowLine = new SnowLine(viewer, {
  altitude: 2000,  // meters above the ellipsoid where the snow is half covering
  transition: 200, // height of the band over which the snow thins out, in meters
  maxSlope: 50,    // steepest slope that holds snow, in degrees
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
  power: 1,      // brightness of the light, 1 for the searchlight: the pool and the beam scale with it
  radius: 200,   // radius of the pool of light on flat ground, in meters
  softness: 0.5, // width of the penumbra, as a fraction of the radius
  darkness: 0.8, // darkening and desaturation outside the light, 0 to 1
  beam: 0.25,    // brightness of the beam in the air, 0 to 1
  beamAnisotropy: 0.4, // Henyey-Greenstein asymmetry of the haze, 0 to 1: brighter looking toward the light
});
spotlight.active = true;

const precipitation = new Precipitation(viewer, {
  intensity: 0.5,  // how hard it rains or snows: share of the drops or flakes shown, their opacity and the haze, 0 to 1
  snow: 0,         // share of the precipitation that is snow: 0 rain, 1 snow, sleet in between
  wind: 10,        // tilt of the fall from the vertical, toward the east, in degrees
  speed: 1,        // speed of the fall, 1 at its terminal velocity: 9 m/s for the drops, 1 m/s for the flakes
  cloudBase: 2500, // altitude of the cloud base, in meters above the ellipsoid: the precipitation falls below it
});
precipitation.active = true;
// the rain turns to snow, animatable
precipitation.snow = 1;

const lightning = new Lightning(viewer, {
  intensity: 0.5,  // how active the storm is: strikes at random, up to one every 2.5 seconds at 1
  cloudBase: 2500, // altitude of the cloud base, in meters above the ellipsoid: the channels start there
  radius: 5000,    // how far from the camera the strikes land, in meters
  inFront: false,  // land the strikes within 30 degrees of where the camera looks, not all around it
});
lightning.active = true;

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

Cesium runs the stages in the order they are added and cannot insert one elsewhere. Activate the effects in this order: `SnowLine`, `ValleyFog`, `Spotlight`, `Precipitation`, `Lightning`, `TiltShift`, `MotionBlur`, `SpeedLines`, `ColorIsolation`, `Infrared`, `Technicolor`, `Super8`, `LensDistortion`, `Jello`, `DroneDisplay`, `AnalogVideo` or `DigitalVideo`. The snow is then under the fog, the rain or the falling snow in the scene, the lens effects apply to the whole scene, and the film looks apply to everything, their black bars included. The drone camera comes last, in the order of a real one: its lens bends the picture, its sensor reads it with the jello of its shake, its display is drawn over the picture and stays straight, and the video signal, analog or digital, disturbs both. To activate an effect later, deactivate and activate again the active effects that come after it.

### Notes

`ColorIsolation`, `Infrared`, `Technicolor` and `Super8` work on display colors, after Cesium's tone mapping. `ColorIsolation`, `Infrared` and `Technicolor` follow prod80's [ReShade shaders](https://github.com/prod80/prod80-ReShade-Repository) (MIT). `Technicolor` imitates the three-strip process: the scene is split into red, green and blue records, each printed with its complementary dye, which gives its dense, saturated primaries. `Super8` blurs the highlights into a red-orange halation, as light scattered back through the film base, draws its grain as clumps a few pixels wide that differ slightly between the dye layers, and moves at 18 frames per second (grain, weave and flicker change with each film frame, light leaks drift slowly), so while it is active the scene renders 18 times per second, also with `requestRenderMode`.

`MotionBlur` blurs each pixel along its motion on the screen since the previous frame, over the exposure time, with the depth-weighted gathering of "A Reconstruction Filter for Plausible Motion Blur" (McGuire et al., I3D 2012). Only the camera moves: each pixel's motion follows from its depth and the previous frame's view, written once per pixel into a velocity buffer at half resolution rather than recomputed for each sample, and the samples are weighted by depth so that near terrain and far ridges or sky do not smear into each other. Without the paper's neighborhood velocity pass, a pixel only gathers along its own motion: the blur of moving terrain does not spill over a background that does not move, such as the sky, and its outline stays sharp there. The exposure is scaled by the time between frames, so the blur is the same whatever the frame rate; after a pause in `requestRenderMode`, that time is taken as at most a tenth of a second. At strength 0 its stage is disabled.

`LensDistortion` keeps the corners of the picture in place and magnifies its middle, so it keeps filling the screen; at distortion 0 and vignette 0 its stage is disabled. `DroneDisplay` imitates a Betaflight analog OSD, as its MAX7456 chip draws it: 30 columns and 16 rows of 12 x 18 character cells over a 4:3 picture, white blocky glyphs with a black outline. Its layout and its artificial horizon follow Betaflight's `osd_elements.c`: the horizon is a row of bars whose heights follow the camera's pitch (at most 20 degrees) and roll (at most 40) in ninths of a row, a symbol rather than a line on the real horizon, framed by sidebars with level markers, and the cross spans 3 cells; operators often upload their own glyph instead, which the `reticle` option imitates with a V or a heart. The readouts show the altitude since the display turned on, and a battery voltage, after a battery symbol filled in 7 steps as it drains, and a link quality that are made up. The glyphs follow the sizes of Betaflight's default font (1 pixel strokes, a horizon of 2 pixel dashes, a ring for the cross, `ALT` and `LQ` symbols) but are drawn here, not copied from it. `AnalogVideo` follows ntsc-rs's chroma lowpass and delay, ringing and snow, and the artifacts of analog FPV video: the picture moves at 25 frames per second, so while it is active the scene renders 25 times per second, also with `requestRenderMode`.

`Jello` follows the readout pass of [Readout](https://github.com/stoatworks-labs/readout) (MIT): the sensor reads its rows over 20 ms, so each row sees the camera at a different moment of its shake, a few sinusoids in x, y and rotation whose phases are computed in double precision on the CPU; the picture is magnified slightly so that its edges do not show; at amount 0 its stage is disabled and the scene is not rendered for it. `DigitalVideo` breaks the picture at random into 16 pixel macroblocks, each rebuilt from its corners with fewer colors as a codec that has thrown its detail away, some displaced, with strips shifted sideways and the colors split as in three.js's DigitalGlitch, and sometimes a short black screen; without the previous frames, it cannot freeze the picture. Both move, so while one is active the scene renders 30 times per second, also with `requestRenderMode`. Together, the animated effects (`Super8`, `AnalogVideo`, `Jello`, `DigitalVideo`, `Rain`) share one render clock per scene: the scene renders once per frame of the fastest of them, not once for each.

`SpeedLines` draws new streaks, 24 times per second, only when the scene renders: it does not render the scene by itself, so the streaks move while the camera does, or with any animation that renders the scene. At strength 0 its stage is disabled and costs nothing.

`Precipitation` follows the composite rainfall of ATI's ToyShop ("Artist-Directable Real-Time Rain Rendering in City Environments", Tatarchuk 2006): several layers of drops 2 to 16 m away in one full-screen pass, nearer ones larger, faster and more opaque, each hidden behind what is nearer than it. The rain veils the distance in an overcast haze, from 40 km of visibility at intensity 0 to 4 km at 1, lit by the sun as `ValleyFog`'s fog, and in shafts of heavier rain hanging below the cloud base: patches of noise fixed to the ground, more of them as it rains harder, slanting with the wind, thinning out into the clouds and drifting with it, sampled 12 times along each view ray up to 20 km, in a pass at an eighth of the resolution, blurred at that resolution: they are kilometers wide and soft, and a 64th of the pixels is enough for their raymarch. Above the cloud base, no drops fall around the camera. The wind comes in gusts, which sway the fall and the shafts, and the drops waver in them. The drops refract the haze's light, biased toward white as film crews add milk to the water for rain that shows: they show over dark terrain and fade into a bright sky. While it is active, the sky is overcast: the scene's shadows are off and its light is half as bright, both restored when it is deactivated. The drops are laid out on the sphere of view directions, in Mercator coordinates around the direction they fall toward, where each layer is a regular grid, without a texture: the streaks fall down the screen at the horizon and radiate from below the camera when it looks down, rather than falling parallel to the ground as on a screen-aligned layer. The drops follow the camera's rotation but not its motion. The streaks are the drops' motion over a 1/30 s exposure, so while it is active the scene renders 30 times per second, also with `requestRenderMode`; at intensity 0 its stage is disabled and the scene is not rendered for it.

Its `snow`, from 0 to 1, turns the rain to snow in one population, so that nothing in between looks like two kinds of precipitation falling together: the drops slow down from 9 m/s to 1 m/s (geometrically, so 3 m/s at 0.5, as in sleet), their streak, the motion over the exposure, shortens until they are round flakes, their thin sharp line grows into a soft flake that flutters across its cell at its own rate, the nearest layer out of focus as in Andrew Baldwin's "Just snow" (Shadertoy), and there are more of them, as there are in a snowfall; the haze goes from the rain's to the snow's, thicker, from 20 km of visibility to 500 m, with lighter shafts and a brighter light the flakes scatter. Each drop is a capsule from a point in its cell to the end of its trail. The cells of the grid are taller than wide in the rain and square in the snow, so that a trail stays within the cell above the pixel's: animating `snow` stretches the whole field smoothly along the fall, and the scroll along the fall is added up from frame to frame, as the speed changes with it. The cost does not depend on `snow`: about 4.3 to 4.8 ms at 1920 x 1024 on an Intel UHD 630, mostly the four layers; the layers' constants are computed once per frame on the CPU, and each pixel first rejects the drops that are nowhere near it. Wang and Wade's precipitation for Flight Simulator 2004 ("Rendering Falling Rain and Snow", 2004) also draws both with one technique. Several may be active at once: the first one dims the light and turns the shadows off, the last one restores them.

`Lightning` draws cloud-to-ground strikes at random around the camera, or in front of it with `inFront`, on the ground, so that they stay where they are as the camera moves, and none around a camera above the cloud base. Each is a channel from the cloud base to the ground that wanders to either side, by noise of the position along it in four octaves, linear between random values so that it is straight segments with sharp turns, with branches that leave it downward at an angle, wander the same way and fade toward their ends. It is drawn over the picture in screen space, with a hot core in a halo, at least a pixel and a half wide: the channel is centimeters wide, and would vanish at its true width a thousand meters away. The distance to it is a function of the position along the line, a few noise lookups for each channel, not a polyline for each pixel. It is hidden behind nearer terrain. It follows the lightning flash as it is described in Rakov and Uman's "Lightning: Physics and Effects" (2003): 2 to 4 return strokes tens of milliseconds apart down one channel, the first the brightest, with a dimmer current between them keeping it lit, and a flash that follows their flicker: it lights each pixel in proportion to its own color, less with its distance to the foot of the strike, and the sky toward the cloud above it. The core is white and the halo and the flash are blue with a violet cast: the channel is a plasma of about 30000 K, whose light is mostly the lines of nitrogen, with the hydrogen line of the water in a storm's air adding red (Kieu et al., "High-speed spectroscopy of lightning-like discharges", 2021). A far strike turns yellow, then red, as the scattering of the air takes the blue out of its light (an extinction that goes with the wavelength to the minus 4), and its flash tints the sky warm. Up to four strikes are active at once, each over after a second. The strokes flicker, so while it is active the scene renders 30 times per second, also with `requestRenderMode`; at intensity 0 its stage is disabled and the scene is not rendered for it. Without a strike the pass costs nothing measurable, and the flash alone as little: the cost is the channel, each pixel near it computing its distance to the line and to the branches, whose constants come from the CPU once for each strike, and pixels farther than the channel's reach skip it. On an Intel UHD 630 at 1070 x 611, a strike on the screen adds about 2.3 ms to the frame while it lasts, a few tenths of a second, and four at once about 3.8 ms; the cost goes with the area around the channel, so about three times that at 1920 x 1024. It does not dim the sky itself, so it goes with `Precipitation`, which does.

`Spotlight`'s beam in the air is raymarched, as Killzone Shadow Fall's volumetrics (Valient, SIGGRAPH 2014), in a pass at half the resolution: 8 samples along the part of each view ray inside the cone, found analytically, dithered per pixel, each weighted by the cone's penumbra, the dust, the inverse square from the light softened around it and the extinction of the haze so far, then scattered toward the camera with a Henyey-Greenstein phase of asymmetry `beamAnisotropy`. A 3 x 3 blur at that resolution, weighted by the scene distance, smooths the dither out, and the full resolution takes the four texels around each pixel, interpolated where they are at its distance, else the nearest in distance, so that the haze stops at the ridges in front of it rather than spilling onto them; the half-float texture holds the log2 of the distance. On an Intel UHD 630 at 1920 x 1080, the beam costs about 1.9 ms, from 5 ms at full resolution with 16 samples. It holds from any viewpoint, inside the cone included, where the former analytic beam, which took its penumbra where the ray passes closest to the axis, went dark; its dust streaks are noise sampled along the beam, radiating from the light. The light is added to a picture Cesium has already tone mapped, so the output goes through a filmic roll-off (ACES) rather than clipping to flat white.

`SnowLine` and `ValleyFog` compute each pixel's height relative to the camera, in double precision on the CPU for the camera, so they stay accurate far from the origin. The snow's slope comes from the normal rebuilt from the neighboring pixels. The fog is lit by the sun like Cesium's own fog: its color during the day, a moonlit blue at night, as bright as `scene.fog.minimumBrightness`. Both work in 3D only.

`SnowLine`, `ValleyFog`, `Precipitation`, `Lightning`, `TiltShift`, `Spotlight` and `MotionBlur` read the depth buffer. The post-process stages only get the terrain's depth when it is depth tested, so `globe.depthTestAgainstTerrain` is on while any of them is active and restored when the last one is deactivated: billboards and labels that show through the terrain can be hidden by it meanwhile.

Each effect is a full-screen pass, about 1 to 5 ms per frame at full HD on an integrated GPU, on top of a scene that may already be near its budget: Chrome then stalls for hundreds of milliseconds at a time rather than slowing down evenly. If activating an effect brings that on, the cheapest lever is `scene.msaaSamples = 1` while it is active, restored when it is deactivated, as `@geoblocks/cesium-flyto` does for its flights: 4x multisampling costs more than the effect itself, and a moving picture hides the aliasing.
