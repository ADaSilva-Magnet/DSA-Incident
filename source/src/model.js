// The briefing table: a cut-away model of the facility (left), a map of Great Britain with the three arrest
// locations (right), the evidence tray (front), the case board display (back) and the open questions (centre).
// Units: the table top is y = 0. The facility model uses its own coordinates (see sync.js).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { COLORS, POS, V } from './palette.js';
import { GB, ISLANDS, PLACES, proj } from './ukmap.js';
import { facility, GL, FL, DOOR_X, PLINTH, SUSPECTS, sm, k01 } from './sync.js';
import { box, rbox, cyl, mesh, makeFigure, poseFigure, setOpacity, makePhone, makeTerminal, edgesOf, makeCCTV, makePoliceCar,
  makeLaptop, makeShuttleScene, makeFerryScene, makeAirportScene } from './props.js';
import { clamp, lerp, smooth } from './util.js';
import { drawCctvWall } from './screens.js';

export { COLORS };
const S = (o) => new THREE.MeshStandardMaterial(o);

// ------------------------------------------------------------------ helpers
function makeBrackets(size, color) {
  const sx0 = size.x + 0.12, sy0 = size.y + 0.12, sz0 = size.z + 0.12;
  const L = Math.min(sx0, sy0, sz0) * 0.3 + 0.08, t = 0.022;
  const geos = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * sx0 / 2, cy = sy * sy0 / 2, cz = sz * sz0 / 2;
    const gx = new THREE.BoxGeometry(L, t, t); gx.translate(cx - sx * L / 2, cy, cz); geos.push(gx);
    const gy = new THREE.BoxGeometry(t, L, t); gy.translate(cx, cy - sy * L / 2, cz); geos.push(gy);
    const gz = new THREE.BoxGeometry(t, t, L); gz.translate(cx, cy, cz - sz * L / 2); geos.push(gz);
  }
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.7), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const m = new THREE.Mesh(mergeGeometries(geos), mat);
  m.renderOrder = 20; m.visible = false; m.castShadow = false;
  return m;
}
function addFocus(W, key, parent, b3, color) {
  const size = new THREE.Vector3(), center = new THREE.Vector3();
  b3.getSize(size); b3.getCenter(center);
  const br = makeBrackets(size, color);
  br.position.copy(center); parent.add(br);
  W.focus[key] = { mesh: br, a: 0 };
}
// Box from min/max corners with UVs projected per face (so textures keep one scale across pieces).
function slab(x0, y0, z0, x1, y1, z1, scale = 1) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const [u, v] = ax > 0.5 ? [p.getZ(i), p.getY(i)] : ay > 0.5 ? [p.getX(i), -p.getZ(i)] : [p.getX(i), p.getY(i)];
    uv.setXY(i, u * scale, v * scale);
  }
  return g;
}
const merged = (list) => mergeGeometries(list.map((g) => g.index ? g.toNonIndexed() : g));
const wp = (o, v = V(0, 0, 0)) => o.localToWorld(v.clone());
function spriteOf(tex, size, parent, x, y, z) {
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); s.position.set(x, y, z); s.renderOrder = 25; parent.add(s);
  return s;
}

// ------------------------------------------------------------------ build
export function buildScene(scene) {
  const W = { scene, parts: {}, focus: {}, anchors: {}, curves: {}, lights: {} };
  buildTable(W);
  buildBoard(W);
  buildFacility(W);
  buildMap(W);
  buildTray(W);
  buildGhost(W);
  scene.updateMatrixWorld(true);
  buildCurves(W);
  W.update = (A, time, dt, story) => update(W, A, time, dt, story);
  return W;
}

function buildTable(W) {
  const desk = TX.deskTexture(); desk.repeat.set(3, 1.5);
  mesh(rbox(25.6, 0.32, 12.6, 0.06), S({ map: desk, roughness: 0.7, metalness: 0.05 }), 0, -0.16, 0, W.scene, { cast: false });
}

function buildBoard(W) {
  const g = new THREE.Group(); g.position.copy(POS.board); W.scene.add(g);
  const body = S({ color: 0x15191f, roughness: 0.45, metalness: 0.55 });
  const Y = 5.5;
  mesh(cyl(0.16, 0.16, 9.0, 20), body, 0, -0.9, -0.45, g);
  mesh(rbox(3.4, 0.12, 1.6, 0.05), body, 0, -5.4, -0.45, g);
  mesh(rbox(10.78, 6.22, 0.2, 0.06), body, 0, Y, -0.12, g);
  mesh(rbox(4.0, 2.4, 0.3, 0.08), body, 0, Y - 0.1, -0.32, g);
  const scrMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); scrMat.color.setScalar(0.8);
  const scr = mesh(new THREE.PlaneGeometry(10.4, 5.85), scrMat, 0, Y, -0.015, g, { cast: false, receive: false });
  mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: 0x7ee0ff, toneMapped: false }), 5.15, Y - 3.02, -0.012, g, { cast: false });
  W.parts.board = g; W.parts.screen = scr; W.parts.screenMat = scrMat; W.screenHalf = [5.2, 2.925];
  W.anchors.board = () => wp(g, V(-4.6, Y + 2.8, 0));
  W.anchors.boardMid = () => wp(g, V(0, Y, 0.1));
  addFocus(W, 'board', g, new THREE.Box3(V(-5.4, Y - 3.1, -0.25), V(5.4, Y + 3.1, 0.05)), COLORS.display);
}

// ------------------------------------------------------------------ the facility
function buildFacility(W) {
  const F = new THREE.Group(); F.position.copy(POS.fac); W.scene.add(F); W.parts.fac = F;
  const soilTex = TX.soilTexture(); soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  const soil = S({ map: soilTex, roughness: 0.95, metalness: 0 });
  const concTex = TX.concreteTexture(); concTex.repeat.set(1, 1);
  const conc = S({ map: concTex, roughness: 0.85, metalness: 0.05 });
  const tileTex = TX.tileTexture(); tileTex.repeat.set(1, 1);
  const tile = S({ map: tileTex, roughness: 0.6, metalness: 0.1 });
  const CR = GL - 0.3; // underside of the top crust
  // earth: front block around the rooms (rooms open to the front), back block, top crust with the hatch opening
  mesh(merged([
    slab(-4.2, 0, 1.4, 4.2, FL, 3.0, 0.5),           // under the rooms
    slab(-4.2, FL, 1.4, -3.52, CR, 3.0, 0.5),         // left of the shaft
    slab(-2.7, 1.35, 1.4, 1.2, CR, 3.0, 0.5),         // above the corridor
    slab(1.2, 1.7, 1.4, 3.97, CR, 3.0, 0.5),          // above the vault
    slab(3.97, FL, 1.4, 4.2, CR, 3.0, 0.5),           // right of the vault
    slab(-4.2, 0, -3.0, 4.2, CR, 1.4, 0.5),           // back block
    slab(-4.2, CR, -3.0, 4.2, GL, 2.05, 0.5),         // crust behind the hatch
    slab(-4.2, CR, 2.05, -3.52, GL, 2.85, 0.5), slab(-2.7, CR, 2.05, 4.2, GL, 2.85, 0.5),
    slab(-4.2, CR, 2.85, 4.2, GL, 3.0, 0.5),
  ]), soil, 0, 0, 0, F);
  // room liners: floors, ceilings, back and end walls
  mesh(merged([slab(-3.52, FL, 1.4, 3.97, FL + 0.02, 2.99, 1.2)]), tile, 0, 0, 0, F);
  mesh(merged([
    slab(-2.7, 1.33, 1.4, 1.2, 1.35, 2.99), slab(1.2, 1.68, 1.4, 3.97, 1.7, 2.99),
    slab(-3.52, FL, 1.4, 3.97, 1.7, 1.43), slab(-3.52, 1.35, 1.4, -2.7, CR, 1.43),
    slab(-3.54, FL, 1.4, -3.52, CR, 2.99), slab(3.97, FL, 1.4, 3.99, 1.7, 2.99), slab(-2.72, 1.35, 1.4, -2.7, CR, 2.99),
  ]), conc, 0, 0, 0, F);
  // cut-face outline (architectural section line)
  const cut = new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.site).multiplyScalar(1.2), transparent: true, opacity: 0.55, toneMapped: false });
  const outline = [[-3.52, FL], [3.97, FL], [3.97, 1.7], [1.2, 1.7], [1.2, 1.35], [-2.7, 1.35], [-2.7, CR], [-3.52, CR], [-3.52, FL]];
  F.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline.map(([x, y]) => V(x, y, 3.003))), cut));
  F.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([[-4.2, 0], [4.2, 0], [4.2, GL], [-4.2, GL], [-4.2, 0]].map(([x, y]) => V(x, y, 3.003))), cut));

  // yard surface with the opening for the hatch
  const yardShape = new THREE.Shape(); yardShape.moveTo(-4.2, -3.0); yardShape.lineTo(4.2, -3.0); yardShape.lineTo(4.2, 3.0); yardShape.lineTo(-4.2, 3.0); yardShape.lineTo(-4.2, -3.0);
  const hh = new THREE.Path(); hh.moveTo(-3.52, 2.05); hh.lineTo(-2.7, 2.05); hh.lineTo(-2.7, 2.85); hh.lineTo(-3.52, 2.85); hh.lineTo(-3.52, 2.05); yardShape.holes.push(hh);
  const yg = new THREE.ShapeGeometry(yardShape, 4); yg.rotateX(Math.PI / 2);
  const yuv = yg.attributes.uv, ypos = yg.attributes.position;
  for (let i = 0; i < ypos.count; i++) yuv.setXY(i, (ypos.getX(i) + 4.2) / 8.4, (3.0 - ypos.getZ(i)) / 6.0);
  const BLD = { x0: -0.8, x1: 3.9, z0: -2.7, z1: 0.9 };
  const yard = mesh(yg, S({ map: TX.yardTexture(8.4, 6.0, { x: -3.11, z: 2.45 }, BLD), roughness: 0.92, side: THREE.DoubleSide }), 0, GL + 0.003, 0, F, { cast: false });
  yard.geometry.attributes.normal.array.fill(0); for (let i = 1; i < yard.geometry.attributes.normal.array.length; i += 3) yard.geometry.attributes.normal.array[i] = 1;

  buildShaft(W, F, conc);
  buildCorridor(W, F, conc);
  buildVault(W, F, conc);
  buildBuilding(W, F, tile, BLD);
  buildGrounds(W, F, BLD);

  W.anchors.facility = () => wp(F, V(-2.6, GL + 1.5, -1.6));
  W.anchors.hatch = () => wp(F, V(-3.1, GL + 0.05, 2.45));
  W.anchors.shaft = () => wp(F, V(-3.1, 1.2, 2.9));
  W.anchors.corridor = () => wp(F, V(-1.0, 0.9, 2.95));
  W.anchors.vault = () => wp(F, V(2.6, 1.4, 2.95));
  W.anchors.underground = () => wp(F, V(0.2, 0.6, 3.0));
  W.anchors.building = () => wp(F, V(1.6, GL + 1.3, -0.9));
  W.anchors.sign = () => wp(F, V(3.3, GL + 0.5, 2.55));
  addFocus(W, 'facility', F, new THREE.Box3(V(-4.25, 0, -3.05), V(4.25, GL + 1.35, 3.05)), COLORS.site);
  addFocus(W, 'hatch', F, new THREE.Box3(V(-3.55, GL - 0.05, 2.0), V(-2.65, GL + 0.15, 2.9)), COLORS.site);
  addFocus(W, 'vault', F, new THREE.Box3(V(1.2, FL, 1.42), V(3.97, 1.7, 3.0)), COLORS.classified);
  addFocus(W, 'corridor', F, new THREE.Box3(V(-3.5, FL, 1.42), V(1.2, 1.35, 3.0)), COLORS.site);
}

function buildShaft(W, F, conc) {
  const steel = S({ color: 0x8a939f, roughness: 0.4, metalness: 0.8 });
  const rungs = [];
  for (let y = FL + 0.12; y < GL - 0.05; y += 0.14) { const r = cyl(0.012, 0.012, 0.3, 8); r.rotateZ(Math.PI / 2); r.translate(-3.1, y, 1.5); rungs.push(r); }
  [-3.25, -2.95].forEach((x) => { const s = cyl(0.016, 0.016, GL - FL, 8); s.translate(x, (GL + FL) / 2, 1.5); rungs.push(s); });
  mesh(merged(rungs), steel, 0, 0, 0, F);
  // hatch frame and hinged lid (hinge along the back edge)
  const frame = S({ color: 0x4a3c30, roughness: 0.6, metalness: 0.6 });
  mesh(merged([slab(-3.58, GL, 1.99, -2.64, GL + 0.05, 2.05), slab(-3.58, GL, 2.85, -2.64, GL + 0.05, 2.91), slab(-3.58, GL, 2.05, -3.52, GL + 0.05, 2.85), slab(-2.7, GL, 2.05, -2.64, GL + 0.05, 2.85)]), frame, 0, 0, 0, F);
  const pivot = new THREE.Group(); pivot.position.set(-3.11, GL + 0.05, 2.03); F.add(pivot);
  const lidMat = S({ map: TX.hatchLidTexture(), roughness: 0.75, metalness: 0.45 });
  mesh(box(0.84, 0.045, 0.84), [frame, frame, lidMat, frame, frame, frame], 0, 0.0225, 0.42, pivot);
  mesh(box(0.2, 0.03, 0.05), frame, 0, 0.06, 0.74, pivot);
  W.parts.hatch = pivot;
  // long grass around the hatch (it's disused)
  const grass = [];
  const rnd = (() => { let s = 77; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < 60; i++) {
    const a = rnd() * Math.PI * 2, d = 0.48 + rnd() * 0.5, x = -3.11 + Math.cos(a) * d, z = 2.45 + Math.sin(a) * d * 0.8;
    if (z > 2.95 || x < -4.15) continue;
    const c = new THREE.ConeGeometry(0.03, 0.12 + rnd() * 0.12, 4); c.translate(x, GL + 0.08, z); grass.push(c);
  }
  mesh(merged(grass), S({ color: 0x4d6b2e, roughness: 0.9 }), 0, 0, 0, F, { cast: false });
}

function buildCorridor(W, F, conc) {
  // two security doors (shutters that rise into the ceiling) with access panels on the front post
  W.parts.doors = [];
  const post = S({ color: 0x2d333c, roughness: 0.5, metalness: 0.6 });
  const shTex = TX.shutterTexture(); shTex.wrapS = THREE.RepeatWrapping;
  DOOR_X.forEach((x, i) => {
    mesh(merged([slab(x - 0.06, FL, 1.43, x + 0.06, 1.33, 1.5), slab(x - 0.06, FL, 2.92, x + 0.06, 1.33, 2.99), slab(x - 0.06, 1.25, 1.43, x + 0.06, 1.33, 2.99)]), post, 0, 0, 0, F);
    const shutter = new THREE.Group(); shutter.position.set(x, FL, 0); F.add(shutter);
    const sm = S({ map: shTex, roughness: 0.55, metalness: 0.55, transparent: true });
    mesh(box(0.05, 0.94, 1.42), sm, 0, 0.47, 2.21, shutter);
    const led = new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false });
    mesh(box(0.05, 0.16, 0.012), S({ color: 0x0f141b, roughness: 0.4 }), x + 0.075, 0.82, 2.985, F, { cast: false });
    mesh(box(0.03, 0.03, 0.006), led, x + 0.075, 0.87, 2.993, F, { cast: false });
    W.parts.doors.push({ shutter, led, mat: sm });
    W.anchors['door' + (i + 1)] = () => wp(F, V(x, 1.05, 2.98));
  });
  // ceiling light strips
  const strip = new THREE.MeshBasicMaterial({ color: 0xcfe3ff, toneMapped: false });
  [-2.2, -0.75, 0.7].forEach((x) => mesh(box(0.5, 0.015, 0.06), strip, x, 1.32, 2.2, F, { cast: false }));
  W.parts.corrStrip = strip;
  const L = new THREE.PointLight(0xbcd6ff, 1.8, 4.5, 1.6); L.position.set(-1.0, 1.15, 2.4); F.add(L); W.lights.corr = L;
}

function buildVault(W, F, conc) {
  // wall with a round doorway between the corridor and the vault (in the z-y plane)
  const sh = new THREE.Shape(); sh.moveTo(1.43, FL); sh.lineTo(2.99, FL); sh.lineTo(2.99, 1.7); sh.lineTo(1.43, 1.7); sh.lineTo(1.43, FL);
  const hole = new THREE.Path(); hole.absarc(2.2, 0.78, 0.46, 0, Math.PI * 2, true); sh.holes.push(hole);
  const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false, curveSegments: 40 });
  wg.rotateY(-Math.PI / 2); wg.translate(1.29, 0, 0);
  const steelDark = S({ color: 0x59616c, roughness: 0.45, metalness: 0.7 });
  mesh(wg, [conc, steelDark], 0, 0, 0, F);
  const ringG = new THREE.TorusGeometry(0.47, 0.035, 10, 48); ringG.rotateY(Math.PI / 2);
  mesh(ringG, steelDark, 1.1, 0.78, 2.2, F);
  // round vault door, hinged on the front side of the doorway, swinging out into the corridor
  const hinge = new THREE.Group(); hinge.position.set(1.08, 0.78, 1.72); F.add(hinge);
  const dm = S({ color: 0x9aa3ae, roughness: 0.28, metalness: 0.92 });
  const door = new THREE.Group(); door.position.set(0, 0, 0.48); hinge.add(door);
  const dg = cyl(0.45, 0.45, 0.12, 48); dg.rotateZ(Math.PI / 2);
  mesh(dg, dm, -0.04, 0, 0, door);
  const wheel = new THREE.TorusGeometry(0.15, 0.016, 8, 32); wheel.rotateY(Math.PI / 2);
  mesh(wheel, steelDark, -0.13, 0, 0, door);
  for (let i = 0; i < 3; i++) { const sp = box(0.012, 0.3, 0.018); sp.rotateX((i * Math.PI) / 3); mesh(sp, steelDark, -0.13, 0, 0, door); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const b = cyl(0.022, 0.022, 0.03, 10); b.rotateZ(Math.PI / 2); mesh(b, steelDark, -0.11, Math.cos(a) * 0.36, Math.sin(a) * 0.36, door); }
  W.parts.vaultHinge = hinge;
  // plinth and the classified terminal; archive cabinets
  const plinthMat = S({ color: 0x2b313a, roughness: 0.5, metalness: 0.4 });
  mesh(box(0.56, 0.32, 0.5), plinthMat, PLINTH.x, FL + 0.16, PLINTH.z, F);
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.classified).multiplyScalar(1.5), transparent: true, opacity: 0.8, toneMapped: false });
  mesh(box(0.6, 0.012, 0.54), glow, PLINTH.x, FL + 0.326, PLINTH.z, F, { cast: false });
  W.parts.plinthGlow = glow;
  const term = makeTerminal(); term.position.set(PLINTH.x, PLINTH.top, PLINTH.z); F.add(term);
  term.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  W.parts.terminal = term;
  // "missing" outline left on the plinth once the terminal is gone
  const miss = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.evidence).multiplyScalar(1.6), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const ml = new THREE.Mesh(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.56, 0.5, 0.46)), new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.evidence).multiplyScalar(1.6), transparent: true, opacity: 0, toneMapped: false }));
  ml.position.set(PLINTH.x, PLINTH.top + 0.25, PLINTH.z); F.add(ml);
  W.parts.missingBox = ml; W.parts.missMat = miss;
  W.parts.missingTag = spriteOf(TX.iconTexture('missing'), 0.7, F, PLINTH.x, PLINTH.top + 0.75, PLINTH.z + 0.2);
  const cab = S({ map: TX.archiveBoxTexture(), roughness: 0.7 });
  const cabBody = S({ color: 0x3a414c, roughness: 0.5, metalness: 0.5 });
  [1.75, 2.35, 3.0, 3.6].forEach((x) => mesh(box(0.5, 1.0, 0.28), [cabBody, cabBody, cabBody, cabBody, cab, cabBody], x, FL + 0.5, 1.6, F));
  const vl = new THREE.PointLight(0xffe2b0, 1.6, 4, 1.6); vl.position.set(2.6, 1.5, 2.4); F.add(vl); W.lights.vault = vl;
  const red = new THREE.MeshBasicMaterial({ color: 0xff3b3b, toneMapped: false });
  mesh(new THREE.SphereGeometry(0.035, 12, 8), red, 3.85, 1.55, 2.95, F, { cast: false });
  W.anchors.terminal = () => W.parts.terminal.visible ? W.parts.terminal.localToWorld(V(0, 0.45, 0)) : wp(F, V(PLINTH.x, PLINTH.top + 0.5, PLINTH.z));
  W.anchors.plinth = () => wp(F, V(PLINTH.x, PLINTH.top + 0.05, PLINTH.z + 0.25));
  W.anchors.vaultDoor = () => wp(F, V(1.1, 1.25, 2.6));
  addFocus(W, 'terminal', F, new THREE.Box3(V(PLINTH.x - 0.3, FL, PLINTH.z - 0.3), V(PLINTH.x + 0.3, PLINTH.top + 0.58, PLINTH.z + 0.3)), COLORS.classified);
}

function buildBuilding(W, F, tile, B) {
  const H = 1.25, wall = S({ color: 0x8e99a8, roughness: 0.8, metalness: 0.05 });
  const g = new THREE.Group(); F.add(g); W.parts.building = g;
  mesh(merged([slab(B.x0, GL, B.z0, B.x1, GL + 0.04, B.z1)]), tile, 0, 0, 0, g);
  mesh(merged([
    slab(B.x0, GL, B.z0, B.x1, GL + H, B.z0 + 0.08), slab(B.x0, GL, B.z0, B.x0 + 0.08, GL + H, B.z1), slab(B.x1 - 0.08, GL, B.z0, B.x1, GL + H, B.z1),
    slab(1.15, GL, B.z0, 1.21, GL + H, -0.05), slab(1.15, GL, 0.55, 1.21, GL + H, B.z1),
    slab(B.x0, GL, B.z1 - 0.06, B.x1, GL + 0.22, B.z1),
  ]), wall, 0, 0, 0, g);
  // glazed front with mullions
  const glass = new THREE.MeshStandardMaterial({ color: 0x9cc8ff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false });
  mesh(box(B.x1 - B.x0 - 0.16, H - 0.22, 0.02), glass, (B.x0 + B.x1) / 2, GL + 0.22 + (H - 0.22) / 2, B.z1 - 0.03, g, { cast: false }).renderOrder = 6;
  const mull = [];
  for (let x = B.x0 + 0.5; x < B.x1 - 0.2; x += 0.62) mull.push(slab(x - 0.02, GL + 0.22, B.z1 - 0.05, x + 0.02, GL + H, B.z1 - 0.01));
  mull.push(slab(B.x0, GL + H - 0.05, B.z1 - 0.06, B.x1, GL + H, B.z1));
  mesh(merged(mull), S({ color: 0x3a4250, roughness: 0.4, metalness: 0.6 }), 0, 0, 0, g);
  // roof (fades away for interior views)
  const roofMat = S({ color: 0x4a525e, roughness: 0.8, metalness: 0.2, transparent: true });
  const roof = mesh(box(B.x1 - B.x0 + 0.1, 0.07, B.z1 - B.z0 + 0.1), roofMat, (B.x0 + B.x1) / 2, GL + H + 0.035, (B.z0 + B.z1) / 2, g);
  [[-0.2, -2.0], [2.6, -1.6]].forEach(([x, z]) => mesh(box(0.5, 0.18, 0.4), roofMat, x, GL + H + 0.16, z, roof.parent).userData.roof = true);
  W.parts.roof = roof; W.parts.roofMat = roofMat; W.parts.roofExtras = g.children.filter((c) => c.userData.roof);
  // security control room: desk, chair, monitor wall, CCTV recorder (NVR)
  const dark = S({ color: 0x1b222c, roughness: 0.5, metalness: 0.4 });
  mesh(box(1.25, 0.05, 0.42), S({ color: 0x8b6b4a, roughness: 0.6 }), 0.2, GL + 0.38, -1.2, g);
  mesh(box(1.2, 0.34, 0.04), dark, 0.2, GL + 0.21, -1.0, g);
  [-0.15, 0.55].forEach((x) => { mesh(box(0.3, 0.2, 0.02), dark, x, GL + 0.55, -1.32, g); mesh(box(0.04, 0.12, 0.04), dark, x, GL + 0.44, -1.32, g); });
  mesh(box(0.28, 0.05, 0.28), dark, 0.2, GL + 0.24, -0.7, g); mesh(box(0.28, 0.3, 0.04), dark, 0.2, GL + 0.4, -0.56, g);
  const wallCv = document.createElement('canvas'); wallCv.width = 768; wallCv.height = 384;
  const wallTex = new THREE.CanvasTexture(wallCv); wallTex.colorSpace = THREE.SRGBColorSpace;
  const wm = new THREE.MeshBasicMaterial({ map: wallTex, toneMapped: false }); wm.color.setScalar(0.9);
  mesh(box(1.62, 0.84, 0.05), dark, 0.22, GL + 0.82, B.z0 + 0.105, g);
  mesh(new THREE.PlaneGeometry(1.56, 0.78), wm, 0.22, GL + 0.82, B.z0 + 0.132, g, { cast: false });
  W.parts.cctvWall = { cv: wallCv, ctx: wallCv.getContext('2d'), tex: wallTex, last: -1 };
  mesh(box(0.26, 0.72, 0.34), dark, -0.5, GL + 0.36, B.z0 + 0.3, g);
  const nvrLeds = new THREE.MeshBasicMaterial({ color: 0x34d399, toneMapped: false });
  for (let i = 0; i < 4; i++) mesh(box(0.2, 0.012, 0.006), nvrLeds, -0.5, GL + 0.2 + i * 0.14, B.z0 + 0.473, g, { cast: false });
  W.parts.nvrLeds = nvrLeds;
  const cl = new THREE.PointLight(0x9fd0ff, 0.9, 3, 1.6); cl.position.set(0.2, GL + 1.0, -1.3); F.add(cl); W.lights.control = cl;
  // archive hall: shelving with archive boxes
  const shelf = S({ color: 0x59616c, roughness: 0.5, metalness: 0.6 });
  const boxes = S({ map: TX.archiveBoxTexture(), roughness: 0.75 });
  [1.75, 2.55, 3.35].forEach((x) => {
    mesh(box(0.34, 0.95, 2.6), [boxes, boxes, shelf, shelf, shelf, shelf], x, GL + 0.5, -1.15, g);
  });
  W.anchors.cctvRoom = () => wp(F, V(0.2, GL + 1.25, -2.2));
  W.anchors.nvr = () => wp(F, V(-0.5, GL + 0.75, B.z0 + 0.3));
  W.anchors.monitorWall = () => wp(F, V(0.9, GL + 1.25, B.z0 + 0.14));
  W.anchors.archive = () => wp(F, V(3.0, GL + 1.05, -0.2));
  addFocus(W, 'control', F, new THREE.Box3(V(B.x0, GL, B.z0), V(1.2, GL + H, B.z1)), COLORS.cctv);
}

function buildGrounds(W, F, B) {
  const metal = S({ color: 0x7d8794, roughness: 0.4, metalness: 0.8 });
  // perimeter fence on three sides (the front is the cut-away edge), with a gate gap on the right
  const posts = [], rails = [];
  const run = (ax, az, bx, bz, gap) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 0.5);
    for (let i = 0; i <= n; i++) {
      const x = lerp(ax, bx, i / n), z = lerp(az, bz, i / n);
      if (gap && z > gap[0] && z < gap[1]) continue;
      const p = cyl(0.015, 0.015, 0.44, 6); p.translate(x, GL + 0.22, z); posts.push(p);
    }
    const segs = gap ? [[az, gap[0]], [gap[1], bz]] : [[az, bz]];
    for (const [z0, z1] of segs) for (const y of [0.22, 0.42]) {
      if (ax === bx) { rails.push(slab(ax - 0.008, GL + y - 0.008, Math.min(z0, z1), ax + 0.008, GL + y + 0.008, Math.max(z0, z1))); }
      else rails.push(slab(Math.min(ax, bx), GL + y - 0.008, az - 0.008, Math.max(ax, bx), GL + y + 0.008, az + 0.008));
    }
  };
  run(-4.12, -2.92, 4.12, -2.92);
  run(-4.12, -2.92, -4.12, 2.92);
  run(4.12, -2.92, 4.12, 2.92, [1.05, 2.2]);
  mesh(merged([...posts, ...rails]), metal, 0, 0, 0, F);
  // site sign
  const signMat = S({ map: TX.signTexture(['DARLINGTON SIGNALS', 'ARCHIVE', 'RESTRICTED SITE · AUTHORISED ONLY']), roughness: 0.5 });
  mesh(box(1.1, 0.42, 0.03), [metal, metal, metal, metal, signMat, metal], 3.25, GL + 0.48, 2.58, F);
  [2.78, 3.72].forEach((x) => mesh(cyl(0.02, 0.02, 0.3, 8), metal, x, GL + 0.15, 2.58, F));
  // lamp posts
  W.parts.lampMats = [];
  [[-0.95, 1.2], [2.4, 1.15], [-2.4, -1.6]].forEach(([x, z]) => {
    mesh(cyl(0.018, 0.022, 0.9, 8), metal, x, GL + 0.45, z, F);
    const lm = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false });
    mesh(box(0.14, 0.04, 0.08), lm, x, GL + 0.9, z, F, { cast: false });
    W.parts.lampMats.push(lm);
  });
  const yl = new THREE.PointLight(0xffd3a0, 0, 5, 1.6); yl.position.set(-1.6, GL + 1.0, 1.3); F.add(yl); W.lights.yard = yl;
  // CCTV cameras: yard (covers the hatch), gate, sub-basement corridor
  W.parts.cams = [];
  const addCam = (mount, at, target, opts) => {
    const c = makeCCTV(opts); c.group.position.copy(mount); F.add(c.group);
    F.updateMatrixWorld(true); c.head.lookAt(F.localToWorld(target.clone()));
    W.parts.cams.push(c); return c;
  };
  mesh(merged([slab(B.x0 - 0.05, GL + 1.06, B.z1 - 0.05, B.x0 + 0.02, GL + 1.13, B.z1 + 0.02)]), metal, 0, 0, 0, F);
  addCam(V(B.x0 - 0.06, GL + 1.06, B.z1 + 0.06), null, V(-3.0, GL, 2.3), { coneLen: 3.0, coneR: 0.85 });
  mesh(cyl(0.025, 0.03, 0.95, 8), metal, 3.85, GL + 0.47, 2.45, F);
  addCam(V(3.85, GL + 0.98, 2.45), null, V(3.0, GL, 1.2), { coneLen: 1.8, coneR: 0.65 });
  addCam(V(-0.6, 1.28, 2.9), null, V(-2.8, FL + 0.1, 2.1), { coneLen: 2.2, coneR: 0.55 });
  W.anchors.camYard = () => wp(F, V(B.x0 - 0.06, GL + 1.12, B.z1 + 0.06));
  W.anchors.camCorr = () => wp(F, V(-0.6, 1.3, 2.9));
  // the cyber-attack: an outside source feeding the CCTV recorder
  const node = new THREE.Group(); node.position.set(-1.8, GL + 1.2, -3.85); F.add(node);
  W.parts.cyberNode = node;
  W.parts.cyberIcon = spriteOf(TX.iconTexture('cyber'), 0.95, node, 0, 0, 0);
  W.anchors.cyber = () => wp(node);
  // the two offenders
  W.parts.figs = [0, 1].map(() => {
    const f = makeFigure({ body: 0x2a3342, limbs: 0x141a22, ring: COLORS.intruder, glow: 0.1 });
    F.add(f.group); f.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    setOpacity(f, 0); return f;
  });
  W.anchors.figA = () => W.parts.figs[0].group.localToWorld(V(0, 0.95, 0));
  W.anchors.figB = () => W.parts.figs[1].group.localToWorld(V(0, 0.95, 0));
  W.anchors.team = () => wp(F, V(1.3, 1.25, 2.6));
}

// ------------------------------------------------------------------ map of Great Britain and the three arrests
function buildMap(W) {
  const M = new THREE.Group(); M.position.copy(POS.map); W.scene.add(M); W.parts.map = M;
  const SEA = { x0: -5.05, x1: 5.5, z0: -5.15, z1: 5.25 };
  const seaW = SEA.x1 - SEA.x0, seaD = SEA.z1 - SEA.z0;
  const seaMat = S({ map: TX.seaTexture(seaW, seaD), roughness: 0.35, metalness: 0.25 });
  mesh(rbox(seaW, 0.08, seaD, 0.04), seaMat, (SEA.x0 + SEA.x1) / 2, 0.04, (SEA.z0 + SEA.z1) / 2, M, { cast: false });
  const shapes = [GB, ...ISLANDS].map((pts) => new THREE.Shape(pts.map(([lo, la]) => { const [x, z] = proj(lo, la); return new THREE.Vector2(x, -z); })));
  const land = new THREE.ExtrudeGeometry(shapes, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1, curveSegments: 4 });
  land.rotateX(-Math.PI / 2);
  const landTop = S({ color: 0x2f4a66, roughness: 0.7, metalness: 0.1, emissive: 0x0d2340, emissiveIntensity: 0.4 });
  const landSide = S({ color: 0x1c2c40, roughness: 0.8 });
  mesh(land, [landTop, landSide], 0, 0.08, 0, M);
  const coast = new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.site).multiplyScalar(1.3), transparent: true, opacity: 0.85, toneMapped: false });
  [GB, ...ISLANDS].forEach((pts) => {
    const v = pts.map(([lo, la]) => { const [x, z] = proj(lo, la); return V(x, 0.218, z); }); v.push(v[0].clone());
    M.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), coast));
  });
  W.parts.coastMat = coast;
  W.anchors.map = () => wp(M, V(-0.5, 0.4, -2.4));

  // vignette (arrest scene) for each suspect
  const VIG = { manchester: V(-3.55, 0, 1.35), harwich: V(4.1, 0, -0.35), eurotunnel: V(4.25, 0, 2.45) };
  const SCENE = { eurotunnel: makeShuttleScene, harwich: makeFerryScene, manchester: () => makeAirportScene().group };
  const TOP = { eurotunnel: 'rail', harwich: 'sea', manchester: 'air' };
  const PHONE = { lamb: 'iphone11', daytona: 'pixel6', pasdeigh: 'galaxyA51' };
  // where the suspect and police car stand on each plinth (plinth-local)
  const STAND = { eurotunnel: [V(-0.3, 0, 0.62), V(0.42, 0, 0.55), 0.0], harwich: [V(-0.35, 0.12, 0.48), V(0.3, 0.12, 0.5), 0.0], manchester: [V(0.1, 0, 0.55), V(0.62, 0, 0.35), -0.5] };
  W.parts.vigs = {};
  SUSPECTS.forEach((s) => {
    const col = COLORS[s.key];
    const p = PLACES[s.place], [px, pz] = proj(p.lon, p.lat);
    // pin
    const pin = new THREE.Group(); pin.position.set(px, 0.2, pz); M.add(pin);
    const pm = S({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 });
    mesh(cyl(0.012, 0.012, 0.5, 8), S({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.8 }), 0, 0.25, 0, pin);
    mesh(new THREE.SphereGeometry(0.075, 18, 12), pm, 0, 0.52, 0, pin);
    const prMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.5), transparent: true, opacity: 0.7, toneMapped: false, depthWrite: false });
    const pr = mesh(new THREE.RingGeometry(0.07, 0.11, 32), prMat, 0, 0.003, 0, pin, { cast: false }); pr.rotation.x = -Math.PI / 2;
    // plinth
    const v = VIG[s.place];
    const plinth = new THREE.Group(); plinth.position.copy(v); M.add(plinth);
    const side = S({ color: 0x1a212b, roughness: 0.5, metalness: 0.6 });
    const top = S({ map: TX.plinthTopTexture(TOP[s.place]), roughness: TOP[s.place] === 'sea' ? 0.25 : 0.85, metalness: TOP[s.place] === 'sea' ? 0.3 : 0.05 });
    mesh(cyl(1.15, 1.18, 0.14, 64), [side, top, side], 0, 0.13, 0, plinth);
    const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.4), transparent: true, opacity: 0.85, toneMapped: false });
    const rim = mesh(new THREE.TorusGeometry(1.165, 0.014, 8, 96), rimMat, 0, 0.2, 0, plinth, { cast: false }); rim.rotation.x = Math.PI / 2;
    const scn = SCENE[s.place](); scn.position.y = 0.2; plinth.add(scn);
    scn.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // leader from the pin to the plinth
    const a = V(px, 0.1, pz), b = v.clone().add(V(px - v.x, 0, pz - v.z).normalize().multiplyScalar(1.17)); b.y = 0.1;
    const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.3), transparent: true, opacity: 0.55, toneMapped: false });
    mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 8, 0.012, 6, false), lm, 0, 0, 0, M, { cast: false });
    // suspect, police car
    const [sp, cp, cy] = STAND[s.place];
    const fig = makeFigure({ body: { lamb: 0x3b2f22, daytona: 0x22382d, pasdeigh: 0x1f2c45 }[s.key], limbs: 0x111318, head: 0xd6b597, ring: col, hood: false, glow: 0.08 });
    fig.group.scale.setScalar(0.62); fig.group.position.copy(sp).add(V(0, 0.2, 0)); plinth.add(fig.group);
    fig.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const car = makePoliceCar(); car.group.scale.setScalar(0.62); car.group.position.copy(cp).add(V(0, 0.2, 0)); car.group.rotation.y = cy; plinth.add(car.group);
    car.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    // the device, shown floating above the suspect
    const dev = new THREE.Group(); dev.position.set(sp.x, 1.45, sp.z); plinth.add(dev);
    const ph = makePhone(PHONE[s.key]); ph.group.scale.setScalar(0.72); dev.add(ph.group);
    const halo = spriteOf(TX.dotTexture(), 1.3, dev, 0, 0, -0.08); halo.material.color = new THREE.Color(col); halo.material.opacity = 0.16; halo.material.blending = THREE.AdditiveBlending;
    dev.scale.setScalar(0.001); dev.visible = false;
    let laptop = null;
    if (s.key === 'daytona') { laptop = makeLaptop(); laptop.scale.setScalar(1.25); laptop.position.set(sp.x + 0.62, 1.12, sp.z + 0.05); laptop.rotation.set(0.35, -0.3, 0); plinth.add(laptop); laptop.visible = false; }
    W.parts.vigs[s.key] = { pin, pm, prMat, plinth, rimMat, lm, fig, car, dev, phone: ph, laptop, scene: scn };
    W.anchors['pin_' + s.key] = () => wp(pin, V(0, 0.55, 0));
    W.anchors['vig_' + s.key] = () => wp(plinth, V(0, 1.2, -0.3));
    W.anchors[s.key] = () => wp(fig.group, V(0, 0.95, 0));
    W.anchors['dev_' + s.key] = () => wp(dev, V(0, 0.4, 0));
    W.anchors['place_' + s.key] = () => wp(plinth, V(0, 0.35, -0.85));
    if (laptop) W.anchors.laptop = () => wp(laptop, V(0, 0.2, 0));
    addFocus(W, 'vig_' + s.key, plinth, new THREE.Box3(V(-1.2, 0.05, -1.2), V(1.2, 1.9, 1.2)), col);
  });
  W.parts.ferry = W.parts.vigs.daytona.scene.userData.ship;
  addFocus(W, 'map', M, new THREE.Box3(V(-3.3, 0.05, -4.85), V(2.3, 0.35, 4.5)), COLORS.site);
}

// ------------------------------------------------------------------ evidence tray (front)
function buildTray(W) {
  const T = new THREE.Group(); T.position.copy(POS.tray); W.scene.add(T); W.parts.tray = T;
  const rimM = S({ color: 0x0f141b, roughness: 0.5, metalness: 0.4 });
  const top = S({ map: TX.trayTexture(), roughness: 0.85 });
  mesh(rbox(4.3, 0.06, 2.25, 0.025), [rimM, rimM, top, rimM, rimM, rimM], 0, 0.03, 0, T, { cast: false });
  mesh(merged([slab(-2.15, 0.06, -1.125, 2.15, 0.12, -1.07), slab(-2.15, 0.06, 1.07, 2.15, 0.12, 1.125), slab(-2.15, 0.06, -1.07, -2.1, 0.12, 1.07), slab(2.1, 0.06, -1.07, 2.15, 0.12, 1.07)]), rimM, 0, 0, 0, T);
  const PHONE = { lamb: 'iphone11', daytona: 'pixel6', pasdeigh: 'galaxyA51' };
  W.parts.bags = {};
  SUSPECTS.forEach((s, i) => {
    const x = -1.38 + i * 1.38, col = COLORS[s.key];
    const bag = new THREE.Group(); bag.position.set(x, 0.07, 0.02); T.add(bag);
    const ph = makePhone(PHONE[s.key], { screenOn: false });
    const flip = new THREE.Group(); flip.rotation.y = Math.PI; bag.add(flip);
    ph.group.rotation.x = Math.PI / 2; ph.group.scale.setScalar(0.92); ph.group.position.set(0, 0.04, -0.12); flip.add(ph.group);
    ph.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const film = new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.2, roughness: 0.15, metalness: 0.1, depthWrite: false });
    mesh(rbox(1.12, 0.1, 1.86, 0.04), film, 0, 0.05, 0.02, bag, { cast: false }).renderOrder = 8;
    const lab = S({ map: TX.evidenceLabelTexture(s.deviceShort, s.name, s.color), roughness: 0.6 });
    const lp = mesh(new THREE.PlaneGeometry(1.0, 0.31), lab, 0, 0.105, -0.72, bag, { cast: false }); lp.rotation.x = -Math.PI / 2;
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-0.6, 0.006, -0.98), V(0.6, 0.006, -0.98), V(0.6, 0.006, 1.02), V(-0.6, 0.006, 1.02)]), new THREE.LineBasicMaterial({ color: new THREE.Color(col).multiplyScalar(1.7), transparent: true, opacity: 0, toneMapped: false }));
    bag.add(outline);
    W.parts.bags[s.key] = { bag, outline };
    W.anchors['bag_' + s.key] = () => wp(bag, V(0, 0.2, 0.2));
    addFocus(W, 'bag_' + s.key, bag, new THREE.Box3(V(-0.58, 0, -0.95), V(0.58, 0.14, 0.98)), col);
  });
  W.anchors.tray = () => wp(T, V(-1.8, 0.2, 0.9));
  addFocus(W, 'tray', T, new THREE.Box3(V(-2.18, 0, -1.15), V(2.18, 0.16, 1.15)), COLORS.evidence);
}

// ------------------------------------------------------------------ the unidentified fourth person and the missing terminal
function buildGhost(W) {
  const G = new THREE.Group(); G.position.copy(POS.ghost); W.scene.add(G); W.parts.ghost = G;
  const f = makeFigure({ body: 0x6d5bd0, limbs: 0x4c3d99, ring: COLORS.unknown, hood: true, glow: 0.9 });
  f.group.scale.setScalar(1.25); f.group.position.set(-0.75, 0, 0); f.group.rotation.y = 0.25; G.add(f.group);
  f.mats.forEach((m) => { m.opacity = 0.55; m.userData.base = 0.55; });
  W.parts.ghostFig = f;
  W.parts.ghostQ = spriteOf(TX.iconTexture('question'), 0.6, G, -0.75, 1.62, 0);
  const t = makeTerminal(); t.position.set(0.85, 0.02, 0); t.rotation.y = -0.35; t.scale.setScalar(1.3);
  t.updateMatrixWorld(true);
  const e = edgesOf(t, COLORS.classified, 0.9);
  G.add(e); W.parts.ghostTerm = e;
  e.traverse((o) => { o.renderOrder = 22; });
  const pad = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.unknown).multiplyScalar(1.2), transparent: true, opacity: 0.25, toneMapped: false, depthWrite: false });
  const disc = mesh(new THREE.RingGeometry(0.0, 1.9, 48), pad, 0, 0.005, 0, G, { cast: false }); disc.rotation.x = -Math.PI / 2;
  W.parts.ghostPad = pad;
  W.anchors.ghost = () => wp(G, V(-0.75, 1.35, 0));
  W.anchors.ghostTerm = () => wp(G, V(0.85, 0.55, 0));
  addFocus(W, 'ghost', G, new THREE.Box3(V(-1.9, 0, -0.9), V(1.6, 2.0, 0.9)), COLORS.unknown);
}

// ------------------------------------------------------------------ particle routes
function buildCurves(W) {
  const F = W.parts.fac;
  // cyber-attack: from the outside source, over the fence, into the CCTV recorder
  const pts = [V(-1.8, GL + 1.2, -3.85), V(-1.35, GL + 1.25, -3.4), V(-0.85, GL + 1.1, -2.95), V(-0.55, GL + 0.9, -2.55), V(-0.5, GL + 0.75, -2.4)];
  W.curves.cyber = new THREE.CatmullRomCurve3(pts.map((p) => F.localToWorld(p)));
  // looped recording: recorder to monitor wall
  const lp = [V(-0.42, GL + 0.75, -2.3), V(-0.25, GL + 1.1, -2.3), V(0.2, GL + 1.3, -2.45), V(0.6, GL + 1.12, -2.5)];
  W.curves.loop = new THREE.CatmullRomCurve3(lp.map((p) => F.localToWorld(p)));
}

// ------------------------------------------------------------------ per-frame update
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
function update(W, A, time, dt, story) {
  const P = W.parts, k = (rate) => 1 - Math.exp(-dt * rate);
  const { id, lt, fade } = story;
  const st = facility(id, lt);

  // hatch lid, security doors, vault door
  P.hatch.rotation.x = -1.85 * smooth(st.hatch);
  P.doors.forEach((d, i) => {
    d.shutter.position.y = FL + 0.92 * smooth(st.doors[i]);
    d.shutter.scale.y = 1 - 0.85 * smooth(st.doors[i]);
    d.led.color.set(st.leds[i] ? 0xffb020 : 0xff3b3b);
  });
  P.vaultHinge.rotation.y = -1.72 * smooth(st.vault);

  // offenders
  const figVis = st.figs ? fade * (id === 'hatch' ? k01(lt, 0, 0.5) : 1) : 0;
  P.figs.forEach((f, i) => {
    setOpacity(f, figVis);
    if (!st.figs) return;
    const s = st.figs[i];
    f.group.position.set(s.x, s.y, s.z); f.group.rotation.y = s.yaw;
    const carry = i === 0 && st.terminal === 'carried' ? st.lift : 0;
    poseFigure(f, time, { walk: s.walk, climb: s.climb, carry });
  });

  // terminal: on the plinth, being lifted/carried, or gone
  const T = P.terminal;
  if (st.terminal === 'plinth') {
    T.visible = true; T.position.set(PLINTH.x, PLINTH.top, PLINTH.z); T.rotation.set(0, 0, 0); T.scale.setScalar(1);
  } else if (st.terminal === 'carried' && st.figs) {
    const a = st.figs[0];
    const carryPos = V(a.x + Math.sin(a.yaw) * 0.24, a.y + 0.42, a.z + Math.cos(a.yaw) * 0.24);
    const rest = V(PLINTH.x, PLINTH.top, PLINTH.z);
    T.visible = figVis > 0.02;
    T.position.lerpVectors(rest, carryPos, st.lift);
    T.rotation.set(0, lerp(0, a.yaw, st.lift), 0);
    T.scale.setScalar(lerp(1, 0.82, st.lift));
  } else { T.visible = false; }
  const gone = st.terminal === 'gone' ? 1 : 0;
  P.missingBox.material.opacity = 0.9 * gone * (0.7 + 0.3 * Math.sin(time * 3));
  P.missingBox.visible = gone > 0;
  P.missingTag.visible = gone > 0 && A.missingTag > 0.02; P.missingTag.material.opacity = A.missingTag;
  P.plinthGlow.opacity = st.terminal === 'plinth' ? 0.8 : 0.15;

  // night, lights
  const n = A.night;
  P.lampMats.forEach((m) => m.color.setRGB(1, 0.85, 0.63).multiplyScalar(0.4 + 1.6 * n));
  W.lights.yard.intensity = 2.2 * n;
  W.lights.corr.intensity = 1.9 + 1.4 * n;
  W.lights.vault.intensity = 2.2 + 1.5 * n;
  W.lights.control.intensity = 0.6 + 1.2 * n;
  P.corrStrip.color.setRGB(0.8, 0.88, 1).multiplyScalar(0.8 + 0.8 * n);

  // building roof fades for interior views
  const r = smooth(A.roof);
  P.roofMat.opacity = 1 - r; P.roof.visible = r < 0.98; P.roof.castShadow = r < 0.5;
  P.roofExtras.forEach((o) => { o.visible = r < 0.98; o.castShadow = r < 0.5; });

  // CCTV cameras: cones show coverage; cyan = live, pink = looped recording
  const loopCol = st.loop ? COLORS.loop : COLORS.cctv;
  P.cams.forEach((c, i) => {
    c.coneMat.color.set(loopCol);
    const flick = st.glitch ? (Math.sin(time * 60 + i) > 0 ? 1 : 0.2) : 1;
    c.coneMat.opacity = 0.085 * A.cones * flick;
    c.cone.visible = A.cones > 0.01;
    c.led.color.set(st.loop ? 0xf472b6 : 0xff3b3b);
  });
  P.nvrLeds.color.set(st.cyber > 0.5 ? (Math.sin(time * 14) > 0 ? 0xff3b3b : 0x7f1d1d) : 0x34d399);
  P.cyberNode.visible = A.cyber > 0.01;
  P.cyberIcon.material.opacity = A.cyber;
  P.cyberNode.position.y = GL + 1.2 + 0.08 * Math.sin(time * 1.4);
  // monitor wall in the control room
  const cw = P.cctvWall;
  if (time - cw.last > 0.1) { cw.last = time; drawCctvWall(cw.ctx, 768, 384, st.feeds, lt, time); cw.tex.needsUpdate = true; }

  // map, vignettes and devices
  const pinsUp = A.pins;
  SUSPECTS.forEach((s, i) => {
    const v = P.vigs[s.key];
    const on = A['s_' + s.key];
    const pop = id === 'arrests' ? sm(lt, 0.25 + i * 0.45, 0.7 + i * 0.45) : 1;
    v.pin.scale.setScalar(Math.max(0.001, pop));
    v.pm.emissiveIntensity = 0.6 + 1.4 * Math.max(pinsUp, on) * (0.75 + 0.25 * Math.sin(time * 4 + i));
    const ring = (time * 0.8 + i * 0.33) % 1;
    v.prMat.opacity = (0.25 + 0.65 * Math.max(pinsUp, on)) * (1 - ring);
    v.pin.children[2].scale.setScalar(1 + ring * 2.2 * Math.max(pinsUp, on));
    v.rimMat.opacity = 0.35 + 0.6 * Math.max(pinsUp, on);
    v.lm.opacity = 0.25 + 0.6 * Math.max(pinsUp, on);
    v.car.lights[0].color.setRGB(0.23, 0.63, 1).multiplyScalar(Math.sin(time * 9 + i) > 0 ? 2.2 : 0.25);
    v.car.lights[1].color.setRGB(0.23, 0.63, 1).multiplyScalar(Math.sin(time * 9 + i) > 0 ? 0.25 : 2.2);
    poseFigure(v.fig, time, {});
    // device rises out of the scene and turns to show front and back
    const d = A['d_' + s.key];
    v.dev.visible = d > 0.01; v.dev.scale.setScalar(Math.max(0.001, d));
    v.dev.position.y = 1.2 + 0.6 * d + 0.04 * Math.sin(time * 1.6 + i);
    if (W.camera) { v.dev.getWorldPosition(_v); v.dev.rotation.y = Math.atan2(W.camera.position.x - _v.x, W.camera.position.z - _v.z) - v.plinth.rotation.y; }
    v.phone.group.rotation.y = Math.PI + 0.38 * Math.sin(time * 0.8 + i * 1.7);
    if (v.laptop) { v.laptop.visible = A.laptop > 0.01; v.laptop.scale.setScalar(1.25 * Math.max(0.001, A.laptop)); }
  });
  if (P.ferry) { P.ferry.position.y = 0.015 * Math.sin(time * 1.3); P.ferry.rotation.x = 0.01 * Math.sin(time * 1.1); }
  P.coastMat.opacity = 0.55 + 0.4 * pinsUp;

  // evidence bags
  SUSPECTS.forEach((s, i) => {
    const b = P.bags[s.key];
    b.outline.material.opacity = A.bags * (0.6 + 0.4 * Math.sin(time * 3 + i));
  });

  // ghost (unidentified fourth person, missing terminal)
  const g = A.ghost;
  P.ghost.visible = g > 0.01;
  setOpacity(P.ghostFig, g);
  P.ghostFig.group.position.y = 0.05 + 0.06 * Math.sin(time * 1.2);
  poseFigure(P.ghostFig, time, {});
  P.ghostQ.material.opacity = g; P.ghostQ.position.y = 1.72 + 0.08 * Math.sin(time * 1.6);
  P.ghostTerm.userData.mat.opacity = 0.9 * g * (0.7 + 0.3 * Math.sin(time * 2.4));
  P.ghostPad.opacity = 0.22 * g;

  // focus brackets
  for (const key in W.focus) {
    const f = W.focus[key];
    const want = A.focus.has(key) ? 1 : 0;
    f.a += (want - f.a) * k(5);
    f.mesh.visible = f.a > 0.01;
    f.mesh.material.opacity = f.a * (0.75 + 0.25 * Math.sin(time * 3));
    f.mesh.scale.setScalar(1 + 0.18 * (1 - f.a));
  }
}
