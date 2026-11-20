// Story data and timelines shared by the 3D scene, the labels and the case board, so all of them tell the same
// story at the same moment. Facility positions are in the facility model's own coordinates.
import { clamp, smooth, lerp } from './util.js';

export const SUSPECTS = [
  { key: 'lamb', name: 'Jackson Lamb', roleLabel: 'Believed role', role: 'Physical entry and removal of the terminal', roleShort: 'Physical entry',
    place: 'eurotunnel', placeName: 'Eurotunnel terminal', mode: 'Rail', device: 'Apple iPhone 11', deviceShort: 'iPhone 11', os: 'iOS',
    color: '#f5a524', noteLabel: 'After arrest', note: 'Denies involvement and has refused to answer questions' },
  { key: 'daytona', name: 'Jackie Daytona', roleLabel: 'Suspected role', role: 'Logistics and coordination', roleShort: 'Logistics & coordination',
    place: 'harwich', placeName: 'Harwich International Port', mode: 'Sea', device: 'Google Pixel 6', deviceShort: 'Pixel 6', os: 'Android',
    color: '#1fcf86', noteLabel: 'Found in his possession', note: 'An Android device and a laptop' },
  { key: 'pasdeigh', name: 'Joseph Pasdeigh', roleLabel: 'Believed role', role: 'Network intrusion (advanced cyber operative)', roleShort: 'Network intrusion',
    place: 'manchester', placeName: 'Manchester Airport', mode: 'Air', device: 'Samsung Galaxy A51', deviceShort: 'Galaxy A51', os: 'Android',
    color: '#3b8bff', noteLabel: 'Background', note: 'Suspected links to international cybercrime activity' },
];
export const SUSPECT = Object.fromEntries(SUSPECTS.map((s) => [s.key, s]));

// Each animated section plays for T seconds, holds the end state, fades and replays. [T, hold]
export const TIMING = {
  hatch: [7.6, 3.5], bypass: [6.8, 3.5], vault: [8.4, 3.5], cctv: [9.2, 3.5],
  arrests: [3.2, 6], lamb: [2.6, 7], daytona: [2.6, 7], pasdeigh: [2.6, 7], devices: [4.0, 7],
};
export function loopInfo(id, t) {
  const [T, hold] = TIMING[id] || [0, 0];
  if (!T) return { lt: t, cycle: 0, fade: 1 };
  const L = T + hold, cycle = Math.floor(t / L), lt = t - cycle * L;
  let fade = 1;
  if (lt > L - 0.7) fade = clamp((L - lt) / 0.7);
  if (cycle > 0 && lt < 0.45) fade = Math.min(fade, clamp(lt / 0.45));
  return { lt, cycle, fade };
}
export const k01 = (t, a, b) => clamp((t - a) / (b - a));
export const sm = (t, a, b) => smooth(k01(t, a, b));

// ------------------------------------------------------------------ the facility model
export const GL = 2.2;   // ground level (top of the site)
export const FL = 0.3;   // sub-basement floor
export const DOOR_X = [-1.7, 0.2];          // two security doors in the sub-basement corridor
export const PLINTH = { x: 2.75, z: 2.2, top: FL + 0.32 };

// Key frames for the two offenders: [time, x, y, z, yaw?]. Yaw follows the direction of travel unless given.
const TRACKS = {
  hatch: [
    [[0, -3.7, GL, -0.9], [2.0, -2.45, GL, 2.4], [3.2, -2.45, GL, 2.4], [3.6, -3.1, GL, 2.42], [5.0, -3.1, FL, 2.42], [6.0, -2.45, FL, 2.3]],
    [[0, -3.95, GL, -1.5], [2.4, -3.6, GL, 1.5], [4.6, -3.6, GL, 1.5], [5.0, -3.1, GL, 2.42], [6.4, -3.1, FL, 2.42], [7.4, -2.95, FL, 1.95]],
  ],
  bypass: [
    [[0, -2.45, FL, 2.3], [1.0, -2.0, FL, 2.3], [2.3, -2.0, FL, 2.3], [3.7, -0.1, FL, 2.3], [4.9, -0.1, FL, 2.3], [6.2, 0.6, FL, 2.6]],
    [[0, -2.95, FL, 1.95], [1.3, -2.45, FL, 1.95], [2.6, -2.45, FL, 1.95], [4.2, -0.6, FL, 1.95], [5.2, -0.6, FL, 1.95], [6.6, 0.0, FL, 2.0]],
  ],
  vault: [
    [[0, 0.6, FL, 2.6, Math.PI / 2], [1.9, 0.6, FL, 2.6, Math.PI / 2], [2.5, 0.95, FL, 2.25], [3.6, 2.2, FL, 2.22], [5.0, 2.2, FL, 2.22], [6.9, 0.7, FL, 2.25], [8.2, -0.5, FL, 2.45]],
    [[0, 0.0, FL, 2.0, Math.PI / 2], [6.0, 0.0, FL, 2.0, Math.PI / 2], [8.2, -1.3, FL, 1.95]],
  ],
  cctv: [
    [[0, -2.45, FL, 2.3, Math.PI / 2], [2.6, -2.45, FL, 2.3, Math.PI / 2], [8.4, 0.6, FL, 2.6]],
    [[0, -2.95, FL, 1.95, Math.PI / 2], [3.1, -2.95, FL, 1.95, Math.PI / 2], [8.9, 0.0, FL, 2.0]],
  ],
  team: [
    [[0, 2.15, FL, 2.25, -Math.PI / 2]],
    [[0, 0.35, FL, 1.95, Math.PI / 2]],
  ],
};
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const yawCache = new Map();
function segYaws(keys) {
  if (yawCache.has(keys)) return yawCache.get(keys);
  const yaws = [];
  let prev = keys[0][4] ?? Math.PI / 2;
  for (let i = 0; i < keys.length; i++) {
    const a = keys[i], b = keys[i + 1];
    let y = a[4];
    if (y === undefined && b) {
      const dx = b[1] - a[1], dz = b[3] - a[3];
      y = Math.hypot(dx, dz) > 0.02 ? Math.atan2(dx, dz) : prev;
    }
    if (y === undefined) y = prev;
    yaws.push(y); prev = y;
  }
  yawCache.set(keys, yaws);
  return yaws;
}
function trackAt(keys, t) {
  const yaws = segYaws(keys);
  if (t <= keys[0][0] || keys.length === 1) return { x: keys[0][1], y: keys[0][2], z: keys[0][3], yaw: yaws[0], walk: 0, climb: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) {
      const u = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
      const horiz = Math.hypot(b[1] - a[1], b[3] - a[3]) > 0.02, vert = Math.abs(b[2] - a[2]) > 0.02;
      const p = i > 0 ? yaws[i - 1] : yaws[0];
      const yaw = p + angDiff(p, yaws[i]) * smooth(clamp((t - a[0]) / 0.3));
      return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u), yaw, walk: horiz ? 1 : 0, climb: vert ? 1 : 0 };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2], z: l[3], yaw: yaws[yaws.length - 1], walk: 0, climb: 0 };
}

// What the facility looks like at a moment of a given section.
const BREAKIN = ['hatch', 'bypass', 'vault', 'cctv', 'team'];
const BEFORE = ['overview', 'facility'];
export function facility(id, lt) {
  const s = { figs: null, hatch: 1, doors: [1, 1], leds: [1, 1], vault: 1, terminal: 'gone', lift: 1, loop: 0, glitch: 0, cyber: 0, feeds: 'live' };
  if (BEFORE.includes(id)) Object.assign(s, { hatch: 0, doors: [0, 0], leds: [0, 0], vault: 0, terminal: 'plinth', lift: 0 });
  if (TRACKS[id]) s.figs = TRACKS[id].map((k) => trackAt(k, lt));
  switch (id) {
    case 'hatch':
      Object.assign(s, { hatch: sm(lt, 2.1, 3.0), doors: [0, 0], leds: [0, 0], vault: 0, terminal: 'plinth', lift: 0 });
      break;
    case 'bypass':
      Object.assign(s, { doors: [sm(lt, 1.5, 2.2), sm(lt, 4.05, 4.8)], leds: [lt > 1.35 ? 1 : 0, lt > 3.9 ? 1 : 0], vault: 0, terminal: 'plinth', lift: 0 });
      break;
    case 'vault': {
      const lift = sm(lt, 3.85, 4.65);
      Object.assign(s, { vault: sm(lt, 0.3, 1.9), terminal: lift > 0 ? 'carried' : 'plinth', lift });
      break;
    }
    case 'cctv':
      Object.assign(s, { vault: 0, terminal: 'plinth', lift: 0, cyber: sm(lt, 0.1, 0.6), glitch: k01(lt, 1.5, 1.55) * (1 - k01(lt, 2.35, 2.4)), loop: lt >= 2.4 ? 1 : 0 });
      s.feeds = lt < 1.5 ? 'live' : lt < 2.4 ? 'glitch' : 'loop';
      break;
    case 'team':
      Object.assign(s, { terminal: 'carried', lift: 1, cyber: 1, loop: 1, feeds: 'loop' });
      break;
    default: break;
  }
  s.breakin = BREAKIN.includes(id);
  return s;
}

// Times shown on the CCTV mock-up. Illustrative only: the manual says "the early hours of the morning" and gives no times.
export function cctvClock(lt, looped) {
  const base = 2 * 3600 + 13 * 60 + 41; // 02:13:41
  const sec = looped ? base + ((lt - 2.4) % 6) : base + lt;
  const s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return [h, m, x].map((n) => String(n).padStart(2, '0')).join(':');
}
