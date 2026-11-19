// The clouds over the scene, from CloudsResolve.glsl at the full resolution: a ridge in front of a
// cloud keeps its outline, each pixel's clouds being its own. The clouds' shadows darken the scene
// under them, from the shadow map. Needs EyeFromDepth and CloudsShadow.
precision highp sampler2D;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the light the clouds scatter toward the camera, and the share of the scene seen through them
uniform sampler2D cloudTexture;
in vec2 v_textureCoordinates;

// the clouds' shadow takes at most this share of the scene's light: the sunlit share of a lit
// scene, as precipitation.js's OVERCAST
const float SHADOW_STRENGTH = 0.5;

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 cloud = texture(cloudTexture, v_textureCoordinates);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  if (eye.w != 0.0) {
    vec3 positionWC = (czm_inverseView * vec4(eye.xyz, 1.0)).xyz;
    sceneColor.rgb *= mix(1.0 - SHADOW_STRENGTH, 1.0, exp(-shadowDepth(positionWC)));
  }
  out_FragColor = vec4(sceneColor.rgb * cloud.a + cloud.rgb, sceneColor.a);
}
