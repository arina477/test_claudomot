import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[A]', ...a);
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const snap = async (n) => { await page.screenshot({ path: `${SHOTS}/${n}.png` }); log('shot', n); };

await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await (await page.$('input[type="email"], input[name="email"]')).fill(EMAIL);
await (await page.$('input[type="password"]')).fill(PASS);
await (await page.$('button[type="submit"]')).click();
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(1500);

const rail = await page.$$('nav button');
await rail[1].click();
await page.waitForTimeout(2500);
log('server url', page.url());

// Use a real Playwright click on the Schedule channel button (getByText scoped)
// Find the exact button element by iterating handles
const btns = await page.$$('button, a');
let clicked = false;
for (const b of btns) {
  const t = (await b.innerText().catch(()=>'')).trim();
  if (t === 'Schedule') {
    const box = await b.boundingBox();
    log('found Schedule button, box', JSON.stringify(box));
    if (box) { await b.scrollIntoViewIfNeeded().catch(()=>{}); await b.click({ force: true }); clicked = true; break; }
  }
}
log('schedule clicked', clicked);
await page.waitForTimeout(3000);
log('url after', page.url());
const mainTxt = await page.evaluate(() => (document.querySelector('main')?.innerText || document.body.innerText).slice(0,900));
console.log('MAIN-TXT:', JSON.stringify(mainTxt));
await snap('21-schedule-clicked-1440');

// Also enumerate all headings/buttons on the main pane to understand schedule surface
const surface = await page.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  return {
    buttons: Array.from(main.querySelectorAll('button')).map(b=>(b.innerText||b.getAttribute('aria-label')||'').trim().slice(0,30)).filter(Boolean).slice(0,20),
    headings: Array.from(main.querySelectorAll('h1,h2,h3,h4')).map(h=>(h.innerText||'').trim().slice(0,40)).slice(0,20)
  };
});
console.log('SURFACE:', JSON.stringify(surface));
await browser.close();
