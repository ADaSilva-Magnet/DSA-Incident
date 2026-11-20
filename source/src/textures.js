// Procedural canvas textures (no image files needed).
import * as THREE from 'three';
import { UI_FONT, MONO_FONT, fillRR, strokeRR, text, rrPath } from './util.js';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(cv, { repeat, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 8;
  return t;
}
// deterministic pseudo-random so the board looks the same on every load
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function deskTexture() {
  const cv = canvas(1024, 512), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#2a2019'); g.addColorStop(1, '#221a14');
  c.fillStyle = g; c.fillRect(0, 0, 1024, 512);
  const r = rng(7);
  for (let i = 0; i < 260; i++) {
    const y = r() * 512, a = 0.03 + r() * 0.06;
    c.strokeStyle = r() > 0.5 ? `rgba(255,220,180,${a})` : `rgba(0,0,0,${a * 1.6})`;
    c.lineWidth = 0.6 + r() * 2.2;
    c.beginPath(); c.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 32) c.lineTo(x, y + Math.sin(x * 0.006 + i) * 6 + (r() - 0.5) * 2);
    c.stroke();
  }
  return tex(cv, { repeat: [2, 1] });
}

export function meshTexture() {
  const cv = canvas(128, 128), c = cv.getContext('2d');
  c.fillStyle = '#151a22'; c.fillRect(0, 0, 128, 128);
  c.fillStyle = '#05070a';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    c.beginPath(); c.arc(x * 16 + (y % 2 ? 8 : 0) + 4, y * 16 + 8, 5.2, 0, Math.PI * 2); c.fill();
  }
  return tex(cv, { repeat: [10, 10] });
}

export function pcbTexture() {
  const W = 1024, H = 1280, cv = canvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#0d141d'; c.fillRect(0, 0, W, H);
  const r = rng(42);
  // copper pour texture
  for (let i = 0; i < 900; i++) {
    c.strokeStyle = `rgba(56, 110, 150, ${0.05 + r() * 0.08})`;
    c.lineWidth = 1 + r() * 2;
    let x = r() * W, y = r() * H;
    c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      if (r() > 0.5) x += (r() - 0.5) * 220; else y += (r() - 0.5) * 220;
      c.lineTo(x, y);
    }
    c.stroke();
  }
  // small SMD parts
  for (let i = 0; i < 520; i++) {
    const x = r() * W, y = r() * H, w = 5 + r() * 10, h = 3 + r() * 6;
    c.fillStyle = r() > 0.7 ? '#8b96a5' : '#262f3b';
    c.fillRect(x, y, w, h);
  }
  // silkscreen
  c.fillStyle = 'rgba(220,228,240,0.55)';
  c.font = `700 30px ${UI_FONT}`;
  c.fillText('AX-WS PRO  ·  ATX', 600, 1225);
  c.font = `600 18px ${UI_FONT}`;
  [['CPU_FAN', 300, 120], ['DIMM_A1', 650, 140], ['DIMM_B1', 770, 140], ['M.2_1 (CPU)', 330, 580], ['PCIEX16_1', 120, 690],
    ['PCIEX16_2', 120, 940], ['PCIEX16_3', 120, 1110], ['ATX_24PIN', 900, 560], ['SATA6G_1-4', 860, 1000]].forEach(([s, x, y]) => c.fillText(s, x, y));
  // mounting holes
  [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60], [W - 60, 640], [520, 640]].forEach(([x, y]) => {
    c.fillStyle = '#b9975b'; c.beginPath(); c.arc(x, y, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#05070a'; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill();
  });
  return tex(cv);
}

export function finTexture(horizontal) {
  const cv = canvas(256, 256), c = cv.getContext('2d');
  c.fillStyle = '#5d6672'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 8) {
    const g = horizontal ? c.createLinearGradient(0, i, 0, i + 8) : c.createLinearGradient(i, 0, i + 8, 0);
    g.addColorStop(0, '#c9d1db'); g.addColorStop(0.35, '#9aa4b1'); g.addColorStop(0.5, '#1c2129'); g.addColorStop(1, '#2a3039');
    c.fillStyle = g;
    if (horizontal) c.fillRect(0, i, 256, 8); else c.fillRect(i, 0, 8, 256);
  }
  return tex(cv);
}

export function capTexture() {
  const cv = canvas(256, 512), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 256, 512);
  g.addColorStop(0, '#d7dde6'); g.addColorStop(0.5, '#9aa3ae'); g.addColorStop(1, '#c4cbd4');
  c.fillStyle = g; c.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 512; i += 3) { c.fillStyle = `rgba(255,255,255,${(i % 7) / 60})`; c.fillRect(0, i, 256, 1); }
  c.fillStyle = '#1b2430';
  c.font = `800 64px ${UI_FONT}`; c.textAlign = 'center'; c.fillText('AX', 128, 280);
  c.font = `600 22px ${UI_FONT}`; c.fillText('COOLER', 128, 316);
  return tex(cv);
}

export function ramTexture(label) {
  const L = canvas(512, 160), c = L.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, '#2b3340'); g.addColorStop(1, '#161b23');
  c.fillStyle = g; c.fillRect(0, 0, 512, 160);
  c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 2;
  for (let x = -160; x < 512; x += 26) { c.beginPath(); c.moveTo(x, 160); c.lineTo(x + 160, 0); c.stroke(); }
  c.fillStyle = '#e8eef9'; c.font = `800 46px ${UI_FONT}`; c.fillText(label, 36, 96);
  c.fillStyle = '#9fb0c8'; c.font = `600 22px ${UI_FONT}`; c.fillText('DDR5 · WORKSTATION', 36, 130);
  // rotate into a portrait canvas (u = stick height, v = stick length)
  const P = canvas(160, 512), q = P.getContext('2d');
  q.translate(160, 0); q.rotate(Math.PI / 2); q.drawImage(L, 0, 0);
  return tex(P);
}

// NVMe M.2 sticker. Drawn landscape (long side = u).
export function nvmeSticker(model, sub) {
  const cv = canvas(512, 140), c = cv.getContext('2d');
  c.fillStyle = '#111418'; c.fillRect(0, 0, 512, 140);
  c.fillStyle = '#e6ebf2'; c.font = `700 22px ${UI_FONT}`; c.fillText('SAMSUNG', 24, 38);
  c.font = `800 54px ${UI_FONT}`; c.fillText(model, 24, 98);
  c.fillStyle = '#93a2b8'; c.font = `600 20px ${UI_FONT}`; c.fillText(sub, 24, 126);
  c.fillStyle = '#c8a25a'; c.fillRect(440, 30, 46, 46);
  return tex(cv);
}

export function sataSticker(model) {
  const cv = canvas(512, 360), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 512, 360);
  g.addColorStop(0, '#2a2f36'); g.addColorStop(1, '#14171c');
  c.fillStyle = g; c.fillRect(0, 0, 512, 360);
  c.fillStyle = '#e8edf3'; c.font = `700 30px ${UI_FONT}`; c.fillText('SAMSUNG', 40, 80);
  c.font = `800 74px ${UI_FONT}`; c.fillText(model, 40, 175);
  c.fillStyle = '#9aa6b6'; c.font = `600 28px ${UI_FONT}`; c.fillText('SSD · SATA III · 2.5"', 40, 230);
  c.strokeStyle = '#c8a25a'; c.lineWidth = 6; c.strokeRect(40, 270, 120, 46);
  return tex(cv);
}

export function hddLidTexture() {
  const cv = canvas(512, 356), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 512, 356);
  g.addColorStop(0, '#b9c1cc'); g.addColorStop(1, '#8a939f');
  c.fillStyle = g; c.fillRect(0, 0, 512, 356);
  c.fillStyle = '#f4f6f9'; c.fillRect(150, 40, 330, 230);
  c.fillStyle = '#1b2430'; c.font = `800 40px ${UI_FONT}`; c.fillText('HDD', 175, 105);
  c.font = `600 22px ${UI_FONT}`; c.fillText('3.5" · 7200 RPM', 175, 142); c.fillText('SATA · mechanical', 175, 172);
  for (let i = 0; i < 18; i++) c.fillRect(175 + i * 14, 205, (i % 3) + 4, 40);
  return tex(cv);
}

export function platterTexture() {
  const S = 512, cv = canvas(S, S), c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 20, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#8d96a3'); g.addColorStop(0.5, '#dfe5ec'); g.addColorStop(1, '#9aa3ae');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  for (let r = 60; r < S / 2; r += 6) { c.strokeStyle = `rgba(30,40,55,${0.05 + (r % 18) / 300})`; c.lineWidth = 1; c.beginPath(); c.arc(S / 2, S / 2, r, 0, Math.PI * 2); c.stroke(); }
  // sector wedges so the spin is visible
  c.globalAlpha = 0.22;
  for (let k = 0; k < 6; k++) {
    c.fillStyle = k % 2 ? '#3b82f6' : '#0f172a';
    c.beginPath(); c.moveTo(S / 2, S / 2); c.arc(S / 2, S / 2, S / 2, k * Math.PI / 3, k * Math.PI / 3 + 0.22); c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
  return tex(cv);
}

export function dotTexture() {
  const cv = canvas(64, 64), c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  return tex(cv, { srgb: false });
}

export function stripTexture(label) {
  const cv = canvas(1024, 128), c = cv.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, 1024, 128);
  c.fillStyle = '#fff'; c.font = `800 74px ${UI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, 512, 66);
  return tex(cv);
}

export function shroudTexture() {
  const cv = canvas(1024, 256), c = cv.getContext('2d');
  c.fillStyle = '#141922'; c.fillRect(0, 0, 1024, 256);
  c.fillStyle = '#0a0d12';
  for (let i = 0; i < 26; i++) fillRR(c, 560 + i * 17, 70, 8, 116, 4, '#07090c');
  c.fillStyle = '#c7d2e0'; c.font = `800 46px ${UI_FONT}`; c.fillText('AXIOM', 60, 120);
  c.fillStyle = '#7f8ea3'; c.font = `600 26px ${UI_FONT}`; c.fillText('FORENSIC WORKSTATION', 60, 160);
  return tex(cv);
}

export function phoneScreenTexture() {
  const cv = canvas(256, 540), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#1e3a8a'); g.addColorStop(1, '#0b1220');
  c.fillStyle = g; c.fillRect(0, 0, 256, 540);
  text(c, '9:41', 128, 120, { size: 58, weight: 300, color: '#fff', align: 'center' });
  fillRR(c, 28, 300, 200, 150, 22, 'rgba(255,255,255,0.14)');
  text(c, 'USB connected', 128, 360, { size: 22, weight: 700, color: '#fff', align: 'center' });
  text(c, 'to workstation', 128, 392, { size: 20, weight: 500, color: '#c7d2fe', align: 'center' });
  c.strokeStyle = '#fff'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(128, 412); c.lineTo(128, 436); c.stroke();
  return tex(cv);
}

export function crossTexture() {
  const cv = canvas(128, 128), c = cv.getContext('2d');
  c.fillStyle = 'rgba(239,68,68,0.95)'; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 14; c.lineCap = 'round';
  c.beginPath(); c.moveTo(40, 40); c.lineTo(88, 88); c.moveTo(88, 40); c.lineTo(40, 88); c.stroke();
  return tex(cv);
}

export function glassStreakTexture() {
  const cv = canvas(512, 512), c = cv.getContext('2d');
  c.clearRect(0, 0, 512, 512);
  const band = (x, w, a) => {
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.save(); c.translate(256, 256); c.rotate(-0.55); c.translate(-256, -256); c.fillStyle = g; c.fillRect(x, -300, w, 1200); c.restore();
  };
  band(40, 140, 0.55); band(210, 50, 0.35); band(330, 22, 0.3);
  return tex(cv);
}

export function backdropTexture() {
  const cv = canvas(1024, 1024), c = cv.getContext('2d');
  const g = c.createRadialGradient(560, 430, 40, 512, 560, 760);
  g.addColorStop(0, '#1b2d4d'); g.addColorStop(0.45, '#0e1a2f'); g.addColorStop(1, '#050913');
  c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  return tex(cv);
}

export function chipTexture(label) {
  const cv = canvas(256, 256), c = cv.getContext('2d');
  c.fillStyle = '#171c24'; c.fillRect(0, 0, 256, 256);
  c.fillStyle = '#5d6b80'; c.font = `700 34px ${MONO_FONT}`; c.textAlign = 'center'; c.fillText(label, 128, 140);
  c.beginPath(); c.arc(40, 40, 12, 0, Math.PI * 2); c.fill();
  return tex(cv);
}


// ------------------------------------------------------------------ DSA scenario textures
export function canvasTex(w, h, draw, opts) { const cv = canvas(w, h); draw(cv.getContext('2d'), w, h); return tex(cv, opts); }

export function soilTexture() {
  return canvasTex(512, 512, (c, w, h) => {
    const bands = ['#3a2c22', '#46352a', '#3d2f25', '#52402f', '#3a2b20', '#4a3829', '#342619'];
    let y = 0; const r = rng(11);
    while (y < h) { const bh = 30 + r() * 70; c.fillStyle = bands[Math.floor(r() * bands.length)]; c.fillRect(0, y, w, bh + 2); y += bh; }
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '200,180,150' : '10,8,6'},${0.08 + r() * 0.18})`; const s = 1 + r() * 4; c.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.6)); }
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(120,110,100,${0.25 + r() * 0.3})`; c.beginPath(); c.ellipse(r() * w, r() * h, 4 + r() * 9, 3 + r() * 6, r() * 3, 0, 7); c.fill(); }
  }, { repeat: [1, 1] });
}

export function concreteTexture() {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#6b727d'; c.fillRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.05})`; c.fillRect(r() * w, r() * h, 2, 2); }
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
  }, { repeat: [2, 2] });
}

export function tileTexture(col = '#3a4250', line = '#2a303a') {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    c.strokeStyle = line; c.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); }
  }, { repeat: [4, 2] });
}

// Top of the site seen from above: lawn, an access road, a car park, and long grass around the old hatch.
export function yardTexture(W, D, hatch, bldg) {
  const S = 128; // px per unit
  return canvasTex(Math.round(W * S), Math.round(D * S), (c, w, h) => {
    const X = (x) => (x + W / 2) * S, Z = (z) => (z + D / 2) * S;
    c.fillStyle = '#25402a'; c.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '90,140,80' : '10,30,12'},${0.12 + r() * 0.2})`; c.fillRect(r() * w, r() * h, 2, 3); }
    // road from the gate (right) to the building and a car park
    c.fillStyle = '#2b2f36'; c.fillRect(X(bldg.x1 - 0.2), Z(bldg.z1 + 0.15), X(W / 2) - X(bldg.x1 - 0.2), Z(bldg.z1 + 1.25) - Z(bldg.z1 + 0.15));
    c.fillRect(X(bldg.x0 - 0.1), Z(bldg.z1 + 0.15), X(bldg.x1) - X(bldg.x0 - 0.1), Z(bldg.z1 + 0.55) - Z(bldg.z1 + 0.15));
    c.strokeStyle = 'rgba(240,240,220,0.55)'; c.lineWidth = 3; c.setLineDash([16, 14]);
    c.beginPath(); c.moveTo(X(bldg.x1), Z(bldg.z1 + 0.7)); c.lineTo(X(W / 2), Z(bldg.z1 + 0.7)); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 6; i++) { c.strokeStyle = 'rgba(240,240,220,0.5)'; c.beginPath(); const x = X(bldg.x0 + 0.3 + i * 0.6); c.moveTo(x, Z(bldg.z1 + 0.15)); c.lineTo(x, Z(bldg.z1 + 0.5)); c.stroke(); }
    // gravel path around the building
    c.fillStyle = '#5b5a55'; c.fillRect(X(bldg.x0 - 0.25), Z(bldg.z0 - 0.2), X(bldg.x1 + 0.2) - X(bldg.x0 - 0.25), Z(bldg.z1 + 0.15) - Z(bldg.z0 - 0.2));
    // overgrown patch around the disused hatch
    const hx = X(hatch.x), hz = Z(hatch.z);
    for (let i = 0; i < 900; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 1.0 * S; c.fillStyle = `rgba(${r() > 0.5 ? '70,95,40' : '30,45,18'},${0.3 + r() * 0.4})`; c.fillRect(hx + Math.cos(a) * d, hz + Math.sin(a) * d, 2, 4); }
    c.fillStyle = 'rgba(60,45,30,0.6)'; c.fillRect(hx - 0.5 * S, hz - 0.5 * S, S, S);
  });
}

export function hatchLidTexture() {
  return canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5d4a3a'); g.addColorStop(1, '#3e3128');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(25,18,12,0.65)'; c.lineWidth = 5;
    for (let i = -h; i < w; i += 22) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); }
    const r = rng(9);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${150 + r() * 60},${70 + r() * 30},20,${0.2 + r() * 0.3})`; c.beginPath(); c.ellipse(r() * w, r() * h, 6 + r() * 18, 4 + r() * 10, r() * 3, 0, 7); c.fill(); }
    for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#111' : '#c9a227'; c.fillRect(i * 26, 0, 26, 14); c.fillRect(i * 26, h - 14, 26, 14); }
    c.fillStyle = '#2a211a'; fillRR(c, w / 2 - 40, h / 2 - 10, 80, 20, 8, '#2a211a');
  });
}

export function signTexture(lines) {
  return canvasTex(1024, 384, (c, w, h) => {
    c.fillStyle = '#0e2a4a'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e2e8f0'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#ffffff'; c.textAlign = 'center';
    c.font = `800 74px ${UI_FONT}`; c.fillText(lines[0], w / 2, 130);
    c.font = `700 62px ${UI_FONT}`; c.fillText(lines[1], w / 2, 210);
    c.fillStyle = '#c62828'; c.fillRect(30, 250, w - 60, 100);
    c.fillStyle = '#ffffff'; c.font = `800 48px ${UI_FONT}`; c.fillText(lines[2], w / 2, 318);
  });
}

export function classifiedTexture() {
  return canvasTex(512, 160, (c, w, h) => {
    c.fillStyle = '#3c4536'; c.fillRect(0, 0, w, h);
    for (let i = -2; i < 22; i++) { c.fillStyle = i % 2 ? '#111' : '#e0b21c'; c.beginPath(); c.moveTo(i * 26, 0); c.lineTo(i * 26 + 26, 0); c.lineTo(i * 26 + 10, 34); c.lineTo(i * 26 - 16, 34); c.fill(); }
    c.fillStyle = '#b91c1c'; fillRR(c, 90, 54, 332, 76, 8, '#b91c1c');
    c.strokeStyle = '#fee2e2'; c.lineWidth = 4; strokeRR(c, 98, 62, 316, 60, 6, '#fee2e2', 4);
    c.fillStyle = '#fff'; c.font = `900 46px ${UI_FONT}`; c.textAlign = 'center'; c.fillText('CLASSIFIED', w / 2, 108);
  });
}

export function terminalScreenTexture() {
  return canvasTex(256, 160, (c, w, h) => {
    c.fillStyle = '#04140c'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#34d399'; c.font = `700 16px ${MONO_FONT}`;
    ['DSA SECURE TERMINAL', '> AUTH: LEVEL 5', '> ARCHIVE INDEX', '  ██████ ██ ████', '  ████ ███ █████', '> _'].forEach((s, i) => c.fillText(s, 14, 26 + i * 23));
  });
}

export function battenburgTexture() {
  return canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = '#e3e7ec'; c.fillRect(0, 0, w, h);
    const sq = 32;
    for (let i = 0; i < w / sq; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#1d4ed8' : '#facc15'; c.fillRect(i * sq, 56 + j * sq, sq, sq); }
    c.fillStyle = '#1e3a8a'; c.font = `900 40px ${UI_FONT}`; c.textAlign = 'center'; c.fillText('POLICE', w / 2, 44);
  });
}

export function windowStripTexture(bg, win, n, { stripe = null } = {}) {
  return canvasTex(512, 64, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    if (stripe) { c.fillStyle = stripe; c.fillRect(0, 44, w, 10); }
    for (let i = 0; i < n; i++) fillRR(c, 12 + i * ((w - 24) / n), 14, (w - 24) / n - 8, 22, 5, win);
  });
}

export function evidenceLabelTexture(device, from, color) {
  return canvasTex(512, 160, (c, w, h) => {
    c.fillStyle = '#b91c1c'; c.fillRect(0, 0, w, 52);
    c.fillStyle = '#fff'; c.font = `900 36px ${UI_FONT}`; c.fillText('EVIDENCE', 18, 39);
    c.font = `700 20px ${UI_FONT}`; c.textAlign = 'right'; c.fillText('SEALED', w - 18, 36); c.textAlign = 'left';
    c.fillStyle = '#f8fafc'; c.fillRect(0, 52, w, h - 52);
    c.fillStyle = color; c.fillRect(0, 52, 12, h - 52);
    c.fillStyle = '#0f172a'; c.font = `800 34px ${UI_FONT}`; c.fillText(device, 28, 98);
    c.fillStyle = '#475569'; c.font = `600 24px ${UI_FONT}`; c.fillText(from, 28, 136);
  });
}

export function seaTexture(W, D) {
  return canvasTex(1024, Math.round(1024 * D / W), (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0b2140'); g.addColorStop(1, '#0a1a33');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(120,170,255,0.13)'; c.lineWidth = 2;
    for (let x = 0; x < w; x += w / 10) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += w / 10) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  });
}

export function lockScreenTexture(accent) {
  return canvasTex(256, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#111827'); g.addColorStop(1, accent);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = 9; c.beginPath(); c.arc(w / 2, 196, 34, Math.PI, 0); c.stroke();
    fillRR(c, w / 2 - 52, 196, 104, 82, 14, '#fff');
    c.fillStyle = '#111827'; c.beginPath(); c.arc(w / 2, 232, 11, 0, 7); c.fill(); c.fillRect(w / 2 - 4, 236, 8, 22);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = `700 28px ${UI_FONT}`; c.textAlign = 'center'; c.fillText('Locked', w / 2, 340);
  });
}

export function labelTexture(s, { bg = '#0f172a', fg = '#fff', size = 54, w = 512, h = 96 } = {}) {
  return canvasTex(w, h, (c) => {
    fillRR(c, 4, 4, w - 8, h - 8, 18, bg);
    c.fillStyle = fg; c.font = `800 ${size}px ${UI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, w / 2, h / 2 + 3);
  });
}

export function samsungBackTexture() {
  return canvasTex(256, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2f4fa8'); g.addColorStop(0.5, '#4c74d6'); g.addColorStop(1, '#283f86');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.16;
    for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#c7d7ff' : '#0b1b4a'; c.beginPath(); c.moveTo(i * 40 - 120, 0); c.lineTo(i * 40, 0); c.lineTo(i * 40 - 200, h); c.lineTo(i * 40 - 320, h); c.fill(); }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = `700 22px ${UI_FONT}`; c.textAlign = 'center'; c.fillText('SAMSUNG', w / 2, h - 40);
  });
}

export function plinthTopTexture(kind) {
  return canvasTex(512, 512, (c, w, h) => {
    if (kind === 'sea') {
      const g = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2); g.addColorStop(0, '#1d5d8f'); g.addColorStop(1, '#0e3557');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(200,230,255,0.18)'; c.lineWidth = 3;
      for (let i = 0; i < 26; i++) { const y = 20 + i * 19; c.beginPath(); for (let x = 0; x <= w; x += 16) c.lineTo(x, y + Math.sin(x * 0.05 + i) * 4); c.stroke(); }
    } else {
      c.fillStyle = kind === 'air' ? '#3b4049' : '#353a42'; c.fillRect(0, 0, w, h);
      const r = rng(kind === 'air' ? 21 : 22);
      for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + r() * 0.05})`; c.fillRect(r() * w, r() * h, 2, 2); }
      if (kind === 'air') {
        c.strokeStyle = '#facc15'; c.lineWidth = 6; c.setLineDash([26, 18]);
        c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w, h * 0.62); c.stroke(); c.setLineDash([]);
      } else {
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 5;
        for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(60 + i * 80, h * 0.7); c.lineTo(60 + i * 80, h * 0.92); c.stroke(); }
      }
    }
  });
}

export function iconTexture(kind) {
  return canvasTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    if (kind === 'question') {
      c.fillStyle = 'rgba(177,151,252,0.95)'; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill();
      c.fillStyle = '#1e1b4b'; c.font = `900 180px ${UI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 128, 140);
    } else if (kind === 'cyber') {
      c.fillStyle = 'rgba(127,29,29,0.92)'; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill();
      c.strokeStyle = '#fecaca'; c.lineWidth = 8; c.beginPath(); c.arc(128, 128, 112, 0, 7); c.stroke();
      fillRR(c, 58, 70, 140, 92, 10, '#fee2e2'); fillRR(c, 66, 78, 124, 76, 6, '#111827');
      c.fillStyle = '#f87171'; c.font = `900 46px ${MONO_FONT}`; c.textAlign = 'center'; c.fillText('</>', 128, 132);
      c.fillStyle = '#fee2e2'; c.beginPath(); c.moveTo(40, 176); c.lineTo(216, 176); c.lineTo(196, 192); c.lineTo(60, 192); c.fill();
    } else if (kind === 'missing') {
      c.save(); c.translate(128, 128); c.rotate(-0.25);
      c.strokeStyle = '#ef4444'; c.lineWidth = 12; c.strokeRect(-118, -46, 236, 92);
      c.fillStyle = '#ef4444'; c.font = `900 58px ${UI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MISSING', 0, 4);
      c.restore();
    }
  }, { srgb: true });
}

export function trayTexture() {
  return canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#161c26'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 2;
    for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.fillStyle = 'rgba(226,232,240,0.55)'; c.font = `800 34px ${UI_FONT}`; c.fillText('SEIZED DEVICES — FOR FORENSIC EXAMINATION', 40, h - 34);
  });
}

export function shutterTexture() {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#7a828e'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 18) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, y, w, 3); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, y + 3, w, 2); }
    for (let i = -h; i < w; i += 36) { c.fillStyle = '#d4a514'; c.beginPath(); c.moveTo(i, h); c.lineTo(i + 18, h); c.lineTo(i + 38, h - 26); c.lineTo(i + 20, h - 26); c.fill(); }
    c.fillStyle = '#111'; c.fillRect(0, h - 30, w, 4);
  });
}

export function archiveBoxTexture() {
  return canvasTex(256, 128, (c, w, h) => {
    const cols = ['#c9b48a', '#b9a57d', '#d6c29a', '#a99569', '#8f9aa6', '#c3b089'];
    const r = rng(17);
    for (let i = 0; i < 8; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(i * 32, 0, 31, h); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(i * 32 + 8, 40, 16, 22); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(i * 32 + 12, 46, 8, 2); c.fillRect(i * 32 + 12, 52, 8, 2); }
  });
}

export { strokeRR };
