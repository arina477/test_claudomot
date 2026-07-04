import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[driver]', ...a);

const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') log('PAGE-ERR', m.text().slice(0,120)); });

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await (await page.$('input[type="email"], input[name="email"]')).fill(EMAIL);
await (await page.$('input[type="password"]')).fill(PASS);
await (await page.$('button[type="submit"]')).click();
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);

// Click server idx 1 (Fixture Proof Server)
const railBtns = await page.$$('nav button, nav a');
await railBtns[1].click();
await page.waitForTimeout(2000);
log('clicked server 1, url', page.url());

// Dump sidebar (aside/channel list) structure
const sidebar = await page.evaluate(() => {
  // Find the channel sidebar: the aside or nav that contains channel items. Grab all clickable rows with text.
  const all = Array.from(document.querySelectorAll('a[href], button'));
  return all.filter(e => {
    const t = (e.innerText||'').trim();
    return t && t.length < 50;
  }).map(e => ({ tag: e.tagName, href: e.getAttribute('href'), text: (e.innerText||'').trim().replace(/\n/g,' ').slice(0,45) })).slice(0, 80);
});
console.log('CLICKABLES:', JSON.stringify(sidebar, null, 0));

await browser.close();
