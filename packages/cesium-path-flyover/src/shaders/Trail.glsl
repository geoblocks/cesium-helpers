// The track as a trail: a core on a thin dark edge, as cesium-overlay draws its lines, the color behind the
// marker, white ahead. st.s runs along the whole line, st.t across it.
uniform vec4 color;
// the marker's fraction of the line's length
uniform float progress;
// the geometry's width, pixels, measured level (TRAIL_WIDTH)
uniform float width;

const vec3 AHEAD = vec3(1.0);
const vec3 EDGE = vec3(0.17, 0.11, 0.06);

// 1 inside radius, 0 outside, over a pixel of antialiasing
float disc(float radius, float d) {
  return 1.0 - smoothstep(radius - 0.5, radius + 0.5, d);
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  // CSS pixels from the center line, on screen. Cesium measures st.t level, off a vertical plane through
  // the line (PolylineShadowVolumeFS): a slope seen from low down spreads it over many pixels, flat ground
  // seen from low down squeezes it. Its change per pixel gives the distance on screen; it is taken by 2x2
  // pixel blocks, an error that grows with the distance from the center: a narrow line keeps it small. The
  // level distance, at 0.4 of it, bounds it from below: unbounded, the error frays the edges seen at a graze;
  // below 0.4 (the ground seen less than about 24 degrees down) the line thins
  float across = abs(materialInput.st.t - 0.5);
  float perPixel = length(vec2(dFdx(materialInput.st.t), dFdy(materialInput.st.t))) * czm_pixelRatio;
  float d = max(across * width * 0.4, across / max(perPixel, 1e-6));
  bool behind = materialInput.st.s <= progress;
  // core and edge radii, pixels: the edge 1.25 past the core
  float coreRadius = behind ? 2.0 : 1.5;
  float core = disc(coreRadius, d);
  float edge = disc(coreRadius + 1.25, d);
  vec4 fragColor = vec4(mix(EDGE, behind ? color.rgb : AHEAD, core), edge * (behind ? color.a : 0.9));
  fragColor = czm_gammaCorrect(fragColor);
  material.emission = fragColor.rgb;
  material.alpha = fragColor.a;
  return material;
}
