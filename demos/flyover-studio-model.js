// The numbers and the frame loop of the studio page, free of the DOM and of Cesium so that
// node can test them.
export const FPS = 30;
export const DEFAULT_VIDEO = {orientation: 'portrait', quality: '720'};
// seconds of rendering per megapixel of frame: an estimate before the first frames give the real pace
// (measured: 20.7 s for the 13.9 s sample at 540x960 on a warm tile cache)
export const SECONDS_PER_MEGAPIXEL_FRAME = 0.1;

// the quality is the short side of the picture, 16:9
export function videoSize(orientation, quality) {
  const short = +quality;
  const long = Math.round((short * 16) / 9);
  return orientation === 'portrait' ? [short, long] : [long, short];
}

export function clock(seconds) {
  const two = (n) => String(Math.floor(n)).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes}:${two(seconds % 60)}` : `${Math.floor(minutes / 60)}:${two(minutes % 60)}:${two(seconds % 60)}`;
}

export function approximately(seconds) {
  const rounded = Math.max(5, Math.round(seconds / 5) * 5);
  if (rounded < 60) return `about ${rounded} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `about ${minutes} min`;
  const rest = minutes % 60;
  return `about ${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}

export function renderEstimate(duration, orientation, quality) {
  const [width, height] = videoSize(orientation, quality);
  return Math.round(FPS * duration) * ((width * height) / 1e6) * SECONDS_PER_MEGAPIXEL_FRAME;
}

// the encoder's bitrate: 0.4 bit per pixel and frame, 6 Mbit/s at 540x960 and 30 fps
export const BITS_PER_PIXEL = 0.4;

// bytes: the whole video is held in memory until it is saved
export function fileSize(duration, orientation, quality) {
  const [width, height] = videoSize(orientation, quality);
  return (BITS_PER_PIXEL * width * height * FPS * duration) / 8;
}

export const megabytes = (bytes) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`);

export const tabTitle = (percent) => `(${percent}%) Rendering your flyover`;

// renderFrame(k) for k from 0 to frames - 1; the signal is looked at between frames.
// Resolves true when every frame was rendered, false when the signal aborted first
export async function runFrames({frames, renderFrame, onProgress, signal, now = () => performance.now()}) {
  const started = now();
  for (let k = 0; k < frames; k++) {
    if (signal?.aborted) return false;
    onProgress?.({frame: k, frames, perFrame: k > 0 ? (now() - started) / 1000 / k : undefined});
    await renderFrame(k);
  }
  return !signal?.aborted;
}
