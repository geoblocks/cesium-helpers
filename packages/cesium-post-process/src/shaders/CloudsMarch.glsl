// Clouds from a map of the rain, raymarched for one pixel of each block of 4 x 4 at each frame, in
// a texture of a quarter of the resolution, CloudsResolve.glsl building the full resolution from
// them over the frames: the light they scatter toward the camera, the share of the scene still seen
// through them, and how far they are, along the pixel's view ray. They
// fill a slab about the cloud base where the map has rain: a deck over drizzle, towers up to the
// cloud top over the heaviest rain, their bases and tops uneven, shaped by billows of noise
// that repeats in world coordinates, read from a texture made once (cloud-noise.js): wispy over
// light rain and solid over heavy rain, with details eroding their edges, not their cores. The sun lights them through a few
// samples toward it, with a silver lining toward it, its light scattered more than once brightening
// their cores, and the sky lights them, brighter at their top; the light on their top reaches
// their lower parts scattered many times, through as much cloud as the shadow map finds above
// them: an overcast is gray from below, lighter under its thin parts, and white from above. The steps are short near the camera and longer with the distance, so
// a camera inside a cloud is in its fog; across the empty air they are four times as long, and short
// again in the clouds, lit only there. Precipitation, activated after them, draws the rain's haze
// over them. Needs EyeFromDepth, Hash, Height, CloudsSlab, WeatherMap, CloudsDensity, CloudsShadow,
// Fog, Phase, CloudLight and RainHaze.
precision highp sampler2D;
uniform sampler2D depthTexture;
// the highest rain around each block of the map's pixels, over both maps, from weather-map.js
uniform sampler2D maxMap;
// the frames drawn, for the jitter to change at each of a pixel's marches
uniform float frame;
// the pixel of each block of 4 x 4 marched this frame, and the scene's size in pixels, from
// clouds.js
uniform vec2 frameOffset;
uniform vec2 sceneSize;

// the ray's samples: FINE_STEPS of them from its start to its end, closer near the camera; across
// the empty air a coarse step spans COARSE of them, and where it finds a cloud the march steps
// back to the last empty one and goes on fine, lighting each sample, until EMPTY fine samples in a
// row find none (the cheap and the expensive samples of Schneider 2015): the steps in the clouds
// are short, for their edges to be sharp, and the empty air costs a sample every COARSE. At most
// MAX_SAMPLES, the fine steps and a few steps back: a ray through a long, thin cloud is marched to
// its end
const int FINE_STEPS = 64;
const int COARSE = 4;
const int EMPTY = 4;
const int MAX_SAMPLES = 72;
// the clouds fade out over the last part of the march, past this share of MAX_DISTANCE from where
// the ray enters the slab, so that its end is not an edge
const float FAR_FADE = 0.6;
// below this transmittance, the samples are lit from the shadow map alone
const float CHEAP_LIGHT = 0.8;
// the ray is probed at this many points of the max map before its march, less than a block of it
// apart over MAX_DISTANCE, 5 km for the 4 km blocks of a 1 km map: the march starts where the ray
// drops below the tallest cloud they find, and is skipped where they find no rain, rather than
// spending its steps in the empty air above the clouds (the coverage early-out of Schneider 2015)
const int RAY_PROBES = 8;
// the sun's light through the cloud, sampled at these distances toward it, in meters. Among the
// lobes of a cumulus, at these three, the first within a lobe's width, through the lobes and with
// the extinction of a real cumulus' edge, about 0.01 per meter rather than the deck's EXTINCTION,
// so that a lobe shades the crevice behind it a few tens of meters in; the others, the eye and the
// clouds without lobes keep the deck's, for which an overcast from below stays gray rather than
// black and the sunlit lobes near white
const vec2 LIGHT_DISTANCES = vec2(200.0, 700.0);
const vec3 LOBE_LIGHT_DISTANCES = vec3(60.0, 180.0, 500.0);
const float LOBE_EXTINCTION = 0.01;
// the sky's light on the clouds at their base and at their top, by day, and the moon's share of it
// at night. By day, their tops see the sky overhead, in the color of Cesium's at its luminance, and
// their bases the sunlight the ground bounces (Hillaire 2016, sec. 5.5.1), less as the sun is lower
// than this sine of its height. Cesium's sky itself, and an albedo of 0.1 to 0.3 for the ground,
// would leave the tops gray: our few samples toward the sun let little of it through
const vec3 AMBIENT_BASE = vec3(0.32, 0.35, 0.40);
const vec3 AMBIENT_TOP = vec3(0.62, 0.66, 0.72);
const float HIGH_SUN = 0.5;
// the sky's light inside a cloud is occluded by its dimensional profile, its height profile times
// its coverage, pow(1 - dimensional_profile, 0.5) (Schneider 2022): bright at its edges and top,
// dark in its core; and by the lack of light from below at its base, in the share of its column's height
// pow(remap(h, 0.07, 0.14, 0.1, 1.0), 0.8) (Schneider 2017): its bases are dark
const vec2 DARK_BASE = vec2(0.07, 0.14);
// the clouds over the heaviest rain absorb this share of the light they intercept, for the
// "foreboding dark clouds" of Horizon Zero Dawn (Schneider 2015)
const float RAIN_ALBEDO = 0.6;
// the sun's light scattered more than once, as octaves of the light scattered once (Wrenninge's,
// Hillaire 2016, sec. 5.8, eq. 19-20): octave n has a^n of the scattering, b^n of the extinction and
// c^n of the phase's eccentricity, so it reaches deeper into the cloud, more alike in all
// directions. a <= b keeps it from scattering more light than reaches it; 0.5 each, Unreal's
// defaults, and 2 octaves, as Unreal and RDR2
const int OCTAVES = 2;
const float OCTAVE_SCATTERING = 0.5;
const float OCTAVE_EXTINCTION = 0.5;
const float OCTAVE_ECCENTRICITY = 0.5;
// the silver lining: a narrow lobe toward the sun, the larger of it and the broad phase, this
// eccentric and this strong, max(HG(g), silver_intensity HG(0.99 - silver_spread)) (Schneider 2015):
// thin edges near the sun glow, where the broad lobe's 0.6 lights them a tenth as much
const float SILVER_G = 0.87;
const float SILVER = 0.35;
// the light on the top of the cloud above a point that reaches it scattered many times, which the
// few samples toward the sun miss and which makes an overcast gray rather than black from below:
// CloudLight.glsl's twoStream, less the direct beam that the samples toward the sun carry,
// exp(-tau / mu) along its slanted path, the sun mu high
const vec3 MOONLIGHT = vec3(0.60, 0.63, 0.70);
// at night, the moon lights them from its direction, this much of the sun's light, in the moonlight's
// tint, as it rises above the horizon: by day the sun is their one light, at night the moon
const float MOON = 0.1;

// Henyey-Greenstein's phase function, times 4 pi: 1 for light scattered alike in all directions
float phase(float cosTheta, float g) {
  return 4.0 * czm_pi * henyeyGreenstein(cosTheta, g);
}

// the march's output, in a texture of 32-bit floats read texel by texel: the light's red and green
// packed as two halves in red, its blue in green, the distance in blue, 0 where the ray meets no
// slab, and the transmittance in alpha; one output, which a post-process stage has, rather than
// two. The green half is kept a normal half, at least 2^-14, so that the float the two make is never
// a denormal a GPU may flush to 0 with the red
vec4 packCloud(vec3 light, float transmittance, float distance) {
  return vec4(uintBitsToFloat(packHalf2x16(vec2(light.r, max(light.g, 6.2e-5)))), light.b, distance, transmittance);
}

void main() {
  // the pixel of the block this texel stands for, marched this frame
  vec2 pixel = min(BLOCK * floor(gl_FragCoord.xy) + frameOffset, sceneSize - 1.0) + 0.5;
  vec2 uv = pixel / sceneSize;
  vec4 eye = eyeAt(depthTexture, uv);
  vec3 direction = normalize(eye.xyz);
  // the sky past the slab: the slab ends its rays
  float sceneDistance = eye.w == 0.0 ? BEYOND_SLAB : length(eye.xyz);
  vec2 segment = slab(dot(direction, up), sceneDistance, slabTop);
  float span = segment.y - segment.x;
  if (span <= 0.0) {
    out_FragColor = packCloud(vec3(0.0), 1.0, 0.0);
    return;
  }
  vec3 directionWC = czm_inverseViewRotation * direction;
  // the clouds' map's coverage, and its tallest type
  float covered = 0.0;
  float highest = 0.0;
  for (int k = 0; k < RAY_PROBES; k++) {
    vec2 uv = mapUv(czm_viewerPositionWC + directionWC * (segment.x + span * (float(k) + 0.5) / float(RAY_PROBES)));
    if (all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)))) {
      vec4 cell = texture(maxMap, uv);
      covered = max(covered, cell.g);
      highest = max(highest, cell.b);
    }
  }
  // a ray that meets no shield meets only the fair-weather cumulus, everywhere off it, as deep as the
  // thinnest deck: half the fine steps are short enough there
  int fineSteps = covered > 0.0 ? FINE_STEPS : FINE_STEPS / 2;
  covered = max(covered, fairWeather);
  segment = slab(dot(direction, up), sceneDistance, cloudTopFor(highest, 1.0));
  span = segment.y - segment.x;
  if (covered <= 0.0 || span <= 0.0) {
    // no cloud seen: the middle of the segment, where a camera inside the slab still moves past it
    out_FragColor = packCloud(vec3(0.0), 1.0, 0.5 * (segment.x + segment.y));
    return;
  }
  float day = daylight();
  // the light they are lit by, the sun by day, the moon at night
  vec3 lightEC = day > 0.0 ? czm_lightDirectionEC : czm_moonDirectionEC;
  vec3 lightWC = czm_inverseViewRotation * lightEC;
  // a forward lobe for the silver lining, a weak backward one, for each octave: the light is a
  // direction, the angle is the same along the ray
  float cosTheta = dot(direction, lightEC);
  float octaves[OCTAVES];
  float contribution = 1.0;
  float eccentricity = 1.0;
  for (int n = 0; n < OCTAVES; n++) {
    octaves[n] = contribution * max(mix(phase(cosTheta, -0.2 * eccentricity), phase(cosTheta, 0.6 * eccentricity), 0.7), SILVER * phase(cosTheta, SILVER_G * eccentricity));
    contribution *= OCTAVE_SCATTERING;
    eccentricity *= OCTAVE_ECCENTRICITY;
  }
  // the far clouds fade into the sky behind them as Cesium's fog fades the terrain, by its factor at
  // each step's distance: the same aerial perspective on the clouds as on the earth, without which
  // "a visual discrepancy happens at the horizon between clouds and earth" (Hillaire 2016, sec.
  // 5.9.1). The sky toward the view, at least SKY_ELEVATION above the horizon
  vec3 fogColor = skyToward(direction, max(asin(clamp(dot(direction, up), -1.0, 1.0)), SKY_ELEVATION));
  vec3 sun = sunOnClouds();
  // the moon's light fading in as the sun goes on down after daylight() is 0, so that it does not
  // pop on at dusk
  float night = 1.0 - smoothstep(-0.25, -0.1, dot(up, czm_sunDirectionEC));
  vec3 sunLight = day > 0.0 ? sun * day : MOON * MOONLIGHT * night * smoothstep(0.0, 0.1, dot(up, czm_moonDirectionEC));
  // the sky overhead, and the sunlight from the ground, by day; the moon's at night
  vec3 zenith = clearSkyBelow(cloudBase, czm_inverseViewRotation * up, czm_lightDirectionWC);
  vec3 skyAbove = mix(MOONLIGHT, skyHueOf(zenith), day) * czm_luminance(AMBIENT_TOP);
  vec3 groundBelow = AMBIENT_BASE * mix(MOONLIGHT, czm_lightColor * clamp(dot(up, czm_lightDirectionEC) / HIGH_SUN, 0.0, 1.0), day);
  float sunHeight = max(dot(up, czm_lightDirectionEC), 0.0);
  vec3 onTop = lightOnClouds(zenith, day, sun);
  // the angle a pixel of the scene covers: the full resolution is built from the marches
  float pixelAngle = 2.0 / (czm_projection[1][1] * sceneSize.y);
  // a different start along the ray for each pixel, at random, and at each of its marches, one in
  // 16 frames, by the golden ratio (Wolfe 2020): interleaved gradient noise's diagonal pattern
  // would show, each pixel being marched so seldom
  float jitter = fract(hash(pixel) + 0.618034 * floor(frame / (BLOCK * BLOCK)));
  // the distance of what the march sees, weighted by the light it hides, for the reprojection
  float distanceSum = 0.0;
  float distanceWeight = 0.0;
  vec3 light = vec3(0.0);
  float transmittance = 1.0;
  float rain;
  float column;
  float dimensional;
  float unused;
  // the fine step the march is at, whether it goes coarse, the empty fine samples in a row, and the
  // fine step a coarse one found a cloud at, which it does not go coarse again before
  int k = 0;
  bool coarse = true;
  int empty = 0;
  int found = 0;
  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (k >= fineSteps) {
      break;
    }
    float s = (float(k) + jitter) / float(fineSteps);
    float t = segment.x + span * s * s;
    vec3 pointEC = direction * t;
    float h = heightAt(pointEC);
    vec3 pointWC = czm_viewerPositionWC + directionWC * t;
    float footprint = t * pixelAngle;
    float lobes = lobeFade(footprint);
    float lobed;
    float density = cloudDensity(pointWC, h, footprint, lobes, rain, column, dimensional, lobed);
    if (coarse) {
      if (density > 0.0) {
        coarse = false;
        empty = 0;
        found = k;
        k = max(k - COARSE + 1, 0);
      } else {
        k += COARSE;
      }
      continue;
    }
    k++;
    float sigma = EXTINCTION * density * (1.0 - smoothstep(FAR_FADE, 1.0, (t - segment.x) / MAX_DISTANCE));
    if (sigma <= 0.0) {
      empty++;
      coarse = empty >= EMPTY && k > found;
      continue;
    }
    empty = 0;
    float dt = span * (2.0 * s + 1.0 / float(fineSteps)) / float(fineSteps);
    // the light through the cloud toward it; by day, behind cloud that hides a fifth of what is
    // behind it, from the shadow map alone, whose light reaches the eye dimmed by it (the cheap
    // light samples of Schneider 2015, there past a transmittance of 0.7: alike to the eye, and
    // cheaper). The shadow map is the sun's: by the moon, the samples alone
    bool cheap = day > 0.0 && transmittance <= CHEAP_LIGHT;
    float opticalDepth = 0.0;
    float previous = 0.0;
    // from the two samples to the lobes' three as the point is lobed, the third of the two none long,
    // so that the light does not change in a step where the lobes begin
    vec3 distances = mix(LIGHT_DISTANCES.xyy, LOBE_LIGHT_DISTANCES, lobed);
    for (int j = 0; j < (cheap ? 0 : lobed > 0.0 ? 3 : 2); j++) {
      // jittered as the step, for the samples of neighboring pixels not to band (Hillaire 2016,
      // sec. 5.5.2); without the finest details, which a ray a few hundred meters long toward the
      // light does not see, but for the first among the lobes, which sees the lobes on the lobes
      float distanceToward = distances[j] * (0.75 + 0.5 * jitter);
      bool first = j == 0;
      float extinction = first ? mix(EXTINCTION, LOBE_EXTINCTION, lobed) : EXTINCTION;
      float sampleFootprint = first ? mix(FINE_FOOTPRINT.x, max(footprint, FINE_FOOTPRINT.y), lobed) : FINE_FOOTPRINT.x;
      opticalDepth += extinction * cloudDensity(pointWC + lightWC * distanceToward, heightAt(pointEC + lightEC * distanceToward), max(footprint, sampleFootprint), first ? lobes : 0.0, unused, unused, unused, unused) * (distanceToward - previous);
      previous = distanceToward;
    }
    // the samples reach 700 m toward the sun, 500 m among the lobes, a fifth of the way through a deck 1500 m thick under a
    // sun 23 degrees high: the shadow map has the whole way, so where the samples find a thin spot
    // deep in the cloud the sun does not shine through it. Its texels and its four depths are too
    // coarse for the billows near the top of a column, which the samples alone light
    float shadowed = day > 0.0 ? shadowDepth(pointWC) : 0.0;
    float deep = 1.0 - clamp(column, 0.0, 1.0);
    // without the samples, the cloud at the point taken to go on toward the light as far as they
    // reach, so that the top of a column, where the shadow map is not read, is not in full sun
    opticalDepth = max(cheap ? sigma * LIGHT_DISTANCES.x : opticalDepth, shadowed * deep);
    float sunThrough = 0.0;
    float occlusion = 1.0;
    for (int n = 0; n < OCTAVES; n++) {
      sunThrough += octaves[n] * exp(-opticalDepth * occlusion);
      occlusion *= OCTAVE_EXTINCTION;
    }
    float y = clamp((h - cloudBase) / (cloudTop - cloudBase), 0.0, 1.0);
    float ambientOcclusion = sqrt(max(1.0 - dimensional, 0.0)) * pow(mix(0.1, 1.0, clamp((column - DARK_BASE.x) / (DARK_BASE.y - DARK_BASE.x), 0.0, 1.0)), 0.8);
    // the clouds above the point, from the shadow map along the sun's rays, as deep as they are
    // thick: lighter under their thin parts, darker under their thick ones; deep in its column, as
    // toward its top the samples toward the sun and their octaves already carry the light
    // scattered there
    float tau = shadowed * sunHeight;
    float diffuse = (twoStream(tau) - exp(-shadowed)) * deep;
    vec3 scattered = sunLight * sunThrough + mix(groundBelow, skyAbove, y) * ambientOcclusion + onTop * diffuse;
    float stepTransmittance = exp(-sigma * dt);
    // the light scattered over the step, the integral of the source over it, (S - S T) / sigma_t
    // (Hillaire 2016, eq. 17): the albedo, sigma_s / sigma_t, of what the step intercepts
    vec3 seen = czm_fog(t, scattered * mix(1.0, RAIN_ALBEDO, rain), fogColor, czm_fogVisualDensityScalar);
    light += transmittance * seen * (1.0 - stepTransmittance);
    distanceSum += t * transmittance * (1.0 - stepTransmittance);
    distanceWeight += transmittance * (1.0 - stepTransmittance);
    transmittance *= stepTransmittance;
    if (transmittance < 0.03) {
      break;
    }
  }
  // without a cloud seen, where the ray enters the slab, near what is seen of it from outside
  out_FragColor = packCloud(min(light, vec3(1.0)), transmittance, distanceWeight > 1e-4 ? distanceSum / distanceWeight : 0.5 * (segment.x + segment.y));
}
