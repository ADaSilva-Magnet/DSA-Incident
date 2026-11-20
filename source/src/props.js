// 3D props used by the scene: people, phones, the classified terminal, CCTV cameras, a police car and the
// small models at the three arrest locations (shuttle train, ferry, aircraft).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as TX from './textures.js';

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const rbox = (w, h, d, r = 0.03, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, Math.min(w, h, d) / 2 - 1e-4));
export const cyl = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive;
  if (parent) parent.add(m);
  return m;
}
const S = (o) => new THREE.MeshStandardMaterial(o);
export function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// ------------------------------------------------------------------ people
// A simple mannequin, about 0.92 tall at scale 1. Faces +z. Returns handles for walking, climbing and carrying.
export function makeFigure({ body = 0x1f2733, limbs = 0x0d1117, head = null, ring = null, hood = true, glow = 0 } = {}) {
  const g = new THREE.Group();
  const mats = [];
  const M = (o) => { const m = S({ transparent: true, ...o }); mats.push(m); return m; };
  const cloth = M({ color: body, roughness: 0.7, metalness: 0.05, emissive: ring ?? 0x000000, emissiveIntensity: glow });
  const dark = M({ color: limbs, roughness: 0.65 });
  const skin = head ? M({ color: head, roughness: 0.6 }) : cloth;
  const rig = new THREE.Group(); g.add(rig);
  const hip = new THREE.Group(); hip.position.y = 0.37; rig.add(hip);
  const legGeo = new THREE.CapsuleGeometry(0.05, 0.27, 4, 8); legGeo.translate(0, -0.185, 0);
  const legs = [-0.06, 0.06].map((x) => { const l = new THREE.Group(); l.position.x = x; hip.add(l); mesh(legGeo, dark, 0, 0, 0, l); return l; });
  const torso = mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 12), cloth, 0, 0.58, 0, rig); torso.scale.set(1.05, 1, 0.72);
  const armGeo = new THREE.CapsuleGeometry(0.037, 0.25, 4, 8); armGeo.translate(0, -0.155, 0);
  const arms = [-0.145, 0.145].map((x) => { const a = new THREE.Group(); a.position.set(x, 0.72, 0); rig.add(a); mesh(armGeo, cloth, 0, 0, 0, a); return a; });
  mesh(new THREE.SphereGeometry(0.075, 18, 14), skin, 0, 0.855, 0, rig);
  if (hood) {
    const h = mesh(new THREE.SphereGeometry(0.088, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), cloth, 0, 0.865, -0.012, rig);
    h.rotation.x = -0.25;
  }
  let ringMat = null;
  if (ring !== null) {
    ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(ring).multiplyScalar(1.6), transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false });
    const r = mesh(new THREE.RingGeometry(0.15, 0.19, 40), ringMat, 0, 0.012, 0, g, { cast: false, receive: false }); r.rotation.x = -Math.PI / 2;
    mats.push(ringMat);
  }
  return { group: g, rig, hip, legs, arms, mats, ringMat, phase: Math.random() * 6 };
}
// Pose a figure: walk 0..1, climb 0..1, carry 0..1 (arms forward), time in seconds.
export function poseFigure(f, t, { walk = 0, climb = 0, carry = 0, idle = 1 } = {}) {
  const w = Math.sin(t * 7.5 + f.phase);
  f.legs[0].rotation.x = 0.55 * w * walk + 0.5 * Math.sin(t * 6) * climb;
  f.legs[1].rotation.x = -0.55 * w * walk - 0.5 * Math.sin(t * 6) * climb;
  const armSwing = 0.45 * w * walk * (1 - carry);
  f.arms[0].rotation.x = -armSwing - 1.15 * carry - (2.4 + 0.4 * Math.sin(t * 6)) * climb * (1 - carry);
  f.arms[1].rotation.x = armSwing - 1.15 * carry - (2.4 - 0.4 * Math.sin(t * 6)) * climb * (1 - carry);
  f.arms[0].rotation.z = -0.08 - 0.12 * carry; f.arms[1].rotation.z = 0.08 + 0.12 * carry;
  f.rig.position.y = Math.abs(w) * 0.02 * walk + Math.sin(t * 1.7 + f.phase) * 0.004 * idle;
}
export function setOpacity(f, a) {
  for (const m of f.mats) {
    if (m.userData.base === undefined) { m.userData.base = m.opacity; m.userData.dw = m.depthWrite; }
    m.opacity = m.userData.base * a; m.depthWrite = a > 0.98 && m.userData.dw;
  }
  f.group.visible = a > 0.01;
}

// ------------------------------------------------------------------ phones (height 1, front faces +z, back faces -z)
const PHONES = {
  iphone11: { w: 0.502, t: 0.056, r: 0.08, frame: 0xbdb5cf, back: 0xd9d1e8, screen: '#5b3e8f' },
  pixel6: { w: 0.472, t: 0.06, r: 0.065, frame: 0x26302c, back: 0xa8cfbb, back2: 0xd6eadf, screen: '#0f766e' },
  galaxyA51: { w: 0.464, t: 0.05, r: 0.055, frame: 0x2c4697, back: null, screen: '#1d4ed8' },
};
const lensMat = () => S({ color: 0x07090c, roughness: 0.15, metalness: 0.4 });
const ringMetal = () => S({ color: 0x9aa3ae, roughness: 0.3, metalness: 0.9 });
function lens(g, x, y, z, r, mats) {
  const L = mesh(cyl(r, r, 0.018, 28), mats.ring, x, y, z, g, { cast: false }); L.rotation.x = Math.PI / 2;
  const G = mesh(cyl(r * 0.72, r * 0.72, 0.02, 28), mats.glass, x, y, z - 0.002, g, { cast: false }); G.rotation.x = Math.PI / 2;
}
export function makePhone(kind, { screenOn = true } = {}) {
  const D = PHONES[kind];
  const g = new THREE.Group();
  const frame = S({ color: D.frame, roughness: 0.32, metalness: 0.75 });
  const bodyGeo = new THREE.ExtrudeGeometry(rrShape(D.w - 0.016, 1 - 0.016, D.r), { depth: D.t - 0.016, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 10 });
  bodyGeo.translate(0, 0, -(D.t - 0.016) / 2);
  mesh(bodyGeo, frame, 0, 0, 0, g);
  // front display
  const scrTex = screenOn ? TX.lockScreenTexture(D.screen) : null;
  const scrMat = new THREE.MeshBasicMaterial({ color: screenOn ? 0xffffff : 0x05070a, map: scrTex, toneMapped: false });
  if (screenOn) scrMat.color.setScalar(0.92);
  const front = mesh(new THREE.ShapeGeometry(rrShape(D.w - 0.03, 0.97, D.r - 0.012), 8), scrMat, 0, 0, D.t / 2 + 0.0015, g, { cast: false });
  front.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v / 0.97 + 0.5 : v / (D.w - 0.03) + 0.5; });
  const blk = S({ color: 0x020305, roughness: 0.2 });
  if (kind === 'iphone11') mesh(rbox(0.2, 0.034, 0.004, 0.015), blk, 0, 0.47, D.t / 2 + 0.003, g, { cast: false });
  else { const p = mesh(new THREE.CircleGeometry(0.017, 20), blk, 0, 0.455, D.t / 2 + 0.003, g, { cast: false }); }
  // back
  const backZ = -D.t / 2 - 0.0015;
  const mats = { ring: ringMetal(), glass: lensMat() };
  let backMat;
  if (kind === 'galaxyA51') backMat = S({ map: TX.samsungBackTexture(), roughness: 0.22, metalness: 0.3 });
  else backMat = S({ color: D.back, roughness: kind === 'pixel6' ? 0.45 : 0.18, metalness: 0.15 });
  const back = mesh(new THREE.ShapeGeometry(rrShape(D.w - 0.02, 0.98, D.r - 0.008), 8), backMat, 0, 0, backZ, g, { cast: false });
  back.rotation.y = Math.PI;
  back.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v / 0.98 + 0.5 : v / (D.w - 0.02) + 0.5; });
  if (kind === 'iphone11') {
    // square camera bump at the top-left of the back (seen from behind): two lenses, flash
    const bx = D.w / 2 - 0.155, by = 0.5 - 0.155;
    const bump = new THREE.ExtrudeGeometry(rrShape(0.235, 0.235, 0.065), { depth: 0.012, bevelEnabled: false, curveSegments: 8 });
    mesh(bump, S({ color: 0xc9c0dc, roughness: 0.12, metalness: 0.25 }), bx, by, backZ - 0.012, g, { cast: false });
    lens(g, bx + 0.055, by + 0.055, backZ - 0.016, 0.045, mats);
    lens(g, bx + 0.055, by - 0.055, backZ - 0.016, 0.045, mats);
    mesh(new THREE.CircleGeometry(0.018, 16), S({ color: 0xfff3c4, emissive: 0x332a10, roughness: 0.3 }), bx - 0.055, by + 0.055, backZ - 0.0135, g, { cast: false }).rotation.y = Math.PI;
    mesh(new THREE.CircleGeometry(0.05, 24), S({ color: 0xbfb6d3, roughness: 0.25, metalness: 0.6 }), 0, 0.02, backZ - 0.0005, g, { cast: false }).rotation.y = Math.PI;
  } else if (kind === 'pixel6') {
    // full-width camera bar; lighter upper back
    const up = mesh(new THREE.PlaneGeometry(D.w - 0.04, 0.17), S({ color: D.back2, roughness: 0.45 }), 0, 0.395, backZ - 0.0008, g, { cast: false }); up.rotation.y = Math.PI;
    mesh(rbox(D.w + 0.004, 0.115, 0.034, 0.016), S({ color: 0x0a0c0f, roughness: 0.18, metalness: 0.4 }), 0, 0.27, backZ - 0.012, g);
    lens(g, 0.135, 0.27, backZ - 0.03, 0.04, mats);
    lens(g, 0.04, 0.27, backZ - 0.03, 0.034, mats);
    mesh(new THREE.CircleGeometry(0.014, 16), S({ color: 0xfff3c4, roughness: 0.3 }), -0.13, 0.27, backZ - 0.0295, g, { cast: false }).rotation.y = Math.PI;
  } else {
    // rectangular module at the top-left of the back: three lenses stacked, one beside, and a flash
    const mx = D.w / 2 - 0.105, my = 0.5 - 0.2;
    const mod = new THREE.ExtrudeGeometry(rrShape(0.13, 0.29, 0.04), { depth: 0.008, bevelEnabled: false, curveSegments: 6 });
    mesh(mod, S({ color: 0x111827, roughness: 0.2, metalness: 0.3 }), mx, my, backZ - 0.008, g, { cast: false });
    [0.088, 0, -0.088].forEach((dy) => lens(g, mx + 0.024, my + dy, backZ - 0.012, 0.03, mats));
    lens(g, mx - 0.036, my - 0.088, backZ - 0.012, 0.021, mats);
    mesh(new THREE.CircleGeometry(0.012, 16), S({ color: 0xfff3c4, roughness: 0.3 }), mx - 0.036, my + 0.088, backZ - 0.0115, g, { cast: false }).rotation.y = Math.PI;
  }
  return { group: g, screenMat: scrMat };
}

// ------------------------------------------------------------------ the classified computing terminal (faces +z)
export function makeTerminal({ ghost = false } = {}) {
  const g = new THREE.Group();
  const olive = S({ color: 0x404b3d, roughness: 0.55, metalness: 0.35 });
  const label = S({ map: TX.classifiedTexture(), roughness: 0.5, metalness: 0.2 });
  const dark = S({ color: 0x111418, roughness: 0.5, metalness: 0.3 });
  mesh(box(0.54, 0.17, 0.42), [olive, olive, olive, olive, label, olive], 0, 0.085, 0, g);
  mesh(box(0.46, 0.022, 0.14), dark, 0, 0.18, 0.12, g);
  const head = new THREE.Group(); head.position.set(0, 0.17, -0.13); head.rotation.x = -0.2; g.add(head);
  mesh(rbox(0.5, 0.34, 0.07, 0.02), olive, 0, 0.19, 0, head);
  const scr = new THREE.MeshBasicMaterial({ map: TX.terminalScreenTexture(), toneMapped: false }); scr.color.setScalar(0.9);
  mesh(new THREE.PlaneGeometry(0.42, 0.26), scr, 0, 0.2, 0.0365, head, { cast: false });
  [-0.29, 0.29].forEach((x) => mesh(box(0.03, 0.06, 0.24), dark, x, 0.12, 0, g));
  return g;
}
// Outline-only copy (edges) for the "not recovered" ghost.
export function edgesOf(group, color, opacity = 0.9) {
  const out = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.6), transparent: true, opacity, toneMapped: false });
  group.updateMatrixWorld(true);
  group.traverse((o) => {
    if (!o.isMesh) return;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), mat);
    e.applyMatrix4(o.matrixWorld); out.add(e);
  });
  out.userData.mat = mat;
  return out;
}

// ------------------------------------------------------------------ CCTV camera with a view cone (looks along +z of `head`)
export function makeCCTV({ coneLen = 1.6, coneR = 0.55 } = {}) {
  const g = new THREE.Group(), head = new THREE.Group(); g.add(head);
  const shell = S({ color: 0xd9dee6, roughness: 0.45, metalness: 0.2 });
  mesh(box(0.09, 0.08, 0.2), shell, 0, 0, 0.05, head);
  mesh(box(0.11, 0.014, 0.23), shell, 0, 0.047, 0.06, head);
  const L = mesh(cyl(0.028, 0.028, 0.02, 18), S({ color: 0x05070a, roughness: 0.1 }), 0, 0, 0.155, head); L.rotation.x = Math.PI / 2;
  const led = new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false });
  mesh(new THREE.SphereGeometry(0.011, 8, 8), led, 0.03, -0.026, 0.152, head, { cast: false });
  const cg = new THREE.ConeGeometry(coneR, coneLen, 32, 1, true); cg.translate(0, -coneLen / 2, 0); cg.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const cone = mesh(cg, coneMat, 0, 0, 0.16, head, { cast: false, receive: false }); cone.renderOrder = 12;
  return { group: g, head, cone, coneMat, led };
}

// ------------------------------------------------------------------ police car (length along x, ~1.0 at scale 1)
export function makePoliceCar() {
  const g = new THREE.Group();
  const liv = S({ map: TX.battenburgTexture(), roughness: 0.45, metalness: 0.3, color: 0xd5dbe2 });
  const white = S({ color: 0xc9d0d9, roughness: 0.45, metalness: 0.3 });
  const glass = S({ color: 0x0b1220, roughness: 0.1, metalness: 0.6 });
  mesh(rbox(1.0, 0.2, 0.46, 0.06), [white, white, white, white, liv, liv], 0, 0.17, 0, g);
  mesh(rbox(0.54, 0.17, 0.42, 0.06), glass, -0.06, 0.34, 0, g);
  mesh(box(0.5, 0.02, 0.4), white, -0.06, 0.43, 0, g);
  const blue = [0, 1].map(() => new THREE.MeshBasicMaterial({ color: 0x3aa0ff, toneMapped: false }));
  mesh(box(0.1, 0.045, 0.15), blue[0], -0.06, 0.46, -0.08, g, { cast: false });
  mesh(box(0.1, 0.045, 0.15), blue[1], -0.06, 0.46, 0.08, g, { cast: false });
  const tyre = S({ color: 0x0a0a0a, roughness: 0.9 });
  [[-0.32, -0.21], [-0.32, 0.21], [0.32, -0.21], [0.32, 0.21]].forEach(([x, z]) => { const w = mesh(cyl(0.085, 0.085, 0.06, 18), tyre, x, 0.085, z, g); w.rotation.x = Math.PI / 2; });
  return { group: g, lights: blue };
}

// ------------------------------------------------------------------ laptop (opened, faces +z)
export function makeLaptop() {
  const g = new THREE.Group();
  const alu = S({ color: 0x5b6472, roughness: 0.35, metalness: 0.8 });
  mesh(box(0.34, 0.016, 0.24), alu, 0, 0.008, 0, g);
  mesh(box(0.3, 0.003, 0.12), S({ color: 0x1b2029, roughness: 0.6 }), 0, 0.017, -0.03, g, { cast: false });
  const lid = new THREE.Group(); lid.position.set(0, 0.016, -0.12); lid.rotation.x = -0.32; g.add(lid);
  mesh(box(0.34, 0.23, 0.01), alu, 0, 0.115, 0, lid);
  const scr = new THREE.MeshBasicMaterial({ map: TX.terminalScreenTexture(), toneMapped: false }); scr.color.setScalar(0.75);
  mesh(new THREE.PlaneGeometry(0.3, 0.19), scr, 0, 0.118, 0.0055, lid, { cast: false });
  return g;
}

// ------------------------------------------------------------------ arrest-location models (fit a 2.2-wide round plinth)
export function makeShuttleScene() {
  const g = new THREE.Group();
  const conc = S({ map: TX.concreteTexture(), roughness: 0.85 });
  const rail = S({ color: 0x9aa3ae, roughness: 0.3, metalness: 0.9 });
  const sleeper = S({ color: 0x3b3128, roughness: 0.9 });
  for (let i = 0; i < 14; i++) mesh(box(0.05, 0.02, 0.3), sleeper, -1.0 + i * 0.15, 0.01, -0.42, g);
  [-0.52, -0.32].forEach((z) => mesh(box(2.0, 0.02, 0.02), rail, 0, 0.03, z, g));
  // tunnel portal (arch) and hillside
  const sh = new THREE.Shape(); sh.moveTo(-0.38, 0); sh.lineTo(0.38, 0); sh.lineTo(0.38, 0.62); sh.lineTo(-0.38, 0.62); sh.lineTo(-0.38, 0);
  const hole = new THREE.Path(); hole.moveTo(-0.22, 0); hole.lineTo(0.22, 0); hole.lineTo(0.22, 0.3); hole.absarc(0, 0.3, 0.22, 0, Math.PI, false); hole.lineTo(-0.22, 0);
  sh.holes.push(hole);
  const portal = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false, curveSegments: 16 }), conc, -0.86, 0, -0.42, g);
  portal.rotation.y = Math.PI / 2;
  const hill = mesh(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), S({ color: 0x2f4a2c, roughness: 0.95 }), -1.0, 0, -0.42, g);
  hill.scale.set(0.42, 0.9, 1.0);
  // shuttle train: locomotive and two carriages, the first one disappearing into the portal
  const body = S({ map: TX.windowStripTexture('#c4cbd4', '#334155', 3, { stripe: '#0ea5e9' }), roughness: 0.55, metalness: 0.25 });
  const white = S({ color: 0xbcc4ce, roughness: 0.55, metalness: 0.25 });
  const dark = S({ color: 0x1f2937, roughness: 0.6 });
  [-0.78, -0.12].forEach((x) => { mesh(rbox(0.62, 0.3, 0.24, 0.05), [white, white, white, white, body, body], x, 0.2, -0.42, g); mesh(box(0.5, 0.05, 0.18), dark, x, 0.045, -0.42, g); });
  mesh(rbox(0.5, 0.3, 0.24, 0.05), [white, white, white, white, body, body], 0.46, 0.2, -0.42, g);
  mesh(box(0.4, 0.05, 0.18), dark, 0.46, 0.045, -0.42, g);
  const nose = mesh(rbox(0.16, 0.22, 0.24, 0.05), white, 0.76, 0.16, -0.42, g);
  mesh(box(0.02, 0.09, 0.2), S({ color: 0x0b1220, roughness: 0.1, metalness: 0.6 }), 0.71, 0.29, -0.42, g).rotation.z = -0.6;
  // check-in booth and barrier on the road lane
  const booth = S({ map: TX.windowStripTexture('#1e3a5f', '#7dd3fc', 2), roughness: 0.4, metalness: 0.4 });
  const boothW = S({ color: 0x3b4a5e, roughness: 0.5, metalness: 0.3 });
  mesh(box(0.34, 0.36, 0.3), [boothW, boothW, boothW, boothW, booth, boothW], 0.78, 0.18, 0.0, g);
  mesh(box(0.42, 0.04, 0.38), S({ color: 0x1e3a5f, roughness: 0.5 }), 0.78, 0.38, 0.0, g);
  mesh(box(0.05, 0.16, 0.05), S({ color: 0x111827, roughness: 0.5 }), 0.55, 0.08, 0.18, g);
  const arm = mesh(box(0.05, 0.03, 0.7), S({ color: 0xdc2626, roughness: 0.5 }), 0.55, 0.16, 0.52, g);
  mesh(box(0.052, 0.032, 0.1), S({ color: 0xf8fafc, roughness: 0.5 }), 0.55, 0.16, 0.42, g);
  mesh(box(0.052, 0.032, 0.1), S({ color: 0xf8fafc, roughness: 0.5 }), 0.55, 0.16, 0.66, g);
  return g;
}
export function makeFerryScene() {
  const g = new THREE.Group();
  const conc = S({ map: TX.concreteTexture(), roughness: 0.85 });
  // quay along the front, with bollards
  mesh(box(1.6, 0.12, 0.55), conc, 0, 0.06, 0.475, g);
  const bol = S({ color: 0x1f2937, roughness: 0.5, metalness: 0.5 });
  [-0.7, -0.1, 0.4].forEach((x) => mesh(cyl(0.03, 0.035, 0.07, 12), bol, x, 0.155, 0.24, g));
  // ferry: dark hull, white upper hull and decks, funnel
  const hs = new THREE.Shape(); hs.moveTo(-0.9, -0.24); hs.lineTo(0.55, -0.24); hs.quadraticCurveTo(0.95, -0.12, 1.0, 0); hs.quadraticCurveTo(0.95, 0.12, 0.55, 0.24); hs.lineTo(-0.9, 0.24); hs.lineTo(-0.9, -0.24);
  const hull = new THREE.ExtrudeGeometry(hs, { depth: 0.16, bevelEnabled: false, curveSegments: 10 }); hull.rotateX(-Math.PI / 2);
  const ship = new THREE.Group(); ship.position.set(-0.02, 0, -0.42); g.add(ship);
  mesh(hull, S({ color: 0x1e3a8a, roughness: 0.5, metalness: 0.3 }), 0, -0.02, 0, ship);
  const hull2 = new THREE.ExtrudeGeometry(hs, { depth: 0.07, bevelEnabled: false, curveSegments: 10 }); hull2.rotateX(-Math.PI / 2);
  mesh(hull2, S({ color: 0xaeb7c3, roughness: 0.7 }), 0, 0.14, 0, ship);
  const deck = S({ map: TX.windowStripTexture('#aeb7c3', '#1e293b', 9), roughness: 0.7 });
  const wht = S({ color: 0xaeb7c3, roughness: 0.7 });
  mesh(box(1.05, 0.14, 0.4), [wht, wht, wht, wht, deck, deck], -0.15, 0.28, 0, ship);
  mesh(box(0.6, 0.12, 0.32), [wht, wht, wht, wht, deck, deck], -0.05, 0.41, 0, ship);
  mesh(box(0.1, 0.06, 0.34), S({ color: 0x0b1220, roughness: 0.1, metalness: 0.5 }), 0.26, 0.41, 0, ship);
  mesh(cyl(0.06, 0.07, 0.2, 18), S({ color: 0xc9d0d9, roughness: 0.6 }), -0.42, 0.45, 0, ship);
  mesh(cyl(0.062, 0.062, 0.05, 18), S({ color: 0xb91c1c, roughness: 0.4 }), -0.42, 0.53, 0, ship);
  g.userData.ship = ship;
  // gantry crane at the end of the quay
  const yel = S({ color: 0xeab308, roughness: 0.5, metalness: 0.4 });
  [[0.55, 0.3], [0.75, 0.3], [0.55, 0.62], [0.75, 0.62]].forEach(([x, z]) => mesh(box(0.035, 0.62, 0.035), yel, x, 0.43, z, g));
  mesh(box(0.28, 0.05, 0.9), yel, 0.65, 0.76, 0.16, g);
  return g;
}
export function makeAirportScene() {
  const g = new THREE.Group();
  const glass = S({ map: TX.windowStripTexture('#1e3a5f', '#7dd3fc', 10), roughness: 0.15, metalness: 0.6 });
  const wall = S({ color: 0x8f9bab, roughness: 0.65, metalness: 0.2 });
  mesh(box(1.5, 0.32, 0.36), [wall, wall, wall, wall, glass, wall], 0.05, 0.16, -0.62, g);
  mesh(box(1.6, 0.03, 0.44), S({ color: 0x64748b, roughness: 0.5 }), 0.05, 0.335, -0.62, g);
  // control tower
  const tw = S({ color: 0xa9b3c0, roughness: 0.6 });
  mesh(cyl(0.06, 0.08, 0.8, 16), tw, 0.82, 0.4, -0.35, g);
  mesh(cyl(0.15, 0.11, 0.14, 16), S({ color: 0x0f2f4f, roughness: 0.1, metalness: 0.7 }), 0.82, 0.87, -0.35, g);
  mesh(cyl(0.17, 0.17, 0.03, 16), tw, 0.82, 0.955, -0.35, g);
  const beacon = new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false });
  mesh(new THREE.SphereGeometry(0.02, 8, 8), beacon, 0.82, 0.985, -0.35, g, { cast: false });
  // aircraft
  const plane = new THREE.Group(); plane.position.set(-0.3, 0.2, -0.05); plane.rotation.y = 0.35; g.add(plane);
  const white = S({ color: 0xc4ccd6, roughness: 0.5, metalness: 0.25 });
  const livery = S({ map: TX.windowStripTexture('#c4ccd6', '#1e293b', 14, { stripe: '#1d4ed8' }), roughness: 0.5, metalness: 0.25 });
  const fus = mesh(new THREE.CapsuleGeometry(0.075, 0.95, 6, 16), livery, 0, 0, 0, plane); fus.rotation.z = Math.PI / 2;
  const ws = new THREE.Shape(); ws.moveTo(0.12, 0); ws.lineTo(-0.12, 0.62); ws.lineTo(-0.24, 0.62); ws.lineTo(-0.1, 0); ws.lineTo(-0.24, -0.62); ws.lineTo(-0.12, -0.62); ws.lineTo(0.12, 0);
  const wing = new THREE.ExtrudeGeometry(ws, { depth: 0.018, bevelEnabled: false }); wing.rotateX(Math.PI / 2);
  mesh(wing, white, 0.02, -0.035, 0, plane);
  const ts = new THREE.Shape(); ts.moveTo(-0.5, 0); ts.lineTo(-0.36, 0); ts.lineTo(-0.52, 0.28); ts.lineTo(-0.6, 0.28); ts.lineTo(-0.5, 0);
  const fin = new THREE.ExtrudeGeometry(ts, { depth: 0.014, bevelEnabled: false }); fin.translate(0, 0.04, -0.007);
  mesh(fin, S({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.25 }), 0, 0, 0, plane);
  const hs = new THREE.Shape(); hs.moveTo(-0.42, 0); hs.lineTo(-0.52, 0.22); hs.lineTo(-0.58, 0.22); hs.lineTo(-0.54, 0); hs.lineTo(-0.58, -0.22); hs.lineTo(-0.52, -0.22); hs.lineTo(-0.42, 0);
  const st = new THREE.ExtrudeGeometry(hs, { depth: 0.012, bevelEnabled: false }); st.rotateX(Math.PI / 2);
  mesh(st, white, 0, 0.03, 0, plane);
  const eng = S({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 });
  [-0.3, 0.3].forEach((z) => { const e = mesh(cyl(0.035, 0.035, 0.14, 14), eng, 0.04, -0.075, z, plane); e.rotation.z = Math.PI / 2; });
  const gear = S({ color: 0x111827, roughness: 0.6 });
  [[0.32, 0], [-0.04, 0.09], [-0.04, -0.09]].forEach(([x, z]) => mesh(box(0.02, 0.12, 0.02), gear, x, -0.13, z, plane));
  return { group: g, beacon };
}
