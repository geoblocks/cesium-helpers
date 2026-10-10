// A toy's look, as an isometric game's: the edges lit where the surface bends outward and shaded
// where it bends inward, found where the depth bends sharply between neighboring pixels (not the
// gentle bends between the terrain's triangles), not across a jump (an edge in front of something
// farther); the colors a little richer and warmer; the sky, if asked, a soft gradient.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// how much brighter a convex edge gets, how much darker a concave one
uniform float light;
uniform float shade;
// the colors' saturation, and a factor each of red, green and blue
uniform float saturation;
uniform vec3 warm;
// the sky's gradient, from the top of the screen to its bottom; w 0 to keep the sky
uniform vec4 skyTop;
uniform vec4 skyBottom;
in vec2 v_textureCoordinates;

// how much the depth bends, in pixels' sizes, to start and to end lighting an edge; how far it
// jumps, in pixels' sizes, to be an edge in front of something farther
const vec2 CREASE = vec2(0.6, 1.6);
const float JUMP = 20.0;
// the sky's depth, far off
const float SKY = 1e9;

// how far the pixel at uv lies, in meters: in an orthographic view past its near plane, small
// numbers whose differences keep their precision (its camera thousands of meters back: some
// phones' GPUs, Mali, lose it subtracting depths that large), in a perspective one from the camera
float depthAt(vec2 uv) {
  if (czm_orthographicIn3D == 1.0) {
    float raw = texture(depthTexture, uv).r;
    return raw >= 1.0 ? SKY : raw * (czm_currentFrustum.y - czm_currentFrustum.x);
  }
  vec4 eye = eyeAt(depthTexture, uv);
  return eye.w == 0.0 ? SKY : -eye.z;
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec4 sceneColor = texture(colorTexture, uv);
  float c = depthAt(uv);
  if (c == SKY) {
    out_FragColor = skyTop.w > 0.0 ? vec4(mix(skyBottom.rgb, skyTop.rgb, smoothstep(0.0, 1.0, uv.y)), 1.0) : sceneColor;
    return;
  }
  // a pixel's size in meters at that depth: an orthographic view's the same everywhere, a
  // perspective's growing with the depth
  float pixel = 2.0 / (czm_projection[0][0] * czm_viewport.z) * (czm_orthographicIn3D == 1.0 ? 1.0 : c);
  vec2 o = 1.0 / czm_viewport.zw;
  float r = depthAt(uv + vec2(o.x, 0.0)) - c, l = depthAt(uv - vec2(o.x, 0.0)) - c;
  float u = depthAt(uv + vec2(0.0, o.y)) - c, d = depthAt(uv - vec2(0.0, o.y)) - c;
  float jump = max(max(abs(r), abs(l)), max(abs(u), abs(d)));
  float crease = smoothstep(CREASE.x, CREASE.y, (abs(r + l) + abs(u + d)) / pixel) * (1.0 - step(JUMP * pixel, jump));
  // convex where the neighbours lie farther than the middle
  vec3 color = sceneColor.rgb * (r + l + u + d > 0.0 ? 1.0 + light * crease : 1.0 - shade * crease);
  color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, saturation) * warm;
  out_FragColor = vec4(clamp(color, 0.0, 1.0), sceneColor.a);
}
