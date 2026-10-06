// Where it rains: the map of the local intensity, 0 to 1 in its red channel, over a rectangle of
// longitudes and latitudes, sampled bilinearly, which fades the rain in over a cell at its edges.
// Without a map, a pixel over the whole globe: rain everywhere for Precipitation, none for Clouds.
uniform sampler2D map;
// the rectangle in the ellipsoid's texture coordinates: its west and south, and one over its width
// and height
uniform vec4 mapBounds;

// the local intensity at a point in world coordinates: single precision rounds it to about half a
// meter, nothing at the scale of a map
float mapAt(vec3 positionWC) {
  vec3 normal = normalize(positionWC * czm_ellipsoidInverseRadii * czm_ellipsoidInverseRadii);
  vec2 uv = (czm_ellipsoidTextureCoordinates(normal) - mapBounds.xy) * mapBounds.zw;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
    return 0.0;
  }
  return texture(map, uv).r;
}
