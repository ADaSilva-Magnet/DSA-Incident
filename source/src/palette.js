// Colours and where everything stands on the briefing table, shared by the scene, the walkthrough and the case board.
import * as THREE from 'three';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const COLORS = {
  lamb: 0xf5a524, daytona: 0x1fcf86, pasdeigh: 0x3b8bff, unknown: 0xb197fc,
  intruder: 0xe2e8f0, cyber: 0xff5a4f, cctv: 0x22d3ee, loop: 0xf472b6, classified: 0xfbbf24,
  police: 0x3aa0ff, site: 0x5fd4ff, display: 0x38bdf8, evidence: 0xef4444, neutral: 0x55657c,
};
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const CSS = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, hex(v)]));

// World positions of the table's zones (the table top is y = 0).
export const POS = {
  fac: V(-7.5, 0, 0.2),     // facility model (left)
  map: V(6.75, 0, -0.1),    // map of Great Britain with the three arrest scenes (right)
  tray: V(-0.45, 0, 3.75),  // evidence tray (front)
  board: V(-0.45, 0, -9.0), // case board display (back)
  ghost: V(-0.45, 0, -4.6), // the unidentified fourth person and the missing terminal
};
