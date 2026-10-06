// The clouds blurred over the neighboring texels at the march's resolution, as the precipitation's
// shafts are: an edge thinner than a texel would otherwise come out of the upscale as a square. A
// 3 x 3 binomial kernel here costs a 16th of the reads the same blur would take at the full
// resolution.
uniform sampler2D cloudTexture;
in vec2 v_textureCoordinates;

void main() {
  // czm_viewport is this pass's texture, the size of the march's
  vec2 texel = 1.0 / czm_viewport.zw;
  vec4 sum = vec4(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      sum += weight * texture(cloudTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel);
    }
  }
  out_FragColor = sum / 16.0;
}
