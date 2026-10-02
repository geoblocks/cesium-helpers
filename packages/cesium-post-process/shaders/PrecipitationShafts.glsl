// The shafts of the rain or the snow, at a fraction of the resolution: their opacity along each
// view ray, for Precipitation.glsl to shade. Along the part of the ray below the cloud base,
// patches of noise on the ground under each sample, more of them as it rains harder, slanting with
// the wind from the cloud base and drifting with it. Not dithered: at this resolution the dither
// shows as dots, where the patches are too soft to band. Needs EyeFromDepth, Noise, Height and
// PrecipitationWind.
uniform sampler2D depthTexture;
in vec2 v_textureCoordinates;

// samples along each ray, as far as SHAFT_DISTANCE, size of the patches in meters, extinction
// inside them per meter, about 6 km of visibility
const int SHAFT_STEPS = 12;
const float SHAFT_DISTANCE = 20000.0;
const float SHAFT_SIZE = 2500.0;
// snow hides more, about 2.5 km
const vec2 SHAFT_EXTINCTION = vec2(0.0006, 0.0015);
// the wind's speed, from its tilt of the drops' fall at 9 m/s, also in the snow: a drift changing
// with the snow would move the shafts
const float DRIFT_VELOCITY = 9.0;
// the shafts thin out over this height below the cloud base, into the clouds
const float SHAFT_TOP = 1000.0;

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 rayEnd = eye.w == 0.0 ? eye.xyz * SHAFT_DISTANCE : eye.xyz * min(1.0, SHAFT_DISTANCE / length(eye.xyz));
  float h0 = cameraHeight;
  float h1 = heightAt(rayEnd);
  float opacity = 0.0;
  if (min(h0, h1) < cloudBase) {
    float t0 = h0 > cloudBase ? (h0 - cloudBase) / (h0 - h1) : 0.0;
    float t1 = h1 > cloudBase ? (cloudBase - h0) / (h1 - h0) : 1.0;
    float threshold = mix(0.4, 0.0, intensity);
    vec3 upWorld = upWC();
    vec3 eastWorld = eastWC();
    // the gusts sway the shafts, but they drift with the steady wind
    float slant = tan(gustingTilt());
    float drift = DRIFT_VELOCITY * speed * tan(radians(wind)) * time;
    // the ray in world coordinates, once rather than for each sample
    vec3 rayWC = czm_inverseViewRotation * rayEnd;
    float density = 0.0;
    for (int i = 0; i < SHAFT_STEPS; i++) {
      float t = mix(t0, t1, (float(i) + 0.5) / float(SHAFT_STEPS));
      float h = heightAt(rayEnd * t);
      vec3 ground = czm_viewerPositionWC + rayWC * t - upWorld * h;
      ground -= eastWorld * ((cloudBase - h) * slant + drift);
      float top = clamp((cloudBase - h) / SHAFT_TOP, 0.0, 1.0);
      density += top * smoothstep(threshold - 0.3, threshold + 0.3, gradientNoise(ground / SHAFT_SIZE));
    }
    float depth = mix(SHAFT_EXTINCTION.x, SHAFT_EXTINCTION.y, snow) * (0.5 + 0.5 * intensity) * density * (t1 - t0) * length(rayEnd) / float(SHAFT_STEPS);
    opacity = 1.0 - exp(-depth);
  }
  out_FragColor = vec4(opacity, 0.0, 0.0, 1.0);
}
