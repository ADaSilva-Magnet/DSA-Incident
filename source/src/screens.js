// Everything shown on the case board display. Drawn on a 1600x900 canvas that is both the 3D screen texture
// and the flat "case board" close-up. Also draws the CCTV monitor wall inside the facility model.
import { UI_FONT, MONO_FONT, clamp, lerp, seg, smooth, easeOutBack, easeOutCubic, rrPath, fillRR, strokeRR, text, measure } from './util.js';
import { SUSPECTS, SUSPECT, facility, cctvClock, sm, k01 } from './sync.js';
import { GB, ISLANDS, PLACES, proj } from './ukmap.js';
import { CSS } from './palette.js';

const W = 1600, H = 900, TB = 56; // taskbar height
const BLUE = '#1673c6', INK = '#0f172a', SUB = '#475569', OKC = '#16a34a', BAD = '#dc2626';

// ------------------------------------------------------------------ chrome (same look as the other visualizers)
function makeBg() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0a1a33'); g.addColorStop(1, '#10284d');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const blob = (x, y, r, col) => { const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H); };
  blob(1150, 420, 520, 'rgba(56,140,255,0.38)');
  blob(1350, 600, 380, 'rgba(34,211,238,0.22)');
  blob(300, 760, 420, 'rgba(99,102,241,0.18)');
  return cv;
}

function icon(c, kind, x, y, s) {
  c.save();
  switch (kind) {
    case 'start': { const q = s * 0.46, gap = s * 0.08; for (let i = 0; i < 4; i++) fillRR(c, x + (i % 2) * (q + gap), y + Math.floor(i / 2) * (q + gap), q, q, 3, '#3aa0ff'); break; }
    case 'search': c.strokeStyle = '#dbe7f7'; c.lineWidth = s * 0.1; c.beginPath(); c.arc(x + s * 0.42, y + s * 0.42, s * 0.26, 0, Math.PI * 2); c.moveTo(x + s * 0.62, y + s * 0.62); c.lineTo(x + s * 0.86, y + s * 0.86); c.stroke(); break;
    case 'folder': fillRR(c, x, y + s * 0.2, s * 0.45, s * 0.2, 3, '#e6a817'); fillRR(c, x, y + s * 0.3, s, s * 0.62, 4, '#fcc934'); break;
    case 'case': fillRR(c, x + s * 0.3, y + s * 0.12, s * 0.4, s * 0.2, 4, '#94a3b8'); fillRR(c, x + s * 0.36, y + s * 0.18, s * 0.28, s * 0.14, 2, '#0f172a'); fillRR(c, x, y + s * 0.3, s, s * 0.62, 6, '#b45309'); c.fillStyle = '#fcd34d'; c.fillRect(x + s * 0.44, y + s * 0.5, s * 0.12, s * 0.12); break;
    case 'map': fillRR(c, x, y + s * 0.1, s, s * 0.8, 5, '#0e7490'); c.fillStyle = '#67e8f9'; c.beginPath(); c.arc(x + s * 0.5, y + s * 0.42, s * 0.2, 0, 7); c.fill(); c.beginPath(); c.moveTo(x + s * 0.34, y + s * 0.5); c.lineTo(x + s * 0.5, y + s * 0.82); c.lineTo(x + s * 0.66, y + s * 0.5); c.fill(); c.fillStyle = '#0e7490'; c.beginPath(); c.arc(x + s * 0.5, y + s * 0.42, s * 0.08, 0, 7); c.fill(); break;
    case 'cam': fillRR(c, x + s * 0.06, y + s * 0.28, s * 0.72, s * 0.34, 5, '#e2e8f0'); fillRR(c, x + s * 0.7, y + s * 0.34, s * 0.2, s * 0.22, 3, '#94a3b8'); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x + s * 0.2, y + s * 0.45, s * 0.06, 0, 7); c.fill(); c.fillStyle = '#94a3b8'; c.fillRect(x + s * 0.36, y + s * 0.62, s * 0.08, s * 0.24); c.fillRect(x + s * 0.2, y + s * 0.82, s * 0.4, s * 0.08); break;
    case 'user': c.fillStyle = '#cbd5e1'; c.beginPath(); c.arc(x + s / 2, y + s * 0.32, s * 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + s / 2, y + s * 0.9, s * 0.38, s * 0.3, 0, Math.PI, 0); c.fill(); break;
    case 'phone': fillRR(c, x + s * 0.24, y, s * 0.52, s, s * 0.12, '#e2e8f0'); fillRR(c, x + s * 0.3, y + s * 0.08, s * 0.4, s * 0.8, s * 0.06, '#1d4ed8'); break;
    case 'chat': fillRR(c, x, y + s * 0.08, s, s * 0.66, 8, '#7c3aed'); c.fillStyle = '#7c3aed'; c.beginPath(); c.moveTo(x + s * 0.2, y + s * 0.7); c.lineTo(x + s * 0.16, y + s * 0.95); c.lineTo(x + s * 0.42, y + s * 0.7); c.fill(); text(c, '?', x + s / 2, y + s * 0.6, { size: s * 0.5, weight: 800, color: '#fff', align: 'center' }); break;
    case 'doc': fillRR(c, x + s * 0.15, y, s * 0.7, s, 4, '#e2e8f0'); c.fillStyle = '#64748b'; for (let i = 0; i < 4; i++) c.fillRect(x + s * 0.27, y + s * (0.25 + i * 0.17), s * 0.46, s * 0.06); break;
    default: break;
  }
  c.restore();
}

function taskbar(c, active) {
  c.fillStyle = 'rgba(14,20,32,0.94)'; c.fillRect(0, H - TB, W, TB);
  c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, H - TB, W, 1);
  const icons = ['start', 'search', 'folder', 'case', 'map', 'cam', 'user', 'phone', 'chat'];
  const s = 34, gap = 58, x0 = W / 2 - (icons.length * gap) / 2 + (gap - s) / 2;
  icons.forEach((k, i) => {
    const x = x0 + i * gap, y = H - TB + 11;
    if (k === active) { fillRR(c, x - 8, y - 6, s + 16, s + 12, 8, 'rgba(255,255,255,0.1)'); fillRR(c, x + s / 2 - 9, H - 7, 18, 4, 2, '#60a5fa'); }
    icon(c, k, x, y, s);
  });
  text(c, '10:00 AM', W - 40, H - 30, { size: 18, color: '#dbe7f7', align: 'right', weight: 600 });
  text(c, 'Briefing room', W - 40, H - 10, { size: 15, color: '#93a4bd', align: 'right' });
}

function win(c, x, y, w, h, title, { dark = false, ic = null } = {}) {
  c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 40; c.shadowOffsetY = 14;
  fillRR(c, x, y, w, h, 14, dark ? '#0b1424' : '#ffffff'); c.restore();
  c.save(); rrPath(c, x, y, w, h, 14); c.clip();
  c.fillStyle = dark ? '#0f1d33' : '#eef2f7'; c.fillRect(x, y, w, 54);
  c.fillStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'; c.fillRect(x, y + 54, w, 1);
  c.restore();
  if (ic) icon(c, ic, x + 18, y + 11, 32);
  text(c, title, x + (ic ? 64 : 22), y + 36, { size: 22, weight: 600, color: dark ? '#dbe7f7' : '#1f2937' });
  const bc = dark ? '#9fb0c8' : '#475569', bx = x + w - 140, by = y + 27;
  c.save(); c.strokeStyle = bc; c.lineWidth = 2;
  c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 16, by); c.stroke();
  c.strokeRect(bx + 48, by - 8, 15, 15);
  c.beginPath(); c.moveTo(bx + 98, by - 8); c.lineTo(bx + 113, by + 7); c.moveTo(bx + 113, by - 8); c.lineTo(bx + 98, by + 7); c.stroke();
  c.restore();
  return { x: x + 30, y: y + 54 + 24, w: w - 60, h: h - 54 - 48 };
}

function mark(c, x, y, r, ok) {
  c.save();
  c.fillStyle = ok ? OKC : BAD; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = r * 0.28; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  if (ok) { c.moveTo(x - r * 0.45, y + r * 0.02); c.lineTo(x - r * 0.1, y + r * 0.38); c.lineTo(x + r * 0.5, y - r * 0.35); }
  else { c.moveTo(x - r * 0.38, y - r * 0.38); c.lineTo(x + r * 0.38, y + r * 0.38); c.moveTo(x + r * 0.38, y - r * 0.38); c.lineTo(x - r * 0.38, y + r * 0.38); }
  c.stroke(); c.restore();
}
function chip(c, s, x, y, { bg = '#e0ecff', fg = BLUE, size = 20, pad = 14, h = 34, align = 'left' } = {}) {
  const w = measure(c, s, size, 700) + pad * 2;
  const x0 = align === 'right' ? x - w : x;
  fillRR(c, x0, y, w, h, h / 2, bg);
  text(c, s, x0 + pad, y + h / 2 + size * 0.36, { size, weight: 700, color: fg });
  return w;
}
function wrap(c, s, x, y, maxW, o = {}) {
  const { size = 22, weight = 400, lh = size * 1.3 } = o;
  const words = s.split(' '); let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (measure(c, t, size, weight) > maxW && line) { text(c, line, x, yy, o); line = w; yy += lh; } else line = t;
  }
  if (line) text(c, line, x, yy, o);
  return yy;
}
function alphaIn(c, a, fn) { if (a <= 0.001) return; c.save(); c.globalAlpha *= clamp(a); fn(); c.restore(); }

// person avatar (head and shoulders) in a coloured circle; '?' for the unidentified person
function avatar(c, x, y, r, col, { q = false, ring = true } = {}) {
  c.save();
  fillRR(c, x - r, y - r, r * 2, r * 2, r, q ? '#ede9fe' : '#f1f5f9');
  c.save(); c.beginPath(); c.arc(x, y, r, 0, 7); c.clip();
  c.fillStyle = q ? '#a78bfa' : '#475569';
  c.beginPath(); c.arc(x, y - r * 0.18, r * 0.36, 0, 7); c.fill();
  c.beginPath(); c.ellipse(x, y + r * 0.86, r * 0.7, r * 0.58, 0, 0, 7); c.fill();
  c.restore();
  if (ring) { c.strokeStyle = col; c.lineWidth = Math.max(3, r * 0.09); c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); }
  if (q) text(c, '?', x, y - r * 0.02, { size: r * 0.62, weight: 900, color: '#fff', align: 'center', baseline: 'middle' });
  c.restore();
}

// the three phones, drawn as seen from the back (or the front)
function phone2D(c, key, x, y, h, side = 'back') {
  const kind = { lamb: 'iphone11', daytona: 'pixel6', pasdeigh: 'galaxyA51' }[key] || key;
  const w = h * ({ iphone11: 0.5, pixel6: 0.47, galaxyA51: 0.46 }[kind]), r = h * 0.075;
  c.save();
  if (side === 'front') {
    fillRR(c, x, y, w, h, r, '#111827'); fillRR(c, x + h * 0.02, y + h * 0.02, w - h * 0.04, h * 0.96, r * 0.8, '#1e293b');
    if (kind === 'iphone11') fillRR(c, x + w / 2 - h * 0.1, y + h * 0.02, h * 0.2, h * 0.035, h * 0.015, '#000');
    else { c.fillStyle = '#000'; c.beginPath(); c.arc(x + w / 2, y + h * 0.045, h * 0.016, 0, 7); c.fill(); }
    c.restore(); return w;
  }
  const lensAt = (lx, ly, lr) => { c.fillStyle = '#9aa3ae'; c.beginPath(); c.arc(lx, ly, lr, 0, 7); c.fill(); c.fillStyle = '#05070a'; c.beginPath(); c.arc(lx, ly, lr * 0.72, 0, 7); c.fill(); c.fillStyle = 'rgba(120,160,255,0.5)'; c.beginPath(); c.arc(lx - lr * 0.2, ly - lr * 0.2, lr * 0.2, 0, 7); c.fill(); };
  if (kind === 'iphone11') {
    fillRR(c, x, y, w, h, r, '#cfc6e0'); strokeRR(c, x, y, w, h, r, '#a79ec0', 2);
    fillRR(c, x + h * 0.035, y + h * 0.035, h * 0.235, h * 0.235, h * 0.06, '#bdb3d3');
    lensAt(x + h * 0.097, y + h * 0.097, h * 0.045); lensAt(x + h * 0.097, y + h * 0.207, h * 0.045);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(x + h * 0.207, y + h * 0.097, h * 0.018, 0, 7); c.fill();
    c.fillStyle = '#b6add0'; c.beginPath(); c.arc(x + w / 2, y + h * 0.48, h * 0.05, 0, 7); c.fill();
  } else if (kind === 'pixel6') {
    fillRR(c, x, y, w, h, r, '#a8cfbb'); c.save(); rrPath(c, x, y, w, h, r); c.clip(); c.fillStyle = '#d6eadf'; c.fillRect(x, y, w, h * 0.19); c.restore();
    strokeRR(c, x, y, w, h, r, '#6f8f7f', 2);
    fillRR(c, x - h * 0.004, y + h * 0.17, w + h * 0.008, h * 0.115, h * 0.05, '#0a0c0f');
    lensAt(x + h * 0.105, y + h * 0.2275, h * 0.04); lensAt(x + h * 0.2, y + h * 0.2275, h * 0.034);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(x + w - h * 0.1, y + h * 0.2275, h * 0.014, 0, 7); c.fill();
  } else {
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#2f4fa8'); g.addColorStop(0.5, '#4c74d6'); g.addColorStop(1, '#283f86');
    fillRR(c, x, y, w, h, r, g); strokeRR(c, x, y, w, h, r, '#1e3a8a', 2);
    fillRR(c, x + h * 0.04, y + h * 0.055, h * 0.13, h * 0.29, h * 0.04, '#111827');
    [0.112, 0.2, 0.288].forEach((dy) => lensAt(x + h * 0.081, y + dy * h, h * 0.03));
    lensAt(x + h * 0.14, y + h * 0.288, h * 0.021);
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(x + h * 0.14, y + h * 0.112, h * 0.012, 0, 7); c.fill();
    text(c, 'SAMSUNG', x + w / 2, y + h * 0.92, { size: h * 0.045, weight: 700, color: 'rgba(255,255,255,0.8)', align: 'center' });
  }
  c.restore();
  return w;
}

// ------------------------------------------------------------------ map of Great Britain
const GBP = GB.map(([lo, la]) => proj(lo, la));
const ISP = ISLANDS.map((pts) => pts.map(([lo, la]) => proj(lo, la)));
const MB = (() => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of GBP) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { x0: x0 - 0.9, x1: x1 + 0.4, z0: z0 - 0.35, z1: z1 + 0.25 }; })();
function mapFrame(x, y, w, h) {
  const s = Math.min(w / (MB.x1 - MB.x0), h / (MB.z1 - MB.z0));
  const ox = x + (w - (MB.x1 - MB.x0) * s) / 2, oy = y + (h - (MB.z1 - MB.z0) * s) / 2;
  return { s, P: (px, pz) => [ox + (px - MB.x0) * s, oy + (pz - MB.z0) * s] };
}
function ukMap(c, x, y, w, h, t, { only = null, labels = true, pop = [1, 1, 1] } = {}) {
  fillRR(c, x, y, w, h, 16, '#0b2140');
  c.save(); rrPath(c, x, y, w, h, 16); c.clip();
  c.strokeStyle = 'rgba(120,170,255,0.12)'; c.lineWidth = 1.5;
  for (let gx = x; gx < x + w; gx += 48) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + h); c.stroke(); }
  for (let gy = y; gy < y + h; gy += 48) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w, gy); c.stroke(); }
  const { P } = mapFrame(x + 10, y + 10, w - 20, h - 20);
  const poly = (pts) => { c.beginPath(); pts.forEach(([px, pz], i) => { const [X, Y] = P(px, pz); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
  c.fillStyle = '#2f4a66'; c.strokeStyle = '#5fd4ff'; c.lineWidth = 2;
  [GBP, ...ISP].forEach((pts) => { poly(pts); c.fill(); c.stroke(); });
  SUSPECTS.forEach((s, i) => {
    const a = pop[i]; if (a <= 0.01) return;
    const dim = only && only !== s.key;
    const p = PLACES[s.place], [px, pz] = proj(p.lon, p.lat), [X, Y] = P(px, pz);
    c.save(); c.globalAlpha *= clamp(a) * (dim ? 0.35 : 1);
    const ring = (t * 0.8 + i * 0.33) % 1;
    c.strokeStyle = s.color; c.lineWidth = 3; c.globalAlpha *= 1 - ring; c.beginPath(); c.arc(X, Y, 10 + ring * 26, 0, 7); c.stroke();
    c.restore();
    c.save(); c.globalAlpha *= clamp(a) * (dim ? 0.35 : 1);
    c.fillStyle = s.color; c.beginPath(); c.arc(X, Y, 10 * easeOutBack(clamp(a)), 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    if (labels && !dim) {
      const lx = X + 26, ly = Y + (s.place === 'eurotunnel' ? 30 : s.place === 'harwich' ? -18 : -24);
      const lab = p.name, lw = measure(c, lab, 19, 800) + 22;
      const bx = s.place === 'manchester' ? X - lw - 18 : Math.min(lx, x + w - lw - 8);
      fillRR(c, bx, ly - 22, lw, 32, 8, 'rgba(15,23,42,0.88)');
      text(c, lab, bx + 11, ly, { size: 19, weight: 800, color: s.color });
    }
    c.restore();
  });
  c.restore();
}

// ------------------------------------------------------------------ CCTV feeds
// One-point-perspective corridor, grey like CCTV footage. people: [{d (depth 0 near .. 1 far), off}]
function corridorFeed(c, x, y, w, h, { people = [], t = 0, label = 'CAM 03 · SUB-BASEMENT CORRIDOR', clock = '02:13:41', mode = 'live', small = false } = {}) {
  c.save(); rrPath(c, x, y, w, h, small ? 4 : 8); c.clip();
  c.fillStyle = '#1d2126'; c.fillRect(x, y, w, h);
  const vx = x + w * 0.52, vy = y + h * 0.42, ex = w * 0.13, ey = h * 0.17;
  c.fillStyle = '#3a3f46'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(vx + ex, vy + ey); c.lineTo(vx - ex, vy + ey); c.fill();
  c.fillStyle = '#2b3036'; c.beginPath(); c.moveTo(x, y); c.lineTo(vx - ex, vy - ey); c.lineTo(vx - ex, vy + ey); c.lineTo(x, y + h); c.fill();
  c.fillStyle = '#30353b'; c.beginPath(); c.moveTo(x + w, y); c.lineTo(vx + ex, vy - ey); c.lineTo(vx + ex, vy + ey); c.lineTo(x + w, y + h); c.fill();
  c.fillStyle = '#25292e'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(vx + ex, vy - ey); c.lineTo(vx - ex, vy - ey); c.fill();
  c.fillStyle = '#4b5058'; c.fillRect(vx - ex, vy - ey, ex * 2, ey * 2);
  c.fillStyle = '#5b616a'; c.fillRect(vx - ex * 0.55, vy - ey * 0.7, ex * 1.1, ey * 1.7);
  for (let i = 0; i < 4; i++) { const u = 0.15 + i * 0.22, lx = lerp(x + w / 2, vx, u), ly = lerp(y + h * 0.02, vy - ey, u), lw = lerp(w * 0.18, ex * 0.5, u); c.fillStyle = 'rgba(230,236,245,0.55)'; c.fillRect(lx - lw / 2, ly, lw, Math.max(2, h * 0.012 * (1 - u))); }
  c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1;
  for (let i = 1; i < 6; i++) { const u = i / 6; c.beginPath(); c.moveTo(lerp(x, vx - ex, u), lerp(y + h, vy + ey, u)); c.lineTo(lerp(x + w, vx + ex, u), lerp(y + h, vy + ey, u)); c.stroke(); }
  // people (dark silhouettes)
  people.slice().sort((a, b) => b.d - a.d).forEach((p) => {
    const u = clamp(p.d); const sc = lerp(1, 0.22, u);
    const fx = lerp(vx + p.off * w * 0.32, vx + p.off * ex, u), fy = lerp(y + h * 1.02, vy + ey, u);
    const ph = h * 0.78 * sc, pw = ph * 0.3;
    c.fillStyle = 'rgba(8,9,11,0.92)';
    c.beginPath(); c.ellipse(fx, fy - ph * 0.88, pw * 0.32, pw * 0.36, 0, 0, 7); c.fill();
    fillRR(c, fx - pw / 2, fy - ph * 0.78, pw, ph * 0.46, pw * 0.3, 'rgba(8,9,11,0.92)');
    c.fillRect(fx - pw * 0.36, fy - ph * 0.34, pw * 0.3, ph * 0.34); c.fillRect(fx + pw * 0.06, fy - ph * 0.34, pw * 0.3, ph * 0.34);
  });
  // grain + scanlines
  c.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < h; i += 3) c.fillRect(x, y + i, w, 1);
  const r = Math.sin(t * 37.1) * 43758.5453; let s = r - Math.floor(r);
  for (let i = 0; i < (small ? 30 : 120); i++) { s = (s * 9301 + 49297) % 233280 / 233280; const nx = x + s * w; s = (s * 9301 + 49297) % 233280 / 233280; c.fillStyle = `rgba(255,255,255,${0.04 + s * 0.06})`; c.fillRect(nx, y + s * h, 2, 2); }
  if (mode === 'glitch') {
    for (let i = 0; i < 9; i++) { s = (s * 9301 + 49297) % 233280 / 233280; c.fillStyle = `rgba(${s > 0.5 ? '255,90,79' : '200,200,255'},0.35)`; c.fillRect(x, y + s * h, w, 4 + s * 22); }
  }
  // overlay
  const fs = small ? 11 : 20;
  text(c, label, x + fs * 0.6, y + fs * 1.3, { size: fs, weight: 700, color: '#e5e7eb', family: MONO_FONT });
  text(c, clock, x + w - fs * 0.6, y + fs * 1.3, { size: fs, weight: 700, color: '#e5e7eb', family: MONO_FONT, align: 'right' });
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x + fs * 0.9, y + h - fs * 0.9, fs * 0.32, 0, 7); c.fill(); }
  text(c, 'REC', x + fs * 1.5, y + h - fs * 0.55, { size: fs * 0.85, weight: 800, color: '#e5e7eb', family: MONO_FONT });
  c.restore();
}
// The control room's monitor wall (6 feeds). Used as a texture inside the facility model.
const WALL_FEEDS = ['CAM 01 · YARD', 'CAM 02 · GATE', 'CAM 03 · CORRIDOR', 'CAM 04 · VAULT', 'CAM 05 · ARCHIVE', 'CAM 06 · CONTROL'];
export function drawCctvWall(c, w, h, feeds, lt, time) {
  c.fillStyle = '#05070a'; c.fillRect(0, 0, w, h);
  const cw = w / 3, ch = h / 2;
  const looped = feeds === 'loop';
  const clock = feeds === 'live' ? '02:13:41' : cctvClock(lt, looped);
  WALL_FEEDS.forEach((lab, i) => {
    const x = (i % 3) * cw + 3, y = Math.floor(i / 3) * ch + 3;
    corridorFeed(c, x, y, cw - 6, ch - 6, { t: time + i, label: lab, clock, mode: feeds === 'glitch' ? 'glitch' : 'live', small: true });
    if (looped) { c.strokeStyle = '#f472b6'; c.lineWidth = 4; c.strokeRect(x + 2, y + 2, cw - 10, ch - 10); }
  });
  if (looped) {
    fillRR(c, w / 2 - 92, h / 2 - 18, 184, 36, 8, 'rgba(131,24,67,0.92)');
    text(c, '⟲  LOOPED FEED', w / 2, h / 2 + 7, { size: 20, weight: 800, color: '#fdf2f8', align: 'center' });
  }
}

// ------------------------------------------------------------------ screens
const REPORT = [
  ['Reported by', 'Diana Tavener, Director of the DSA'],
  ['When', 'Early hours of the morning'],
  ['Entry', 'Disused access hatch · internal security bypassed'],
  ['Taken', 'Classified computing terminal (secure sub-basement vault)'],
  ['Cyber-attack', 'CCTV replaced with a looped recording'],
];
function sOverview(c, t) {
  const r = win(c, 50, 30, 1500, 790, 'Case file — Darlington Signals Archive (DSA)', { ic: 'case' });
  text(c, 'Government security incident', r.x, r.y + 30, { size: 42, weight: 800, color: INK });
  text(c, 'Darlington Signals Archive · classified facility storing highly sensitive intelligence material', r.x, r.y + 72, { size: 22, color: SUB });
  REPORT.forEach(([k, v], i) => {
    alphaIn(c, smooth(seg(t, 0.2 + i * 0.25, 0.6 + i * 0.25)), () => {
      const y = r.y + 108 + i * 92;
      fillRR(c, r.x, y, 900, 80, 12, i % 2 ? '#ffffff' : '#f3f6fb');
      text(c, k.toUpperCase(), r.x + 22, y + 33, { size: 17, weight: 800, color: '#64748b' });
      text(c, v, r.x + 22, y + 63, { size: 25, weight: 700, color: INK });
    });
  });
  const tiles = [
    ['3', 'suspects arrested', 'while leaving the UK', '#0b5cad', '#dbeafe'],
    ['1', 'suspect at large', 'identity unknown', '#6d28d9', '#ede9fe'],
    ['✗', 'terminal not recovered', 'highest security sensitivity', '#b91c1c', '#fee2e2'],
    ['3', 'devices submitted', 'for forensic examination', '#047857', '#d1fae5'],
  ];
  tiles.forEach(([n, a, b, fg, bg], i) => {
    alphaIn(c, smooth(seg(t, 1.2 + i * 0.25, 1.6 + i * 0.25)), () => {
      const x = r.x + 940, y = r.y + 108 + i * 140, w = r.w - 940;
      fillRR(c, x, y, w, 124, 16, bg);
      text(c, n, x + 58, y + 84, { size: 64, weight: 900, color: fg, align: 'center' });
      text(c, a, x + 116, y + 56, { size: 28, weight: 800, color: fg });
      text(c, b, x + 116, y + 92, { size: 20, weight: 600, color: SUB, maxWidth: w - 136 });
    });
  });
  text(c, 'Course scenario — the details as given in the manual', r.x, r.y + r.h - 4, { size: 18, color: '#94a3b8' });
}

function sectionDiagram(c, x, y, w, h, hl = null) {
  const gy = y + h * 0.42;
  fillRR(c, x, y, w, h, 14, '#f8fafc');
  c.fillStyle = '#d6ccbf'; c.fillRect(x + 20, gy, w - 40, h - (gy - y) - 30);
  c.fillStyle = '#7ba05b'; c.fillRect(x + 20, gy - 8, w - 40, 10);
  const bx = x + w * 0.45, bw = w * 0.45;
  fillRR(c, bx, gy - h * 0.26, bw, h * 0.26, 4, '#cbd5e1'); strokeRR(c, bx, gy - h * 0.26, bw, h * 0.26, 4, '#64748b', 2);
  text(c, 'Control room', bx + 12, gy - h * 0.15, { size: 17, weight: 700, color: '#334155' });
  text(c, 'Archive', bx + bw * 0.62, gy - h * 0.15, { size: 17, weight: 700, color: '#334155' });
  const cy = gy + h * 0.22, ch = h * 0.17;
  const corr = [x + w * 0.1, cy, w * 0.5, ch], vault = [x + w * 0.6, cy - h * 0.05, w * 0.3, ch + h * 0.05], shaft = [x + w * 0.1, gy, w * 0.07, cy - gy];
  const draw = (b, col, lab, key) => { fillRR(c, b[0], b[1], b[2], b[3], 4, hl === key ? col : '#e2e8f0'); strokeRR(c, b[0], b[1], b[2], b[3], 4, '#475569', 2); if (lab) text(c, lab, b[0] + 10, b[1] + b[3] / 2 + 7, { size: 17, weight: 800, color: hl === key ? '#fff' : '#334155' }); };
  draw(shaft, '#64748b', '', 'hatch'); draw(corr, '#475569', 'Corridor', 'corridor'); draw(vault, '#b45309', 'Vault', 'vault');
  fillRR(c, x + w * 0.093, gy - 10, w * 0.084, 10, 3, hl === 'hatch' ? '#f97316' : '#6b4f3a');
  text(c, 'Hatch', x + w * 0.135, gy - 18, { size: 17, weight: 800, color: '#7c2d12', align: 'center' });
  text(c, 'Ground level', x + w - 30, gy - 16, { size: 15, weight: 700, color: '#3f6212', align: 'right' });
  text(c, 'Sub-basement', x + 30, y + h - 44, { size: 15, weight: 700, color: '#78350f' });
  text(c, 'Model layout — illustrative', x + w / 2, y + h - 12, { size: 15, color: '#94a3b8', align: 'center' });
}
function sFacility(c, t) {
  const r = win(c, 50, 30, 1500, 790, 'Site profile — Darlington Signals Archive', { ic: 'doc' });
  text(c, 'Darlington Signals Archive (DSA)', r.x, r.y + 30, { size: 40, weight: 800, color: INK });
  const rows = [
    ['Type', 'Classified facility'],
    ['Responsible for', 'Storing highly sensitive intelligence material'],
    ['Director', 'Diana Tavener — reported the incident'],
    ['Secure area', 'Sub-basement vault'],
    ['Systems', 'Internal security systems · CCTV system'],
  ];
  rows.forEach(([k, v], i) => alphaIn(c, smooth(seg(t, 0.2 + i * 0.22, 0.6 + i * 0.22)), () => {
    const y = r.y + 70 + i * 104;
    fillRR(c, r.x, y, 720, 90, 12, '#f3f6fb');
    text(c, k.toUpperCase(), r.x + 22, y + 34, { size: 17, weight: 800, color: '#64748b' });
    text(c, v, r.x + 22, y + 68, { size: 24, weight: 700, color: INK });
  }));
  sectionDiagram(c, r.x + 760, r.y + 70, r.w - 760, 506);
  text(c, 'The manual doesn\'t describe the building — the model is an illustration', r.x, r.y + r.h - 4, { size: 18, color: '#94a3b8' });
}

const EVENTS = [
  ['1', 'Entry via a disused access hatch', 'Unknown individuals gain access'],
  ['2', 'Internal security systems bypassed', 'How is not stated'],
  ['3', 'Classified terminal removed', 'From a secure sub-basement vault'],
];
function sTimeline(c, t, cur) {
  const r = win(c, 50, 30, 1500, 790, 'Sequence of events — early hours of the morning', { ic: 'doc' });
  chip(c, 'Reported by Diana Tavener, Director of the DSA', r.x, r.y - 4, { size: 19, bg: '#eef2f7', fg: '#334155' });
  if (cur !== 'all') text(c, 'In the order the manual gives · no times are stated', r.x + r.w, r.y + 20, { size: 18, color: '#94a3b8', align: 'right' });
  const lx = r.x + 250, lw = r.w - 260, cw = (lw - 40) / 3;
  text(c, 'Physical', r.x, r.y + 108, { size: 26, weight: 800, color: INK });
  text(c, 'intrusion', r.x, r.y + 138, { size: 26, weight: 800, color: INK });
  text(c, 'on site', r.x, r.y + 168, { size: 19, color: SUB });
  c.strokeStyle = '#cbd5e1'; c.lineWidth = 6; c.beginPath(); c.moveTo(lx, r.y + 248); c.lineTo(lx + lw, r.y + 248); c.stroke();
  EVENTS.forEach(([n, a, b], i) => {
    const x = lx + i * (cw + 20), y = r.y + 60, on = cur === 'all' || cur === i, done = typeof cur === 'number' && i < cur;
    const col = on ? '#e2e8f0' : '#94a3b8';
    fillRR(c, x, y, cw, 150, 16, on ? '#0f172a' : '#f8fafc'); strokeRR(c, x, y, cw, 150, 16, on ? '#f59e0b' : '#e2e8f0', on ? 4 : 2);
    fillRR(c, x + 18, y + 20, 44, 44, 22, on ? '#f59e0b' : done ? '#64748b' : '#cbd5e1');
    text(c, n, x + 40, y + 51, { size: 24, weight: 900, color: '#fff', align: 'center' });
    wrap(c, a, x + 76, y + 46, cw - 92, { size: 23, weight: 800, color: on ? '#fff' : INK, lh: 28 });
    wrap(c, b, x + 18, y + 120, cw - 36, { size: 18, weight: 600, color: on ? '#fcd34d' : col, lh: 22 });
    c.fillStyle = on ? '#f59e0b' : done ? '#64748b' : '#cbd5e1'; c.beginPath(); c.arc(x + cw / 2, r.y + 248, on ? 14 : 10, 0, 7); c.fill();
  });
  // simultaneous cyber-attack lane
  const cyOn = cur === 'cyber' || cur === 'all';
  text(c, 'Cyber-attack', r.x, r.y + 360, { size: 26, weight: 800, color: INK });
  text(c, 'at the same time', r.x, r.y + 390, { size: 19, color: SUB });
  fillRR(c, lx, r.y + 310, lw, 110, 16, cyOn ? '#4a0d24' : '#fdf2f8'); strokeRR(c, lx, r.y + 310, lw, 110, 16, cyOn ? '#f472b6' : '#fbcfe8', cyOn ? 4 : 2);
  text(c, 'CCTV system compromised — live feed replaced with a looped recording', lx + 26, r.y + 356, { size: 24, weight: 800, color: cyOn ? '#fdf2f8' : '#9d174d' });
  text(c, 'Allowed the offenders to operate undetected', lx + 26, r.y + 392, { size: 20, weight: 600, color: cyOn ? '#fbcfe8' : '#be185d' });
  if (cur === 'all') {
    c.save(); c.setLineDash([10, 8]); c.strokeStyle = '#7c3aed'; c.lineWidth = 3;
    c.strokeRect(lx - 12, r.y + 48, lw + 24, 384); c.restore();
    chip(c, 'Coordinated · simultaneous', lx + lw + 12, r.y + 32, { size: 18, bg: '#ede9fe', fg: '#6d28d9', align: 'right', h: 30 });
  }
  // progress marker
  if (typeof cur === 'number') {
    const p = clamp(t / 2.2), mx = lerp(lx, lx + cur * (cw + 20) + cw / 2, easeOutCubic(p));
    c.fillStyle = '#f59e0b'; c.beginPath(); c.moveTo(mx, r.y + 236); c.lineTo(mx - 12, r.y + 214); c.lineTo(mx + 12, r.y + 214); c.fill();
  }
  // footer
  fillRR(c, r.x, r.y + 470, r.w, 190, 16, '#0f172a');
  const lines = {
    0: ['The offenders entered via a disused access hatch.', 'More than one person — the manual refers to "unknown individuals".'],
    1: ['Once inside, internal security systems were bypassed.', 'The manual doesn\'t say which systems, or how.'],
    2: ['A classified computing terminal was removed from the vault.', 'Believed to contain material of the highest national security sensitivity.'],
    cyber: ['Investigators believe the intrusion was coordinated with a simultaneous cyber-attack.', 'The CCTV showed a looped recording instead of the live feed.'],
    all: ['Multiple individuals are suspected, working in a coordinated manner.', 'Physical intrusion and cyber-attack happened at the same time.'],
  }[cur];
  text(c, lines[0], r.x + 30, r.y + 545, { size: 28, weight: 800, color: '#f8fafc' });
  text(c, lines[1], r.x + 30, r.y + 595, { size: 23, color: '#bfdbfe' });
}

function sCCTV(c, t) {
  const st = facility('cctv', t);
  const looped = st.feeds === 'loop', glitch = st.feeds === 'glitch';
  const r = win(c, 40, 24, 1520, 800, 'CCTV — security control room', { dark: true, ic: 'cam' });
  const fw = (r.w - 30) / 2, fh = fw * 0.56, fy = r.y + 46;
  text(c, 'WHAT THE MONITORS SHOWED', r.x, r.y + 22, { size: 20, weight: 800, color: '#9fb0c8' });
  text(c, 'WHAT WAS ACTUALLY HAPPENING', r.x + fw + 30, r.y + 22, { size: 20, weight: 800, color: '#9fb0c8' });
  // corridor camera: x = -0.6 looking toward the shaft (-x); depth from the camera
  const people = (st.figs || []).map((f) => ({ d: clamp((-0.6 - f.x) / 2.4), off: (f.z - 2.15) * -0.9, x: f.x })).filter((p) => p.x < -0.75);
  const clock = cctvClock(t, looped);
  corridorFeed(c, r.x, fy, fw, fh, { t, clock, mode: glitch ? 'glitch' : 'live', people: looped ? [] : people });
  corridorFeed(c, r.x + fw + 30, fy, fw, fh, { t: t + 3, clock: cctvClock(t, false), people });
  if (looped) {
    strokeRR(c, r.x, fy, fw, fh, 8, '#f472b6', 5);
    fillRR(c, r.x + fw - 346, fy + fh - 62, 330, 44, 10, 'rgba(131,24,67,0.92)');
    text(c, '⟲  Looped recording', r.x + fw - 328, fy + fh - 32, { size: 22, weight: 800, color: '#fdf2f8' });
  }
  strokeRR(c, r.x + fw + 30, fy, fw, fh, 8, 'rgba(255,255,255,0.25)', 2);
  if (people.length && looped) {
    const bw = measure(c, 'Offenders — undetected', 22, 800) + 36;
    fillRR(c, r.x + r.w - bw - 16, fy + fh - 62, bw, 44, 10, 'rgba(120,53,15,0.92)');
    text(c, 'Offenders — undetected', r.x + r.w - bw + 2, fy + fh - 32, { size: 22, weight: 800, color: '#fef3c7' });
  }
  const by = fy + fh + 28;
  fillRR(c, r.x, by, r.w, 150, 16, looped ? '#4a0d24' : glitch ? '#3b1d0f' : '#0f2a1e');
  if (looped) {
    text(c, 'CCTV compromised: the live feed was replaced with a looped recording', r.x + 28, by + 58, { size: 28, weight: 800, color: '#fdf2f8' });
    text(c, 'The monitors kept showing an empty corridor — allowing the offenders to operate undetected.', r.x + 28, by + 104, { size: 22, color: '#fbcfe8' });
  } else if (glitch) {
    text(c, 'Cyber-attack in progress…', r.x + 28, by + 58, { size: 28, weight: 800, color: '#fed7aa' });
    text(c, 'Investigators believe it was coordinated with the physical intrusion.', r.x + 28, by + 104, { size: 22, color: '#fde68a' });
  } else {
    text(c, 'Cameras live', r.x + 28, by + 58, { size: 28, weight: 800, color: '#bbf7d0' });
    text(c, 'Before the attack, the monitors show what the cameras see.', r.x + 28, by + 104, { size: 22, color: '#a7f3d0' });
  }
  text(c, 'Illustration — camera names, layout and times are not from the manual', r.x + r.w, r.y + r.h + 6, { size: 17, color: '#64748b', align: 'right' });
}

function sTeam(c, t) { sTimeline(c, t, 'all'); }

function sMap(c, t) {
  const r = win(c, 40, 24, 1520, 800, 'Arrests — attempting to leave the United Kingdom', { ic: 'map' });
  const pop = SUSPECTS.map((s, i) => sm(t, 0.25 + i * 0.45, 0.7 + i * 0.45));
  ukMap(c, r.x, r.y - 6, 560, r.h + 12, t, { pop });
  const cx = r.x + 600, cw = r.w - 600;
  text(c, 'Three suspects arrested', cx, r.y + 26, { size: 36, weight: 800, color: INK });
  text(c, 'each at a different way out of the country', cx, r.y + 62, { size: 22, color: SUB });
  SUSPECTS.forEach((s, i) => alphaIn(c, pop[i], () => {
    const y = r.y + 96 + i * 186;
    fillRR(c, cx, y, cw, 168, 16, '#f8fafc'); strokeRR(c, cx, y, cw, 168, 16, s.color, 3);
    fillRR(c, cx, y, 14, 168, 7, s.color);
    avatar(c, cx + 80, y + 84, 50, s.color);
    text(c, s.name, cx + 150, y + 54, { size: 30, weight: 800, color: INK });
    text(c, s.placeName, cx + 150, y + 96, { size: 25, weight: 700, color: '#0b5cad' });
    text(c, `${s.roleLabel}: ${s.roleShort}`, cx + 150, y + 134, { size: 20, color: SUB });
    chip(c, s.mode.toUpperCase(), cx + cw - 24, y + 22, { size: 18, bg: '#0f172a', fg: '#fff', align: 'right' });
  }));
  text(c, 'Rail · sea · air: the Eurotunnel terminal, a ferry port and an airport. Map positions are approximate.', cx, r.y + r.h - 4, { size: 17, color: '#94a3b8' });
}

function sProfile(c, t, key) {
  const s = SUSPECT[key];
  const r = win(c, 40, 24, 1520, 800, `Suspect profile — ${s.name}`, { ic: 'user' });
  avatar(c, r.x + 90, r.y + 90, 86, s.color);
  text(c, s.name, r.x + 210, r.y + 70, { size: 46, weight: 900, color: INK });
  const aw = chip(c, 'ARRESTED', r.x + 210, r.y + 96, { size: 19, bg: '#1d4ed8', fg: '#fff' });
  chip(c, `Device: ${s.device}`, r.x + 210 + aw + 10, r.y + 96, { size: 19, bg: '#eef2f7', fg: '#334155' });
  const rows = [[s.roleLabel, s.role], ['Arrested at', s.placeName], [s.noteLabel, s.note], ['Device submitted for analysis', `${s.device} (${s.os})`]];
  rows.forEach(([k, v], i) => alphaIn(c, smooth(seg(t, 0.2 + i * 0.2, 0.55 + i * 0.2)), () => {
    const y = r.y + 210 + i * 112;
    fillRR(c, r.x, y, 900, 98, 12, i % 2 ? '#ffffff' : '#f3f6fb');
    fillRR(c, r.x, y, 10, 98, 5, s.color);
    text(c, k.toUpperCase(), r.x + 28, y + 36, { size: 17, weight: 800, color: '#64748b' });
    wrap(c, v, r.x + 28, y + 72, 850, { size: 25, weight: 700, color: INK });
  }));
  ukMap(c, r.x + 940, r.y - 6, 270, 450, t, { only: key, labels: false });
  const d = smooth(seg(t, 0.4, 1.4));
  alphaIn(c, d, () => {
    const ph = 300, px = r.x + 1250;
    phone2D(c, key, px, r.y + 40 + (1 - d) * 30, ph, 'back');
    text(c, s.deviceShort, px + ph * 0.24, r.y + 372, { size: 22, weight: 800, color: INK, align: 'center', maxWidth: 230 });
    text(c, s.os, px + ph * 0.24, r.y + 400, { size: 19, weight: 600, color: SUB, align: 'center' });
  });
  fillRR(c, r.x + 940, r.y + 470, r.w - 940, 168, 14, '#0f172a');
  text(c, 'ARREST LOCATION', r.x + 966, r.y + 510, { size: 16, weight: 800, color: '#94a3b8' });
  text(c, s.placeName, r.x + 966, r.y + 552, { size: 27, weight: 800, color: s.color });
  text(c, `Attempting to leave the UK · ${s.mode.toLowerCase()}`, r.x + 966, r.y + 592, { size: 20, color: '#cbd5e1' });
}

function terminalIcon(c, x, y, s, ghost = false) {
  c.save();
  if (ghost) { c.setLineDash([8, 6]); c.strokeStyle = '#d97706'; c.lineWidth = 3; strokeRR(c, x, y + s * 0.45, s, s * 0.32, 6, '#d97706', 3); strokeRR(c, x + s * 0.08, y, s * 0.84, s * 0.5, 8, '#d97706', 3); c.restore(); return; }
  fillRR(c, x, y + s * 0.45, s, s * 0.32, 6, '#404b3d'); fillRR(c, x + s * 0.08, y, s * 0.84, s * 0.5, 8, '#404b3d');
  fillRR(c, x + s * 0.14, y + s * 0.06, s * 0.72, s * 0.38, 4, '#04140c');
  fillRR(c, x + s * 0.2, y + s * 0.56, s * 0.6, s * 0.12, 3, '#b91c1c');
  c.restore();
}
function sAtLarge(c, t) {
  const r = win(c, 40, 24, 1520, 800, 'Outstanding', { ic: 'case' });
  const cw = (r.w - 30) / 2;
  [0, 1].forEach((i) => alphaIn(c, smooth(seg(t, 0.2 + i * 0.4, 0.7 + i * 0.4)), () => {
    const x = r.x + i * (cw + 30), y = r.y;
    fillRR(c, x, y, cw, 560, 20, i ? '#fef2f2' : '#f5f3ff'); strokeRR(c, x, y, cw, 560, 20, i ? '#ef4444' : '#a78bfa', 3);
    if (!i) {
      avatar(c, x + cw / 2, y + 130, 92, '#a78bfa', { q: true });
      text(c, 'Fourth individual', x + cw / 2, y + 278, { size: 38, weight: 900, color: '#4c1d95', align: 'center' });
      text(c, 'Unidentified', x + cw / 2, y + 318, { size: 25, weight: 700, color: '#6d28d9', align: 'center' });
      wrap(c, 'Believed to be the coordinating authority behind the operation', x + 50, y + 380, cw - 100, { size: 25, weight: 600, color: '#334155', lh: 32 });
      chip(c, 'AT LARGE', x + cw / 2 - 70, y + 470, { size: 24, bg: '#6d28d9', fg: '#fff', h: 44, pad: 22 });
    } else {
      terminalIcon(c, x + cw / 2 - 90, y + 50, 180, false);
      c.save(); c.translate(x + cw / 2 + 120, y + 200); c.rotate(-0.25); strokeRR(c, -100, -30, 200, 60, 6, '#ef4444', 6); text(c, 'MISSING', 0, 16, { size: 38, weight: 900, color: '#ef4444', align: 'center' }); c.restore();
      text(c, 'Stolen terminal', x + cw / 2, y + 278, { size: 38, weight: 900, color: '#7f1d1d', align: 'center' });
      text(c, 'Classified computing terminal', x + cw / 2, y + 318, { size: 25, weight: 700, color: '#b91c1c', align: 'center' });
      wrap(c, 'Believed to contain material of the highest national security sensitivity', x + 50, y + 380, cw - 100, { size: 25, weight: 600, color: '#334155', lh: 32 });
      chip(c, 'NOT YET RECOVERED', x + cw / 2 - 140, y + 470, { size: 24, bg: '#b91c1c', fg: '#fff', h: 44, pad: 22 });
    }
  }));
  fillRR(c, r.x, r.y + 590, r.w, 82, 14, '#0f172a');
  text(c, 'Three suspects are in custody — the coordinator and the terminal are still missing.', r.x + 28, r.y + 642, { size: 25, weight: 700, color: '#f8fafc' });
}

function sDevices(c, t) {
  const r = win(c, 40, 24, 1520, 800, 'Evidence submitted for forensic examination', { ic: 'phone' });
  const cols = [r.x + 150, r.x + 560, r.x + 790, r.x + 1110];
  fillRR(c, r.x, r.y - 6, r.w, 54, 10, '#0f2747');
  ['Device', 'Platform', 'Seized from', 'Arrested at'].forEach((s, i) => text(c, s, cols[i], r.y + 29, { size: 22, weight: 800, color: '#e2e8f0' }));
  SUSPECTS.forEach((s, i) => alphaIn(c, smooth(seg(t, 0.3 + i * 0.45, 0.8 + i * 0.45)), () => {
    const y = r.y + 64 + i * 160;
    fillRR(c, r.x, y, r.w, 146, 14, i % 2 ? '#ffffff' : '#f3f6fb'); fillRR(c, r.x, y, 12, 146, 6, s.color);
    phone2D(c, s.key, r.x + 52, y + 12, 122, 'back');
    text(c, s.device, cols[0], y + 66, { size: 29, weight: 800, color: INK });
    text(c, 'Sealed evidence bag', cols[0], y + 102, { size: 19, color: SUB });
    chip(c, s.os, cols[1], y + 52, { size: 21, bg: s.os === 'iOS' ? '#e0e7ff' : '#dcfce7', fg: s.os === 'iOS' ? '#3730a3' : '#166534' });
    text(c, s.name, cols[2], y + 78, { size: 25, weight: 700, color: INK });
    text(c, s.placeName, cols[3], y + 78, { size: 23, weight: 600, color: '#334155', maxWidth: r.x + r.w - cols[3] - 16 });
  }));
  fillRR(c, r.x, r.y + 560, r.w, 112, 14, '#0f172a');
  text(c, 'Believed to contain critical evidence relating to both', r.x + 28, r.y + 604, { size: 25, weight: 700, color: '#f8fafc' });
  text(c, 'the physical breach and the associated cyber intrusion.', r.x + 28, r.y + 642, { size: 25, weight: 700, color: '#93c5fd' });
}

function sTogether(c, t) {
  const r = win(c, 30, 20, 1540, 810, 'Case at a glance', { ic: 'case' });
  const cx = r.x + r.w / 2, cy = r.y + 330;
  const nodes = [
    { x: cx - 520, y: cy - 200, col: SUSPECT.lamb.color, a: 'Jackson Lamb', b: 'Physical entry & removal', c: 'Eurotunnel terminal · iPhone 11' },
    { x: cx + 520, y: cy - 200, col: SUSPECT.pasdeigh.color, a: 'Joseph Pasdeigh', b: 'Network intrusion', c: 'Manchester Airport · Galaxy A51' },
    { x: cx - 520, y: cy + 200, col: SUSPECT.daytona.color, a: 'Jackie Daytona', b: 'Logistics & coordination', c: 'Harwich Int. Port · Pixel 6' },
    { x: cx + 520, y: cy + 200, col: '#a78bfa', a: 'Unidentified', b: 'Coordinating authority', c: 'At large', q: true },
    { x: cx, y: cy + 285, col: '#ef4444', a: 'Classified terminal', b: 'Not yet recovered', c: '', term: true },
  ];
  nodes.forEach((n, i) => {
    c.save(); c.strokeStyle = 'rgba(148,163,184,0.55)'; c.lineWidth = 4; if (n.q || n.term) c.setLineDash([12, 9]);
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(n.x, n.y); c.stroke(); c.restore();
    for (let q = 0; q < 3; q++) { const u = (t * 0.35 + q / 3 + i * 0.11) % 1; c.fillStyle = n.col; c.beginPath(); c.arc(lerp(cx, n.x, u), lerp(cy, n.y, u), 7, 0, 7); c.fill(); }
  });
  fillRR(c, cx - 170, cy - 70, 340, 140, 20, '#0f172a');
  text(c, 'DSA incident', cx, cy - 12, { size: 34, weight: 900, color: '#fff', align: 'center' });
  text(c, 'Darlington Signals Archive', cx, cy + 28, { size: 20, weight: 600, color: '#93c5fd', align: 'center' });
  nodes.forEach((n) => {
    const w = 420, h = 120, x = n.x - w / 2, y = n.y - h / 2;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.18)'; c.shadowBlur = 14; fillRR(c, x, y, w, h, 16, '#ffffff'); c.restore();
    strokeRR(c, x, y, w, h, 16, n.col, 4); fillRR(c, x, y, 14, h, 7, n.col);
    if (n.term) terminalIcon(c, x + 26, y + 26, 70, true); else avatar(c, x + 66, y + 60, 40, n.col, { q: !!n.q });
    text(c, n.a, x + 120, y + 42, { size: 26, weight: 800, color: INK });
    text(c, n.b, x + 120, y + 74, { size: 20, weight: 700, color: '#334155', maxWidth: w - 136 });
    if (n.c) text(c, n.c, x + 120, y + 102, { size: 18, color: SUB, maxWidth: w - 136 });
  });
}

const QUESTIONS = [
  'What artifacts or areas of the mobile devices should be examined within Axiom?',
  'Where could we expect to find evidence relating to the incident?',
  'What applications could have been used on the devices?',
  'What about file storage applications?',
];
function sDiscuss(c, t) {
  const r = win(c, 40, 24, 1520, 800, 'Instructor-led discussion — Artifacts checklist', { ic: 'chat' });
  text(c, 'With the scenario briefed…', r.x, r.y + 26, { size: 36, weight: 800, color: INK });
  QUESTIONS.forEach((q, i) => alphaIn(c, smooth(seg(t, 0.2 + i * 0.3, 0.6 + i * 0.3)), () => {
    const y = r.y + 64 + i * 128;
    fillRR(c, r.x, y, 820, 112, 14, '#f5f3ff');
    fillRR(c, r.x + 20, y + 30, 52, 52, 26, '#7c3aed');
    text(c, String(i + 1), r.x + 46, y + 66, { size: 28, weight: 900, color: '#fff', align: 'center' });
    wrap(c, q, r.x + 96, y + 48, 700, { size: 25, weight: 700, color: INK, lh: 31 });
  }));
  const nx = r.x + 860, nw = r.w - 860;
  fillRR(c, nx, r.y + 64, nw, 496, 14, '#fffbeb'); strokeRR(c, nx, r.y + 64, nw, 496, 14, '#fcd34d', 2);
  text(c, 'Investigative avenues', nx + 24, r.y + 108, { size: 26, weight: 800, color: '#92400e' });
  c.strokeStyle = '#fde68a'; c.lineWidth = 2;
  for (let i = 0; i < 8; i++) { const y = r.y + 160 + i * 50; c.beginPath(); c.moveTo(nx + 24, y); c.lineTo(nx + nw - 24, y); c.stroke(); }
  if (Math.floor(t * 1.6) % 2 === 0) { c.fillStyle = '#92400e'; c.fillRect(nx + 28, r.y + 124, 3, 30); }
  const devs = SUSPECTS.map((s) => s.deviceShort).join(' · ');
  fillRR(c, r.x, r.y + 590, r.w, 82, 14, '#0f172a');
  text(c, `Take a few moments to discuss and write down investigative avenues for: ${devs}`, r.x + 28, r.y + 642, { size: 23, weight: 700, color: '#f8fafc' });
}

const SCREENS = {
  overview: [sOverview, 'case'], facility: [sFacility, 'folder'],
  hatch: [(c, t) => sTimeline(c, t, 0), 'case'], bypass: [(c, t) => sTimeline(c, t, 1), 'case'], vault: [(c, t) => sTimeline(c, t, 2), 'case'],
  cctv: [sCCTV, 'cam'], team: [sTeam, 'case'], arrests: [sMap, 'map'],
  lamb: [(c, t) => sProfile(c, t, 'lamb'), 'user'], daytona: [(c, t) => sProfile(c, t, 'daytona'), 'user'], pasdeigh: [(c, t) => sProfile(c, t, 'pasdeigh'), 'user'],
  atlarge: [sAtLarge, 'case'], devices: [sDevices, 'phone'], together: [sTogether, 'case'], discuss: [sDiscuss, 'chat'],
};

export class ScreenRenderer {
  constructor() {
    this.canvas = document.createElement('canvas'); this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.bg = makeBg();
  }
  draw(id, t) {
    const c = this.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    c.drawImage(this.bg, 0, 0);
    const [fn, active] = SCREENS[id] || SCREENS.overview;
    fn(c, t);
    taskbar(c, active);
  }
}
