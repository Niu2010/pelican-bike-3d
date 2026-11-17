// 鹈鹕骑车抓鱼 —— Three.js 实时 3D 小游戏
// 所有模型、纹理、音效、音乐都由代码程序化生成，无外部素材。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

// =====================================================================
// 渲染器 / 场景 / 相机
// =====================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xff9f70, 30, 140);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.03, 900);
camera.position.set(-5, 2.4, 2.4);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.55, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// =====================================================================
// 程序化纹理
// =====================================================================
function canvasTex(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function noise(g, w, h, base, amt, n = 9000, size = 2) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const v = (Math.random() - 0.5) * amt;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    g.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
}
const ROAD_TILE = 16; // 一张路面纹理代表 16 米
const roadTex = canvasTex(1024, 256, (g, w, h) => {
  noise(g, w, h, '#3b3c42', 0.18, 26000, 2);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${rand(0.03, 0.08)})`; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(20, 90), rand(6, 20), 0, 0, TAU); g.fill(); }
  g.fillStyle = '#eeeeee'; g.fillRect(0, h * 0.02, w, h * 0.022); g.fillRect(0, h * 0.958, w, h * 0.022);
  g.fillStyle = '#f3c84b';
  for (const v of [0.355, 0.645]) for (let k = 0; k < 2; k++) g.fillRect(k * w / 2 + w * 0.05, h * v - 3, w * 0.19, 6);
}, 300 / ROAD_TILE, 1);
const sandTex = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#e6cc98', 0.22, 30000, 2); for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(160,120,70,.12)'; g.lineWidth = 2; g.beginPath(); const y = rand(0, h); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + rand(-10, 10), w * .6, y + rand(-10, 10), w, y); g.stroke(); } }, 40, 2);
const grassTex = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#5d9a4d', 0.3, 40000, 3); }, 40, 10);
const concreteTex = canvasTex(256, 64, (g, w, h) => { noise(g, w, h, '#9a9a96', 0.2, 4000, 2); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 2, h); }, 150, 1);
const foamTex = canvasTex(1024, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = rand(0, w), y = h * 0.5 + (Math.random() - 0.5) * h * 0.5 * Math.random();
    const r = rand(3, 16); const a = rand(0.15, 0.6);
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.45, 'rgba(255,255,255,.55)'); lg.addColorStop(0.55, 'rgba(255,255,255,.7)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
}, 10, 1);
foamTex.colorSpace = THREE.NoColorSpace;
const glowTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

// =====================================================================
// 天空（黄昏 → 星空月夜）
// =====================================================================
const skyU = {
  uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
  uSunDir: { value: V(0, 0.1, -1) }, uSunCol: { value: new THREE.Color() }, uMoonDir: { value: V(0, 0.5, -1) }, uNight: { value: 0 }
};
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
  fragmentShader: `
    uniform vec3 uZenith,uHorizon,uGround,uSunDir,uSunCol,uMoonDir; uniform float uNight; varying vec3 vD;
    float hash(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
    void main(){
      vec3 d = normalize(vD); float h = d.y;
      vec3 c = h > 0.0 ? mix(uHorizon, uZenith, pow(clamp(h*1.6,0.,1.),0.6)) : mix(uHorizon, uGround, clamp(-h*5.,0.,1.));
      vec3 sd = normalize(uSunDir); float s = max(dot(d,sd),0.);
      c += uSunCol * (pow(s,1500.)*8. + pow(s,30.)*0.45 + pow(s,4.)*0.18) * (1.-uNight*0.9);
      vec3 md = normalize(uMoonDir); float m = max(dot(d,md),0.);
      float disc = smoothstep(0.99955,0.99975,m);
      float crater = 0.85 + 0.15*hash(floor(d*900.));
      c += vec3(0.95,0.95,1.0) * disc * crater * 2.4 * uNight;
      c += vec3(0.5,0.6,0.9) * pow(m,200.) * 0.6 * uNight + vec3(0.25,0.3,0.5)*pow(m,12.)*0.15*uNight;
      gl_FragColor = vec4(max(c,0.),1.);
    }`
}));
sky.frustumCulled = false; scene.add(sky);

// 星星（闪烁）
const STAR_N = 2200;
const starGeo = new THREE.BufferGeometry();
{
  const p = new Float32Array(STAR_N * 3), s = new Float32Array(STAR_N), ph = new Float32Array(STAR_N);
  for (let i = 0; i < STAR_N; i++) {
    const v = V().randomDirection(); v.y = Math.abs(v.y) * 0.95 + 0.05; v.normalize().multiplyScalar(560);
    p.set([v.x, v.y, v.z], i * 3); s[i] = Math.random() ** 3 * 3 + 0.8; ph[i] = Math.random() * TAU;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(s, 1));
  starGeo.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
}
const starMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uPR: { value: 1 } },
  vertexShader: `attribute float size; attribute float phase; uniform float uTime, uPR; varying float vT;
    void main(){ vT = 0.6 + 0.4*sin(uTime*2.3 + phase*7.); vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = size*uPR; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform float uOpacity; varying float vT; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vec3(1.,0.97,0.9), uOpacity*vT*smoothstep(0.5,0.,d)); }`
});
const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; scene.add(stars);

// =====================================================================
// 灯光
// =====================================================================
const hemi = new THREE.HemisphereLight(0xffd0b0, 0x40507a, 0.7); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffb27a, 2.4);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 80 });
key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const headLamp = new THREE.SpotLight(0xfff0c8, 0, 22, 0.42, 0.55, 1.1);
scene.add(headLamp, headLamp.target);

// =====================================================================
// 材质与工具
// =====================================================================
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
const mat = {
  frame: M(0x1f8fff, { metalness: 0.55, roughness: 0.28 }),
  frame2: M(0xffffff, { metalness: 0.3, roughness: 0.35 }),
  chrome: M(0xe0e0e0, { metalness: 1, roughness: 0.16 }),
  tire: M(0x161616, { roughness: 0.92 }),
  dark: M(0x262626, { roughness: 0.5 }),
  feather: M(0xfbf9f3, { roughness: 0.85 }),
  featherShade: M(0xdcd8cc, { roughness: 0.9 }),
  wingTip: M(0x2b2b31, { roughness: 0.8 }),
  beak: M(0xf6a93b, { roughness: 0.42 }),
  pouch: M(0xf08a2c, { roughness: 0.5 }),
  leg: M(0xf29b3a, { roughness: 0.6 }),
  eye: M(0x111111, { roughness: 0.1 }),
  helmet: M(0xff3b30, { metalness: 0.2, roughness: 0.25 }),
  helmetStripe: M(0xffffff, { roughness: 0.35 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0x111122, metalness: 0.9, roughness: 0.05, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.6 }),
  scarf: M(0xd8141e, { roughness: 0.75, side: THREE.DoubleSide }),
  lampGlow: new THREE.MeshBasicMaterial({ color: 0xfff1b8 }),
};
const UP = V(0, 1, 0);
function placeRod(mesh, a, b) {
  const d = new THREE.Vector3().subVectors(b, a); const L = d.length() || 1e-4;
  mesh.position.copy(a).addScaledVector(d, 0.5); mesh.scale.set(1, L, 1);
  mesh.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / L));
}
function rod(a, b, r, m, seg = 12, r2 = r) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, 1, seg), m); mesh.castShadow = true; placeRod(mesh, a, b); return mesh;
}
function withProps(o, p) { if (p.position) o.position.copy(p.position); if (p.scale) o.scale.copy(p.scale); return o; }
function shadowAll(o) { o.traverse(c => { if (c.isMesh) { c.castShadow = true; } }); }

// =====================================================================
// 世界布局（车朝 +X 行驶；-Z 是海，+Z 是陆地）
// =====================================================================
const LANES = [-1.15, 0, 1.15];
const beachY = z => lerp(0, -0.7, clamp((-2.6 - z) / 3.6, 0, 1.4));
const world = new THREE.Group(); scene.add(world);

// 路面
const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 3.8), M(0xffffff, { map: roadTex, roughness: 0.92 }));
road.rotation.x = -Math.PI / 2; road.receiveShadow = true; world.add(road);
// 路肩 + 护栏底座
const curb = new THREE.Mesh(new THREE.PlaneGeometry(300, 0.8), M(0xffffff, { map: concreteTex, roughness: 1 }));
curb.rotation.x = -Math.PI / 2; curb.position.set(0, 0.005, -2.2); curb.receiveShadow = true; world.add(curb);
// 沙滩（斜坡伸进海里）
{
  const g = new THREE.PlaneGeometry(300, 6, 1, 12); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i) - 5.6; p.setZ(i, z); p.setY(i, beachY(z) - 0.01); }
  g.computeVertexNormals();
  const sand = new THREE.Mesh(g, M(0xffffff, { map: sandTex, roughness: 1 })); sand.receiveShadow = true; world.add(sand);
  var sandMesh = sand;
}
// 草地 + 远山
const grass = new THREE.Mesh(new THREE.PlaneGeometry(300, 80), M(0xffffff, { map: grassTex, roughness: 1 }));
grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.005, 41.9); grass.receiveShadow = true; world.add(grass);
const rail = new THREE.Mesh(new THREE.BoxGeometry(300, 0.12, 0.04), mat.chrome); rail.position.set(0, 0.55, -2.25); rail.castShadow = true; world.add(rail);
const rail2 = rail.clone(); rail2.position.y = 0.32; world.add(rail2);

// 海面（Gerstner 波浪着色器）
const seaU = {
  uTime: { value: 0 }, uOffset: { value: 0 },
  uDeep: { value: new THREE.Color(0x0b3a5c) }, uShallow: { value: new THREE.Color(0x2c8fa8) },
  uSkyCol: { value: new THREE.Color() }, uSunDir: { value: V() }, uSunCol: { value: new THREE.Color() },
  uMoonDir: { value: V() }, uNight: { value: 0 }, uFogCol: { value: new THREE.Color() }, uFogNear: { value: 30 }, uFogFar: { value: 140 }
};
const seaGeo = new THREE.PlaneGeometry(320, 150, 220, 90); seaGeo.rotateX(-Math.PI / 2);
const sea = new THREE.Mesh(seaGeo, new THREE.ShaderMaterial({
  uniforms: seaU,
  vertexShader: `
    uniform float uTime, uOffset; varying vec3 vW; varying vec3 vN; varying float vCrest;
    vec3 gw(vec2 dir, float st, float wl, vec2 p, inout vec3 T, inout vec3 B){
      float k = 6.2831853/wl; float c = sqrt(9.8/k); vec2 d = normalize(dir);
      float f = k*(dot(d,p) - c*uTime); float a = st/k; float sf = sin(f), cf = cos(f);
      T += vec3(-d.x*d.x*st*sf, d.x*st*cf, -d.x*d.y*st*sf);
      B += vec3(-d.x*d.y*st*sf, d.y*st*cf, -d.y*d.y*st*sf);
      return vec3(d.x*a*cf, a*sf, d.y*a*cf);
    }
    void main(){
      vec3 p = position; vec2 xz = vec2(p.x + mod(uOffset, 2400.0), p.z);
      vec3 T = vec3(1.,0.,0.), B = vec3(0.,0.,1.), D = vec3(0.);
      D += gw(vec2(0.25,1.0), 0.13, 16.0, xz, T, B);
      D += gw(vec2(-0.45,1.0), 0.11, 9.0, xz, T, B);
      D += gw(vec2(0.9,0.7), 0.09, 4.8, xz, T, B);
      D += gw(vec2(-0.1,1.0), 0.07, 2.4, xz, T, B);
      D += gw(vec2(0.6,1.0), 0.05, 1.3, xz, T, B);
      p += D; vec3 n = cross(B, T); vN = n / max(length(n), 1e-4); vCrest = D.y;
      vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w;
    }`,
  fragmentShader: `
    uniform vec3 uDeep,uShallow,uSkyCol,uSunDir,uSunCol,uMoonDir,uFogCol; uniform float uNight,uFogNear,uFogFar;
    varying vec3 vW; varying vec3 vN; varying float vCrest;
    void main(){
      vec3 n = normalize(vN); vec3 v = cameraPosition - vW; float dist = length(v); v /= max(dist,1e-4);
      float fres = 0.02 + 0.98*pow(1.0 - clamp(dot(n,v),0.,1.), 5.0);
      vec3 water = mix(uDeep, uShallow, clamp(vCrest*1.3+0.35, 0., 1.));
      vec3 col = mix(water, uSkyCol*0.75, clamp(fres,0.,1.)*0.6);
      vec3 hs = normalize(normalize(uSunDir)+v); col += uSunCol * pow(max(dot(n,hs),0.),260.) * 4.0 * (1.-uNight);
      vec3 hm = normalize(normalize(uMoonDir)+v); col += vec3(0.75,0.8,1.0) * pow(max(dot(n,hm),0.),180.) * 2.2 * uNight;
      float foam = smoothstep(0.42, 0.62, vCrest);
      col = mix(col, vec3(0.92,0.95,0.97)*(1.0-uNight*0.8), foam*0.45);
      float shore = smoothstep(-8.5, -4.8, vW.z);
      col = mix(col, vec3(0.45,0.75,0.75)*(1.0-uNight*0.85), shore*0.25);
      col = mix(col, uFogCol, smoothstep(uFogNear, uFogFar, dist));
      gl_FragColor = vec4(clamp(col, 0., 8.), 1.);
    }`
}));
sea.position.set(0, -0.38, -4.2 - 75); sea.receiveShadow = false; world.add(sea);

// 岸边碎浪：沿沙滩上下拍打的泡沫带
const breakers = [];
for (let i = 0; i < 4; i++) {
  const tex = foamTex.clone(); tex.needsUpdate = true; tex.repeat.set(10, 1); tex.offset.x = Math.random();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(300, 1.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, color: 0xffffff }));
  m.rotation.x = -Math.PI / 2 + 0.19; world.add(m);
  breakers.push({ m, tex, phase: i / 4, shift: Math.random() });
}

// =====================================================================
// 粒子系统（水花 / 扬尘 / 闪光）
// =====================================================================
class Particles {
  constructor(n, additive) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.life = new Float32Array(n); this.max = new Float32Array(n).fill(1); this.grav = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('palpha', new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uScale: { value: innerHeight / 2 } },
      vertexShader: `attribute vec3 pcolor; attribute float psize; attribute float palpha; uniform float uScale; varying vec3 vC; varying float vA;
        void main(){ vC = pcolor; vA = palpha; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = psize*uScale/max(-mv.z,0.1); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vC, vA*smoothstep(0.5,0.05,d)); }`
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; scene.add(this.points);
  }
  emit(p, v, life, size, color, grav = -9.8) {
    const i = this.i; this.i = (this.i + 1) % this.n;
    this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3);
    this.col.set([color.r, color.g, color.b], i * 3);
    this.life[i] = life; this.max[i] = life; this.size[i] = size; this.grav[i] = grav;
  }
  update(dt, scroll) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt; const k = i * 3;
      this.vel[k + 1] += this.grav[i] * dt;
      this.pos[k] += (this.vel[k] - scroll) * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < 0.01 && this.grav[i] < 0) { this.pos[k + 1] = 0.01; this.vel[k + 1] *= -0.3; this.vel[k] *= 0.7; }
      const t = this.life[i] / this.max[i]; this.alpha[i] = Math.min(1, t * 2) * 0.9;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = g.attributes.palpha.needsUpdate = g.attributes.pcolor.needsUpdate = g.attributes.psize.needsUpdate = true;
  }
}
const fxWater = new Particles(500, false);
const fxSpark = new Particles(300, true);
const fxDust = new Particles(200, false);
const C_WATER = new THREE.Color(0xdff4ff), C_DUST = new THREE.Color(0xb8a78a), C_GOLD = new THREE.Color(0xffd84a), C_SPARK = new THREE.Color(0xfff2b0);

// =====================================================================
// 自行车
// =====================================================================
const rig = new THREE.Group(); scene.add(rig);              // 整体（变道 / 跳跃）
const R = 0.36, REAR = V(-0.56, R), FRONT = V(0.58, R), BB = V(0, 0.3);
const tilt = new THREE.Group(); tilt.position.set(REAR.x, R, 0); rig.add(tilt);   // 抬前轮绕后轴旋转
const inner = new THREE.Group(); inner.position.set(-REAR.x, -R, 0); tilt.add(inner);
const bike = new THREE.Group(); inner.add(bike);
const SEAT = V(-0.2, 0.86), HEAD_T = V(0.44, 0.88), HEAD_B = V(0.48, 0.74);

function makeWheel() {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(R, 0.036, 14, 56), mat.tire); tire.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.036, 0.012, 8, 56), mat.chrome);
  g.add(tire, rim);
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, z = i % 2 ? 0.03 : -0.03; g.add(rod(V(0, 0, z), V(Math.cos(a) * (R - 0.045), Math.sin(a) * (R - 0.045), 0), 0.0028, mat.chrome, 4)); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 16), mat.chrome); hub.rotation.x = Math.PI / 2; g.add(hub);
  const refl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.022, 0.006), new THREE.MeshStandardMaterial({ color: 0xff7a00, emissive: 0xff5500, emissiveIntensity: 0.8 }));
  refl.position.set(0, R * 0.6, 0.032); g.add(refl);
  return g;
}
const wheelR = makeWheel(); wheelR.position.copy(REAR); bike.add(wheelR);
const wheelF = makeWheel(); wheelF.position.copy(FRONT); bike.add(wheelF);
for (const z of [-0.05, 0.05]) {
  bike.add(rod(V(REAR.x, REAR.y, z), V(BB.x, BB.y, z * 0.4), 0.014, mat.frame));
  bike.add(rod(V(REAR.x, REAR.y, z), V(SEAT.x, SEAT.y - 0.06, z * 0.3), 0.012, mat.frame));
  bike.add(rod(V(HEAD_B.x, HEAD_B.y, z * 0.5), V(FRONT.x, FRONT.y, z), 0.014, mat.chrome));
}
bike.add(rod(BB, V(SEAT.x, SEAT.y - 0.05), 0.024, mat.frame));
bike.add(rod(V(SEAT.x + 0.01, SEAT.y - 0.07), HEAD_T, 0.021, mat.frame2));
bike.add(rod(BB, HEAD_B, 0.027, mat.frame));
bike.add(rod(HEAD_B, HEAD_T, 0.03, mat.frame2));
bike.add(rod(V(SEAT.x, SEAT.y - 0.06), V(SEAT.x - 0.015, SEAT.y + 0.04), 0.012, mat.chrome));
const saddle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), mat.dark);
saddle.scale.set(1.3, 0.28, 0.6); saddle.position.set(SEAT.x - 0.02, SEAT.y + 0.06, 0); saddle.castShadow = true; bike.add(saddle);
const STEM = V(HEAD_T.x - 0.01, HEAD_T.y + 0.1);
bike.add(rod(HEAD_T, STEM, 0.015, mat.chrome));
{
  const c = new THREE.CatmullRomCurve3([V(STEM.x - 0.08, STEM.y + 0.02, -0.27), V(STEM.x, STEM.y, -0.2), V(STEM.x + 0.02, STEM.y, 0), V(STEM.x, STEM.y, 0.2), V(STEM.x - 0.08, STEM.y + 0.02, 0.27)]);
  const bar = new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.012, 8), mat.chrome); bar.castShadow = true; bike.add(bar);
  for (const z of [-0.25, 0.25]) bike.add(rod(V(STEM.x - 0.06, STEM.y + 0.015, z), V(STEM.x - 0.1, STEM.y + 0.025, z * 1.12), 0.019, mat.dark));
}
const bellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 8, 0, TAU, 0, Math.PI / 2), mat.chrome);
bellMesh.position.set(STEM.x + 0.01, STEM.y + 0.015, 0.13); bike.add(bellMesh);
const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.06, 16), mat.dark);
lampBody.rotation.z = Math.PI / 2; lampBody.position.set(HEAD_T.x + 0.06, HEAD_T.y - 0.03, 0); bike.add(lampBody);
const lampFace = new THREE.Mesh(new THREE.CircleGeometry(0.036, 16), mat.lampGlow);
lampFace.rotation.y = Math.PI / 2; lampFace.position.set(HEAD_T.x + 0.092, HEAD_T.y - 0.03, 0); bike.add(lampFace);
const lampAnchor = new THREE.Object3D(); lampAnchor.position.copy(lampFace.position); bike.add(lampAnchor);
const lampAim = new THREE.Object3D(); lampAim.position.set(6, -0.9, 0); bike.add(lampAim);
// 车篮（抓到的鱼会出现在里面）
const basket = new THREE.Group();
basket.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.28), new THREE.MeshStandardMaterial({ color: 0xb07a42, roughness: 1 })));
basket.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.242, 0.142, 0.282, 4, 2, 4)), new THREE.LineBasicMaterial({ color: 0x6b4520 })));
basket.position.set(HEAD_T.x + 0.13, HEAD_T.y - 0.08, 0); shadowAll(basket); bike.add(basket);
const basketFish = [];
for (const [c, a0] of [[REAR, Math.PI * 0.1], [FRONT, Math.PI * 0.05]]) {
  const f = new THREE.Mesh(new THREE.TorusGeometry(R + 0.05, 0.022, 6, 32, Math.PI * 0.85), mat.frame2);
  f.position.copy(c); f.rotation.z = a0; f.scale.z = 2.4; bike.add(f);
}
// 牙盘、曲柄、链条
const crank = new THREE.Group(); crank.position.copy(BB); bike.add(crank);
crank.add(withProps(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 32), mat.chrome), { position: V(0, 0, 0.06) }));
crank.add(rod(V(-0.08, 0, 0.06), V(0.08, 0, 0.06), 0.008, mat.chrome));
crank.add(rod(V(0, -0.08, 0.06), V(0, 0.08, 0.06), 0.008, mat.chrome));
const CRANK_L = 0.17;
crank.add(rod(V(0, 0, 0.08), V(CRANK_L, 0, 0.08), 0.012, mat.chrome));
crank.add(rod(V(0, 0, -0.08), V(-CRANK_L, 0, -0.08), 0.012, mat.chrome));
const pedalGeo = new THREE.BoxGeometry(0.09, 0.02, 0.07);
const pedalN = new THREE.Mesh(pedalGeo, mat.dark), pedalF = new THREE.Mesh(pedalGeo, mat.dark); bike.add(pedalN, pedalF);
{
  const cc = new THREE.CatmullRomCurve3([V(0, 0.39, 0.06), V(-0.28, 0.4, 0.06), V(REAR.x, REAR.y + 0.05, 0.06), V(REAR.x - 0.05, REAR.y, 0.06), V(REAR.x, REAR.y - 0.05, 0.06), V(-0.28, 0.28, 0.06), V(0, 0.21, 0.06), V(0.09, 0.3, 0.06)], true);
  bike.add(new THREE.Mesh(new THREE.TubeGeometry(cc, 80, 0.006, 4, true), mat.dark));
}

// =====================================================================
// 鹈鹕
// =====================================================================
const bird = new THREE.Group(); inner.add(bird);
const body = new THREE.Group(); bird.add(body);
const torso = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), mat.feather);
torso.scale.set(1.45, 0.95, 0.95); torso.position.set(-0.1, 1.17, 0); torso.rotation.z = 0.25; body.add(torso);
const belly = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), mat.featherShade);
belly.scale.set(1.3, 0.8, 0.85); belly.position.set(-0.06, 1.06, 0); belly.rotation.z = 0.25; body.add(belly);
const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 12), mat.featherShade);
tail.rotation.z = Math.PI / 2 + 0.35; tail.scale.z = 0.5; tail.position.set(-0.52, 1.02, 0); body.add(tail);

// 脖子（以颈根为轴，可低头叼鱼）
const NECK_BASE = V(0.18, 1.28);
const neckGroup = new THREE.Group(); neckGroup.position.copy(NECK_BASE); body.add(neckGroup);
const neckCurve = new THREE.CatmullRomCurve3([V(0, 0), V(0.12, 0.17), V(0.04, 0.34), V(0.09, 0.52), V(0.18, 0.6)]);
const NECK_TS = 40, NECK_RS = 16;
const neckGeo = new THREE.TubeGeometry(neckCurve, NECK_TS, 0.075, NECK_RS);
{
  const p = neckGeo.attributes.position, tmp = V();
  for (let i = 0; i < p.count; i++) {
    const u = Math.floor(i / (NECK_RS + 1)) / NECK_TS, c = neckCurve.getPoint(u);
    tmp.fromBufferAttribute(p, i).sub(c).multiplyScalar(1.15 - u * 0.45).add(c); p.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  neckGeo.computeVertexNormals();
}
neckGroup.add(new THREE.Mesh(neckGeo, mat.feather));

const head = new THREE.Group(); head.position.set(0.2, 0.62, 0); neckGroup.add(head);
const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), mat.feather); skull.scale.set(1.25, 1, 0.9); head.add(skull);
for (const z of [-0.07, 0.07]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 8), mat.eye); eye.position.set(0.048, 0.022, z * 1.15); head.add(eye);
}
// 头盔
const helmet = new THREE.Group(); head.add(helmet);
{
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.128, 28, 14, 0, TAU, 0, Math.PI * 0.52), mat.helmet);
  shell.scale.set(1.3, 0.95, 1.05); shell.position.set(-0.015, 0.025, 0); helmet.add(shell);
  for (const z of [-0.045, 0, 0.045]) {
    const s = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.009, 6, 24, Math.PI * 0.9), mat.helmetStripe);
    s.scale.set(1.3, 0.96, 1); s.position.set(-0.015, 0.03, z); s.rotation.z = Math.PI * 0.05; helmet.add(s);
  }
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.2), mat.helmet); visor.position.set(0.14, 0.04, 0); visor.rotation.z = -0.25; helmet.add(visor);
  for (const z of [-0.105, 0.105]) helmet.add(rod(V(-0.01, 0.02, z), V(0.03, -0.09, z * 0.82), 0.005, mat.dark, 6));
}
// 墨镜（环绕式，带虹彩镜片）
const glassesParts = [];
{
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.104, 0.05, 32, 1, true, -Math.PI * 0.62, Math.PI * 1.24), mat.lens);
  lens.rotation.y = Math.PI / 2; lens.scale.set(1.12, 1, 0.97); lens.position.set(0.0, 0.022, 0); head.add(lens); glassesParts.push(lens);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.006, 6, 40, Math.PI * 1.24), mat.dark);
  frame.rotation.x = Math.PI / 2; frame.rotation.z = -Math.PI * 0.62 + Math.PI / 2; frame.scale.set(1.12, 0.97, 1); frame.position.set(0, 0.047, 0); head.add(frame); glassesParts.push(frame);
}
// 长嘴 + 喉囊
const BEAK_L = 0.62;
const upperShape = new THREE.Shape();
upperShape.moveTo(0, 0.035); upperShape.quadraticCurveTo(BEAK_L * 0.5, 0.03, BEAK_L, -0.005);
upperShape.lineTo(BEAK_L + 0.03, -0.03); upperShape.lineTo(BEAK_L - 0.02, -0.02);
upperShape.quadraticCurveTo(BEAK_L * 0.5, -0.008, 0, -0.025); upperShape.closePath();
const upperBeak = new THREE.Mesh(new THREE.ExtrudeGeometry(upperShape, { depth: 0.07, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 }), mat.beak);
upperBeak.geometry.translate(0, 0, -0.035); upperBeak.position.set(0.08, -0.01, 0); upperBeak.rotation.z = -0.22; head.add(upperBeak);
upperBeak.add(withProps(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M(0xd8572a)), { position: V(BEAK_L + 0.02, -0.025, 0) }));
const beakTip = new THREE.Object3D(); beakTip.position.set(BEAK_L * 0.6, -0.05, 0); upperBeak.add(beakTip);
const jaw = new THREE.Group(); jaw.position.set(0.08, -0.04, 0); jaw.rotation.z = -0.22; head.add(jaw);
jaw.add(withProps(new THREE.Mesh(new THREE.BoxGeometry(BEAK_L, 0.018, 0.075), mat.beak), { position: V(BEAK_L / 2, 0, 0) }));
const pouch = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2), mat.pouch);
pouch.scale.set(BEAK_L * 0.48, 0.12, 0.05); pouch.position.set(BEAK_L * 0.47, -0.005, 0); jaw.add(pouch);
const camPOV = new THREE.Object3D(); camPOV.position.set(0.12, 0.13, 0); head.add(camPOV);

// 翅膀
function makeWing(side) {
  const pivot = new THREE.Group(); pivot.position.set(0.05, 1.28, 0.2 * side);
  const holder = new THREE.Group(); pivot.add(holder);
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.15, 0.1, 0.35, 0.02, 0.48, -0.16); s.lineTo(0.42, -0.2);
  s.bezierCurveTo(0.25, -0.15, 0.05, -0.2, -0.35, -0.12); s.bezierCurveTo(-0.25, -0.02, -0.1, 0.02, 0, 0);
  const w = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.015, bevelSegments: 2 }), mat.feather);
  w.geometry.translate(0, 0, -0.015); holder.add(w);
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.035), mat.wingTip);
    f.position.set(-0.36 + i * 0.03, -0.12 - i * 0.012, 0); f.rotation.z = 0.15 + i * 0.05; holder.add(f);
  }
  bird.add(pivot); return { pivot, holder, side };
}
const wings = [makeWing(1), makeWing(-1)];

// 腿（两段 IK 跟随踏板）
const HIP = [V(-0.18, 0.98, 0.12), V(-0.18, 0.98, -0.12)];
const THIGH = 0.36, SHIN = 0.36;
function makeLeg() {
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 1, 12), mat.feather);
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 1, 10), mat.leg);
  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat.leg);
  const foot = new THREE.Group();
  for (const a of [-0.45, 0, 0.45]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.022), mat.leg); t.position.set(0.04 * Math.cos(a), 0, 0.04 * Math.sin(a)); t.rotation.y = -a; foot.add(t); }
  const web = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12, -0.6, 1.2), mat.leg); web.rotation.x = -Math.PI / 2; foot.add(web);
  bird.add(thigh, shin, knee, foot); return { thigh, shin, knee, foot };
}
const legs = [makeLeg(), makeLeg()];
function solveLeg(leg, hip, f) {
  const d = new THREE.Vector3().subVectors(f, hip), dist = clamp(d.length(), 0.05, THIGH + SHIN - 0.001);
  const a = Math.atan2(d.y, d.x), b = Math.acos(clamp((THIGH * THIGH + dist * dist - SHIN * SHIN) / (2 * THIGH * dist), -1, 1));
  const k = V(hip.x + THIGH * Math.cos(a + b), hip.y + THIGH * Math.sin(a + b), (hip.z + f.z) / 2);
  placeRod(leg.thigh, hip, k); placeRod(leg.shin, k, f); leg.knee.position.copy(k); leg.foot.position.copy(f).add(V(0, 0.015, 0));
}
shadowAll(rig);

// 围巾结
const knot = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.032, 10, 24), mat.scarf);
knot.position.set(0.085, 0.13, 0);
knot.quaternion.setFromUnitVectors(V(0, 0, 1), V(0.12, 0.17, 0).normalize());
knot.castShadow = true; neckGroup.add(knot);

// =====================================================================
// 布料模拟：红围巾（Verlet 质点 + 距离约束 + 风阻 + 碰撞）
// =====================================================================
const Scarf = (() => {
  const W = 5, L = 18, SEG = 0.055, WIDTH = 0.17;
  const N = W * L;
  const pos = [], prev = [], pinned = [];
  for (let j = 0; j < L; j++) for (let i = 0; i < W; i++) { pos.push(V(-j * SEG, 1.4 - j * 0.01, (i / (W - 1) - 0.5) * WIDTH)); prev.push(pos[pos.length - 1].clone()); pinned.push(j === 0); }
  const cons = [];
  const idx = (i, j) => j * W + i;
  for (let j = 0; j < L; j++) for (let i = 0; i < W; i++) {
    if (i < W - 1) cons.push([idx(i, j), idx(i + 1, j), WIDTH / (W - 1)]);
    if (j < L - 1) cons.push([idx(i, j), idx(i, j + 1), SEG]);
    if (i < W - 1 && j < L - 1) { const dg = Math.hypot(WIDTH / (W - 1), SEG); cons.push([idx(i, j), idx(i + 1, j + 1), dg], [idx(i + 1, j), idx(i, j + 1), dg]); }
    if (j < L - 2) cons.push([idx(i, j), idx(i, j + 2), SEG * 2]); // 抗弯
  }
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(N * 3), uv = new Float32Array(N * 2), index = [];
  for (let j = 0; j < L; j++) for (let i = 0; i < W; i++) { uv.set([i / (W - 1), j / (L - 1)], idx(i, j) * 2); if (i < W - 1 && j < L - 1) index.push(idx(i, j), idx(i + 1, j), idx(i, j + 1), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)); }
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(index);
  const stripeTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#c8101a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2f2'; for (let y = 200; y < 256; y += 18) g.fillRect(0, y, w, 7); for (let x = 2; x < w; x += 8) { g.fillStyle = '#c8101a'; g.fillRect(x, 248, 3, 8); } });
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.8, side: THREE.DoubleSide, emissive: 0x3a0004 }));
  mesh.castShadow = true; mesh.frustumCulled = false; scene.add(mesh);
  const anchors = [], tmp = V(), d = V(), airRel = V(), torsoC = V(), center = V();
  for (let i = 0; i < W; i++) { const o = (i / (W - 1) - 0.5) * WIDTH; anchors.push(V(0.0, 0.14 + o * 0.95, o * 0.3)); }
  let initialized = false;
  function step(dt, speed, t) {
    neckGroup.updateWorldMatrix(true, false);
    torso.getWorldPosition(torsoC);
    if (!initialized) { for (let k = 0; k < N; k++) { const i = k % W, j = Math.floor(k / W); pos[k].copy(neckGroup.localToWorld(anchors[i].clone())).add(V(-j * SEG, 0, 0)); prev[k].copy(pos[k]); } initialized = true; }
    const sub = 3, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (let k = 0; k < N; k++) {
        if (pinned[k]) { prev[k].copy(pos[k]); pos[k].copy(neckGroup.localToWorld(tmp.copy(anchors[k % W]))); continue; }
        const j = Math.floor(k / W);
        d.subVectors(pos[k], prev[k]); prev[k].copy(pos[k]);
        // 相对风速：车向 +X 骑行，空气向 -X 流
        airRel.set(-speed - 1.0 + Math.sin(t * 1.7) * 0.8, Math.sin(t * 11 + j * 0.9) * 1.6 * (j / L) + 2.2, Math.sin(t * 8.3 + j * 0.7) * 2.2 * (j / L) + Math.sin(t * 0.9) * 0.6);
        airRel.sub(tmp.copy(d).multiplyScalar(1 / Math.max(h, 1e-4)));
        const drag = 2.2;
        pos[k].addScaledVector(d, 0.985);
        pos[k].x += airRel.x * drag * h * h; pos[k].y += (airRel.y * drag - 9.8) * h * h; pos[k].z += airRel.z * drag * h * h;
      }
      for (let it = 0; it < 6; it++) {
        for (const [a, b, rest] of cons) {
          d.subVectors(pos[b], pos[a]); const len = d.length() || 1e-6; const diff = (len - rest) / len;
          const wa = pinned[a] ? 0 : 1, wb = pinned[b] ? 0 : 1; if (wa + wb === 0) continue;
          d.multiplyScalar(diff / (wa + wb));
          if (wa) pos[a].add(d); if (wb) pos[b].sub(d);
        }
      }
      for (let k = 0; k < N; k++) {
        if (pinned[k]) continue;
        // 身体（近似椭球）碰撞
        center.copy(pos[k]).sub(torsoC); center.x /= 1.45;
        const r = center.length(), rr = 0.31;
        if (r < rr) { center.multiplyScalar(rr / Math.max(r, 1e-4)); center.x *= 1.45; pos[k].copy(torsoC).add(center); }
        if (pos[k].y < 0.02) pos[k].y = 0.02;
        if (!Number.isFinite(pos[k].x + pos[k].y + pos[k].z)) { initialized = false; return; }
      }
    }
    for (let k = 0; k < N; k++) arr.set([pos[k].x, pos[k].y, pos[k].z], k * 3);
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  }
  return { step, mesh, reset: () => { initialized = false; } };
})();

// =====================================================================
// 场景道具（循环滚动）
// =====================================================================
const scrollers = [];
const SPAN = 120;
function addScroller(obj, x, parallax = 1, span = SPAN) { obj.position.x = x; world.add(obj); scrollers.push({ obj, parallax, span }); return obj; }
// 护栏立柱
const postGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
for (let i = 0; i < 30; i++) { const p = new THREE.Mesh(postGeo, mat.chrome); p.position.set(0, 0.3, -2.25); p.castShadow = true; addScroller(p, -SPAN / 2 + i * 4); }
// 路灯 + 地面光斑
const lampBulbs = [], lampPools = [];
for (let i = 0; i < 6; i++) {
  const g = new THREE.Group();
  g.add(rod(V(0, 0, 0), V(0, 4.2, 0), 0.06, mat.dark, 10, 0.04));
  g.add(rod(V(0, 4.2, 0), V(0, 4.35, -1.4), 0.04, mat.dark));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.2), mat.dark); head.position.set(0, 4.32, -1.5); g.add(head);
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.14), new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffbf50, emissiveIntensity: 0 }));
  bulb.position.set(0, 4.27, -1.5); g.add(bulb); lampBulbs.push(bulb);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc870, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.01, -1.4); g.add(pool); lampPools.push(pool);
  g.position.z = 2.3; shadowAll(g); addScroller(g, -SPAN / 2 + i * SPAN / 6);
}
// 棕榈树
function makePalm() {
  const g = new THREE.Group();
  const tc = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.3, 1.5, 0), V(0.55, 3, 0), V(0.45, 4.3, 0)]);
  const trunkTex = canvasTex(64, 256, (g2, w, h) => { g2.fillStyle = '#8a6a44'; g2.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) { g2.fillStyle = 'rgba(60,40,20,.5)'; g2.fillRect(0, y, w, 3); } }, 1, 3);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(tc, 20, 0.14, 8), M(0xffffff, { map: trunkTex, roughness: 1 })));
  const leafMat = M(0x3f8f3a, { side: THREE.DoubleSide, roughness: 0.8 });
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.9, 0.38, 2.0, -0.45); s.quadraticCurveTo(0.9, -0.05, 0, 0);
    const leaf = new THREE.Mesh(new THREE.ShapeGeometry(s, 6), leafMat);
    const hld = new THREE.Group(); hld.position.set(0.45, 4.3, 0); hld.rotation.y = i / 9 * TAU + rand(-0.2, 0.2); leaf.rotation.x = Math.PI / 2 - rand(0.25, 0.6);
    hld.add(leaf); g.add(hld);
  }
  for (let i = 0; i < 3; i++) g.add(withProps(new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), M(0x5a3b1e)), { position: V(0.45 + Math.cos(i * 2) * 0.12, 4.15, Math.sin(i * 2) * 0.12) }));
  shadowAll(g); return g;
}
for (let i = 0; i < 18; i++) { const p = makePalm(); p.position.z = rand(3.5, 20); p.scale.setScalar(rand(0.8, 1.35)); p.rotation.y = rand(0, TAU); addScroller(p, rand(-SPAN / 2, SPAN / 2)); }
// 沙滩礁石
const rockMat = M(0x77736c, { roughness: 0.95, flatShading: true });
for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.2, 0.7), 0), rockMat); const z = rand(-5.5, -3.0); r.position.set(0, beachY(z) + 0.05, z); r.scale.y = rand(0.5, 0.9); r.rotation.set(rand(0, 3), rand(0, 3), 0); r.castShadow = true; addScroller(r, rand(-SPAN / 2, SPAN / 2)); }
// 远处山丘（陆地侧，视差）
const hillMat = M(0x4a7a45, { roughness: 1 });
for (let i = 0; i < 14; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI / 2), hillMat); h.scale.set(rand(14, 26), rand(6, 14), rand(10, 18)); h.position.set(0, -0.5, rand(45, 85)); addScroller(h, -150 + i * 22, 0.3, 300); }
// 对岸岬角与灯塔
const capeMat = M(0x3b4a5c, { roughness: 1 });
for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 9, 0, TAU, 0, Math.PI / 2), capeMat); h.scale.set(rand(25, 50), rand(8, 22), rand(15, 25)); h.position.set(0, -2, rand(-210, -175)); addScroller(h, -250 + i * 55, 0.06, 500); }
const lighthouse = new THREE.Group();
lighthouse.add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 11, 16), M(0xffffff)));
for (const y of [-2.5, 1.5]) lighthouse.add(withProps(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 1.5, 16), M(0xd83a3a)), { position: V(0, y, 0) }));
const lhLight = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff1b0, emissive: 0xffd060, emissiveIntensity: 0.4 }));
lhLight.position.y = 6.2; lighthouse.add(lhLight);
const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 70, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
beam.geometry.translate(0, -30, 0); beam.rotation.z = Math.PI / 2;
const beamPivot = new THREE.Group(); beamPivot.position.y = 6.2; beamPivot.add(beam); lighthouse.add(beamPivot);
lighthouse.position.set(0, 5.5, -95); addScroller(lighthouse, 40, 0.1, 400);
// 帆船
const boat = new THREE.Group();
boat.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.7), M(0xffffff)));
boat.add(withProps(new THREE.Mesh(new THREE.ConeGeometry(1, 2.6, 3), M(0xff6b6b, { side: THREE.DoubleSide })), { position: V(0, 1.5, 0), scale: V(1, 1, 0.05) }));
boat.position.set(0, -0.2, -38); addScroller(boat, 30, 0.15, 200);
// 云
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false });
for (let i = 0; i < 12; i++) {
  const g = new THREE.Group();
  for (let k = 0; k < 7; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(rand(2, 4), 10, 8), cloudMat); s.position.set(k * 3 - 9, rand(0, 2), rand(-1.5, 1.5)); s.scale.y = 0.55; g.add(s); }
  g.position.set(0, rand(40, 70), rand(-260, -120)); g.scale.setScalar(rand(1, 2)); addScroller(g, -300 + i * 50, 0.05, 600);
}
// 海鸥
const gulls = [];
{
  const gullMat = M(0xf5f5f5, { side: THREE.DoubleSide });
  const wg = new THREE.PlaneGeometry(0.6, 0.14); wg.translate(0.3, 0, 0);
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const L = new THREE.Group(), Rr = new THREE.Group();
    const ml = new THREE.Mesh(wg, gullMat); ml.rotation.x = -Math.PI / 2; L.add(ml);
    const mr = new THREE.Mesh(wg, gullMat); mr.rotation.x = -Math.PI / 2; Rr.add(mr); Rr.rotation.y = Math.PI;
    g.add(L, Rr, withProps(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), gullMat), { scale: V(1, 1, 3) }));
    g.position.set(rand(-40, 40), rand(5, 11), rand(-25, -5)); g.rotation.y = -Math.PI / 2;
    world.add(g); gulls.push({ g, L, Rr, ph: rand(0, TAU), sp: rand(0.7, 1.4) });
  }
}
// 流星
const meteors = [];
function spawnMeteor() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.35, 30, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const start = V(rand(-150, 150), rand(150, 260), rand(-450, -300));
  const dir = V(rand(-1, 1), -0.6, rand(0.1, 0.4)).normalize();
  m.position.copy(start); m.quaternion.setFromUnitVectors(UP, dir.clone().negate());
  scene.add(m); meteors.push({ m, dir, life: 1.2 });
}

// =====================================================================
// 鱼
// =====================================================================
const fishMat = M(0x8fb8d8, { metalness: 0.7, roughness: 0.25 });
const fishBelly = M(0xe8f0f5, { metalness: 0.4, roughness: 0.3 });
const goldMat = M(0xffc730, { metalness: 0.9, roughness: 0.2, emissive: 0x6a4400, emissiveIntensity: 0.6 });
function makeFishMesh(gold, scale = 1) {
  const g = new THREE.Group();
  const m = gold ? goldMat : fishMat;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), m); b.scale.set(1.8, 0.75, 0.5); g.add(b);
  const bl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), gold ? goldMat : fishBelly); bl.scale.set(1.6, 0.5, 0.45); bl.position.y = -0.025; g.add(bl);
  const tailG = new THREE.Group(); tailG.position.x = -0.17; g.add(tailG);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 4), m); t.rotation.z = Math.PI / 2; t.position.x = -0.04; t.scale.z = 0.25; tailG.add(t);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 3), m); fin.position.set(0, 0.07, 0); fin.scale.z = 0.3; g.add(fin);
  for (const z of [-0.04, 0.04]) g.add(withProps(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), mat.eye), { position: V(0.12, 0.02, z) }));
  g.scale.setScalar(scale); shadowAll(g);
  return { g, tailG };
}
const fishes = [];
for (let i = 0; i < 14; i++) {
  const gold = i < 2;
  const f = makeFishMesh(gold, gold ? 1.3 : 1);
  f.gold = gold; f.active = false; f.g.visible = false; scene.add(f.g); fishes.push(f);
}
// 车篮里的战利品鱼
for (let i = 0; i < 6; i++) { const f = makeFishMesh(false, 0.65); f.g.position.set(rand(-0.06, 0.06), 0.06, -0.09 + i * 0.035); f.g.rotation.set(0, rand(-0.6, 0.6), 0.5); f.g.visible = false; basket.add(f.g); basketFish.push(f.g); }

let nextSpawn = 20;
function spawnFish(state) {
  const pool = fishes.filter(f => !f.active);
  if (!pool.length) return;
  const wantGold = Math.random() < 0.07;
  let f = pool.find(p => p.gold === wantGold) || pool[0];
  f.active = true; f.caught = false; f.missed = false; f.g.visible = true; f.t = 0;
  f.lane = Math.floor(Math.random() * 3);
  f.type = Math.random() < 0.38 ? 'leap' : 'road';
  f.x = 42 + rand(0, 6);
  f.z = LANES[f.lane]; f.y = 0.08;
  f.flop = rand(0, TAU);
  f.splashed = false;
  f.ignore = Math.random() < 0.15; // 自动驾驶偶尔会看漏
}
function leapPose(f) {
  // 飞鱼：x 在 12 → 0.8 之间从海里跃出，正好在鹈鹕嘴前达到最高点
  const p = (12 - f.x) / 11.2;
  if (p < 0) return { y: -1.2, z: -7, vis: false, p };
  const pc = Math.min(p, 2.1);
  return { y: -0.35 + 3.25 * Math.sin(pc * Math.PI / 2), z: lerp(-7, LANES[f.lane], smooth(0, 0.55, p)), vis: true, p };
}

// =====================================================================
// 音频：WebAudio 实时合成（音乐节奏跟随踏频）
// =====================================================================
const Audio = (() => {
  let ctx = null, master, musicBus, sfxBus, ambBus, noiseBuf, windG, windF, waveG, muted = false;
  let nextNote = 0, step = 0, bpm = 110, intensity = 0.5, night = 0;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const prog = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]; // Am7 Fmaj7 Cmaj7 G7
  function init() {
    if (ctx) return; ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.42; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 0.6; ambBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n1 = ctx.createBufferSource(); n1.buffer = noiseBuf; n1.loop = true;
    windF = ctx.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 600; windF.Q.value = 0.6;
    windG = ctx.createGain(); windG.gain.value = 0; n1.connect(windF).connect(windG).connect(ambBus);
    const n2 = ctx.createBufferSource(); n2.buffer = noiseBuf; n2.loop = true; n2.playbackRate.value = 0.7;
    const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420;
    waveG = ctx.createGain(); waveG.gain.value = 0; n2.connect(wf).connect(waveG).connect(ambBus);
    n1.start(); n2.start(); nextNote = ctx.currentTime + 0.1;
  }
  function env(g, t, a, peak, dcy, end = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + dcy); }
  function tone(freq, t, dur, type, vol, bus, filt) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    let node = o; if (filt) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filt; o.connect(f); node = f; }
    node.connect(g).connect(bus); env(g, t, 0.008, vol, dur); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noiseHit(t, dur, vol, type, freq, bus = musicBus, q = 1) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); s.connect(f).connect(g).connect(bus); env(g, t, 0.003, vol, dur); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function kick(t, v) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); o.connect(g).connect(musicBus); env(g, t, 0.004, 0.9 * v, 0.26); o.start(t); o.stop(t + 0.35); }
  function schedule() {
    const spb = 60 / bpm / 4; // 16 分音符
    while (nextNote < ctx.currentTime + 0.12) {
      const t = nextNote, s = step % 16, bar = Math.floor(step / 16) % 4, ch = prog[bar];
      const lp = lerp(4200, 1400, night);
      if (s % 4 === 0) kick(t, 0.6 + intensity * 0.4);
      if ((s === 4 || s === 12) && intensity > 0.25) noiseHit(t, 0.16, 0.25 * intensity, 'bandpass', 1800, musicBus, 0.8);
      if (s % 2 === 1) noiseHit(t, 0.05, 0.07 + intensity * 0.08, 'highpass', 8000);
      if (s === 0 || s === 6 || s === 8 || s === 14) tone(midi(ch[0] - 24), t, spb * 2.5, 'sawtooth', 0.22, musicBus, 380);
      if (s === 0) for (const n of ch) { const o = tone(midi(n), t, spb * 15, 'sawtooth', 0.035, musicBus, lp * 0.5); o.detune.value = rand(-9, 9); }
      if (s % 2 === 0) { const n = ch[(s / 2) % 4] + (s >= 8 ? 12 : 0); tone(midi(n), t, spb * 1.6, 'triangle', 0.09 + intensity * 0.05, musicBus, lp); }
      if (night > 0.5 && s % 8 === 3) tone(midi(ch[2] + 24), t, spb * 6, 'sine', 0.035, musicBus);
      nextNote += spb; step++;
    }
  }
  return {
    init, get ready() { return !!ctx; },
    resume() { ctx && ctx.resume(); },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.8; return muted; },
    update(speed, cadence, nightness) {
      if (!ctx) return;
      bpm = clamp(cadence * 1.5, 72, 168); intensity = clamp(speed / 14, 0.15, 1); night = nightness;
      schedule();
      windG.gain.value += (clamp(speed / 16, 0, 1) * 0.16 - windG.gain.value) * 0.05;
      windF.frequency.value = 400 + speed * 60;
      waveG.gain.value = 0.12 * (0.6 + 0.4 * Math.sin(ctx.currentTime * 0.7));
    },
    catchFish(gold) {
      if (!ctx) return; const t = ctx.currentTime;
      noiseHit(t, 0.25, 0.4, 'bandpass', 900, sfxBus, 1.2);
      const base = gold ? [76, 79, 83, 88] : [72, 76, 79];
      base.forEach((n, i) => tone(midi(n), t + i * 0.06, 0.25, 'triangle', 0.22, sfxBus));
      if (gold) base.forEach((n, i) => tone(midi(n + 12), t + 0.3 + i * 0.05, 0.4, 'sine', 0.12, sfxBus));
    },
    jump() { if (!ctx) return; const t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.3); const g = ctx.createGain(); s.connect(f).connect(g).connect(sfxBus); env(g, t, 0.02, 0.35, 0.3); s.start(t); s.stop(t + 0.4); tone(midi(67), t, 0.12, 'square', 0.05, sfxBus, 2000); tone(midi(74), t + 0.07, 0.15, 'square', 0.05, sfxBus, 2000); },
    land() { if (!ctx) return; const t = ctx.currentTime; kick(t, 0.5); noiseHit(t, 0.12, 0.25, 'lowpass', 500, sfxBus); },
    lane() { if (!ctx) return; noiseHit(ctx.currentTime, 0.18, 0.12, 'bandpass', 1500, sfxBus, 3); },
    flap() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 3; i++) noiseHit(t + i * 0.09, 0.07, 0.18, 'lowpass', 900, sfxBus); },
    miss() { if (!ctx) return; const t = ctx.currentTime; tone(midi(64), t, 0.15, 'sine', 0.1, sfxBus); tone(midi(60), t + 0.12, 0.25, 'sine', 0.1, sfxBus); },
    bell() { if (!ctx) return; const t = ctx.currentTime; for (const d of [0, 0.16]) for (const h of [1, 2.76, 5.4]) tone(1300 * h, t + d, 0.8, 'sine', 0.12 / h, sfxBus); },
    achievement() { if (!ctx) return; const t = ctx.currentTime; [72, 76, 79, 84, 88].forEach((n, i) => { tone(midi(n), t + i * 0.08, 0.5, 'triangle', 0.16, sfxBus); tone(midi(n + 12), t + i * 0.08, 0.3, 'sine', 0.06, sfxBus); }); },
    splash() { if (!ctx) return; noiseHit(ctx.currentTime, 0.35, 0.18, 'lowpass', 1400, sfxBus); }
  };
})();

// =====================================================================
// 成就（14 个，本地保存）
// =====================================================================
const ACH = [
  ['first', '初次开荤', '抓到第一条鱼'],
  ['fish10', '小有收获', '累计抓到 10 条鱼'],
  ['fish50', '渔获满仓', '累计抓到 50 条鱼'],
  ['gold', '金色传说', '抓到一条金鱼'],
  ['combo5', '手感来了', '连续抓鱼 5 条'],
  ['combo15', '连击大师', '连续抓鱼 15 条'],
  ['air', '空中接鱼', '跳在空中叼住飞鱼'],
  ['km1', '热身完毕', '骑行 1 公里'],
  ['km5', '长途骑士', '骑行 5 公里'],
  ['speed', '风驰电掣', '时速达到 45 km/h'],
  ['wheelie', '独轮特技', '抬前轮坚持 3 秒'],
  ['night', '星夜骑行', '骑进星空月夜'],
  ['cams', '导演模式', '用过全部 5 种镜头'],
  ['auto', '甩手掌柜', '自动驾驶帮你抓到鱼'],
];
const achDone = new Set(JSON.parse(localStorage.getItem('pelican_ach') || '[]'));
function unlock(id) {
  if (achDone.has(id) || !S.started) return;
  achDone.add(id); localStorage.setItem('pelican_ach', JSON.stringify([...achDone]));
  const a = ACH.find(x => x[0] === id);
  toast(`🏆 解锁成就：${a[1]}`, a[2]); Audio.achievement(); renderAch();
}
function renderAch() {
  $('achCount').textContent = achDone.size;
  $('achList').innerHTML = ACH.map(([id, n, d]) => `<div class="ach ${achDone.has(id) ? 'done' : ''}"><b>${achDone.has(id) ? '🏆' : '🔒'} ${n}</b>${d}</div>`).join('');
}
function toast(title, sub = '') {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ''}`;
  const box = $('toasts'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => el.remove(), 3800);
}
renderAch();

// =====================================================================
// 游戏状态 & 输入
// =====================================================================
const S = {
  speed: 7, target: 7, crank: 0, dist: 0, laneIdx: 1, z: 0, y: 0, vy: 0, grounded: true,
  wheelie: 0, wheelieTime: 0, spread: 0, score: 0, fish: 0, combo: 0, best: +(localStorage.getItem('pelican_best') || 0),
  pouch: 0, dip: 0, idle: 99, auto: true, started: false, camIdx: 0, camsUsed: new Set([0]), dayT: 0.02, time: 0, bellShake: 0,
  totalFish: +(localStorage.getItem('pelican_total') || 0)
};
$('best').textContent = S.best;
const keys = {};
const CAM_NAMES = ['追尾', '侧面', '正面特写', '电影运镜', '鹈鹕视角'];
function setCam(i) { S.camIdx = i; S.camsUsed.add(i); $('camName').textContent = '🎥 ' + CAM_NAMES[i]; cineT = 0; if (S.camsUsed.size >= 5) unlock('cams'); }
function input() { S.idle = 0; if (S.auto) { S.auto = false; $('autoBadge').classList.add('hidden'); } }
function changeLane(d) { const n = clamp(S.laneIdx + d, 0, 2); if (n !== S.laneIdx) { S.laneIdx = n; Audio.lane(); } }
function jump() { if (S.grounded) { S.vy = 6.6; S.grounded = false; Audio.jump(); for (let i = 0; i < 10; i++) fxDust.emit(V(rand(-0.7, 0.7), 0.05, S.z + rand(-0.2, 0.2)), V(rand(-1, 1), rand(0.5, 1.5), rand(-1, 1)), 0.6, 0.06, C_DUST); } }
function keyAction(code, down, fromUser = true) {
  if (fromUser && down) input();
  if (down && keys[code]) return; keys[code] = down;
  if (!down) return;
  if (code === 'KeyA' || code === 'ArrowLeft') changeLane(-1);
  if (code === 'KeyD' || code === 'ArrowRight') changeLane(1);
  if (code === 'Space') jump();
  if (code === 'KeyT') Audio.flap();
  if (code === 'KeyC') setCam((S.camIdx + 1) % 5);
  if (/^Digit[1-5]$/.test(code)) setCam(+code.slice(5) - 1);
  if (code === 'KeyH') $('achPanel').classList.toggle('hidden');
  if (code === 'KeyM') $('btnMute').textContent = Audio.toggleMute() ? '🔇' : '🔊';
  if (code === 'KeyB') { Audio.bell(); S.bellShake = 1; }
}
addEventListener('keydown', e => { if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (!S.started) return; keyAction(e.code === 'ArrowUp' ? 'KeyW' : e.code === 'ArrowDown' ? 'KeyS' : e.code, true); });
addEventListener('keyup', e => keyAction(e.code === 'ArrowUp' ? 'KeyW' : e.code === 'ArrowDown' ? 'KeyS' : e.code, false, false));
document.querySelectorAll('#touch button').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); b.classList.add('down'); keyAction(k, true); };
  const off = e => { e.preventDefault(); b.classList.remove('down'); keyAction(k, false, false); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});
$('btnAch').onclick = () => $('achPanel').classList.toggle('hidden');
$('achClose').onclick = () => $('achPanel').classList.add('hidden');
$('btnCam').onclick = () => { input(); setCam((S.camIdx + 1) % 5); };
$('btnMute').onclick = () => { $('btnMute').textContent = Audio.toggleMute() ? '🔇' : '🔊'; };
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
$('startBtn').onclick = () => {
  Audio.init(); Audio.resume(); S.started = true;
  $('start').classList.add('hidden'); $('hud').classList.remove('hidden');
  if (isTouch) $('touch').classList.remove('hidden');
  S.idle = 0; S.auto = false; $('autoBadge').classList.add('hidden');
};
renderer.domElement.addEventListener('pointerdown', () => { if (S.started) { Audio.bell(); S.bellShake = 1; } });

// 自动驾驶：一段时间不操作就自己追鱼
function autopilot(dt) {
  S.target += (8.5 - S.target) * dt;
  let best = null, bd = 1e9;
  for (const f of fishes) {
    if (!f.active || f.caught || f.ignore || f.x < 0.4 || f.x > 22) continue;
    const score = f.x + (f.gold ? -8 : 0);
    if (score < bd) { bd = score; best = f; }
  }
  if (best) {
    if (best.lane !== S.laneIdx && Math.random() < dt * 3.5) changeLane(Math.sign(best.lane - S.laneIdx));
    if (best.type === 'leap' && best.lane === S.laneIdx) { const tArrive = (best.x - 0.85) / Math.max(S.speed, 0.1); if (tArrive < 0.36 && tArrive > 0.2) jump(); }
  }
  keys.KeyT = S.time % 17 > 15.5;
}

// =====================================================================
// 自适应画质
// =====================================================================
const Q_LEVELS = [
  { name: '省电', pr: 0.7, shadow: false, bloom: false },
  { name: '中', pr: 1.0, shadow: false, bloom: true },
  { name: '高', pr: 1.5, shadow: true, bloom: true },
  { name: '极致', pr: 2.0, shadow: true, bloom: true },
];
let qLevel = devicePixelRatio > 1.5 ? 3 : 2, fpsAcc = 0, fpsFrames = 0, fpsWarm = 3, goodStreak = 0;
function applyQuality() {
  const q = Q_LEVELS[qLevel];
  renderer.setPixelRatio(Math.min(devicePixelRatio, q.pr));
  composer.setPixelRatio(Math.min(devicePixelRatio, q.pr));
  renderer.shadowMap.enabled = q.shadow; key.castShadow = q.shadow;
  scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  bloom.enabled = q.bloom;
  starMat.uniforms.uPR.value = renderer.getPixelRatio();
  for (const fx of [fxWater, fxSpark, fxDust]) fx.mat.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() / 2;
  $('quality').textContent = '画质 ' + q.name;
}
function monitorFPS(dt) {
  if (fpsWarm > 0) { fpsWarm -= dt; return; }
  fpsAcc += dt; fpsFrames++;
  if (fpsAcc >= 2) {
    const fps = fpsFrames / fpsAcc; fpsAcc = 0; fpsFrames = 0;
    if (fps < 40 && qLevel > 0) { qLevel--; applyQuality(); goodStreak = 0; fpsWarm = 1.5; }
    else if (fps > 58) { if (++goodStreak >= 3 && qLevel < 3) { qLevel++; applyQuality(); goodStreak = 0; fpsWarm = 1.5; } }
    else goodStreak = 0;
  }
}
applyQuality();

// =====================================================================
// 昼夜循环：黄昏 → 星空月夜 → 黄昏
// =====================================================================
const DAY_LEN = 200;
const DUSK = { zen: new THREE.Color(0x2b3d8f), hor: new THREE.Color(0xff8a4c), gnd: new THREE.Color(0x6a3550), sun: new THREE.Color(0xffa052), fog: new THREE.Color(0xf09a72), hemiS: new THREE.Color(0xffc8a8), hemiG: new THREE.Color(0x4a3a5a) };
const NIGHT = { zen: new THREE.Color(0x02040f), hor: new THREE.Color(0x14204a), gnd: new THREE.Color(0x050814), sun: new THREE.Color(0x8fa8ff), fog: new THREE.Color(0x0e1838), hemiS: new THREE.Color(0x5a70b0), hemiG: new THREE.Color(0x101830) };
const tmpC = new THREE.Color();
let nightness = 0;
function updateSky(dt) {
  S.dayT = (S.dayT + dt / DAY_LEN) % 1;
  const k = 0.5 - 0.5 * Math.cos(S.dayT * TAU);   // 0 黄昏 → 1 深夜
  nightness = smooth(0.15, 0.85, k);
  const sunElev = lerp(0.07, -0.45, k);
  const sunDir = V(-0.35, sunElev, -1).normalize();
  const moonDir = V(0.5, lerp(-0.1, 0.55, smooth(0.2, 1, k)), -1).normalize();
  skyU.uZenith.value.copy(DUSK.zen).lerp(NIGHT.zen, nightness);
  skyU.uHorizon.value.copy(DUSK.hor).lerp(NIGHT.hor, nightness);
  skyU.uGround.value.copy(DUSK.gnd).lerp(NIGHT.gnd, nightness);
  skyU.uSunDir.value.copy(sunDir); skyU.uMoonDir.value.copy(moonDir);
  skyU.uSunCol.value.copy(DUSK.sun); skyU.uNight.value = nightness;
  scene.fog.color.copy(DUSK.fog).lerp(NIGHT.fog, nightness);
  starMat.uniforms.uOpacity.value = smooth(0.35, 0.9, k);
  // 主光：黄昏用太阳，夜晚用月光
  const lightDir = nightness < 0.5 ? sunDir.clone().setY(Math.max(sunDir.y, 0.12)) : moonDir;
  key.color.copy(DUSK.sun).lerp(NIGHT.sun, nightness);
  key.intensity = lerp(2.6, 0.55, nightness);
  key.position.copy(rig.position).addScaledVector(lightDir.normalize(), 40); key.target.position.copy(rig.position);
  hemi.color.copy(DUSK.hemiS).lerp(NIGHT.hemiS, nightness); hemi.groundColor.copy(DUSK.hemiG).lerp(NIGHT.hemiG, nightness);
  hemi.intensity = lerp(0.95, 0.38, nightness);
  renderer.toneMappingExposure = lerp(1.05, 1.25, nightness);
  // 海面
  seaU.uSkyCol.value.copy(skyU.uHorizon.value).lerp(skyU.uZenith.value, 0.3);
  seaU.uSunDir.value.copy(sunDir); seaU.uSunCol.value.copy(DUSK.sun); seaU.uMoonDir.value.copy(moonDir); seaU.uNight.value = nightness;
  seaU.uFogCol.value.copy(scene.fog.color);
  seaU.uDeep.value.setHex(0x0b3a5c).multiplyScalar(lerp(1, 0.25, nightness));
  seaU.uShallow.value.setHex(0x2c8fa8).multiplyScalar(lerp(1, 0.25, nightness));
  // 夜灯
  const lampOn = smooth(0.25, 0.55, k);
  headLamp.intensity = lampOn * 30; mat.lampGlow.color.setScalar(0.5 + lampOn * 1.5);
  lampBulbs.forEach(b => b.material.emissiveIntensity = lampOn * 6);
  lampPools.forEach(p => p.material.opacity = lampOn * 0.55);
  lhLight.material.emissiveIntensity = 0.4 + lampOn * 6; beam.material.opacity = lampOn * 0.07;
  cloudMat.color.setHex(0xffb08a).lerp(new THREE.Color(0x1c2548), nightness);
  cloudMat.opacity = lerp(0.85, 0.5, nightness);
  // HUD
  const icon = k < 0.2 ? '🌇' : k < 0.55 ? '🌆' : k < 0.85 ? '🌙' : '🌌';
  const txt = k < 0.2 ? '黄昏' : k < 0.55 ? '入夜' : k < 0.85 ? '月夜' : '星空';
  $('todIcon').textContent = icon; $('todText').textContent = txt;
  if (k > 0.85) unlock('night');
  if (k > 0.6 && Math.random() < dt / 5) spawnMeteor();
}

// =====================================================================
// 镜头（追尾 / 侧面 / 正面 / 电影运镜 / 鹈鹕视角）
// =====================================================================
const camPos = camera.position.clone(), camLook = V(0, 1, 0);
let cineT = 0;
const tmpV = V(), tmpV2 = V();
function updateCamera(dt) {
  const r = rig.position;
  let pos, look, smoothK = 3.5, fov = 55;
  switch (S.camIdx) {
    case 0: pos = tmpV.set(r.x - 4.6, r.y * 0.5 + 2.2, r.z * 0.6 + 2.4); look = tmpV2.set(r.x + 2.5, r.y * 0.6 + 0.9, r.z * 0.6); break;
    case 1: pos = tmpV.set(r.x + 0.2, 1.25 + r.y * 0.4, r.z + 4.4); look = tmpV2.set(r.x + 0.2, 0.95 + r.y * 0.6, r.z); fov = 50; break;
    case 2: pos = tmpV.set(r.x + 2.6, r.y + 1.75, r.z + 1.0); look = tmpV2.set(r.x + 0.35, r.y + 1.55, r.z); fov = 45; break;
    case 3: {
      cineT += dt; const shot = Math.floor(cineT / 6.5) % 5, s = (cineT % 6.5) / 6.5; smoothK = 99;
      if (shot === 0) { pos = tmpV.set(r.x + lerp(5, -3, s), 0.28, r.z + 1.5); look = tmpV2.set(r.x, r.y + 0.9, r.z); fov = 40; }
      else if (shot === 1) { const a = 0.4 + s * 2.4; pos = tmpV.set(r.x + Math.cos(a) * 4, r.y + 1.3, r.z + Math.sin(a) * 4); look = tmpV2.set(r.x, r.y + 1.1, r.z); fov = 45; }
      else if (shot === 2) { pos = tmpV.set(r.x - 3 + 5 * s, 1 + 7 * s, r.z + 5 + 3 * s); look = tmpV2.set(r.x + 1, r.y + 0.8, r.z); fov = 50; }
      else if (shot === 3) { pos = tmpV.set(r.x + 1.5 - s, 0.9, r.z - 3.6); look = tmpV2.set(r.x, r.y + 1.2, r.z); fov = 38; }
      else { pos = tmpV.set(r.x + 9 - 7 * s, r.y + 2.6 - s, r.z - 0.6); look = tmpV2.set(r.x + 0.3, r.y + 1.4, r.z); fov = 35; }
      break;
    }
    case 4: {
      camPOV.getWorldPosition(tmpV); pos = tmpV; look = tmpV2.copy(pos).add(V(4, -0.75, 0)); smoothK = 99; fov = 75; break;
    }
  }
  const k = Math.min(1, dt * smoothK);
  camPos.lerp(pos, k); camLook.lerp(look, k);
  camera.position.copy(camPos); camera.lookAt(camLook);
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  // 鹈鹕视角时隐藏头部遮挡
  helmet.visible = S.camIdx !== 4; skull.visible = S.camIdx !== 4; glassesParts.forEach(g => g.visible = S.camIdx !== 4);
}

// =====================================================================
// 得分特效
// =====================================================================
function popup(text, worldPos, gold) {
  const p = worldPos.clone().project(camera);
  if (p.z > 1) return;
  const el = document.createElement('div'); el.className = 'popup' + (gold ? ' gold' : '');
  el.textContent = text; el.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
  $('popups').appendChild(el); setTimeout(() => el.remove(), 1100);
}
function onCatch(f) {
  f.caught = true; f.ct = 0;
  S.combo++; S.fish++; S.totalFish++; localStorage.setItem('pelican_total', S.totalFish);
  const mult = 1 + Math.floor(S.combo / 5);
  const pts = (f.gold ? 5 : 1) * mult;
  S.score += pts; S.pouch = 1;
  if (S.score > S.best) { S.best = S.score; localStorage.setItem('pelican_best', S.best); $('best').textContent = S.best; }
  Audio.catchFish(f.gold);
  const p = V(f.x, f.y, f.z);
  for (let i = 0; i < (f.gold ? 40 : 18); i++) (f.gold ? fxSpark : fxWater).emit(p, V(rand(-2, 2), rand(1, 4), rand(-2, 2)), rand(0.4, 0.9), f.gold ? 0.07 : 0.05, f.gold ? C_GOLD : C_WATER);
  popup(`+${pts}${mult > 1 ? ` ×${mult}` : ''}`, p.clone().add(V(0, 0.4, 0)), f.gold);
  const cb = $('comboBox'); cb.textContent = S.combo >= 2 ? `连击 ×${S.combo}` : ''; cb.classList.add('pop'); setTimeout(() => cb.classList.remove('pop'), 150);
  basketFish.forEach((g, i) => g.visible = i < Math.min(6, Math.ceil(S.fish / 3)));
  unlock('first');
  if (S.totalFish >= 10) unlock('fish10');
  if (S.totalFish >= 50) unlock('fish50');
  if (f.gold) unlock('gold');
  if (S.combo >= 5) unlock('combo5');
  if (S.combo >= 15) unlock('combo15');
  if (f.type === 'leap' && S.y > 0.25) unlock('air');
  if (S.auto && S.started) unlock('auto');
}

// =====================================================================
// 主循环
// =====================================================================
const clock = new THREE.Clock();
const hipW = V(), pedalW = [V(), V()];
function tick() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  update(dt);
  monitorFPS(dt);
  composer.render();
  requestAnimationFrame(tick);
}
function update(dt) {
  S.time += dt;
  S.idle += dt;
  if (!S.auto && S.idle > 7) { S.auto = true; if (S.started) $('autoBadge').classList.remove('hidden'); }
  if (S.auto) autopilot(dt);

  // 速度
  if (!S.auto) { if (keys.KeyW) S.target += 6 * dt; if (keys.KeyS) S.target -= 7 * dt; }
  S.target = clamp(S.target, 2, 16);
  S.speed += (S.target - S.speed) * Math.min(1, dt * 1.6);
  const v = S.speed;
  S.dist += v * dt;
  const GEAR = 2.6;
  const crankRate = v / R / GEAR;
  S.crank += crankRate * dt;
  const cadence = crankRate * 60 / TAU;
  if (v * 3.6 >= 45) unlock('speed');
  if (S.dist >= 1000) unlock('km1');
  if (S.dist >= 5000) unlock('km5');

  // 变道
  const tz = LANES[S.laneIdx], dz = tz - S.z;
  S.z += dz * Math.min(1, dt * 6);
  // 跳跃
  if (!S.grounded) { S.vy -= 18 * dt; S.y += S.vy * dt; if (S.y <= 0) { S.y = 0; S.vy = 0; S.grounded = true; Audio.land(); for (let i = 0; i < 14; i++) fxDust.emit(V(rand(-0.7, 0.7), 0.04, S.z + rand(-0.25, 0.25)), V(rand(-2, 1), rand(0.3, 1.2), rand(-1.2, 1.2)), 0.7, 0.07, C_DUST); } }
  // 展翅抬前轮
  const wantWheelie = !!keys.KeyT;
  S.spread += ((wantWheelie ? 1 : 0) - S.spread) * Math.min(1, dt * 5);
  S.wheelie += ((wantWheelie ? 0.42 + Math.sin(S.time * 3) * 0.04 : 0) - S.wheelie) * Math.min(1, dt * 4);
  if (S.wheelie > 0.3 && S.grounded) { S.wheelieTime += dt; if (S.wheelieTime >= 3) unlock('wheelie'); } else S.wheelieTime = 0;

  rig.position.set(0, S.y, S.z);
  rig.rotation.x = -dz * 0.35;            // 变道侧倾
  tilt.rotation.z = S.wheelie;
  wheelR.rotation.z = wheelF.rotation.z = -S.crank * GEAR;
  crank.rotation.z = -S.crank;

  // 踏板 & 腿
  const a = -S.crank;
  pedalW[0].set(BB.x + CRANK_L * Math.cos(a), BB.y + CRANK_L * Math.sin(a), 0.14);
  pedalW[1].set(BB.x - CRANK_L * Math.cos(a), BB.y - CRANK_L * Math.sin(a), -0.14);
  pedalN.position.copy(pedalW[0]); pedalF.position.copy(pedalW[1]);
  const effort = Math.min(v / 10, 1.5);
  const bob = Math.abs(Math.sin(S.crank)) * 0.016 * effort;
  body.position.y = bob; body.rotation.x = Math.sin(S.crank) * 0.035 * effort;
  bike.rotation.x = Math.sin(S.crank) * 0.02 * effort;
  for (let i = 0; i < 2; i++) solveLeg(legs[i], hipW.set(HIP[i].x, HIP[i].y + bob, HIP[i].z), pedalW[i]);

  // 头颈：节奏点头 + 看到路面鱼时低头叼
  let wantDip = 0;
  for (const f of fishes) if (f.active && !f.caught && f.type === 'road' && f.x > 0 && f.x < 3.2 && Math.abs(f.z - S.z) < 0.6) wantDip = 1;
  S.dip += (wantDip - S.dip) * Math.min(1, dt * 8);
  neckGroup.rotation.z = -S.dip * 0.85 + Math.sin(S.crank * 2) * 0.025;
  head.rotation.z = Math.sin(S.time * 2.2) * 0.05 - S.dip * 0.5;
  S.pouch = Math.max(0, S.pouch - dt * 0.8);
  const gape = Math.max(S.dip, Math.max(0, Math.sin(S.time * 0.6)) ** 10);
  jaw.rotation.z = -0.22 - gape * 0.35;
  pouch.scale.y = 0.12 + S.pouch * 0.12 + gape * 0.04 + Math.sin(S.time * 10) * 0.006 * v / 8;
  pouch.scale.z = 0.05 + S.pouch * 0.05;
  // 翅膀：平时握车把，展翅时张开
  S.bellShake = Math.max(0, S.bellShake - dt * 1.5);
  for (const w of wings) {
    const sp = S.spread;
    w.pivot.rotation.x = w.side * (-0.05 - sp * 1.25 + Math.sin(S.time * 18) * 0.35 * S.bellShake) + Math.sin(S.time * 7) * 0.01 * v / 8;
    w.pivot.rotation.y = w.side * (0.08 - sp * 0.2);
    w.pivot.rotation.z = sp * 0.25 + Math.sin(S.time * 9) * 0.06 * sp;
    w.pivot.position.y = 1.28 + bob;
  }
  bellMesh.rotation.y = S.bellShake * Math.sin(S.time * 60);

  // 世界滚动
  for (const s of scrollers) { s.obj.position.x -= v * dt * s.parallax; if (s.obj.position.x < -s.span / 2) s.obj.position.x += s.span; }
  roadTex.offset.x = (S.dist / ROAD_TILE) % 1;
  sandTex.offset.x = (S.dist / (300 / 40)) % 1;
  grassTex.offset.x = (S.dist / (300 / 40)) % 1;
  concreteTex.offset.x = (S.dist / 2) % 1;
  seaU.uTime.value = S.time; seaU.uOffset.value = S.dist;
  beamPivot.rotation.y = S.time * 0.9;
  // 碎浪
  for (const b of breakers) {
    const ph = (S.time / 5.5 + b.phase) % 1;
    const z = lerp(-5.6, -4.0, smooth(0, 0.55, ph)) - smooth(0.55, 1, ph) * 0.6;
    b.m.position.set(0, beachY(z) + 0.025, z);
    b.m.material.opacity = smooth(0, 0.15, ph) * (1 - smooth(0.45, 1, ph)) * lerp(0.95, 0.35, nightness);
    b.tex.offset.x = (S.dist / 30 + b.shift) % 1;
    if (ph > 0.12 && ph < 0.4 && Math.random() < dt * 25) fxWater.emit(V(rand(-12, 25), beachY(z) + 0.05, z + rand(-0.2, 0.2)), V(rand(-0.5, 0.5), rand(0.8, 2.2), rand(0.2, 1)), rand(0.4, 0.8), 0.05, C_WATER);
  }
  // 海鸥
  for (const g of gulls) {
    const f = Math.sin(S.time * 7 * g.sp + g.ph) * 0.6; g.L.rotation.x = f; g.Rr.rotation.x = -f;
    g.g.position.x += (g.sp * 3 - v * 0.7) * dt; g.g.position.y += Math.sin(S.time + g.ph) * 0.004;
    if (g.g.position.x < -45) g.g.position.x = 45; if (g.g.position.x > 45) g.g.position.x = -45;
  }
  // 流星
  for (let i = meteors.length - 1; i >= 0; i--) { const m = meteors[i]; m.life -= dt; m.m.position.addScaledVector(m.dir, 260 * dt); m.m.material.opacity = Math.max(0, m.life) * 0.8; if (m.life <= 0) { scene.remove(m.m); meteors.splice(i, 1); } }

  // 鱼
  if (S.dist > nextSpawn) { spawnFish(); nextSpawn = S.dist + rand(6, 13) * (1 + v / 20); }
  for (const f of fishes) {
    if (!f.active) continue;
    f.t += dt;
    if (f.caught) {
      // 飞进嘴里 → 喉囊鼓起
      f.ct += dt; beakTip.getWorldPosition(tmpV);
      f.g.position.lerp(tmpV, Math.min(1, dt * 14)); f.g.scale.multiplyScalar(1 - dt * 3);
      if (f.ct > 0.35) { f.active = false; f.g.visible = false; f.g.scale.setScalar(f.gold ? 1.3 : 1); }
      continue;
    }
    f.x -= v * dt;
    if (f.type === 'road') {
      f.y = 0.09 + Math.abs(Math.sin(f.t * 7 + f.flop)) * 0.18;
      f.g.position.set(f.x, f.y, f.z);
      f.g.rotation.set(Math.PI / 2 + Math.sin(f.t * 8) * 0.4, f.flop, Math.sin(f.t * 7) * 0.3); // 侧躺扑腾
    } else {
      const lp = leapPose(f); f.y = lp.y; f.z = lp.z;
      f.g.visible = lp.vis && lp.y > -0.5;
      if (lp.vis && !f.splashed && lp.y > -0.3) { f.splashed = true; Audio.splash(); for (let i = 0; i < 24; i++) fxWater.emit(V(f.x, -0.2, f.z), V(rand(-1.5, 1.5), rand(2, 5), rand(-1.5, 1.5)), rand(0.6, 1.1), 0.07, C_WATER); }
      f.g.position.set(f.x, f.y, f.z);
      const dy = Math.cos(Math.min(lp.p, 2.1) * Math.PI / 2);
      f.g.rotation.set(0, Math.PI, -dy * 0.9);
    }
    f.tailG.rotation.y = Math.sin(f.t * 22) * 0.6;
    if (f.gold && Math.random() < dt * 20) fxSpark.emit(f.g.position, V(rand(-0.3, 0.3), rand(0.2, 0.8), rand(-0.3, 0.3)), 0.6, 0.04, C_SPARK, 0);
    // 抓鱼判定
    const near = f.x > 0.15 && f.x < 1.5 && Math.abs(f.z - S.z) < 0.55;
    if (near) {
      if (f.type === 'road' && S.y < 0.6) onCatch(f);
      else if (f.type === 'leap' && Math.abs(f.y - (1.85 + S.y)) < 0.6) onCatch(f);
    }
    if (!f.caught && !f.missed && f.x < -0.5) {
      f.missed = true;
      if (Math.abs(LANES[f.lane] - S.z) < 0.6 && S.combo > 0) { S.combo = 0; $('comboBox').textContent = ''; Audio.miss(); }
    }
    if (f.x < -14) { f.active = false; f.g.visible = false; }
  }

  // 后轮扬尘
  if (S.grounded && Math.random() < dt * v * 4) fxDust.emit(V(REAR.x - 0.1, 0.03, S.z + rand(-0.05, 0.05)), V(-v * rand(0.05, 0.2), rand(0.2, 0.8), rand(-0.3, 0.3)), rand(0.4, 0.9), 0.05, C_DUST, -1.5);
  fxWater.update(dt, v); fxSpark.update(dt, v); fxDust.update(dt, v);

  // 车灯
  lampAnchor.getWorldPosition(headLamp.position); lampAim.getWorldPosition(headLamp.target.position);

  updateSky(dt);
  rig.updateMatrixWorld(true);
  Scarf.step(dt, v, S.time);
  updateCamera(dt);
  Audio.update(v, cadence, nightness);
  starMat.uniforms.uTime.value = S.time;
  sky.position.copy(camera.position); stars.position.copy(camera.position);

  // HUD
  $('score').textContent = S.score; $('fishCount').textContent = S.fish;
  $('kmh').textContent = (v * 3.6).toFixed(0); $('dist').textContent = (S.dist / 1000).toFixed(2); $('rpm').textContent = cadence.toFixed(0);

}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  for (const fx of [fxWater, fxSpark, fxDust]) fx.mat.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() / 2;
});

// 调试钩子（自动化测试用）
window.__pelican = { S, Scarf, setCam, keyAction, fishes, get nightness() { return nightness; }, setDay: t => { S.dayT = t; }, sim: (sec, step = 1 / 30) => { for (let t = 0; t < sec; t += step) update(step); } };

$('loadMsg').textContent = '';
$('startBtn').disabled = false;
tick();
