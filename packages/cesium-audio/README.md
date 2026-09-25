# Cesium Audio

This package spatializes a sound located on the globe, using the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics): the audio listener follows the CesiumJS camera, so the sound comes from the direction of its source and fades with distance.

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
const source = audioContext.createMediaElementSource(document.querySelector('audio'));
source.connect(panner).connect(audioContext.destination);

const audio = new CesiumAudio(viewer.scene, Cartesian3.fromDegrees(7.89, 46.69, 1000), panner);
audio.active = true;
```

The panner node settings (panning and distance models) are left to the application.
