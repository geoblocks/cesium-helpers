// A searchlight above the focus, pointing down: it throws a pool of warm light radius meters
// wide on flat ground, with a soft penumbra, shades the relief under it and lights up the haze
// in its beam, raymarched; the rest of the scene darkens and loses its color. The cone and the
// falloff follow three.js's SpotLight.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// in eye coordinates; w is 0 for what is in the middle of the screen
uniform vec4 focus;
// local up direction, in eye coordinates
uniform vec3 up;
// meters
uniform float radius;
// width of the penumbra, as a fraction of the radius
uniform float softness;
// 0 to 1
uniform float darkness;
// brightness of the beam in the air, 0 to 1
uniform float beam;
// brightness of the light, 1 for the searchlight: the pool and the beam scale with it
uniform float power;
// Henyey-Greenstein asymmetry of the haze, 0 to 1: it scatters mostly forward, so the beam is
// brighter when looking toward the light
uniform float beamAnisotropy;
in vec2 v_textureCoordinates;

const vec3 LIGHT_COLOR = vec3(1.0, 0.93, 0.8);
const float INTENSITY = 1.4;
// height of the light above the focus, in radii: a cone of 53 degrees
const float HEIGHT = 2.0;
// radius of the beam's bright core around the light, in heights: the inverse square is softened
// within it, as the pool's is capped, so that the top of the beam does not burn out
const float BEAM_CORE = 0.25;
// brightness of the lit haze, over the height so that it keeps with the radius, matched to the
// searchlight's former analytic beam at the default anisotropy
const float BEAM_DENSITY = 19.0;
// contrast and density of the dust streaks in the beam, across its width
const float STREAKS = 0.2;
const float STREAK_SCALE = 4.0;

// light reaching a point fromLight away from the light: the cone around the axis with its
// penumbra, and the inverse square, 1 at the focus, capped for what is close to the light
float spotAt(vec3 fromLight, vec3 axis, float height, float coneCos, float penumbraCos) {
  float lightDistance = length(fromLight);
  float spot = smoothstep(coneCos, penumbraCos, dot(fromLight, -axis) / lightDistance);
  return spot * min(height * height / (lightDistance * lightDistance), 4.0);
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec4 target = focus.w > 0.0 ? focus : eyeAt(depthTexture, vec2(0.5));
  // no light without a focus in front of the camera (the sky in the middle, a focus behind)
  if (target.w == 0.0 || target.z >= 0.0) {
    out_FragColor = sceneColor;
    return;
  }
  vec3 color = sceneColor.rgb;
  vec3 ambient = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), darkness) * (1.0 - darkness);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);

  float height = HEIGHT * radius;
  vec3 lightPosition = target.xyz + height * up;
  // cosines of the angles, from the light's axis, at which the pool ends and its penumbra starts
  float inner = radius * (1.0 - softness);
  float coneCos = height / sqrt(height * height + radius * radius);
  float penumbraCos = height / sqrt(height * height + inner * inner);

  // eye.w is 0 for the sky, where the view ray goes on
  float sceneDistance = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float scattered = 0.0;
  if (beam > 0.0) {
    Beam cone;
    cone.apex = lightPosition;
    cone.forward = -up;
    cone.edgeCos = coneCos;
    cone.coreCos = penumbraCos;
    cone.hotCore = 0.0;
    cone.light = lightPosition;
    cone.reference = height;
    cone.core = BEAM_CORE * height;
    cone.reach = 1e30;
    cone.extinction = 0.0;
    cone.anisotropy = beamAnisotropy;
    cone.spacing = 1.0;
    cone.nearFade = vec2(0.0);
    cone.dust = STREAKS;
    cone.dustScale = STREAK_SCALE;
    scattered = BEAM_DENSITY / height * beamAlong(normalize(eye.xyz), sceneDistance, cone);
  }
  vec3 haze = LIGHT_COLOR * (power * beam * scattered);
  if (eye.w == 0.0) {
    out_FragColor = vec4(filmic(ambient + haze), sceneColor.a);
    return;
  }

  vec3 toLight = lightPosition - eye.xyz;
  // the normal over wider steps where the surface is seen at a grazing angle, where the facets
  // of the terrain mesh would show as blotches; over fine ones elsewhere, for the relief
  vec3 coarse = normalize(normalAt(depthTexture, v_textureCoordinates, eye.xyz, 6.0 * czm_pixelRatio)
    + normalAt(depthTexture, v_textureCoordinates, eye.xyz, 18.0 * czm_pixelRatio));
  float grazing = smoothstep(0.7, 0.95, 1.0 - abs(dot(coarse, normalize(-eye.xyz))));
  vec3 normal = normalize(mix(smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz), coarse, grazing));
  float lambert = max(dot(normal, normalize(toLight)), 0.0);
  vec3 light = LIGHT_COLOR * (power * INTENSITY * spotAt(-toLight, up, height, coneCos, penumbraCos) * lambert);
  out_FragColor = vec4(filmic(ambient + color * light + haze), sceneColor.a);
}
