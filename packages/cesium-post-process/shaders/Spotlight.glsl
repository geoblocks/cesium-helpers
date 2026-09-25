// A searchlight above the focus, pointing down: it throws a pool of warm light radius meters
// wide on flat ground, with a soft penumbra, shades the relief under it and lights up the haze
// in its beam; the rest of the scene darkens and loses its color. The cone and the falloff
// follow three.js's SpotLight.
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
in vec2 v_textureCoordinates;

const vec3 LIGHT_COLOR = vec3(1.0, 0.93, 0.8);
const float INTENSITY = 1.4;
// height of the light above the focus, in radii: a cone of 53 degrees
const float HEIGHT = 2.0;
// radius of the beam's bright core around the light, in heights: the inverse square is softened
// within it, as the pool's is capped, so that the top of the beam does not burn out
const float BEAM_CORE = 0.25;
// contrast and density of the dust streaks in the beam, across its width
const float STREAKS = 0.2;
const float STREAK_SCALE = 4.0;
// Henyey-Greenstein asymmetry of the haze: it scatters mostly forward, so the beam is brighter
// when looking toward the light
const float PHASE_G = 0.4;

// light reaching a point fromLight away from the light: the cone around the axis with its
// penumbra, and the inverse square, 1 at the focus, capped for what is close to the light
float spotAt(vec3 fromLight, vec3 axis, float height, float coneCos, float penumbraCos) {
  float lightDistance = length(fromLight);
  float spot = smoothstep(coneCos, penumbraCos, dot(fromLight, -axis) / lightDistance);
  return spot * min(height * height / (lightDistance * lightDistance), 4.0);
}

// Henyey-Greenstein phase, 1 across the light
float phase(float cosTheta) {
  float g2 = PHASE_G * PHASE_G;
  return pow((1.0 + g2) / (1.0 + g2 - 2.0 * PHASE_G * cosTheta), 1.5);
}

// the part of the view ray, from the camera at the origin up to the scene, inside the light's
// cone; empty when end <= start
vec2 coneSegment(vec3 ray, float sceneDistance, vec3 lightPosition, vec3 down, float coneCos) {
  // points in the cone: dot(v, down)^2 >= coneCos^2 dot(v, v), with v from the light
  vec3 v = -lightPosition;
  float k2 = coneCos * coneCos;
  float rd = dot(ray, down);
  float vd = dot(v, down);
  float a = rd * rd - k2;
  float b = rd * vd - k2 * dot(ray, v);
  float c = vd * vd - k2 * dot(v, v);
  float discriminant = b * b - a * c;
  if (discriminant < 0.0) {
    return vec2(1.0, 0.0);
  }
  float root = sqrt(discriminant);
  float t1 = (-b - root) / a;
  float t2 = (-b + root) / a;
  vec2 segment = a < 0.0 ? vec2(min(t1, t2), max(t1, t2))
    // a ray steeper than the cone stays in it on one side, of the lit nappe or the other one
    : rd > 0.0 ? vec2(max(t1, t2), 1e30) : vec2(-1e30, min(t1, t2));
  segment = vec2(max(segment.x, 0.0), min(segment.y, sceneDistance));
  // below the light, not in the mirrored cone above it
  return vd + 0.5 * (segment.x + segment.y) * rd > 0.0 ? segment : vec2(1.0, 0.0);
}

// the light scattered toward the camera by the haze in the cone, along the view ray up to the
// scene. The inverse square, softened around the light, is integrated exactly over the part of
// the ray in the cone, after Macklin's analytic in-scattering; the phase is taken where the ray passes closest to the light,
// and the penumbra where it passes closest to the axis.
float beamAlong(vec3 ray, float sceneDistance, vec3 lightPosition, vec3 axis, float height, float coneCos, float penumbraCos) {
  vec3 down = -axis;
  vec2 segment = coneSegment(ray, sceneDistance, lightPosition, down, coneCos);
  if (segment.y <= segment.x) {
    return 0.0;
  }
  vec3 q = ray * segment.x - lightPosition;
  float b = dot(ray, q);
  float core = BEAM_CORE * height;
  float s = inversesqrt(dot(q, q) - b * b + core * core);
  float scattered = s * (atan((segment.y - segment.x + b) * s) - atan(b * s));

  vec3 nearLight = ray * clamp(dot(ray, lightPosition), segment.x, segment.y) - lightPosition;
  float rd = dot(ray, down);
  float across = 1.0 - rd * rd;
  float nearAxisT = across < 1e-6 ? segment.x : (dot(ray, lightPosition) - rd * dot(down, lightPosition)) / across;
  vec3 nearAxis = ray * clamp(nearAxisT, segment.x, segment.y) - lightPosition;
  float spot = smoothstep(coneCos, penumbraCos, dot(normalize(nearAxis), down));
  // dust catching the light: noise across the beam, 1 at its edge, constant along each line from
  // the light so that it streaks, and in world coordinates so that it stays when the camera turns
  float along = max(dot(nearAxis, down), 1e-3);
  vec3 section = czm_inverseViewRotation * ((nearAxis - along * down) * HEIGHT / along);
  float dust = gradientNoise(STREAK_SCALE * section) + 0.25 * gradientNoise(2.0 * STREAK_SCALE * section);
  spot *= 1.0 + STREAKS * dust;
  // times height squared for 1 at the focus, over height for a brightness that keeps with the radius
  return height * scattered * spot * phase(dot(normalize(nearLight), -ray));
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
  float scattered = beam > 0.0 ? beamAlong(normalize(eye.xyz), sceneDistance, lightPosition, up, height, coneCos, penumbraCos) : 0.0;
  vec3 haze = LIGHT_COLOR * (beam * scattered);
  if (eye.w == 0.0) {
    out_FragColor = vec4(ambient + haze, sceneColor.a);
    return;
  }

  vec3 toLight = lightPosition - eye.xyz;
  vec3 normal = smoothNormalAt(depthTexture, v_textureCoordinates, eye.xyz);
  float lambert = max(dot(normal, normalize(toLight)), 0.0);
  vec3 light = LIGHT_COLOR * (INTENSITY * spotAt(-toLight, up, height, coneCos, penumbraCos) * lambert);
  out_FragColor = vec4(ambient + color * light + haze, sceneColor.a);
}
