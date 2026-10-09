import {createViewer} from './setup.js';
import CesiumAudio from '../packages/cesium-audio/cesium-audio.js';
import {Clouds, Lightning, Precipitation} from '../packages/cesium-post-process/cesium-post-process.js';
import {hourlyRadarMap, latestHour} from './meteoswiss.js';
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

// meters per second
const SPEED_OF_SOUND = 343;
// the farthest a strike is heard, in meters
const THUNDER_RANGE = 20000;
// the gain of the rain at intensity 1
const RAIN_GAIN = 0.5;
const HOUR = 3600 * 1000;
// how long each hour shows while playing, once its radar is loaded, in milliseconds, and how many
// hours ahead are loaded meanwhile
const FRAME_DURATION = 700;
const PRELOAD = 3;
// the hours in a row that fail to load before playing stops
const MAX_FAILURES = 3;

createViewer('cesiumContainer').then(viewer => {
  const controls = document.querySelector('#controls');
  // the whole country, straight down, where the radar's rain and clouds show at once: a flight, to
  // replace setup.js's, which would otherwise land after a view set now
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(8.9, 46.95, 520000),
    orientation: {heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0},
    duration: 0,
  });

  // in the order of the stages: the clouds, the rain in front of them, then the lightning
  // the clock plays an hour every FRAME_DURATION, about 5000 times as fast: a slow drift of the
  // clouds' billows rather than 36 km at each hour; and they drift in real time too, as a
  // strong wind at their height would carry them, also while the clock is paused
  const clouds = new Clouds(viewer, {wind: 0.05, drift: 15});
  // the radar's map alone says how hard it rains, at the camera and along each view
  const precipitation = new Precipitation(viewer, {intensity: 1});
  // striking once it has a map, which says where: within 30 km from the ground, farther from higher up
  const lightning = new Lightning(viewer, {intensity: 0, radius: 30000});
  clouds.active = true;
  precipitation.active = true;
  lightning.active = true;

  let audioContext;
  let rainGain;
  let thunderBuffer;

  const thunder = async ground => {
    if (audioContext?.state !== 'running') {
      return;
    }
    const distance = Cesium.Cartesian3.distance(ground, viewer.scene.camera.positionWC);
    if (distance > THUNDER_RANGE) {
      return;
    }
    const panner = new PannerNode(audioContext, {panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1000});
    panner.connect(audioContext.destination);
    const audio = new CesiumAudio(viewer, ground, panner);
    audio.active = true;
    const source = new AudioBufferSourceNode(audioContext, {buffer: await thunderBuffer});
    source.connect(panner);
    source.onended = () => {
      audio.active = false;
      panner.disconnect();
    };
    source.start(audioContext.currentTime + distance / SPEED_OF_SOUND);
  };
  lightning.strikeEvent.addEventListener(thunder);

  // the rain sound follows the rain at the camera, none above the clouds
  viewer.scene.postRender.addEventListener(() => {
    const below = viewer.scene.camera.positionCartographic.height < precipitation.cloudBase;
    rainGain?.gain.setTargetAtTime(below ? RAIN_GAIN * precipitation.localIntensity : 0, audioContext.currentTime, 0.1);
  });

  const timeSlider = document.querySelector('#time');
  const track = document.querySelector('#track');
  const hourBubble = document.querySelector('#hour');
  const playButton = document.querySelector('#play');
  const playIcon = playButton.querySelector('wa-icon');
  const previousButton = document.querySelector('#previous');
  const nextButton = document.querySelector('#next');
  const last = Number(timeSlider.max);
  const index = () => Number(timeSlider.value);

  // the end of the hour at the slider's start, 7 days before the latest one
  let first;
  const hourAt = i => new Date(first.getTime() + i * HOUR);
  // the hour of the slider at a time of the clock
  const indexAt = time => Cesium.Math.clamp(Math.floor((Cesium.JulianDate.toDate(time) - first) / HOUR) + 1, 0, last);

  // the clock, and so the sun, at the hour shown: an hour every FRAME_DURATION while playing
  const clock = viewer.clock;
  clock.multiplier = HOUR / FRAME_DURATION;
  clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  // the sun moving renders every 5 minutes of the clock, not every frame
  viewer.scene.maximumRenderTimeChange = 300;
  // the clock at the middle of the slider's hour
  const syncClock = () => {
    clock.currentTime = Cesium.JulianDate.fromDate(new Date(hourAt(index()).getTime() - HOUR / 2));
  };
  // the hour of rain a radar file sums, from the hour before its time to its time
  const hours = new Intl.DateTimeFormat([], {hour: '2-digit', minute: '2-digit'});
  const describeHour = i => {
    const end = hourAt(i);
    const start = new Date(end.getTime() - HOUR);
    return `${start.toLocaleDateString([], {weekday: 'short', day: 'numeric', month: 'short'})} · ${hours.formatRange(start, end)}`;
  };

  // the bubble above the slider's thumb, kept inside the track, its arrow on the thumb
  const placeBubble = () => {
    const sliderTrack = timeSlider.shadowRoot?.querySelector('[part~="track"]') ?? timeSlider;
    const trackBox = sliderTrack.getBoundingClientRect();
    const box = track.getBoundingClientRect();
    const thumb = trackBox.left - box.left + (index() / last) * trackBox.width;
    const half = hourBubble.offsetWidth / 2;
    const left = Cesium.Math.clamp(thumb, half, box.width - half);
    hourBubble.style.left = `${left}px`;
    hourBubble.style.setProperty('--arrow', `${50 + (100 * (thumb - left)) / hourBubble.offsetWidth}%`);
  };
  const showBubble = (text, error = false) => {
    hourBubble.textContent = text;
    hourBubble.classList.toggle('error', error);
    placeBubble();
  };
  new ResizeObserver(placeBubble).observe(track);

  const syncButtons = () => {
    previousButton.disabled = index() === 0;
    nextButton.disabled = index() === last;
  };

  // whether the hour's radar loaded
  const showHour = async () => {
    const i = index();
    const hour = hourAt(i);
    syncButtons();
    showBubble(`${describeHour(i)} · loading…`);
    try {
      const map = await hourlyRadarMap(hour);
      // unless the slider moved on meanwhile
      if (i === index()) {
        precipitation.map = map;
        clouds.map = map;
        lightning.map = map;
        // the next hour's, to crossfade to, comes with the steps of the animation
        for (const effect of [precipitation, clouds]) {
          effect.nextMap = undefined;
          effect.mapBlend = 0;
        }
        lightning.intensity = 1;
        showBubble(describeHour(i));
      }
      return true;
    } catch (error) {
      console.error(error);
      if (i === index()) {
        showBubble(`${describeHour(i)} · no radar`, true);
      }
      return false;
    }
  };

  // the hours one after the other as the clock runs, back to the first after the latest
  let playing = false;
  // each play and pause starts a new run, for a step of an earlier one not to go on
  let run = 0;
  let failures = 0;
  const setPlaying = value => {
    playing = value;
    run++;
    failures = 0;
    clock.shouldAnimate = playing;
    playIcon.name = playing ? 'pause' : 'play';
    playIcon.label = playing ? 'Pause' : 'Play';
  };
  // the clock waits for the hour's radar
  const step = async i => {
    const current = run;
    clock.shouldAnimate = false;
    timeSlider.value = i;
    const loaded = await showHour();
    if (current !== run) {
      return;
    }
    failures = loaded ? 0 : failures + 1;
    if (failures === MAX_FAILURES) {
      setPlaying(false);
      return;
    }
    for (let ahead = 1; ahead <= PRELOAD; ahead++) {
      hourlyRadarMap(hourAt((i + ahead) % (last + 1))).catch(() => {});
    }
    // the clouds and the rain crossfade to the next hour as the clock runs through this one
    hourlyRadarMap(hourAt((i + 1) % (last + 1))).then(next => {
      if (current === run && i === index()) {
        precipitation.nextMap = next;
        clouds.nextMap = next;
      }
    }, () => {});
    clock.shouldAnimate = true;
  };
  clock.onTick.addEventListener(() => {
    if (clock.shouldAnimate) {
      const i = indexAt(clock.currentTime);
      if (i !== index()) {
        step(i);
      } else {
        // from the hour's map at its start to the next one at its end; paused, it stays
        const blend = Cesium.Math.clamp((Cesium.JulianDate.toDate(clock.currentTime) - hourAt(i)) / HOUR + 1, 0, 1);
        precipitation.mapBlend = blend;
        clouds.mapBlend = blend;
      }
    }
  });
  const togglePlay = () => setPlaying(!playing);
  // stepping by hand stops the animation
  const goTo = i => {
    setPlaying(false);
    timeSlider.value = Cesium.Math.clamp(i, 0, last);
    syncClock();
    showHour();
  };

  playButton.addEventListener('click', togglePlay);
  previousButton.addEventListener('click', () => goTo(index() - 1));
  nextButton.addEventListener('click', () => goTo(index() + 1));
  // the bubble follows the thumb while dragging, the radar loads where it stops
  timeSlider.addEventListener('input', () => showBubble(describeHour(index())));
  timeSlider.addEventListener('change', () => {
    syncClock();
    showHour();
  });
  // the arrows step an hour and the space bar plays, but in a field or on the slider, which has
  // its own keys
  document.addEventListener('keydown', event => {
    if (timeSlider.disabled || event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.('input, textarea, wa-slider')) {
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index() + (event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key === ' ' && !event.target.closest?.('wa-button, wa-switch')) {
      event.preventDefault();
      togglePlay();
    }
  });

  latestHour().then(latest => {
    first = new Date(latest.getTime() - last * HOUR);
    clock.startTime = Cesium.JulianDate.fromDate(hourAt(-1));
    clock.stopTime = Cesium.JulianDate.fromDate(latest);
    // the days under the track: a tick at each midnight, the day's name at its noon, but the
    // days cut at either end
    const at = (className, i, ...content) => {
      const mark = document.createElement('span');
      mark.slot = 'reference';
      mark.className = className;
      mark.append(...content);
      mark.style.left = `${(100 * i) / last}%`;
      timeSlider.append(mark);
    };
    const midnight = new Date(first);
    midnight.setHours(24, 0, 0, 0);
    for (; midnight <= latest; midnight.setDate(midnight.getDate() + 1)) {
      at('midnight', (midnight - first) / HOUR);
      const noon = (midnight - first) / HOUR + 12;
      if (noon <= last - 6) {
        const day = new Date(midnight.getTime() + 12 * HOUR);
        const weekday = document.createElement('span');
        weekday.className = 'weekday';
        weekday.textContent = `${day.toLocaleDateString([], {weekday: 'short'})} `;
        at('day', noon, weekday, String(day.getDate()));
      }
    }
    timeSlider.disabled = playButton.disabled = false;
    syncClock();
    showHour();
  }, error => {
    console.error(error);
    showBubble('The radar is unavailable', true);
  });

  const load = async url => {
    const response = await fetch(url);
    return audioContext.decodeAudioData(await response.arrayBuffer());
  };

  controls.addEventListener('change', async event => {
    if (event.target.name !== 'sound') {
      return;
    }
    if (!audioContext) {
      // the audio context can only start from a user gesture
      audioContext = new AudioContext();
      thunderBuffer = load('sounds/thunder.mp3');
      rainGain = new GainNode(audioContext, {gain: 0});
      rainGain.connect(audioContext.destination);
      const rain = new AudioBufferSourceNode(audioContext, {buffer: await load('sounds/rain.mp3'), loop: true});
      rain.connect(rainGain);
      rain.start();
    } else if (event.target.checked) {
      await audioContext.resume();
    } else {
      await audioContext.suspend();
    }
  });
});
