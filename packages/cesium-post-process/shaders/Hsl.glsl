// Hue (0 to 1, red at 0), saturation and lightness of a color.
vec3 rgbToHsl(vec3 color) {
  float maxc = max(color.r, max(color.g, color.b));
  float minc = min(color.r, min(color.g, color.b));
  float lightness = 0.5 * (maxc + minc);
  float delta = maxc - minc;
  if (delta < 1e-5) {
    return vec3(0.0, 0.0, lightness);
  }
  float saturation = lightness > 0.5 ? delta / (2.0 - maxc - minc) : delta / (maxc + minc);
  float hue = maxc == color.r ? (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0)
    : maxc == color.g ? (color.b - color.r) / delta + 2.0
    : (color.r - color.g) / delta + 4.0;
  return vec3(hue / 6.0, saturation, lightness);
}
