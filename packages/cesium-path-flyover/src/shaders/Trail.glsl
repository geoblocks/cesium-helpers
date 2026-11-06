// The track as a trail on a 3D polyline, in two layers, each on a polyline of its own width. Behind the marker, a
// comet's tail: a white-hot core at the marker, cooling to the color over a few hundred meters, and a glow, wide at
// the marker, narrower down the tail. Ahead, the way still to go: a thin white line on a dark edge, without glow.
// Cesium extrudes a polyline on screen, so st.t runs across it in pixels: no slope changes its width.
// st.s runs along it by distance (see ST_ALONG).
uniform vec4 color;
// the marker's place along the line, as st.s
uniform float progress;
// the line's length, meters
uniform float trackLength;
// the polyline's width, CSS pixels
uniform float width;
// 1 the glow's layer, 0 the line's
uniform float glow;

const vec3 HOT = vec3(1.0, 0.95, 0.82);
const vec3 AHEAD = vec3(1.0);
const vec3 EDGE = vec3(0.17, 0.11, 0.06);
// meters behind the marker over which the tail cools, by e
const float COOLING = 300.0;

// 1 inside radius, 0 outside, over a pixel of antialiasing
float disc(float radius, float d) {
  return 1.0 - smoothstep(radius - 0.5, radius + 0.5, d);
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  // CSS pixels from the center line
  float d = abs(materialInput.st.t - 0.5) * width;
  float behind = progress - materialInput.st.s;
  vec4 fragColor;
  if (behind < 0.0) {
    if (glow > 0.5) {
      discard;
    }
    fragColor = vec4(mix(EDGE, AHEAD, disc(1.25, d)), disc(2.25, d) * 0.8);
  } else {
    // 1 at the marker, toward 0 down the tail
    float heat = exp(-behind * trackLength / COOLING);
    if (glow > 0.5) {
      float sigma = 2.5 + 3.0 * heat;
      // brighter than the color, so that it lights the ground rather than dims it
      fragColor = vec4(mix(color.rgb, HOT, 0.25), exp(-0.5 * d * d / (sigma * sigma)) * (0.35 + 0.35 * heat) * color.a);
    } else {
      // white-hot in the middle of the core, near the marker
      fragColor = vec4(mix(color.rgb, HOT, disc(1.0, d) * heat), disc(2.0 + 0.5 * heat, d) * color.a);
    }
  }
  fragColor = czm_gammaCorrect(fragColor);
  material.emission = fragColor.rgb;
  material.alpha = fragColor.a;
  return material;
}
