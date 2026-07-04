import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[driver]', ...a);

const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await (await page.$('input[type="email"], input[name="email"]')).fill(EMAIL);
await (await page.$('input[type="password"]')).fill(PASS);
await (await page.$('button[type="submit"]')).click();
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(1500);

// Discover API routes via fetch from page context (same-origin cookies apply)
const servers = await page.evaluate(async () => {
  const tryPaths = ['/api/servers', '/api/v1/servers', '/api/me/servers', '/api/guilds'];
  for (const p of tryPaths) {
    try {
      const r = await fetch(p, { credentials: 'include' });
      if (r.ok) { const j = await r.json(); return { path: p, ok: true, data: j }; }
    } catch(e) {}
  }
  return { ok: false };
});
if (!servers.ok) { log('no server API found'); }
else {
  const arr = Array.isArray(servers.data) ? servers.data : (servers.data.servers || servers.data.data || []);
  log('server API', servers.path, 'count', arr.length);
  log('sample', JSON.stringify(arr.slice(0,3)));
}

// Also: click server 1 then dump the DOM of the channel sidebar region specifically
const railBtns = await page.$$('nav button');
await railBtns[1].click();
await page.waitForTimeout(2500);
// grab the aside that is NOT the rail — the widest aside/second column
const cols = await page.evaluate(() => {
  const asides = Array.from(document.querySelectorAll('aside, nav, div'))
    .filter(e => e.offsetWidth > 180 && e.offsetWidth < 320 && e.offsetHeight > 400);
  return asides.slice(0,3).map(a => ({ w: a.offsetWidth, text: (a.innerText||'').replace(/\n/g,' | ').slice(0,300) }));
});
console.log('CANDIDATE SIDEBARS:', JSON.stringify(cols, null, 1));

await browser.close();
