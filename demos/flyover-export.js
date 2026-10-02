import {BufferTarget, CanvasSource, Mp4OutputFormat, Output} from 'mediabunny';
import {BITS_PER_PIXEL, FPS, runFrames} from './flyover-studio-model.js';

// after each frame, the view this far ahead (seconds of the run) is rendered once,
// uncaptured, so its tiles are requested while the next frames render and encode
// instead of when they come into view: half the export time on a cold tile cache
const LOOK_AHEAD = 1;

// a turn of the event loop, for the tile requests and the terrain workers to answer.
// Not a timer: a tab left in the background gets its timers once a second, then once
// a minute, and an export runs for minutes in a tab the user leaves
const channel = new MessageChannel();
const yieldToBrowser = () => new Promise((resolve) => {
  channel.port1.onmessage = resolve;
  channel.port2.postMessage(undefined);
});

// The run is exported frame by frame: each frame waits for every tile in view, so
// nothing is real time. The frames render as the live view does, without HDR: the video
// compression hides what it adds. The viewer is put back as found, whatever happens.
export async function exportFlyover({viewer, flyover, captions, width, height, fps = FPS, onProgress, signal}) {
  const scene = viewer.scene;
  const globe = scene.globe;
  const controller = scene.screenSpaceCameraController;
  const saved = {
    cache: globe.tileCacheSize,
    inputs: controller.enableInputs,
    recommended: viewer.useBrowserRecommendedResolution,
    scale: viewer.resolutionScale,
  };
  try {
    globe.tileCacheSize = 5000;
    // a drag on the map between two frames would move the camera of the next one
    controller.enableInputs = false;
    // the widget's own loop renders every animation frame while the camera moves: that
    // is nearly three renders per exported frame, all wasted
    viewer.useDefaultRenderLoop = false;
    // the drawing buffer at the video's own size: the browser's recommended resolution is
    // one pixel per CSS pixel, where the device pixel ratio would double or triple it
    viewer.useBrowserRecommendedResolution = true;
    viewer.resolutionScale = 1;
    viewer.resize();
    const output = new Output({format: new Mp4OutputFormat(), target: new BufferTarget()});
    // each frame is the map with the captions over it
    const frame = Object.assign(document.createElement('canvas'), {width, height});
    const context = frame.getContext('2d');
    const source = new CanvasSource(frame, {codec: 'avc', bitrate: Math.round(BITS_PER_PIXEL * width * height * fps), keyFrameInterval: 2});
    output.addVideoTrack(source, {frameRate: fps});
    await output.start();
    const frames = Math.round(fps * flyover.duration);
    const completed = await runFrames({
      frames,
      signal,
      onProgress,
      renderFrame: async (k) => {
        const ahead = k + Math.round(LOOK_AHEAD * fps);
        if (k > 0 && ahead < frames) {
          // not a frame of the run for the captions: their card timing would read a jump
          const active = captions.active;
          captions.active = false;
          flyover.progress = ahead / (frames - 1);
          scene.render();
          captions.active = active;
        }
        flyover.progress = k / (frames - 1);
        // a tile advances one step per render, so this loops a few times per frame
        do {
          scene.render();
          await yieldToBrowser();
        } while (!globe.tilesLoaded && !signal?.aborted);
        // the drawing buffer is not preserved: copy it in the same task as a render
        scene.render();
        context.drawImage(scene.canvas, 0, 0, width, height);
        if (captions.active) context.drawImage(captions.canvas, 0, 0, width, height);
        await source.add(k / fps, 1 / fps);
      },
    });
    if (!completed) {
      await output.cancel();
      return undefined;
    }
    source.close();
    await output.finalize();
    return new Blob([output.target.buffer], {type: 'video/mp4'});
  } finally {
    globe.tileCacheSize = saved.cache;
    controller.enableInputs = saved.inputs;
    viewer.useBrowserRecommendedResolution = saved.recommended;
    viewer.resolutionScale = saved.scale;
    viewer.useDefaultRenderLoop = true;
    viewer.resize();
    flyover.progress = 0;
  }
}
