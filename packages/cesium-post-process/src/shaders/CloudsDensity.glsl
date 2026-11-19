// The clouds' density at a point, which the march and the shadow map share: as tall and as solid
// as the rain under it is heavy, shaped by billows of noise. Needs clouds.js's SHADER_CONSTANTS,
// CloudsSlab and WeatherMap.
// the noise: the billows of the base shape in red, the details in green and blue
precision highp sampler2D;
uniform highp sampler3D cloudNoise;
// the finest details, a smaller cube that repeats every DETAIL_TILE, from cloud-noise.js
uniform highp sampler3D cloudDetail;
// the noise over the clouds' map, a square that repeats, from cloud-noise.js
uniform sampler2D mapNoise;
// meters above the ellipsoid
uniform float cloudTop;
// scale of the opacity
uniform float density;
// the coverage of the fair-weather cumulus over dry ground, 0 for none
uniform float fairWeather;

// the clouds over the lightest rain are THIN_DEPTH thick, in meters, and their base and top swing
// by BASE_SWING, BASE_DROP and TOP_SWING, constants clouds.js prepends. The clouds reach their full
// density over FLAT_BASE of their height from their base, a band the noise carves into an uneven
// underside; the lifting condensation level is about the same across an air mass, but no air mass
// is uniform: the base of each column rises and falls by BASE_SWING meters with a noise over 2 km,
// and the rain lowers it by up to BASE_DROP meters under the heaviest, where the air below is moist.
// The deck is full up to DECK_TOP of its height, then thins out to its top, the top of each column
// rising and falling by TOP_SWING of its depth with the coverage's noise over 8 km, higher where the
// clouds are fuller: neither end is one flat plane. A wider band at the base and a thinner full deck
// open holes to the ground in the decks over heavy rain. Towers thin out all the
// way up, in the convective envelope pow(1 - h, 1.5) (Schneider 2022), and spread an anvil from
// this share of their height to this one, their coverage raised to a power from 1 to this one,
// pow(coverage, remap(h, 0.7, 0.8, 1, lerp(1, 0.5, anvil_bias))) (Schneider 2017). Tuned by eye on
// the weather demo, not from a source
const float FLAT_BASE = 0.12;
const float DECK_TOP = 0.55;
const float TOWER_ENVELOPE = 1.5;
const vec3 ANVIL = vec3(0.7, 0.8, 0.5);
// the cloud shield over dry ground is broken: its coverage is this share of the clouds' over the
// rain, which the rain raises to the full
const float SHIELD_COVERAGE = 0.5;
// the coverage varies by up to these shares around its mean, by noise over 8 cells, 8 km of the
// radar's 1 km cells, and over 2, a pattern that is not the billows' noise, whose tile would show
// (Högfeldt 2016): over dry ground and light rain it breaks the shield into clouds with gaps between
// them, less as the rain is heavier, from the first intensity to the second, so that the heaviest
// rain falls from closed cloud. From a square of noise made once (cloud-noise.js), read once rather
// than computed at each sample, which spans this many of the map's cells, cloud-noise.js's
// MAP_TILE_CELLS. The map itself is softened and warped by cloud-map.js
const vec2 COVERAGE_NOISE = vec2(0.6, 0.35);
const vec2 OPEN_RAIN = vec2(0.3, 0.7);
// the fair-weather cumulus, which a radar does not see, over dry ground, where the shield's coverage
// is under FAIR_BLEND: columns as deep as the thinnest deck, puffy as a tower of this type, varied
// by the same noise as the coverage, this many times its variation, so that they gather in fields
// with clear sky between them, carved by the same billows as the rain's clouds (finer ones, read at
// another scale, alias far away and streak where the scale changes): the bright, separate puffs with
// dark flat bases of a day without rain
const float FAIR_BLEND = 0.3;
const float FAIR_TYPE = 1.0;
const float FAIR_FIELDS = 1.5;
const float MAP_TILE_CELLS = 64.0;
const float NOISE_CELL = 1000.0;

// the top of a column of clouds of a type, 0 to 1, its top swinging by -1 to 1, in meters above the
// ellipsoid: a deck THIN_DEPTH thick over drizzle to towers up to the cloud top over heavy rain
float cloudTopFor(float type, float swing) {
  return cloudBase + mix(THIN_DEPTH, cloudTop - cloudBase, type) * (1.0 + TOP_SWING * swing);
}

// the clouds' map at a point in world coordinates, its coverage varied, 0 outside the map; how far
// its base and its top swing, -1 to 1; and the coverage's variation, about -1 to 1
vec4 cloudMapAt(vec3 positionWC, out vec2 swing, out float variation) {
  vec2 uv = mapUv(positionWC);
  // the coverage's variation over 8 cells in red, over 2 in green, the base's in blue, -1 to 1, the
  // cells NOISE_CELL meters on the ground whatever the map's pixels, a map or none: east and north
  // on the sphere
  vec3 n = normalize(positionWC);
  vec2 ground = vec2(atan(n.y, n.x) * sqrt(1.0 - n.z * n.z), asin(n.z)) * czm_ellipsoidRadii.x;
  vec4 noise = texture(mapNoise, ground / (NOISE_CELL * MAP_TILE_CELLS)) * 2.0 - 1.0;
  // the top swings with the coverage, higher where the clouds are fuller
  swing = noise.br;
  variation = dot(COVERAGE_NOISE, noise.rg);
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
    return vec4(0.0);
  }
  vec4 texel = mix(texture(map, uv), texture(nextMap, uv), mapBlend);
  float open = 1.0 - smoothstep(OPEN_RAIN.x, OPEN_RAIN.y, texel.r);
  texel.g = clamp(texel.g * (1.0 + open * variation), 0.0, 1.0);
  return texel;
}
// extinction inside a solid cloud, per meter: about 1.3 km of visibility
const float EXTINCTION = 0.003;
// the noise repeats every this many meters, in 4 billows across, with this many voxels, clouds.js's
// NOISE_SIZE, and its details are about this size
const float NOISE_TILE = 16000.0;
const float NOISE_VOXELS = 64.0;
const float DETAIL_SIZE = 1000.0;
// the scale of the larger lookup of the noise, not a fraction that would line its tiles up
const float LARGE_SCALE = 0.27;
// the noise is read this many mipmaps blurrier than a pixel's footprint: its features then span a
// few pixels, rather than one, which each pixel's few samples would leave grainy
const float LOD_BIAS = 1.5;
// how much the details erode the thin edges of the clouds
const float EROSION = 0.6;
// the details are wisps at the base of a cloud, billows above this share of its height: inverted
// Worley noise at the base for "some nice whispy shapes" (Schneider 2015)
const float WISPY_BASE = 0.3;
// the finest details repeat every this many meters, with this many voxels, 62.5 m each (Schneider
// 2015's detail noise, a 32 voxel cube); they erode the edges by this much more, faded in as a
// pixel's footprint shrinks from the first size to the second, in meters: larger, sampled once a
// pixel, they would alias into speckles, and the shadow map's texels never see them
const float DETAIL_TILE = 2000.0;
const float DETAIL_VOXELS = 32.0;
const float FINE_EROSION = 0.5;
const vec2 FINE_FOOTPRINT = vec2(250.0, 60.0);
// the cauliflower lobes of a cumulus: the billows of the details push its surface out as well as in,
// by up to this share of the carve, inverted Worley noise of 1 km cells with the finest details' on
// them, lobes on the lobes (Schneider 2022's billowy composite); on columns of a type from the first
// value to the second, above this share of their height, decks left flat. They fade out as the
// pixel's footprint grows from the first size to the second, in meters, about 8 to 15 km away at
// 1280 pixels across: farther, a pixel is marched too seldom to build their shading, which shows as
// blotches of the 4 x 4 blocks
const float LOBES = 0.35;
const vec2 LOBE_TYPE = vec2(0.4, 0.6);
const vec2 LOBE_HEIGHT = vec2(0.25, 0.6);
const vec2 LOBE_FADE = vec2(7.0, 14.0);

// the lobes' weight at a pixel's footprint, in meters
float lobeFade(float footprint) {
  return 1.0 - smoothstep(LOBE_FADE.x, LOBE_FADE.y, footprint);
}

// the finest details at a point, 0 to 1, at the mipmap of a pixel's footprint
float finestDetail(vec3 positionWC, float footprint) {
  float lod = max(log2(footprint * DETAIL_VOXELS / DETAIL_TILE) + LOD_BIAS, 0.0);
  return textureLod(cloudDetail, fract(positionWC / DETAIL_TILE), lod).r;
}

// the cloud's density at a point, 0 to the density uniform, from the clouds' map (cloud-map.js):
// where its shield covers the ground, as tall as its type, a deck over drizzle to towers over heavy
// rain, and as solid as the rain under it is heavy, which it gives, with the share of the height of
// its column and its dimensional profile. The noise is read at the mipmap of the footprint of a
// pixel, in meters, and the details fade out as it grows: sampled once a pixel, finer noise would
// alias into speckles. The lobes of cumulus by this weight, 0 to 1, lobeFade's of the pixel's
// footprint for the march and its first sample toward the light, 0 for the others and the shadow
// map, whose texels are as wide as a lobe; it gives how lobed the point is, 0 to 1, and how much of
// it is fair-weather cumulus, 0 to 1
float cloudDensity(vec3 positionWC, float h, float footprint, float lobeWeight, out float rain, out float column, out float dimensional, out float lobed, out float cumulus) {
  // the rain in red, the shield's coverage in green, the clouds' type in blue
  vec2 swing;
  float variation;
  vec4 cell = cloudMapAt(positionWC, swing, variation);
  float m = cell.r;
  rain = m;
  column = 0.0;
  dimensional = 0.0;
  lobed = 0.0;
  cumulus = 0.0;
  // from the fair-weather cumulus over dry ground to the rain's clouds, as the shield covers it
  float shield = smoothstep(0.0, FAIR_BLEND, cell.g);
  // none where the noise is low, so that the clear sky between the fields skips the billows' reads
  float fair = min(fairWeather * (1.0 - shield) * max(1.0 + FAIR_FIELDS * variation, 0.0), 1.0);
  if (cell.g <= 0.0 && fair <= 0.0) {
    return 0.0;
  }
  // the cumulus' share of the coverage, 0 without them: the rain's clouds are as they are then
  float rainCoverage = cell.g * mix(SHIELD_COVERAGE, 1.0, m);
  float fairShare = fair / max(fair + rainCoverage, 1e-3);
  float rainType = cell.b * (1.0 - fairShare);
  float type = mix(cell.b, FAIR_TYPE, fairShare);
  float bottom = cloudBase + BASE_SWING * swing.x - BASE_DROP * m;
  // the cumulus' top the thinnest deck's, the slab's top over dry ground
  float top = cloudTopFor(rainType, swing.y);
  float y = (h - bottom) / (top - bottom);
  column = y;
  if (y <= 0.0 || y >= 1.0) {
    return 0.0;
  }
  // only within the column, where there may be cloud
  cumulus = fairShare;
  float base = clamp(y / FLAT_BASE, 0.0, 1.0);
  float profile = base * mix(1.0 - smoothstep(DECK_TOP, 1.0, y), pow(1.0 - y, TOWER_ENVELOPE), type);
  float lod = max(log2(footprint * NOISE_VOXELS / NOISE_TILE) + LOD_BIAS, 0.0);
  vec3 q = positionWC / NOISE_TILE;
  vec4 noise = textureLod(cloudNoise, fract(q), lod);
  // the same noise about four times larger, its axes swapped, breaks up the repetition of the tile,
  // which far views would show as a grid
  float large = textureLod(cloudNoise, fract(LARGE_SCALE * q.zxy + 0.5), max(lod + log2(LARGE_SCALE), 0.0)).r;
  noise.r = clamp(noise.r + 0.6 * (large - 0.5), 0.0, 1.0);
  float coverage = max(rainCoverage, fair);
  // the anvil of the rain's towers, not of the fair-weather cumulus
  coverage = pow(coverage, mix(1.0, mix(1.0, ANVIL.z, rainType), clamp((y - ANVIL.x) / (ANVIL.y - ANVIL.x), 0.0, 1.0)));
  dimensional = profile * coverage;
  // the profile times the coverage carves the noise rather than scaling it,
  // saturate(noise - (1 - dimensional_profile)) (Schneider 2022): the core stays solid, and only
  // the noise's highest billows reach the top and the base. Ramped up over a softness rather than
  // sharpened by a power as in Nubis Cubed (Schneider 2023): a sharper edge than this, between two
  // of the march's fine steps, shows as contour lines along it. The edges soften as the pixels grow,
  // which would otherwise cut them in steps of a pixel
  float soft = 0.05 + 0.45 * clamp(footprint / 2000.0, 0.0, 1.0);
  float billows = mix(noise.g, noise.b, 0.4);
  float carve = noise.r - (1.0 - dimensional);
  // the finest details at the point, read once, for the lobes or the erosion, whichever wants them
  // first: -1 until then
  float finest = -1.0;
  // the lobes of a cumulus, on the upper part of its column, where the carve's surface is
  lobed = lobeWeight * smoothstep(LOBE_TYPE.x, LOBE_TYPE.y, type) * smoothstep(LOBE_HEIGHT.x, LOBE_HEIGHT.y, y);
  float band = LOBES * lobed;
  if (abs(carve) < band) {
    finest = finestDetail(positionWC, footprint);
    // fading out toward the edge of the band, so that the surface it moves does not end there in a
    // step, a hole cut in the core along it
    carve += band * (noise.b + finest - 1.0) * (1.0 - smoothstep(0.5, 1.0, abs(carve) / band));
  }
  float shape = smoothstep(0.0, soft, carve);
  // the details erode where the cloud is thin, its edges, and leave its core solid
  float wispy = clamp(y / WISPY_BASE, 0.0, 1.0);
  float detail = mix(1.0 - billows, billows, wispy) * (1.0 - smoothstep(0.25, 0.5, footprint / DETAIL_SIZE));
  float erosion = EROSION * detail * (1.0 - shape);
  // the finest details, on the edges only: the core is solid, and outside the cloud there is nothing
  // to erode
  float fine = 1.0 - smoothstep(FINE_FOOTPRINT.y, FINE_FOOTPRINT.x, footprint);
  if (fine > 0.0 && shape > 0.0 && shape < 1.0) {
    if (finest < 0.0) {
      finest = finestDetail(positionWC, footprint);
    }
    erosion = min(erosion + FINE_EROSION * fine * mix(1.0 - finest, finest, wispy) * (1.0 - shape), 0.95);
  }
  return density * clamp((shape - erosion) / (1.0 - erosion), 0.0, 1.0);
}
