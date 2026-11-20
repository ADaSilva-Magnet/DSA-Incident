Course Scenario - The Darlington Signals Archive (DSA) Incident - 3D Visualizer: SOURCE FILES
==============================================================================================

WHAT THIS FOLDER IS
This is the readable, editable version of DSA-Incident-Scenario-Visualizer.html
(the file in the folder above). You do not need anything in here to present or share
the visualizer. Share only the .html file, not this folder.

It was built from the System Requirements 3D visualizer's source (same look, controls
and security lock), with a new scene and new content.


HOW TO GET A CHANGE MADE
1. Open the Code tab in Copilot and describe the change you want.
2. Tell Copilot that the source is in this folder (or attach the folder to the
   conversation) and ask it to rebuild the .html from this source.
3. Copilot should run the checks described below, then replace the .html file.

Do NOT edit the script part of the finished .html by hand. The file has a security
lock (a Content-Security-Policy holding a SHA-256 fingerprint of its script). Any
change to the script makes the browser refuse to run it, and the page stays on
"Building the scene...". build.py updates the fingerprint automatically.

Safe to edit by hand in the finished .html (outside the script): the top banner text,
the button names and the keyboard help screen.


WHERE THINGS ARE
src/steps.js       The 15 sections: titles, notes, bullet points, fact boxes, "How it fits
                   together" text, 3D labels (and when they appear), camera positions and
                   particle streams.
src/sync.js        The story data (the three suspects, their roles, arrest locations and
                   devices) and the timing of every animation (the two offenders' routes,
                   the hatch, doors, vault and CCTV), shared by the 3D scene, the labels and
                   the case board.
src/model.js       The briefing table: the cut-away facility model (left), the map of Great
                   Britain with the three arrest scenes (right), the evidence tray (front),
                   the case board display (back) and the unidentified fourth person (centre),
                   plus all their animations.
src/props.js       The 3D props: people, the three phones, the classified terminal, CCTV
                   cameras, police car, laptop, and the shuttle train, ferry and aircraft.
src/ukmap.js       Simplified outline of Great Britain and the three arrest locations.
src/palette.js     Colours and where each zone sits on the table.
src/screens.js     What the case board shows in each section (drawn in code), and the CCTV
                   monitor wall inside the facility model.
src/main.js        Navigation, buttons, keyboard keys, links (#vault etc.), camera moves,
                   labels, notes panel, case board close-up, night lighting and graphics
                   quality.
src/textures.js    Generated textures (signs, hatch lid, evidence labels, map, phone backs...).
src/flows.js, util.js
                   Particle streams and small helpers.
src/template.html  The page shell: layout, styles, banner, buttons, help screen and
                   the security policy.
build.py           Builds the single .html file (see below).
package.json       Exact library versions: three 0.186.1, esbuild 0.27.7.
tests/             Automated browser checks (see below).


THE 15 SECTIONS (link names in brackets, e.g. ...html#vault)
Start            1 Overview (overview)
The break-in     2 The DSA (facility)   3 Entry (hatch)   4 Security (bypass)
                 5 Vault (vault)   6 CCTV (cctv)   7 Coordinated (team)
The suspects     8 Arrests (arrests)   9 J. Lamb (lamb)   10 J. Daytona (daytona)
                 11 J. Pasdeigh (pasdeigh)   12 At large (atlarge)
The evidence     13 Devices (devices)
Wrap-up          14 At a glance (together)   15 Discussion (discuss)


PRESENTING
Arrow keys, Page Up/Down or a presentation clicker move between sections. P replays the
current section's animation, R resets the camera, N hides the notes, M cycles the case
board close-up (auto / always / never; click it to enlarge), L hides the 3D labels,
F is full screen, ? shows all keys. The break-in sections play at night and loop.


HOW TO REBUILD (for Copilot or a developer)
Needs Python 3 and Node.js.
1. If three and esbuild are not already available, run "npm install" in this folder.
2. Run:  python3 build.py
   Output: dist/DSA-Incident-Scenario-Visualizer.html
   The build bundles all code (Three.js included) into one inline script, so the file
   works offline. It computes the script's SHA-256 and writes it into the security
   policy, and it stops if the inlined script would be unsafe.
3. Check it (next section), then replace the .html in the folder above with it.


CHECKS
Open the new file in Chrome or Edge and step through every section. In the Copilot
Code environment, the scripts in tests/ automate this (each takes the full path of the
.html; they use Playwright and the environment's Chromium, so adjust those paths to run
them elsewhere):
  node tests/sec.mjs <file> 1      Security: no network requests; an injected script,
                                   inline handler, eval-style timer and fetch are all
                                   blocked; test controls are absent.
  node tests/sec.mjs <file> 2      Booby-trapped link (HTML/script in the address):
                                   nothing runs, page opens normally on section 1.
  node tests/live.mjs <file>       Navigation: link #vault, arrow keys, Page Up, section
                                   buttons, Back, P, End. Expect no errors.
  node tests/nogl.mjs <file> <dir> Fallback when 3D graphics are unavailable.
  node tests/shot.mjs <file> <dir> all 1600 900 high
                                   Screenshots of every section (about 20 s each).
                                   Use e.g. "2@1.5,5@6" instead of "all" to capture a
                                   section at a given second of its animation.


SECURITY NOTES
- The page makes no network requests and stores nothing. The security policy blocks
  connections, outside images and scripts, inline event handlers and eval.
- A link can only choose a section (#vault, #cctv, ... or ?step=cctv) or lighter
  graphics (?q=low; ?q=high keeps full quality). Nothing from the address is written
  into the page.
- Test controls are off in the shared file. tests/shot.mjs turns them on by setting
  window.__VIZ_TEST__ = true before the page loads; a link cannot turn them on.


CONTENT
Based on the "Course scenario" section of the Magnet Axiom training (student) manual,
version 2606 (June 2026), and the instructor-led "Artifacts checklist" discussion that
follows it. The top bar names it as the source: "Source: Magnet Axiom training manual
(course scenario) · June 2026" (in src/template.html). The cover page carries no date;
June 2026 comes from the manual's version stamp (Training V2606). No course code or
module number appears in the visualizer, so it can be reused across courses.

Every fact in the notes and on the case board is from the scenario text: the facility,
Diana Tavener's report, the disused access hatch, the bypassed internal security
systems, the classified terminal taken from the secure sub-basement vault, the CCTV
looped recording, the three arrests (Jackson Lamb at the Eurotunnel terminal, Jackie
Daytona at Harwich International Port, Joseph Pasdeigh at Manchester Airport), the
unidentified fourth person, the unrecovered terminal and the three devices (Apple
iPhone 11, Google Pixel 6, Samsung Galaxy A51).

Illustrations, not manual text: the facility building, its layout, the hatch position,
the security doors, the camera positions and names, the two figures and their route,
the CCTV clock times, the map outline and pin positions (approximate), the arrest-scene
models (shuttle train, ferry, aircraft, police cars) and the phone models' details.
"Rail, sea and air" describes the three arrest locations; it isn't manual wording.
The CCTV section adds a one-line definition of a looped recording, and the Pasdeigh
section a one-line definition of a network intrusion.
In the discussion questions, the manual's "evidence relating to the bank heist" is
shown as "evidence relating to the incident" (the scenario is not a bank heist).
