import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[F]', ...a);
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
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
const btns = await page.$$('button, a');
for (const b of btns) { if ((await b.innerText().catch(()=>'')).trim()==='Schedule'){ await b.click({force:true}); break; } }
await page.waitForTimeout(2500);

// 1024 agenda WITHOUT detail open — measure agenda + panels
await snap('agenda-1024-clean');
const clean = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const members = Array.from(document.querySelectorAll('*')).find(e=>(e.innerText||'').trim().startsWith('MEMBERS'));
  const channelSidebar = document.querySelector('aside');
  // agenda column: the card's offsetWidth
  const card = Array.from(document.querySelectorAll('main [role="button"]'))[0];
  return {
    vw,
    membersVisible: !!members && members.offsetParent!==null,
    channelSidebarW: channelSidebar?channelSidebar.offsetWidth:0,
    firstCardW: card?card.offsetWidth:0,
    firstCardText: card?(card.innerText||'').replace(/\n/g,'|').slice(0,50):null
  };
});
console.log('CLEAN-1024', JSON.stringify(clean));

// Now open detail at 1024 and measure crushed agenda card width + clipping
const h = await page.evaluateHandle(() => {
  const hh = Array.from(document.querySelectorAll('main h3,main h4')).find(x => (x.innerText||'').trim()==='rl-1');
  let el = hh; while (el && el.getAttribute('role')!=='button') el = el.parentElement; return el;
});
const el = h.asElement();
if (el) { await el.click({ position: { x: 20, y: 20 } }); await page.waitForTimeout(2000); }
const crushed = await page.evaluate(() => {
  const card = Array.from(document.querySelectorAll('main [role="button"]'))[0];
  const chip = Array.from(document.querySelectorAll('main span,main div')).find(e=>/Weekly/.test(e.innerText||''));
  // is chip clipped? compare scrollWidth to clientWidth of chip parent / overflow
  let chipClipped = false;
  if (chip) { const r = chip.getBoundingClientRect(); const parentR = chip.parentElement.getBoundingClientRect(); chipClipped = r.right > parentR.right + 1 || r.left < parentR.left - 1; }
  return {
    agendaCardW: card?card.offsetWidth:0,
    cardTextTruncated: card ? (card.querySelector('h3,h4')?.scrollWidth > card.querySelector('h3,h4')?.clientWidth) : null,
    chipClipped
  };
});
console.log('CRUSHED-1024-DETAIL', JSON.stringify(crushed));

// Grab the compiled CSS to check amber token usage in built bundle
const cssHasAmber = await page.evaluate(async () => {
  let found = { amber: false, danger: false, emerald: false, glowFocus: false };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules; if (!rules) continue;
      for (const r of Array.from(rules)) {
        const t = r.cssText || '';
        if (/245,\s*158,\s*11|#f59e0b|f59e0b/i.test(t)) found.amber = true;
        if (/248,\s*113,\s*113|#f87171|f87171/i.test(t)) found.danger = true;
        if (/16,\s*185,\s*129|#10b981|10b981/i.test(t)) found.emerald = true;
        if (/0px 0px 0px 2px rgba\(16,\s*185,\s*129/i.test(t)) found.glowFocus = true;
      }
    } catch(e) {}
  }
  return found;
});
console.log('CSS-TOKENS', JSON.stringify(cssHasAmber));

await browser.close();
log('done');
