// Place captions for the flyover: when the marker comes near a place of swissNAMES3D,
// its name shows large on a card, then shrinks into a corner caption that stays until
// the marker is past it, over a readout of the track's elevation. Drawn on a canvas over
// the map, which the video export composites.
//
// The names come from the labels of map.geo.admin.ch's 3D viewer, 3D Tiles whose
// .glb tiles carry the names in an EXT_structural_metadata property table. The tiles
// along the track are fetched and read here, not through a Cesium3DTileset, so the
// places do not depend on what the camera looks at.
const BASE = 'https://3d.geo.admin.ch/ch.swisstopo.swissnames3d.3d/v2/';
// tiers go from 0, the cities, to 7, the hamlets; 7 has too many small names
const CAPTION_TIER = 6;
const TILES_IN_FLIGHT = 16;
// in seconds of the run, so that a video export shows them as a playback does
const FADE_IN = 0.5;
const HOLD = 3.5;
const SHRINK = 0.7;
// a replaced name fades out, and a name shown after a jump fades in, over this time
const CROSSFADE = 0.3;
// a larger step of the run's time is a jump, a scrub: no card
const JUMP = 1;
// the flyover's marker flies this high above the track
const MARKER_HEIGHT = 2;
// a name fades out between these distances from its place, once the marker is past it
const STALE = 3000;
const GONE = 3500;

const {Cartesian3, Cartographic, Math: CesiumMath} = Cesium;
const LAKE_COLOR = '#bfe0ff';
const READOUT_COLOR = '#ffd27a';

// a place is entered within this distance of its name
const enterRadius = (place) => (place.type === 'GIPFEL' ? 800 : place.tier <= 4 ? 2500 : 1200);
const MAX_ENTER_RADIUS = 2500;
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * The rows of the property table of a glb tile, one object per name.
 * @param {ArrayBuffer} buffer
 * @return {Object<string, string | number>[]}
 */
function readNames(buffer) {
  const view = new DataView(buffer);
  const chunks = [];
  for (let offset = 12; offset < view.byteLength; ) {
    const length = view.getUint32(offset, true);
    chunks.push(new Uint8Array(buffer, offset + 8, length));
    offset += 8 + length;
  }
  const json = JSON.parse(new TextDecoder().decode(chunks[0]));
  const bin = chunks[1];
  const bufferView = (i) => {
    const v = json.bufferViews[i];
    return new DataView(bin.buffer, bin.byteOffset + (v.byteOffset ?? 0), v.byteLength);
  };
  const table = json.extensions.EXT_structural_metadata.propertyTables[0];
  const decoder = new TextDecoder();
  const columns = {};
  for (const [name, property] of Object.entries(table.properties)) {
    const values = bufferView(property.values);
    if (property.stringOffsets !== undefined) {
      const offsets = bufferView(property.stringOffsets);
      const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
      columns[name] = Array.from({length: table.count}, (_, i) =>
        decoder.decode(bytes.subarray(offsets.getUint32(4 * i, true), offsets.getUint32(4 * i + 4, true)))
      );
    } else {
      columns[name] = Array.from({length: table.count}, (_, i) => values.getFloat64(8 * i, true));
    }
  }
  return Array.from({length: table.count}, (_, i) => Object.fromEntries(Object.keys(columns).map((k) => [k, columns[k][i]])));
}

export default class FlyoverCaptions {
  constructor(viewer, flyover) {
    this.viewer = viewer;
    this.flyover = flyover;
    this.active = true;
    this.places = [];
    this.destroyed = false;
    // {place, since, card}: since in seconds of the run, -Infinity for a name shown at once
    this.shown = undefined;
    // {place, until}: the name the shown one replaced, fading out
    this.replaced = undefined;
    this.lastTime = undefined;
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'});
    viewer.container.append(this.canvas);
    this.removeListener = viewer.scene.postRender.addEventListener(() => this.draw());
    document.fonts.load('700 64px "Barlow Condensed"').then(() => viewer.scene.requestRender());
  }

  /**
   * Fetches the names of the places within their entry distance of the loaded track. A
   * tile that fails is left out.
   */
  async load() {
    const points = this.flyover.points;
    // a track point every half kilometer is enough to find the tiles near it
    const samples = [];
    for (const point of points) {
      if (!samples.length || Cartesian3.distance(samples.at(-1), point) > 500) samples.push(point);
    }
    const cartographics = samples.map((p) => Cartographic.fromCartesian(p));
    const radius = this.viewer.scene.ellipsoid.maximumRadius;
    const near = (region, meters) => {
      const [west, south, east, north] = region;
      return cartographics.some((c) => {
        const dLat = meters / radius;
        const dLon = dLat / Math.cos(c.latitude);
        return c.longitude > west - dLon && c.longitude < east + dLon && c.latitude > south - dLat && c.latitude < north + dLat;
      });
    };
    const tileset = await (await fetch(BASE + 'tileset.json')).json();
    const uris = [];
    // a tile's children are of its tier or a finer one
    const walk = (node) => {
      const uri = node.content?.uri;
      const tier = uri ? +uri.match(/zoomlevel(\d)/)[1] : 0;
      if (tier > CAPTION_TIER || !near(node.boundingVolume.region, MAX_ENTER_RADIUS)) {
        return;
      }
      if (uri) uris.push(uri);
      node.children?.forEach(walk);
    };
    walk(tileset.root);
    const rows = [];
    const queue = [...uris];
    await Promise.all(
      Array.from({length: TILES_IN_FLIGHT}, async () => {
        while (queue.length && !this.destroyed) {
          const uri = queue.shift();
          try {
            rows.push(...readNames(await (await fetch(BASE + uri)).arrayBuffer()));
          } catch (error) {
            console.warn(`Place names: tile ${uri} left out`, error);
          }
        }
      })
    );
    if (this.destroyed) return;
    const seen = new Set();
    this.places = rows
      .filter((row) => !seen.has(row.sourceId) && seen.add(row.sourceId))
      .map((row) => ({
        text: row.text,
        type: row.type,
        tier: +row.tier.replace('zoomlevel', ''),
        position: Cartesian3.fromDegrees(row.longitude, row.latitude, row.groundHeight),
      }));
    this.viewer.scene.requestRender();
  }

  /**
   * The place the marker is in, kept until the marker leaves it; then the place it
   * enters, the nearest relative to its entry distance. Between places the caption
   * stays on the last one until the marker is STALE past it. A place entered in playback
   * gets a card while the name it replaces fades out; after a jump the caption shows at
   * once, except at the start of the run.
   * @param {Cartesian3} marker
   * @param {number} time seconds of the run
   */
  update(marker, time) {
    const jump = this.lastTime === undefined || Math.abs(time - this.lastTime) > JUMP;
    this.lastTime = time;
    if (jump) {
      this.shown = undefined;
      this.replaced = undefined;
    }
    const inside = (place) => Cartesian3.distance(marker, place.position) < enterRadius(place);
    if (!this.shown || !inside(this.shown.place)) {
      let entered;
      let nearest = 1;
      for (const place of this.places) {
        const ratio = Cartesian3.distance(marker, place.position) / enterRadius(place);
        if (ratio < nearest) {
          entered = place;
          nearest = ratio;
        }
      }
      if (entered) {
        const animated = !jump || time === 0;
        if (this.shown) this.replaced = {place: this.shown.place, until: time};
        this.shown = {place: entered, since: animated ? time : -Infinity, card: animated};
      }
    }
  }

  /**
   * The name of a place, uppercase: a peak after a triangle, a lake in blue.
   * @return {{text: string, color: string}}
   */
  label(place) {
    const text = place.text.toUpperCase();
    return {text: place.type === 'GIPFEL' ? `▲ ${text}` : text, color: place.type === 'SEE' ? LAKE_COLOR : 'white'};
  }

  draw() {
    const dpr = window.devicePixelRatio;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
    }
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const marker = this.flyover.position;
    if (!this.active || !marker) return;
    const time = this.flyover.progress * this.flyover.duration;
    this.update(marker, time);

    // sizes follow the frame's short side. A portrait video is for phones, whose apps
    // cover its bottom and right edge: its captions go to the top left, the card to the
    // upper third; a landscape one keeps them at the bottom left and the lower third
    const short = Math.min(width, height);
    const portrait = height > width;
    const left = Math.max(0.05 * short, 24);
    const nameSize = Math.max(0.05 * short, 18);
    const readoutSize = Math.max(0.032 * short, 14);
    const spacing = 0.35 * readoutSize;
    const nameBaseline = portrait ? 0.08 * height + nameSize : height - Math.max(0.06 * short, 40) - readoutSize - spacing;
    const readoutBaseline = nameBaseline + spacing + readoutSize;
    const cardBaseline = portrait ? 0.28 * height : 0.8 * height;

    // a soft shade on the captions' side keeps them legible over bright ground
    const shade = ctx.createLinearGradient(0, portrait ? 0 : height, 0, portrait ? 0.4 * height : 0.6 * height);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, portrait ? 0 : 0.6 * height, width, 0.4 * height);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowOffsetY = 1;
    ctx.textAlign = 'left';
    const elevation = Cartographic.fromCartesian(marker).height - MARKER_HEIGHT;
    ctx.font = `600 ${readoutSize}px "Barlow Condensed", sans-serif`;
    ctx.letterSpacing = '0.12em';
    ctx.shadowBlur = 3;
    ctx.fillStyle = READOUT_COLOR;
    ctx.fillText(`ALT ${Math.round(elevation)} M`, left, readoutBaseline);

    ctx.letterSpacing = '0.06em';
    const name = (place, size, baseline, alpha) => {
      if (alpha <= 0) return;
      const {text, color} = this.label(place);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${size}px "Barlow Condensed", sans-serif`;
      ctx.shadowBlur = 0.16 * size;
      ctx.fillStyle = color;
      ctx.fillText(text, left, baseline);
    };
    // past the place, the name fades out
    const fresh = (place) => 1 - CesiumMath.clamp((Cartesian3.distance(marker, place.position) - STALE) / (GONE - STALE), 0, 1);
    if (this.replaced) {
      name(this.replaced.place, nameSize, nameBaseline, fresh(this.replaced.place) * (1 - ease((time - this.replaced.until) / CROSSFADE)));
    }
    if (this.shown) {
      const {place, since, card} = this.shown;
      const t = time - since;
      if (card) {
        // big on the card, then down to the caption
        ctx.font = '700 100px "Barlow Condensed", sans-serif';
        const big = Math.min(0.1 * short, (100 * (width - 2 * left)) / ctx.measureText(this.label(place).text).width);
        const appear = ease(t / FADE_IN);
        const shrink = ease((t - FADE_IN - HOLD) / SHRINK);
        const baseline = CesiumMath.lerp(cardBaseline, nameBaseline, shrink) + 0.02 * short * (1 - appear);
        name(place, CesiumMath.lerp(big, nameSize, shrink), baseline, appear * fresh(place));
      } else {
        name(place, nameSize, nameBaseline, ease(t / CROSSFADE) * fresh(place));
      }
    }
    ctx.restore();
  }

  destroy() {
    this.destroyed = true;
    this.removeListener();
    this.canvas.remove();
  }
}
