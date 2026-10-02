import {createViewer} from './setup.js';
import CesiumPathFlyover from '../packages/cesium-path-flyover/cesium-path-flyover.js';
import FlyoverCaptions from './flyover-captions.js';
import {canEncodeVideo} from 'mediabunny';
import {exportFlyover} from './flyover-export.js';
import {BITS_PER_PIXEL, DEFAULT_VIDEO, FPS, approximately, clock, fileSize, megabytes, renderEstimate, tabTitle, videoSize} from './flyover-studio-model.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';

const SAMPLE = {url: 'tracks/Tour_Baulmes_valley.gpx', name: 'Gorge down to Baulmes'};

// [style, motion], and what the camera does
const presets = {
  'default': {dials: [0.5, 0.5], hint: 'Follows the track from behind, a little above it.'},
  'pilot': {dials: [0, 0], hint: 'Low and close behind the marker, banking into the turns.'},
  'spectator': {dials: [1, 0.8], hint: 'High and wide, climbing over the ridges for the view.'},
  'drone': {dials: [0.6, 1], hint: 'Floating and loose, drifting like a drone in the wind.'},
};

// the same query as the style sheet's: the panel is a sheet at the bottom
const SMALL_SCREEN = '(max-width: 40em)';

const $ = (selector) => document.querySelector(selector);
const viewer = await createViewer('cesiumContainer');

let flyover;
let captions;
let captionsLoaded;
// {url, name}: where the track in the flyover comes from, to load it again
let source;
let preset = 'default';
// the preset the loaded flyover was made with, to go back to when a reload fails
let loadedPreset = preset;
let state = 'empty';
// a file is being read: nothing can act
let busy = false;

const video = {...DEFAULT_VIDEO};
// a small screen starts at the lowest quality
if (matchMedia(SMALL_SCREEN).matches) video.quality = '540';
// whether this browser can encode the chosen size
let encodable = true;

const panel = $('#panel');
const presetGroup = $('#preset');
const videoGroups = {orientation: $('#videoOrientation'), quality: $('#videoQuality')};
const placeNames = $('#placeNames');
const play = $('#play');
const progress = $('#progress');
const create = $('#create');
const changeFile = $('#changeFile');

// the elements that belong to some states only
const setState = (next) => {
  if (next !== 'ready') resetWarning();
  state = next;
  document.body.dataset.state = next;
  for (const element of document.querySelectorAll('[data-states]')) {
    element.hidden = !element.dataset.states.split(' ').includes(next);
  }
  refresh();
  layout();
};
const setBusy = (value) => {
  busy = value;
  refresh();
};

// what can act, from the state: the settings reload the track or change the video, so
// only when nothing runs; scrubbing and playing whenever a track is loaded
const refresh = () => {
  $('#chooseFile').loading = busy;
  $('#chooseFile').disabled = busy;
  $('#trySample').disabled = busy;
  const idle = state === 'ready' && !busy;
  const settings = [presetGroup, ...Object.values(videoGroups), placeNames, changeFile];
  for (const control of settings) control.disabled = !idle;
  const live = (state === 'ready' || state === 'playing') && !busy;
  progress.disabled = !live;
  play.disabled = !live;
  const icon = play.querySelector('wa-icon');
  icon.name = state === 'playing' ? 'pause' : 'play';
  icon.label = state === 'playing' ? 'Pause preview' : 'Play preview';
  create.disabled = !(idle && encodable);
  create.loading = busy && state === 'ready';
  // the finest tiles are not shown by a moving camera, but their loading and the
  // upsampling of the terrain past level 18 do cost frames; the export is not real time
  // and keeps the detail
  viewer.scene.globe.maximumScreenSpaceError = state === 'playing' ? 3 : 2;
};

// The stage is the space the panel leaves: beside the card, with the card's own margin
// as a gutter, or above the sheet. The preview takes the video's shape there, so that
// what it shows is what the video shows; the render takes the video's size, scaled down
const px = (value) => `${value}px`;
const stageRegion = () => {
  const card = panel.getBoundingClientRect();
  if (matchMedia(SMALL_SCREEN).matches) return {x: 0, y: 0, width: innerWidth, height: card.top};
  const gutter = innerWidth - card.right;
  return {x: gutter, y: gutter, width: card.left - 2 * gutter, height: innerHeight - 2 * gutter};
};
const layout = () => {
  if (state === 'empty') return;
  const style = document.body.style;
  const region = stageRegion();
  for (const [key, value] of Object.entries(region)) style.setProperty(`--region-${key}`, px(value));
  const [width, height] = videoSize(video.orientation, video.quality);
  let space = region;
  if (state === 'ready' || state === 'playing') {
    const player = $('#player');
    const reserve = player.offsetHeight + parseFloat(getComputedStyle(player).marginBlockStart);
    space = {...region, height: region.height - reserve};
  }
  // the preview may grow past the video's size, the render may not
  const fit = Math.min(space.width / width, space.height / height, state === 'rendering' ? 1 : Infinity);
  style.setProperty('--video-width', px(width));
  style.setProperty('--video-height', px(height));
  style.setProperty('--preview-width', px(width * fit));
  style.setProperty('--preview-height', px(height * fit));
  style.setProperty('--fit', String(fit));
  style.setProperty('--stage-x', px(space.x + (space.width - width * fit) / 2));
  style.setProperty('--stage-y', px(space.y + (space.height - height * fit) / 2));
  viewer.resize();
  viewer.scene.requestRender();
};
window.addEventListener('resize', layout);

// an error shows where the user is looking: on the intro card, or in the panel
const showError = (message) => {
  const callout = $(state === 'empty' ? '#introError' : '#panelError');
  callout.querySelector('span').textContent = message;
  callout.hidden = false;
};
const hideErrors = () => {
  $('#introError').hidden = true;
  $('#panelError').hidden = true;
};

// fly the camera to the run's frame at a distance along the track: place it there
// to read the pose, put the camera back, then animate to it
const flyToFrame = (run, distance = 0) => {
  const camera = viewer.camera;
  const from = {destination: camera.position.clone(), orientation: {direction: camera.direction.clone(), up: camera.up.clone()}};
  run.distance = distance;
  const to = {destination: camera.position.clone(), orientation: {heading: camera.heading, pitch: camera.pitch, roll: 0}};
  camera.setView(from);
  camera.flyTo({...to, duration: 2});
};
// a new track is first shown whole, then the camera goes to its start
const overview = (run) => {
  const sphere = Cesium.BoundingSphere.fromPoints(run.points);
  viewer.camera.flyToBoundingSphere(sphere, {
    offset: new Cesium.HeadingPitchRange(viewer.camera.heading, Cesium.Math.toRadians(-45), sphere.radius * 2.5),
    duration: 2,
    complete: () => setTimeout(() => run === flyover && state === 'ready' && flyToFrame(run), 1000),
  });
};

// a chosen or dropped file is read through an object URL, kept while its track is the
// current one so that a preset can load it again
const release = (track) => track?.url.startsWith('blob:') && URL.revokeObjectURL(track.url);

// the new flyover replaces the old one only once its track has loaded: a file that cannot
// be used leaves the page as it was. Resolves whether it loaded
const load = async (next = source) => {
  const reload = next === source;
  hideErrors();
  setBusy(true);
  const [style, motion] = presets[preset].dials;
  const run = new CesiumPathFlyover(viewer, {style, motion});
  try {
    await run.load(next.url);
  } catch (error) {
    console.error(error);
    run.destroy();
    setBusy(false);
    if (reload) {
      preset = loadedPreset;
      presetGroup.value = preset;
      showPresetHint();
      showError('The track could not be loaded again. Check the connection and try again.');
    } else {
      release(next);
      showError('This file has no GPS track we can use. Export the activity as a GPX file from Strava, Garmin Connect or Komoot, and try again.');
    }
    return false;
  }
  // a new preset goes on from the point of the track the old one was at, to compare them there
  const at = reload ? flyover.distance : 0;
  flyover?.destroy();
  captions?.destroy();
  flyover = run;
  loadedPreset = preset;
  if (!reload) release(source);
  source = next;
  run.progressChanged.addEventListener(followProgress);
  captions = new FlyoverCaptions(viewer, run);
  captions.active = placeNames.checked;
  captionsLoaded = captions.load().catch((error) => console.error(error));
  progress.value = 0;
  $('#trackName').textContent = run.name || next.name;
  updateSummary();
  showTime();
  setBusy(false);
  const first = state === 'empty';
  setState('ready');
  if (reload) flyToFrame(run, at);
  else overview(run);
  if (first) $('#trackName').focus();
  return true;
};

const open = (file) => load({url: URL.createObjectURL(file), name: file.name});
const canOpen = () => !busy && (state === 'empty' || state === 'ready');

const fileInput = $('#fileInput');
$('#chooseFile').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (file && canOpen()) open(file);
});
$('#trySample').addEventListener('click', async () => {
  if (canOpen() && (await load(SAMPLE))) startPlay();
});

// a file dragged over the page: the dropzone lights up on the first screen, a frame
// covers the editor; elsewhere the drop is refused
const dropzone = $('#dropzone');
const dropOverlay = $('#dropOverlay');
const endDrag = () => {
  dropzone.classList.remove('over');
  dropOverlay.hidden = true;
};
document.addEventListener('dragover', (event) => {
  event.preventDefault();
  const files = event.dataTransfer?.types.includes('Files');
  const accepted = files && canOpen();
  if (event.dataTransfer) event.dataTransfer.dropEffect = accepted ? 'copy' : 'none';
  dropzone.classList.toggle('over', accepted && state === 'empty');
  dropOverlay.hidden = !(accepted && state === 'ready');
});
document.addEventListener('dragleave', (event) => {
  if (!event.relatedTarget) endDrag();
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  endDrag();
  const file = event.dataTransfer?.files[0];
  if (file && canOpen()) open(file);
});

// a quick change of size after another: only the answer for the size now chosen counts
let encoderCheck = 0;
const checkEncoder = async () => {
  const check = ++encoderCheck;
  const [width, height] = videoSize(video.orientation, video.quality);
  const answer = await canEncodeVideo('avc', {width, height, bitrate: Math.round(BITS_PER_PIXEL * width * height * FPS)}).catch(() => false);
  if (check !== encoderCheck) return;
  encodable = answer;
  $('#noEncoder').hidden = encodable;
  refresh();
};

// the run's length and what making it takes, for the chosen size
const updateSummary = () => {
  if (!flyover) return;
  const estimate = renderEstimate(flyover.duration, video.orientation, video.quality);
  const size = fileSize(flyover.duration, video.orientation, video.quality);
  $('#summary').textContent = `${clock(flyover.duration)} video, ${megabytes(size)}, ${approximately(estimate)} to render`;
};

const showPresetHint = () => {
  presetGroup.hint = presets[preset].hint;
};
showPresetHint();
presetGroup.addEventListener('change', () => {
  preset = presetGroup.value;
  showPresetHint();
  resetWarning();
  load();
});
for (const [key, group] of Object.entries(videoGroups)) {
  group.value = video[key];
  group.addEventListener('change', () => {
    video[key] = group.value;
    resetWarning();
    updateSummary();
    checkEncoder();
    layout();
  });
}
placeNames.addEventListener('change', () => {
  if (captions) captions.active = placeNames.checked;
  viewer.scene.requestRender();
});
changeFile.addEventListener('click', () => fileInput.click());

// on a small screen the sheet folds to its header and its button, to show the preview
const collapse = $('#collapse');
collapse.addEventListener('click', () => {
  const collapsed = panel.classList.toggle('collapsed');
  const icon = collapse.querySelector('wa-icon');
  icon.name = collapsed ? 'chevron-up' : 'chevron-down';
  icon.label = collapsed ? 'Show the settings' : 'Hide the settings';
  layout();
});

// the player: play and pause, and scrubbing
const time = $('#time');
let scrubbing = false;
const showTime = () => {
  const duration = flyover?.duration ?? 0;
  time.textContent = `${clock((flyover?.progress ?? 0) * duration)} / ${clock(duration)}`;
};
const followProgress = (p) => {
  const shown = Math.round(p * 1000) / 1000;
  if (!scrubbing && +progress.value !== shown) progress.value = shown;
  showTime();
};
progress.addEventListener('input', () => {
  scrubbing = true;
  viewer.camera.cancelFlight();
  flyover.progress = +progress.value;
  showTime();
});
progress.addEventListener('change', () => {
  scrubbing = false;
});
const startPlay = async () => {
  // the overview's flight would fight the run for the camera
  viewer.camera.cancelFlight();
  setState('playing');
  await flyover.play();
  // a run stopped at the end of the track, or paused: the panel is idle again
  if (state === 'playing') setState('ready');
};
play.addEventListener('click', () => (state === 'playing' ? flyover.stop() : startPlay()));

// the screen stays on while the video renders; the browser drops the lock when the tab is
// hidden, so it is asked for again when the tab comes back. A lock granted after the
// render ended is let go at once
let wakeLock;
const keepAwake = async () => {
  try {
    const lock = await navigator.wakeLock?.request('screen');
    if (state === 'rendering') wakeLock = lock;
    else lock?.release();
  } catch {}
};
const letSleep = () => {
  wakeLock?.release().catch(() => {});
  wakeLock = undefined;
};
document.addEventListener('visibilitychange', () => {
  if (state === 'rendering' && document.visibilityState === 'visible') keepAwake();
});

let controller;
let result;
const renderProgress = $('#renderProgress');
const renderEta = $('#renderEta');
const renderFrames = $('#renderFrames');

// the file name of the download: the track's name
const downloadName = () => (flyover?.name || source.name).replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'flyover';

const render = async () => {
  hideErrors();
  const [width, height] = videoSize(video.orientation, video.quality);
  // asked on the click, the one moment a browser lets it
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  viewer.camera.cancelFlight();
  // the stage is laid out by setState, at once: no wait on an animation frame anywhere
  // here, a hidden tab gets none, and the render has to start, run and finish behind
  // another tab
  setState('rendering');
  $('#stopRender').focus();
  renderProgress.value = 0;
  renderProgress.textContent = '0%';
  renderEta.textContent = 'Starting';
  renderFrames.textContent = '';
  const title = document.title;
  keepAwake();
  controller = new AbortController();
  const stopped = new Promise((resolve) => controller.signal.addEventListener('abort', resolve, {once: true}));
  let blob;
  let failure;
  try {
    // the place names may still be loading: Stop does not wait for them
    await Promise.race([captionsLoaded, stopped]);
    if (!controller.signal.aborted) blob = await exportFlyover({
      viewer,
      flyover,
      captions,
      width,
      height,
      signal: controller.signal,
      onProgress: ({frame, frames, perFrame}) => {
        const percent = Math.floor((100 * frame) / frames);
        renderProgress.value = percent;
        renderProgress.textContent = `${percent}%`;
        document.title = tabTitle(percent);
        // the time per frame so far, over the frames left; the first frames load the most
        if (frame >= FPS) renderEta.textContent = `${approximately(perFrame * (frames - frame))} left`;
        renderFrames.textContent = `Frame ${frame + 1} of ${frames}`;
      },
    });
  } catch (error) {
    console.error(error);
    failure = error;
  } finally {
    letSleep();
    document.title = title;
  }
  if (!blob) {
    // stopped, or failed: back to the editor, with the error when there is one
    setState('ready');
    if (failure) showError(`The video could not be made: ${failure.message}`);
    create.focus();
    return;
  }
  if (result) URL.revokeObjectURL(result.url);
  const name = `${downloadName()}.mp4`;
  result = {url: URL.createObjectURL(blob), name, file: new File([blob], name, {type: 'video/mp4'})};
  $('#resultVideo').src = result.url;
  $('#downloadLabel').textContent = `Download video · ${(blob.size / 1e6).toFixed(1)} MB`;
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    new Notification('Your flyover is ready', {body: $('#downloadLabel').textContent});
  }
  // where the system can share the file, sharing it is the way to the phone's apps; the
  // download stays, second
  const sharable = navigator.canShare?.({files: [result.file]}) ?? false;
  $('#share').hidden = !sharable;
  $('#download').variant = sharable ? 'neutral' : 'brand';
  $('#download').appearance = sharable ? 'outlined' : 'accent';
  setState('done');
  (sharable ? $('#share') : $('#download')).focus();
};

// on a phone the first click only warns; the second renders. A second tap within a
// moment of the first is a double tap, not a decision
let warned = 0;
function resetWarning() {
  warned = 0;
  $('#phoneWarning').hidden = true;
  $('#createLabel').textContent = 'Create video';
}
create.addEventListener('click', () => {
  if (matchMedia(`${SMALL_SCREEN}, (pointer: coarse)`).matches) {
    if (!warned) {
      warned = performance.now();
      $('#phoneWarning').hidden = false;
      $('#createLabel').textContent = 'Render anyway';
      return;
    }
    if (performance.now() - warned < 600) return;
  }
  resetWarning();
  render();
});
$('#stopRender').addEventListener('click', () => controller.abort());

$('#share').addEventListener('click', async () => {
  try {
    await navigator.share({files: [result.file], title: $('#trackName').textContent});
  } catch (error) {
    if (error.name !== 'AbortError') console.error(error);
  }
});
$('#download').addEventListener('click', () => {
  Object.assign(document.createElement('a'), {href: result.url, download: result.name}).click();
});
$('#makeAnother').addEventListener('click', () => {
  $('#resultVideo').pause();
  setState('ready');
  create.focus();
});

checkEncoder();
setState('empty');
