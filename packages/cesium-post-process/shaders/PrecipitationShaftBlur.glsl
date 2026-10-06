// The shafts' opacity and the share of the ray in the rain, blurred over the neighboring texels at
// their own resolution: they fade out around the ridges in front of them rather than stopping at
// their outline. A 3 x 3 binomial kernel here costs a 64th of the reads the same blur would take
// at the full resolution.
uniform sampler2D shaftTexture;
in vec2 v_textureCoordinates;

void main() {
  // czm_viewport is this pass's texture, the size of the shafts'
  vec2 texel = 1.0 / czm_viewport.zw;
  vec2 sum = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      float weight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
      sum += weight * texture(shaftTexture, v_textureCoordinates + vec2(float(x), float(y)) * texel).rg;
    }
  }
  out_FragColor = vec4(sum / 16.0, 0.0, 1.0);
}
