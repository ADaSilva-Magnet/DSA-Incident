// The walkthrough: one entry per section of the course scenario (the Darlington Signals Archive incident).
// Facts come from the scenario text in the manual; anything illustrative is flagged in the section's note.
import { CSS as C } from './palette.js';
import { facility, SUSPECT } from './sync.js';

const after = (s, v = 1) => (t) => (t > s ? v : 0);

export const GROUPS = [
  { id: 'intro', label: 'Start' },
  { id: 'breakin', label: 'The break-in' },
  { id: 'suspects', label: 'The suspects' },
  { id: 'evidence', label: 'The evidence' },
  { id: 'end', label: 'Wrap-up' },
];

const fac = (id) => (t) => facility(id, t);
const ALL_DEV = { d_lamb: 1, d_daytona: 1, d_pasdeigh: 1 };

export const STEPS = [
  {
    id: 'overview', chip: 'Overview', group: 'intro',
    kicker: 'Course scenario', title: 'The Darlington Signals Archive incident',
    lead: 'A government security incident has been reported involving the Darlington Signals Archive (DSA), a classified facility responsible for storing highly sensitive intelligence material.',
    points: [
      '<b>The break-in</b> — offenders got into the facility and removed a classified computing terminal.',
      '<b>The cyber-attack</b> — at the same time, the facility\'s CCTV was compromised.',
      '<b>The suspects</b> — three arrested while trying to leave the UK; a fourth is still at large.',
      '<b>The evidence</b> — three mobile devices submitted for forensic examination.',
    ],
    shot: { target: [0.2, 1.3, -0.4], dir: [0.0, 0.55, 1], dist: 42 }, sway: true, inset: 'hide',
    state: () => ({ pins: 0.6, bags: 0.35, ghost: 1 }),
    labels: [
      { at: 'facility', text: 'Darlington Signals Archive', sub: 'the facility', color: C.site, dx: -40, dy: -90 },
      { at: 'map', text: 'Arrest locations', sub: 'three suspects', color: C.lamb, dx: 60, dy: -110 },
      { at: 'tray', text: 'Seized devices', sub: 'for forensic examination', color: C.evidence, dx: -130, dy: 40 },
      { at: 'ghost', text: 'Still at large', sub: 'fourth person · the terminal', color: C.unknown, dx: 40, dy: -60 },
    ],
  },
  {
    id: 'facility', chip: 'The DSA', group: 'breakin',
    kicker: 'The break-in · The facility', title: 'Darlington Signals Archive (DSA)',
    lead: 'A classified facility responsible for storing highly sensitive intelligence material.',
    spec: { min: 'Diana Tavener', rec: 'Highly sensitive intelligence material', minLabel: 'Director', recLabel: 'Stores' },
    points: [
      'Diana Tavener, <b>Director of the DSA</b>, reported the incident.',
      'Three things in the model matter to the story: a <b>disused access hatch</b>, the <b>CCTV system</b> and a <b>secure sub-basement vault</b>.',
      'The vault held a <b>classified computing terminal</b>.',
    ],
    note: 'The building, its layout and the camera positions are illustrations — the manual doesn\'t describe them.',
    shot: { target: [-7.4, 1.7, 0.4], dir: [0.1, 0.5, 1], dist: 21 },
    state: () => ({ cones: 1 }), focus: ['facility'],
    labels: [
      { at: 'hatch', text: 'Disused access hatch', sub: 'in the grounds', color: C.intruder, dx: -60, dy: -120 },
      { at: 'cctvRoom', text: 'Security control room', sub: 'CCTV monitors', color: C.cctv, dx: -60, dy: -110 },
      { at: 'archive', text: 'Archive', sub: 'intelligence material', color: C.site, dx: 120, dy: -110 },
      { at: 'vault', text: 'Secure sub-basement vault', sub: 'classified terminal', color: C.classified, dx: 140, dy: 50 },
    ],
  },
  {
    id: 'hatch', chip: 'Entry', group: 'breakin',
    kicker: 'The break-in · Early hours of the morning', title: 'In through a disused access hatch',
    lead: 'Diana Tavener reported that during the early hours of the morning, unknown individuals gained unauthorised access to the facility.',
    points: [
      'The offenders entered via a <b>disused access hatch</b>.',
      'More than one person was involved — the manual refers to <b>"unknown individuals"</b>.',
    ],
    link: 'Next they bypassed the internal security systems — while a cyber-attack kept the CCTV from showing them.',
    note: 'The hatch position, the route and the two figures are illustrations.',
    shot: { target: [-9.7, 1.6, 2.2], dir: [0.3, 0.58, 1], dist: 11.5 },
    state: () => ({ night: 1 }), focus: ['hatch'],
    labels: [
      { at: 'hatch', text: 'Disused access hatch', sub: (t) => (t < 2.1 ? 'point of entry' : 'opened'), color: C.intruder, dx: 150, dy: -100 },
      { at: 'figA', text: 'Unknown individuals', sub: 'early hours of the morning', color: C.intruder, dx: -150, dy: -70, when: [0.6, 4.6] },
      { at: 'shaft', text: 'Down to the sub-basement', sub: 'unauthorised access', color: C.intruder, dx: -190, dy: 40, when: [4.6, 99] },
    ],
  },
  {
    id: 'bypass', chip: 'Security', group: 'breakin',
    kicker: 'The break-in · Inside the facility', title: 'Internal security systems bypassed',
    lead: 'The offenders entered via a disused access hatch, bypassed internal security systems, and removed a classified computing terminal from a secure sub-basement vault.',
    points: [
      'Once inside, the <b>internal security systems were bypassed</b>.',
      'The manual doesn\'t say which systems, or how they were bypassed.',
    ],
    link: 'Beyond the security systems: the secure sub-basement vault.',
    note: 'The security doors shown are illustrations of "internal security systems".',
    shot: { target: [-8.7, 0.9, 2.7], dir: [0.22, 0.16, 1], dist: 10 },
    state: () => ({ night: 1 }), focus: ['corridor'],
    labels: [
      { at: 'door1', text: 'Internal security', sub: (t) => (facility('bypass', t).leds[0] ? 'bypassed' : 'locked'), color: (t) => (facility('bypass', t).leds[0] ? '#fbbf24' : '#f87171'), dx: -90, dy: -110 },
      { at: 'door2', text: 'Internal security', sub: (t) => (facility('bypass', t).leds[1] ? 'bypassed' : 'locked'), color: (t) => (facility('bypass', t).leds[1] ? '#fbbf24' : '#f87171'), dx: 90, dy: -120 },
      { at: 'vault', text: 'Secure sub-basement vault', sub: 'still sealed', color: C.classified, dx: 120, dy: -40 },
    ],
  },
  {
    id: 'vault', chip: 'Vault', group: 'breakin',
    kicker: 'The break-in · Secure sub-basement vault', title: 'A classified terminal is taken',
    lead: 'The offenders removed a classified computing terminal from a secure sub-basement vault.',
    spec: { single: 'Material of the highest national security sensitivity', label: 'Believed to contain' },
    points: [
      'The stolen terminal is believed to contain material of the <b>highest national security sensitivity</b>.',
      'It <b>has not yet been recovered</b>.',
    ],
    link: 'How did no one see this happen? The next section shows the CCTV.',
    shot: { target: [-5.75, 1.0, 2.6], dir: [-0.12, 0.2, 1], dist: 9 },
    state: () => ({ night: 1 }), focus: ['vault'],
    labels: [
      { at: 'terminal', text: 'Classified computing terminal', sub: (t) => (t < 3.9 ? 'in the secure vault' : 'removed'), color: C.classified, dx: 120, dy: -120 },
      { at: 'vaultDoor', text: 'Vault door', sub: (t) => (t < 0.3 ? 'closed' : 'opened'), color: C.intruder, dx: -150, dy: -90, when: [0, 3.6] },
    ],
  },
  {
    id: 'cctv', chip: 'CCTV', group: 'breakin',
    kicker: 'The break-in · Simultaneous cyber-attack', title: 'CCTV replaced with a looped recording',
    lead: 'Investigators believe the physical intrusion was coordinated with a simultaneous cyber-attack.',
    define: { text: '<b class="term">Looped recording</b> — earlier footage played over and over in place of the live camera feed, so the monitors keep showing an empty, normal-looking scene.' },
    points: [
      'During the attack, the facility\'s <b>CCTV system was compromised</b> and replaced with a looped recording.',
      'This allowed the offenders to <b>operate undetected</b>.',
    ],
    link: 'The bottom-right panel compares what the monitors showed with what was really happening.',
    note: 'Camera names, positions and times are illustrations.',
    shot: { target: [-7.3, 1.8, 0.0], dir: [0.04, 0.5, 1], dist: 17.5 }, inset: 'show',
    state: () => ({ night: 1, roof: 1, cones: 1, cyber: 1 }), focus: ['control'],
    flows: [
      { key: 'cyber', via: 'cyber', color: C.cyber, speed: 0.45, count: 42, size: 0.17, alpha: (t) => fac('cctv')(t).cyber },
      { key: 'loop', via: 'loop', color: C.loop, speed: 0.5, count: 14, size: 0.11, alpha: (t) => (t > 2.4 ? 1 : 0) },
    ],
    labels: [
      { at: 'cyber', text: 'Cyber-attack', sub: 'at the same time as the break-in', color: C.cyber, dx: 60, dy: -70 },
      { at: 'monitorWall', text: 'CCTV monitors', sub: (t) => (t < 1.5 ? 'live' : t < 2.4 ? 'compromised…' : 'showing a looped recording'), color: (t) => (t < 2.4 ? C.cctv : C.loop), dx: 160, dy: -80 },
      { at: 'camCorr', text: 'Corridor camera', sub: (t) => (t < 2.4 ? 'live' : 'feed replaced'), color: (t) => (t < 2.4 ? C.cctv : C.loop), dx: 170, dy: 60 },
      { at: 'figA', text: 'Offenders', sub: 'undetected', color: C.intruder, dx: -150, dy: 40, when: [2.6, 99] },
    ],
  },
  {
    id: 'team', chip: 'Coordinated', group: 'breakin',
    kicker: 'The break-in · A coordinated operation', title: 'Multiple people, working together',
    lead: 'It is suspected that multiple individuals were involved, working in a coordinated manner.',
    points: [
      '<b>Physical intrusion</b> — the hatch, the security systems, the vault.',
      '<b>Cyber-attack</b> — the CCTV, at the same time.',
      'Who is believed to have done what is covered in <b>The suspects</b>.',
    ],
    shot: { target: [-7.2, 1.6, 0.2], dir: [0.02, 0.46, 1], dist: 19 }, sway: true,
    state: () => ({ night: 1, roof: 1, cones: 0.7, cyber: 1 }),
    flows: [
      { key: 'cyber', via: 'cyber', color: C.cyber, speed: 0.45, count: 36, size: 0.16 },
      { key: 'loop', via: 'loop', color: C.loop, speed: 0.5, count: 12, size: 0.1 },
      { key: 'sync', from: 'cyber', to: 'team', color: C.unknown, speed: 0.22, count: 30, size: 0.2, lift: 1.4, normal: [0, 1, 0.6] },
    ],
    labels: [
      { at: 'team', text: 'Physical intrusion', sub: 'on site', color: C.intruder, dx: 150, dy: 40 },
      { at: 'cyber', text: 'Cyber-attack', sub: 'CCTV compromised', color: C.cyber, dx: 60, dy: -70 },
      { at: 'monitorWall', text: 'Looped recording', sub: 'nobody sees them', color: C.loop, dx: 170, dy: -60 },
    ],
  },
  {
    id: 'arrests', chip: 'Arrests', group: 'suspects',
    kicker: 'The suspects · Arrests', title: 'Three arrests while leaving the UK',
    lead: 'Three suspects have since been arrested while attempting to leave the United Kingdom.',
    spec: { rows: [['J. Lamb', 'Eurotunnel terminal', 'lamb'], ['J. Daytona', 'Harwich International Port', 'daytona'], ['J. Pasdeigh', 'Manchester Airport', 'pasdeigh']] },
    points: [
      'Each was stopped at a different way out — <b>rail</b>, <b>sea</b> and <b>air</b>.',
      'A <b>fourth</b> suspect remains at large.',
    ],
    note: 'Map positions are approximate.',
    shot: { target: [7.3, 0.2, 0.4], dir: [-0.02, 1.0, 1], dist: 24 }, inset: 'hide',
    state: () => ({ pins: 1 }), focus: ['map'],
    labels: [
      { at: 'pin_lamb', text: 'Eurotunnel terminal', sub: 'Jackson Lamb', color: C.lamb, dx: -170, dy: 80, when: [0.6, 99] },
      { at: 'pin_daytona', text: 'Harwich International Port', sub: 'Jackie Daytona', color: C.daytona, dx: -10, dy: -105, when: [1.05, 99] },
      { at: 'pin_pasdeigh', text: 'Manchester Airport', sub: 'Joseph Pasdeigh', color: C.pasdeigh, dx: -40, dy: -130, when: [1.5, 99] },
    ],
  },
  {
    id: 'lamb', chip: 'J. Lamb', group: 'suspects',
    kicker: 'The suspects · Arrested at the Eurotunnel terminal', title: 'Jackson Lamb',
    spec: { min: 'Physical entry and removal of the terminal', rec: 'Eurotunnel terminal', minLabel: 'Believed role', recLabel: 'Arrested at' },
    points: [
      'Believed to have carried out the <b>physical entry</b> and <b>removal of the terminal</b>.',
      'He <b>denies involvement</b> and has <b>refused to answer questions</b>.',
      'Device seized: <b>Apple iPhone 11</b>.',
    ],
    link: 'His believed role matches two parts of the break-in: the entry and the removal of the terminal from the vault.',
    shot: { target: [10.95, 0.7, 2.4], dir: [-0.35, 0.55, 1], dist: 8.5 },
    state: (t) => ({ s_lamb: 1, d_lamb: after(0.3)(t) }), 
    labels: [
      { at: 'lamb', text: 'Jackson Lamb', sub: 'denies involvement', color: C.lamb, dx: -170, dy: 10 },
      { at: 'dev_lamb', text: 'Apple iPhone 11', sub: 'seized', color: C.lamb, dx: 150, dy: -40, when: [1.0, 99] },
      { at: 'place_lamb', text: 'Eurotunnel terminal', sub: 'rail', color: '#e2e8f0', dx: -60, dy: -100 },
    ],
  },
  {
    id: 'daytona', chip: 'J. Daytona', group: 'suspects',
    kicker: 'The suspects · Arrested at Harwich International Port', title: 'Jackie Daytona',
    spec: { min: 'Logistics and coordination', rec: 'Harwich International Port', minLabel: 'Suspected role', recLabel: 'Arrested at' },
    points: [
      'Suspected of involvement in <b>logistics and coordination</b>.',
      'Found in possession of an <b>Android device</b> and a <b>laptop</b>.',
      'Device seized: <b>Google Pixel 6</b>.',
    ],
    note: 'The laptop isn\'t among the devices the manual lists for analysis.',
    shot: { target: [10.85, 0.7, -0.4], dir: [0.4, 0.85, 1], dist: 8.8 },
    state: (t) => ({ s_daytona: 1, d_daytona: after(0.3)(t), laptop: after(0.6)(t) }), 
    labels: [
      { at: 'daytona', text: 'Jackie Daytona', sub: 'logistics and coordination', color: C.daytona, dx: -190, dy: 20 },
      { at: 'dev_daytona', text: 'Google Pixel 6', sub: 'Android device · seized', color: C.daytona, dx: -170, dy: -70, when: [1.0, 99] },
      { at: 'laptop', text: 'Laptop', sub: 'also found with him', color: '#cbd5e1', dx: 140, dy: -50, when: [1.2, 99] },
      { at: 'place_daytona', text: 'Harwich International Port', sub: 'sea', color: '#e2e8f0', dx: 60, dy: -110 },
    ],
  },
  {
    id: 'pasdeigh', chip: 'J. Pasdeigh', group: 'suspects',
    kicker: 'The suspects · Arrested at Manchester Airport', title: 'Joseph Pasdeigh',
    spec: { min: 'The network intrusion', rec: 'Manchester Airport', minLabel: 'Believed responsible for', recLabel: 'Arrested at' },
    define: { text: '<b class="term">Network intrusion</b> — unauthorised access to a computer network. Here, the cyber-attack that compromised the facility\'s CCTV.' },
    points: [
      'An <b>advanced cyber operative</b>.',
      'Suspected links to <b>international cybercrime</b> activity.',
      'Device seized: <b>Samsung Galaxy A51</b>.',
    ],
    shot: { target: [3.3, 0.7, 1.3], dir: [-0.25, 0.55, 1], dist: 8.5 },
    state: (t) => ({ s_pasdeigh: 1, d_pasdeigh: after(0.3)(t) }), 
    labels: [
      { at: 'pasdeigh', text: 'Joseph Pasdeigh', sub: 'advanced cyber operative', color: C.pasdeigh, dx: 170, dy: 10 },
      { at: 'dev_pasdeigh', text: 'Samsung Galaxy A51', sub: 'seized', color: C.pasdeigh, dx: -170, dy: -40, when: [1.0, 99] },
      { at: 'place_pasdeigh', text: 'Manchester Airport', sub: 'air', color: '#e2e8f0', dx: 90, dy: -100 },
    ],
  },
  {
    id: 'atlarge', chip: 'At large', group: 'suspects',
    kicker: 'The suspects · Still outstanding', title: 'A fourth suspect — and the terminal',
    lead: 'A fourth, unidentified individual — believed to be the coordinating authority behind the operation — remains at large.',
    points: [
      'Identity <b>unknown</b>; believed to be the <b>coordinating authority</b>.',
      'The stolen terminal <b>has not yet been recovered</b>.',
    ],
    link: 'Next: the devices seized from the three suspects in custody.',
    shot: { target: [-0.45, 1.1, -4.6], dir: [0.05, 0.36, 1], dist: 10 },
    state: () => ({ ghost: 1 }), focus: ['ghost'],
    labels: [
      { at: 'ghost', text: 'Fourth individual', sub: 'unidentified · at large', color: C.unknown, dx: -170, dy: -60 },
      { at: 'ghostTerm', text: 'Stolen terminal', sub: 'not yet recovered', color: C.classified, dx: 160, dy: -70 },
    ],
  },
  {
    id: 'devices', chip: 'Devices', group: 'evidence',
    kicker: 'The evidence · Submitted for analysis', title: 'Three devices for forensic examination',
    lead: 'Several digital devices have been seized and submitted for forensic examination.',
    spec: { rows: [['iPhone 11', 'Apple · from Jackson Lamb', 'lamb'], ['Pixel 6', 'Google · from Jackie Daytona', 'daytona'], ['Galaxy A51', 'Samsung · from Joseph Pasdeigh', 'pasdeigh']] },
    points: [
      'Believed to contain <b>critical evidence</b> relating to both the <b>physical breach</b> and the associated <b>cyber intrusion</b>.',
      'One <b>iOS</b> device and two <b>Android</b> devices.',
    ],
    shot: { target: [4.0, 0.4, 2.2], dir: [0.0, 0.8, 1], dist: 20 },
    state: () => ({ bags: 1, ...ALL_DEV }), focus: ['tray'],
    flows: ['lamb', 'daytona', 'pasdeigh'].map((k, i) => ({ key: 'dev-' + k, from: 'dev_' + k, to: 'bag_' + k, color: C[k], speed: 0.32, count: 30, size: 0.14, lift: 1.8, normal: [0, 1, 0.1], alpha: (t) => (t > 0.6 + i * 0.3 ? 1 : 0) })),
    labels: [
      { at: 'bag_lamb', text: 'Apple iPhone 11', sub: 'from Jackson Lamb', color: C.lamb, dx: -150, dy: 60 },
      { at: 'bag_daytona', text: 'Google Pixel 6', sub: 'from Jackie Daytona', color: C.daytona, dx: 0, dy: 110 },
      { at: 'bag_pasdeigh', text: 'Samsung Galaxy A51', sub: 'from Joseph Pasdeigh', color: C.pasdeigh, dx: 150, dy: 60 },
    ],
  },
  {
    id: 'together', chip: 'At a glance', group: 'end',
    kicker: 'Putting it all together', title: 'The case at a glance',
    ordered: true,
    points: [
      'A disused hatch, bypassed security and a looped CCTV feed — a <b>classified terminal</b> is taken from the vault.',
      '<b>Jackson Lamb</b> — physical entry and removal · Eurotunnel terminal · <b>iPhone 11</b>.',
      '<b>Jackie Daytona</b> — logistics and coordination · Harwich · <b>Pixel 6</b>.',
      '<b>Joseph Pasdeigh</b> — network intrusion · Manchester Airport · <b>Galaxy A51</b>.',
      'Still outstanding: the <b>coordinator</b> and the <b>terminal</b>.',
    ],
    shot: { target: [0.2, 0.6, -0.3], dir: [0.06, 0.46, 1], dist: 44 }, sway: true, inset: 'hide',
    state: () => ({ pins: 0.8, bags: 0.8, ghost: 1, missingTag: 1, ...ALL_DEV }),
    flows: ['lamb', 'daytona', 'pasdeigh'].map((k) => ({ key: 'dev-' + k, from: 'dev_' + k, to: 'bag_' + k, color: C[k], speed: 0.25, count: 22, size: 0.16, lift: 2.0, normal: [0, 1, 0.1] })),
    labels: [
      { at: 'facility', text: 'The break-in', sub: 'terminal taken', color: C.site, dx: -30, dy: -90 },
      { at: 'map', text: 'Three arrests', sub: 'rail · sea · air', color: C.lamb, dx: 60, dy: -110 },
      { at: 'tray', text: 'Three devices', sub: 'for examination', color: C.evidence, dx: -130, dy: 40 },
      { at: 'ghost', text: 'Still outstanding', sub: 'coordinator · terminal', color: C.unknown, dx: 40, dy: -60 },
    ],
  },
  {
    id: 'discuss', chip: 'Discussion', group: 'end',
    kicker: 'Instructor-led discussion · Artifacts checklist', title: 'Where would you look?',
    lead: 'With the scenario briefed, what are some artifacts or areas of the mobile devices that should be examined within Axiom?',
    ordered: true,
    points: [
      'Where could we expect to find evidence relating to the <b>incident</b>?',
      'What <b>applications</b> could have been used on the devices?',
      'What about <b>file storage applications</b>?',
    ],
    link: 'Take a few moments to discuss and write down any investigative avenues.',
    shot: { target: [-0.45, 4.4, -4.2], dir: [0.0, 0.16, 1], dist: 21 }, inset: 'hide',
    state: () => ({ bags: 1 }), focus: ['tray'],
    labels: [
      { at: 'tray', text: 'iPhone 11 · Pixel 6 · Galaxy A51', sub: 'one iOS and two Android devices', color: C.evidence, dx: -120, dy: 50 },
    ],
  },
];
