# Cesium Audio

This package spatializes a sound located on the globe, using the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics): the audio listener follows the CesiumJS camera, so the panner node receives the direction and distance of the source relative to the camera.

## Installation

```bash
npm i --save @geoblocks/cesium-audio
```

## Demo

[Demo](https://geoblocks.github.io/cesium-helpers/cesium-audio.html)

## Usage

```javascript
import {Viewer, Cartesian3} from '@cesium/engine';
import CesiumAudio from '@geoblocks/cesium-audio';

const viewer = new Viewer(...);

// the audio context must be created or resumed from a user gesture
const audioContext = new AudioContext();
const panner = new PannerNode(audioContext, {panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 100});
const element = document.querySelector('audio');
const source = audioContext.createMediaElementSource(element);
source.connect(panner).connect(audioContext.destination);
element.play();

const audio = new CesiumAudio(viewer.scene, Cartesian3.fromDegrees(7.89, 46.69, 1000), panner);
audio.active = true;
```

The `position` property can be updated at any time to move the source; it is read on every frame.

The panner node settings are left to the application: the panning model, and the distance model that decides how the sound fades with distance.
