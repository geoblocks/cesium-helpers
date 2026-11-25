// normal at the pixel from its neighbors at this distance in pixels: on each axis the nearer
// side, so that the edges of the scene do not bend it; at the screen's border the inside one (past
// it the depth read is the border's own, a neighbor at no slope)
precision highp sampler2D;
vec3 normalAt(sampler2D depthTexture, vec2 uv, vec3 center, float distance) {
  vec2 step = distance / czm_viewport.zw;
  vec3 right = eyeAt(depthTexture, uv + vec2(step.x, 0.0)).xyz - center;
  vec3 left = center - eyeAt(depthTexture, uv - vec2(step.x, 0.0)).xyz;
  vec3 above = eyeAt(depthTexture, uv + vec2(0.0, step.y)).xyz - center;
  vec3 below = center - eyeAt(depthTexture, uv - vec2(0.0, step.y)).xyz;
  vec3 dx = uv.x < step.x || (uv.x + step.x <= 1.0 && dot(right, right) < dot(left, left)) ? right : left;
  vec3 dy = uv.y < step.y || (uv.y + step.y <= 1.0 && dot(above, above) < dot(below, below)) ? above : below;
  vec3 normal = normalize(cross(dx, dy));
  // toward the camera, an orthographic view's along its parallel rays
  return normal * sign(dot(normal, czm_orthographicIn3D == 1.0 ? vec3(0.0, 0.0, 1.0) : -center));
}

// the terrain mesh is made of flat triangles, and so are the normals from the depth buffer:
// averaged over several distances, the facets blend into a smoother surface
vec3 smoothNormalAt(sampler2D depthTexture, vec2 uv, vec3 center) {
  return normalize(normalAt(depthTexture, uv, center, 2.0 * czm_pixelRatio) + normalAt(depthTexture, uv, center, 6.0 * czm_pixelRatio));
}
