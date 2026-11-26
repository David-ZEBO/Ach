// Contrôle responsive : ouvre chaque page publique à plusieurs largeurs, signale tout débordement
// horizontal (élément qui dépasse de l'écran) et enregistre des captures pleine page.
// Usage : npm run dev (dans un autre terminal), puis node scripts/responsive-check.mjs [dossier-captures]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = process.argv[2] ?? 'responsive-shots';
const WIDTHS = [360, 768, 1280];
const ROUTES = [
  '/', '/academie', '/academie/fondateur', '/academie/gouvernance', '/formations',
  '/formations/leadership-et-performance-organisationnelle', '/formations/comprendre-l-intelligence-artificielle',
  '/universite', '/universite/certificat-universitaire-management-test', '/admissions', '/entreprises',
  '/recherche', '/actualites', '/contact', '/verifier', '/connexion',
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let problems = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.visibility === 'hidden') continue;
        // Ignore ce qui est dans un conteneur défilant ou rogné (menus, sous-navigation…)
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) { const o = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(o.overflowX) || o.position === 'fixed') { clipped = true; break; } p = p.parentElement; }
        if (clipped) continue;
        if (r.right > vw + 1 || r.left < -1) over.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} → ${Math.round(r.left)}…${Math.round(r.right)} (écran ${vw})`);
      }
      return { scroll: document.documentElement.scrollWidth, vw, over: over.slice(0, 6) };
    });
    const bad = res.scroll > res.vw + 1 || res.over.length > 0;
    if (bad) { problems++; console.log(`✗ ${width}px ${route}  largeur ${res.scroll}/${res.vw}`); res.over.forEach((o) => console.log('    ' + o)); }
    else console.log(`✓ ${width}px ${route}`);
    if (width !== 768) await page.screenshot({ path: `${OUT}/${width}${route.replace(/\//g, '_') || '_home'}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
console.log(problems ? `\n${problems} page(s) avec débordement.` : '\nAucun débordement horizontal.');
process.exitCode = problems ? 1 : 0;
