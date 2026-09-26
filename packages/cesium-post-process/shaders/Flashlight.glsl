// A torch held to the right of and below the eye, pointing where the camera looks: a narrow
// hotspot and a wide, dim spill around it, fading with distance, shading the relief they fall
// on; and the hotspot's beam in the haze, raymarched through its shaft, which enters the picture
// from the corner and ends on the bright circle it makes; the rest of the scene darkens and loses
// its color. Without a target, it stays on toward the sky.
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// brightness of the LED, 1 for a pocket torch: the pool and the beam scale with it
uniform float power;
// half angle of the cone of the spill, radians
uniform float angle;
// meters: distance at which the light has fallen to a half
uniform float range;
// 0 to 1
uniform float darkness;
// brightness of the beam in the air, 0 to 1
uniform float beam;
// half angle of the hotspot, radians, the bright core of the pool and the beam's shaft in the
// air, which is that light on its way; and its radius at the torch, meters
uniform float beamAngle;
uniform float beamWidth;
// how far the beam lights the haze, meters
uniform float beamReach;
// brightness of the lit haze
uniform float beamDensity;
// Henyey-Greenstein asymmetry of the haze, 0 to 1: it scatters mostly forward, so the beam is
// brightest looking along it
uniform float beamAnisotropy;
in vec2 v_textureCoordinates;

// the cool white of an LED torch
const vec3 LIGHT_COLOR = vec3(0.7, 0.85, 1.0);
const float INTENSITY = 1.4;
// shading of a surface facing away from the torch, relative to one facing it: a torch held at
// chest height lights the ground at a grazing angle, where Lambert's law alone leaves it dark
const float WRAP = 0.4;
// the torch, in eye coordinates: to the right of, below and a little behind the eye, so that its
// beam enters the picture from the corner
const vec3 HAND = vec3(0.6, -0.4, 0.2);
// the beam converges on the middle of the screen this far ahead, meters
const float AIM = 20.0;
// brightness of the spill outside the hotspot, relative to it
const float SPILL = 0.3;
// the beam in the haze is the hot shaft of the reflector, not the pool's wide cone: a cone from
// a virtual source behind the hand, as far as its width at the torch and its angle put it, so
// that a wide shaft looks almost parallel; a hot core over this fraction of its angle, the edge
// soft outside it, crisp
const float BEAM_CORE = 0.8;
// the distance from the torch at which the lit haze has fallen to a quarter, meters: short, so
// that the shaft is as bright at its root, which the view rays cross over a few centimeters, as
// at its far end, which they follow for meters
const float BEAM_REFERENCE = 1.0;
// the haze also dims the light on its way, per meter
const float BEAM_EXTINCTION = 0.02;
// the lit haze fades in over the first meters of the view ray, so that the root of the beam does
// not stand as a wall of light in the corner of the picture
const vec2 BEAM_NEAR_FADE = vec2(0.5, 2.0);

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  vec3 color = sceneColor.rgb;
  vec3 ambient = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), darkness) * (1.0 - darkness);
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  // the axis points from what the torch lights back to it, as the beam expects
  vec3 axis = normalize(HAND - vec3(0.0, 0.0, -AIM));
  float coneCos = cos(angle);
  float coreCos = cos(beamAngle);

  // eye.w is 0 for the sky, where the view ray goes on
  float sceneDistance = eye.w == 0.0 ? 1e30 : length(eye.xyz);
  float scattered = 0.0;
  if (beam > 0.0) {
    Beam shaft;
    shaft.apex = HAND + axis * (beamWidth / tan(beamAngle));
    shaft.forward = -axis;
    shaft.edgeCos = cos(beamAngle);
    shaft.coreCos = cos(beamAngle * BEAM_CORE);
    shaft.hotCore = 1.0;
    shaft.light = HAND;
    shaft.reference = BEAM_REFERENCE;
    shaft.core = BEAM_REFERENCE;
    shaft.reach = beamReach;
    shaft.extinction = BEAM_EXTINCTION;
    shaft.anisotropy = beamAnisotropy;
    shaft.spacing = 2.0;
    shaft.nearFade = BEAM_NEAR_FADE;
    shaft.dust = 0.0;
    shaft.dustScale = 1.0;
    scattered = beamDensity * beamAlong(normalize(eye.xyz), sceneDistance, shaft);
  }
  vec3 haze = LIGHT_COLOR * (power * beam * scattered);
  if (eye.w == 0.0) {
    out_FragColor = vec4(filmic(ambient + haze), sceneColor.a);
    return;
  }

  vec3 fromLight = eye.xyz - HAND;
  float lightDistance = length(fromLight);
  vec3 direction = fromLight / lightDistance;
  float cosine = dot(direction, -axis);
  // 1 in the core, SPILL at the edge of the cone, 0 outside
  float core = smoothstep(coreCos, 1.0, cosine);
  float spill = smoothstep(coneCos, coreCos, cosine);
  float cone = max(core, SPILL * spill);
  float falloff = 1.0 / (1.0 + lightDistance * lightDistance / (range * range));

  // the normal over wider steps than the spotlight's: at the grazing angles of a torch held at
  // chest height, the facets of the terrain mesh would show as dark blotches on the ground
  vec3 normal = normalize(normalAt(depthTexture, v_textureCoordinates, eye.xyz, 6.0 * czm_pixelRatio)
    + normalAt(depthTexture, v_textureCoordinates, eye.xyz, 18.0 * czm_pixelRatio));
  float shade = mix(WRAP, 1.0, max(dot(normal, -direction), 0.0));
  vec3 light = LIGHT_COLOR * (power * INTENSITY * cone * falloff * shade);
  out_FragColor = vec4(filmic(ambient + color * light + haze), sceneColor.a);
}
