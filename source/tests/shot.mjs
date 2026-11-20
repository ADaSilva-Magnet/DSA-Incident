// Screenshots. Usage: node shot.mjs <full path to .html> <output folder> <all | 0,4,7 | 3@2.5,5@6> [width height quality]
//   "i@s" captures section i at second s of its animation (default: 5 s).
//   Sets window.__VIZ_TEST__ before load so the page exposes its test controls (window.__viz).
import { createRequire } from 'module';
const require = createRequire('/usr/local/lib/node_modules/docgen-utils/');
const { chromium } = require('playwright');
const [,, file, outDir, which = 'all', w = '1600', h = '900', q = 'high'] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/docgen-browsers/chromium-1208/chrome-linux64/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.addInitScript(() => { window.__VIZ_TEST__ = true; });
await page.goto('file://' + file + '?q=' + q, { waitUntil: 'commit', timeout: 120000 });
for (const t0 = Date.now(); !(await page.evaluate(() => !!(document.querySelector('#loading.done') && (!window.__VIZ_TEST__ || (window.__viz && window.__viz.ready)))).catch(() => false));) { if (Date.now() - t0 > 200000) throw new Error('timeout'); await page.waitForTimeout(500); }
const ids = await page.evaluate(() => window.__viz.steps);
const list = which === 'all' ? ids.map((_, i) => [i, 5]) : which.split(',').map((x) => { const [i, s] = x.split('@'); return [Number(i), s === undefined ? 5 : Number(s)]; });
for (const [i, sec] of list) {
  const t0 = Date.now();
  await page.evaluate(([i, sec]) => window.__viz.go(i, sec), [i, sec]);
  await page.waitForTimeout(900);
  const tag = which === 'all' ? '' : `@${sec}`;
  await page.screenshot({ path: `${outDir}/s${String(i).padStart(2, '0')}-${ids[i]}${tag}-${w}.png` });
  console.log('shot', i, ids[i], sec, (Date.now() - t0) + 'ms');
}
console.log(logs.slice(0, 40).join('\n'));
await browser.close();
