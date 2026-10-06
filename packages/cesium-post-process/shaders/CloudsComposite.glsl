// The clouds over the scene: the march's samples at a fraction of the resolution, upscaled with the
// weights of their scene depth, so that a ridge in front of a cloud keeps a sharp outline rather
// than a halo of the march's resolution. Needs EyeFromDepth.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the light the clouds scatter toward the camera, and the share of the scene seen through them
uniform sampler2D cloudTexture;
in vec2 v_textureCoordinates;

// the march's resolution, clouds.js's CLOUD_SCALE, and the sky's distance, past any terrain
const float CLOUD_SCALE = 0.25;
const float SKY_DISTANCE = 1e9;

float distanceAt(vec2 uv) {
  vec4 eye = eyeAt(depthTexture, uv);
  return eye.w == 0.0 ? SKY_DISTANCE : length(eye.xyz);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec2 size = ceil(czm_viewport.zw * CLOUD_SCALE);
  vec2 position = v_textureCoordinates * size - 0.5;
  vec2 corner = floor(position);
  vec2 f = position - corner;
  float here = distanceAt(v_textureCoordinates);
  vec4 sum = vec4(0.0);
  float weights = 0.0;
  for (int y = 0; y <= 1; y++) {
    for (int x = 0; x <= 1; x++) {
      vec2 uv = (corner + vec2(float(x), float(y)) + 0.5) / size;
      float bilinear = (x == 0 ? 1.0 - f.x : f.x) * (y == 0 ? 1.0 - f.y : f.y);
      // the samples at the depth of this pixel weigh the most
      float weight = bilinear / (0.01 + abs(distanceAt(uv) - here) / here);
      sum += weight * texture(cloudTexture, uv);
      weights += weight;
    }
  }
  vec4 cloud = sum / max(weights, 1e-6);
  out_FragColor = vec4(sceneColor.rgb * cloud.a + cloud.rgb, sceneColor.a);
}
