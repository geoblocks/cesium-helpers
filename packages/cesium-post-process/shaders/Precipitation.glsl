// Precipitation, rain or snow: streaks of falling drops in four layers, nearer ones larger, faster
// and more opaque, in one pass over the scene, after the composite rainfall of ToyShop (Tatarchuk
// 2006). The drops are laid out on the sphere of view directions, around the direction they fall
// toward: drops falling along parallel lines appear on great circles through it, so in its Mercator
// coordinates (the angle around it, and log(tan(theta / 2)) of the angle theta from it) the drops
// of a layer, at one distance, are a regular grid scrolling at a constant rate: their size and
// speed on the sphere both go with sin(theta). The streaks fall down the screen at the horizon and
// radiate from below the camera when it looks down. The drops are hidden behind what is nearer than
// their layer, and the rain veils the distance in an overcast haze, whose light the drops refract,
// and in shafts of heavier rain hanging below the cloud base. The wind comes in gusts. The snow,
// from 0 to 1, turns the rain to snow in one population: the drops slow down from 9 m/s to 1 m/s,
// which shortens their streak, and grow from thin sharp lines into soft round flakes that flutter,
// the nearest layer out of focus as in Andrew Baldwin's "Just snow", in a thicker, whiter haze.
// Needs EyeFromDepth, Hash, Height and PrecipitationWind.
const int LAYERS = 4;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
// the shafts' opacity, from PrecipitationShafts.glsl at a fraction of the resolution
uniform sampler2D shaftTexture;
// from the CPU, as they change with the snow: the length of a drop's trail, its motion over the
// exposure, in cells, and the scroll of the grid along the fall, in cells, wrapped at PERIOD, which
// has to follow the speed without a jump
uniform float trail;
uniform float offset;
// what the layers share, from the CPU rather than computed for each pixel: the cells around and
// along the fall per radian, the number of cells around, and the distance in meters; and the
// brightness, how far the largest drop's shape reaches around its trail in pixels, the radius of a
// streak and the radius of the largest flake in pixels
uniform vec4 layerShape[LAYERS];
uniform vec4 layerLook[LAYERS];
in vec2 v_textureCoordinates;

// cells along the fall, for the random drops to repeat seamlessly as they scroll
const float PERIOD = 1000.0;
// the nearest layer is 2 m away, each further layer twice as far; at the horizon, a drop every
// 0.05 rad around
const float NEAREST = 2.0;
// share of the cells with a drop, at full intensity
const float DENSITY = 0.6;
// the sky is a ray this long
const float SKY_DISTANCE = 50000.0;
// the haze never quite hides the sky and the far terrain
const float MAX_HAZE = 0.9;
// tint of the haze at night, scaled by fog.minimumBrightness
const vec3 NIGHT = vec3(0.45, 0.55, 0.85);
// a drop is a capsule from a point in its cell, its trail within a cell: the cells are taller than
// wide in the rain, square in the snow
// how far a flake flutters across its cell, in cells, and a streak wavers in the gusts
const float FLUTTER = 0.12;
const float WAVER = 0.08;
// visibility, in meters, from intensity 0 to 1: much less in the snow than in the rain
const vec2 RAIN_VISIBILITY = vec2(40000.0, 4000.0);
const vec2 SNOW_VISIBILITY = vec2(20000.0, 500.0);
// the haze under the clouds by day, a brighter gray under snow clouds
const vec3 RAIN_HAZE = vec3(0.6, 0.64, 0.68);
const vec3 SNOW_HAZE = vec3(0.7, 0.72, 0.76);
// the drops refract the haze's light, whiter than they would, as the milk film crews add to the
// water, for rain that shows; the flakes scatter it, near white
const float RAIN_MILK = 0.25;
const float SNOW_MILK = 0.35;
// the shafts' shade of the haze: darker in the rain, lighter in the snow
const float RAIN_SHAFT_SHADE = 0.75;
const float SNOW_SHAFT_SHADE = 1.1;
// the shafts' resolution, precipitation.js's SHAFT_SCALE
const float SHAFT_SCALE = 0.125;

// the shafts' opacity, blurred by PrecipitationShaftBlur.glsl and upsampled bilinearly from their texture,
// which is read at its nearest texel
float shaftOpacity() {
  // the size Cesium gives the texture
  vec2 size = ceil(czm_viewport.zw * SHAFT_SCALE);
  vec2 p = v_textureCoordinates * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 center = (i + 0.5) / size;
  vec2 texel = 1.0 / size;
  float bottom = mix(texture(shaftTexture, center).r, texture(shaftTexture, center + vec2(texel.x, 0.0)).r, f.x);
  float top = mix(texture(shaftTexture, center + vec2(0.0, texel.y)).r, texture(shaftTexture, center + texel).r, f.x);
  return mix(bottom, top, f.y);
}

// the opacity at the pixel of the drop with its head in the cell `back` cells above its own, if it
// has one: f is the pixel's place in its own cell. The drop morphs from a thin, sharp, long streak
// to a round, soft, short flake with the snow: its radius and softness, brightness and flutter.
float drop(vec4 look, float index, float count, float density, float streak, float amplitude, vec2 reach, vec2 pixelCells, vec2 cell, vec2 f, float back) {
  vec2 id = vec2(mod(cell.x, count), mod(cell.y - back, PERIOD) + PERIOD * index);
  float h = hash(id);
  if (h >= density) {
    return 0.0;
  }
  // the drop's random values, from the one hash: uniform in [0, 1) for the cells with a drop; its
  // head somewhere in the middle of its cell, and the pixel's place around its trail
  h /= density;
  vec2 head = vec2(0.25 + 0.5 * fract(h * 13.7), 0.25 + 0.5 * fract(h * 71.3));
  vec2 toHead = vec2(f.x, f.y + back) - head;
  // most drops are nowhere near the pixel: the rest of the shape is for the few that are
  if (abs(toHead.x) > amplitude + reach.x || toHead.y < -reach.y || toHead.y > streak + reach.y) {
    return 0.0;
  }
  // wavering in the gusts or fluttering across the cell at its own rate
  float rate = mix(1.7, 1.0 + 2.0 * fract(h * 5.1), snow);
  toHead.x -= amplitude * sin(rate * time + czm_twoPi * fract(h * 7.3));
  float t = streak > 0.0 ? clamp(toHead.y / streak, 0.0, 1.0) : 0.0;
  // the distance to the trail, in pixels
  float distanceToTrail = length(vec2(toHead.x, toHead.y - t * streak) / pixelCells);
  float radius = mix(look.z, look.w * (0.6 + 0.8 * fract(h * 3.7)), snow);
  // the nearest layer's flakes out of focus, soft and wide; the others sharp
  float soft = mix(0.5, index == 0.0 ? 0.8 * radius : 0.5, snow);
  float coverage = 1.0 - smoothstep(radius - soft, radius + soft, distanceToTrail);
  // fading out along a streak, not along a flake
  float taper = mix(1.0, 4.0 * t * (1.0 - t), streak);
  return look.x * (0.55 + 0.45 * fract(h * 37.1)) * coverage * taper;
}

void main() {
  vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
  // the pixel's view direction and distance, the sky far away, and the angle a pixel covers
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 view = normalize(eye.xyz);
  float sceneDistance = eye.w == 0.0 ? SKY_DISTANCE : length(eye.xyz);
  float pixel = 2.0 / (czm_projection[1][1] * czm_viewport.w);

  // the local frame at the camera, in world coordinates
  vec3 upWorld = upWC();
  vec3 eastWorld = eastWC();
  vec3 northWorld = cross(upWorld, eastWorld);
  float tilt = gustingTilt();

  // the haze, as thick as the visibility: 3.912 / visibility is the extinction that leaves 2 %
  // of the light; lit by the sun as ValleyFog's fog, a moonlit blue at night
  // from the rain's to the snow's, in proportion
  vec2 range = RAIN_VISIBILITY * pow(SNOW_VISIBILITY / RAIN_VISIBILITY, vec2(snow));
  float visibility = range.x * pow(range.y / range.x, intensity);
  float haze = MAX_HAZE * (1.0 - exp(-3.912 * sceneDistance / visibility));
  float day = smoothstep(-0.1, 0.3, dot(up, czm_sunDirectionEC));
  vec3 hazeColor = mix(NIGHT * czm_fogMinimumBrightness, mix(RAIN_HAZE, SNOW_HAZE, snow), day);
  vec3 color = mix(sceneColor.rgb, hazeColor, haze);

  color = mix(color, min(mix(RAIN_SHAFT_SHADE, SNOW_SHAFT_SHADE, snow) * hazeColor, vec3(1.0)), shaftOpacity());

  // none above the cloud base
  float raining = 1.0 - smoothstep(cloudBase - 50.0, cloudBase + 50.0, cameraHeight);
  // in eye coordinates: the direction the drops fall toward, tilted toward the east by the wind,
  // and north across it
  vec3 fall = czm_viewRotation * (sin(tilt) * eastWorld - cos(tilt) * upWorld);
  vec3 north = czm_viewRotation * northWorld;
  vec3 across = normalize(north - dot(north, fall) * fall);
  vec3 dropColor = min(hazeColor + mix(RAIN_MILK, SNOW_MILK, snow), vec3(1.0));

  float cosTheta = dot(view, fall);
  float sinTheta = sqrt(max(1.0 - cosTheta * cosTheta, 0.0));
  // none toward the poles, where the cells shrink below a pixel
  if (raining > 0.0 && sinTheta > 0.01) {
    float around = atan(dot(view, cross(fall, across)), dot(view, across));
    float along = log(sinTheta / max(1.0 + cosTheta, 1e-6));
    float density = DENSITY * intensity;
    float streak = trail;
    float amplitude = mix(WAVER, FLUTTER, snow);
    // a pixel in radians, around the pole of the fall, where cells shrink
    float pixelOverSin = pixel / sinTheta;
    float brightness = raining * (0.5 + 0.5 * intensity);
    for (int i = 0; i < LAYERS; i++) {
      vec4 shape = layerShape[i];
      // hidden behind what is nearer than the layer
      float depthFade = smoothstep(0.5, 1.0, sceneDistance / shape.w);
      // a pixel in cells; the layer fades out as its cells get a few pixels wide
      vec2 pixelCells = pixelOverSin * shape.xy;
      float fade = brightness * depthFade * (1.0 - smoothstep(0.15, 0.4, pixelCells.x));
      if (fade <= 0.0) {
        continue;
      }
      float index = float(i);
      vec2 p = vec2(around * shape.x, along * shape.y + offset + 0.37 * index);
      vec2 cell = floor(p);
      vec2 f = p - cell;
      vec4 look = layerLook[i];
      vec2 reach = look.y * pixelCells;
      // the drops with their head in the pixel's cell, and in the cell above, whose trail or soft
      // edge may reach into it
      float alpha = drop(look, index, shape.z, density, streak, amplitude, reach, pixelCells, cell, f, 0.0);
      if (f.y <= streak) {
        alpha = 1.0 - (1.0 - alpha) * (1.0 - drop(look, index, shape.z, density, streak, amplitude, reach, pixelCells, cell, f, 1.0));
      }
      color = mix(color, dropColor, alpha * fade);
    }
  }
  out_FragColor = vec4(color, sceneColor.a);
}
