// Clouds from a map of the rain, raymarched at a fraction of the resolution: the light they scatter
// toward the camera, and the share of the scene still seen through them, along each view ray. They
// fill a slab above the cloud base where the map has rain: a flat layer over drizzle, towers up to
// the cloud top over the heaviest rain, with a rounded base and top, shaped by billows of noise
// that repeats in world coordinates, read from a texture made once (cloud-noise.js): wispy over
// light rain and solid over heavy rain, with details eroding their edges, not their cores. The sun lights them through a few
// samples toward it, with a silver lining toward it, and the sky lights them, brighter at their
// top: thick clouds are dark gray from below and white from above. The steps are short near the
// camera and longer with the distance, so a camera inside a cloud is in its fog. Precipitation,
// activated after them, draws the rain's haze over them. Needs EyeFromDepth, Height, WeatherMap and
// RainHaze, for its daylight.
uniform sampler2D depthTexture;
// the noise: the billows of the base shape in red, the details in green and blue
uniform highp sampler3D cloudNoise;
// meters above the ellipsoid
uniform float cloudBase;
uniform float cloudTop;
// scale of the opacity
uniform float density;
in vec2 v_textureCoordinates;

const int STEPS = 32;
// the ray is marched as far as this from where it enters the slab, in meters, not from the camera:
// from far above, the slab itself is farther than that. A grazing ray marched farther would take
// steps longer than the billows and turn the far clouds into streaks; deeper than this into the
// slab, it is nearly always behind a cloud
const float MAX_DISTANCE = 40000.0;
// the clouds over the lightest rain are this thick, in meters
const float THIN_DEPTH = 1500.0;
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
// few pixels of the pass, rather than one that the upscale would turn into a square
const float LOD_BIAS = 1.5;
// how much the details erode the thin edges of the clouds
const float EROSION = 0.6;
// the sun's light through the cloud, sampled at these distances toward it, in meters
const vec2 LIGHT_DISTANCES = vec2(200.0, 700.0);
// the sky's light on the clouds at their base and at their top, the sun's, and the moon's share of
// the sky's at night, a faintly cool white
const vec3 AMBIENT_BASE = vec3(0.32, 0.35, 0.40);
const vec3 AMBIENT_TOP = vec3(0.62, 0.66, 0.72);
const float SUN = 0.8;
const vec3 MOONLIGHT = vec3(0.60, 0.63, 0.70);

// where the height along the view ray, at a distance t in direction k = dot(direction, up), reaches
// c: the height is cameraHeight + k t + (1 - k k) t t / (2 radius), as heightAt's. False if it never
// does. Without the cancellation of the textbook formula, also for a vertical ray, where the
// quadratic term is 0
bool crossings(float c, float k, out float near, out float far) {
  float a = (1.0 - k * k) / (2.0 * radius);
  float d = cameraHeight - c;
  float discriminant = k * k - 4.0 * a * d;
  if (discriminant < 0.0) {
    return false;
  }
  float q = -0.5 * (k + (k < 0.0 ? -1.0 : 1.0) * sqrt(discriminant));
  q = q == 0.0 ? 1e-9 : q;
  float r0 = a > 1e-12 ? q / a : (q > 0.0 ? 1e20 : -1e20);
  float r1 = d / q;
  near = min(r0, r1);
  far = max(r0, r1);
  return true;
}

// the part of the ray in the slab, from where it enters it to where it leaves it, meets the
// ground or is MAX_DISTANCE long; empty when it misses the slab
vec2 slab(float k, float sceneDistance) {
  float near;
  float far;
  // always above the tops
  if (!crossings(cloudTop, k, near, far)) {
    return vec2(0.0);
  }
  float start = max(near, 0.0);
  float end = far;
  if (crossings(cloudBase, k, near, far)) {
    if (cameraHeight >= cloudBase) {
      // going down below the base
      if (near > 0.0) {
        end = min(end, near);
      }
    } else {
      // coming up through the base
      start = max(start, far);
    }
  }
  end = min(end, min(sceneDistance, start + MAX_DISTANCE));
  return vec2(start, max(end, start));
}

// the cloud's density at a point, 0 to the density uniform: as tall and as solid as the rain under
// it is heavy. The noise is read at the mipmap of the footprint of a pixel, in meters, and the
// details fade out as it grows: sampled once a pixel, finer noise would alias into speckles
float cloudDensity(vec3 positionWC, float h, float footprint) {
  float m = mapAt(positionWC);
  if (m <= 0.0) {
    return 0.0;
  }
  float top = cloudBase + mix(THIN_DEPTH, cloudTop - cloudBase, m * m);
  float y = (h - cloudBase) / (top - cloudBase);
  if (y <= 0.0 || y >= 1.0) {
    return 0.0;
  }
  float profile = smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.55, 1.0, y));
  float lod = max(log2(footprint * NOISE_VOXELS / NOISE_TILE) + LOD_BIAS, 0.0);
  vec3 q = positionWC / NOISE_TILE;
  vec4 noise = textureLod(cloudNoise, fract(q), lod);
  // the same noise about four times larger, its axes swapped, breaks up the repetition of the tile,
  // which far views would show as a grid
  float large = textureLod(cloudNoise, fract(LARGE_SCALE * q.zxy + 0.5), max(lod + log2(LARGE_SCALE), 0.0)).r;
  noise.r = clamp(noise.r + 0.6 * (large - 0.5), 0.0, 1.0);
  // even drizzle has a broken layer of cloud over it; the edges soften as the pixels grow, which
  // would otherwise cut them in steps of the pass's resolution
  // rising from 0 at the edge of the rain, which a jump would cut in squares of the map's pixels
  float coverage = 0.3 * smoothstep(0.0, 0.15, m) + 0.7 * m;
  float soft = 0.15 + 0.35 * clamp(footprint / 2000.0, 0.0, 1.0);
  float shape = smoothstep(1.0 - coverage - soft, 1.0 - coverage + soft, noise.r);
  // the details erode where the cloud is thin, its edges, and leave its core solid
  float detail = mix(noise.g, noise.b, 0.4) * (1.0 - smoothstep(0.25, 0.5, footprint / DETAIL_SIZE));
  float erosion = EROSION * detail * (1.0 - shape);
  return density * profile * clamp((shape - erosion) / (1.0 - erosion), 0.0, 1.0);
}

// Henyey-Greenstein's phase function, times 4 pi: 1 for light scattered alike in all directions
float phase(float cosTheta, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
}

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 direction = normalize(eye.xyz);
  // the sky is past the slab: the slab ends its rays
  float sceneDistance = eye.w == 0.0 ? 1e9 : length(eye.xyz);
  vec2 segment = slab(dot(direction, up), sceneDistance);
  float span = segment.y - segment.x;
  if (span <= 0.0) {
    out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 directionWC = czm_inverseViewRotation * direction;
  vec3 lightWC = czm_inverseViewRotation * czm_lightDirectionEC;
  // a forward lobe for the silver lining, a weak backward one
  float cosTheta = dot(direction, czm_lightDirectionEC);
  float scattering = mix(phase(cosTheta, -0.2), phase(cosTheta, 0.6), 0.7);
  float day = daylight();
  vec3 sunLight = SUN * czm_lightColor * day * scattering;
  vec3 sky = mix(MOONLIGHT, vec3(1.0), day);
  // interleaved gradient noise, a different start along the ray for each pixel
  // the angle a pixel of this pass covers
  float pixelAngle = 2.0 / (czm_projection[1][1] * czm_viewport.w);
  float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  vec3 light = vec3(0.0);
  float transmittance = 1.0;
  for (int i = 0; i < STEPS; i++) {
    float s = (float(i) + jitter) / float(STEPS);
    float t = segment.x + span * s * s;
    float dt = span * (2.0 * s + 1.0 / float(STEPS)) / float(STEPS);
    vec3 pointEC = direction * t;
    float h = heightAt(pointEC);
    vec3 pointWC = czm_viewerPositionWC + directionWC * t;
    float footprint = t * pixelAngle;
    float sigma = EXTINCTION * cloudDensity(pointWC, h, footprint);
    if (sigma <= 0.0) {
      continue;
    }
    // the sun's light through the cloud toward it, darker at the edges facing it than a plain
    // exponential would make them
    float opticalDepth = 0.0;
    float previous = 0.0;
    for (int j = 0; j < 2; j++) {
      float distanceToward = LIGHT_DISTANCES[j];
      opticalDepth += EXTINCTION * cloudDensity(pointWC + lightWC * distanceToward, heightAt(pointEC + czm_lightDirectionEC * distanceToward), footprint) * (distanceToward - previous);
      previous = distanceToward;
    }
    float sunThrough = exp(-opticalDepth) * (1.0 - 0.5 * exp(-2.0 * opticalDepth));
    float y = clamp((h - cloudBase) / (cloudTop - cloudBase), 0.0, 1.0);
    vec3 scattered = sunLight * sunThrough + mix(AMBIENT_BASE, AMBIENT_TOP, y) * sky;
    float stepTransmittance = exp(-sigma * dt);
    light += transmittance * scattered * (1.0 - stepTransmittance);
    transmittance *= stepTransmittance;
    if (transmittance < 0.03) {
      break;
    }
  }
  out_FragColor = vec4(min(light, vec3(1.0)), transmittance);
}
