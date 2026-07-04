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
page.on('console', m => { if (m.type() === 'error') log('PAGE-ERR', m.text().slice(0,160)); });

async function snap(name) { await page.screenshot({ path: `${SHOTS}/${name}.png` }); log('shot', name); }
async function ov() {
  return await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
}

// login
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await (await page.$('input[type="email"], input[name="email"]')).fill(EMAIL);
await (await page.$('input[type="password"]')).fill(PASS);
const sub = await page.$('button[type="submit"]');
if (sub) await sub.click(); else await page.keyboard.press('Enter');
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);
log('logged in, url', page.url());

// Click first real server icon in the rail (skip the home/compass at index 0)
// Server rail buttons: find buttons with 2-letter labels
const railInfo = await page.evaluate(() => {
  const rail = document.querySelector('nav');
  if (!rail) return { found: false };
  const btns = Array.from(rail.querySelectorAll('button, a')).map((b,i) => ({ i, text: b.innerText.trim().slice(0,20), aria: b.getAttribute('aria-label') }));
  return { found: true, btns };
});
log('rail buttons:', JSON.stringify(railInfo).slice(0,600));

// Click server labeled with something; we want one where A is organizer. Just try each server until a Schedule channel appears.
async function findScheduleInServer(idx) {
  const buttons = await page.$$('nav button, nav a');
  if (idx >= buttons.length) return false;
  await buttons[idx].click();
  await page.waitForTimeout(1500);
  // look for a "Schedule" channel link in sidebar
  const sched = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, button, li'));
    const hit = els.find(e => /schedule/i.test(e.innerText||'') && (e.innerText||'').length < 40);
    return hit ? hit.innerText.trim() : null;
  });
  return sched;
}

let scheduleFound = false;
const nBtns = await page.$$eval('nav button, nav a', els => els.length);
log('rail count', nBtns);
for (let i = 1; i < nBtns && i < 20; i++) {
  const s = await findScheduleInServer(i);
  if (s) { log('server idx', i, 'has schedule channel:', s); scheduleFound = i; break; }
  else log('server idx', i, 'no schedule');
}

if (scheduleFound === false) {
  log('NO SCHEDULE CHANNEL FOUND in any server');
  await snap('03-no-schedule');
  // dump sidebar of last-clicked
  const sb = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  console.log('SIDEBAR DUMP:', sb);
  await browser.close();
  process.exit(0);
}

// click the Schedule channel
await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('a, button, li'));
  const hit = els.find(e => /schedule/i.test(e.innerText||'') && (e.innerText||'').length < 40);
  if (hit) (hit.closest('a,button') || hit).click();
});
await page.waitForTimeout(2500);
log('schedule url', page.url());
await snap('10-schedule-1440');
const html = await page.content();
console.log('SCHEDULE HTML LEN', html.length);
// dump the main content text
const mainTxt = await page.evaluate(() => {
  const main = document.querySelector('main') || document.body;
  return main.innerText.slice(0, 1200);
});
console.log('SCHEDULE MAIN TEXT:', JSON.stringify(mainTxt));
console.log('OVERFLOW', JSON.stringify(await ov()));

await browser.close();
