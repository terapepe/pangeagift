// GIFT DREAM WORLD — Three.js sky scene: floating islands, clouds, gifts, stairs, portals.
// Camera flies island → island following page scroll. Pure decoration + feedback (no data).
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("dream");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = () => innerWidth < 760 || (innerWidth <= 1024 && innerHeight > innerWidth * 1.1); // phone or portrait tablet
const LOW = innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: "high-performance" });
} catch (e) {
  document.body.classList.add("no-webgl");
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf3d9f2, 60, 260);
const camera = new THREE.PerspectiveCamera(small() ? 62 : 48, innerWidth / innerHeight, 0.1, 900);

const PAL = {
  lavender: 0xc8b6ff, lilac: 0xb39cf5, pink: 0xffb8dc, rose: 0xff9fc9,
  ice: 0xbfeaff, mint: 0xc6f5e4, butter: 0xfff0b3, gold: 0xffd98a, cream: 0xfff6ea,
};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// ---------- sky dome ----------
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(600, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vP; uniform float uTime;
      void main(){
        float h = vP.y;
        vec3 horizon = vec3(1.0,0.93,0.80);
        vec3 pink    = vec3(1.0,0.78,0.89);
        vec3 lav     = vec3(0.79,0.72,1.0);
        vec3 deep    = vec3(0.56,0.50,0.92);
        vec3 ice     = vec3(0.76,0.92,1.0);
        vec3 c = mix(horizon, pink, smoothstep(-0.25, 0.08, h));
        c = mix(c, lav, smoothstep(0.05, 0.38, h));
        c = mix(c, deep, smoothstep(0.38, 0.95, h));
        float band = sin(vP.x*3.0 + vP.z*2.0 + uTime*0.03)*0.5+0.5;
        c = mix(c, ice, 0.18*band*smoothstep(0.0,0.4,h)*(1.0-smoothstep(0.4,0.8,h)));
        float sun = pow(max(dot(vP, normalize(vec3(-0.25,0.12,-1.0))),0.0), 18.0);
        c += vec3(1.0,0.86,0.6)*sun*0.55;
        gl_FragColor = vec4(c,1.0);
      }`,
  })
);
scene.add(sky);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xfff1fb, 0xb7a6ff, 1.25));
const sun = new THREE.DirectionalLight(0xffe2c4, 1.6);
sun.position.set(-40, 80, 30);
scene.add(sun);

// ---------- shared textures ----------
function cloudTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  for (let i = 0; i < 22; i++) {
    const x = rand(60, 196), y = rand(90, 170), r = rand(28, 70);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, "rgba(255,255,255,.95)");
    grd.addColorStop(0.55, "rgba(255,255,255,.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,240,220,.6)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const CLOUD_TEX = [cloudTexture(), cloudTexture(), cloudTexture()];
const GLOW_TEX = glowTexture();

// ---------- gift boxes ----------
const matCache = {};
const giftMat = (hex) =>
  (matCache[hex] ||= new THREE.MeshStandardMaterial({
    color: hex, emissive: hex, emissiveIntensity: 0.32, roughness: 0.25, metalness: 0.15,
    transparent: true, opacity: 0.88,
  }));
const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xfff3d1, emissive: 0xffd98a, emissiveIntensity: 0.25, roughness: 0.3, metalness: 0.6 });
const BOX = new THREE.BoxGeometry(1, 1, 1);
const BOW = new THREE.TorusGeometry(0.22, 0.06, 8, 18);

function makeGift(size, color, glow = true) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(BOX, giftMat(color));
  body.scale.set(size, size * 0.85, size);
  const lid = new THREE.Mesh(BOX, giftMat(color));
  lid.scale.set(size * 1.08, size * 0.18, size * 1.08);
  lid.position.y = size * 0.5;
  const r1 = new THREE.Mesh(BOX, ribbonMat); r1.scale.set(size * 0.16, size * 1.06, size * 1.1);
  const r2 = new THREE.Mesh(BOX, ribbonMat); r2.scale.set(size * 1.1, size * 1.06, size * 0.16);
  r1.position.y = r2.position.y = size * 0.05;
  const b1 = new THREE.Mesh(BOW, ribbonMat), b2 = new THREE.Mesh(BOW, ribbonMat);
  b1.scale.setScalar(size); b2.scale.setScalar(size);
  b1.position.set(-size * 0.2, size * 0.72, 0); b2.position.set(size * 0.2, size * 0.72, 0);
  b1.rotation.set(0, 0, 0.6); b2.rotation.set(0, 0, -0.6);
  g.add(body, lid, r1, r2, b1, b2);
  if (glow) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 }));
    s.scale.setScalar(size * 3.2);
    g.add(s);
  }
  g.userData.lid = lid;
  return g;
}

// ---------- floating islands ----------
function makeIsland(radius, topColor, rockColor) {
  const g = new THREE.Group();
  const rockGeo = new THREE.ConeGeometry(radius, radius * 1.7, 8, 4);
  rockGeo.rotateX(Math.PI);
  const p = rockGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) < radius * 0.8) {
      p.setX(i, p.getX(i) * rand(0.82, 1.15));
      p.setZ(i, p.getZ(i) * rand(0.82, 1.15));
      p.setY(i, p.getY(i) + rand(-0.6, 0.6));
    }
  }
  rockGeo.computeVertexNormals();
  const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.85, flatShading: true }));
  rock.position.y = -radius * 0.85;
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.04, radius * 0.98, 0.9, 8),
    new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.7, flatShading: true })
  );
  g.add(rock, top);
  // small satellite rocks
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.5, 1.3), 0), rock.material);
    const a = rand(0, Math.PI * 2);
    r.position.set(Math.cos(a) * radius * 1.5, rand(-4, -1), Math.sin(a) * radius * 1.5);
    r.userData.bob = rand(0, 6);
    g.add(r);
  }
  return g;
}

function makePortal(r, color) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r, r * 0.09, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: color, emissiveIntensity: 0.9, metalness: 0.5, roughness: 0.25 })
  );
  const swirl = new THREE.Mesh(
    new THREE.CircleGeometry(r * 0.96, 48),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uC: { value: new THREE.Color(color) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime; uniform vec3 uC;
        void main(){ vec2 p=vUv-.5; float r=length(p)*2.; float a=atan(p.y,p.x);
          float s=sin(a*5.+r*10.-uTime*1.6)*.5+.5;
          vec3 c=mix(vec3(1.,.97,1.),uC,s*.7+r*.3);
          gl_FragColor=vec4(c,(1.-smoothstep(.7,1.,r))*.85); }`,
    })
  );
  g.add(ring, swirl);
  g.userData.swirl = swirl.material;
  return g;
}

function makeWheel(r) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const cols = ["#ffd1e8", "#d9ccff", "#c9efff", "#fff1b8", "#ffc4df", "#cbbcff", "#d3f6ea", "#ffe6c7"];
  for (let i = 0; i < 8; i++) {
    x.beginPath(); x.moveTo(256, 256);
    x.arc(256, 256, 250, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
    x.fillStyle = cols[i]; x.fill();
    x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 6; x.stroke();
  }
  x.fillStyle = "#fffaf0"; x.beginPath(); x.arc(256, 256, 40, 0, Math.PI * 2); x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, side: THREE.DoubleSide, roughness: 0.5 }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.06, 10, 64), ribbonMat);
  const disc = new THREE.Group();
  disc.add(face, rim);
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.04, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff6d8 }));
    const a = (i / 16) * Math.PI * 2;
    b.position.set(Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0, 0.1);
    disc.add(b);
  }
  g.add(disc);
  g.userData.disc = disc;
  return g;
}

// ---------- world layout (one island per page section) ----------
const ISLANDS = [
  { p: new THREE.Vector3(0, 0, 0),       r: 9, top: PAL.pink,     rock: PAL.lilac },    // 0 Gate (hero)
  { p: new THREE.Vector3(-30, 12, -55),  r: 8, top: PAL.butter,   rock: PAL.lavender }, // 1 Snapshot / Top 5
  { p: new THREE.Vector3(30, 26, -110),  r: 8, top: PAL.ice,      rock: PAL.lilac },    // 2 Staking
  { p: new THREE.Vector3(-28, 40, -165), r: 8, top: PAL.rose,     rock: PAL.lavender }, // 3 Mystery Box
  { p: new THREE.Vector3(28, 54, -220),  r: 8, top: PAL.mint,     rock: PAL.lilac },    // 4 Lucky Draw
  { p: new THREE.Vector3(0, 70, -280),   r: 10, top: PAL.lavender, rock: PAL.pink },    // 5 Vault / end
];
const islandGroups = ISLANDS.map((d) => {
  const g = makeIsland(d.r, d.top, d.rock);
  g.position.copy(d.p);
  g.userData.base = d.p.y;
  g.userData.phase = rand(0, 6);
  scene.add(g);
  return g;
});
const anim = []; // per-frame callbacks (t, dt)

// 0 · Gate island: portal + staircase into the sky
{
  const isl = islandGroups[0];
  const portal = makePortal(4.2, PAL.lavender);
  portal.position.set(-2, 5.2, -1);
  isl.add(portal);
  anim.push((t) => (portal.userData.swirl.uniforms.uTime.value = t));
  const steps = LOW ? 28 : 46;
  const stair = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.35, 1.2), new THREE.MeshStandardMaterial({ color: 0xfff6ee, emissive: 0xffd6ea, emissiveIntensity: 0.25, roughness: 0.4 }), steps);
  const m = new THREE.Object3D();
  for (let i = 0; i < steps; i++) {
    const a = i * 0.32;
    m.position.set(5 + Math.cos(a) * 5, 0.8 + i * 0.85, -2 + Math.sin(a) * 5 - i * 0.6);
    m.rotation.set(0, -a, 0);
    m.updateMatrix();
    stair.setMatrixAt(i, m.matrix);
  }
  isl.add(stair);
  const g1 = makeGift(2.2, PAL.pink); g1.position.set(4, 1.6, 3); isl.add(g1);
  const g2 = makeGift(1.4, PAL.ice); g2.position.set(-6, 1.2, 3); isl.add(g2);
}
// 1 · Snapshot island: giant gift + orbiting small gifts (Top 5)
{
  const isl = islandGroups[1];
  const big = makeGift(5, PAL.lavender); big.position.y = 3; isl.add(big);
  const orbit = new THREE.Group(); orbit.position.y = 4; isl.add(orbit);
  const cols = [PAL.pink, PAL.ice, PAL.butter, PAL.mint, PAL.rose];
  cols.forEach((c, i) => {
    const s = makeGift(1.1, c);
    const a = (i / 5) * Math.PI * 2;
    s.position.set(Math.cos(a) * 7, Math.sin(i) * 1.2, Math.sin(a) * 7);
    orbit.add(s);
  });
  anim.push((t) => { orbit.rotation.y = t * 0.25; big.rotation.y = Math.sin(t * 0.3) * 0.25; });
}
// 2 · Staking island: crystal vault — crystals rise as the "lock" glows
{
  const isl = islandGroups[2];
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xd8f3ff, emissive: 0x9fdcff, emissiveIntensity: 0.45, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85, flatShading: true });
  const crystals = new THREE.Group(); isl.add(crystals);
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.8, 1.8), 0), crystalMat);
    const a = rand(0, Math.PI * 2), d = rand(1, 6);
    c.scale.y = rand(1.6, 2.6);
    c.position.set(Math.cos(a) * d, 2 + rand(0, 1.5), Math.sin(a) * d);
    c.userData.ph = rand(0, 6);
    crystals.add(c);
  }
  const vault = makeGift(3, PAL.ice); vault.position.set(0, 2.2, 0); isl.add(vault);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.12, 8, 80), new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.7 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 6; isl.add(ring);
  anim.push((t) => {
    crystals.children.forEach((c) => { c.rotation.y = t * 0.4 + c.userData.ph; c.position.y = 2.4 + Math.sin(t + c.userData.ph) * 0.5; });
    ring.rotation.z = t * 0.3; ring.position.y = 6 + Math.sin(t * 0.8) * 0.6;
  });
}
// 3 · Mystery Box island: unknown gifts hovering at different heights
const mysteryBoxes = [];
{
  const isl = islandGroups[3];
  const cols = [PAL.rose, PAL.lavender, PAL.ice, PAL.butter, PAL.pink, PAL.mint, PAL.lilac];
  for (let i = 0; i < (LOW ? 5 : 7); i++) {
    const b = makeGift(rand(1.3, 2.4), cols[i % cols.length]);
    const a = (i / 7) * Math.PI * 2;
    b.position.set(Math.cos(a) * rand(2, 6), rand(2, 7), Math.sin(a) * rand(2, 5));
    b.userData.ph = rand(0, 6); b.userData.y0 = b.position.y; b.userData.pop = 0;
    isl.add(b); mysteryBoxes.push(b);
  }
  anim.push((t, dt) => mysteryBoxes.forEach((b) => {
    b.userData.pop = Math.max(0, b.userData.pop - dt * 0.8);
    const pop = Math.sin(b.userData.pop * Math.PI) * 3;
    b.position.y = b.userData.y0 + Math.sin(t * 0.9 + b.userData.ph) * 0.6 + pop;
    b.rotation.y = t * 0.3 + b.userData.ph;
    b.userData.lid.position.y = b.scale.x * 0.5 + pop * 0.4;
  }));
}
// 4 · Lucky Draw island: wheel floating in the sky
let wheelSpeed = 0.15, wheelBoost = 0;
{
  const isl = islandGroups[4];
  const wheel = makeWheel(6);
  wheel.position.set(0, 10, 0);
  isl.add(wheel);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 4, 8), ribbonMat);
  pillar.position.y = 2; isl.add(pillar);
  anim.push((t, dt) => {
    wheelBoost = Math.max(0, wheelBoost - dt * 1.2);
    wheel.userData.disc.rotation.z -= dt * (wheelSpeed + wheelBoost * wheelBoost * 6);
    wheel.position.y = 10 + Math.sin(t * 0.7) * 0.5;
    wheel.lookAt(camera.position.x, wheel.getWorldPosition(new THREE.Vector3()).y, camera.position.z);
  });
}
// 5 · Vault island: grand portal
{
  const isl = islandGroups[5];
  const portal = makePortal(7, PAL.pink);
  portal.position.set(0, 8, 0);
  isl.add(portal);
  anim.push((t) => { portal.userData.swirl.uniforms.uTime.value = t * 1.2; portal.rotation.y = Math.sin(t * 0.2) * 0.2; });
}

// ---------- free-floating gifts with hanging threads ----------
const floaters = [];
{
  const n = LOW ? 16 : 30;
  const cols = [PAL.pink, PAL.lavender, PAL.ice, PAL.butter, PAL.rose, PAL.mint];
  const threadPts = [];
  for (let i = 0; i < n; i++) {
    const z = rand(-300, 20);
    const side = Math.random() < 0.5 ? -1 : 1;
    const g = makeGift(rand(0.8, 3), pick(cols), Math.random() < 0.7);
    g.position.set(side * rand(14, 70), rand(-6, 90) + (-z) * 0.12, z);
    g.rotation.set(rand(-0.3, 0.3), rand(0, 6), rand(-0.3, 0.3));
    g.userData.ph = rand(0, 6); g.userData.y0 = g.position.y; g.userData.spin = rand(-0.2, 0.2);
    scene.add(g); floaters.push(g);
    if (Math.random() < 0.5) threadPts.push(g.position.x, g.position.y + 1, g.position.z, g.position.x, g.position.y + 60, g.position.z);
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute("position", new THREE.Float32BufferAttribute(threadPts, 3));
  scene.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })));
}

// ---------- clouds (layered sprites = natural parallax) ----------
const clouds = [];
{
  const tints = [0xffffff, 0xfff0f8, 0xf3eeff, 0xeefaff, 0xfffaf0];
  const add = (x, y, z, s, o) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: pick(CLOUD_TEX), color: pick(tints), transparent: true, opacity: o, depthWrite: false, fog: true, toneMapped: false }));
    sp.position.set(x, y, z); sp.scale.set(s, s * 0.6, 1);
    sp.userData.v = rand(0.4, 1.6) * (Math.random() < 0.5 ? -1 : 1);
    scene.add(sp); clouds.push(sp);
  };
  // cloud sea under every island
  ISLANDS.forEach((d) => { for (let i = 0; i < (LOW ? 6 : 10); i++) add(d.p.x + rand(-45, 45), d.p.y - rand(14, 22), d.p.z + rand(-25, 25), rand(26, 55), rand(0.7, 0.95)); });
  // drifting mid-air clouds
  for (let i = 0; i < (LOW ? 22 : 45); i++) {
    const z = rand(-320, 30);
    add((Math.random() < 0.5 ? -1 : 1) * rand(18, 110), rand(-10, 100) + -z * 0.1, z, rand(14, 40), rand(0.45, 0.85));
  }
}

// ---------- sparkles + golden trail ----------
function sparkleMaterial(size) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: size * renderer.getPixelRatio() } },
    vertexShader: `attribute float ph; attribute vec3 col; varying vec3 vC; varying float vA; uniform float uTime; uniform float uSize;
      void main(){ vC=col; vA=0.45+0.55*sin(uTime*2.0+ph); vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_PointSize=uSize*(0.6+vA*0.6)*(60.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 p=gl_PointCoord-.5; float d=length(p);
        float star=max(0.0,1.0-d*2.0); star=pow(star,2.5)+0.6*max(0.0,1.0-abs(p.x)*14.0)*max(0.0,1.0-abs(p.y)*2.2)+0.6*max(0.0,1.0-abs(p.y)*14.0)*max(0.0,1.0-abs(p.x)*2.2);
        gl_FragColor=vec4(vC, star*vA); }`,
  });
}
const sparkleMats = [];
{
  const n = LOW ? 700 : 1600;
  const pos = new Float32Array(n * 3), ph = new Float32Array(n), col = new Float32Array(n * 3);
  const cs = [new THREE.Color(0xffffff), new THREE.Color(PAL.gold), new THREE.Color(PAL.pink), new THREE.Color(PAL.ice)];
  for (let i = 0; i < n; i++) {
    const z = rand(-320, 40);
    pos.set([rand(-120, 120), rand(-20, 120) + -z * 0.08, z], i * 3);
    ph[i] = rand(0, 6.28);
    col.set(pick(cs).toArray(), i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("ph", new THREE.BufferAttribute(ph, 1));
  geo.setAttribute("col", new THREE.BufferAttribute(col, 3));
  const mat = sparkleMaterial(5); sparkleMats.push(mat);
  scene.add(new THREE.Points(geo, mat));

  // golden glitter path linking the islands
  const curve = new THREE.CatmullRomCurve3(ISLANDS.map((d) => d.p.clone().add(new THREE.Vector3(0, 0.6, 0))));
  const m = LOW ? 700 : 1400;
  const tp = new Float32Array(m * 3), tph = new Float32Array(m), tc = new Float32Array(m * 3);
  const gold = new THREE.Color(PAL.gold), white = new THREE.Color(0xffffff);
  for (let i = 0; i < m; i++) {
    const v = curve.getPoint(i / m);
    tp.set([v.x + rand(-1.2, 1.2), v.y + rand(-0.4, 0.6) - Math.sin((i / m) * Math.PI * 5) * 2, v.z + rand(-1.2, 1.2)], i * 3);
    tph[i] = rand(0, 6.28);
    tc.set((Math.random() < 0.75 ? gold : white).toArray(), i * 3);
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute("position", new THREE.BufferAttribute(tp, 3));
  tg.setAttribute("ph", new THREE.BufferAttribute(tph, 1));
  tg.setAttribute("col", new THREE.BufferAttribute(tc, 3));
  const tm = sparkleMaterial(3.2); sparkleMats.push(tm);
  scene.add(new THREE.Points(tg, tm));
}

// ---------- scroll-driven camera flight ----------
const sections = [...document.querySelectorAll("[data-island]")];
let anchors = [];
function measure() {
  const vh = innerHeight;
  anchors = sections.map((s) => ({
    y: s.offsetTop + s.offsetHeight / 2 - vh / 2,
    i: +s.dataset.island,
    side: s.dataset.side || "left",
  }));
}
function waypoint(a) {
  const d = ISLANDS[a.i];
  const mob = small();
  const shift = mob ? 0 : a.side === "right" ? 11 : a.side === "left" ? -11 : 0;
  return {
    pos: d.p.clone().add(new THREE.Vector3(mob ? 0 : -shift * 0.35, mob ? 9 : 8.5, mob ? 40 : 38)),
    look: d.p.clone().add(new THREE.Vector3(shift, mob ? -5 : 2.5, 0)),
  };
}
const camPos = new THREE.Vector3(0, 8, 34), camLook = new THREE.Vector3();
const goalPos = new THREE.Vector3(), goalLook = new THREE.Vector3();
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const ease = (f) => f * f * (3 - 2 * f);
function computeGoal() {
  if (!anchors.length) return;
  const s = scrollY;
  let k = 0;
  while (k < anchors.length - 1 && s >= anchors[k + 1].y) k++;
  const A = waypoint(anchors[k]);
  if (k >= anchors.length - 1 || s <= anchors[0].y) {
    goalPos.copy(A.pos); goalLook.copy(A.look); return;
  }
  const B = waypoint(anchors[k + 1]);
  const f = ease(Math.min(1, Math.max(0, (s - anchors[k].y) / (anchors[k + 1].y - anchors[k].y))));
  goalPos.lerpVectors(A.pos, B.pos, f);
  goalPos.y += Math.sin(f * Math.PI) * 9; // swoop up between islands
  goalPos.x += Math.sin(f * Math.PI) * (anchors[k].side === "left" ? 8 : -8);
  goalLook.lerpVectors(A.look, B.look, f);
}

addEventListener("pointermove", (e) => {
  mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
  mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = small() ? 62 : 48;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  measure();
});
new ResizeObserver(measure).observe(document.body);

// ---------- events from the dApp (visual feedback only) ----------
addEventListener("dream:spin", () => (wheelBoost = 1.6));
addEventListener("dream:box", () => mysteryBoxes.forEach((b, i) => setTimeout(() => (b.userData.pop = 1), i * 90)));

// ---------- loop ----------
const clock = new THREE.Clock();
let running = true, first = true;
document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });
measure();
computeGoal();
camPos.copy(goalPos); camLook.copy(goalLook);

function loop() {
  if (!running) return;
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  computeGoal();
  const k = reduce ? 1 : 1 - Math.pow(0.0025, dt);
  camPos.lerp(goalPos, k);
  camLook.lerp(goalLook, k);
  mouse.x += (mouse.tx - mouse.x) * 0.04;
  mouse.y += (mouse.ty - mouse.y) * 0.04;
  camera.position.set(camPos.x + mouse.x * 2.2, camPos.y - mouse.y * 1.4, camPos.z);
  camera.lookAt(camLook);

  if (!reduce) {
    sky.material.uniforms.uTime.value = t;
    sparkleMats.forEach((m) => (m.uniforms.uTime.value = t));
    islandGroups.forEach((g) => {
      g.position.y = g.userData.base + Math.sin(t * 0.5 + g.userData.phase) * 0.8;
      g.children.forEach((c) => c.userData.bob !== undefined && (c.position.y += Math.sin(t + c.userData.bob) * 0.004));
    });
    floaters.forEach((g) => { g.position.y = g.userData.y0 + Math.sin(t * 0.6 + g.userData.ph) * 1.2; g.rotation.y += g.userData.spin * dt; });
    clouds.forEach((c) => { c.position.x += c.userData.v * dt; if (c.position.x > 160) c.position.x = -160; else if (c.position.x < -160) c.position.x = 160; });
    anim.forEach((f) => f(t, dt));
  }
  renderer.render(scene, camera);
  if (first) { first = false; document.body.classList.add("world-ready"); }
}
loop();
