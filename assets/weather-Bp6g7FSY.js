import{t as e}from"./rolldown-runtime-CbXtAM7H.js";import"./lit-BFn1CURT.js";/* empty css                   */import"./card-BcpQSzF3.js";import{t}from"./setup-DMh09s7J.js";import{F as n,I as r,L as i,P as a,T as o,k as s,w as c}from"./cesium-shim-xDTaFLvd.js";import{t as l}from"./cesium-audio-DQHH-gu2.js";import"./switch-PsQ7BZQb.js";import"./button-CI_sKcZA.js";import"./icon-BcbZVKyW.js";import{a as u,n as d,r as f,t as p}from"./EyeFromDepth-OMdZ3JZV.js";import{a as m,c as h,i as g,l as _,o as v,r as y,s as b,t as x,u as S}from"./precipitation-BBR80A7N.js";import"./slider-Cjeel3x6.js";var C=4;function w(e,t,n,r){let i=Math.imul(e,374761393)^Math.imul(t,668265263)^Math.imul(n,1440662683)^Math.imul(r,2246822519);return i=Math.imul(i^i>>>13,1274126177),i^=i>>>16,(i>>>0)/4294967296}function T(e,t){return(e%t+t)%t}function E(e,t){let n=new Float32Array(e**3*3);for(let r=0;r<e**3;r++){let i=r%e,a=Math.floor(r/e)%e,o=Math.floor(r/e**2),s=2*Math.PI*w(i,a,o,t),c=2*w(i,a,o,t+1)-1,l=Math.sqrt(1-c*c);n.set([l*Math.cos(s),l*Math.sin(s),c],3*r)}let r=e=>e*e*e*(e*(e*6-15)+10),i=Int32Array.from({length:e+1},(t,n)=>T(n,e));return(t,a,o)=>{let s=Math.floor(t),c=Math.floor(a),l=Math.floor(o),u=t-s,d=a-c,f=o-l,p=i[s],m=i[s+1],h=e*i[c],g=e*i[c+1],_=e*e*i[l],v=e*e*i[l+1],y=(e,t,r,i)=>n[3*e]*t+n[3*e+1]*r+n[3*e+2]*i,b=r(u),x=r(d),S=r(f),C=y(p+h+_,u,d,f),w=y(m+h+_,u-1,d,f),T=y(p+g+_,u,d-1,f),E=y(m+g+_,u-1,d-1,f),D=y(p+h+v,u,d,f-1),O=y(m+h+v,u-1,d,f-1),k=y(p+g+v,u,d-1,f-1),A=y(m+g+v,u-1,d-1,f-1),j=C+(w-C)*b+(T+(E-T)*b-C-(w-C)*b)*x;return 2*(j+(D+(O-D)*b+(k+(A-k)*b-D-(O-D)*b)*x-j)*S)}}function D(e,t){let n=new Float32Array(e**3*3);for(let r=0;r<e**3;r++){let i=r%e,a=Math.floor(r/e)%e,o=Math.floor(r/e**2);n.set([w(i,a,o,t),w(i,a,o,t+1),w(i,a,o,t+2)],3*r)}let r=Int32Array.from({length:e+2},(t,n)=>T(n-1,e));return(t,i,a)=>{let o=Math.floor(t),s=Math.floor(i),c=Math.floor(a),l=1/0;for(let u=-1;u<=1;u++){let d=e*e*r[c+u+1];for(let f=-1;f<=1;f++){let p=d+e*r[s+f+1];for(let e=-1;e<=1;e++){let d=3*(p+r[o+e+1]),m=o+e+n[d]-t,h=s+f+n[d+1]-i,g=c+u+n[d+2]-a,_=m*m+h*h+g*g;_<l&&(l=_)}}}return l<1?Math.sqrt(l):1}}function O(e=64){let t=[new Float32Array(e**3),new Float32Array(e**3),new Float32Array(e**3)],n=[0,1,2].map(e=>E(C*2**e,10+e)),[r,i,a,o,s]=[D(C,20),D(8,30),D(16,40),D(16,50),D(32,60)],c=0;for(let l=0;l<e;l++)for(let u=0;u<e;u++)for(let d=0;d<e;d++){let f=(d+.5)/e*C,p=(u+.5)/e*C,m=(l+.5)/e*C,h=0;for(let e=0;e<3;e++){let t=2**e;h+=n[e](f*t,p*t,m*t)/t}let g=1-r(f,p,m);t[0][c]=g+(.5+.35*h)*(1-g),t[1][c]=1-(.7*i(2*f,2*p,2*m)+.3*a(4*f,4*p,4*m)),t[2][c]=1-(.7*o(4*f,4*p,4*m)+.3*s(8*f,8*p,8*m)),c++}let l=new Uint8Array(e**3*4);t.forEach((e,t)=>{let n=1/0,r=-1/0;for(let t of e)n=Math.min(n,t),r=Math.max(r,t);for(let i=0;i<e.length;i++)l[4*i+t]=Math.round(255*(e[i]-n)/(r-n))});for(let e=3;e<l.length;e+=4)l[e]=255;return l}var k=`// The clouds blurred over the neighboring texels at the march's resolution, as the precipitation's
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
`,A=`// The clouds over the scene: the march's samples at a fraction of the resolution, upscaled with the
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
`,j=`// Clouds from a map of the rain, raymarched at a fraction of the resolution: the light they scatter
// toward the camera, and the share of the scene still seen through them, along each view ray. They
// fill a slab above the cloud base where the map has rain: a flat layer over drizzle, towers up to
// the cloud top over the heaviest rain, with a rounded base and top, shaped by billows of noise
// that repeats in world coordinates, read from a texture made once (cloud-noise.js): wispy over
// light rain and solid over heavy rain, with details eroding their edges, not their cores. The sun lights them through a few
// samples toward it, with a silver lining toward it, and the sky lights them, brighter at their
// top: thick clouds are dark gray from below and white from above. The steps are short near the
// camera and longer with the distance, so a camera inside a cloud is in its fog. Precipitation,
// activated after them, draws the rain's haze over them. Needs EyeFromDepth, Height, WeatherMap and
// RainHaze, for its daylight.
uniform sampler2D depthTexture;
// the noise: the billows of the base shape in red, the details in green and blue
uniform highp sampler3D cloudNoise;
// meters above the ellipsoid
uniform float cloudBase;
uniform float cloudTop;
// scale of the opacity
uniform float density;
in vec2 v_textureCoordinates;

const int STEPS = 32;
// the ray is marched as far as this from where it enters the slab, in meters, not from the camera:
// from far above, the slab itself is farther than that. A grazing ray marched farther would take
// steps longer than the billows and turn the far clouds into streaks; deeper than this into the
// slab, it is nearly always behind a cloud
const float MAX_DISTANCE = 40000.0;
// the clouds over the lightest rain are this thick, in meters
const float THIN_DEPTH = 1500.0;
// extinction inside a solid cloud, per meter: about 1.3 km of visibility
const float EXTINCTION = 0.003;
// the noise repeats every this many meters, in 4 billows across, with this many voxels, clouds.js's
// NOISE_SIZE, and its details are about this size
const float NOISE_TILE = 16000.0;
const float NOISE_VOXELS = 64.0;
const float DETAIL_SIZE = 1000.0;
// the scale of the larger lookup of the noise, not a fraction that would line its tiles up
const float LARGE_SCALE = 0.27;
// the noise is read this many mipmaps blurrier than a pixel's footprint: its features then span a
// few pixels of the pass, rather than one that the upscale would turn into a square
const float LOD_BIAS = 1.5;
// how much the details erode the thin edges of the clouds
const float EROSION = 0.6;
// the sun's light through the cloud, sampled at these distances toward it, in meters
const vec2 LIGHT_DISTANCES = vec2(200.0, 700.0);
// the sky's light on the clouds at their base and at their top, the sun's, and the moon's share of
// the sky's at night, a faintly cool white
const vec3 AMBIENT_BASE = vec3(0.32, 0.35, 0.40);
const vec3 AMBIENT_TOP = vec3(0.62, 0.66, 0.72);
const float SUN = 0.8;
const vec3 MOONLIGHT = vec3(0.60, 0.63, 0.70);

// where the height along the view ray, at a distance t in direction k = dot(direction, up), reaches
// c: the height is cameraHeight + k t + (1 - k k) t t / (2 radius), as heightAt's. False if it never
// does. Without the cancellation of the textbook formula, also for a vertical ray, where the
// quadratic term is 0
bool crossings(float c, float k, out float near, out float far) {
  float a = (1.0 - k * k) / (2.0 * radius);
  float d = cameraHeight - c;
  float discriminant = k * k - 4.0 * a * d;
  if (discriminant < 0.0) {
    return false;
  }
  float q = -0.5 * (k + (k < 0.0 ? -1.0 : 1.0) * sqrt(discriminant));
  q = q == 0.0 ? 1e-9 : q;
  float r0 = a > 1e-12 ? q / a : (q > 0.0 ? 1e20 : -1e20);
  float r1 = d / q;
  near = min(r0, r1);
  far = max(r0, r1);
  return true;
}

// the part of the ray in the slab, from where it enters it to where it leaves it, meets the
// ground or is MAX_DISTANCE long; empty when it misses the slab
vec2 slab(float k, float sceneDistance) {
  float near;
  float far;
  // always above the tops
  if (!crossings(cloudTop, k, near, far)) {
    return vec2(0.0);
  }
  float start = max(near, 0.0);
  float end = far;
  if (crossings(cloudBase, k, near, far)) {
    if (cameraHeight >= cloudBase) {
      // going down below the base
      if (near > 0.0) {
        end = min(end, near);
      }
    } else {
      // coming up through the base
      start = max(start, far);
    }
  }
  end = min(end, min(sceneDistance, start + MAX_DISTANCE));
  return vec2(start, max(end, start));
}

// the cloud's density at a point, 0 to the density uniform: as tall and as solid as the rain under
// it is heavy. The noise is read at the mipmap of the footprint of a pixel, in meters, and the
// details fade out as it grows: sampled once a pixel, finer noise would alias into speckles
float cloudDensity(vec3 positionWC, float h, float footprint) {
  float m = mapAt(positionWC);
  if (m <= 0.0) {
    return 0.0;
  }
  float top = cloudBase + mix(THIN_DEPTH, cloudTop - cloudBase, m * m);
  float y = (h - cloudBase) / (top - cloudBase);
  if (y <= 0.0 || y >= 1.0) {
    return 0.0;
  }
  float profile = smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.55, 1.0, y));
  float lod = max(log2(footprint * NOISE_VOXELS / NOISE_TILE) + LOD_BIAS, 0.0);
  vec3 q = positionWC / NOISE_TILE;
  vec4 noise = textureLod(cloudNoise, fract(q), lod);
  // the same noise about four times larger, its axes swapped, breaks up the repetition of the tile,
  // which far views would show as a grid
  float large = textureLod(cloudNoise, fract(LARGE_SCALE * q.zxy + 0.5), max(lod + log2(LARGE_SCALE), 0.0)).r;
  noise.r = clamp(noise.r + 0.6 * (large - 0.5), 0.0, 1.0);
  // even drizzle has a broken layer of cloud over it; the edges soften as the pixels grow, which
  // would otherwise cut them in steps of the pass's resolution
  // rising from 0 at the edge of the rain, which a jump would cut in squares of the map's pixels
  float coverage = 0.3 * smoothstep(0.0, 0.15, m) + 0.7 * m;
  float soft = 0.15 + 0.35 * clamp(footprint / 2000.0, 0.0, 1.0);
  float shape = smoothstep(1.0 - coverage - soft, 1.0 - coverage + soft, noise.r);
  // the details erode where the cloud is thin, its edges, and leave its core solid
  float detail = mix(noise.g, noise.b, 0.4) * (1.0 - smoothstep(0.25, 0.5, footprint / DETAIL_SIZE));
  float erosion = EROSION * detail * (1.0 - shape);
  return density * profile * clamp((shape - erosion) / (1.0 - erosion), 0.0, 1.0);
}

// Henyey-Greenstein's phase function, times 4 pi: 1 for light scattered alike in all directions
float phase(float cosTheta, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
}

void main() {
  vec4 eye = eyeAt(depthTexture, v_textureCoordinates);
  vec3 direction = normalize(eye.xyz);
  // the sky is past the slab: the slab ends its rays
  float sceneDistance = eye.w == 0.0 ? 1e9 : length(eye.xyz);
  vec2 segment = slab(dot(direction, up), sceneDistance);
  float span = segment.y - segment.x;
  if (span <= 0.0) {
    out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 directionWC = czm_inverseViewRotation * direction;
  vec3 lightWC = czm_inverseViewRotation * czm_lightDirectionEC;
  // a forward lobe for the silver lining, a weak backward one
  float cosTheta = dot(direction, czm_lightDirectionEC);
  float scattering = mix(phase(cosTheta, -0.2), phase(cosTheta, 0.6), 0.7);
  float day = daylight();
  vec3 sunLight = SUN * czm_lightColor * day * scattering;
  vec3 sky = mix(MOONLIGHT, vec3(1.0), day);
  // interleaved gradient noise, a different start along the ray for each pixel
  // the angle a pixel of this pass covers
  float pixelAngle = 2.0 / (czm_projection[1][1] * czm_viewport.w);
  float jitter = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  vec3 light = vec3(0.0);
  float transmittance = 1.0;
  for (int i = 0; i < STEPS; i++) {
    float s = (float(i) + jitter) / float(STEPS);
    float t = segment.x + span * s * s;
    float dt = span * (2.0 * s + 1.0 / float(STEPS)) / float(STEPS);
    vec3 pointEC = direction * t;
    float h = heightAt(pointEC);
    vec3 pointWC = czm_viewerPositionWC + directionWC * t;
    float footprint = t * pixelAngle;
    float sigma = EXTINCTION * cloudDensity(pointWC, h, footprint);
    if (sigma <= 0.0) {
      continue;
    }
    // the sun's light through the cloud toward it, darker at the edges facing it than a plain
    // exponential would make them
    float opticalDepth = 0.0;
    float previous = 0.0;
    for (int j = 0; j < 2; j++) {
      float distanceToward = LIGHT_DISTANCES[j];
      opticalDepth += EXTINCTION * cloudDensity(pointWC + lightWC * distanceToward, heightAt(pointEC + czm_lightDirectionEC * distanceToward), footprint) * (distanceToward - previous);
      previous = distanceToward;
    }
    float sunThrough = exp(-opticalDepth) * (1.0 - 0.5 * exp(-2.0 * opticalDepth));
    float y = clamp((h - cloudBase) / (cloudTop - cloudBase), 0.0, 1.0);
    vec3 scattered = sunLight * sunThrough + mix(AMBIENT_BASE, AMBIENT_TOP, y) * sky;
    float stepTransmittance = exp(-sigma * dt);
    light += transmittance * scattered * (1.0 - stepTransmittance);
    transmittance *= stepTransmittance;
    if (transmittance < 0.03) {
      break;
    }
  }
  out_FragColor = vec4(min(light, vec3(1.0)), transmittance);
}
`,ee=.25,M=64,te,ne=class extends u{constructor(e,t={}){super(e),this.cloudBase_=t.cloudBase??2500,this.cloudTop_=t.cloudTop??9e3,this.density_=t.density??1,this.weatherMap_=new g(0),this.weatherMap_.map=t.map,this.localDensity_=0,this.noiseTexture_=void 0,this.onPreRender_=()=>{let{longitude:e,latitude:t,height:n}=this.viewer.scene.camera.positionCartographic,r=n>=this.cloudBase_&&n<=this.cloudTop_;this.localDensity_=r?this.weatherMap_.intensityAt(e,t):0}}createStage_(e){let t=new c({fragmentShader:p+b+m+v+j,uniforms:{...h(e),map:()=>this.weatherMap_.texture(e.context),mapBounds:()=>this.weatherMap_.bounds,cloudNoise:()=>this.createNoiseTexture_(e.context),cloudBase:()=>this.cloudBase_,cloudTop:()=>this.cloudTop_,density:()=>this.density_},textureScale:ee}),n=new c({fragmentShader:k,uniforms:{cloudTexture:t.name},textureScale:ee});return new o({stages:[t,n,new c({fragmentShader:p+A,uniforms:{cloudTexture:n.name}})],inputPreviousStageTexture:!1})}createNoiseTexture_(e){return this.noiseTexture_||(te??=O(M),this.noiseTexture_=new a({context:e,flipY:!1,source:{width:M,height:M,depth:M,arrayBufferView:te},sampler:new s({wrapS:i.REPEAT,wrapT:i.REPEAT,wrapR:i.REPEAT,minificationFilter:r.LINEAR_MIPMAP_LINEAR,magnificationFilter:n.LINEAR})}),this.noiseTexture_.generateMipmap()),this.noiseTexture_}activated_(e){e.preRender.addEventListener(this.onPreRender_),d(e),_(e)}deactivating_(e){S(e),f(e),e.preRender.removeEventListener(this.onPreRender_),this.weatherMap_.destroy(),this.noiseTexture_=this.noiseTexture_?.destroy()}get map(){return this.weatherMap_.map}set map(e){this.weatherMap_.map=e,this.viewer.scene.requestRender()}get cloudBase(){return this.cloudBase_}set cloudBase(e){this.cloudBase_=e,this.viewer.scene.requestRender()}get cloudTop(){return this.cloudTop_}set cloudTop(e){this.cloudTop_=e,this.viewer.scene.requestRender()}get density(){return this.density_}set density(e){this.density_=e,this.viewer.scene.requestRender()}get localDensity(){return this.localDensity_}},re=0;function ie(){return re++}var ae=e(((e,t)=>{var n=Object.defineProperty,r=Object.getOwnPropertyDescriptor,i=Object.getOwnPropertyNames,a=Object.prototype.hasOwnProperty,o=(e,t)=>{for(var r in t)n(e,r,{get:t[r],enumerable:!0})},s=(e,t,o,s)=>{if(t&&typeof t==`object`||typeof t==`function`)for(let c of i(t))!a.call(e,c)&&c!==o&&n(e,c,{get:()=>t[c],enumerable:!(s=r(t,c))||s.enumerable});return e},c=e=>s(n({},`__esModule`,{value:!0}),e),l={};o(l,{XmlCdata:()=>E,XmlComment:()=>D,XmlDeclaration:()=>O,XmlDocument:()=>A,XmlDocumentType:()=>j,XmlElement:()=>k,XmlError:()=>ee,XmlNode:()=>w,XmlProcessingInstruction:()=>M,XmlText:()=>T,parseXml:()=>ie}),t.exports=c(l);var u=``,d=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,f=class{constructor(e){if(this.m=this.u(e,!0),this.d=0,this.length=e.length,this.n=this.m!==this.length,this.h=e,this.n){let t=[];for(let n=0,r=0;r<this.m;++r)t[r]=n,n+=e.codePointAt(n)>65535?2:1;this.A=t}}get B(){return this.d>=this.m}u(e,t=this.n){return t?e.replace(d,`_`).length:e.length}p(e=1){this.d=Math.min(this.m,this.d+e)}f(e=this.d){return this.n?this.A[e]??1/0:e}G(e=1){let t=this.j(e);return this.p(e),t}v(e){let t=this.f(),n=this.h.slice(t,t+e);return this.p(this.u(n)),n}w(e){let{length:t,n,h:r}=this,i=this.f(),a=i;if(n)for(;a<t;){let t=r[a],n=t>=`\ud800`&&t<=`\udbff`;if(n&&(t+=r[a+1]),!e(t))break;a+=n?2:1}else for(;a<t&&e(r[a]);)++a;return this.v(a-i)}b(e){let{length:t}=e,n=this.f();return e===this.h.slice(n,n+t)?(this.p(t===1?1:this.u(e)),e):u}x(e){let t=this.h.slice(this.f()).search(e);return t>0?this.v(t):u}s(e){let t=this.f(),n=this.h.indexOf(e,t);return n>0?this.v(n-t):u}j(e=1){let{d:t,h:n}=this;return this.n?n.slice(this.f(t),this.f(t+e)):n.slice(t,t+e)}k(e=0){this.d=e>=0?Math.min(this.m,e):Math.max(0,this.d+e)}},p=/["&<]/,m=/['&<]/,h=/\r\n|[\n\r\t]/g,g=/<|&|]]>/,_=Object.freeze(Object.assign(Object.create(null),{amp:`&`,apos:`'`,gt:`>`,lt:`<`,quot:`"`}));function v(e){let t=e.codePointAt(0);return t>=97&&t<=122||t>=65&&t<=90||t>=48&&t<=57||t===45||t===46||t===183||t>=768&&t<=879||t===8255||t===8256||y(e,t)}function y(e,t=e.codePointAt(0)){return t>=97&&t<=122||t>=65&&t<=90||t===58||t===95||t>=192&&t<=214||t>=216&&t<=246||t>=248&&t<=767||t>=880&&t<=893||t>=895&&t<=8191||t===8204||t===8205||t>=8304&&t<=8591||t>=11264&&t<=12271||t>=12289&&t<=55295||t>=63744&&t<=64975||t>=65008&&t<=65533||t>=65536&&t<=983039}function b(e){return e===`#`||v(e)}function x(e){let t=e.codePointAt(0);return t===32||t===9||t===10||t===13}function S(e){return e>=32&&e<=55295||e===10||e===9||e===13||e>=57344&&e<=65533||e>=65536&&e<=1114111}var C=class e{constructor(){this.parent=null,this.start=-1,this.end=-1}get document(){return this.parent?.document??null}get isRootNode(){return this.parent!==null&&this.parent===this.document&&this.type===e.TYPE_ELEMENT}get preserveWhitespace(){return!!this.parent?.preserveWhitespace}get type(){return``}toJSON(){let e={type:this.type};return this.isRootNode&&(e.isRootNode=!0),this.preserveWhitespace&&(e.preserveWhitespace=!0),this.start!==-1&&(e.start=this.start,e.end=this.end),e}};C.TYPE_CDATA=`cdata`,C.TYPE_COMMENT=`comment`,C.TYPE_DOCUMENT=`document`,C.TYPE_DOCUMENT_TYPE=`doctype`,C.TYPE_ELEMENT=`element`,C.TYPE_PROCESSING_INSTRUCTION=`pi`,C.TYPE_TEXT=`text`,C.TYPE_XML_DECLARATION=`xmldecl`;var w=C,T=class extends w{constructor(e=``){super(),this.text=e}get type(){return w.TYPE_TEXT}toJSON(){return Object.assign(w.prototype.toJSON.call(this),{text:this.text})}},E=class extends T{get type(){return w.TYPE_CDATA}},D=class extends w{constructor(e=``){super(),this.content=e}get type(){return w.TYPE_COMMENT}toJSON(){return Object.assign(w.prototype.toJSON.call(this),{content:this.content})}},O=class extends w{constructor(e,t,n){super(),this.version=e,this.encoding=t??null,this.standalone=n??null}get type(){return w.TYPE_XML_DECLARATION}toJSON(){let e=w.prototype.toJSON.call(this);e.version=this.version;for(let t of[`encoding`,`standalone`])this[t]!==null&&(e[t]=this[t]);return e}},k=class e extends w{constructor(e,t=Object.create(null),n=[]){super(),this.name=e,this.attributes=t,this.children=n}get isEmpty(){return this.children.length===0}get preserveWhitespace(){let t=this;for(;t instanceof e;){if(`xml:space`in t.attributes)return t.attributes[`xml:space`]===`preserve`;t=t.parent}return!1}get text(){return this.children.map(e=>`text`in e?e.text:``).join(``)}get type(){return w.TYPE_ELEMENT}toJSON(){return Object.assign(w.prototype.toJSON.call(this),{name:this.name,attributes:this.attributes,children:this.children.map(e=>e.toJSON())})}},A=class extends w{constructor(e=[]){super(),this.children=e}get document(){return this}get root(){for(let e of this.children)if(e instanceof k)return e;return null}get text(){return this.children.map(e=>`text`in e?e.text:``).join(``)}get type(){return w.TYPE_DOCUMENT}toJSON(){return Object.assign(w.prototype.toJSON.call(this),{children:this.children.map(e=>e.toJSON())})}},j=class extends w{constructor(e,t,n,r){super(),this.name=e,this.publicId=t??null,this.systemId=n??null,this.internalSubset=r??null}get type(){return w.TYPE_DOCUMENT_TYPE}toJSON(){let e=w.prototype.toJSON.call(this);e.name=this.name;for(let t of[`publicId`,`systemId`,`internalSubset`])this[t]!==null&&(e[t]=this[t]);return e}},ee=class extends Error{constructor(e,t,n){let r=1,i=``,a=1;for(let e=0;e<t;++e){let t=n[e];t===`
`?(r=1,i=``,a+=1):(r+=1,i+=t)}let o=n.indexOf(`
`,t);i+=o===-1?n.slice(t):n.slice(t,o);let s=0;i.length>50&&(r<40?i=i.slice(0,50):(s=r-20,i=i.slice(s,r+30))),super(`${e} (line ${a}, column ${r})
  ${i}
`+` `.repeat(r-s+1)+`^
`),this.column=r,this.excerpt=i,this.line=a,this.name=`XmlError`,this.pos=t}},M=class extends w{constructor(e,t=``){super(),this.name=e,this.content=t}get type(){return w.TYPE_PROCESSING_INSTRUCTION}toJSON(){return Object.assign(w.prototype.toJSON.call(this),{name:this.name,content:this.content})}},te=``,ne=class{constructor(e,t={}){let n=this.document=new A;this.l=n,this.g=t,this.c=new f(e),this.g.includeOffsets&&(n.start=0,n.end=e.length),this.parse()}i(e,t){return e.parent=this.l,this.g.includeOffsets&&(e.start=this.c.f(t),e.end=this.c.f()),this.l.children.push(e),!0}y(e,t,n=!0){let{children:r}=this.l,{length:i}=r;if(n&&(e=re(e)),i>0){let t=r[i-1];if(t?.type===w.TYPE_TEXT){let n=t;return n.text+=e,this.g.includeOffsets&&(n.end=this.c.f()),!0}}return this.i(new T(e),t)}H(){let e=Object.create(null);for(;this.e();){let t=this.q();if(!t)break;let n=this.t()&&this.I();if(n===!1)throw this.a(`Attribute value expected`);if(t in e)throw this.a(`Duplicate attribute: ${t}`);if(t===`xml:space`&&n!=="default"&&n!==`preserve`)throw this.a('Value of the `xml:space` attribute must be "default" or "preserve"');e[t]=n}if(this.g.sortAttributes){let t=Object.keys(e).sort(),n=Object.create(null);for(let r=0;r<t.length;++r){let i=t[r];n[i]=e[i]}e=n}return e}I(){let{c:e}=this,t=e.j();if(t!==`"`&&t!==`'`)return!1;e.p();let n,r=!1,i=te,a=t===`"`?p:m;matchLoop:for(;!e.B;)switch(n=e.x(a),n&&(this.o(n),i+=n.replace(h,` `)),e.j()){case t:r=!0;break matchLoop;case`&`:i+=this.C();continue;case`<`:throw this.a("Unescaped `<` is not allowed in an attribute value");default:break matchLoop}if(!r)throw this.a(`Unclosed attribute`);return e.p(),i}J(){let{c:e}=this,t=e.d;if(!e.b(`<![CDATA[`))return!1;let n=e.s(`]]>`);if(this.o(n),!e.b(`]]>`))throw this.a(`Unclosed CDATA section`);return this.g.preserveCdata?this.i(new E(re(n)),t):this.y(n,t)}K(){let{c:e}=this,t=e.d,n=e.x(g);if(!n)return!1;if(this.o(n),e.j(3)===`]]>`)throw this.a("Element content may not contain the CDATA section close delimiter `]]>`");return this.y(n,t)}D(){let{c:e}=this,t=e.d;if(!e.b(`<!--`))return!1;let n=e.s(`--`);if(this.o(n),!e.b(`-->`))throw e.j(2)===`--`?this.a("The string `--` isn't allowed inside a comment"):this.a(`Unclosed comment`);return!this.g.preserveComments||this.i(new D(re(n)),t)}L(){let e=this.c.d,t=this.C();return t?this.y(t,e,!1):!1}M(){let{c:e}=this,t=e.d;if(!e.b(`<!DOCTYPE`))return!1;let n=this.e()&&this.q();if(!n)throw this.a(`Expected a name`);let r,i;if(this.e()){if(e.b(`PUBLIC`)){if(r=this.e()&&this.N(),r===!1)throw this.a(`Expected a public identifier`);this.e()}if(r!==void 0||e.b(`SYSTEM`)){if(this.e(),i=this.r(),i===!1)throw this.a(`Expected a system identifier`);this.e()}}let a;if(e.b(`[`)){if(a=e.x(/\][\x20\t\r\n]*>/),!e.b(`]`))throw this.a(`Unclosed internal subset`);this.e()}if(!e.b(`>`))throw this.a(`Unclosed doctype declaration`);return!this.g.preserveDocumentType||this.i(new j(n,r,i,a),t)}E(){let{c:e}=this,t=e.d;if(!e.b(`<`))return!1;let n=this.q();if(!n)return e.k(t),!1;let r=this.H(),i=!!e.b(`/>`),a=new k(n,r);if(a.parent=this.l,!i){if(!e.b(`>`))throw this.a(`Unclosed start tag for element \`${n}\``);this.l=a;do this.K();while(this.E()||this.L()||this.J()||this.F()||this.D());let t=e.d,r;if(!e.b(`</`)||!(r=this.q())||r!==n)throw e.k(t),this.a(`Missing end tag for element ${n}`);if(this.e(),!e.b(`>`))throw this.a(`Unclosed end tag for element ${n}`);this.l=a.parent}return this.i(a,t)}t(){return this.e(),this.c.b(`=`)?(this.e(),!0):!1}z(){return this.D()||this.F()||this.e()}q(){return y(this.c.j())?this.c.w(v):te}F(){let{c:e}=this,t=e.d;if(!e.b(`<?`))return!1;let n=this.q();if(n){if(n.toLowerCase()===`xml`)throw e.k(t),this.a(`XML declaration isn't allowed here`)}else throw this.a(`Invalid processing instruction`);if(!this.e()){if(e.b(`?>`))return this.i(new M(n),t);throw this.a(`Whitespace is required after a processing instruction name`)}let r=e.s(`?>`);if(this.o(r),!e.b(`?>`))throw this.a(`Unterminated processing instruction`);return this.i(new M(n,re(r)),t)}O(){let{c:e}=this,t=e.d;for(this.P();this.z(););if(this.M())for(;this.z(););return t<e.d}N(){let e=this.c.d,t=this.r();if(t!==!1&&!/^[-\x20\r\na-zA-Z0-9'()+,./:=?;!*#@$_%]*$/.test(t))throw this.c.k(e),this.a(`Invalid character in public identifier`);return t}C(){let{c:e}=this;if(!e.b(`&`))return!1;let t=e.w(b);if(e.G()!==`;`)throw this.a("Unterminated reference (a reference must end with `;`)");let n;if(t[0]===`#`){let e=t[1]===`x`?parseInt(t.slice(2),16):parseInt(t.slice(1),10);if(isNaN(e)||!/^#(?:x[0-9A-Fa-f]+|[0-9]+)$/.test(t))throw this.a(`Invalid character reference`);if(!S(e))throw this.a(`Character reference resolves to an invalid character`);n=String.fromCodePoint(e)}else if(n=_[t],n===void 0){let{ignoreUndefinedEntities:n,resolveUndefinedEntity:r}=this.g,i=`&${t};`;if(r){let e=r(i);if(e!=null){let t=typeof e;if(t!==`string`)throw TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${t}`);return e}}if(n)return i;throw e.k(-i.length),this.a(`Named entity isn't defined: ${i}`)}return n}r(){let{c:e}=this,t=e.b(`"`)||e.b(`'`);if(!t)return!1;let n=e.s(t);if(this.o(n),!e.b(t))throw this.a(`Missing end quote`);return n}e(){return!!this.c.w(x)}P(){let{c:e}=this,t=e.d;if(!e.b(`<?xml`))return!1;if(v(e.j()))return e.k(t),!1;if(!this.e())throw this.a(`Invalid XML declaration`);let n=!!e.b(`version`)&&this.t()&&this.r();if(n===!1)throw this.a(`XML version is missing or invalid`);if(!/^1\.[0-9]+$/.test(n))throw this.a(`Invalid character in version number`);let r,i;if(this.e()){if(r=!!e.b(`encoding`)&&this.t()&&this.r(),r){if(!/^[A-Za-z][\w.-]*$/.test(r))throw this.a(`Invalid character in encoding name`);this.e()}if(i=!!e.b(`standalone`)&&this.t()&&this.r(),i){if(i!==`yes`&&i!==`no`)throw this.a('Only "yes" and "no" are permitted as values of `standalone`');this.e()}}if(!e.b(`?>`))throw this.a(`Invalid or unclosed XML declaration`);return!this.g.preserveXmlDeclaration||this.i(new O(n,r||void 0,i||void 0),t)}a(e){let{c:t}=this;return new ee(e,t.d,t.h)}parse(){if(this.c.b(`﻿`),this.O(),!this.E())throw this.a(`Root element is missing or invalid`);for(;this.z(););if(!this.c.B)throw this.a(`Extra content at the end of the document`)}o(e){let{length:t}=e;for(let n=0;n<t;++n){let t=e.codePointAt(n);if(!S(t))throw this.c.k(-([...e].length-n)),this.a(`Invalid character`);t>65535&&(n+=1)}}};function re(e){let t=0;for(;(t=e.indexOf(`\r`,t))!==-1;)e=e[t+1]===`
`?e.slice(0,t)+e.slice(t+1):e.slice(0,t)+`
`+e.slice(t+1);return e}function ie(e,t){return new ne(e,t).document}}))(),oe=class extends Error{constructor(e){super(e)}};function se(e){let t=null;try{t=(0,ae.parseXml)(e)}catch(e){throw new oe(e.message)}return t}function N(e){let t=e.indexOf(`:`);return t>-1?e.substr(t+1):e}function P(e){return e.children[0]}function ce(e){return e.name||``}function F(e,t,n=!1){let r=N(t);function i(e,t){return N(ce(t))===r&&e.push(t),n&&Array.isArray(t.children)?[...e,...t.children.reduce(i,[])]:e}return e&&Array.isArray(e.children)?e.children.reduce(i,[]):[]}function I(e,t,n=!1){return F(e,t,n)[0]||null}function le(e){return e&&Array.isArray(e.children)?[...e.children.filter(e=>e instanceof ae.XmlElement)]:[]}function L(e){let t=e&&Array.isArray(e.children)?e.children.find(e=>e.type===`text`):null;return t?t.text:``}function R(e,t){return e&&e.attributes[t]||``}var z=class extends Error{constructor(e,t,n){super(e),this.httpStatus=t,this.isCrossOriginRelated=n,this.name=`EndpointError`}httpStatus;isCrossOriginRelated},ue=class extends Error{constructor(e,t,n,r,i){super(e),this.requestUrl=t,this.code=n,this.locator=r,this.response=i,this.name=`ServiceExceptionError`}requestUrl;code;locator;response};function de(e,t){let n=R(e,`code`)||R(e,`exceptionCode`),r=R(e,`locator`);return new ue(L(I(e,`ExceptionText`)||e).trim(),t,n,r,e.document)}function fe(e,t){let n=P(e),r=N(ce(n));if(r===`ServiceExceptionReport`){let e=I(n,`ServiceException`);if(e)throw de(e,t)}if(r===`ExceptionReport`){let e=I(n,`Exception`);if(e)throw de(e,t)}return e}function pe(e){let t={message:e.message,stack:e.stack,name:e.name};return e instanceof ue?{...t,code:e.code,locator:e.locator,response:e.response,requestUrl:e.requestUrl}:e instanceof z?{...t,httpStatus:e.httpStatus,isCrossOriginRelated:e.isCrossOriginRelated}:t}function me(e){if(e.name===`ServiceExceptionError`){let t=new ue(e.message,e.requestUrl,e.code,e.locator,e.response);return t.stack=e.stack,t}if(e.name===`EndpointError`){let t=new z(e.message,e.httpStatus,e.isCrossOriginRelated);return t.stack=e.stack,t}let t=Error(e.message);return t.stack=e.stack,t}var he=new EventTarget;function ge(e,t,n){return new Promise((r,i)=>{let a=ie(),o={requestId:a,taskName:e,params:n};t===null?he.dispatchEvent(new CustomEvent(`ogc-client.request`,{detail:o})):t.postMessage(o);let s=e=>{e.requestId===a&&(t===null?he.removeEventListener(`ogc-client.response`,c):t.removeEventListener(`message`,l),`error`in e?i(me(e.error)):r(e.response))},c=e=>s(e.detail),l=e=>s(e.data);t===null?he.addEventListener(`ogc-client.response`,c):t.addEventListener(`message`,l)})}function _e(e,t,n){let r=typeof WorkerGlobalScope<`u`,i=async i=>{if(i.taskName===e){let a,o;try{a=await n(i.params)}catch(e){o=pe(e)}let s={taskName:e,requestId:i.requestId,...a&&{response:a},...o&&{error:o}};r?t.postMessage(s):he.dispatchEvent(new CustomEvent(`ogc-client.response`,{detail:s}))}};r?t.addEventListener(`message`,e=>i(e.data)):he.addEventListener(`ogc-client.request`,e=>i(e.detail))}var ve=[`utf-8`,`utf-16`,`iso-8859-1`],ye=`utf-8`;function be(e){let t=/charset=([^;]+)/.exec(e);return t?t[1]:null}function xe(e,t){let n=t?be(t):null,r=n?[n,...ve]:ve;for(let t of r)try{return new TextDecoder(t,{fatal:!0}).decode(e)}catch{}return console.warn(`[ogc-client] XML document encoding could not be determined, falling back to ${ye}.`),new TextDecoder(ye).decode(e)}var Se=new Map,Ce={},we=null;function Te(e){Ce=e,we&&we(e)}function Ee(){return Ce}function De(e){we=e}function Oe(e,t=`GET`,n,r){let i=`${t}#${e}`;if((n||r)&&(i=`${t}#asJson#${e}`),Se.has(i))return Se.get(i);let a={...Ee()};a.method=t,r?(a.headers=`headers`in a?a.headers:{},a.headers.Accept=r):n&&(a.headers=`headers`in a?a.headers:{},a.headers.Accept=`application/json,application/schema+json`);let o=fetch(e,a).catch(e=>e).then(e=>(Se.delete(i),e));return Se.set(i,o),o.then(e=>{if(e instanceof Error)throw e;return e.clone()})}function ke(e){return Oe(e).catch(()=>fetch(e,{...Ee(),method:`HEAD`,mode:`no-cors`}).catch(t=>{throw new z(`Fetching the document at ${e} failed either due to network errors or unreachable host, error is: ${t.message}`,0,!1)}).then(()=>{throw new z(`The document at ${e} could not be fetched due to CORS limitations`,0,!0)})).then(async t=>{if(!t.ok){let n=await t.text();throw new z(`The document at ${e} could not be fetched, received an error with code ${t.status}: ${n}`,t.status,!1)}return xe(await t.arrayBuffer(),t.headers.get(`Content-Type`))}).then(e=>se(e))}var Ae=`(function() {
	//#region \\0rolldown/runtime.js
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	/*! @rgrove/parse-xml v4.2.3 | ISC License | Copyright Ryan Grove */
	//#endregion
	//#region src/shared/xml-utils.ts
	var import_browser = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
			for (var name in all) __defProp(target, name, {
				get: all[name],
				enumerable: true
			});
		};
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") {
				for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: () => from[key],
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
		var src_exports = {};
		__export(src_exports, {
			XmlCdata: () => XmlCdata,
			XmlComment: () => XmlComment,
			XmlDeclaration: () => XmlDeclaration,
			XmlDocument: () => XmlDocument,
			XmlDocumentType: () => XmlDocumentType,
			XmlElement: () => XmlElement,
			XmlError: () => XmlError,
			XmlNode: () => XmlNode,
			XmlProcessingInstruction: () => XmlProcessingInstruction,
			XmlText: () => XmlText,
			parseXml: () => parseXml
		});
		module.exports = __toCommonJS(src_exports);
		var emptyString = "";
		var surrogatePair = /[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]/g;
		var StringScanner = class {
			constructor(string) {
				this.m = this.u(string, true);
				this.d = 0;
				this.length = string.length;
				this.n = this.m !== this.length;
				this.h = string;
				if (this.n) {
					let charsToBytes = [];
					for (let byteIndex = 0, charIndex = 0; charIndex < this.m; ++charIndex) {
						charsToBytes[charIndex] = byteIndex;
						byteIndex += string.codePointAt(byteIndex) > 65535 ? 2 : 1;
					}
					this.A = charsToBytes;
				}
			}
			/**
			* Whether the current character index is at the end of the input string.
			*/
			get B() {
				return this.d >= this.m;
			}
			/**
			* Returns the number of characters in the given string, which may differ from
			* the byte length if the string contains multibyte characters.
			*/
			u(string, multiByteSafe = this.n) {
				return multiByteSafe ? string.replace(surrogatePair, "_").length : string.length;
			}
			/**
			* Advances the scanner by the given number of characters, stopping if the end
			* of the string is reached.
			*/
			p(count = 1) {
				this.d = Math.min(this.m, this.d + count);
			}
			/**
			* Returns the byte index of the given character index in the string. The two
			* may differ in strings that contain multibyte characters.
			*/
			f(charIndex = this.d) {
				var _a;
				return this.n ? (_a = this.A[charIndex]) != null ? _a : Infinity : charIndex;
			}
			/**
			* Consumes and returns the given number of characters if possible, advancing
			* the scanner and stopping if the end of the string is reached.
			*
			* If no characters could be consumed, an empty string will be returned.
			*/
			G(charCount = 1) {
				let chars = this.j(charCount);
				this.p(charCount);
				return chars;
			}
			/**
			* Consumes and returns the given number of bytes if possible, advancing the
			* scanner and stopping if the end of the string is reached.
			*
			* It's up to the caller to ensure that the given byte count doesn't split a
			* multibyte character.
			*
			* If no bytes could be consumed, an empty string will be returned.
			*/
			v(byteCount) {
				let byteIndex = this.f();
				let result = this.h.slice(byteIndex, byteIndex + byteCount);
				this.p(this.u(result));
				return result;
			}
			/**
			* Consumes and returns all characters for which the given function returns
			* \`true\`, stopping when \`false\` is returned or the end of the input is
			* reached.
			*/
			w(fn) {
				let { length, n: multiByteMode, h: string } = this;
				let startByteIndex = this.f();
				let endByteIndex = startByteIndex;
				if (multiByteMode) while (endByteIndex < length) {
					let char = string[endByteIndex];
					let isSurrogatePair = char >= "\\ud800" && char <= "\\udbff";
					if (isSurrogatePair) char += string[endByteIndex + 1];
					if (!fn(char)) break;
					endByteIndex += isSurrogatePair ? 2 : 1;
				}
				else while (endByteIndex < length && fn(string[endByteIndex])) ++endByteIndex;
				return this.v(endByteIndex - startByteIndex);
			}
			/**
			* Consumes the given string if it exists at the current character index, and
			* advances the scanner.
			*
			* If the given string doesn't exist at the current character index, an empty
			* string will be returned and the scanner will not be advanced.
			*/
			b(stringToConsume) {
				let { length } = stringToConsume;
				let byteIndex = this.f();
				if (stringToConsume === this.h.slice(byteIndex, byteIndex + length)) {
					this.p(length === 1 ? 1 : this.u(stringToConsume));
					return stringToConsume;
				}
				return emptyString;
			}
			/**
			* Consumes characters until the given global regex is matched, advancing the
			* scanner up to (but not beyond) the beginning of the match. If the regex
			* doesn't match, nothing will be consumed.
			*
			* Returns the consumed string, or an empty string if nothing was consumed.
			*/
			x(regex) {
				let matchByteIndex = this.h.slice(this.f()).search(regex);
				return matchByteIndex > 0 ? this.v(matchByteIndex) : emptyString;
			}
			/**
			* Consumes characters until the given string is found, advancing the scanner
			* up to (but not beyond) that point. If the string is never found, nothing
			* will be consumed.
			*
			* Returns the consumed string, or an empty string if nothing was consumed.
			*/
			s(searchString) {
				let byteIndex = this.f();
				let matchByteIndex = this.h.indexOf(searchString, byteIndex);
				return matchByteIndex > 0 ? this.v(matchByteIndex - byteIndex) : emptyString;
			}
			/**
			* Returns the given number of characters starting at the current character
			* index, without advancing the scanner and without exceeding the end of the
			* input string.
			*/
			j(count = 1) {
				let { d: charIndex, h: string } = this;
				return this.n ? string.slice(this.f(charIndex), this.f(charIndex + count)) : string.slice(charIndex, charIndex + count);
			}
			/**
			* Resets the scanner position to the given character _index_, or to the start
			* of the input string if no index is given.
			*
			* If _index_ is negative, the scanner position will be moved backward by that
			* many characters, stopping if the beginning of the string is reached.
			*/
			k(index = 0) {
				this.d = index >= 0 ? Math.min(this.m, index) : Math.max(0, this.d + index);
			}
		};
		var attValueCharDoubleQuote = /["&<]/;
		var attValueCharSingleQuote = /['&<]/;
		var attValueNormalizedWhitespace = /\\r\\n|[\\n\\r\\t]/g;
		var endCharData = /<|&|]]>/;
		var predefinedEntities = Object.freeze(Object.assign(/* @__PURE__ */ Object.create(null), {
			amp: "&",
			apos: "'",
			gt: ">",
			lt: "<",
			quot: "\\""
		}));
		function isNameChar(char) {
			let cp = char.codePointAt(0);
			return cp >= 97 && cp <= 122 || cp >= 65 && cp <= 90 || cp >= 48 && cp <= 57 || cp === 45 || cp === 46 || cp === 183 || cp >= 768 && cp <= 879 || cp === 8255 || cp === 8256 || isNameStartChar(char, cp);
		}
		function isNameStartChar(char, cp = char.codePointAt(0)) {
			return cp >= 97 && cp <= 122 || cp >= 65 && cp <= 90 || cp === 58 || cp === 95 || cp >= 192 && cp <= 214 || cp >= 216 && cp <= 246 || cp >= 248 && cp <= 767 || cp >= 880 && cp <= 893 || cp >= 895 && cp <= 8191 || cp === 8204 || cp === 8205 || cp >= 8304 && cp <= 8591 || cp >= 11264 && cp <= 12271 || cp >= 12289 && cp <= 55295 || cp >= 63744 && cp <= 64975 || cp >= 65008 && cp <= 65533 || cp >= 65536 && cp <= 983039;
		}
		function isReferenceChar(char) {
			return char === "#" || isNameChar(char);
		}
		function isWhitespace(char) {
			let cp = char.codePointAt(0);
			return cp === 32 || cp === 9 || cp === 10 || cp === 13;
		}
		function isXmlCodePoint(cp) {
			return cp >= 32 && cp <= 55295 || cp === 10 || cp === 9 || cp === 13 || cp >= 57344 && cp <= 65533 || cp >= 65536 && cp <= 1114111;
		}
		var _XmlNode = class _XmlNode {
			constructor() {
				/**
				* Parent node of this node, or \`null\` if this node has no parent.
				*/
				this.parent = null;
				/**
				* Starting byte offset of this node in the original XML string, or \`-1\` if
				* the offset is unknown.
				*/
				this.start = -1;
				/**
				* Ending byte offset of this node in the original XML string, or \`-1\` if the
				* offset is unknown.
				*/
				this.end = -1;
			}
			/**
			* Document that contains this node, or \`null\` if this node is not associated
			* with a document.
			*/
			get document() {
				var _a, _b;
				return (_b = (_a = this.parent) == null ? void 0 : _a.document) != null ? _b : null;
			}
			/**
			* Whether this node is the root node of the document (also known as the
			* document element).
			*/
			get isRootNode() {
				return this.parent !== null && this.parent === this.document && this.type === _XmlNode.TYPE_ELEMENT;
			}
			/**
			* Whether whitespace should be preserved in the content of this element and
			* its children.
			*
			* This is influenced by the value of the special \`xml:space\` attribute, and
			* will be \`true\` for any node whose \`xml:space\` attribute is set to
			* "preserve". If a node has no such attribute, it will inherit the value of
			* the nearest ancestor that does (if any).
			*
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-white-space
			*/
			get preserveWhitespace() {
				var _a;
				return !!((_a = this.parent) == null ? void 0 : _a.preserveWhitespace);
			}
			/**
			* Type of this node.
			*
			* The value of this property is a string that matches one of the static
			* \`TYPE_*\` properties on the \`XmlNode\` class (e.g. \`TYPE_ELEMENT\`,
			* \`TYPE_TEXT\`, etc.).
			*
			* The \`XmlNode\` class itself is a base class and doesn't have its own type
			* name.
			*/
			get type() {
				return "";
			}
			/**
			* Returns a JSON-serializable object representing this node, minus properties
			* that could result in circular references.
			*/
			toJSON() {
				let json = { type: this.type };
				if (this.isRootNode) json.isRootNode = true;
				if (this.preserveWhitespace) json.preserveWhitespace = true;
				if (this.start !== -1) {
					json.start = this.start;
					json.end = this.end;
				}
				return json;
			}
		};
		/**
		* Type value for an \`XmlCdata\` node.
		*/
		_XmlNode.TYPE_CDATA = "cdata";
		/**
		* Type value for an \`XmlComment\` node.
		*/
		_XmlNode.TYPE_COMMENT = "comment";
		/**
		* Type value for an \`XmlDocument\` node.
		*/
		_XmlNode.TYPE_DOCUMENT = "document";
		/**
		* Type value for an \`XmlDocumentType\` node.
		*/
		_XmlNode.TYPE_DOCUMENT_TYPE = "doctype";
		/**
		* Type value for an \`XmlElement\` node.
		*/
		_XmlNode.TYPE_ELEMENT = "element";
		/**
		* Type value for an \`XmlProcessingInstruction\` node.
		*/
		_XmlNode.TYPE_PROCESSING_INSTRUCTION = "pi";
		/**
		* Type value for an \`XmlText\` node.
		*/
		_XmlNode.TYPE_TEXT = "text";
		/**
		* Type value for an \`XmlDeclaration\` node.
		*/
		_XmlNode.TYPE_XML_DECLARATION = "xmldecl";
		var XmlNode = _XmlNode;
		var XmlText = class extends XmlNode {
			constructor(text = "") {
				super();
				this.text = text;
			}
			get type() {
				return XmlNode.TYPE_TEXT;
			}
			toJSON() {
				return Object.assign(XmlNode.prototype.toJSON.call(this), { text: this.text });
			}
		};
		var XmlCdata = class extends XmlText {
			get type() {
				return XmlNode.TYPE_CDATA;
			}
		};
		var XmlComment = class extends XmlNode {
			constructor(content = "") {
				super();
				this.content = content;
			}
			get type() {
				return XmlNode.TYPE_COMMENT;
			}
			toJSON() {
				return Object.assign(XmlNode.prototype.toJSON.call(this), { content: this.content });
			}
		};
		var XmlDeclaration = class extends XmlNode {
			constructor(version, encoding, standalone) {
				super();
				this.version = version;
				this.encoding = encoding != null ? encoding : null;
				this.standalone = standalone != null ? standalone : null;
			}
			get type() {
				return XmlNode.TYPE_XML_DECLARATION;
			}
			toJSON() {
				let json = XmlNode.prototype.toJSON.call(this);
				json.version = this.version;
				for (let key of ["encoding", "standalone"]) if (this[key] !== null) json[key] = this[key];
				return json;
			}
		};
		var XmlElement = class _XmlElement extends XmlNode {
			constructor(name, attributes = /* @__PURE__ */ Object.create(null), children = []) {
				super();
				this.name = name;
				this.attributes = attributes;
				this.children = children;
			}
			/**
			* Whether this element is empty (meaning it has no children).
			*/
			get isEmpty() {
				return this.children.length === 0;
			}
			get preserveWhitespace() {
				let node = this;
				while (node instanceof _XmlElement) {
					if ("xml:space" in node.attributes) return node.attributes["xml:space"] === "preserve";
					node = node.parent;
				}
				return false;
			}
			/**
			* Text content of this element and all its descendants.
			*/
			get text() {
				return this.children.map((child) => "text" in child ? child.text : "").join("");
			}
			get type() {
				return XmlNode.TYPE_ELEMENT;
			}
			toJSON() {
				return Object.assign(XmlNode.prototype.toJSON.call(this), {
					name: this.name,
					attributes: this.attributes,
					children: this.children.map((child) => child.toJSON())
				});
			}
		};
		var XmlDocument = class extends XmlNode {
			constructor(children = []) {
				super();
				this.children = children;
			}
			get document() {
				return this;
			}
			/**
			* Root element of this document, or \`null\` if this document is empty.
			*/
			get root() {
				for (let child of this.children) if (child instanceof XmlElement) return child;
				return null;
			}
			/**
			* Text content of this document and all its descendants.
			*/
			get text() {
				return this.children.map((child) => "text" in child ? child.text : "").join("");
			}
			get type() {
				return XmlNode.TYPE_DOCUMENT;
			}
			toJSON() {
				return Object.assign(XmlNode.prototype.toJSON.call(this), { children: this.children.map((child) => child.toJSON()) });
			}
		};
		var XmlDocumentType = class extends XmlNode {
			constructor(name, publicId, systemId, internalSubset) {
				super();
				this.name = name;
				this.publicId = publicId != null ? publicId : null;
				this.systemId = systemId != null ? systemId : null;
				this.internalSubset = internalSubset != null ? internalSubset : null;
			}
			get type() {
				return XmlNode.TYPE_DOCUMENT_TYPE;
			}
			toJSON() {
				let json = XmlNode.prototype.toJSON.call(this);
				json.name = this.name;
				for (let key of [
					"publicId",
					"systemId",
					"internalSubset"
				]) if (this[key] !== null) json[key] = this[key];
				return json;
			}
		};
		var XmlError = class extends Error {
			constructor(message, charIndex, xml) {
				let column = 1;
				let excerpt = "";
				let line = 1;
				for (let i = 0; i < charIndex; ++i) {
					let char = xml[i];
					if (char === "\\n") {
						column = 1;
						excerpt = "";
						line += 1;
					} else {
						column += 1;
						excerpt += char;
					}
				}
				let eol = xml.indexOf("\\n", charIndex);
				excerpt += eol === -1 ? xml.slice(charIndex) : xml.slice(charIndex, eol);
				let excerptStart = 0;
				if (excerpt.length > 50) if (column < 40) excerpt = excerpt.slice(0, 50);
				else {
					excerptStart = column - 20;
					excerpt = excerpt.slice(excerptStart, column + 30);
				}
				super(\`\${message} (line \${line}, column \${column})
  \${excerpt}
\` + " ".repeat(column - excerptStart + 1) + "^\\n");
				this.column = column;
				this.excerpt = excerpt;
				this.line = line;
				this.name = "XmlError";
				this.pos = charIndex;
			}
		};
		var XmlProcessingInstruction = class extends XmlNode {
			constructor(name, content = "") {
				super();
				this.name = name;
				this.content = content;
			}
			get type() {
				return XmlNode.TYPE_PROCESSING_INSTRUCTION;
			}
			toJSON() {
				return Object.assign(XmlNode.prototype.toJSON.call(this), {
					name: this.name,
					content: this.content
				});
			}
		};
		var emptyString2 = "";
		var Parser = class {
			/**
			* @param xml XML string to parse.
			* @param options Parser options.
			*/
			constructor(xml, options = {}) {
				let doc = this.document = new XmlDocument();
				this.l = doc;
				this.g = options;
				this.c = new StringScanner(xml);
				if (this.g.includeOffsets) {
					doc.start = 0;
					doc.end = xml.length;
				}
				this.parse();
			}
			/**
			* Adds the given \`XmlNode\` as a child of \`this.currentNode\`.
			*/
			i(node, charIndex) {
				node.parent = this.l;
				if (this.g.includeOffsets) {
					node.start = this.c.f(charIndex);
					node.end = this.c.f();
				}
				this.l.children.push(node);
				return true;
			}
			/**
			* Adds the given _text_ to the document, either by appending it to a
			* preceding \`XmlText\` node (if possible) or by creating a new \`XmlText\` node.
			*
			* When _normalize_ is \`true\` (the default), line breaks in _text_ are
			* normalized per section 2.11 of the XML spec. This must be \`false\` for text
			* that comes from a character or entity reference, since references aren't
			* subject to line break normalization.
			*/
			y(text, charIndex, normalize = true) {
				let { children } = this.l;
				let { length } = children;
				if (normalize) text = normalizeLineBreaks(text);
				if (length > 0) {
					let prevNode = children[length - 1];
					if ((prevNode == null ? void 0 : prevNode.type) === XmlNode.TYPE_TEXT) {
						let textNode = prevNode;
						textNode.text += text;
						if (this.g.includeOffsets) textNode.end = this.c.f();
						return true;
					}
				}
				return this.i(new XmlText(text), charIndex);
			}
			/**
			* Consumes element attributes.
			*
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-starttags
			*/
			H() {
				let attributes = /* @__PURE__ */ Object.create(null);
				while (this.e()) {
					let attrName = this.q();
					if (!attrName) break;
					let attrValue = this.t() && this.I();
					if (attrValue === false) throw this.a("Attribute value expected");
					if (attrName in attributes) throw this.a(\`Duplicate attribute: \${attrName}\`);
					if (attrName === "xml:space" && attrValue !== "default" && attrValue !== "preserve") throw this.a("Value of the \`xml:space\` attribute must be \\"default\\" or \\"preserve\\"");
					attributes[attrName] = attrValue;
				}
				if (this.g.sortAttributes) {
					let attrNames = Object.keys(attributes).sort();
					let sortedAttributes = /* @__PURE__ */ Object.create(null);
					for (let i = 0; i < attrNames.length; ++i) {
						let attrName = attrNames[i];
						sortedAttributes[attrName] = attributes[attrName];
					}
					attributes = sortedAttributes;
				}
				return attributes;
			}
			/**
			* Consumes an \`AttValue\` (attribute value) if possible.
			*
			* @returns
			*   Contents of the \`AttValue\` minus quotes, or \`false\` if nothing was
			*   consumed. An empty string indicates that an \`AttValue\` was consumed but
			*   was empty.
			*
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-AttValue
			*/
			I() {
				let { c: scanner } = this;
				let quote = scanner.j();
				if (quote !== "\\"" && quote !== "'") return false;
				scanner.p();
				let chars;
				let isClosed = false;
				let value = emptyString2;
				let regex = quote === "\\"" ? attValueCharDoubleQuote : attValueCharSingleQuote;
				matchLoop: while (!scanner.B) {
					chars = scanner.x(regex);
					if (chars) {
						this.o(chars);
						value += chars.replace(attValueNormalizedWhitespace, " ");
					}
					switch (scanner.j()) {
						case quote:
							isClosed = true;
							break matchLoop;
						case "&":
							value += this.C();
							continue;
						case "<": throw this.a("Unescaped \`<\` is not allowed in an attribute value");
						default: break matchLoop;
					}
				}
				if (!isClosed) throw this.a("Unclosed attribute");
				scanner.p();
				return value;
			}
			/**
			* Consumes a CDATA section if possible.
			*
			* @returns Whether a CDATA section was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-cdata-sect
			*/
			J() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				if (!scanner.b("<![CDATA[")) return false;
				let text = scanner.s("]]>");
				this.o(text);
				if (!scanner.b("]]>")) throw this.a("Unclosed CDATA section");
				return this.g.preserveCdata ? this.i(new XmlCdata(normalizeLineBreaks(text)), startIndex) : this.y(text, startIndex);
			}
			/**
			* Consumes character data if possible.
			*
			* @returns Whether character data was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#dt-chardata
			*/
			K() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				let charData = scanner.x(endCharData);
				if (!charData) return false;
				this.o(charData);
				if (scanner.j(3) === "]]>") throw this.a("Element content may not contain the CDATA section close delimiter \`]]>\`");
				return this.y(charData, startIndex);
			}
			/**
			* Consumes a comment if possible.
			*
			* @returns Whether a comment was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Comment
			*/
			D() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				if (!scanner.b("<!--")) return false;
				let content = scanner.s("--");
				this.o(content);
				if (!scanner.b("-->")) {
					if (scanner.j(2) === "--") throw this.a("The string \`--\` isn't allowed inside a comment");
					throw this.a("Unclosed comment");
				}
				return this.g.preserveComments ? this.i(new XmlComment(normalizeLineBreaks(content)), startIndex) : true;
			}
			/**
			* Consumes a reference in a content context if possible.
			*
			* This differs from \`consumeReference()\` in that a consumed reference will be
			* added to the document as a text node instead of returned.
			*
			* @returns Whether a reference was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#entproc
			*/
			L() {
				let startIndex = this.c.d;
				let ref = this.C();
				return ref ? this.y(ref, startIndex, false) : false;
			}
			/**
			* Consumes a doctype declaration if possible.
			*
			* This is a loose implementation since doctype declarations are currently
			* discarded without further parsing.
			*
			* @returns Whether a doctype declaration was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#dtd
			*/
			M() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				if (!scanner.b("<!DOCTYPE")) return false;
				let name = this.e() && this.q();
				if (!name) throw this.a("Expected a name");
				let publicId;
				let systemId;
				if (this.e()) {
					if (scanner.b("PUBLIC")) {
						publicId = this.e() && this.N();
						if (publicId === false) throw this.a("Expected a public identifier");
						this.e();
					}
					if (publicId !== void 0 || scanner.b("SYSTEM")) {
						this.e();
						systemId = this.r();
						if (systemId === false) throw this.a("Expected a system identifier");
						this.e();
					}
				}
				let internalSubset;
				if (scanner.b("[")) {
					internalSubset = scanner.x(/\\][\\x20\\t\\r\\n]*>/);
					if (!scanner.b("]")) throw this.a("Unclosed internal subset");
					this.e();
				}
				if (!scanner.b(">")) throw this.a("Unclosed doctype declaration");
				return this.g.preserveDocumentType ? this.i(new XmlDocumentType(name, publicId, systemId, internalSubset), startIndex) : true;
			}
			/**
			* Consumes an element if possible.
			*
			* @returns Whether an element was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-element
			*/
			E() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				if (!scanner.b("<")) return false;
				let name = this.q();
				if (!name) {
					scanner.k(startIndex);
					return false;
				}
				let attributes = this.H();
				let isEmpty = !!scanner.b("/>");
				let element = new XmlElement(name, attributes);
				element.parent = this.l;
				if (!isEmpty) {
					if (!scanner.b(">")) throw this.a(\`Unclosed start tag for element \\\`\${name}\\\`\`);
					this.l = element;
					do
						this.K();
					while (this.E() || this.L() || this.J() || this.F() || this.D());
					let endTagMark = scanner.d;
					let endTagName;
					if (!scanner.b("</") || !(endTagName = this.q()) || endTagName !== name) {
						scanner.k(endTagMark);
						throw this.a(\`Missing end tag for element \${name}\`);
					}
					this.e();
					if (!scanner.b(">")) throw this.a(\`Unclosed end tag for element \${name}\`);
					this.l = element.parent;
				}
				return this.i(element, startIndex);
			}
			/**
			* Consumes an \`Eq\` production if possible.
			*
			* @returns Whether an \`Eq\` production was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Eq
			*/
			t() {
				this.e();
				if (this.c.b("=")) {
					this.e();
					return true;
				}
				return false;
			}
			/**
			* Consumes \`Misc\` content if possible.
			*
			* @returns Whether anything was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Misc
			*/
			z() {
				return this.D() || this.F() || this.e();
			}
			/**
			* Consumes one or more \`Name\` characters if possible.
			*
			* @returns \`Name\` characters, or an empty string if none were consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Name
			*/
			q() {
				return isNameStartChar(this.c.j()) ? this.c.w(isNameChar) : emptyString2;
			}
			/**
			* Consumes a processing instruction if possible.
			*
			* @returns Whether a processing instruction was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-pi
			*/
			F() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				if (!scanner.b("<?")) return false;
				let name = this.q();
				if (name) {
					if (name.toLowerCase() === "xml") {
						scanner.k(startIndex);
						throw this.a("XML declaration isn't allowed here");
					}
				} else throw this.a("Invalid processing instruction");
				if (!this.e()) {
					if (scanner.b("?>")) return this.i(new XmlProcessingInstruction(name), startIndex);
					throw this.a("Whitespace is required after a processing instruction name");
				}
				let content = scanner.s("?>");
				this.o(content);
				if (!scanner.b("?>")) throw this.a("Unterminated processing instruction");
				return this.i(new XmlProcessingInstruction(name, normalizeLineBreaks(content)), startIndex);
			}
			/**
			* Consumes a prolog if possible.
			*
			* @returns Whether a prolog was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-prolog-dtd
			*/
			O() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				this.P();
				while (this.z());
				if (this.M()) while (this.z());
				return startIndex < scanner.d;
			}
			/**
			* Consumes a public identifier literal if possible.
			*
			* @returns
			*   Value of the public identifier literal minus quotes, or \`false\` if
			*   nothing was consumed. An empty string indicates that a public id literal
			*   was consumed but was empty.
			*
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-PubidLiteral
			*/
			N() {
				let startIndex = this.c.d;
				let value = this.r();
				if (value !== false && !/^[-\\x20\\r\\na-zA-Z0-9'()+,./:=?;!*#@$_%]*$/.test(value)) {
					this.c.k(startIndex);
					throw this.a("Invalid character in public identifier");
				}
				return value;
			}
			/**
			* Consumes a reference if possible.
			*
			* This differs from \`consumeContentReference()\` in that a consumed reference
			* will be returned rather than added to the document.
			*
			* @returns
			*   Parsed reference value, or \`false\` if nothing was consumed (to
			*   distinguish from a reference that resolves to an empty string).
			*
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Reference
			*/
			C() {
				let { c: scanner } = this;
				if (!scanner.b("&")) return false;
				let ref = scanner.w(isReferenceChar);
				if (scanner.G() !== ";") throw this.a("Unterminated reference (a reference must end with \`;\`)");
				let parsedValue;
				if (ref[0] === "#") {
					let codePoint = ref[1] === "x" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
					if (isNaN(codePoint) || !/^#(?:x[0-9A-Fa-f]+|[0-9]+)$/.test(ref)) throw this.a("Invalid character reference");
					if (!isXmlCodePoint(codePoint)) throw this.a("Character reference resolves to an invalid character");
					parsedValue = String.fromCodePoint(codePoint);
				} else {
					parsedValue = predefinedEntities[ref];
					if (parsedValue === void 0) {
						let { ignoreUndefinedEntities, resolveUndefinedEntity } = this.g;
						let wrappedRef = \`&\${ref};\`;
						if (resolveUndefinedEntity) {
							let resolvedValue = resolveUndefinedEntity(wrappedRef);
							if (resolvedValue !== null && resolvedValue !== void 0) {
								let type = typeof resolvedValue;
								if (type !== "string") throw new TypeError(\`\\\`resolveUndefinedEntity()\\\` must return a string, \\\`null\\\`, or \\\`undefined\\\`, but returned a value of type \${type}\`);
								return resolvedValue;
							}
						}
						if (ignoreUndefinedEntities) return wrappedRef;
						scanner.k(-wrappedRef.length);
						throw this.a(\`Named entity isn't defined: \${wrappedRef}\`);
					}
				}
				return parsedValue;
			}
			/**
			* Consumes a \`SystemLiteral\` if possible.
			*
			* A \`SystemLiteral\` is similar to an attribute value, but allows the
			* characters \`<\` and \`&\` and doesn't replace references.
			*
			* @returns
			*   Value of the \`SystemLiteral\` minus quotes, or \`false\` if nothing was
			*   consumed. An empty string indicates that a \`SystemLiteral\` was consumed
			*   but was empty.
			*
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-SystemLiteral
			*/
			r() {
				let { c: scanner } = this;
				let quote = scanner.b("\\"") || scanner.b("'");
				if (!quote) return false;
				let value = scanner.s(quote);
				this.o(value);
				if (!scanner.b(quote)) throw this.a("Missing end quote");
				return value;
			}
			/**
			* Consumes one or more whitespace characters if possible.
			*
			* @returns Whether any whitespace characters were consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#white
			*/
			e() {
				return !!this.c.w(isWhitespace);
			}
			/**
			* Consumes an XML declaration if possible.
			*
			* @returns Whether an XML declaration was consumed.
			* @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-XMLDecl
			*/
			P() {
				let { c: scanner } = this;
				let startIndex = scanner.d;
				if (!scanner.b("<?xml")) return false;
				if (isNameChar(scanner.j())) {
					scanner.k(startIndex);
					return false;
				}
				if (!this.e()) throw this.a("Invalid XML declaration");
				let version = !!scanner.b("version") && this.t() && this.r();
				if (version === false) throw this.a("XML version is missing or invalid");
				else if (!/^1\\.[0-9]+$/.test(version)) throw this.a("Invalid character in version number");
				let encoding;
				let standalone;
				if (this.e()) {
					encoding = !!scanner.b("encoding") && this.t() && this.r();
					if (encoding) {
						if (!/^[A-Za-z][\\w.-]*$/.test(encoding)) throw this.a("Invalid character in encoding name");
						this.e();
					}
					standalone = !!scanner.b("standalone") && this.t() && this.r();
					if (standalone) {
						if (standalone !== "yes" && standalone !== "no") throw this.a("Only \\"yes\\" and \\"no\\" are permitted as values of \`standalone\`");
						this.e();
					}
				}
				if (!scanner.b("?>")) throw this.a("Invalid or unclosed XML declaration");
				return this.g.preserveXmlDeclaration ? this.i(new XmlDeclaration(version, encoding || void 0, standalone || void 0), startIndex) : true;
			}
			/**
			* Returns an \`XmlError\` for the current scanner position.
			*/
			a(message) {
				let { c: scanner } = this;
				return new XmlError(message, scanner.d, scanner.h);
			}
			/**
			* Parses the XML input.
			*/
			parse() {
				this.c.b("﻿");
				this.O();
				if (!this.E()) throw this.a("Root element is missing or invalid");
				while (this.z());
				if (!this.c.B) throw this.a("Extra content at the end of the document");
			}
			/**
			* Throws an invalid character error if any character in the given _string_
			* isn't a valid XML character.
			*/
			o(string) {
				let { length } = string;
				for (let i = 0; i < length; ++i) {
					let cp = string.codePointAt(i);
					if (!isXmlCodePoint(cp)) {
						this.c.k(-([...string].length - i));
						throw this.a("Invalid character");
					}
					if (cp > 65535) i += 1;
				}
			}
		};
		function normalizeLineBreaks(text) {
			let i = 0;
			while ((i = text.indexOf("\\r", i)) !== -1) text = text[i + 1] === "\\n" ? text.slice(0, i) + text.slice(i + 1) : text.slice(0, i) + "\\n" + text.slice(i + 1);
			return text;
		}
		function parseXml(xml, options) {
			return new Parser(xml, options).document;
		}
	})))();
	var XmlParseError = class extends Error {
		constructor(message) {
			super(message);
		}
	};
	/**
	* Parses an XML document as string, return a document object
	*/
	function parseXmlString(xmlString) {
		let doc = null;
		try {
			doc = (0, import_browser.parseXml)(xmlString);
		} catch (e) {
			throw new XmlParseError(e.message);
		}
		return doc;
	}
	/**
	* Will do nothing if no namespace present
	* @param {string} name
	* @return {string}
	*/
	function stripNamespace(name) {
		const colon = name.indexOf(":");
		return colon > -1 ? name.substr(colon + 1) : name;
	}
	function getRootElement(xmlDoc) {
		return xmlDoc.children[0];
	}
	function getElementName(element) {
		return element.name || "";
	}
	/**
	* Will return all matching elements (namespace will be ignored)
	* @param element Element to look into
	* @param name element name
	* @param [nested] if true, will lookup children of children too
	* @return Returns an empty array if no match found
	*/
	function findChildrenElement(element, name, nested = false) {
		const strippedName = stripNamespace(name);
		function reducer(prev, curr) {
			if (stripNamespace(getElementName(curr)) === strippedName) prev.push(curr);
			if (nested && Array.isArray(curr.children)) return [...prev, ...curr.children.reduce(reducer, [])];
			else return prev;
		}
		return element && Array.isArray(element.children) ? element.children.reduce(reducer, []) : [];
	}
	/**
	* Will return the first matching element
	* @param element Element to look into
	* @param name element name
	* @param [nested] if true, will lookup children of children too
	* @return Returns null if no matching element found
	*/
	function findChildElement(element, name, nested = false) {
		return findChildrenElement(element, name, nested)[0] || null;
	}
	/**
	* Will return all children elements
	* @param {XmlElement} element Element to look into
	* @return {XmlElement[]} Returns empty array if no element found
	*/
	function getChildrenElement(element) {
		return element && Array.isArray(element.children) ? [...element.children.filter((el) => el instanceof import_browser.XmlElement)] : [];
	}
	/**
	* Returns the text node in the element. Note that giving an null element
	* will simply return an empty string.
	* @param element
	* @return found text or empty string if no text node found
	*/
	function getElementText(element) {
		const textNode = element && Array.isArray(element.children) ? element.children.find((node) => node.type === "text") : null;
		return textNode ? textNode.text : "";
	}
	/**
	* Returns the element's attribute value. Note that giving an null element
	* will simply return an empty string.
	* @param element
	* @param attrName
	* @return found attribute value or empty if non-existent
	*/
	function getElementAttribute(element, attrName) {
		return element && element.attributes[attrName] || "";
	}
	//#endregion
	//#region src/shared/errors.ts
	/**
	* This error will be thrown whenever there's an issue to connect to an endpoint of any kind.
	*
	* The properties of the error will give more information of the nature of the issue encountered.
	*/
	var EndpointError = class extends Error {
		httpStatus;
		isCrossOriginRelated;
		/**
		* @param message Error message
		* @param [httpStatus] HTTP status encountered, if an HTTP error response was received; will be undefined otherwise, for instance if the host is unreachable or a network error happens.
		* @param [isCrossOriginRelated] Will be true if it turns out a service is not reachable because of [CORS-related issues](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS). In that case, no HTTP code is available.
		* @private (hidden from API docs)
		*/
		constructor(message, httpStatus, isCrossOriginRelated) {
			super(message);
			this.httpStatus = httpStatus;
			this.isCrossOriginRelated = isCrossOriginRelated;
			this.name = "EndpointError";
		}
	};
	/**
	* Representation of an Exception reported by an OWS service
	*
	* This is typically thrown when an OWS service answers with a \`ServiceExceptionReport\` XML document.
	*/
	var ServiceExceptionError = class extends Error {
		requestUrl;
		code;
		locator;
		response;
		/**
		* @param message Error message
		* @param requestUrl URL which resulted in the ServiceException
		* @param code Optional ServiceException code
		* @param locator Optional ServiceException locator
		* @param response Optional response content received
		* @private (hidden from API docs)
		*/
		constructor(message, requestUrl, code, locator, response) {
			super(message);
			this.requestUrl = requestUrl;
			this.code = code;
			this.locator = locator;
			this.response = response;
			this.name = "ServiceExceptionError";
		}
	};
	/**
	* Parse a ServiceException element to a ServiceExceptionError
	* @param serviceException ServiceException element
	* @param url URL from which the ServiceException was generated
	*/
	function parse(serviceException, url) {
		const errorCode = getElementAttribute(serviceException, "code") || getElementAttribute(serviceException, "exceptionCode");
		const errorLocator = getElementAttribute(serviceException, "locator");
		return new ServiceExceptionError(getElementText(findChildElement(serviceException, "ExceptionText") || serviceException).trim(), url, errorCode, errorLocator, serviceException.document);
	}
	/**
	* Check the response for a ServiceExceptionReport and if present throw one
	* @param response Response to check
	* @param url URL from which response was generated
	*/
	function check(response, url) {
		const rootEl = getRootElement(response);
		const rootElName = stripNamespace(getElementName(rootEl));
		if (rootElName === "ServiceExceptionReport") {
			const error = findChildElement(rootEl, "ServiceException");
			if (error) throw parse(error, url);
		}
		if (rootElName === "ExceptionReport") {
			const error = findChildElement(rootEl, "Exception");
			if (error) throw parse(error, url);
		}
		return response;
	}
	/**
	* This transforms an error object into a JSON-serializable object to be
	* transferred from a worker
	*/
	function encodeError(error) {
		const base = {
			message: error.message,
			stack: error.stack,
			name: error.name
		};
		if (error instanceof ServiceExceptionError) return {
			...base,
			code: error.code,
			locator: error.locator,
			response: error.response,
			requestUrl: error.requestUrl
		};
		if (error instanceof EndpointError) return {
			...base,
			httpStatus: error.httpStatus,
			isCrossOriginRelated: error.isCrossOriginRelated
		};
		return base;
	}
	//#endregion
	//#region src/worker/utils.ts
	const fallbackEventTarget = new EventTarget();
	/**
	* @param {string} taskName
	* @param {DedicatedWorkerGlobalScope|Window} scope
	* @param {function(params: Object):Promise<Object>} handler
	*/
	function addTaskHandler(taskName, scope, handler) {
		const useWorker = typeof WorkerGlobalScope !== "undefined";
		const eventHandler = async (request) => {
			if (request.taskName === taskName) {
				let response, error;
				try {
					response = await handler(request.params);
				} catch (e) {
					error = encodeError(e);
				}
				const message = (				/** @type {WorkerResponse} */ {
					taskName,
					requestId: request.requestId,
					...response && { response },
					...error && { error }
				});
				if (useWorker) scope.postMessage(message);
				else fallbackEventTarget.dispatchEvent(new CustomEvent("ogc-client.response", { detail: message }));
			}
		};
		if (useWorker) scope.addEventListener("message", (event) => eventHandler(event.data));
		else fallbackEventTarget.addEventListener("ogc-client.request", (event) => eventHandler(event.detail));
	}
	//#endregion
	//#region src/shared/encoding.ts
	/**
	* A list of encodings that will be used in order when decoding a string
	* Note: a string might be successfully decoded with e.g. utf-8 but still
	* contain invalid chars; the correct encoding cannot be guessed and has to
	* be indicated with a header
	*/
	const ENCODINGS = [
		"utf-8",
		"utf-16",
		"iso-8859-1"
	];
	const FALLBACK_ENCODING = "utf-8";
	function extractEncoding(contentType) {
		const matches = /charset=([^;]+)/.exec(contentType);
		return matches ? matches[1] : null;
	}
	/**
	* @param buffer Buffer containing the string to decode
	* @param [contentType] Optional content type header, used to determine the response type
	* @returns null if decoding failed
	*/
	function decodeString(buffer, contentType) {
		const encodingHint = contentType ? extractEncoding(contentType) : null;
		const encodingAttempts = encodingHint ? [encodingHint, ...ENCODINGS] : ENCODINGS;
		for (const encoding of encodingAttempts) try {
			return new TextDecoder(encoding, { fatal: true }).decode(buffer);
		} catch {}
		console.warn(\`[ogc-client] XML document encoding could not be determined, falling back to \${FALLBACK_ENCODING}.\`);
		return new TextDecoder(FALLBACK_ENCODING).decode(buffer);
	}
	//#endregion
	//#region src/shared/http-utils.ts
	const fetchPromises = /* @__PURE__ */ new Map();
	let fetchOptions = {};
	/**
	* Set advanced options to be used by all fetch() calls
	* @param options
	*/
	function setFetchOptions(options) {
		fetchOptions = options;
	}
	/**
	* Returns current fetch() options
	*/
	function getFetchOptions() {
		return fetchOptions;
	}
	/**
	* Returns a promise equivalent to \`fetch(url)\` but guarded against
	* identical concurrent requests
	* Note: this should only be used for GET requests!
	*/
	function sharedFetch(url, method = "GET", asJson, customAcceptHeader) {
		let fetchKey = \`\${method}#\${url}\`;
		if (asJson || customAcceptHeader) fetchKey = \`\${method}#asJson#\${url}\`;
		if (fetchPromises.has(fetchKey)) return fetchPromises.get(fetchKey);
		const options = { ...getFetchOptions() };
		options.method = method;
		if (customAcceptHeader) {
			options.headers = "headers" in options ? options.headers : {};
			options.headers["Accept"] = customAcceptHeader;
		} else if (asJson) {
			options.headers = "headers" in options ? options.headers : {};
			options.headers["Accept"] = "application/json,application/schema+json";
		}
		const promise = fetch(url, options).catch((e) => e).then((resp) => {
			fetchPromises.delete(fetchKey);
			return resp;
		});
		fetchPromises.set(fetchKey, promise);
		return promise.then((resp) => {
			if (resp instanceof Error) throw resp;
			return resp.clone();
		});
	}
	/**
	* Runs a GET HTTP request to the provided URL and resolves to the
	* XmlDocument
	*/
	function queryXmlDocument(url) {
		return sharedFetch(url).catch(() => fetch(url, {
			...getFetchOptions(),
			method: "HEAD",
			mode: "no-cors"
		}).catch((error) => {
			throw new EndpointError(\`Fetching the document at \${url} failed either due to network errors or unreachable host, error is: \${error.message}\`, 0, false);
		}).then(() => {
			throw new EndpointError(\`The document at \${url} could not be fetched due to CORS limitations\`, 0, true);
		})).then(async (resp) => {
			if (!resp.ok) {
				const text = await resp.text();
				throw new EndpointError(\`The document at \${url} could not be fetched, received an error with code \${resp.status}: \${text}\`, resp.status, false);
			}
			return decodeString(await resp.arrayBuffer(), resp.headers.get("Content-Type"));
		}).then((xml) => parseXmlString(xml));
	}
	//#endregion
	//#region src/shared/crs-utils.ts
	const LatLonCrsList = [
		"EPSG:4046",
		"EPSG:4075",
		"EPSG:4120",
		"EPSG:4122",
		"EPSG:4124",
		"EPSG:4126",
		"EPSG:4149",
		"EPSG:4151",
		"EPSG:4153",
		"EPSG:4155",
		"EPSG:4157",
		"EPSG:4159",
		"EPSG:4161",
		"EPSG:4163",
		"EPSG:4165",
		"EPSG:4167",
		"EPSG:4169",
		"EPSG:4171",
		"EPSG:4173",
		"EPSG:4175",
		"EPSG:4178",
		"EPSG:4180",
		"EPSG:4182",
		"EPSG:4184",
		"EPSG:4188",
		"EPSG:4190",
		"EPSG:4191",
		"EPSG:4196",
		"EPSG:4198",
		"EPSG:4202",
		"EPSG:4210",
		"EPSG:4211",
		"EPSG:4214",
		"EPSG:4226",
		"EPSG:4229",
		"EPSG:4231",
		"EPSG:4233",
		"EPSG:4236",
		"EPSG:4238",
		"EPSG:4240",
		"EPSG:4242",
		"EPSG:4244",
		"EPSG:4246",
		"EPSG:4248",
		"EPSG:4250",
		"EPSG:4252",
		"EPSG:4255",
		"EPSG:4258",
		"EPSG:4261",
		"EPSG:4264",
		"EPSG:4267",
		"EPSG:4270",
		"EPSG:4273",
		"EPSG:4276",
		"EPSG:4279",
		"EPSG:4281",
		"EPSG:4284",
		"EPSG:4286",
		"EPSG:4288",
		"EPSG:4292",
		"EPSG:4295",
		"EPSG:4297",
		"EPSG:4299",
		"EPSG:4302",
		"EPSG:4324",
		"EPSG:4326"
	];
	/**
	* Inverted coordinates is meant from the POV of a programmer, i.e. Y before X
	* Note: can handle full URNs for EPSG codes
	*/
	function hasInvertedCoordinates(crsName) {
		return LatLonCrsList.indexOf(simplifyEpsgUrn(crsName)) > -1;
	}
	/**
	* When given a full URN pointing to an EPSG code, will return the simplified
	* name, e.g.: \`urn:ogc:def:crs:EPSG::2154\` translates to \`EPSG:2154\`
	* On other kind of URNs (i.e. \`urn:ogc:def:crs:OGC:1.3:CRS84\`), returns the
	* URN untouched
	*/
	function simplifyEpsgUrn(fullCrsName) {
		if (/^urn:(?:x-)?ogc:def:crs:epsg:/.test(fullCrsName.toLowerCase())) return \`EPSG:\${/([0-9]+)$/.exec(fullCrsName)[1]}\`;
		return fullCrsName;
	}
	//#endregion
	//#region src/shared/time.ts
	function parseIso8601Duration(duration) {
		const match = duration.match(/^P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?(?:T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$/);
		if (!match) return null;
		return {
			years: Number(match[1] ?? 0),
			months: Number(match[2] ?? 0),
			days: Number(match[3] ?? 0),
			hours: Number(match[4] ?? 0),
			minutes: Number(match[5] ?? 0),
			seconds: Number(match[6] ?? 0)
		};
	}
	//#endregion
	//#region src/wms/capabilities.ts
	/**
	* Will read all operation URLs from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return The parsed operations URLs
	*/
	function readOperationUrlsFromCapabilities$2(capabilitiesDoc) {
		const urls = {};
		getChildrenElement(findChildElement(findChildElement(getRootElement(capabilitiesDoc), "Capability"), "Request")).forEach((operation) => {
			const operationName = stripNamespace(getElementName(operation));
			urls[operationName] = parseOperation$1(operation);
		});
		return urls;
	}
	/**
	* Will read a WMS version from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return The parsed WMS version, or null if no version could be found
	*/
	function readVersionFromCapabilities$2(capabilitiesDoc) {
		return getRootElement(capabilitiesDoc).attributes["version"];
	}
	/**
	* Will read all layers present in the capabilities doc and return them in a tree structure
	* @param capabilitiesDoc Capabilities document
	* @return Parsed layers
	*/
	function readLayersFromCapabilities$1(capabilitiesDoc) {
		const version = readVersionFromCapabilities$2(capabilitiesDoc);
		return findChildrenElement(findChildElement(getRootElement(capabilitiesDoc), "Capability"), "Layer").map((layerEl) => parseLayer(layerEl, version));
	}
	function readOutputFormatsFromCapabilities$1(capabilitiesDoc) {
		return findChildrenElement(findChildElement(findChildElement(findChildElement(getRootElement(capabilitiesDoc), "Capability"), "Request"), "GetMap"), "Format").map(getElementText);
	}
	function readInfoFormatsFromCapabilities(capabilitiesDoc) {
		return findChildrenElement(findChildElement(findChildElement(findChildElement(getRootElement(capabilitiesDoc), "Capability"), "Request"), "GetFeatureInfo"), "Format").map(getElementText);
	}
	/**
	* Will return all available exception formats
	* @param capabilitiesDoc Capabiliites document
	* @return Available exception formats
	*/
	function readExceptionFormatsFromCapabilities(capabilitiesDoc) {
		return findChildrenElement(findChildElement(findChildElement(getRootElement(capabilitiesDoc), "Capability"), "Exception"), "Format").map(getElementText);
	}
	/**
	* Will read service-related info from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return Parsed service info
	*/
	function readInfoFromCapabilities$3(capabilitiesDoc) {
		const service = findChildElement(getRootElement(capabilitiesDoc), "Service");
		const outputFormats = readOutputFormatsFromCapabilities$1(capabilitiesDoc);
		const infoFormats = readInfoFormatsFromCapabilities(capabilitiesDoc);
		const exceptionFormats = readExceptionFormatsFromCapabilities(capabilitiesDoc);
		const keywords = findChildrenElement(findChildElement(service, "KeywordList"), "Keyword").map(getElementText).filter((v, i, arr) => arr.indexOf(v) === i);
		const provider = readProviderFromCapabilities$1(capabilitiesDoc);
		return {
			title: getElementText(findChildElement(service, "Title")),
			name: getElementText(findChildElement(service, "Name")),
			abstract: getElementText(findChildElement(service, "Abstract")),
			outputFormats,
			infoFormats,
			exceptionFormats,
			fees: getElementText(findChildElement(service, "Fees")),
			constraints: getElementText(findChildElement(service, "AccessConstraints")),
			provider,
			keywords
		};
	}
	/**
	* Parse an operation definition from a WMS capabilities (e.g. GetMap)
	* @param operation Operation element
	*/
	function parseOperation$1(operation) {
		const urls = {};
		findChildrenElement(operation, "DCPType").flatMap((d) => findChildElement(d, "HTTP")).flatMap((h) => getChildrenElement(h)).forEach((method) => {
			const onlineResource = findChildElement(method, "OnlineResource");
			const methodName = stripNamespace(getElementName(method));
			urls[methodName] = getElementAttribute(onlineResource, "xlink:href");
		});
		return urls;
	}
	function parseNonTemporalValue(value) {
		const asNumber = Number.parseFloat(value);
		return isNaN(asNumber) ? value : asNumber;
	}
	function parseDimensionValues(values) {
		const isInterval = (val) => val.split("/").length === 3;
		const separatedByCommas = values.split(",").map((s) => s.trim());
		const parseInterval = (val) => {
			const parts = val.split("/");
			return {
				begin: parseNonTemporalValue(parts[0]),
				end: parseNonTemporalValue(parts[1]),
				resolution: Number.parseFloat(parts[2])
			};
		};
		if (separatedByCommas.length === 1 && isInterval(values)) return parseInterval(values);
		return separatedByCommas.map((part) => isInterval(part) ? parseInterval(part) : parseNonTemporalValue(part));
	}
	function parseNonTemporalDimension(dimensionEl, extentEl) {
		const name = getElementAttribute(dimensionEl, "name");
		const units = getElementAttribute(dimensionEl, "units");
		const unitSymbol = getElementAttribute(dimensionEl, "unitSymbol");
		const defaultValue = parseNonTemporalValue(getElementAttribute(extentEl, "default"));
		const values = extentEl ? parseDimensionValues(getElementText(extentEl).trim()) : null;
		const nearestValue = getElementAttribute(extentEl, "nearestValue");
		const multipleValues = getElementAttribute(extentEl, "multipleValues");
		return {
			name,
			units,
			...unitSymbol && { unitSymbol },
			...defaultValue && { defaultValue },
			values,
			nearestValue: nearestValue === "1" || nearestValue === "true",
			multipleValues: multipleValues === "1" || multipleValues === "true"
		};
	}
	function parseTemporalValue(value) {
		if (value === null) return null;
		const asDate = new Date(value);
		return isNaN(asDate.getTime()) ? null : asDate;
	}
	function parseTemporalDimensionValues(values) {
		if (!values) return null;
		const isInterval = (val) => val.split("/").length === 3;
		const separatedByCommas = values.split(",").map((s) => s.trim());
		const parseInterval = (val) => {
			const parts = val.split("/");
			return {
				begin: parseTemporalValue(parts[0]),
				end: parseTemporalValue(parts[1]),
				period: parseIso8601Duration(parts[2])
			};
		};
		if (separatedByCommas.length === 1 && isInterval(values)) return parseInterval(values);
		return separatedByCommas.map((part) => isInterval(part) ? parseInterval(part) : parseTemporalValue(part));
	}
	function parseTemporalDimension(dimensionEl, extentEl) {
		const name = getElementAttribute(dimensionEl, "name");
		const defaultValue = parseTemporalValue(getElementAttribute(extentEl, "default"));
		const values = extentEl ? parseTemporalDimensionValues(getElementText(extentEl).trim()) : null;
		const nearestValue = getElementAttribute(extentEl, "nearestValue");
		const multipleValues = getElementAttribute(extentEl, "multipleValues");
		const current = getElementAttribute(extentEl, "current");
		return {
			name,
			isTime: true,
			...defaultValue && { defaultValue },
			values,
			nearestValue: nearestValue === "1" || nearestValue === "true",
			multipleValues: multipleValues === "1" || multipleValues === "true",
			current: current === "1" || current === "true"
		};
	}
	function parseDimensions(layerEl, version) {
		return findChildrenElement(layerEl, "Dimension").map((dimEl) => {
			const name = getElementAttribute(dimEl, "name");
			const units = getElementAttribute(dimEl, "units");
			const extentEl = version === "1.3.0" ? dimEl : findChildrenElement(layerEl, "Extent").find((extentEl) => getElementAttribute(extentEl, "name") === name);
			return units === "ISO8601" || name === "time" ? parseTemporalDimension(dimEl, extentEl) : parseNonTemporalDimension(dimEl, extentEl);
		}).filter((dimension) => dimension.values !== null);
	}
	function getDimensionsWithNewExtent(layerEl, inheritedDimensions) {
		return findChildrenElement(layerEl, "Extent").map((extentEl) => {
			const name = getElementAttribute(extentEl, "name");
			const foundDim = inheritedDimensions.find((dim) => dim.name === name);
			if (!foundDim) return null;
			const valuesStr = getElementText(extentEl).trim();
			const values = "isTime" in foundDim ? parseTemporalDimensionValues(valuesStr) : parseDimensionValues(valuesStr);
			return {
				...foundDim,
				values
			};
		}).filter((dim) => dim !== null);
	}
	/**
	* Parse a layer in a capabilities doc
	*/
	function parseLayer(layerEl, version, inheritedSrs = [], inheritedStyles = [], inheritedAttribution = null, inheritedBoundingBoxes = null, inheritedMaxScaleDenom = null, inheritedMinScaleDenom = null, inheritedDimensions = []) {
		const srsTag = version === "1.3.0" ? "CRS" : "SRS";
		const srsList = findChildrenElement(layerEl, srsTag).map(getElementText);
		const availableCrs = srsList.length > 0 ? srsList : inheritedSrs;
		const layerStyles = findChildrenElement(layerEl, "Style").map(parseLayerStyle);
		const styles = layerStyles.length > 0 ? layerStyles : inheritedStyles;
		function parseBBox(bboxEl) {
			return (hasInvertedCoordinates(getElementAttribute(bboxEl, srsTag)) && version === "1.3.0" ? [
				"miny",
				"minx",
				"maxy",
				"maxx"
			] : [
				"minx",
				"miny",
				"maxx",
				"maxy"
			]).map((name) => parseFloat(getElementAttribute(bboxEl, name)));
		}
		function parseExGeographicBoundingBox(bboxEl) {
			return [
				"westBoundLongitude",
				"southBoundLatitude",
				"eastBoundLongitude",
				"northBoundLatitude"
			].map((name) => parseFloat(getElementText(findChildElement(bboxEl, name))));
		}
		function parseLatLonBoundingBox(bboxEl) {
			return [
				"minx",
				"miny",
				"maxx",
				"maxy"
			].map((name) => parseFloat(getElementAttribute(bboxEl, name)));
		}
		function parseScaleHintValue(textValue, defaultValue) {
			if (textValue === "") return defaultValue;
			return Math.sqrt(.5 * parseFloat(textValue) ** 2) / 28e-5;
		}
		function parseScaleHint() {
			const scaleHint = findChildElement(layerEl, "ScaleHint");
			if (!scaleHint) return [inheritedMinScaleDenom, inheritedMaxScaleDenom];
			const min = getElementAttribute(scaleHint, "min");
			const max = getElementAttribute(scaleHint, "max");
			return [parseScaleHintValue(min, inheritedMinScaleDenom), parseScaleHintValue(max, inheritedMaxScaleDenom)];
		}
		function parseScaleDenominator(name, inheritedValue) {
			const textValue = getElementText(findChildElement(layerEl, name));
			return textValue === "" ? inheritedValue : parseFloat(textValue);
		}
		const attributionEl = findChildElement(layerEl, "Attribution");
		const attribution = attributionEl !== null ? parseLayerAttribution(attributionEl) : inheritedAttribution;
		const latLonBboxEl = version === "1.3.0" ? findChildElement(layerEl, "EX_GeographicBoundingBox") : findChildElement(layerEl, "LatLonBoundingBox");
		const baseBoundingBox = {};
		if (latLonBboxEl) baseBoundingBox["EPSG:4326"] = version === "1.3.0" ? parseExGeographicBoundingBox(latLonBboxEl) : parseLatLonBoundingBox(latLonBboxEl);
		let boundingBoxes = findChildrenElement(layerEl, "BoundingBox").reduce((prev, bboxEl) => ({
			...prev,
			[getElementAttribute(bboxEl, srsTag)]: parseBBox(bboxEl)
		}), baseBoundingBox);
		boundingBoxes = Object.keys(boundingBoxes).length > 0 || inheritedBoundingBoxes === null ? boundingBoxes : inheritedBoundingBoxes;
		const queryable = layerEl.attributes.queryable === "1" || layerEl.attributes.queryable === "true" ? true : false;
		const opaque = layerEl.attributes.opaque === "1" || layerEl.attributes.opaque === "true" ? true : false;
		const keywords = findChildrenElement(findChildElement(layerEl, "KeywordList"), "Keyword").map(getElementText).filter((v, i, arr) => arr.indexOf(v) === i);
		let minScaleDenominator, maxScaleDenominator;
		if (version === "1.3.0") {
			minScaleDenominator = parseScaleDenominator("MinScaleDenominator", inheritedMinScaleDenom);
			maxScaleDenominator = parseScaleDenominator("MaxScaleDenominator", inheritedMaxScaleDenom);
		} else [minScaleDenominator, maxScaleDenominator] = parseScaleHint();
		const metadata = findChildrenElement(layerEl, "MetadataURL").map((metadataUrlEl) => ({
			type: getElementAttribute(metadataUrlEl, "type"),
			format: getElementText(findChildElement(metadataUrlEl, "Format")),
			url: getElementAttribute(findChildElement(metadataUrlEl, "OnlineResource"), "xlink:href")
		}));
		const ownDimensions = parseDimensions(layerEl, version);
		let notMyOwnDimensions = inheritedDimensions.filter((inherited) => !ownDimensions.some((own) => own.name === inherited.name));
		if (version !== "1.3.0") {
			ownDimensions.push(...getDimensionsWithNewExtent(layerEl, notMyOwnDimensions));
			notMyOwnDimensions = inheritedDimensions.filter((inherited) => !ownDimensions.some((own) => own.name === inherited.name));
		}
		const dimensions = [...notMyOwnDimensions, ...ownDimensions];
		const children = findChildrenElement(layerEl, "Layer").map((layer) => parseLayer(layer, version, availableCrs, styles, attribution, boundingBoxes, maxScaleDenominator, minScaleDenominator, dimensions));
		const timeDimension = dimensions.find((d) => d.name === "time");
		const elevationDimension = dimensions.find((d) => d.name === "elevation");
		const otherDimensions = dimensions.filter((d) => d.name !== "time" && d.name !== "elevation");
		return {
			name: getElementText(findChildElement(layerEl, "Name")),
			title: getElementText(findChildElement(layerEl, "Title")),
			abstract: getElementText(findChildElement(layerEl, "Abstract")),
			availableCrs,
			styles,
			attribution,
			boundingBoxes,
			keywords,
			queryable,
			opaque,
			...minScaleDenominator !== null ? { minScaleDenominator } : {},
			...maxScaleDenominator !== null ? { maxScaleDenominator } : {},
			...metadata.length && { metadata },
			...children.length && { children },
			...timeDimension && { timeDimension },
			...elevationDimension && { elevationDimension },
			...otherDimensions.length && { otherDimensions }
		};
	}
	function parseLayerStyle(styleEl) {
		const legendUrl = getElementAttribute(findChildElement(findChildElement(styleEl, "LegendURL"), "OnlineResource"), "xlink:href");
		const abstract = getElementText(findChildElement(styleEl, "Abstract"));
		return {
			name: getElementText(findChildElement(styleEl, "Name")),
			title: getElementText(findChildElement(styleEl, "Title")),
			...abstract && { abstract },
			...legendUrl && { legendUrl }
		};
	}
	function parseLayerAttribution(attributionEl) {
		const logoUrl = getElementAttribute(findChildElement(findChildElement(attributionEl, "LogoURL"), "OnlineResource"), "xlink:href");
		const url = getElementAttribute(findChildElement(attributionEl, "OnlineResource"), "xlink:href");
		const title = getElementText(findChildElement(attributionEl, "Title"));
		return {
			...title && { title },
			...url && { url },
			...logoUrl && { logoUrl }
		};
	}
	/**
	* Read provider information from capabilities
	* @param capabilitiesDoc
	*/
	function readProviderFromCapabilities$1(capabilitiesDoc) {
		const contactInformation = findChildElement(findChildElement(getRootElement(capabilitiesDoc), "Service"), "ContactInformation");
		const contactPersonPrimary = findChildElement(contactInformation, "ContactPersonPrimary");
		const address = findChildElement(contactInformation, "ContactAddress");
		return { contact: {
			name: getElementText(findChildElement(contactPersonPrimary, "ContactPerson")),
			organization: getElementText(findChildElement(contactPersonPrimary, "ContactOrganization")),
			position: getElementText(findChildElement(contactInformation, "ContactPosition")),
			phone: getElementText(findChildElement(contactInformation, "ContactVoiceTelephone")),
			fax: getElementText(findChildElement(contactInformation, "ContactFacsimileTelephone")),
			address: {
				deliveryPoint: getElementText(findChildElement(address, "Address")),
				city: getElementText(findChildElement(address, "City")),
				administrativeArea: getElementText(findChildElement(address, "StateOrProvince")),
				postalCode: getElementText(findChildElement(address, "PostCode")),
				country: getElementText(findChildElement(address, "Country"))
			},
			email: getElementText(findChildElement(contactInformation, "ContactElectronicMailAddress"))
		} };
	}
	//#endregion
	//#region src/shared/ows.ts
	/**
	* Read standard OWS provider information from capabilities
	* @param capabilitiesDoc
	*/
	function readProviderFromCapabilities(capabilitiesDoc) {
		const serviceProvider = findChildElement(getRootElement(capabilitiesDoc), "ServiceProvider");
		const serviceContact = findChildElement(serviceProvider, "ServiceContact");
		const contactInfo = findChildElement(serviceContact, "ContactInfo");
		const phone = findChildElement(contactInfo, "Phone");
		const address = findChildElement(contactInfo, "Address");
		return {
			name: getElementText(findChildElement(serviceProvider, "ProviderName")),
			site: getElementAttribute(findChildElement(serviceProvider, "ProviderSite"), "xlink:href"),
			contact: {
				name: getElementText(findChildElement(serviceContact, "IndividualName")),
				position: getElementText(findChildElement(serviceContact, "PositionName")),
				phone: getElementText(findChildElement(phone, "Voice")),
				fax: getElementText(findChildElement(phone, "Facsimile")),
				address: {
					deliveryPoint: getElementText(findChildElement(address, "DeliveryPoint")),
					city: getElementText(findChildElement(address, "City")),
					administrativeArea: getElementText(findChildElement(address, "AdministrativeArea")),
					postalCode: getElementText(findChildElement(address, "PostalCode")),
					country: getElementText(findChildElement(address, "Country"))
				},
				email: getElementText(findChildElement(address, "ElectronicMailAddress"))
			}
		};
	}
	//#endregion
	//#region src/wfs/capabilities.ts
	/**
	* Will read the operation URLS from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	*/
	function readOperationUrlsFromCapabilities$1(capabilitiesDoc) {
		const urls = {};
		const capabilities = getRootElement(capabilitiesDoc);
		const operationsMetadata = findChildElement(capabilities, "OperationsMetadata");
		if (operationsMetadata) findChildrenElement(operationsMetadata, "Operation").forEach((operation) => {
			const name = getElementAttribute(operation, "name");
			urls[name] = parseOperation110(operation);
		});
		else getChildrenElement(findChildElement(findChildElement(capabilities, "Capability"), "Request")).forEach((operation) => {
			const name = stripNamespace(getElementName(operation));
			urls[name] = parseOperation100(operation);
		});
		return urls;
	}
	/**
	* Will read a WFS version from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return The parsed WFS version, or null if no version could be found
	*/
	function readVersionFromCapabilities$1(capabilitiesDoc) {
		return getRootElement(capabilitiesDoc).attributes["version"];
	}
	/**
	* Will read the supported output formats from the capabilities document; note that these might not be valid MIME types
	* @param capabilitiesDoc Capabilities document
	* @return Advertised output formats
	*/
	function readOutputFormatsFromCapabilities(capabilitiesDoc) {
		const version = readVersionFromCapabilities$1(capabilitiesDoc);
		let outputFormats;
		if (version.startsWith("1.0")) outputFormats = getChildrenElement(findChildElement(findChildElement(findChildElement(findChildElement(getRootElement(capabilitiesDoc), "Capability"), "Request"), "GetFeature"), "ResultFormat")).map(getElementName);
		else outputFormats = findChildrenElement(findChildrenElement(findChildrenElement(findChildElement(getRootElement(capabilitiesDoc), "OperationsMetadata"), "Operation").find((el) => getElementAttribute(el, "name") === "GetFeature"), "Parameter").find((el) => getElementAttribute(el, "name") === "outputFormat"), "Value", true).map(getElementText);
		return outputFormats;
	}
	/**
	* Will read service-related info from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return Parsed service info
	*/
	function readInfoFromCapabilities$2(capabilitiesDoc) {
		const version = readVersionFromCapabilities$1(capabilitiesDoc);
		const serviceTag = version.startsWith("1.0") ? "Service" : "ServiceIdentification";
		const nameTag = version.startsWith("1.0") ? "Name" : "ServiceType";
		const service = findChildElement(getRootElement(capabilitiesDoc), serviceTag);
		let keywords;
		if (version.startsWith("1.0")) keywords = getElementText(findChildElement(service, "Keywords")).split(",").map((keyword) => keyword.trim());
		else keywords = findChildrenElement(findChildElement(service, "Keywords"), "Keyword").map(getElementText);
		let provider;
		if (version !== "1.0.0") provider = readProviderFromCapabilities(capabilitiesDoc);
		return {
			title: getElementText(findChildElement(service, "Title")),
			name: getElementText(findChildElement(service, nameTag)),
			abstract: getElementText(findChildElement(service, "Abstract")),
			fees: getElementText(findChildElement(service, "Fees")),
			constraints: getElementText(findChildElement(service, "AccessConstraints")),
			keywords,
			provider,
			outputFormats: readOutputFormatsFromCapabilities(capabilitiesDoc)
		};
	}
	/**
	* Will read all feature types present in the capabilities doc
	*/
	function readFeatureTypesFromCapabilities(capabilitiesDoc) {
		const version = readVersionFromCapabilities$1(capabilitiesDoc);
		const outputFormats = readOutputFormatsFromCapabilities(capabilitiesDoc);
		return findChildrenElement(findChildElement(getRootElement(capabilitiesDoc), "FeatureTypeList"), "FeatureType").map((featureTypeEl) => parseFeatureType(featureTypeEl, version, outputFormats));
	}
	/**
	* Parse an operation definition from a WFS 1.0.0 capabilities (e.g. GetFeature)
	* @param operation Operation element
	*/
	function parseOperation100(operation) {
		const urls = {};
		findChildrenElement(operation, "DCPType").flatMap((d) => findChildrenElement(d, "HTTP")).flatMap((h) => getChildrenElement(h)).forEach((method) => {
			const methodName = stripNamespace(getElementName(method));
			urls[methodName] = getElementAttribute(method, "onlineResource");
		});
		return urls;
	}
	/**
	* Parse an operation definition from a WFS 1.1+ capabilities (e.g. GetFeature)
	* @param operation Operation element
	*/
	function parseOperation110(operation) {
		const urls = {};
		findChildrenElement(operation, "DCP").flatMap((d) => findChildElement(d, "HTTP")).flatMap((h) => getChildrenElement(h)).forEach((method) => {
			const methodName = stripNamespace(getElementName(method));
			urls[methodName] = getElementAttribute(method, "xlink:href");
		});
		return urls;
	}
	/**
	* Parse a feature type in a capabilities doc
	*/
	function parseFeatureType(featureTypeEl, serviceVersion, defaultOutputFormats) {
		const srsTag = serviceVersion.startsWith("2.") ? "CRS" : "SRS";
		const defaultSrsTag = serviceVersion.startsWith("1.0") ? "SRS" : \`Default\${srsTag}\`;
		function parseBBox100() {
			const bboxEl = findChildElement(featureTypeEl, "LatLongBoundingBox");
			return [
				"minx",
				"miny",
				"maxx",
				"maxy"
			].map((name) => getElementAttribute(bboxEl, name)).map(parseFloat);
		}
		function parseBBox() {
			const bboxEl = findChildElement(featureTypeEl, "WGS84BoundingBox");
			return ["LowerCorner", "UpperCorner"].map((elName) => findChildElement(bboxEl, elName)).map((cornerEl) => getElementText(cornerEl).split(" ")).reduce((prev, curr) => [...prev, ...curr]).map(parseFloat);
		}
		const otherCrs = serviceVersion.startsWith("1.0") ? [] : findChildrenElement(featureTypeEl, \`Other\${srsTag}\`).map(getElementText).map(simplifyEpsgUrn);
		const outputFormats = serviceVersion.startsWith("1.0") ? [] : findChildrenElement(findChildElement(featureTypeEl, "OutputFormats"), "Format").map(getElementText);
		const keywords = serviceVersion.startsWith("1.0") ? getElementText(findChildElement(featureTypeEl, "Keywords")).split(",").map((keyword) => keyword.trim()) : findChildrenElement(findChildElement(featureTypeEl, "Keywords"), "Keyword").map(getElementText).filter((v, i, arr) => arr.indexOf(v) === i);
		const metadata = serviceVersion === "2.0.0" ? findChildrenElement(featureTypeEl, "MetadataURL").map((metadataUrlEl) => ({ url: getElementAttribute(metadataUrlEl, "xlink:href") })) : findChildrenElement(featureTypeEl, "MetadataURL").map((metadataUrlEl) => ({
			format: getElementAttribute(metadataUrlEl, "format"),
			type: getElementAttribute(metadataUrlEl, "type"),
			url: getElementText(metadataUrlEl).trim()
		}));
		return {
			name: getElementText(findChildElement(featureTypeEl, "Name")),
			title: getElementText(findChildElement(featureTypeEl, "Title")),
			abstract: getElementText(findChildElement(featureTypeEl, "Abstract")),
			defaultCrs: simplifyEpsgUrn(getElementText(findChildElement(featureTypeEl, defaultSrsTag))),
			otherCrs,
			outputFormats: outputFormats.length > 0 ? outputFormats : defaultOutputFormats,
			latLonBoundingBox: serviceVersion.startsWith("1.0") ? parseBBox100() : parseBBox(),
			keywords,
			...metadata.length && { metadata }
		};
	}
	//#endregion
	//#region src/wmts/capabilities.ts
	function parseBBox(xmlElement) {
		const result = ["LowerCorner", "UpperCorner"].map((elName) => findChildElement(xmlElement, elName)).map((cornerEl) => getElementText(cornerEl).split(" ")).reduce((prev, curr) => [...prev, ...curr]).map(parseFloat);
		if (result.some(Number.isNaN)) return null;
		return result;
	}
	function readInfoFromCapabilities$1(capabilitiesDoc) {
		const rootEl = getRootElement(capabilitiesDoc);
		const service = findChildElement(rootEl, "ServiceIdentification");
		const keywords = findChildrenElement(findChildElement(service, "Keywords"), "Keyword").map(getElementText);
		const getTileUrls = findChildrenElement(findChildrenElement(findChildElement(rootEl, "OperationsMetadata"), "Operation").find((el) => getElementAttribute(el, "name") == "GetTile"), "Get", true).reduce((prev, curr) => {
			const encodingType = getElementText(findChildElement(curr, "Value", true));
			const url = getElementAttribute(curr, "xlink:href");
			if (encodingType.toLowerCase() === "restful") return {
				...prev,
				rest: url
			};
			return {
				...prev,
				kvp: url
			};
		}, {});
		return {
			title: getElementText(findChildElement(service, "Title")),
			name: getElementText(findChildElement(service, "ServiceType")),
			abstract: getElementText(findChildElement(service, "Abstract")),
			fees: getElementText(findChildElement(service, "Fees")),
			constraints: getElementText(findChildElement(service, "AccessConstraints")),
			keywords,
			provider: readProviderFromCapabilities(capabilitiesDoc),
			getTileUrls
		};
	}
	function readMatrixSetsFromCapabilities(capabilitiesDoc) {
		function parseMatrixSet(element) {
			const topLeft = getElementText(findChildElement(element, "TopLeftCorner")).split(" ").map(parseFloat);
			return {
				identifier: getElementText(findChildElement(element, "Identifier")),
				tileWidth: parseInt(getElementText(findChildElement(element, "TileWidth"))),
				tileHeight: parseInt(getElementText(findChildElement(element, "TileHeight"))),
				matrixWidth: parseInt(getElementText(findChildElement(element, "MatrixWidth"))),
				matrixHeight: parseInt(getElementText(findChildElement(element, "MatrixHeight"))),
				scaleDenominator: parseFloat(getElementText(findChildElement(element, "ScaleDenominator"))),
				topLeft
			};
		}
		return findChildrenElement(findChildElement(getRootElement(capabilitiesDoc), "Contents"), "TileMatrixSet").map((element) => {
			const wellKnownScaleSet = getElementText(findChildElement(element, "WellKnownScaleSet"));
			const boundingBox = parseBBox(findChildElement(element, "BoundingBox"));
			return {
				identifier: getElementText(findChildElement(element, "Identifier")),
				crs: simplifyEpsgUrn(getElementText(findChildElement(element, "SupportedCRS"))),
				tileMatrices: findChildrenElement(element, "TileMatrix").map(parseMatrixSet),
				...boundingBox && { boundingBox },
				...wellKnownScaleSet && { wellKnownScaleSet }
			};
		});
	}
	function readLayersFromCapabilities(capabilitiesDoc) {
		const rootEl = getRootElement(capabilitiesDoc);
		const contentsEl = findChildElement(rootEl, "Contents");
		/**
		* Get the TileMatrixSet CRS
		* @param contentsEl - Contents
		* @param identifier - TileMatrixSet identifier
		* @returns The parsed supported CRS of the TileMatrixSet
		*/
		function getMatrixSetCrs(contentsEl, identifier) {
			return simplifyEpsgUrn(getElementText(findChildElement(findChildrenElement(contentsEl, "TileMatrixSet").find((matrixSetEl) => {
				return getElementText(findChildElement(matrixSetEl, "Identifier")) === identifier;
			}), "SupportedCRS")));
		}
		/**
		* Get the parameters of the TileMatrixSetLink
		* @param element - TileMatrixSetLink
		* @returns
		*/
		function parseMatrixSetLink(element) {
			const identifier = getElementText(findChildElement(element, "TileMatrixSet"));
			return {
				identifier,
				crs: getMatrixSetCrs(contentsEl, identifier),
				limits: findChildrenElement(element, "TileMatrixLimits", true).map((element) => ({
					tileMatrix: getElementText(findChildElement(element, "TileMatrix")),
					minTileRow: parseInt(getElementText(findChildElement(element, "MinTileRow"))),
					minTileCol: parseInt(getElementText(findChildElement(element, "MinTileCol"))),
					maxTileRow: parseInt(getElementText(findChildElement(element, "MaxTileRow"))),
					maxTileCol: parseInt(getElementText(findChildElement(element, "MaxTileCol")))
				}))
			};
		}
		const getKvpElt = findChildrenElement(findChildrenElement(findChildElement(rootEl, "OperationsMetadata"), "Operation").find((el) => getElementAttribute(el, "name") == "GetTile"), "Get", true).filter((elt) => {
			return getElementText(findChildElement(elt, "Value", true)).toLowerCase() === "kvp";
		})[0];
		const getKvpUrl = getKvpElt ? getElementAttribute(getKvpElt, "xlink:href") : "";
		return findChildrenElement(findChildElement(rootEl, "Contents"), "Layer").map((element) => {
			const latLonBoundingBox = parseBBox(findChildElement(element, "WGS84BoundingBox"));
			let defaultStyle = "";
			const styles = findChildrenElement(element, "Style").map((element) => {
				const legendUrl = getElementAttribute(findChildElement(element, "LegendURL"), "xlink:href");
				const abstract = getElementText(findChildElement(element, "Abstract"));
				const style = {
					title: getElementText(findChildElement(element, "Title")),
					name: getElementText(findChildElement(element, "Identifier")),
					...abstract && { abstract },
					...legendUrl && { legendUrl }
				};
				if (getElementAttribute(element, "isDefault") === "true") defaultStyle = style.name;
				return style;
			});
			const outputFormats = findChildrenElement(element, "Format").map(getElementText);
			const resourceLinks = findChildrenElement(element, "ResourceURL").filter((element) => getElementAttribute(element, "resourceType") === "tile").map((element) => {
				return {
					format: getElementAttribute(element, "format"),
					url: getElementAttribute(element, "template"),
					encoding: "REST"
				};
			});
			if (getKvpUrl) resourceLinks.push(...outputFormats.map((format) => ({
				encoding: "KVP",
				url: getKvpUrl,
				format
			})));
			const matrixSets = findChildrenElement(element, "TileMatrixSetLink").map(parseMatrixSetLink);
			const dimensions = findChildrenElement(element, "Dimension").map((element) => {
				return {
					identifier: getElementText(findChildElement(element, "Identifier")),
					defaultValue: getElementText(findChildElement(element, "Default")),
					values: findChildrenElement(element, "Value").map(getElementText)
				};
			});
			return {
				name: getElementText(findChildElement(element, "Identifier")),
				title: getElementText(findChildElement(element, "Title")),
				abstract: getElementText(findChildElement(element, "Abstract")),
				styles,
				resourceLinks,
				matrixSets,
				defaultStyle,
				...latLonBoundingBox && { latLonBoundingBox },
				...dimensions && { dimensions }
			};
		});
	}
	//#endregion
	//#region src/wps/capabilities.ts
	/**
	* Will read a WPS version from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return The parsed WPS version, or null if no version could be found
	*/
	function readVersionFromCapabilities(capabilitiesDoc) {
		return getRootElement(capabilitiesDoc).attributes["version"];
	}
	/**
	* Will read all operation URLs from the capabilities doc; WPS relies on the
	* OWS 1.1 \`OperationsMetadata\` section, like WFS 1.1/2.0.
	* @param capabilitiesDoc Capabilities document
	* @return The parsed operations URLs
	*/
	function readOperationUrlsFromCapabilities(capabilitiesDoc) {
		const urls = {};
		findChildrenElement(findChildElement(getRootElement(capabilitiesDoc), "OperationsMetadata"), "Operation").forEach((operation) => {
			const name = getElementAttribute(operation, "name");
			urls[name] = parseOperation(operation);
		});
		return urls;
	}
	/**
	* Will read all processes advertised in the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return Parsed process summaries
	*/
	function readProcessesFromCapabilities(capabilitiesDoc) {
		return findChildrenElement(findChildElement(getRootElement(capabilitiesDoc), "ProcessOfferings"), "Process").map((processEl) => {
			const abstract = getElementText(findChildElement(processEl, "Abstract"));
			const processVersion = getElementAttribute(processEl, "wps:processVersion");
			return {
				identifier: getElementText(findChildElement(processEl, "Identifier")),
				title: getElementText(findChildElement(processEl, "Title")),
				...abstract && { abstract },
				...processVersion && { processVersion }
			};
		});
	}
	/**
	* Will read service-related info from the capabilities doc
	* @param capabilitiesDoc Capabilities document
	* @return Parsed service info
	*/
	function readInfoFromCapabilities(capabilitiesDoc) {
		const service = findChildElement(getRootElement(capabilitiesDoc), "ServiceIdentification");
		const keywords = findChildrenElement(findChildElement(service, "Keywords"), "Keyword").map(getElementText).filter((v, i, arr) => arr.indexOf(v) === i);
		return {
			title: getElementText(findChildElement(service, "Title")),
			name: getElementText(findChildElement(service, "ServiceType")),
			abstract: getElementText(findChildElement(service, "Abstract")),
			fees: getElementText(findChildElement(service, "Fees")),
			constraints: getElementText(findChildElement(service, "AccessConstraints")),
			provider: readProviderFromCapabilities(capabilitiesDoc),
			keywords
		};
	}
	/**
	* Parse an OWS operation definition (e.g. Execute) into its method URLs
	* @param operation Operation element
	*/
	function parseOperation(operation) {
		const urls = {};
		findChildrenElement(operation, "DCP").flatMap((d) => findChildElement(d, "HTTP")).flatMap((h) => getChildrenElement(h)).forEach((method) => {
			const methodName = stripNamespace(getElementName(method));
			urls[methodName] = getElementAttribute(method, "xlink:href");
		});
		return urls;
	}
	//#endregion
	//#region src/wfs/featureprops.ts
	/**
	* Returns an array of features with their id and properties
	*/
	function parseFeatureProps(getFeaturesDoc, featureTypeFull, serviceVersion) {
		const collection = getRootElement(getFeaturesDoc);
		let members;
		if (serviceVersion.startsWith("2.0")) members = findChildrenElement(collection, "member").map((parent) => getChildrenElement(parent)[0]);
		else {
			const membersRoot = findChildElement(collection, "featureMembers");
			members = membersRoot ? getChildrenElement(membersRoot) : findChildrenElement(collection, "featureMember").map((parent) => getChildrenElement(parent)[0]);
		}
		const idAttr = serviceVersion === "1.0.0" ? "fid" : "gml:id";
		function isElementProperty(propName) {
			return propName in featureTypeFull.properties;
		}
		function parseElementPropertyValue(propName, valueAsString) {
			switch (featureTypeFull.properties[propName]) {
				case "integer": return parseInt(valueAsString);
				case "float": return parseFloat(valueAsString);
				case "boolean": return valueAsString === "true";
				case "date": return new Date(valueAsString);
				default: return valueAsString;
			}
		}
		function getProperties(memberEl) {
			return getChildrenElement(memberEl).filter((el) => isElementProperty(stripNamespace(getElementName(el)))).reduce((prev, curr) => {
				const propName = stripNamespace(getElementName(curr));
				return {
					...prev,
					[propName]: parseElementPropertyValue(propName, getElementText(curr))
				};
			}, {});
		}
		return members.map((el) => ({
			id: getElementAttribute(el, idAttr),
			properties: getProperties(el)
		}));
	}
	/**
	* Returns details regarding the features prop values
	*/
	function computeFeaturePropsDetails(featuresWithProps) {
		return featuresWithProps.reduce((prev, curr) => {
			for (const propName in curr.properties) {
				const propValue = curr.properties[propName];
				if (!(propName in prev)) prev[propName] = { uniqueValues: [] };
				const uniqueValue = prev[propName].uniqueValues.find((v) => v.value === propValue);
				if (uniqueValue) uniqueValue.count++;
				else prev[propName].uniqueValues.push({
					value: propValue,
					count: 1
				});
			}
			return prev;
		}, {});
	}
	//#endregion
	//#region src/shared/url-utils.ts
	/**
	* Add, replace or remove query params in the url; note that params are considered case-insensitive,
	* meaning that existing params in different cases will be impacted as well.
	* Also, if the url ends with an encoded URL (typically in the case of urls run through a CORS
	* proxy, which is an aberration and should be forbidden btw), then the encoded URL
	* will be modified instead.
	* Params set to \`null\` will be removed.
	* @private do not make this part of the API doc, but we still allow its use because it's a nice utility!
	*/
	function setQueryParams(url, params) {
		const encodedUrlMatch = url.match(/(https?%3A%2F%2F[^/]+)$/);
		if (encodedUrlMatch) {
			const encodedUrl = encodedUrlMatch[1];
			const modifiedUrl = setQueryParams(decodeURIComponent(encodedUrl), params);
			return url.replace(encodedUrl, encodeURIComponent(modifiedUrl));
		}
		const urlObj = new URL(url);
		const keys = Object.keys(params);
		const keysLower = keys.map((key) => key.toLowerCase());
		const toDelete = [];
		for (const param of urlObj.searchParams.keys()) if (keysLower.indexOf(param.toLowerCase()) > -1) toDelete.push(param);
		toDelete.map((param) => urlObj.searchParams.delete(param));
		keys.forEach((key) => {
			if (params[key] === null) return;
			urlObj.searchParams.set(key, params[key] === true ? "" : params[key]);
		});
		urlObj.search = urlObj.search.replace(/\\+/g, "%20");
		return urlObj.toString();
	}
	//#endregion
	//#region src/wfs/url.ts
	/**
	* Generates an URL for a GetFeature operation
	* @param serviceUrl
	* @param version
	* @param featureType
	* @param [outputFormat]
	* @param [maxFeatures] if not defined, all features will be returned
	* @param [attributes] if not defined, all attributes will be included
	* @param [hitsOnly] if true, will not return feature data, only hit count
	*   note: this might not work for WFS version < 2
	* @param [outputCrs] if unspecified, this will be the data native projection
	* @param [extent] an extent to restrict returned objects
	* @param [extentCrs] if unspecified, \`extent\` should be in the data native projection
	* @param [startIndex] if the service supports it, this will be the index of the first feature to return
	* @param [sortBy] sorting parameter
	*/
	function generateGetFeatureUrl(serviceUrl, version, featureType, outputFormat, maxFeatures, attributes, hitsOnly, outputCrs, extent, extentCrs, startIndex, sortBy) {
		const typeParam = version === "2.0.0" ? "TYPENAMES" : "TYPENAME";
		const countParam = version === "2.0.0" ? "COUNT" : "MAXFEATURES";
		const newParams = {
			SERVICE: "WFS",
			REQUEST: "GetFeature",
			VERSION: version,
			[typeParam]: featureType
		};
		if (outputFormat !== void 0) newParams.OUTPUTFORMAT = outputFormat;
		if (attributes !== void 0) newParams.PROPERTYNAME = attributes.join(",");
		if (hitsOnly) {
			newParams.RESULTTYPE = "hits";
			newParams[countParam] = "1";
		} else if (maxFeatures !== void 0) newParams[countParam] = maxFeatures.toString(10);
		if (outputCrs) newParams.SRSNAME = outputCrs;
		if (extent) {
			const extentJoined = extent.join(",");
			newParams.BBOX = extentCrs ? \`\${extentJoined},\${extentCrs}\` : extentJoined;
		}
		if (startIndex) newParams.STARTINDEX = startIndex.toString(10);
		const url = new URL(setQueryParams(serviceUrl, newParams));
		if (Array.isArray(sortBy) && sortBy.length > 0) {
			const sorts = sortBy.map((fieldSort) => \`\${fieldSort[1]} \${fieldSort[0] === "D" ? "DESC" : "ASC"}\`).join(",");
			url.searchParams.set("SORTBY", sorts);
		}
		return url.toString();
	}
	//#endregion
	//#region src/worker/worker.ts
	addTaskHandler("parseWmsCapabilities", globalThis, ({ url }) => queryXmlDocument(url).then((xmlDoc) => check(xmlDoc, url)).then((xmlDoc) => ({
		info: readInfoFromCapabilities$3(xmlDoc),
		layers: readLayersFromCapabilities$1(xmlDoc),
		url: readOperationUrlsFromCapabilities$2(xmlDoc),
		version: readVersionFromCapabilities$2(xmlDoc)
	})));
	addTaskHandler("parseWfsCapabilities", globalThis, ({ url }) => queryXmlDocument(url).then((xmlDoc) => check(xmlDoc, url)).then((xmlDoc) => ({
		info: readInfoFromCapabilities$2(xmlDoc),
		featureTypes: readFeatureTypesFromCapabilities(xmlDoc),
		url: readOperationUrlsFromCapabilities$1(xmlDoc),
		version: readVersionFromCapabilities$1(xmlDoc)
	})));
	addTaskHandler("queryWfsFeatureTypeDetails", globalThis, ({ url, serviceVersion, featureTypeFull }) => {
		return queryXmlDocument(generateGetFeatureUrl(url, serviceVersion, featureTypeFull.name, void 0, void 0, Object.keys(featureTypeFull.properties))).then((getFeatureDoc) => ({ props: computeFeaturePropsDetails(parseFeatureProps(getFeatureDoc, featureTypeFull, serviceVersion)) }));
	});
	addTaskHandler("updateFetchOptions", globalThis, ({ options }) => {
		setFetchOptions(options);
		return Promise.resolve({});
	});
	addTaskHandler("parseWmtsCapabilities", globalThis, ({ url }) => queryXmlDocument(url).then((xmlDoc) => check(xmlDoc, url)).then((xmlDoc) => ({
		info: readInfoFromCapabilities$1(xmlDoc),
		layers: readLayersFromCapabilities(xmlDoc),
		matrixSets: readMatrixSetsFromCapabilities(xmlDoc)
	})));
	addTaskHandler("parseWpsCapabilities", globalThis, ({ url }) => queryXmlDocument(url).then((xmlDoc) => check(xmlDoc, url)).then((xmlDoc) => ({
		info: readInfoFromCapabilities(xmlDoc),
		processes: readProcessesFromCapabilities(xmlDoc),
		url: readOperationUrlsFromCapabilities(xmlDoc),
		version: readVersionFromCapabilities(xmlDoc)
	})));
	//#endregion
})();

//# sourceMappingURL=worker-ulQP536W.js.map`,je=typeof self<`u`&&self.Blob&&new Blob([`(self.URL || self.webkitURL).revokeObjectURL(self.location.href);`,Ae],{type:`text/javascript;charset=utf-8`});function Me(e){let t;try{if(t=je&&(self.URL||self.webkitURL).createObjectURL(je),!t)throw``;let n=new Worker(t,{name:e?.name});return n.addEventListener(`error`,()=>{(self.URL||self.webkitURL).revokeObjectURL(t)}),n}catch{return new Worker(`data:text/javascript;charset=utf-8,`+encodeURIComponent(Ae),{name:e?.name})}}var Ne;function Pe(){return Ne||=new Me,Ne}De(e=>{Pe()&&ge(`updateFetchOptions`,Pe(),{options:e})});function Fe(e){return e&&typeof e==`string`?new URL(e):`location`in globalThis&&typeof globalThis.location==`object`?globalThis.location.toString():new URL(`http://localhost`)}function Ie(e,t){let n=e.match(/(https?%3A%2F%2F[^/]+)$/);if(n){let r=n[1],i=Ie(decodeURIComponent(r),t);return e.replace(r,encodeURIComponent(i))}let r=new URL(e),i=Object.keys(t),a=i.map(e=>e.toLowerCase()),o=[];for(let e of r.searchParams.keys())a.indexOf(e.toLowerCase())>-1&&o.push(e);return o.map(e=>r.searchParams.delete(e)),i.forEach(e=>{t[e]!==null&&r.searchParams.set(e,t[e]===!0?``:t[e])}),r.search=r.search.replace(/\+/g,`%20`),r.toString()}function Le(e,t,n,r,i,a,o,s,c,l,u,d){let f=t===`2.0.0`?`TYPENAMES`:`TYPENAME`,p=t===`2.0.0`?`COUNT`:`MAXFEATURES`,m={SERVICE:`WFS`,REQUEST:`GetFeature`,VERSION:t,[f]:n};if(r!==void 0&&(m.OUTPUTFORMAT=r),a!==void 0&&(m.PROPERTYNAME=a.join(`,`)),o?(m.RESULTTYPE=`hits`,m[p]=`1`):i!==void 0&&(m[p]=i.toString(10)),s&&(m.SRSNAME=s),c){let e=c.join(`,`);m.BBOX=l?`${e},${l}`:e}u&&(m.STARTINDEX=u.toString(10));let h=new URL(Ie(e,m));if(Array.isArray(d)&&d.length>0){let e=d.map(e=>`${e[1]} ${e[0]===`D`?`DESC`:`ASC`}`).join(`,`);h.searchParams.set(`SORTBY`,e)}return h.toString()}function Re(e){let t=e.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);return t?{years:Number(t[1]??0),months:Number(t[2]??0),days:Number(t[3]??0),hours:Number(t[4]??0),minutes:Number(t[5]??0),seconds:Number(t[6]??0)}:null}function ze(e,t,n,r){let i=e.links?.filter(e=>Array.isArray(t)?t.indexOf(e.rel)>-1:e.rel===t)||[];if(n&&(i=i.filter(e=>e.type===n)),r&&i.length===0)throw n?new z(`Was expecting at least one link of type '${t}' with mime type '${n}' but could not find any`):new z(`Was expecting at least one link of type '${t}' but could not find any`);return i}function Be(e,t,n,r,i){let a=ze(e,t,r,i)[0];return a?new URL(a.href,Fe(n)).toString():null}function Ve(e,t){let n=new URL(e,Fe());return Oe(n.toString(),`GET`,!t,t).then(e=>{if(!e.ok)throw Error(`The document at ${n} could not be fetched.`);return e.clone().json().catch(e=>{throw Error(`The document at ${n} does not appear to be valid JSON. Error was: ${e.message}`)})})}function He(e,t,n,r){return ze(e,t,n,r)}function Ue(e,t,n,r,i){return Be(e,t,n,r,i)}async function We(e,t,n,r){let i=Ue(e,t,n,r);if(!i)throw new z(`No link found with rel type: ${Array.isArray(t)?t.join(`, `):t}${r?` and mime type: ${r}`:``}`);return Ve(i)}function Ge(e){if(!e.id)throw new z(`Root document is missing required "id" field`);if(!e.description)throw new z(`Root document is missing required "description" field`);if(!e.stac_version)throw new z(`Root document is missing required "stac_version" field`);return{id:e.id,title:e.title,description:e.description,stacVersion:e.stac_version,conformsTo:e.conformsTo}}function Ke(e){if(!e.stac_version)throw new z(`Document is missing "stac_version" field`);if(e.type!==`Catalog`)throw new z(`Expected type "Catalog" but got "${e.type}"`);if(!e.id)throw new z(`Document is missing "id" field`);if(!e.description)throw new z(`Document is missing "description" field`);if(!e.links||!Array.isArray(e.links))throw new z(`Document is missing "links" array`);return{stac_version:e.stac_version,stac_extensions:e.stac_extensions,type:`Catalog`,id:e.id,title:e.title,description:e.description,links:e.links}}function qe(e){if(!e.stac_version)throw new z(`Collection document is missing "stac_version" field`);if(e.type!==`Collection`)throw new z(`Expected type "Collection" but got "${e.type}"`);if(!e.id)throw new z(`Collection document is missing "id" field`);if(!e.description)throw new z(`Collection document is missing "description" field`);if(!e.license)throw new z(`Collection document is missing "license" field`);if(!e.extent)throw new z(`Collection document is missing "extent" field`);if(!e.links||!Array.isArray(e.links))throw new z(`Collection document is missing "links" array`);return e}function Je(e){if(e.type!==`Feature`)throw new z(`Expected type "Feature" but got "${e.type}"`);if(!e.id)throw new z(`Item document is missing "id" field`);if(!e.properties)throw new z(`Item document is missing "properties" field`);if(!e.links||!Array.isArray(e.links))throw new z(`Item document is missing "links" array`);return e}function Ye(e){if(!e.collections||!Array.isArray(e.collections))throw new z(`Document is missing "collections" array`);return e.collections.map(e=>e.id)}function Xe(e){return!e.conformsTo||!Array.isArray(e.conformsTo)?[]:e.conformsTo}function Ze(e){return e.some(e=>(e.includes(`stac-api`)||e.includes(`stacspec.org`))&&(e.includes(`/core`)||e.includes(`/item-search`)))}function Qe(e){return e.some(e=>e.includes(`ogcapi-features`)||e===`http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core`)}function $e(e){return[Math.max(-180,Math.min(180,e[0])),Math.max(-90,Math.min(90,e[1])),Math.max(-180,Math.min(180,e[2])),Math.max(-90,Math.min(90,e[3]))]}var et=class e{constructor(e){this.baseUrl=e}baseUrl;root_;conformance_;collectionsDocument_;get root(){return this.root_||=Ve(this.baseUrl).catch(e=>{throw new z(`Failed to fetch STAC root document: ${e.message}`)}),this.root_}get conformance(){return this.conformance_||=this.root.then(e=>e.conformsTo&&Array.isArray(e.conformsTo)?e.conformsTo:We(e,[`conformance`,`http://www.opengis.net/def/rel/ogc/1.0/conformance`],this.baseUrl).then(Xe).catch(()=>[])),this.conformance_}get collectionsDocument(){return this.collectionsDocument_||=this.root.then(e=>{let t=Ue(e,[`data`,`collections`],this.baseUrl);return t?Ve(t):null}).catch(()=>null),this.collectionsDocument_}static applyFilterOptions(e,t){if(t.limit!==void 0&&e.searchParams.set(`limit`,t.limit.toString()),t.bbox&&t.bbox.length===4){let n=$e(t.bbox);e.searchParams.set(`bbox`,n.join(`,`))}if(t.datetime!==void 0){let n=t.datetime;e.searchParams.set(`datetime`,n instanceof Date?n.toISOString():`${`start`in n?n.start.toISOString():`..`}/${`end`in n?n.end.toISOString():`..`}`)}t.query&&(e.search+=(e.search?`&`:``)+encodeURI(t.query))}static async fromUrl(e){let t=await Ve(e);if(t.type===`Collection`)return{type:`Collection`,data:qe(t)};if(t.type===`Feature`)return{type:`Feature`,data:Je(t)};if(t.type===`Catalog`)return{type:`Catalog`,data:Ke(t)};throw new z(`Unknown STAC document type: ${t.type}. Expected 'Catalog', 'Collection', or 'Feature'.`)}static async getItemsFromCollection(t,n={}){let r=He(t,`items`);if(!r||r.length===0)throw new z(`Collection ${t.id} does not have an items link`);let i=r[0],a=i.href;if(!a)throw new z(`Collection ${t.id} items link is missing href`);let o=new URL(a,Fe());e.applyFilterOptions(o,n);let s=i?.type,c=await Ve(o.toString(),s);if(!c.features||!Array.isArray(c.features))throw new z(`Items response does not contain features array`);return c.features=c.features.map(e=>Je(e)),c}static async getItemsFromUrl(t,n={}){let r=new URL(t,Fe());e.applyFilterOptions(r,n);let i=await Ve(r.toString());if(!i.features||!Array.isArray(i.features))throw new z(`Items response does not contain features array`);return i.features=i.features.map(e=>Je(e)),i}get info(){return this.root.then(Ge)}get catalog(){return this.root.then(e=>e.type===`Catalog`?Ke(e):{stac_version:e.stac_version,stac_extensions:e.stac_extensions,type:`Catalog`,id:e.id||`root`,title:e.title,description:e.description||``,links:e.links||[]})}get conformanceClasses(){return this.conformance}get isStacApi(){return this.conformance.then(Ze)}get supportsOgcFeatures(){return this.conformance.then(Qe)}get allCollections(){return this.collectionsDocument.then(e=>e?Ye(e):[])}async getCollection(e){let t=await this.collectionsDocument;if(!t)throw new z(`No collections available at this endpoint`);if(!Ye(t).includes(e))throw new z(`Collection not found: ${e}`);let n=t.collections.find(t=>t.id===e);if(n)return qe(n);let r=Ue(await this.root,[`data`,`collections`],this.baseUrl);return qe(await Ve(new URL(e,r+`/`).toString()))}async getCollectionItems(e,t={}){return(await this.getCollectionItemsResponse(e,t)).features}async getCollectionItemsResponse(e,t={}){let n=He(await this.getCollection(e),`items`)[0],r=await this.getCollectionItemsUrl(e,t),i=n?.type,a=await Ve(r,i);if(!a.features||!Array.isArray(a.features))throw new z(`Items response does not contain features array`);return a.features=a.features.map(e=>Je(e)),a}async getCollectionItem(e,t){let n=await this.getCollection(e),r=He(n,`items`)[0],i=Ue(n,`items`,this.baseUrl);if(!i)throw new z(`Collection ${e} does not have an items link`);let a=new URL(i);a.pathname.endsWith(`/`)||(a.pathname+=`/`),a.pathname+=t;let o=r?.type;return Je(await Ve(a.toString(),o))}async getCollectionItemsUrl(t,n={}){let r=Ue(await this.getCollection(t),`items`,this.baseUrl);if(!r)throw new z(`Collection ${t} does not have an items link`);let i=new URL(r,Fe());return e.applyFilterOptions(i,n),i.toString()}},tt=`EPSG:4046.EPSG:4075.EPSG:4120.EPSG:4122.EPSG:4124.EPSG:4126.EPSG:4149.EPSG:4151.EPSG:4153.EPSG:4155.EPSG:4157.EPSG:4159.EPSG:4161.EPSG:4163.EPSG:4165.EPSG:4167.EPSG:4169.EPSG:4171.EPSG:4173.EPSG:4175.EPSG:4178.EPSG:4180.EPSG:4182.EPSG:4184.EPSG:4188.EPSG:4190.EPSG:4191.EPSG:4196.EPSG:4198.EPSG:4202.EPSG:4210.EPSG:4211.EPSG:4214.EPSG:4226.EPSG:4229.EPSG:4231.EPSG:4233.EPSG:4236.EPSG:4238.EPSG:4240.EPSG:4242.EPSG:4244.EPSG:4246.EPSG:4248.EPSG:4250.EPSG:4252.EPSG:4255.EPSG:4258.EPSG:4261.EPSG:4264.EPSG:4267.EPSG:4270.EPSG:4273.EPSG:4276.EPSG:4279.EPSG:4281.EPSG:4284.EPSG:4286.EPSG:4288.EPSG:4292.EPSG:4295.EPSG:4297.EPSG:4299.EPSG:4302.EPSG:4324.EPSG:4326`.split(`.`);function nt(e){return tt.indexOf(rt(e))>-1}function rt(e){return/^urn:(?:x-)?ogc:def:crs:epsg:/.test(e.toLowerCase())?`EPSG:${/([0-9]+)$/.exec(e)[1]}`:e}function it(e){let t={};return le(I(I(P(e),`Capability`),`Request`)).forEach(e=>{let n=N(ce(e));t[n]=dt(e)}),t}function at(e){return P(e).attributes.version}function ot(e){let t=at(e);return F(I(P(e),`Capability`),`Layer`).map(e=>bt(e,t))}function st(e){return F(I(I(I(P(e),`Capability`),`Request`),`GetMap`),`Format`).map(L)}function ct(e){return F(I(I(I(P(e),`Capability`),`Request`),`GetFeatureInfo`),`Format`).map(L)}function lt(e){return F(I(I(P(e),`Capability`),`Exception`),`Format`).map(L)}function ut(e){let t=I(P(e),`Service`),n=st(e),r=ct(e),i=lt(e),a=F(I(t,`KeywordList`),`Keyword`).map(L).filter((e,t,n)=>n.indexOf(e)===t),o=Ct(e);return{title:L(I(t,`Title`)),name:L(I(t,`Name`)),abstract:L(I(t,`Abstract`)),outputFormats:n,infoFormats:r,exceptionFormats:i,fees:L(I(t,`Fees`)),constraints:L(I(t,`AccessConstraints`)),provider:o,keywords:a}}function dt(e){let t={};return F(e,`DCPType`).flatMap(e=>I(e,`HTTP`)).flatMap(e=>le(e)).forEach(e=>{let n=I(e,`OnlineResource`),r=N(ce(e));t[r]=R(n,`xlink:href`)}),t}function ft(e){let t=Number.parseFloat(e);return isNaN(t)?e:t}function pt(e){let t=e=>e.split(`/`).length===3,n=e.split(`,`).map(e=>e.trim()),r=e=>{let t=e.split(`/`);return{begin:ft(t[0]),end:ft(t[1]),resolution:Number.parseFloat(t[2])}};return n.length===1&&t(e)?r(e):n.map(e=>t(e)?r(e):ft(e))}function mt(e,t){let n=R(e,`name`),r=R(e,`units`),i=R(e,`unitSymbol`),a=ft(R(t,`default`)),o=t?pt(L(t).trim()):null,s=R(t,`nearestValue`),c=R(t,`multipleValues`);return{name:n,units:r,...i&&{unitSymbol:i},...a&&{defaultValue:a},values:o,nearestValue:s===`1`||s===`true`,multipleValues:c===`1`||c===`true`}}function ht(e){if(e===null)return null;let t=new Date(e);return isNaN(t.getTime())?null:t}function gt(e){if(!e)return null;let t=e=>e.split(`/`).length===3,n=e.split(`,`).map(e=>e.trim()),r=e=>{let t=e.split(`/`);return{begin:ht(t[0]),end:ht(t[1]),period:Re(t[2])}};return n.length===1&&t(e)?r(e):n.map(e=>t(e)?r(e):ht(e))}function _t(e,t){let n=R(e,`name`),r=ht(R(t,`default`)),i=t?gt(L(t).trim()):null,a=R(t,`nearestValue`),o=R(t,`multipleValues`),s=R(t,`current`);return{name:n,isTime:!0,...r&&{defaultValue:r},values:i,nearestValue:a===`1`||a===`true`,multipleValues:o===`1`||o===`true`,current:s===`1`||s===`true`}}function vt(e,t){return F(e,`Dimension`).map(n=>{let r=R(n,`name`),i=R(n,`units`),a=t===`1.3.0`?n:F(e,`Extent`).find(e=>R(e,`name`)===r);return i===`ISO8601`||r===`time`?_t(n,a):mt(n,a)}).filter(e=>e.values!==null)}function yt(e,t){return F(e,`Extent`).map(e=>{let n=R(e,`name`),r=t.find(e=>e.name===n);if(!r)return null;let i=L(e).trim(),a=`isTime`in r?gt(i):pt(i);return{...r,values:a}}).filter(e=>e!==null)}function bt(e,t,n=[],r=[],i=null,a=null,o=null,s=null,c=[]){let l=t===`1.3.0`?`CRS`:`SRS`,u=F(e,l).map(L),d=u.length>0?u:n,f=F(e,`Style`).map(xt),p=f.length>0?f:r;function m(e){return(nt(R(e,l))&&t===`1.3.0`?[`miny`,`minx`,`maxy`,`maxx`]:[`minx`,`miny`,`maxx`,`maxy`]).map(t=>parseFloat(R(e,t)))}function h(e){return[`westBoundLongitude`,`southBoundLatitude`,`eastBoundLongitude`,`northBoundLatitude`].map(t=>parseFloat(L(I(e,t))))}function g(e){return[`minx`,`miny`,`maxx`,`maxy`].map(t=>parseFloat(R(e,t)))}function _(e,t){return e===``?t:Math.sqrt(.5*parseFloat(e)**2)/28e-5}function v(){let t=I(e,`ScaleHint`);if(!t)return[s,o];let n=R(t,`min`),r=R(t,`max`);return[_(n,s),_(r,o)]}function y(t,n){let r=L(I(e,t));return r===``?n:parseFloat(r)}let b=I(e,`Attribution`),x=b===null?i:St(b),S=t===`1.3.0`?I(e,`EX_GeographicBoundingBox`):I(e,`LatLonBoundingBox`),C={};S&&(C[`EPSG:4326`]=t===`1.3.0`?h(S):g(S));let w=F(e,`BoundingBox`).reduce((e,t)=>({...e,[R(t,l)]:m(t)}),C);w=Object.keys(w).length>0||a===null?w:a;let T=e.attributes.queryable===`1`||e.attributes.queryable===`true`,E=e.attributes.opaque===`1`||e.attributes.opaque===`true`,D=F(I(e,`KeywordList`),`Keyword`).map(L).filter((e,t,n)=>n.indexOf(e)===t),O,k;t===`1.3.0`?(O=y(`MinScaleDenominator`,s),k=y(`MaxScaleDenominator`,o)):[O,k]=v();let A=F(e,`MetadataURL`).map(e=>({type:R(e,`type`),format:L(I(e,`Format`)),url:R(I(e,`OnlineResource`),`xlink:href`)})),j=vt(e,t),ee=c.filter(e=>!j.some(t=>t.name===e.name));t!==`1.3.0`&&(j.push(...yt(e,ee)),ee=c.filter(e=>!j.some(t=>t.name===e.name)));let M=[...ee,...j],te=F(e,`Layer`).map(e=>bt(e,t,d,p,x,w,k,O,M)),ne=M.find(e=>e.name===`time`),re=M.find(e=>e.name===`elevation`),ie=M.filter(e=>e.name!==`time`&&e.name!==`elevation`);return{name:L(I(e,`Name`)),title:L(I(e,`Title`)),abstract:L(I(e,`Abstract`)),availableCrs:d,styles:p,attribution:x,boundingBoxes:w,keywords:D,queryable:T,opaque:E,...O===null?{}:{minScaleDenominator:O},...k===null?{}:{maxScaleDenominator:k},...A.length&&{metadata:A},...te.length&&{children:te},...ne&&{timeDimension:ne},...re&&{elevationDimension:re},...ie.length&&{otherDimensions:ie}}}function xt(e){let t=R(I(I(e,`LegendURL`),`OnlineResource`),`xlink:href`),n=L(I(e,`Abstract`));return{name:L(I(e,`Name`)),title:L(I(e,`Title`)),...n&&{abstract:n},...t&&{legendUrl:t}}}function St(e){let t=R(I(I(e,`LogoURL`),`OnlineResource`),`xlink:href`),n=R(I(e,`OnlineResource`),`xlink:href`),r=L(I(e,`Title`));return{...r&&{title:r},...n&&{url:n},...t&&{logoUrl:t}}}function Ct(e){let t=I(I(P(e),`Service`),`ContactInformation`),n=I(t,`ContactPersonPrimary`),r=I(t,`ContactAddress`);return{contact:{name:L(I(n,`ContactPerson`)),organization:L(I(n,`ContactOrganization`)),position:L(I(t,`ContactPosition`)),phone:L(I(t,`ContactVoiceTelephone`)),fax:L(I(t,`ContactFacsimileTelephone`)),address:{deliveryPoint:L(I(r,`Address`)),city:L(I(r,`City`)),administrativeArea:L(I(r,`StateOrProvince`)),postalCode:L(I(r,`PostCode`)),country:L(I(r,`Country`))},email:L(I(t,`ContactElectronicMailAddress`))}}}function wt(e){let t=I(P(e),`ServiceProvider`),n=I(t,`ServiceContact`),r=I(n,`ContactInfo`),i=I(r,`Phone`),a=I(r,`Address`);return{name:L(I(t,`ProviderName`)),site:R(I(t,`ProviderSite`),`xlink:href`),contact:{name:L(I(n,`IndividualName`)),position:L(I(n,`PositionName`)),phone:L(I(i,`Voice`)),fax:L(I(i,`Facsimile`)),address:{deliveryPoint:L(I(a,`DeliveryPoint`)),city:L(I(a,`City`)),administrativeArea:L(I(a,`AdministrativeArea`)),postalCode:L(I(a,`PostalCode`)),country:L(I(a,`Country`))},email:L(I(a,`ElectronicMailAddress`))}}}function Tt(e){let t={},n=P(e),r=I(n,`OperationsMetadata`);return r?F(r,`Operation`).forEach(e=>{let n=R(e,`name`);t[n]=jt(e)}):le(I(I(n,`Capability`),`Request`)).forEach(e=>{let n=N(ce(e));t[n]=At(e)}),t}function Et(e){return P(e).attributes.version}function Dt(e){let t=Et(e),n;return n=t.startsWith(`1.0`)?le(I(I(I(I(P(e),`Capability`),`Request`),`GetFeature`),`ResultFormat`)).map(ce):F(F(F(I(P(e),`OperationsMetadata`),`Operation`).find(e=>R(e,`name`)===`GetFeature`),`Parameter`).find(e=>R(e,`name`)===`outputFormat`),`Value`,!0).map(L),n}function Ot(e){let t=Et(e),n=t.startsWith(`1.0`)?`Service`:`ServiceIdentification`,r=t.startsWith(`1.0`)?`Name`:`ServiceType`,i=I(P(e),n),a;a=t.startsWith(`1.0`)?L(I(i,`Keywords`)).split(`,`).map(e=>e.trim()):F(I(i,`Keywords`),`Keyword`).map(L);let o;return t!==`1.0.0`&&(o=wt(e)),{title:L(I(i,`Title`)),name:L(I(i,r)),abstract:L(I(i,`Abstract`)),fees:L(I(i,`Fees`)),constraints:L(I(i,`AccessConstraints`)),keywords:a,provider:o,outputFormats:Dt(e)}}function kt(e){let t=Et(e),n=Dt(e);return F(I(P(e),`FeatureTypeList`),`FeatureType`).map(e=>Mt(e,t,n))}function At(e){let t={};return F(e,`DCPType`).flatMap(e=>F(e,`HTTP`)).flatMap(e=>le(e)).forEach(e=>{let n=N(ce(e));t[n]=R(e,`onlineResource`)}),t}function jt(e){let t={};return F(e,`DCP`).flatMap(e=>I(e,`HTTP`)).flatMap(e=>le(e)).forEach(e=>{let n=N(ce(e));t[n]=R(e,`xlink:href`)}),t}function Mt(e,t,n){let r=t.startsWith(`2.`)?`CRS`:`SRS`,i=t.startsWith(`1.0`)?`SRS`:`Default${r}`;function a(){let t=I(e,`LatLongBoundingBox`);return[`minx`,`miny`,`maxx`,`maxy`].map(e=>R(t,e)).map(parseFloat)}function o(){let t=I(e,`WGS84BoundingBox`);return[`LowerCorner`,`UpperCorner`].map(e=>I(t,e)).map(e=>L(e).split(` `)).reduce((e,t)=>[...e,...t]).map(parseFloat)}let s=t.startsWith(`1.0`)?[]:F(e,`Other${r}`).map(L).map(rt),c=t.startsWith(`1.0`)?[]:F(I(e,`OutputFormats`),`Format`).map(L),l=t.startsWith(`1.0`)?L(I(e,`Keywords`)).split(`,`).map(e=>e.trim()):F(I(e,`Keywords`),`Keyword`).map(L).filter((e,t,n)=>n.indexOf(e)===t),u=t===`2.0.0`?F(e,`MetadataURL`).map(e=>({url:R(e,`xlink:href`)})):F(e,`MetadataURL`).map(e=>({format:R(e,`format`),type:R(e,`type`),url:L(e).trim()}));return{name:L(I(e,`Name`)),title:L(I(e,`Title`)),abstract:L(I(e,`Abstract`)),defaultCrs:rt(L(I(e,i))),otherCrs:s,outputFormats:c.length>0?c:n,latLonBoundingBox:t.startsWith(`1.0`)?a():o(),keywords:l,...u.length&&{metadata:u}}}function Nt(e){let t=[`LowerCorner`,`UpperCorner`].map(t=>I(e,t)).map(e=>L(e).split(` `)).reduce((e,t)=>[...e,...t]).map(parseFloat);return t.some(Number.isNaN)?null:t}function Pt(e){let t=P(e),n=I(t,`ServiceIdentification`),r=F(I(n,`Keywords`),`Keyword`).map(L),i=F(F(I(t,`OperationsMetadata`),`Operation`).find(e=>R(e,`name`)==`GetTile`),`Get`,!0).reduce((e,t)=>{let n=L(I(t,`Value`,!0)),r=R(t,`xlink:href`);return n.toLowerCase()===`restful`?{...e,rest:r}:{...e,kvp:r}},{});return{title:L(I(n,`Title`)),name:L(I(n,`ServiceType`)),abstract:L(I(n,`Abstract`)),fees:L(I(n,`Fees`)),constraints:L(I(n,`AccessConstraints`)),keywords:r,provider:wt(e),getTileUrls:i}}function Ft(e){function t(e){let t=L(I(e,`TopLeftCorner`)).split(` `).map(parseFloat);return{identifier:L(I(e,`Identifier`)),tileWidth:parseInt(L(I(e,`TileWidth`))),tileHeight:parseInt(L(I(e,`TileHeight`))),matrixWidth:parseInt(L(I(e,`MatrixWidth`))),matrixHeight:parseInt(L(I(e,`MatrixHeight`))),scaleDenominator:parseFloat(L(I(e,`ScaleDenominator`))),topLeft:t}}return F(I(P(e),`Contents`),`TileMatrixSet`).map(e=>{let n=L(I(e,`WellKnownScaleSet`)),r=Nt(I(e,`BoundingBox`));return{identifier:L(I(e,`Identifier`)),crs:rt(L(I(e,`SupportedCRS`))),tileMatrices:F(e,`TileMatrix`).map(t),...r&&{boundingBox:r},...n&&{wellKnownScaleSet:n}}})}function It(e){let t=P(e),n=I(t,`Contents`);function r(e,t){return rt(L(I(F(e,`TileMatrixSet`).find(e=>L(I(e,`Identifier`))===t),`SupportedCRS`)))}function i(e){let t=L(I(e,`TileMatrixSet`));return{identifier:t,crs:r(n,t),limits:F(e,`TileMatrixLimits`,!0).map(e=>({tileMatrix:L(I(e,`TileMatrix`)),minTileRow:parseInt(L(I(e,`MinTileRow`))),minTileCol:parseInt(L(I(e,`MinTileCol`))),maxTileRow:parseInt(L(I(e,`MaxTileRow`))),maxTileCol:parseInt(L(I(e,`MaxTileCol`)))}))}}let a=F(F(I(t,`OperationsMetadata`),`Operation`).find(e=>R(e,`name`)==`GetTile`),`Get`,!0).filter(e=>L(I(e,`Value`,!0)).toLowerCase()===`kvp`)[0],o=a?R(a,`xlink:href`):``;return F(I(t,`Contents`),`Layer`).map(e=>{let t=Nt(I(e,`WGS84BoundingBox`)),n=``,r=F(e,`Style`).map(e=>{let t=R(I(e,`LegendURL`),`xlink:href`),r=L(I(e,`Abstract`)),i={title:L(I(e,`Title`)),name:L(I(e,`Identifier`)),...r&&{abstract:r},...t&&{legendUrl:t}};return R(e,`isDefault`)===`true`&&(n=i.name),i}),a=F(e,`Format`).map(L),s=F(e,`ResourceURL`).filter(e=>R(e,`resourceType`)===`tile`).map(e=>({format:R(e,`format`),url:R(e,`template`),encoding:`REST`}));o&&s.push(...a.map(e=>({encoding:`KVP`,url:o,format:e})));let c=F(e,`TileMatrixSetLink`).map(i),l=F(e,`Dimension`).map(e=>({identifier:L(I(e,`Identifier`)),defaultValue:L(I(e,`Default`)),values:F(e,`Value`).map(L)}));return{name:L(I(e,`Identifier`)),title:L(I(e,`Title`)),abstract:L(I(e,`Abstract`)),styles:r,resourceLinks:s,matrixSets:c,defaultStyle:n,...t&&{latLonBoundingBox:t},...l&&{dimensions:l}}})}function Lt(e){return P(e).attributes.version}function Rt(e){let t={};return F(I(P(e),`OperationsMetadata`),`Operation`).forEach(e=>{let n=R(e,`name`);t[n]=Vt(e)}),t}function zt(e){return F(I(P(e),`ProcessOfferings`),`Process`).map(e=>{let t=L(I(e,`Abstract`)),n=R(e,`wps:processVersion`);return{identifier:L(I(e,`Identifier`)),title:L(I(e,`Title`)),...t&&{abstract:t},...n&&{processVersion:n}}})}function Bt(e){let t=I(P(e),`ServiceIdentification`),n=F(I(t,`Keywords`),`Keyword`).map(L).filter((e,t,n)=>n.indexOf(e)===t);return{title:L(I(t,`Title`)),name:L(I(t,`ServiceType`)),abstract:L(I(t,`Abstract`)),fees:L(I(t,`Fees`)),constraints:L(I(t,`AccessConstraints`)),provider:wt(e),keywords:n}}function Vt(e){let t={};return F(e,`DCP`).flatMap(e=>I(e,`HTTP`)).flatMap(e=>le(e)).forEach(e=>{let n=N(ce(e));t[n]=R(e,`xlink:href`)}),t}function Ht(e,t,n){let r=P(e),i;if(n.startsWith(`2.0`))i=F(r,`member`).map(e=>le(e)[0]);else{let e=I(r,`featureMembers`);i=e?le(e):F(r,`featureMember`).map(e=>le(e)[0])}let a=n===`1.0.0`?`fid`:`gml:id`;function o(e){return e in t.properties}function s(e,n){switch(t.properties[e]){case`integer`:return parseInt(n);case`float`:return parseFloat(n);case`boolean`:return n===`true`;case`date`:return new Date(n);default:return n}}function c(e){return le(e).filter(e=>o(N(ce(e)))).reduce((e,t)=>{let n=N(ce(t));return{...e,[n]:s(n,L(t))}},{})}return i.map(e=>({id:R(e,a),properties:c(e)}))}function Ut(e){return e.reduce((e,t)=>{for(let n in t.properties){let r=t.properties[n];n in e||(e[n]={uniqueValues:[]});let i=e[n].uniqueValues.find(e=>e.value===r);i?i.count++:e[n].uniqueValues.push({value:r,count:1})}return e},{})}_e(`parseWmsCapabilities`,globalThis,({url:e})=>ke(e).then(t=>fe(t,e)).then(e=>({info:ut(e),layers:ot(e),url:it(e),version:at(e)}))),_e(`parseWfsCapabilities`,globalThis,({url:e})=>ke(e).then(t=>fe(t,e)).then(e=>({info:Ot(e),featureTypes:kt(e),url:Tt(e),version:Et(e)}))),_e(`queryWfsFeatureTypeDetails`,globalThis,({url:e,serviceVersion:t,featureTypeFull:n})=>ke(Le(e,t,n.name,void 0,void 0,Object.keys(n.properties))).then(e=>({props:Ut(Ht(e,n,t))}))),_e(`updateFetchOptions`,globalThis,({options:e})=>(Te(e),Promise.resolve({}))),_e(`parseWmtsCapabilities`,globalThis,({url:e})=>ke(e).then(t=>fe(t,e)).then(e=>({info:Pt(e),layers:It(e),matrixSets:Ft(e)}))),_e(`parseWpsCapabilities`,globalThis,({url:e})=>ke(e).then(t=>fe(t,e)).then(e=>({info:Bt(e),processes:zt(e),url:Rt(e),version:Lt(e)})));function B(e,t,n=0){var r=new Map;for(let[i,a]of e.entries()){let e=U.unpack_from(`<`+a,t,n);n+=U.calcsize(a),e.length==1&&(e=e[0]),r.set(i,e)}return r}function V(e){e||e()}function H(e){var t=`<`+Array.from(e.values()).join(``);return U.calcsize(t)}function Wt(e,t=8){return Math.ceil(e/t)*t}var Gt={u:`Uint`,i:`Int`,f:`Float`};function Kt(e){var t=U._is_big_endian(e),n,r;if(/S/.test(e))n=`getString`,r=((e.match(/S(\d*)/)||[])[1]||1)|0;else{let[t,i,a]=e.match(/[<>=!@]?(i|u|f)(\d*)/);r=parseInt(a||4,10);let o=r*8;n=`get`+Gt[i]+o.toFixed()}return[n,t,r]}var U=new class{constructor(){this.big_endian=qt(),this.getters={s:`getUint8`,b:`getInt8`,B:`getUint8`,h:`getInt16`,H:`getUint16`,i:`getInt32`,I:`getUint32`,l:`getInt32`,L:`getUint32`,q:`getInt64`,Q:`getUint64`,e:`getFloat16`,f:`getFloat32`,d:`getFloat64`},this.byte_lengths={s:1,b:1,B:1,h:2,H:2,i:4,I:4,l:4,L:4,q:8,Q:8,e:2,f:4,d:8};let e=Object.keys(this.byte_lengths).join(``);this.fmt_size_regex=`(\\d*)([`+e+`])`}calcsize(e){for(var t=0,n,r=new RegExp(this.fmt_size_regex,`g`);(n=r.exec(e))!==null;){let e=parseInt(n[1]||1,10),r=n[2],i=this.byte_lengths[r];t+=e*i}return t}_is_big_endian(e){return/^</.test(e)?!1:/^(!|>)/.test(e)?!0:this.big_endian}unpack_from(e,t,n){for(var n=Number(n||0),r=new Yt(t,0),i=[],a=this._is_big_endian(e),o,s=new RegExp(this.fmt_size_regex,`g`);(o=s.exec(e))!==null;){let e=parseInt(o[1]||1,10),s=o[2],l=this.getters[s],u=this.byte_lengths[s];if(s==`s`)i.push(new TextDecoder().decode(t.slice(n,n+e))),n+=e;else for(var c=0;c<e;c++)i.push(r[l](n,!a)),n+=u}return i}};function qt(){let e=new Uint8Array(4),t=new Uint32Array(e.buffer);return!((t[0]=1)&e[0])}function Jt(e,t){let n=(t&128)>>7,r=(t&124)>>2,i=((t&3)<<8)+e,a;return a=r==31?i==0?1/0:NaN:r==0?2**-14*(i/1024):2**(r-15)*(1+i/1024),n?-a:a}var Yt=class extends DataView{getFloat16(e,t){let n=[this.getUint8(e),this.getUint8(e+1)];t||n.reverse();let[r,i]=n;return Jt(r,i)}getUint64(e,t){let n=BigInt(this.getUint32(e,t)),r=BigInt(this.getUint32(e+4,t)),i=t?n+(r<<32n):(n<<32n)+r;return Number(i)}getInt64(e,t){var n,r;t?(n=this.getUint32(e,!0),r=this.getInt32(e+4,!0)):(r=this.getInt32(e,!1),n=this.getUint32(e+4,!1));let i=BigInt(n)+(BigInt(r)<<32n);return Number(i)}getString(e,t,n){let r=this.buffer.slice(e,e+n);return new TextDecoder().decode(r)}getVLENStruct(e,t,n){return[this.getUint32(e,t),this.getUint64(e+4,t),this.getUint32(e+12,t)]}};function Xt(e){return e.toString(2).length}function Zt(e,t,n=0,r=!0){let i=new Uint8Array(t.slice(n,n+e));return r||i.reverse(),i.reduce((e,t,n)=>e+(t<<n*8),0)}var Qt=class{constructor(e,t){this.buf=e,this.offset=t,this.dtype=this.determine_dtype()}determine_dtype(){let e=B($t,this.buf,this.offset);this.offset+=en;let t=e.get(`class_and_version`)&15;if(t==tn)return this._determine_dtype_fixed_point(e);if(t==nn)return this._determine_dtype_floating_point(e);if(t==rn)throw`Time datatype class not supported.`;if(t==an)return this._determine_dtype_string(e);if(t==on)throw`Bitfield datatype class not supported.`;if(t==sn)throw`Opaque datatype class not supported.`;if(t==cn)return this._determine_dtype_compound(e);if(t==ln)return[`REFERENCE`,e.get(`size`)];if(t==un)return this.determine_dtype();if(t==fn)throw`Array datatype class not supported.`;if(t==dn){let t=this._determine_dtype_vlen(e);return t[0]==`VLEN_SEQUENCE`&&(t=[`VLEN_SEQUENCE`,this.determine_dtype()]),t}throw`Invalid datatype class `+t}_determine_dtype_fixed_point(e){let t=e.get(`size`);if(![1,2,4,8].includes(t))throw`Unsupported datatype size`;var n=(e.get(`class_bit_field_0`)&8)>0?`i`:`u`,r=e.get(`class_bit_field_0`)&1?`>`:`<`;return this.offset+=4,r+n+t.toFixed()}_determine_dtype_floating_point(e){let t=e.get(`size`);if(![1,2,4,8].includes(t))throw`Unsupported datatype size`;var n=e.get(`class_bit_field_0`)&1?`>`:`<`;return this.offset+=12,n+`f`+t.toFixed()}_determine_dtype_string(e){return`S`+e.get(`size`).toFixed()}_determine_dtype_vlen(e){return(e.get(`class_bit_field_0`)&1)==1?[`VLEN_STRING`,e.get(`class_bit_field_0`)>>4,e.get(`class_bit_field_1`)&1]:[`VLEN_SEQUENCE`,0,0]}_determine_dtype_compound(e){throw`Compound type not yet implemented!`}},$t=new Map([[`class_and_version`,`B`],[`class_bit_field_0`,`B`],[`class_bit_field_1`,`B`],[`class_bit_field_2`,`B`],[`size`,`I`]]),en=H($t);H(new Map([[`offset`,`I`],[`dimensionality`,`B`],[`reserved_0`,`B`],[`reserved_1`,`B`],[`reserved_2`,`B`],[`permutation`,`I`],[`reserved_3`,`I`],[`dim_size_1`,`I`],[`dim_size_2`,`I`],[`dim_size_3`,`I`],[`dim_size_4`,`I`]]));var tn=0,nn=1,rn=2,an=3,on=4,sn=5,cn=6,ln=7,un=8,dn=9,fn=10,pn=4,mn=0,hn=1,gn=2;function _n(e){let t=e.length;for(;--t>=0;)e[t]=0}var vn=0,yn=1,bn=2,xn=3,Sn=258,Cn=29,wn=256,Tn=wn+1+Cn,En=30,Dn=19,On=2*Tn+1,kn=15,An=16,jn=7,Mn=256,Nn=16,Pn=17,Fn=18,In=new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]),Ln=new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]),Rn=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]),zn=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Bn=512,Vn=Array((Tn+2)*2);_n(Vn);var Hn=Array(En*2);_n(Hn);var Un=Array(Bn);_n(Un);var Wn=Array(Sn-xn+1);_n(Wn);var Gn=Array(Cn);_n(Gn);var Kn=Array(En);_n(Kn);function qn(e,t,n,r,i){this.static_tree=e,this.extra_bits=t,this.extra_base=n,this.elems=r,this.max_length=i,this.has_stree=e&&e.length}var Jn,Yn,Xn;function Zn(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}var Qn=e=>e<256?Un[e]:Un[256+(e>>>7)],$n=(e,t)=>{e.pending_buf[e.pending++]=t&255,e.pending_buf[e.pending++]=t>>>8&255},W=(e,t,n)=>{e.bi_valid>An-n?(e.bi_buf|=t<<e.bi_valid&65535,$n(e,e.bi_buf),e.bi_buf=t>>An-e.bi_valid,e.bi_valid+=n-An):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=n)},er=(e,t,n)=>{W(e,n[t*2],n[t*2+1])},tr=(e,t)=>{let n=0;do n|=e&1,e>>>=1,n<<=1;while(--t>0);return n>>>1},nr=e=>{e.bi_valid===16?($n(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):e.bi_valid>=8&&(e.pending_buf[e.pending++]=e.bi_buf&255,e.bi_buf>>=8,e.bi_valid-=8)},rr=(e,t)=>{let n=t.dyn_tree,r=t.max_code,i=t.stat_desc.static_tree,a=t.stat_desc.has_stree,o=t.stat_desc.extra_bits,s=t.stat_desc.extra_base,c=t.stat_desc.max_length,l,u,d,f,p,m,h=0;for(f=0;f<=kn;f++)e.bl_count[f]=0;for(n[e.heap[e.heap_max]*2+1]=0,l=e.heap_max+1;l<On;l++)u=e.heap[l],f=n[n[u*2+1]*2+1]+1,f>c&&(f=c,h++),n[u*2+1]=f,!(u>r)&&(e.bl_count[f]++,p=0,u>=s&&(p=o[u-s]),m=n[u*2],e.opt_len+=m*(f+p),a&&(e.static_len+=m*(i[u*2+1]+p)));if(h!==0){do{for(f=c-1;e.bl_count[f]===0;)f--;e.bl_count[f]--,e.bl_count[f+1]+=2,e.bl_count[c]--,h-=2}while(h>0);for(f=c;f!==0;f--)for(u=e.bl_count[f];u!==0;)d=e.heap[--l],!(d>r)&&(n[d*2+1]!==f&&(e.opt_len+=(f-n[d*2+1])*n[d*2],n[d*2+1]=f),u--)}},ir=(e,t,n)=>{let r=Array(kn+1),i=0,a,o;for(a=1;a<=kn;a++)i=i+n[a-1]<<1,r[a]=i;for(o=0;o<=t;o++){let t=e[o*2+1];t!==0&&(e[o*2]=tr(r[t]++,t))}},ar=()=>{let e,t,n,r,i,a=Array(kn+1);for(n=0,r=0;r<Cn-1;r++)for(Gn[r]=n,e=0;e<1<<In[r];e++)Wn[n++]=r;for(Wn[n-1]=r,i=0,r=0;r<16;r++)for(Kn[r]=i,e=0;e<1<<Ln[r];e++)Un[i++]=r;for(i>>=7;r<En;r++)for(Kn[r]=i<<7,e=0;e<1<<Ln[r]-7;e++)Un[256+i++]=r;for(t=0;t<=kn;t++)a[t]=0;for(e=0;e<=143;)Vn[e*2+1]=8,e++,a[8]++;for(;e<=255;)Vn[e*2+1]=9,e++,a[9]++;for(;e<=279;)Vn[e*2+1]=7,e++,a[7]++;for(;e<=287;)Vn[e*2+1]=8,e++,a[8]++;for(ir(Vn,Tn+1,a),e=0;e<En;e++)Hn[e*2+1]=5,Hn[e*2]=tr(e,5);Jn=new qn(Vn,In,wn+1,Tn,kn),Yn=new qn(Hn,Ln,0,En,kn),Xn=new qn([],Rn,0,Dn,jn)},or=e=>{let t=0;for(;t<Tn;t++)e.dyn_ltree[t*2]=0;for(t=0;t<En;t++)e.dyn_dtree[t*2]=0;for(t=0;t<Dn;t++)e.bl_tree[t*2]=0;e.dyn_ltree[Mn*2]=1,e.opt_len=e.static_len=0,e.sym_next=e.matches=0},sr=e=>{e.bi_valid>8?$n(e,e.bi_buf):e.bi_valid>0&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0},cr=(e,t,n,r)=>{let i=t*2,a=n*2;return e[i]<e[a]||e[i]===e[a]&&r[t]<=r[n]},lr=(e,t,n)=>{let r=e.heap[n],i=n<<1;for(;i<=e.heap_len&&(i<e.heap_len&&cr(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!cr(t,r,e.heap[i],e.depth));)e.heap[n]=e.heap[i],n=i,i<<=1;e.heap[n]=r},ur=(e,t,n)=>{let r,i,a=0,o,s;if(e.sym_next!==0)do r=e.pending_buf[e.sym_buf+a++]&255,r+=(e.pending_buf[e.sym_buf+a++]&255)<<8,i=e.pending_buf[e.sym_buf+a++],r===0?er(e,i,t):(o=Wn[i],er(e,o+wn+1,t),s=In[o],s!==0&&(i-=Gn[o],W(e,i,s)),r--,o=Qn(r),er(e,o,n),s=Ln[o],s!==0&&(r-=Kn[o],W(e,r,s)));while(a<e.sym_next);er(e,Mn,t)},dr=(e,t)=>{let n=t.dyn_tree,r=t.stat_desc.static_tree,i=t.stat_desc.has_stree,a=t.stat_desc.elems,o,s,c=-1,l;for(e.heap_len=0,e.heap_max=On,o=0;o<a;o++)n[o*2]===0?n[o*2+1]=0:(e.heap[++e.heap_len]=c=o,e.depth[o]=0);for(;e.heap_len<2;)l=e.heap[++e.heap_len]=c<2?++c:0,n[l*2]=1,e.depth[l]=0,e.opt_len--,i&&(e.static_len-=r[l*2+1]);for(t.max_code=c,o=e.heap_len>>1;o>=1;o--)lr(e,n,o);l=a;do o=e.heap[1],e.heap[1]=e.heap[e.heap_len--],lr(e,n,1),s=e.heap[1],e.heap[--e.heap_max]=o,e.heap[--e.heap_max]=s,n[l*2]=n[o*2]+n[s*2],e.depth[l]=(e.depth[o]>=e.depth[s]?e.depth[o]:e.depth[s])+1,n[o*2+1]=n[s*2+1]=l,e.heap[1]=l++,lr(e,n,1);while(e.heap_len>=2);e.heap[--e.heap_max]=e.heap[1],rr(e,t),ir(n,c,e.bl_count)},fr=(e,t,n)=>{let r,i=-1,a,o=t[1],s=0,c=7,l=4;for(o===0&&(c=138,l=3),t[(n+1)*2+1]=65535,r=0;r<=n;r++)a=o,o=t[(r+1)*2+1],!(++s<c&&a===o)&&(s<l?e.bl_tree[a*2]+=s:a===0?s<=10?e.bl_tree[Pn*2]++:e.bl_tree[Fn*2]++:(a!==i&&e.bl_tree[a*2]++,e.bl_tree[Nn*2]++),s=0,i=a,o===0?(c=138,l=3):a===o?(c=6,l=3):(c=7,l=4))},pr=(e,t,n)=>{let r,i=-1,a,o=t[1],s=0,c=7,l=4;for(o===0&&(c=138,l=3),r=0;r<=n;r++)if(a=o,o=t[(r+1)*2+1],!(++s<c&&a===o)){if(s<l)do er(e,a,e.bl_tree);while(--s!==0);else a===0?s<=10?(er(e,Pn,e.bl_tree),W(e,s-3,3)):(er(e,Fn,e.bl_tree),W(e,s-11,7)):(a!==i&&(er(e,a,e.bl_tree),s--),er(e,Nn,e.bl_tree),W(e,s-3,2));s=0,i=a,o===0?(c=138,l=3):a===o?(c=6,l=3):(c=7,l=4)}},mr=e=>{let t;for(fr(e,e.dyn_ltree,e.l_desc.max_code),fr(e,e.dyn_dtree,e.d_desc.max_code),dr(e,e.bl_desc),t=Dn-1;t>=3&&e.bl_tree[zn[t]*2+1]===0;t--);return e.opt_len+=3*(t+1)+5+5+4,t},hr=(e,t,n,r)=>{let i;for(W(e,t-257,5),W(e,n-1,5),W(e,r-4,4),i=0;i<r;i++)W(e,e.bl_tree[zn[i]*2+1],3);pr(e,e.dyn_ltree,t-1),pr(e,e.dyn_dtree,n-1)},gr=e=>{let t=4093624447,n=0;for(;n<=31;n++,t>>>=1)if(t&1&&e.dyn_ltree[n*2]!==0)return mn;if(e.dyn_ltree[18]!==0||e.dyn_ltree[20]!==0||e.dyn_ltree[26]!==0)return hn;for(n=32;n<wn;n++)if(e.dyn_ltree[n*2]!==0)return hn;return mn},_r=!1,vr=e=>{_r||=(ar(),!0),e.l_desc=new Zn(e.dyn_ltree,Jn),e.d_desc=new Zn(e.dyn_dtree,Yn),e.bl_desc=new Zn(e.bl_tree,Xn),e.bi_buf=0,e.bi_valid=0,or(e)},yr=(e,t,n,r)=>{W(e,(vn<<1)+ +!!r,3),sr(e),$n(e,n),$n(e,~n),n&&e.pending_buf.set(e.window.subarray(t,t+n),e.pending),e.pending+=n},br={_tr_init:vr,_tr_stored_block:yr,_tr_flush_block:(e,t,n,r)=>{let i,a,o=0;e.level>0?(e.strm.data_type===gn&&(e.strm.data_type=gr(e)),dr(e,e.l_desc),dr(e,e.d_desc),o=mr(e),i=e.opt_len+3+7>>>3,a=e.static_len+3+7>>>3,a<=i&&(i=a)):i=a=n+5,n+4<=i&&t!==-1?yr(e,t,n,r):e.strategy===pn||a===i?(W(e,(yn<<1)+ +!!r,3),ur(e,Vn,Hn)):(W(e,(bn<<1)+ +!!r,3),hr(e,e.l_desc.max_code+1,e.d_desc.max_code+1,o+1),ur(e,e.dyn_ltree,e.dyn_dtree)),or(e),r&&sr(e)},_tr_tally:(e,t,n)=>(e.pending_buf[e.sym_buf+e.sym_next++]=t,e.pending_buf[e.sym_buf+e.sym_next++]=t>>8,e.pending_buf[e.sym_buf+e.sym_next++]=n,t===0?e.dyn_ltree[n*2]++:(e.matches++,t--,e.dyn_ltree[(Wn[n]+wn+1)*2]++,e.dyn_dtree[Qn(t)*2]++),e.sym_next===e.sym_end),_tr_align:e=>{W(e,yn<<1,3),er(e,Mn,Vn),nr(e)}},xr=(e,t,n,r)=>{let i=e&65535|0,a=e>>>16&65535|0,o=0;for(;n!==0;){o=n>2e3?2e3:n,n-=o;do i=i+t[r++]|0,a=a+i|0;while(--o);i%=65521,a%=65521}return i|a<<16|0},Sr=new Uint32Array((()=>{let e,t=[];for(var n=0;n<256;n++){e=n;for(var r=0;r<8;r++)e=e&1?3988292384^e>>>1:e>>>1;t[n]=e}return t})()),G=(e,t,n,r)=>{let i=Sr,a=r+n;e^=-1;for(let n=r;n<a;n++)e=e>>>8^i[(e^t[n])&255];return e^-1},Cr={2:`need dictionary`,1:`stream end`,0:``,"-1":`file error`,"-2":`stream error`,"-3":`data error`,"-4":`insufficient memory`,"-5":`buffer error`,"-6":`incompatible version`},wr={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_MEM_ERROR:-4,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8},{_tr_init:Tr,_tr_stored_block:Er,_tr_flush_block:Dr,_tr_tally:Or,_tr_align:kr}=br,{Z_NO_FLUSH:Ar,Z_PARTIAL_FLUSH:jr,Z_FULL_FLUSH:Mr,Z_FINISH:K,Z_BLOCK:Nr,Z_OK:q,Z_STREAM_END:Pr,Z_STREAM_ERROR:Fr,Z_DATA_ERROR:Ir,Z_BUF_ERROR:Lr,Z_DEFAULT_COMPRESSION:Rr,Z_FILTERED:zr,Z_HUFFMAN_ONLY:Br,Z_RLE:Vr,Z_FIXED:Hr,Z_DEFAULT_STRATEGY:Ur,Z_UNKNOWN:Wr,Z_DEFLATED:Gr}=wr,Kr=9,qr=15,Jr=8,Yr=286,Xr=30,Zr=19,Qr=2*Yr+1,$r=15,J=3,ei=258,ti=ei+J+1,ni=32,ri=42,ii=57,ai=69,oi=73,si=91,ci=103,li=113,ui=666,Y=1,di=2,fi=3,pi=4,mi=3,hi=(e,t)=>(e.msg=Cr[t],t),gi=e=>e*2-(e>4?9:0),_i=e=>{let t=e.length;for(;--t>=0;)e[t]=0},vi=e=>{let t,n,r,i=e.w_size;t=e.hash_size,r=t;do n=e.head[--r],e.head[r]=n>=i?n-i:0;while(--t);t=i,r=t;do n=e.prev[--r],e.prev[r]=n>=i?n-i:0;while(--t)},yi=(e,t,n)=>(t<<e.hash_shift^n)&e.hash_mask,X=e=>{let t=e.state,n=t.pending;n>e.avail_out&&(n=e.avail_out),n!==0&&(e.output.set(t.pending_buf.subarray(t.pending_out,t.pending_out+n),e.next_out),e.next_out+=n,t.pending_out+=n,e.total_out+=n,e.avail_out-=n,t.pending-=n,t.pending===0&&(t.pending_out=0))},Z=(e,t)=>{Dr(e,e.block_start>=0?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,X(e.strm)},Q=(e,t)=>{e.pending_buf[e.pending++]=t},bi=(e,t)=>{e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=t&255},xi=(e,t,n,r)=>{let i=e.avail_in;return i>r&&(i=r),i===0?0:(e.avail_in-=i,t.set(e.input.subarray(e.next_in,e.next_in+i),n),e.state.wrap===1?e.adler=xr(e.adler,t,i,n):e.state.wrap===2&&(e.adler=G(e.adler,t,i,n)),e.next_in+=i,e.total_in+=i,i)},Si=(e,t)=>{let n=e.max_chain_length,r=e.strstart,i,a,o=e.prev_length,s=e.nice_match,c=e.strstart>e.w_size-ti?e.strstart-(e.w_size-ti):0,l=e.window,u=e.w_mask,d=e.prev,f=e.strstart+ei,p=l[r+o-1],m=l[r+o];e.prev_length>=e.good_match&&(n>>=2),s>e.lookahead&&(s=e.lookahead);do if(i=t,l[i+o]===m&&l[i+o-1]===p&&l[i]===l[r]&&l[++i]===l[r+1]){r+=2,i++;do;while(l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&l[++r]===l[++i]&&r<f);if(a=ei-(f-r),r=f-ei,a>o){if(e.match_start=t,o=a,a>=s)break;p=l[r+o-1],m=l[r+o]}}while((t=d[t&u])>c&&--n!==0);return o<=e.lookahead?o:e.lookahead},Ci=e=>{let t=e.w_size,n,r,i;do{if(r=e.window_size-e.lookahead-e.strstart,e.strstart>=t+(t-ti)&&(e.window.set(e.window.subarray(t,t+t-r),0),e.match_start-=t,e.strstart-=t,e.block_start-=t,e.insert>e.strstart&&(e.insert=e.strstart),vi(e),r+=t),e.strm.avail_in===0)break;if(n=xi(e.strm,e.window,e.strstart+e.lookahead,r),e.lookahead+=n,e.lookahead+e.insert>=J)for(i=e.strstart-e.insert,e.ins_h=e.window[i],e.ins_h=yi(e,e.ins_h,e.window[i+1]);e.insert&&(e.ins_h=yi(e,e.ins_h,e.window[i+J-1]),e.prev[i&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=i,i++,e.insert--,!(e.lookahead+e.insert<J)););}while(e.lookahead<ti&&e.strm.avail_in!==0)},wi=(e,t)=>{let n=e.pending_buf_size-5>e.w_size?e.w_size:e.pending_buf_size-5,r,i,a,o=0,s=e.strm.avail_in;do{if(r=65535,a=e.bi_valid+42>>3,e.strm.avail_out<a||(a=e.strm.avail_out-a,i=e.strstart-e.block_start,r>i+e.strm.avail_in&&(r=i+e.strm.avail_in),r>a&&(r=a),r<n&&(r===0&&t!==K||t===Ar||r!==i+e.strm.avail_in)))break;o=+(t===K&&r===i+e.strm.avail_in),Er(e,0,0,o),e.pending_buf[e.pending-4]=r,e.pending_buf[e.pending-3]=r>>8,e.pending_buf[e.pending-2]=~r,e.pending_buf[e.pending-1]=~r>>8,X(e.strm),i&&(i>r&&(i=r),e.strm.output.set(e.window.subarray(e.block_start,e.block_start+i),e.strm.next_out),e.strm.next_out+=i,e.strm.avail_out-=i,e.strm.total_out+=i,e.block_start+=i,r-=i),r&&(xi(e.strm,e.strm.output,e.strm.next_out,r),e.strm.next_out+=r,e.strm.avail_out-=r,e.strm.total_out+=r)}while(o===0);return s-=e.strm.avail_in,s&&(s>=e.w_size?(e.matches=2,e.window.set(e.strm.input.subarray(e.strm.next_in-e.w_size,e.strm.next_in),0),e.strstart=e.w_size,e.insert=e.strstart):(e.window_size-e.strstart<=s&&(e.strstart-=e.w_size,e.window.set(e.window.subarray(e.w_size,e.w_size+e.strstart),0),e.matches<2&&e.matches++,e.insert>e.strstart&&(e.insert=e.strstart)),e.window.set(e.strm.input.subarray(e.strm.next_in-s,e.strm.next_in),e.strstart),e.strstart+=s,e.insert+=s>e.w_size-e.insert?e.w_size-e.insert:s),e.block_start=e.strstart),e.high_water<e.strstart&&(e.high_water=e.strstart),o?pi:t!==Ar&&t!==K&&e.strm.avail_in===0&&e.strstart===e.block_start?di:(a=e.window_size-e.strstart,e.strm.avail_in>a&&e.block_start>=e.w_size&&(e.block_start-=e.w_size,e.strstart-=e.w_size,e.window.set(e.window.subarray(e.w_size,e.w_size+e.strstart),0),e.matches<2&&e.matches++,a+=e.w_size,e.insert>e.strstart&&(e.insert=e.strstart)),a>e.strm.avail_in&&(a=e.strm.avail_in),a&&(xi(e.strm,e.window,e.strstart,a),e.strstart+=a,e.insert+=a>e.w_size-e.insert?e.w_size-e.insert:a),e.high_water<e.strstart&&(e.high_water=e.strstart),a=e.bi_valid+42>>3,a=e.pending_buf_size-a>65535?65535:e.pending_buf_size-a,n=a>e.w_size?e.w_size:a,i=e.strstart-e.block_start,(i>=n||(i||t===K)&&t!==Ar&&e.strm.avail_in===0&&i<=a)&&(r=i>a?a:i,o=+(t===K&&e.strm.avail_in===0&&r===i),Er(e,e.block_start,r,o),e.block_start+=r,X(e.strm)),o?fi:Y)},Ti=(e,t)=>{let n,r;for(;;){if(e.lookahead<ti){if(Ci(e),e.lookahead<ti&&t===Ar)return Y;if(e.lookahead===0)break}if(n=0,e.lookahead>=J&&(e.ins_h=yi(e,e.ins_h,e.window[e.strstart+J-1]),n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),n!==0&&e.strstart-n<=e.w_size-ti&&(e.match_length=Si(e,n)),e.match_length>=J){if(r=Or(e,e.strstart-e.match_start,e.match_length-J),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=J){e.match_length--;do e.strstart++,e.ins_h=yi(e,e.ins_h,e.window[e.strstart+J-1]),n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart;while(--e.match_length!==0);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=yi(e,e.ins_h,e.window[e.strstart+1])}else r=Or(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(r&&(Z(e,!1),e.strm.avail_out===0))return Y}return e.insert=e.strstart<J-1?e.strstart:J-1,t===K?(Z(e,!0),e.strm.avail_out===0?fi:pi):e.sym_next&&(Z(e,!1),e.strm.avail_out===0)?Y:di},Ei=(e,t)=>{let n,r,i;for(;;){if(e.lookahead<ti){if(Ci(e),e.lookahead<ti&&t===Ar)return Y;if(e.lookahead===0)break}if(n=0,e.lookahead>=J&&(e.ins_h=yi(e,e.ins_h,e.window[e.strstart+J-1]),n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=J-1,n!==0&&e.prev_length<e.max_lazy_match&&e.strstart-n<=e.w_size-ti&&(e.match_length=Si(e,n),e.match_length<=5&&(e.strategy===zr||e.match_length===J&&e.strstart-e.match_start>4096)&&(e.match_length=J-1)),e.prev_length>=J&&e.match_length<=e.prev_length){i=e.strstart+e.lookahead-J,r=Or(e,e.strstart-1-e.prev_match,e.prev_length-J),e.lookahead-=e.prev_length-1,e.prev_length-=2;do++e.strstart<=i&&(e.ins_h=yi(e,e.ins_h,e.window[e.strstart+J-1]),n=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart);while(--e.prev_length!==0);if(e.match_available=0,e.match_length=J-1,e.strstart++,r&&(Z(e,!1),e.strm.avail_out===0))return Y}else if(e.match_available){if(r=Or(e,0,e.window[e.strstart-1]),r&&Z(e,!1),e.strstart++,e.lookahead--,e.strm.avail_out===0)return Y}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&=(r=Or(e,0,e.window[e.strstart-1]),0),e.insert=e.strstart<J-1?e.strstart:J-1,t===K?(Z(e,!0),e.strm.avail_out===0?fi:pi):e.sym_next&&(Z(e,!1),e.strm.avail_out===0)?Y:di},Di=(e,t)=>{let n,r,i,a,o=e.window;for(;;){if(e.lookahead<=ei){if(Ci(e),e.lookahead<=ei&&t===Ar)return Y;if(e.lookahead===0)break}if(e.match_length=0,e.lookahead>=J&&e.strstart>0&&(i=e.strstart-1,r=o[i],r===o[++i]&&r===o[++i]&&r===o[++i])){a=e.strstart+ei;do;while(r===o[++i]&&r===o[++i]&&r===o[++i]&&r===o[++i]&&r===o[++i]&&r===o[++i]&&r===o[++i]&&r===o[++i]&&i<a);e.match_length=ei-(a-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=J?(n=Or(e,1,e.match_length-J),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(n=Or(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),n&&(Z(e,!1),e.strm.avail_out===0))return Y}return e.insert=0,t===K?(Z(e,!0),e.strm.avail_out===0?fi:pi):e.sym_next&&(Z(e,!1),e.strm.avail_out===0)?Y:di},Oi=(e,t)=>{let n;for(;;){if(e.lookahead===0&&(Ci(e),e.lookahead===0)){if(t===Ar)return Y;break}if(e.match_length=0,n=Or(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,n&&(Z(e,!1),e.strm.avail_out===0))return Y}return e.insert=0,t===K?(Z(e,!0),e.strm.avail_out===0?fi:pi):e.sym_next&&(Z(e,!1),e.strm.avail_out===0)?Y:di};function ki(e,t,n,r,i){this.good_length=e,this.max_lazy=t,this.nice_length=n,this.max_chain=r,this.func=i}var Ai=[new ki(0,0,0,0,wi),new ki(4,4,8,4,Ti),new ki(4,5,16,8,Ti),new ki(4,6,32,32,Ti),new ki(4,4,16,16,Ei),new ki(8,16,32,32,Ei),new ki(8,16,128,128,Ei),new ki(8,32,128,256,Ei),new ki(32,128,258,1024,Ei),new ki(32,258,258,4096,Ei)],ji=e=>{e.window_size=2*e.w_size,_i(e.head),e.max_lazy_match=Ai[e.level].max_lazy,e.good_match=Ai[e.level].good_length,e.nice_match=Ai[e.level].nice_length,e.max_chain_length=Ai[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=J-1,e.match_available=0,e.ins_h=0};function Mi(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=Gr,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new Uint16Array(Qr*2),this.dyn_dtree=new Uint16Array((2*Xr+1)*2),this.bl_tree=new Uint16Array((2*Zr+1)*2),_i(this.dyn_ltree),_i(this.dyn_dtree),_i(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new Uint16Array($r+1),this.heap=new Uint16Array(2*Yr+1),_i(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new Uint16Array(2*Yr+1),_i(this.depth),this.sym_buf=0,this.lit_bufsize=0,this.sym_next=0,this.sym_end=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}var Ni=e=>{if(!e)return 1;let t=e.state;return+(!t||t.strm!==e||t.status!==ri&&t.status!==ii&&t.status!==ai&&t.status!==oi&&t.status!==si&&t.status!==ci&&t.status!==li&&t.status!==ui)},Pi=e=>{if(Ni(e))return hi(e,Fr);e.total_in=e.total_out=0,e.data_type=Wr;let t=e.state;return t.pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap===2?ii:t.wrap?ri:li,e.adler=t.wrap===2?0:1,t.last_flush=-2,Tr(t),q},Fi=e=>{let t=Pi(e);return t===q&&ji(e.state),t},Ii=(e,t)=>Ni(e)||e.state.wrap!==2?Fr:(e.state.gzhead=t,q),Li=(e,t,n,r,i,a)=>{if(!e)return Fr;let o=1;if(t===Rr&&(t=6),r<0?(o=0,r=-r):r>15&&(o=2,r-=16),i<1||i>Kr||n!==Gr||r<8||r>15||t<0||t>9||a<0||a>Hr||r===8&&o!==1)return hi(e,Fr);r===8&&(r=9);let s=new Mi;return e.state=s,s.strm=e,s.status=ri,s.wrap=o,s.gzhead=null,s.w_bits=r,s.w_size=1<<s.w_bits,s.w_mask=s.w_size-1,s.hash_bits=i+7,s.hash_size=1<<s.hash_bits,s.hash_mask=s.hash_size-1,s.hash_shift=~~((s.hash_bits+J-1)/J),s.window=new Uint8Array(s.w_size*2),s.head=new Uint16Array(s.hash_size),s.prev=new Uint16Array(s.w_size),s.lit_bufsize=1<<i+6,s.pending_buf_size=s.lit_bufsize*4,s.pending_buf=new Uint8Array(s.pending_buf_size),s.sym_buf=s.lit_bufsize,s.sym_end=(s.lit_bufsize-1)*3,s.level=t,s.strategy=a,s.method=n,Fi(e)},Ri={deflateInit:(e,t)=>Li(e,t,Gr,qr,Jr,Ur),deflateInit2:Li,deflateReset:Fi,deflateResetKeep:Pi,deflateSetHeader:Ii,deflate:(e,t)=>{if(Ni(e)||t>Nr||t<0)return e?hi(e,Fr):Fr;let n=e.state;if(!e.output||e.avail_in!==0&&!e.input||n.status===ui&&t!==K)return hi(e,e.avail_out===0?Lr:Fr);let r=n.last_flush;if(n.last_flush=t,n.pending!==0){if(X(e),e.avail_out===0)return n.last_flush=-1,q}else if(e.avail_in===0&&gi(t)<=gi(r)&&t!==K)return hi(e,Lr);if(n.status===ui&&e.avail_in!==0)return hi(e,Lr);if(n.status===ri&&n.wrap===0&&(n.status=li),n.status===ri){let t=Gr+(n.w_bits-8<<4)<<8,r=-1;if(r=n.strategy>=Br||n.level<2?0:n.level<6?1:n.level===6?2:3,t|=r<<6,n.strstart!==0&&(t|=ni),t+=31-t%31,bi(n,t),n.strstart!==0&&(bi(n,e.adler>>>16),bi(n,e.adler&65535)),e.adler=1,n.status=li,X(e),n.pending!==0)return n.last_flush=-1,q}if(n.status===ii){if(e.adler=0,Q(n,31),Q(n,139),Q(n,8),n.gzhead)Q(n,+!!n.gzhead.text+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),Q(n,n.gzhead.time&255),Q(n,n.gzhead.time>>8&255),Q(n,n.gzhead.time>>16&255),Q(n,n.gzhead.time>>24&255),Q(n,n.level===9?2:n.strategy>=Br||n.level<2?4:0),Q(n,n.gzhead.os&255),n.gzhead.extra&&n.gzhead.extra.length&&(Q(n,n.gzhead.extra.length&255),Q(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=G(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=ai;else if(Q(n,0),Q(n,0),Q(n,0),Q(n,0),Q(n,0),Q(n,n.level===9?2:n.strategy>=Br||n.level<2?4:0),Q(n,mi),n.status=li,X(e),n.pending!==0)return n.last_flush=-1,q}if(n.status===ai){if(n.gzhead.extra){let t=n.pending,r=(n.gzhead.extra.length&65535)-n.gzindex;for(;n.pending+r>n.pending_buf_size;){let i=n.pending_buf_size-n.pending;if(n.pending_buf.set(n.gzhead.extra.subarray(n.gzindex,n.gzindex+i),n.pending),n.pending=n.pending_buf_size,n.gzhead.hcrc&&n.pending>t&&(e.adler=G(e.adler,n.pending_buf,n.pending-t,t)),n.gzindex+=i,X(e),n.pending!==0)return n.last_flush=-1,q;t=0,r-=i}let i=new Uint8Array(n.gzhead.extra);n.pending_buf.set(i.subarray(n.gzindex,n.gzindex+r),n.pending),n.pending+=r,n.gzhead.hcrc&&n.pending>t&&(e.adler=G(e.adler,n.pending_buf,n.pending-t,t)),n.gzindex=0}n.status=oi}if(n.status===oi){if(n.gzhead.name){let t=n.pending,r;do{if(n.pending===n.pending_buf_size){if(n.gzhead.hcrc&&n.pending>t&&(e.adler=G(e.adler,n.pending_buf,n.pending-t,t)),X(e),n.pending!==0)return n.last_flush=-1,q;t=0}r=n.gzindex<n.gzhead.name.length?n.gzhead.name.charCodeAt(n.gzindex++)&255:0,Q(n,r)}while(r!==0);n.gzhead.hcrc&&n.pending>t&&(e.adler=G(e.adler,n.pending_buf,n.pending-t,t)),n.gzindex=0}n.status=si}if(n.status===si){if(n.gzhead.comment){let t=n.pending,r;do{if(n.pending===n.pending_buf_size){if(n.gzhead.hcrc&&n.pending>t&&(e.adler=G(e.adler,n.pending_buf,n.pending-t,t)),X(e),n.pending!==0)return n.last_flush=-1,q;t=0}r=n.gzindex<n.gzhead.comment.length?n.gzhead.comment.charCodeAt(n.gzindex++)&255:0,Q(n,r)}while(r!==0);n.gzhead.hcrc&&n.pending>t&&(e.adler=G(e.adler,n.pending_buf,n.pending-t,t))}n.status=ci}if(n.status===ci){if(n.gzhead.hcrc){if(n.pending+2>n.pending_buf_size&&(X(e),n.pending!==0))return n.last_flush=-1,q;Q(n,e.adler&255),Q(n,e.adler>>8&255),e.adler=0}if(n.status=li,X(e),n.pending!==0)return n.last_flush=-1,q}if(e.avail_in!==0||n.lookahead!==0||t!==Ar&&n.status!==ui){let r=n.level===0?wi(n,t):n.strategy===Br?Oi(n,t):n.strategy===Vr?Di(n,t):Ai[n.level].func(n,t);if((r===fi||r===pi)&&(n.status=ui),r===Y||r===fi)return e.avail_out===0&&(n.last_flush=-1),q;if(r===di&&(t===jr?kr(n):t!==Nr&&(Er(n,0,0,!1),t===Mr&&(_i(n.head),n.lookahead===0&&(n.strstart=0,n.block_start=0,n.insert=0))),X(e),e.avail_out===0))return n.last_flush=-1,q}return t===K?n.wrap<=0?Pr:(n.wrap===2?(Q(n,e.adler&255),Q(n,e.adler>>8&255),Q(n,e.adler>>16&255),Q(n,e.adler>>24&255),Q(n,e.total_in&255),Q(n,e.total_in>>8&255),Q(n,e.total_in>>16&255),Q(n,e.total_in>>24&255)):(bi(n,e.adler>>>16),bi(n,e.adler&65535)),X(e),n.wrap>0&&(n.wrap=-n.wrap),n.pending===0?Pr:q):q},deflateEnd:e=>{if(Ni(e))return Fr;let t=e.state.status;return e.state=null,t===li?hi(e,Ir):q},deflateSetDictionary:(e,t)=>{let n=t.length;if(Ni(e))return Fr;let r=e.state,i=r.wrap;if(i===2||i===1&&r.status!==ri||r.lookahead)return Fr;if(i===1&&(e.adler=xr(e.adler,t,n,0)),r.wrap=0,n>=r.w_size){i===0&&(_i(r.head),r.strstart=0,r.block_start=0,r.insert=0);let e=new Uint8Array(r.w_size);e.set(t.subarray(n-r.w_size,n),0),t=e,n=r.w_size}let a=e.avail_in,o=e.next_in,s=e.input;for(e.avail_in=n,e.next_in=0,e.input=t,Ci(r);r.lookahead>=J;){let e=r.strstart,t=r.lookahead-(J-1);do r.ins_h=yi(r,r.ins_h,r.window[e+J-1]),r.prev[e&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=e,e++;while(--t);r.strstart=e,r.lookahead=J-1,Ci(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=J-1,r.match_available=0,e.next_in=o,e.input=s,e.avail_in=a,r.wrap=i,q},deflateInfo:`pako deflate (from Nodeca project)`},zi=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),Bi={assign:function(e){let t=Array.prototype.slice.call(arguments,1);for(;t.length;){let n=t.shift();if(n){if(typeof n!=`object`)throw TypeError(n+`must be non-object`);for(let t in n)zi(n,t)&&(e[t]=n[t])}}return e},flattenChunks:e=>{let t=0;for(let n=0,r=e.length;n<r;n++)t+=e[n].length;let n=new Uint8Array(t);for(let t=0,r=0,i=e.length;t<i;t++){let i=e[t];n.set(i,r),r+=i.length}return n}},Vi=!0;try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{Vi=!1}var Hi=new Uint8Array(256);for(let e=0;e<256;e++)Hi[e]=e>=252?6:e>=248?5:e>=240?4:e>=224?3:e>=192?2:1;Hi[254]=Hi[254]=1;var Ui=e=>{if(typeof TextEncoder==`function`&&TextEncoder.prototype.encode)return new TextEncoder().encode(e);let t,n,r,i,a,o=e.length,s=0;for(i=0;i<o;i++)n=e.charCodeAt(i),(n&64512)==55296&&i+1<o&&(r=e.charCodeAt(i+1),(r&64512)==56320&&(n=65536+(n-55296<<10)+(r-56320),i++)),s+=n<128?1:n<2048?2:n<65536?3:4;for(t=new Uint8Array(s),a=0,i=0;a<s;i++)n=e.charCodeAt(i),(n&64512)==55296&&i+1<o&&(r=e.charCodeAt(i+1),(r&64512)==56320&&(n=65536+(n-55296<<10)+(r-56320),i++)),n<128?t[a++]=n:n<2048?(t[a++]=192|n>>>6,t[a++]=128|n&63):n<65536?(t[a++]=224|n>>>12,t[a++]=128|n>>>6&63,t[a++]=128|n&63):(t[a++]=240|n>>>18,t[a++]=128|n>>>12&63,t[a++]=128|n>>>6&63,t[a++]=128|n&63);return t},Wi=(e,t)=>{if(t<65534&&e.subarray&&Vi)return String.fromCharCode.apply(null,e.length===t?e:e.subarray(0,t));let n=``;for(let r=0;r<t;r++)n+=String.fromCharCode(e[r]);return n},Gi={string2buf:Ui,buf2string:(e,t)=>{let n=t||e.length;if(typeof TextDecoder==`function`&&TextDecoder.prototype.decode)return new TextDecoder().decode(e.subarray(0,t));let r,i,a=Array(n*2);for(i=0,r=0;r<n;){let t=e[r++];if(t<128){a[i++]=t;continue}let o=Hi[t];if(o>4){a[i++]=65533,r+=o-1;continue}for(t&=o===2?31:o===3?15:7;o>1&&r<n;)t=t<<6|e[r++]&63,o--;if(o>1){a[i++]=65533;continue}t<65536?a[i++]=t:(t-=65536,a[i++]=55296|t>>10&1023,a[i++]=56320|t&1023)}return Wi(a,i)},utf8border:(e,t)=>{t||=e.length,t>e.length&&(t=e.length);let n=t-1;for(;n>=0&&(e[n]&192)==128;)n--;return n<0||n===0?t:n+Hi[e[n]]>t?n:t}};function Ki(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg=``,this.state=null,this.data_type=2,this.adler=0}var qi=Ki,Ji=Object.prototype.toString,{Z_NO_FLUSH:Yi,Z_SYNC_FLUSH:Xi,Z_FULL_FLUSH:Zi,Z_FINISH:Qi,Z_OK:$i,Z_STREAM_END:ea,Z_DEFAULT_COMPRESSION:ta,Z_DEFAULT_STRATEGY:na,Z_DEFLATED:ra}=wr;function ia(e){this.options=Bi.assign({level:ta,method:ra,chunkSize:16384,windowBits:15,memLevel:8,strategy:na},e||{});let t=this.options;t.raw&&t.windowBits>0?t.windowBits=-t.windowBits:t.gzip&&t.windowBits>0&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg=``,this.ended=!1,this.chunks=[],this.strm=new qi,this.strm.avail_out=0;let n=Ri.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(n!==$i)throw Error(Cr[n]);if(t.header&&Ri.deflateSetHeader(this.strm,t.header),t.dictionary){let e;if(e=typeof t.dictionary==`string`?Gi.string2buf(t.dictionary):Ji.call(t.dictionary)===`[object ArrayBuffer]`?new Uint8Array(t.dictionary):t.dictionary,n=Ri.deflateSetDictionary(this.strm,e),n!==$i)throw Error(Cr[n]);this._dict_set=!0}}ia.prototype.push=function(e,t){let n=this.strm,r=this.options.chunkSize,i,a;if(this.ended)return!1;for(a=t===~~t?t:t===!0?Qi:Yi,n.input=typeof e==`string`?Gi.string2buf(e):Ji.call(e)===`[object ArrayBuffer]`?new Uint8Array(e):e,n.next_in=0,n.avail_in=n.input.length;;){if(n.avail_out===0&&(n.output=new Uint8Array(r),n.next_out=0,n.avail_out=r),(a===Xi||a===Zi)&&n.avail_out<=6){this.onData(n.output.subarray(0,n.next_out)),n.avail_out=0;continue}if(i=Ri.deflate(n,a),i===ea)return n.next_out>0&&this.onData(n.output.subarray(0,n.next_out)),i=Ri.deflateEnd(this.strm),this.onEnd(i),this.ended=!0,i===$i;if(n.avail_out===0){this.onData(n.output);continue}if(a>0&&n.next_out>0){this.onData(n.output.subarray(0,n.next_out)),n.avail_out=0;continue}if(n.avail_in===0)break}return!0},ia.prototype.onData=function(e){this.chunks.push(e)},ia.prototype.onEnd=function(e){e===$i&&(this.result=Bi.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg};function aa(e,t){let n=new ia(t);if(n.push(e,!0),n.err)throw n.msg||Cr[n.err];return n.result}function oa(e,t){return t||={},t.raw=!0,aa(e,t)}function sa(e,t){return t||={},t.gzip=!0,aa(e,t)}var ca={Deflate:ia,deflate:aa,deflateRaw:oa,gzip:sa,constants:wr},la=16209,ua=16191,da=function(e,t){let n,r,i,a,o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E=e.state;n=e.next_in,w=e.input,r=n+(e.avail_in-5),i=e.next_out,T=e.output,a=i-(t-e.avail_out),o=i+(e.avail_out-257),s=E.dmax,c=E.wsize,l=E.whave,u=E.wnext,d=E.window,f=E.hold,p=E.bits,m=E.lencode,h=E.distcode,g=(1<<E.lenbits)-1,_=(1<<E.distbits)-1;top:do{p<15&&(f+=w[n++]<<p,p+=8,f+=w[n++]<<p,p+=8),v=m[f&g];dolen:for(;;){if(y=v>>>24,f>>>=y,p-=y,y=v>>>16&255,y===0)T[i++]=v&65535;else if(y&16){b=v&65535,y&=15,y&&(p<y&&(f+=w[n++]<<p,p+=8),b+=f&(1<<y)-1,f>>>=y,p-=y),p<15&&(f+=w[n++]<<p,p+=8,f+=w[n++]<<p,p+=8),v=h[f&_];dodist:for(;;){if(y=v>>>24,f>>>=y,p-=y,y=v>>>16&255,y&16){if(x=v&65535,y&=15,p<y&&(f+=w[n++]<<p,p+=8,p<y&&(f+=w[n++]<<p,p+=8)),x+=f&(1<<y)-1,x>s){e.msg=`invalid distance too far back`,E.mode=la;break top}if(f>>>=y,p-=y,y=i-a,x>y){if(y=x-y,y>l&&E.sane){e.msg=`invalid distance too far back`,E.mode=la;break top}if(S=0,C=d,u===0){if(S+=c-y,y<b){b-=y;do T[i++]=d[S++];while(--y);S=i-x,C=T}}else if(u<y){if(S+=c+u-y,y-=u,y<b){b-=y;do T[i++]=d[S++];while(--y);if(S=0,u<b){y=u,b-=y;do T[i++]=d[S++];while(--y);S=i-x,C=T}}}else if(S+=u-y,y<b){b-=y;do T[i++]=d[S++];while(--y);S=i-x,C=T}for(;b>2;)T[i++]=C[S++],T[i++]=C[S++],T[i++]=C[S++],b-=3;b&&(T[i++]=C[S++],b>1&&(T[i++]=C[S++]))}else{S=i-x;do T[i++]=T[S++],T[i++]=T[S++],T[i++]=T[S++],b-=3;while(b>2);b&&(T[i++]=T[S++],b>1&&(T[i++]=T[S++]))}}else if(y&64){e.msg=`invalid distance code`,E.mode=la;break top}else{v=h[(v&65535)+(f&(1<<y)-1)];continue dodist}break}}else if(!(y&64)){v=m[(v&65535)+(f&(1<<y)-1)];continue dolen}else if(y&32){E.mode=ua;break top}else{e.msg=`invalid literal/length code`,E.mode=la;break top}break}}while(n<r&&i<o);b=p>>3,n-=b,p-=b<<3,f&=(1<<p)-1,e.next_in=n,e.next_out=i,e.avail_in=n<r?5+(r-n):5-(n-r),e.avail_out=i<o?257+(o-i):257-(i-o),E.hold=f,E.bits=p},fa=15,pa=852,ma=592,ha=0,ga=1,_a=2,va=new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),ya=new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78]),ba=new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),xa=new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]),Sa=(e,t,n,r,i,a,o,s)=>{let c=s.bits,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y,b,x,S,C,w=null,T,E=new Uint16Array(fa+1),D=new Uint16Array(fa+1),O=null,k,A,j;for(l=0;l<=fa;l++)E[l]=0;for(u=0;u<r;u++)E[t[n+u]]++;for(p=c,f=fa;f>=1&&E[f]===0;f--);if(p>f&&(p=f),f===0)return i[a++]=20971520,i[a++]=20971520,s.bits=1,0;for(d=1;d<f&&E[d]===0;d++);for(p<d&&(p=d),g=1,l=1;l<=fa;l++)if(g<<=1,g-=E[l],g<0)return-1;if(g>0&&(e===ha||f!==1))return-1;for(D[1]=0,l=1;l<fa;l++)D[l+1]=D[l]+E[l];for(u=0;u<r;u++)t[n+u]!==0&&(o[D[t[n+u]]++]=u);if(e===ha?(w=O=o,T=20):e===ga?(w=va,O=ya,T=257):(w=ba,O=xa,T=0),v=0,u=0,l=d,C=a,m=p,h=0,x=-1,_=1<<p,S=_-1,e===ga&&_>pa||e===_a&&_>ma)return 1;for(;;){k=l-h,o[u]+1<T?(A=0,j=o[u]):o[u]>=T?(A=O[o[u]-T],j=w[o[u]-T]):(A=96,j=0),y=1<<l-h,b=1<<m,d=b;do b-=y,i[C+(v>>h)+b]=k<<24|A<<16|j|0;while(b!==0);for(y=1<<l-1;v&y;)y>>=1;if(y===0?v=0:(v&=y-1,v+=y),u++,--E[l]===0){if(l===f)break;l=t[n+o[u]]}if(l>p&&(v&S)!==x){for(h===0&&(h=p),C+=d,m=l-h,g=1<<m;m+h<f&&(g-=E[m+h],!(g<=0));)m++,g<<=1;if(_+=1<<m,e===ga&&_>pa||e===_a&&_>ma)return 1;x=v&S,i[x]=p<<24|m<<16|C-a|0}}return v!==0&&(i[C+v]=l-h<<24|4194304),s.bits=p,0},Ca=0,wa=1,Ta=2,{Z_FINISH:Ea,Z_BLOCK:Da,Z_TREES:Oa,Z_OK:ka,Z_STREAM_END:Aa,Z_NEED_DICT:ja,Z_STREAM_ERROR:Ma,Z_DATA_ERROR:Na,Z_MEM_ERROR:Pa,Z_BUF_ERROR:Fa,Z_DEFLATED:Ia}=wr,La=16180,Ra=16181,za=16182,Ba=16183,Va=16184,Ha=16185,Ua=16186,Wa=16187,Ga=16188,Ka=16189,qa=16190,Ja=16191,Ya=16192,Xa=16193,Za=16194,Qa=16195,$a=16196,eo=16197,to=16198,no=16199,ro=16200,io=16201,ao=16202,oo=16203,so=16204,co=16205,lo=16206,uo=16207,fo=16208,$=16209,po=16210,mo=16211,ho=852,go=592,_o=15,vo=e=>(e>>>24&255)+(e>>>8&65280)+((e&65280)<<8)+((e&255)<<24);function yo(){this.strm=null,this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}var bo=e=>{if(!e)return 1;let t=e.state;return+(!t||t.strm!==e||t.mode<La||t.mode>mo)},xo=e=>{if(bo(e))return Ma;let t=e.state;return e.total_in=e.total_out=t.total=0,e.msg=``,t.wrap&&(e.adler=t.wrap&1),t.mode=La,t.last=0,t.havedict=0,t.flags=-1,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new Int32Array(ho),t.distcode=t.distdyn=new Int32Array(go),t.sane=1,t.back=-1,ka},So=e=>{if(bo(e))return Ma;let t=e.state;return t.wsize=0,t.whave=0,t.wnext=0,xo(e)},Co=(e,t)=>{let n;if(bo(e))return Ma;let r=e.state;return t<0?(n=0,t=-t):(n=(t>>4)+5,t<48&&(t&=15)),t&&(t<8||t>15)?Ma:(r.window!==null&&r.wbits!==t&&(r.window=null),r.wrap=n,r.wbits=t,So(e))},wo=(e,t)=>{if(!e)return Ma;let n=new yo;e.state=n,n.strm=e,n.window=null,n.mode=La;let r=Co(e,t);return r!==ka&&(e.state=null),r},To=e=>wo(e,_o),Eo=!0,Do,Oo,ko=e=>{if(Eo){Do=new Int32Array(512),Oo=new Int32Array(32);let t=0;for(;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(Sa(wa,e.lens,0,288,Do,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;Sa(Ta,e.lens,0,32,Oo,0,e.work,{bits:5}),Eo=!1}e.lencode=Do,e.lenbits=9,e.distcode=Oo,e.distbits=5},Ao=(e,t,n,r)=>{let i,a=e.state;return a.window===null&&(a.wsize=1<<a.wbits,a.wnext=0,a.whave=0,a.window=new Uint8Array(a.wsize)),r>=a.wsize?(a.window.set(t.subarray(n-a.wsize,n),0),a.wnext=0,a.whave=a.wsize):(i=a.wsize-a.wnext,i>r&&(i=r),a.window.set(t.subarray(n-r,n-r+i),a.wnext),r-=i,r?(a.window.set(t.subarray(n-r,n),0),a.wnext=r,a.whave=a.wsize):(a.wnext+=i,a.wnext===a.wsize&&(a.wnext=0),a.whave<a.wsize&&(a.whave+=i))),0},jo={inflateReset:So,inflateReset2:Co,inflateResetKeep:xo,inflateInit:To,inflateInit2:wo,inflate:(e,t)=>{let n,r,i,a,o,s,c,l,u,d,f,p,m,h,g=0,_,v,y,b,x,S,C,w,T=new Uint8Array(4),E,D,O=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(bo(e)||!e.output||!e.input&&e.avail_in!==0)return Ma;n=e.state,n.mode===Ja&&(n.mode=Ya),o=e.next_out,i=e.output,c=e.avail_out,a=e.next_in,r=e.input,s=e.avail_in,l=n.hold,u=n.bits,d=s,f=c,w=ka;inf_leave:for(;;)switch(n.mode){case La:if(n.wrap===0){n.mode=Ya;break}for(;u<16;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(n.wrap&2&&l===35615){n.wbits===0&&(n.wbits=15),n.check=0,T[0]=l&255,T[1]=l>>>8&255,n.check=G(n.check,T,2,0),l=0,u=0,n.mode=Ra;break}if(n.head&&(n.head.done=!1),!(n.wrap&1)||(((l&255)<<8)+(l>>8))%31){e.msg=`incorrect header check`,n.mode=$;break}if((l&15)!==Ia){e.msg=`unknown compression method`,n.mode=$;break}if(l>>>=4,u-=4,C=(l&15)+8,n.wbits===0&&(n.wbits=C),C>15||C>n.wbits){e.msg=`invalid window size`,n.mode=$;break}n.dmax=1<<n.wbits,n.flags=0,e.adler=n.check=1,n.mode=l&512?Ka:Ja,l=0,u=0;break;case Ra:for(;u<16;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(n.flags=l,(n.flags&255)!==Ia){e.msg=`unknown compression method`,n.mode=$;break}if(n.flags&57344){e.msg=`unknown header flags set`,n.mode=$;break}n.head&&(n.head.text=l>>8&1),n.flags&512&&n.wrap&4&&(T[0]=l&255,T[1]=l>>>8&255,n.check=G(n.check,T,2,0)),l=0,u=0,n.mode=za;case za:for(;u<32;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}n.head&&(n.head.time=l),n.flags&512&&n.wrap&4&&(T[0]=l&255,T[1]=l>>>8&255,T[2]=l>>>16&255,T[3]=l>>>24&255,n.check=G(n.check,T,4,0)),l=0,u=0,n.mode=Ba;case Ba:for(;u<16;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}n.head&&(n.head.xflags=l&255,n.head.os=l>>8),n.flags&512&&n.wrap&4&&(T[0]=l&255,T[1]=l>>>8&255,n.check=G(n.check,T,2,0)),l=0,u=0,n.mode=Va;case Va:if(n.flags&1024){for(;u<16;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}n.length=l,n.head&&(n.head.extra_len=l),n.flags&512&&n.wrap&4&&(T[0]=l&255,T[1]=l>>>8&255,n.check=G(n.check,T,2,0)),l=0,u=0}else n.head&&(n.head.extra=null);n.mode=Ha;case Ha:if(n.flags&1024&&(p=n.length,p>s&&(p=s),p&&(n.head&&(C=n.head.extra_len-n.length,n.head.extra||(n.head.extra=new Uint8Array(n.head.extra_len)),n.head.extra.set(r.subarray(a,a+p),C)),n.flags&512&&n.wrap&4&&(n.check=G(n.check,r,p,a)),s-=p,a+=p,n.length-=p),n.length))break inf_leave;n.length=0,n.mode=Ua;case Ua:if(n.flags&2048){if(s===0)break inf_leave;p=0;do C=r[a+p++],n.head&&C&&n.length<65536&&(n.head.name+=String.fromCharCode(C));while(C&&p<s);if(n.flags&512&&n.wrap&4&&(n.check=G(n.check,r,p,a)),s-=p,a+=p,C)break inf_leave}else n.head&&(n.head.name=null);n.length=0,n.mode=Wa;case Wa:if(n.flags&4096){if(s===0)break inf_leave;p=0;do C=r[a+p++],n.head&&C&&n.length<65536&&(n.head.comment+=String.fromCharCode(C));while(C&&p<s);if(n.flags&512&&n.wrap&4&&(n.check=G(n.check,r,p,a)),s-=p,a+=p,C)break inf_leave}else n.head&&(n.head.comment=null);n.mode=Ga;case Ga:if(n.flags&512){for(;u<16;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(n.wrap&4&&l!==(n.check&65535)){e.msg=`header crc mismatch`,n.mode=$;break}l=0,u=0}n.head&&(n.head.hcrc=n.flags>>9&1,n.head.done=!0),e.adler=n.check=0,n.mode=Ja;break;case Ka:for(;u<32;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}e.adler=n.check=vo(l),l=0,u=0,n.mode=qa;case qa:if(n.havedict===0)return e.next_out=o,e.avail_out=c,e.next_in=a,e.avail_in=s,n.hold=l,n.bits=u,ja;e.adler=n.check=1,n.mode=Ja;case Ja:if(t===Da||t===Oa)break inf_leave;case Ya:if(n.last){l>>>=u&7,u-=u&7,n.mode=lo;break}for(;u<3;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}switch(n.last=l&1,l>>>=1,--u,l&3){case 0:n.mode=Xa;break;case 1:if(ko(n),n.mode=no,t===Oa){l>>>=2,u-=2;break inf_leave}break;case 2:n.mode=$a;break;case 3:e.msg=`invalid block type`,n.mode=$}l>>>=2,u-=2;break;case Xa:for(l>>>=u&7,u-=u&7;u<32;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if((l&65535)!=(l>>>16^65535)){e.msg=`invalid stored block lengths`,n.mode=$;break}if(n.length=l&65535,l=0,u=0,n.mode=Za,t===Oa)break inf_leave;case Za:n.mode=Qa;case Qa:if(p=n.length,p){if(p>s&&(p=s),p>c&&(p=c),p===0)break inf_leave;i.set(r.subarray(a,a+p),o),s-=p,a+=p,c-=p,o+=p,n.length-=p;break}n.mode=Ja;break;case $a:for(;u<14;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(n.nlen=(l&31)+257,l>>>=5,u-=5,n.ndist=(l&31)+1,l>>>=5,u-=5,n.ncode=(l&15)+4,l>>>=4,u-=4,n.nlen>286||n.ndist>30){e.msg=`too many length or distance symbols`,n.mode=$;break}n.have=0,n.mode=eo;case eo:for(;n.have<n.ncode;){for(;u<3;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}n.lens[O[n.have++]]=l&7,l>>>=3,u-=3}for(;n.have<19;)n.lens[O[n.have++]]=0;if(n.lencode=n.lendyn,n.lenbits=7,E={bits:n.lenbits},w=Sa(Ca,n.lens,0,19,n.lencode,0,n.work,E),n.lenbits=E.bits,w){e.msg=`invalid code lengths set`,n.mode=$;break}n.have=0,n.mode=to;case to:for(;n.have<n.nlen+n.ndist;){for(;g=n.lencode[l&(1<<n.lenbits)-1],_=g>>>24,v=g>>>16&255,y=g&65535,!(_<=u);){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(y<16)l>>>=_,u-=_,n.lens[n.have++]=y;else{if(y===16){for(D=_+2;u<D;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(l>>>=_,u-=_,n.have===0){e.msg=`invalid bit length repeat`,n.mode=$;break}C=n.lens[n.have-1],p=3+(l&3),l>>>=2,u-=2}else if(y===17){for(D=_+3;u<D;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}l>>>=_,u-=_,C=0,p=3+(l&7),l>>>=3,u-=3}else{for(D=_+7;u<D;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}l>>>=_,u-=_,C=0,p=11+(l&127),l>>>=7,u-=7}if(n.have+p>n.nlen+n.ndist){e.msg=`invalid bit length repeat`,n.mode=$;break}for(;p--;)n.lens[n.have++]=C}}if(n.mode===$)break;if(n.lens[256]===0){e.msg=`invalid code -- missing end-of-block`,n.mode=$;break}if(n.lenbits=9,E={bits:n.lenbits},w=Sa(wa,n.lens,0,n.nlen,n.lencode,0,n.work,E),n.lenbits=E.bits,w){e.msg=`invalid literal/lengths set`,n.mode=$;break}if(n.distbits=6,n.distcode=n.distdyn,E={bits:n.distbits},w=Sa(Ta,n.lens,n.nlen,n.ndist,n.distcode,0,n.work,E),n.distbits=E.bits,w){e.msg=`invalid distances set`,n.mode=$;break}if(n.mode=no,t===Oa)break inf_leave;case no:n.mode=ro;case ro:if(s>=6&&c>=258){e.next_out=o,e.avail_out=c,e.next_in=a,e.avail_in=s,n.hold=l,n.bits=u,da(e,f),o=e.next_out,i=e.output,c=e.avail_out,a=e.next_in,r=e.input,s=e.avail_in,l=n.hold,u=n.bits,n.mode===Ja&&(n.back=-1);break}for(n.back=0;g=n.lencode[l&(1<<n.lenbits)-1],_=g>>>24,v=g>>>16&255,y=g&65535,!(_<=u);){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(v&&!(v&240)){for(b=_,x=v,S=y;g=n.lencode[S+((l&(1<<b+x)-1)>>b)],_=g>>>24,v=g>>>16&255,y=g&65535,!(b+_<=u);){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}l>>>=b,u-=b,n.back+=b}if(l>>>=_,u-=_,n.back+=_,n.length=y,v===0){n.mode=co;break}if(v&32){n.back=-1,n.mode=Ja;break}if(v&64){e.msg=`invalid literal/length code`,n.mode=$;break}n.extra=v&15,n.mode=io;case io:if(n.extra){for(D=n.extra;u<D;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}n.length+=l&(1<<n.extra)-1,l>>>=n.extra,u-=n.extra,n.back+=n.extra}n.was=n.length,n.mode=ao;case ao:for(;g=n.distcode[l&(1<<n.distbits)-1],_=g>>>24,v=g>>>16&255,y=g&65535,!(_<=u);){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(!(v&240)){for(b=_,x=v,S=y;g=n.distcode[S+((l&(1<<b+x)-1)>>b)],_=g>>>24,v=g>>>16&255,y=g&65535,!(b+_<=u);){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}l>>>=b,u-=b,n.back+=b}if(l>>>=_,u-=_,n.back+=_,v&64){e.msg=`invalid distance code`,n.mode=$;break}n.offset=y,n.extra=v&15,n.mode=oo;case oo:if(n.extra){for(D=n.extra;u<D;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}n.offset+=l&(1<<n.extra)-1,l>>>=n.extra,u-=n.extra,n.back+=n.extra}if(n.offset>n.dmax){e.msg=`invalid distance too far back`,n.mode=$;break}n.mode=so;case so:if(c===0)break inf_leave;if(p=f-c,n.offset>p){if(p=n.offset-p,p>n.whave&&n.sane){e.msg=`invalid distance too far back`,n.mode=$;break}p>n.wnext?(p-=n.wnext,m=n.wsize-p):m=n.wnext-p,p>n.length&&(p=n.length),h=n.window}else h=i,m=o-n.offset,p=n.length;p>c&&(p=c),c-=p,n.length-=p;do i[o++]=h[m++];while(--p);n.length===0&&(n.mode=ro);break;case co:if(c===0)break inf_leave;i[o++]=n.length,c--,n.mode=ro;break;case lo:if(n.wrap){for(;u<32;){if(s===0)break inf_leave;s--,l|=r[a++]<<u,u+=8}if(f-=c,e.total_out+=f,n.total+=f,n.wrap&4&&f&&(e.adler=n.check=n.flags?G(n.check,i,f,o-f):xr(n.check,i,f,o-f)),f=c,n.wrap&4&&(n.flags?l:vo(l))!==n.check){e.msg=`incorrect data check`,n.mode=$;break}l=0,u=0}n.mode=uo;case uo:if(n.wrap&&n.flags){for(;u<32;){if(s===0)break inf_leave;s--,l+=r[a++]<<u,u+=8}if(n.wrap&4&&l!==(n.total&4294967295)){e.msg=`incorrect length check`,n.mode=$;break}l=0,u=0}n.mode=fo;case fo:w=Aa;break inf_leave;case $:w=Na;break inf_leave;case po:return Pa;case mo:default:return Ma}return e.next_out=o,e.avail_out=c,e.next_in=a,e.avail_in=s,n.hold=l,n.bits=u,(n.wsize||f!==e.avail_out&&n.mode<$&&(n.mode<lo||t!==Ea))&&Ao(e,e.output,e.next_out,f-e.avail_out),d-=e.avail_in,f-=e.avail_out,e.total_in+=d,e.total_out+=f,n.total+=f,n.wrap&4&&f&&(e.adler=n.check=n.flags?G(n.check,i,f,e.next_out-f):xr(n.check,i,f,e.next_out-f)),e.data_type=n.bits+(n.last?64:0)+(n.mode===Ja?128:0)+(n.mode===no||n.mode===Za?256:0),(d===0&&f===0||t===Ea)&&w===ka&&(w=Fa),w},inflateEnd:e=>{if(bo(e))return Ma;let t=e.state;return t.window&&=null,e.state=null,ka},inflateGetHeader:(e,t)=>{if(bo(e))return Ma;let n=e.state;return n.wrap&2?(n.head=t,t.done=!1,ka):Ma},inflateSetDictionary:(e,t)=>{let n=t.length,r,i,a;return bo(e)||(r=e.state,r.wrap!==0&&r.mode!==qa)?Ma:r.mode===qa&&(i=1,i=xr(i,t,n,0),i!==r.check)?Na:(a=Ao(e,t,n,n),a?(r.mode=po,Pa):(r.havedict=1,ka))},inflateInfo:`pako inflate (from Nodeca project)`};function Mo(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name=``,this.comment=``,this.hcrc=0,this.done=!1}var No=Mo,Po=Object.prototype.toString,{Z_NO_FLUSH:Fo,Z_FINISH:Io,Z_OK:Lo,Z_STREAM_END:Ro,Z_NEED_DICT:zo,Z_STREAM_ERROR:Bo,Z_DATA_ERROR:Vo,Z_MEM_ERROR:Ho}=wr;function Uo(e){this.options=Bi.assign({chunkSize:65536,windowBits:15,to:``},e||{});let t=this.options;t.raw&&t.windowBits>=0&&t.windowBits<16&&(t.windowBits=-t.windowBits,t.windowBits===0&&(t.windowBits=-15)),t.windowBits>=0&&t.windowBits<16&&!(e&&e.windowBits)&&(t.windowBits+=32),t.windowBits>15&&t.windowBits<48&&(t.windowBits&15||(t.windowBits|=15)),this.err=0,this.msg=``,this.ended=!1,this.chunks=[],this.strm=new qi,this.strm.avail_out=0;let n=jo.inflateInit2(this.strm,t.windowBits);if(n!==Lo||(this.header=new No,jo.inflateGetHeader(this.strm,this.header),t.dictionary&&(typeof t.dictionary==`string`?t.dictionary=Gi.string2buf(t.dictionary):Po.call(t.dictionary)===`[object ArrayBuffer]`&&(t.dictionary=new Uint8Array(t.dictionary)),t.raw&&(n=jo.inflateSetDictionary(this.strm,t.dictionary),n!==Lo))))throw Error(Cr[n])}Uo.prototype.push=function(e,t){let n=this.strm,r=this.options.chunkSize,i=this.options.dictionary,a,o,s;if(this.ended)return!1;for(o=t===~~t?t:t===!0?Io:Fo,n.input=Po.call(e)===`[object ArrayBuffer]`?new Uint8Array(e):e,n.next_in=0,n.avail_in=n.input.length;;){for(n.avail_out===0&&(n.output=new Uint8Array(r),n.next_out=0,n.avail_out=r),a=jo.inflate(n,o),a===zo&&i&&(a=jo.inflateSetDictionary(n,i),a===Lo?a=jo.inflate(n,o):a===Vo&&(a=zo));n.avail_in>0&&a===Ro&&n.state.wrap>0&&e[n.next_in]!==0;)jo.inflateReset(n),a=jo.inflate(n,o);switch(a){case Bo:case Vo:case zo:case Ho:return this.onEnd(a),this.ended=!0,!1}if(s=n.avail_out,n.next_out&&(n.avail_out===0||a===Ro)){if(this.options.to===`string`){let e=Gi.utf8border(n.output,n.next_out),t=n.next_out-e,i=Gi.buf2string(n.output,e);n.next_out=t,n.avail_out=r-t,t&&n.output.set(n.output.subarray(e,e+t),0),this.onData(i)}else this.onData(n.output.length===n.next_out?n.output:n.output.subarray(0,n.next_out))}if(a!==Lo||s!==0){if(a===Ro)return a=jo.inflateEnd(this.strm),this.onEnd(a),this.ended=!0,!0;if(n.avail_in===0)break}}return!0},Uo.prototype.onData=function(e){this.chunks.push(e)},Uo.prototype.onEnd=function(e){e===Lo&&(this.result=this.options.to===`string`?this.chunks.join(``):Bi.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg};function Wo(e,t){let n=new Uo(t);if(n.push(e),n.err)throw n.msg||Cr[n.err];return n.result}function Go(e,t){return t||={},t.raw=!0,Wo(e,t)}var Ko={Inflate:Uo,inflate:Wo,inflateRaw:Go,ungzip:Wo,constants:wr},{Deflate:qo,deflate:Jo,deflateRaw:Yo,gzip:Xo}=ca,{Inflate:Zo,inflate:Qo,inflateRaw:$o,ungzip:es}=Ko,ts=Qo,ns=function(e,t){return ts(new Uint8Array(e)).buffer},rs=function(e,t){let n=e.byteLength,r=new Uint8Array(n),i=Math.floor(n/t),a=new DataView(e);for(var o=0;o<t;o++)for(var s=0;s<i;s++)r[o+s*t]=a.getUint8(o*i+s);return r.buffer},is=function(e,t){return as(e),e.slice(0,-4)};function as(e){for(var t=e.byteLength%2!=0,n=e.byteLength-4,r=new DataView(e),i=0,a=0,o=0;o<n-1;o+=2){let e=r.getUint16(o,!0);i=(i+e)%65535,a=(a+i)%65535}if(t){let e=r.getUint8(n-1);i=(i+e)%65535,a=(a+i)%65535}var[s,c]=U.unpack_from(`>HH`,e,n);if(s%=65535,c%=65535,i!=s||a!=c)throw`ValueError("fletcher32 checksum invalid")`;return!0}var os=new Map([[1,ns],[2,rs],[3,is]]),ss=class{constructor(e,t){this.fh=e,this.offset=t,this.depth=null}init(){this.all_nodes=new Map,this._read_root_node(),this._read_children()}_read_children(){let e=this.depth;for(;e>0;){for(var t of this.all_nodes.get(e))for(var n of t.get(`addresses`))this._add_node(this._read_node(n,e-1));e--}}_read_root_node(){let e=this._read_node(this.offset,null);this._add_node(e),this.depth=e.get(`node_level`)}_add_node(e){let t=e.get(`node_level`);this.all_nodes.has(t)?this.all_nodes.get(t).push(e):this.all_nodes.set(t,[e])}_read_node(e,t){return node=this._read_node_header(e,t),node.set(`keys`,[]),node.set(`addresses`,[]),node}_read_node_header(e){throw`NotImplementedError: must define _read_node_header in implementation class`}},cs=class extends ss{B_LINK_NODE=new Map([[`signature`,`4s`],[`node_type`,`B`],[`node_level`,`B`],[`entries_used`,`H`],[`left_sibling`,`Q`],[`right_sibling`,`Q`]]);_read_node_header(e,t){let n=B(this.B_LINK_NODE,this.fh,e);if(t!=null&&n.get(`node_level`)!=t)throw`node level does not match`;return n}},ls=class extends cs{NODE_TYPE=0;constructor(e,t){super(e,t),this.init()}_read_node(e,t){let n=this._read_node_header(e,t);e+=H(this.B_LINK_NODE);let r=[],i=[],a=n.get(`entries_used`);for(var o=0;o<a;o++){let t=U.unpack_from(`<Q`,this.fh,e)[0];e+=8;let n=U.unpack_from(`<Q`,this.fh,e)[0];e+=8,r.push(t),i.push(n)}return r.push(U.unpack_from(`<Q`,this.fh,e)[0]),n.set(`keys`,r),n.set(`addresses`,i),n}symbol_table_addresses(){var e=[];for(var t of this.all_nodes.get(0))e=e.concat(t.get(`addresses`));return e}},us=class extends cs{NODE_TYPE=1;constructor(e,t,n){super(e,t),this.dims=n,this.init()}_read_node(e,t){let n=this._read_node_header(e,t);e+=H(this.B_LINK_NODE);var r=[],i=[];let a=n.get(`entries_used`);for(var o=0;o<a;o++){let[t,n]=U.unpack_from(`<II`,this.fh,e);e+=8;let a=`<`+this.dims.toFixed()+`Q`,o=U.calcsize(a),s=U.unpack_from(a,this.fh,e);e+=o;let c=U.unpack_from(`<Q`,this.fh,e)[0];e+=8,r.push(new Map([[`chunk_size`,t],[`filter_mask`,n],[`chunk_offset`,s]])),i.push(c)}return n.set(`keys`,r),n.set(`addresses`,i),n}construct_data_from_chunks(e,t,n,r){var i,a,o;if(n instanceof Array){let e=n[0];if(e==`REFERENCE`){if(n[1]!=8)throw`NotImplementedError('Unsupported Reference type')`;var n=`<u8`;i=`getUint64`,a=!1,o=8}else if(e==`VLEN_STRING`||e==`VLEN_SEQUENCE`)i=`getVLENStruct`,a=!1,o=16;else throw`NotImplementedError('datatype not implemented')`}else[i,a,o]=Kt(n);var s=t.reduce(function(e,t){return e*t},1),c=e.reduce(function(e,t){return e*t},1);let l=t.length;var u=1;e.slice().map(function(e){let t=u;return u*=e,t});var u=1,d=t.slice().reverse().map(function(e){let t=u;return u*=e,t}).reverse(),f=Array(s);let p=c*o;for(var m of this.all_nodes.get(0)){let n=m.get(`keys`),s=m.get(`addresses`),u=n.length;for(var h=0;h<u;h++){let u=n[h],m=s[h];var g;if(r==null)g=this.fh.slice(m,m+p);else{g=this.fh.slice(m,m+u.get(`chunk_size`));let e=u.get(`filter_mask`);g=this._filter_chunk(g,e,r,o)}for(var _=u.get(`chunk_offset`).slice(),v=_.slice(),y=v.map(function(){return 0}),b=new Yt(g),x=0;x<c;x++){for(var S=l-1;S>=0&&y[S]>=e[S];S--)y[S]=0,v[S]=_[S],S>0&&(y[S-1]+=1,v[S-1]+=1);if(v.slice(0,-1).every(function(e,n){return e<t[n]})){let e=x*o,t=b[i](e,!a,o),n=v.slice(0,-1).reduce(function(e,t,n){return t*d[n]+e},0);f[n]=t}y[l-1]+=1,v[l-1]+=1}}}return f}_filter_chunk(e,t,n,r){let i=n.length,a=e.slice();for(var o=i-1;o>=0;o--){if(t&1<<o)continue;let e=n[o],i=e.get(`filter_id`),s=e.get(`client_data`);if(os.has(i))a=os.get(i)(a,r,s);else throw`NotImplementedError("Filter with id:`+i.toFixed()+` not supported")`}return a}},ds=class extends ss{B_TREE_HEADER=new Map([[`signature`,`4s`],[`version`,`B`],[`node_type`,`B`],[`node_size`,`I`],[`record_size`,`H`],[`depth`,`H`],[`split_percent`,`B`],[`merge_percent`,`B`],[`root_address`,`Q`],[`root_nrecords`,`H`],[`total_nrecords`,`Q`]]);B_LINK_NODE=new Map([[`signature`,`4s`],[`version`,`B`],[`node_type`,`B`]]);constructor(e,t){super(e,t),this.init()}_read_root_node(){let e=this._read_tree_header(this.offset);this.address_formats=this._calculate_address_formats(e),this.header=e,this.depth=e.get(`depth`);let t=[e.get(`root_address`),e.get(`root_nrecords`),e.get(`total_nrecords`)],n=this._read_node(t,this.depth);this._add_node(n)}_read_tree_header(e){return B(this.B_TREE_HEADER,this.fh,this.offset)}_calculate_address_formats(e){let t=e.get(`node_size`),n=e.get(`record_size`),r=0,i=0,a=new Map,o=e.get(`depth`);for(var s=0;s<=o;s++){let e=``,c=``,l=``,u,d,f;if(s==0?(u=0,d=0,f=0):s==1?(u=8,e=`<Q`,d=this._required_bytes(r),c=this._int_format(d),f=0):(u=8,e=`<Q`,d=this._required_bytes(r),c=this._int_format(d),f=this._required_bytes(i),l=this._int_format(f)),a.set(s,[u,d,f,e,c,l]),s<o){let e=u+d+f;r=this._nrecords_max(t,n,e),i>0?i*=r:i=r}}return a}_nrecords_max(e,t,n){return Math.floor((e-10-n)/(t+n))}_required_bytes(e){return Math.ceil(Xt(e)/8)}_int_format(e){return[`<B`,`<H`,`<I`,`<Q`][e-1]}_read_node(e,t){let[n,r,i]=e,a=this._read_node_header(n,t);n+=H(this.B_LINK_NODE);let o=this.header.get(`record_size`),s=[];for(let e=0;e<r;e++){let e=this._parse_record(this.fh,n,o);n+=o,s.push(e)}let c=[],l=this.address_formats.get(t);if(t!=0){let[e,t,i,a,o,s]=l;for(let l=0;l<=r;l++){let r=U.unpack_from(a,this.fh,n)[0];n+=e;let l=U.unpack_from(o,this.fh,n)[0];n+=t;let u=l;i>0&&(u=U.unpack_from(s,this.fh,n)[0],n+=i),c.push([r,l,u])}}return a.set(`keys`,s),a.set(`addresses`,c),a}_read_node_header(e,t){let n=B(this.B_LINK_NODE,this.fh,e);return n.set(`node_level`,t),n}*iter_records(){for(let e of this.all_nodes.values())for(let t of e)for(let e of t.get(`keys`))yield e}_parse_record(e){throw`NotImplementedError`}},fs=class extends ds{NODE_TYPE=5;_parse_record(e,t,n){let r=U.unpack_from(`<I`,e,t)[0];return t+=4,new Map([[`namehash`,r],[`heapid`,e.slice(t,t+7)]])}},ps=class extends ds{NODE_TYPE=6;_parse_record(e,t,n){let r=U.unpack_from(`<Q`,e,t)[0];return t+=8,new Map([[`creationorder`,r],[`heapid`,e.slice(t,t+7)]])}},ms=class{constructor(e,t){let n=U.unpack_from(`<B`,e,t+8)[0];var r;if(n==0)r=B(xs,e,t),this._end_of_sblock=t+Ss;else if(n==2||n==3)r=B(Cs,e,t),this._end_of_sblock=t+ws;else throw`unsupported superblock version: `+n.toFixed();if(r.get(`format_signature`)!=ys)throw`Incorrect file signature: `+r.get(`format_signature`);if(r.get(`offset_size`)!=8||r.get(`length_size`)!=8)throw`File uses non-64-bit addressing`;this.version=r.get(`superblock_version`),this._contents=r,this._root_symbol_table=null,this._fh=e}get offset_to_dataobjects(){if(this.version==0){var e=new gs(this._fh,this._end_of_sblock,!0);return this._root_symbol_table=e,e.group_offset}if(this.version==2||this.version==3)return this._contents.get(`root_group_address`);throw`Not implemented version = `+this.version.toFixed()}},hs=class{constructor(e,t){let n=B(ks,e,t);V(n.get(`signature`)==`HEAP`),V(n.get(`version`)==0);let r=n.get(`address_of_data_segment`),i=e.slice(r,r+n.get(`data_segment_size`));n.set(`heap_data`,i),this._contents=n,this.data=i}get_object_name(e){let t=new Uint8Array(this.data).indexOf(0,e)-e;return U.unpack_from(`<`+t.toFixed()+`s`,this.data,e)[0]}},gs=class{constructor(e,t,n=!1){var r;if(n)r=new Map([[`symbols`,1]]);else{if(r=B(Ds,e,t),r.get(`signature`)!=`SNOD`)throw`incorrect node type`;t+=Os}for(var i=[],a=r.get(`symbols`),o=0;o<a;o++)i.push(B(Ts,e,t)),t+=Es;n&&(this.group_offset=i[0].get(`object_header_address`)),this.entries=i,this._contents=r}assign_name(e){this.entries.forEach(function(t){let n=t.get(`link_name_offset`),r=e.get_object_name(n);t.set(`link_name`,r)})}get_links(e){var t={};return this.entries.forEach(function(n){let r=n.get(`cache_type`),i=n.get(`link_name`);if(r==0||r==1)t[i]=n.get(`object_header_address`);else if(r==2){let r=n.get(`scratch`),o=new ArrayBuffer(4),s=new Uint8Array(o);for(var a=0;a<4;a++)s[a]=r.charCodeAt(a);let c=U.unpack_from(`<I`,o,0)[0];t[i]=e.get_object_name(c)}}),t}},_s=class{constructor(e,t){let n=B(As,e,t);t+=js;let r=n.get(`collection_size`)-js,i=e.slice(t,t+r);this.heap_data=i,this._header=n,this._objects=null}get objects(){if(this._objects==null){this._objects=new Map;for(var e=0;e<=this.heap_data.byteLength-Ns;){let t=B(Ms,this.heap_data,e);if(t.get(`object_index`)==0)break;e+=Ns;let n=this.heap_data.slice(e,e+t.get(`object_size`));this._objects.set(t.get(`object_index`),n),e+=Wt(t.get(`object_size`))}}return this._objects}},vs=class{constructor(e,t){this.fh=e;let n=B(Ps,e,t);if(t+=H(Ps),V(n.get(`signature`)==`FRHP`),V(n.get(`version`)==0),n.get(`filter_info_size`)>0)throw`Filter info size not supported on FractalHeap`;if(n.get(`btree_address_huge_objects`)==bs)n.set(`btree_address_huge_objects`,null);else throw`Huge objects not implemented in FractalHeap`;n.get(`root_block_address`)==bs&&n.set(`root_block_address`,null);let r=n.get(`log2_maximum_heap_size`),i=this._min_size_nbits(r),a=new Map([[`signature`,`4s`],[`version`,`B`],[`heap_header_adddress`,`Q`],[`block_offset`,`${i}B`]]);this.indirect_block_header=new Map(a),this.indirect_block_header_size=H(a),(n.get(`flags`)&2)==2&&a.set(`checksum`,`I`),this.direct_block_header=a,this.direct_block_header_size=H(a);let o=n.get(`maximum_direct_block_size`);this._managed_object_offset_size=this._min_size_nbits(r);let s=Math.min(o,n.get(`max_managed_object_size`));this._managed_object_length_size=this._min_size_integer(s);let c=n.get(`starting_block_size`),l=n.get(`table_width`);if(!(c>0))throw`Starting block size == 0 not implemented`;let u=Number(Math.floor(Math.log2(o)));V(1n<<BigInt(u)==o);let d=Number(Math.floor(Math.log2(c)));V(1n<<BigInt(d)==c),this._max_direct_nrows=u-d+2;let f=Math.floor(Math.log2(l));V(1<<f==l),this._indirect_nrows_sub=f+d-1,this.header=n,this.nobjects=n.get(`managed_object_count`)+n.get(`huge_object_count`)+n.get(`tiny_object_count`);let p=[],m=n.get(`root_block_address`),h=0;if(m!=null&&(h=n.get(`indirect_current_rows_count`)),h>0)for(let t of this._iter_indirect_block(e,m,h))p.push(t);else{let t=this._read_direct_block(e,m,c);p.push(t)}let g=p.reduce((e,t)=>e+t.byteLength,0),_=new Uint8Array(g),v=0;p.forEach(e=>{_.set(new Uint8Array(e),v),v+=e.byteLength}),this.managed=_.buffer}_read_direct_block(e,t,n){let r=e.slice(t,t+n);return V(B(this.direct_block_header,r).get(`signature`)==`FHDB`),r}get_data(e){let t=U.unpack_from(`<B`,e,0)[0];t&15;let n=t>>4&3,r=t>>6,i=1;if(n==0){V(r==0);let t=this._managed_object_offset_size,n=Zt(t,e,i);i+=t,t=this._managed_object_length_size;let a=Zt(t,e,i);return this.managed.slice(n,n+a)}throw n==1?`tiny objectID not supported in FractalHeap`:n==2?`huge objectID not supported in FractalHeap`:`unknown objectID type in FractalHeap`}_min_size_integer(e){return this._min_size_nbits(Xt(e))}_min_size_nbits(e){return Math.ceil(e/8)}*_iter_indirect_block(e,t,n){let r=B(this.indirect_block_header,e,t);t+=this.indirect_block_header_size,V(r.get(`signature`)==`FHIB`);let i=r.get(`block_offset`).reduce((e,t,n)=>e+(t<<n*8),0);r.set(`block_offset`,i);let[a,o]=this._indirect_info(n),s=[];for(let n=0;n<a;n++){let r=U.unpack_from(`<Q`,e,t)[0];if(t+=8,r==bs)break;let i=this._calc_block_size(n);s.push([r,i])}let c=[];for(let n=a;n<a+o;n++){let r=U.unpack_from(`<Q`,e,t)[0];if(t+=8,r==bs)break;let i=this._calc_block_size(n),a=this._iblock_nrows_from_block_size(i);c.push([r,a])}for(let[t,n]of s)yield this._read_direct_block(e,t,n);for(let[t,n]of c)for(let r of this._iter_indirect_block(e,t,n))yield r}_calc_block_size(e){let t=Math.floor(e/this.header.get(`table_width`));return 2**Math.max(t-1,0)*this.header.get(`starting_block_size`)}_iblock_nrows_from_block_size(e){let t=Math.floor(Math.log2(e));return V(2**t==e),t-this._indirect_nrows_sub}_indirect_info(e){let t=this.header.get(`table_width`),n=e*t,r=this._max_direct_nrows*t,i,a;return e<=r?(i=n,a=0):(i=r,a=n-r),[i,a]}_int_format(e){return[`B`,`H`,`I`,`Q`][e-1]}},ys=U.unpack_from(`8s`,new Uint8Array([137,72,68,70,13,10,26,10]).buffer)[0],bs=U.unpack_from(`<Q`,new Uint8Array([255,255,255,255,255,255,255,255]).buffer)[0],xs=new Map([[`format_signature`,`8s`],[`superblock_version`,`B`],[`free_storage_version`,`B`],[`root_group_version`,`B`],[`reserved_0`,`B`],[`shared_header_version`,`B`],[`offset_size`,`B`],[`length_size`,`B`],[`reserved_1`,`B`],[`group_leaf_node_k`,`H`],[`group_internal_node_k`,`H`],[`file_consistency_flags`,`L`],[`base_address_lower`,`Q`],[`free_space_address`,`Q`],[`end_of_file_address`,`Q`],[`driver_information_address`,`Q`]]),Ss=H(xs),Cs=new Map([[`format_signature`,`8s`],[`superblock_version`,`B`],[`offset_size`,`B`],[`length_size`,`B`],[`file_consistency_flags`,`B`],[`base_address`,`Q`],[`superblock_extension_address`,`Q`],[`end_of_file_address`,`Q`],[`root_group_address`,`Q`],[`superblock_checksum`,`I`]]),ws=H(Cs),Ts=new Map([[`link_name_offset`,`Q`],[`object_header_address`,`Q`],[`cache_type`,`I`],[`reserved`,`I`],[`scratch`,`16s`]]),Es=H(Ts),Ds=new Map([[`signature`,`4s`],[`version`,`B`],[`reserved_0`,`B`],[`symbols`,`H`]]),Os=H(Ds),ks=new Map([[`signature`,`4s`],[`version`,`B`],[`reserved`,`3s`],[`data_segment_size`,`Q`],[`offset_to_free_list`,`Q`],[`address_of_data_segment`,`Q`]]),As=new Map([[`signature`,`4s`],[`version`,`B`],[`reserved`,`3s`],[`collection_size`,`Q`]]),js=H(As),Ms=new Map([[`object_index`,`H`],[`reference_count`,`H`],[`reserved`,`I`],[`object_size`,`Q`]]),Ns=H(Ms),Ps=new Map([[`signature`,`4s`],[`version`,`B`],[`object_index_size`,`H`],[`filter_info_size`,`H`],[`flags`,`B`],[`max_managed_object_size`,`I`],[`next_huge_object_index`,`Q`],[`btree_address_huge_objects`,`Q`],[`managed_freespace_size`,`Q`],[`freespace_manager_address`,`Q`],[`managed_space_size`,`Q`],[`managed_alloc_size`,`Q`],[`next_directblock_iterator_address`,`Q`],[`managed_object_count`,`Q`],[`huge_objects_total_size`,`Q`],[`huge_object_count`,`Q`],[`tiny_objects_total_size`,`Q`],[`tiny_object_count`,`Q`],[`table_width`,`H`],[`starting_block_size`,`Q`],[`maximum_direct_block_size`,`Q`],[`log2_maximum_heap_size`,`H`],[`indirect_starting_rows_count`,`H`],[`root_block_address`,`Q`],[`indirect_current_rows_count`,`H`]]),Fs=class{constructor(e,t){let n=U.unpack_from(`<B`,e,t)[0];if(n==1)var[r,i,a]=this._parse_v1_objects(e,t);else if(n==79)var[r,i,a]=this._parse_v2_objects(e,t);else throw`InvalidHDF5File('unknown Data Object Header')`;this.fh=e,this.msgs=r,this.msg_data=i,this.offset=t,this._global_heaps={},this._header=a,this._filter_pipeline=null,this._chunk_params_set=!1,this._chunks=null,this._chunk_dims=null,this._chunk_address=null}get dtype(){let e=this.find_msg_type(uc)[0].get(`offset_to_message`);return new Qt(this.fh,e).dtype}get chunks(){return this._get_chunk_params(),this._chunks}get shape(){let e=this.find_msg_type(cc)[0].get(`offset_to_message`);return Is(this.fh,e)}get filter_pipeline(){if(this._filter_pipeline!=null)return this._filter_pipeline;let e=this.find_msg_type(mc);if(!e.length)return this._filter_pipeline=null,this._filter_pipeline;var t=e[0].get(`offset_to_message`);let[n,r]=U.unpack_from(`<BB`,this.fh,t);t+=U.calcsize(`<BB`);var i=[];if(n==1){let[e,n]=U.unpack_from(`<HI`,this.fh,t);t+=U.calcsize(`<HI`);for(var a=0;a<r;a++){let e=B(oc,this.fh,t);t+=sc;let n=Wt(e.get(`name_length`),8),r=`<`+n.toFixed()+`s`,a=U.unpack_from(r,this.fh,t)[0];e.set(`filter_name`,a),t+=n,r=`<`+e.get(`client_data_values`).toFixed()+`I`;let o=U.unpack_from(r,this.fh,t);e.set(`client_data`,o),t+=4*e.get(`client_data_values`),e.get(`client_data_values`)%2&&(t+=4),i.push(e)}}else if(n==2)for(let e=0;e<r;e++){let e=new Map,n=this.fh,r=U.unpack_from(`<H`,n,t)[0];t+=2,e.set(`filter_id`,r);let a=0;r>255&&(a=U.unpack_from(`<H`,n,t)[0],t+=2);let o=U.unpack_from(`<H`,n,t)[0];t+=2;let s=(o&1)>0;e.set(`optional`,s);let c=U.unpack_from(`<H`,n,t)[0];t+=2;let l;a>0&&(l=U.unpack_from(`${a}s`,n,t)[0],t+=a),e.set(`name`,l);let u=U.unpack_from(`<${c}i`,n,t);t+=4*c,e.set(`client_data`,u),e.set(`client_data_values`,c),i.push(e)}else throw`version ${n} is not supported`;return this._filter_pipeline=i,this._filter_pipeline}find_msg_type(e){return this.msgs.filter(function(t){return t.get(`type`)==e})}get_attributes(){let e={},t=this.find_msg_type(hc);for(let n of t){let t=n.get(`offset_to_message`),[r,i]=this.unpack_attribute(t);e[r]=i}return e}get fillvalue(){var e=this.find_msg_type(dc)[0].get(`offset_to_message`),t;let n=U.unpack_from(`<B`,this.fh,e)[0];var r,i,a;if(n==1||n==2)r=B(nc,this.fh,e),e+=rc,t=r.get(`fillvalue_defined`);else if(n==3)r=B(ic,this.fh,e),e+=ac,t=r.get(`flags`)&32;else throw`InvalidHDF5File("Unknown fillvalue msg version: "`+String(n);if(t?(i=U.unpack_from(`<I`,this.fh,e)[0],e+=4):i=0,i){let[t,n,r]=Kt(this.dtype);a=new Yt(this.fh)[t](e,!n,r)}else a=0;return a}unpack_attribute(e){let t=U.unpack_from(`<B`,this.fh,e)[0];var n,r;if(t==1)n=B(zs,this.fh,e),V(n.get(`version`)==1),e+=Bs,r=8;else if(t==3)n=B(Vs,this.fh,e),V(n.get(`version`)==3),e+=Hs,r=1;else throw`unsupported attribute message version: `+t;let i=n.get(`name_size`),a=U.unpack_from(`<`+i.toFixed()+`s`,this.fh,e)[0];a=a.replace(/\x00$/,``),e+=Wt(i,r);var o;try{o=new Qt(this.fh,e).dtype}catch{return console.warn(`Attribute `+a+` type not implemented, set to null.`),[a,null]}e+=Wt(n.get(`datatype_size`),r);let s=this.determine_data_shape(this.fh,e),c=s.reduce(function(e,t){return e*t},1);e+=Wt(n.get(`dataspace_size`),r);var l=this._attr_value(o,this.fh,c,e);return s.length==0&&(l=l[0]),[a,l]}determine_data_shape(e,t){let n=U.unpack_from(`<B`,e,t)[0];var r;if(n==1)r=B(Gs,e,t),V(r.get(`version`)==1),t+=Ks;else if(n==2)r=B(qs,e,t),V(r.get(`version`)==2),t+=Js;else throw`unknown dataspace message version`;let i=r.get(`dimensionality`);return U.unpack_from(`<`+i.toFixed()+`Q`,e,t)}_attr_value(e,t,n,r){var i=Array(n);if(e instanceof Array){let l=e[0];for(var a=0;a<n;a++)if(l==`VLEN_STRING`){let n=e[2];var[o,s]=this._vlen_size_and_data(t,r);let c=new TextDecoder(n==0?`ascii`:`utf-8`);i[a]=c.decode(s),r+=16}else if(l==`REFERENCE`){var c=U.unpack_from(`<Q`,t,r);i[a]=c,r+=8}else if(l==`VLEN_SEQUENCE`){let n=e[1];var[o,s]=this._vlen_size_and_data(t,r);i[a]=this._attr_value(n,s,o,0),r+=16}else throw`NotImplementedError`}else{let[o,s,c]=Kt(e),l=new Yt(t,0);for(var a=0;a<n;a++)i[a]=l[o](r,!s,c),r+=c}return i}_vlen_size_and_data(e,t){let n=U.unpack_from(`<I`,e,t)[0],r=B(Rs,e,t+4),i=r.get(`collection_address`);V(r.get(`collection_address`)<2**53-1);var a;return i in this._global_heaps||(a=new _s(this.fh,i),this._global_heaps[i]=a),a=this._global_heaps[i],[n,a.objects.get(r.get(`object_index`))]}_parse_v1_objects(e,t){let n=B(Us,e,t);V(n.get(`version`)==1);let r=n.get(`total_header_messages`);for(var i=n.get(`object_header_size`),a=t+H(Us),o=e.slice(a,a+i),s=[[a,i]],c=0,l=0,u=Array(r),d=0;d<r;d++){l>=i&&([a,i]=s[++c],l=0);let t=B(Ys,e,a+l),n=a+l+Xs;if(t.set(`offset_to_message`,n),t.get(`type`)==gc){var[f,p]=U.unpack_from(`<QQ`,e,n);s.push([f,p])}l+=Xs+t.get(`size`),u[d]=t}return[u,o,n]}_parse_v2_objects(e,t){var[n,r,i]=this._parse_v2_header(e,t);t=i;for(var a=[],o=n.get(`size_of_chunk_0`),s=e.slice(t,t+=o),c=[[i,o]],l=new Set([i]),u=0,d=0;;){if(d>=o-Qs){let e=c[++u];if(e==null)break;[i,o]=e,d=0}let t=B(Zs,e,i+d),n=i+d+Qs+r;if(t.set(`offset_to_message`,n),t.get(`type`)==gc){var[f,p]=U.unpack_from(`<QQ`,e,n);let t=f+4;l.has(t)||(l.add(t),c.push([t,p-4]))}d+=Qs+t.get(`size`)+r,a.push(t)}return[a,s,n]}_parse_v2_header(e,t){let n=B(Ws,e,t);var r;if(t+=H(Ws),V(n.get(`version`)==2),r=n.get(`flags`)&4?2:0,V(!(n.get(`flags`)&16)),n.get(`flags`)&32){let r=U.unpack_from(`<4I`,e,t);t+=16,n.set(`access_time`,r[0]),n.set(`modification_time`,r[1]),n.set(`change_time`,r[2]),n.set(`birth_time`,r[3])}let i=[`<B`,`<H`,`<I`,`<Q`][n.get(`flags`)&3];return n.set(`size_of_chunk_0`,U.unpack_from(i,e,t)[0]),t+=U.calcsize(i),[n,r,t]}get_links(){return Object.fromEntries(this.iter_links())}*iter_links(){for(let e of this.msgs)e.get(`type`)==_c?yield*this._iter_links_from_symbol_tables(e):e.get(`type`)==fc?yield this._get_link_from_link_msg(e):e.get(`type`)==lc&&(yield*this._iter_link_from_link_info_msg(e))}*_iter_links_from_symbol_tables(e){V(e.get(`size`)==16);let t=B($s,this.fh,e.get(`offset_to_message`));yield*this._iter_links_btree_v1(t.get(`btree_address`),t.get(`heap_address`))}*_iter_links_btree_v1(e,t){let n=new ls(this.fh,e),r=new hs(this.fh,t);for(let e of n.symbol_table_addresses()){let t=new gs(this.fh,e);t.assign_name(r),yield*Object.entries(t.get_links(r))}}_get_link_from_link_msg(e){let t=e.get(`offset_to_message`);return this._decode_link_msg(this.fh,t)[1]}_decode_link_msg(e,t){let[n,r]=U.unpack_from(`<BB`,e,t);t+=2,V(n==1);let i=2**(r&3),a=(r&8)>0,o=(r&16)>0,s=(r&4)>0,c;a?(c=U.unpack_from(`<B`,e,t)[0],t+=1):c=0,V([0,1].includes(c));let l;s&&(l=U.unpack_from(`<Q`,e,t)[0],t+=8);let u=0;o&&(u=U.unpack_from(`<B`,e,t)[0],t+=1);let d=u==0?`ascii`:`utf-8`,f=[`<B`,`<H`,`<I`,`<Q`][r&3],p=U.unpack_from(f,e,t)[0];t+=i;let m=new TextDecoder(d).decode(e.slice(t,t+p));t+=p;let h;if(c==0)h=U.unpack_from(`<Q`,e,t)[0];else if(c==1){let n=U.unpack_from(`<H`,e,t)[0];t+=2,h=new TextDecoder(d).decode(e.slice(t,t+n))}return[l,[m,h]]}*_iter_link_from_link_info_msg(e){let t=e.get(`offset_to_message`),n=this._decode_link_info_msg(this.fh,t),r=n.get(`heap_address`),i=n.get(`name_btree_address`),a=n.get(`order_btree_address`);i!=null&&(yield*this._iter_links_btree_v2(i,a,r))}*_iter_links_btree_v2(e,t,n){let r=new vs(this.fh,n),i,a=t!=null;i=a?new ps(this.fh,t):new fs(this.fh,e);let o=new Map;for(let e of i.iter_records()){let t=r.get_data(e.get(`heapid`)),[n,i]=this._decode_link_msg(t,0),s=a?n:i[0];o.set(s,i)}let s=Array.from(o.keys()).sort();for(let e of s)yield o.get(e)}_decode_link_info_msg(e,t){let[n,r]=U.unpack_from(`<BB`,e,t);V(n==0),t+=2,(r&1)>0&&(t+=8);let i=B((r&2)>0?tc:ec,e,t),a=new Map;for(let[e,t]of i.entries())a.set(e,t==Ls?null:t);return a}get is_dataset(){return this.find_msg_type(cc).length>0}get_data(){let e=this.find_msg_type(pc)[0].get(`offset_to_message`);var[t,n,r,i]=this._get_data_message_properties(e);if(r==0)throw`Compact storage of DataObject not implemented`;if(r==1)return this._get_contiguous_data(i);if(r==2)return this._get_chunked_data(e)}_get_data_message_properties(e){let t,n,r,[i,a,o]=U.unpack_from(`<BBB`,this.fh,e);return i==1||i==2?(t=a,n=o,r=e,r+=U.calcsize(`<BBB`),r+=U.calcsize(`<BI`),V(n==1||n==2)):(i==3||i==4)&&(n=a,r=e,r+=U.calcsize(`<BB`)),V(i>=1&&i<=4),[i,t,n,r]}_get_contiguous_data(e){let[t]=U.unpack_from(`<Q`,this.fh,e);if(t==Ls){let e=this.shape.reduce(function(e,t){return e*t},1);return Array(e)}var n=this.shape.reduce(function(e,t){return e*t},1);if(this.dtype instanceof Array){let e=this.dtype[0];if(e==`REFERENCE`){if(this.dtype[1]!=8)throw`NotImplementedError('Unsupported Reference type')`;return this.fh.slice(t,t+n)}if(e==`VLEN_STRING`){let e=this.dtype[2]==0?`ascii`:`utf-8`,a=new TextDecoder(e);for(var r=[],i=0;i<n;i++){let[e,n]=this._vlen_size_and_data(this.fh,t);r[i]=a.decode(n),t+=16}return r}throw`NotImplementedError('datatype not implemented')`}{let e=this.dtype;if(/[<>=!@\|]?(i|u|f|S)(\d*)/.test(e)){let[r,a,o]=Kt(e),s=Array(n),c=new Yt(this.fh);for(var i=0;i<n;i++)s[i]=c[r](t+i*o,!a,o);return s}throw`not Implemented - no proper dtype defined`}}_get_chunked_data(e){if(this._get_chunk_params(),this._chunk_address==Ls)return[];let t=new us(this.fh,this._chunk_address,this._chunk_dims).construct_data_from_chunks(this.chunks,this.shape,this.dtype,this.filter_pipeline);if(this.dtype instanceof Array&&/^VLEN/.test(this.dtype[0])){let e=this.dtype[0];for(var n=0;n<t.length;n++){let[i,a,o]=t[n];var r;a in this._global_heaps?r=this._global_heaps[a]:(r=new _s(this.fh,a),this._global_heaps[a]=r);let s=r.objects.get(o);if(e==`VLEN_STRING`){let e=this.dtype[2]==0?`ascii`:`utf-8`,r=new TextDecoder(e);t[n]=r.decode(s)}}}return t}_get_chunk_params(){if(!this._chunk_params_set){this._chunk_params_set=!0;var e=this.find_msg_type(pc)[0].get(`offset_to_message`),[t,n,r,i]=this._get_data_message_properties(e);if(r==2){var a;if(t==1||t==2){var o=U.unpack_from(`<Q`,this.fh,i)[0];a=i+U.calcsize(`<Q`)}else if(t==3){var[n,o]=U.unpack_from(`<BQ`,this.fh,i);a=i+U.calcsize(`<BQ`)}V(t>=1&&t<=3);var s=`<`+(n-1).toFixed()+`I`,c=U.unpack_from(s,this.fh,a);this._chunks=c,this._chunk_dims=n,this._chunk_address=o}}}};function Is(e,t){let n=U.unpack_from(`<B`,e,t)[0];var r;if(n==1)r=B(Gs,e,t),V(r.get(`version`)==1),t+=Ks;else if(n==2)r=B(qs,e,t),V(r.get(`version`)==2),t+=Js;else throw`InvalidHDF5File('unknown dataspace message version')`;let i=r.get(`dimensionality`);return U.unpack_from(`<`+(i*2).toFixed()+`I`,e,t).filter(function(e,t){return t%2==0})}var Ls=U.unpack_from(`<Q`,new Uint8Array([255,255,255,255,255,255,255,255]).buffer),Rs=new Map([[`collection_address`,`Q`],[`object_index`,`I`]]);H(Rs);var zs=new Map([[`version`,`B`],[`reserved`,`B`],[`name_size`,`H`],[`datatype_size`,`H`],[`dataspace_size`,`H`]]),Bs=H(zs),Vs=new Map([[`version`,`B`],[`flags`,`B`],[`name_size`,`H`],[`datatype_size`,`H`],[`dataspace_size`,`H`],[`character_set_encoding`,`B`]]),Hs=H(Vs),Us=new Map([[`version`,`B`],[`reserved`,`B`],[`total_header_messages`,`H`],[`object_reference_count`,`I`],[`object_header_size`,`I`],[`padding`,`I`]]),Ws=new Map([[`signature`,`4s`],[`version`,`B`],[`flags`,`B`]]),Gs=new Map([[`version`,`B`],[`dimensionality`,`B`],[`flags`,`B`],[`reserved_0`,`B`],[`reserved_1`,`I`]]),Ks=H(Gs),qs=new Map([[`version`,`B`],[`dimensionality`,`B`],[`flags`,`B`],[`type`,`B`]]),Js=H(qs),Ys=new Map([[`type`,`H`],[`size`,`H`],[`flags`,`B`],[`reserved`,`3s`]]),Xs=H(Ys),Zs=new Map([[`type`,`B`],[`size`,`H`],[`flags`,`B`]]),Qs=H(Zs),$s=new Map([[`btree_address`,`Q`],[`heap_address`,`Q`]]),ec=new Map([[`heap_address`,`Q`],[`name_btree_address`,`Q`]]),tc=new Map([[`heap_address`,`Q`],[`name_btree_address`,`Q`],[`order_btree_address`,`Q`]]),nc=new Map([[`version`,`B`],[`space_allocation_time`,`B`],[`fillvalue_write_time`,`B`],[`fillvalue_defined`,`B`]]),rc=H(nc),ic=new Map([[`version`,`B`],[`flags`,`B`]]),ac=H(ic),oc=new Map([[`filter_id`,`H`],[`name_length`,`H`],[`flags`,`H`],[`client_data_values`,`H`]]),sc=H(oc),cc=1,lc=2,uc=3,dc=5,fc=6,pc=8,mc=11,hc=12,gc=16,_c=17,vc=class e{constructor(e,t,n,r=!1){if(n==null?(this.parent=this,this.file=this):(this.parent=n,this.file=n.file),this.name=e,this._links=t.get_links(),this._dataobjects=t,this._attrs=null,this._keys=null,r)return new Proxy(this,yc)}get keys(){return this._keys??=Object.keys(this._links),this._keys.slice()}get values(){return this.keys.map(e=>this.get(e))}length(){return this.keys.length}_dereference(e){if(!e)throw`cannot deference null reference`;let t=this.file._get_object_by_address(e);if(t==null)throw`reference not found in file`;return t}get(t){if(typeof t==`number`)return this._dereference(t);var n=Cc(t);if(n==`/`)return this.file;if(n==`.`)return this;if(/^\//.test(n))return this.file.get(n.slice(1));if(Sc(n)!=``)var[r,i]=n.split(/\/(.*)/);else var r=n,i=`.`;if(!(r in this._links))throw r+` not found in group`;var a=Cc(this.name+`/`+r);let o=this._links[r];if(typeof o==`string`)try{return this.get(o)}catch{return null}var s=new Fs(this.file._fh,o);if(s.is_dataset){if(i!=`.`)throw a+` is a dataset, not a group`;return new xc(a,s,this)}return new e(a,s,this).get(i)}visit(e){return this.visititems((t,n)=>e(t))}visititems(t){var n=this.name.length;/\/$/.test(this.name)||(n+=1);for(var r=this.values.slice();r;){let i=r.shift();r.length==1&&console.log(i);let a=t(i.name.slice(n),i);if(a!=null)return a;i instanceof e&&(r=r.concat(i.values))}return null}get attrs(){return this._attrs??=this._dataobjects.get_attributes(),this._attrs}},yc={get:function(e,t,n){return t in e?e[t]:e.get(t)}},bc=class extends vc{constructor(e,t){var n=new ms(e,0).offset_to_dataobjects,r=new Fs(e,n);super(`/`,r,null),this.parent=this,this._fh=e,this.filename=t||``,this.file=this,this.mode=`r`,this.userblock_size=0}_get_object_by_address(e){return this._dataobjects.offset==e?this:this.visititems(e=>{e._dataobjects.offset})}},xc=class extends Array{constructor(e,t,n){super(),this.parent=n,this.file=n.file,this.name=e,this._dataobjects=t,this._attrs=null,this._astype=null}get value(){var e=this._dataobjects.get_data();return this._astype==null?e:e.astype(this._astype)}get shape(){return this._dataobjects.shape}get attrs(){return this._dataobjects.get_attributes()}get dtype(){return this._dataobjects.dtype}get fillvalue(){return this._dataobjects.fillvalue}};function Sc(e){let t=e.lastIndexOf(`/`)+1,n=e.slice(0,t),r=RegExp(`^/+$`),i=RegExp(`/$`);return n&&!r.test(n)&&(n=n.replace(i,``)),n}function Cc(e){return e.replace(/\/(\/)+/g,`/`)}var{Rectangle:wc}=Cesium,Tc=`https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-radar-precip`,Ec=1e3,Dc=2255e3,Oc=148e4,kc=710,Ac=640,jc=2.68,Mc=43.61,Nc=12.47,Pc=49.38,Fc=1024,Ic=768,Lc=10,Rc=36e5,zc=12,Bc=new Map;function Vc(e){let t=`${e.toISOString().slice(0,10).replaceAll(`-`,``)}-ch`;return Bc.has(t)||Bc.set(t,et.fromUrl(`${Tc}/items/${t}`).then(({data:e})=>e.assets,e=>{throw Bc.delete(t),e})),Bc.get(t)}function Hc(e){let t=Math.floor((e.getTime()-Date.UTC(e.getUTCFullYear(),0,0))/(24*Rc)),n=(e,t)=>String(e).padStart(t,`0`);return`cpc${n(e.getUTCFullYear()%100,2)}${n(t,3)}${n(e.getUTCHours(),2)}00`}async function Uc(){let e=new Date(Math.floor(Date.now()/Rc)*Rc),t=e.getUTCDate();for(let n=0;n<26;n++){let n;try{n=await Vc(e)}catch(n){if(e.getUTCDate()!==t)throw n;e.setUTCHours(-1,0,0,0);continue}let r=Hc(e);if(Object.keys(n).some(e=>e.startsWith(r)))return e;e.setTime(e.getTime()-Rc)}throw Error(`No CombiPrecip file in the last day`)}function Wc(e,t){let n=(e*3600-26782.5)/1e4,r=(t*3600-169028.66)/1e4;return{east:2600072.37+211455.93*n-10938.51*n*r-.36*n*r*r-44.54*n**3,north:1200147.07+308807.95*r+3745.25*n*n+76.63*r*r-194.56*n*n*r+119.79*r**3}}function Gc(e){let t=new bc(e,`radar.h5`),{gain:n,offset:r}=t.get(`dataset1/data1/what`).attrs,i=t.get(`dataset1/data1/data`).value,a=document.createElement(`canvas`);a.width=Fc,a.height=Ic;let o=a.getContext(`2d`,{willReadFrequently:!0}),s=o.createImageData(Fc,Ic);for(let e=0;e<Ic;e++){let t=Pc-(e+.5)/Ic*5.770000000000003;for(let a=0;a<Fc;a++){let{east:o,north:c}=Wc(jc+(a+.5)/Fc*9.790000000000001,t),l=Math.floor((o-Dc)/Ec),u=Math.floor((Oc-c)/Ec);if(l<0||l>=kc||u<0||u>=Ac)continue;let d=i[u*kc+l]*n+r;d>0&&(s.data[4*(e*Fc+a)]=255*Math.sqrt(Math.min(d/Lc,1)))}}for(let e=3;e<s.data.length;e+=4)s.data[e]=255;return o.putImageData(s,0,0),{image:a,rectangle:wc.fromDegrees(jc,Mc,Nc,Pc)}}var Kc=new Map;function qc(e){let t=e.getTime(),n=Kc.get(t);return n?(Kc.delete(t),Kc.set(t,n)):(Kc.set(t,(async()=>{let t=Hc(e),n=await Vc(e),r=Object.keys(n).find(e=>e.startsWith(t));if(!r)throw Error(`No CombiPrecip file for ${e.toISOString()}`);let i=await fetch(n[r].href);if(!i.ok)throw Error(`${i.status} for ${i.url}`);return Gc(await i.arrayBuffer())})().catch(e=>{throw Kc.delete(t),e})),Kc.size>zc&&Kc.delete(Kc.keys().next().value)),Kc.get(t)}var Jc=343,Yc=2e4,Xc=.5,Zc=36e5,Qc=700,$c=3,el=3;t(`cesiumContainer`).then(e=>{let t=document.querySelector(`#controls`),n=new ne(e),r=new x(e,{intensity:1}),i=new y(e,{intensity:0,radius:3e4});n.active=!0,r.active=!0,i.active=!0;let a,o,s;i.strikeEvent.addEventListener(async t=>{if(a?.state!==`running`)return;let n=Cesium.Cartesian3.distance(t,e.scene.camera.positionWC);if(n>Yc)return;let r=new PannerNode(a,{panningModel:`HRTF`,distanceModel:`inverse`,refDistance:1e3});r.connect(a.destination);let i=new l(e,t,r);i.active=!0;let o=new AudioBufferSourceNode(a,{buffer:await s});o.connect(r),o.onended=()=>{i.active=!1,r.disconnect()},o.start(a.currentTime+n/Jc)}),e.scene.postRender.addEventListener(()=>{let t=e.scene.camera.positionCartographic.height<r.cloudBase;o?.gain.setTargetAtTime(t?Xc*r.localIntensity:0,a.currentTime,.1)});let c=document.querySelector(`#time`),u=document.querySelector(`#track`),d=document.querySelector(`#hour`),f=document.querySelector(`#play`),p=f.querySelector(`wa-icon`),m=document.querySelector(`#previous`),h=document.querySelector(`#next`),g=Number(c.max),_=()=>Number(c.value),v,b=e=>new Date(v.getTime()+e*Zc),S=e=>Cesium.Math.clamp(Math.floor((Cesium.JulianDate.toDate(e)-v)/Zc)+1,0,g),C=e.clock;C.multiplier=Zc/Qc,C.clockRange=Cesium.ClockRange.LOOP_STOP,e.scene.maximumRenderTimeChange=300;let w=()=>{C.currentTime=Cesium.JulianDate.fromDate(new Date(b(_()).getTime()-Zc/2))},T=new Intl.DateTimeFormat([],{hour:`2-digit`,minute:`2-digit`}),E=e=>{let t=b(e),n=new Date(t.getTime()-Zc);return`${n.toLocaleDateString([],{weekday:`short`,day:`numeric`,month:`short`})} · ${T.formatRange(n,t)}`},D=()=>{let e=(c.shadowRoot?.querySelector(`[part~="track"]`)??c).getBoundingClientRect(),t=u.getBoundingClientRect(),n=e.left-t.left+_()/g*e.width,r=d.offsetWidth/2,i=Cesium.Math.clamp(n,r,t.width-r);d.style.left=`${i}px`,d.style.setProperty(`--arrow`,`${50+100*(n-i)/d.offsetWidth}%`)},O=(e,t=!1)=>{d.textContent=e,d.classList.toggle(`error`,t),D()};new ResizeObserver(D).observe(u);let k=()=>{m.disabled=_()===0,h.disabled=_()===g},A=async()=>{let e=_(),t=b(e);k(),O(`${E(e)} · loading…`);try{let a=await qc(t);return e===_()&&(r.map=a,n.map=a,i.map=a,i.intensity=1,O(E(e))),!0}catch(t){return console.error(t),e===_()&&O(`${E(e)} · no radar`,!0),!1}},j=!1,ee=0,M=0,te=e=>{j=e,ee++,M=0,C.shouldAnimate=j,p.name=j?`pause`:`play`,p.label=j?`Pause`:`Play`},re=async e=>{let t=ee;C.shouldAnimate=!1,c.value=e;let n=await A();if(t===ee){if(M=n?0:M+1,M===el){te(!1);return}for(let t=1;t<=$c;t++)qc(b((e+t)%(g+1))).catch(()=>{});C.shouldAnimate=!0}};C.onTick.addEventListener(()=>{if(C.shouldAnimate){let e=S(C.currentTime);e!==_()&&re(e)}});let ie=()=>te(!j),ae=e=>{te(!1),c.value=Cesium.Math.clamp(e,0,g),w(),A()};f.addEventListener(`click`,ie),m.addEventListener(`click`,()=>ae(_()-1)),h.addEventListener(`click`,()=>ae(_()+1)),c.addEventListener(`input`,()=>O(E(_()))),c.addEventListener(`change`,()=>{w(),A()}),document.addEventListener(`keydown`,e=>{c.disabled||e.altKey||e.ctrlKey||e.metaKey||e.target.closest?.(`input, textarea, wa-slider`)||(e.key===`ArrowLeft`||e.key===`ArrowRight`?(e.preventDefault(),ae(_()+(e.key===`ArrowLeft`?-1:1))):e.key===` `&&!e.target.closest?.(`wa-button, wa-switch`)&&(e.preventDefault(),ie()))}),Uc().then(e=>{v=new Date(e.getTime()-g*Zc),C.startTime=Cesium.JulianDate.fromDate(b(-1)),C.stopTime=Cesium.JulianDate.fromDate(e);let t=(e,t,...n)=>{let r=document.createElement(`span`);r.slot=`reference`,r.className=e,r.append(...n),r.style.left=`${100*t/g}%`,c.append(r)},n=new Date(v);for(n.setHours(24,0,0,0);n<=e;n.setDate(n.getDate()+1)){t(`midnight`,(n-v)/Zc);let e=(n-v)/Zc+12;if(e<=g-6){let r=new Date(n.getTime()+12*Zc),i=document.createElement(`span`);i.className=`weekday`,i.textContent=`${r.toLocaleDateString([],{weekday:`short`})} `,t(`day`,e,i,String(r.getDate()))}}c.disabled=f.disabled=!1,w(),A()},e=>{console.error(e),O(`The radar is unavailable`,!0)});let oe=async e=>{let t=await fetch(e);return a.decodeAudioData(await t.arrayBuffer())};t.addEventListener(`change`,async e=>{if(e.target.name===`sound`){if(a)e.target.checked?await a.resume():await a.suspend();else{a=new AudioContext,s=oe(`sounds/thunder.mp3`),o=new GainNode(a,{gain:0}),o.connect(a.destination);let e=new AudioBufferSourceNode(a,{buffer:await oe(`sounds/rain.mp3`),loop:!0});e.connect(o),e.start()}}})});