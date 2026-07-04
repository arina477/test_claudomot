import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[D2]', ...a);
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const snap = async (n) => { await page.screenshot({ path: `${SHOTS}/${n}.png` }); log('shot', n); };
const ov = async () => await page.evaluate(() => ({ diff: document.documentElement.scrollWidth - document.documentElement.clientWidth }));

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

// Inspect the DOM structure of ONE card to find the actual clickable element
const cardStruct = await page.evaluate(() => {
  const h = Array.from(document.querySelectorAll('main h3,main h4')).find(x => (x.innerText||'').trim()==='rl-1');
  if (!h) return null;
  // walk up capturing tag/class/role/onclick presence and dimensions
  const chain = [];
  let el = h;
  for (let i=0;i<6 && el;i++){
    chain.push({ tag: el.tagName, cls:(el.className||'').toString().slice(0,60), role: el.getAttribute('role'), tabindex: el.getAttribute('tabindex'), w: el.offsetWidth, h: el.offsetHeight, cursor: getComputedStyle(el).cursor });
    el = el.parentElement;
  }
  return chain;
});
console.log('CARD-CHAIN:', JSON.stringify(cardStruct, null, 1));

// Click the element in chain that has cursor pointer / role button / tabindex (the interactive card)
const clickTarget = await page.evaluateHandle(() => {
  const h = Array.from(document.querySelectorAll('main h3,main h4')).find(x => (x.innerText||'').trim()==='rl-1');
  let el = h;
  for (let i=0;i<6 && el;i++){
    if (getComputedStyle(el).cursor==='pointer' || el.getAttribute('role')==='button' || el.getAttribute('tabindex')!==null){ return el; }
    el = el.parentElement;
  }
  return h;
});
const tgt = clickTarget.asElement();
if (tgt) {
  const bx = await tgt.boundingBox();
  log('clicking target box', JSON.stringify(bx));
  await tgt.click({ position: { x: 40, y: Math.min(20, (bx?.height||30)/2) } }).catch(async e => { log('click err', e.message); await page.mouse.click(bx.x+40, bx.y+bx.height/2); });
  await page.waitForTimeout(2500);
}
log('url', page.url());
await snap('detail-open2-1440');
const after = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]');
  const bt = document.body.innerText;
  return { url: location.href, dialogPresent: !!dlg,
    hasDescription: /description/i.test(bt),
    hasStartsSoon: /starts soon/i.test(bt),
    hasSessionDetails: /session details/i.test(bt),
    dlgText: dlg? dlg.innerText.replace(/\n/g,' | ').slice(0,400): null,
    // panel detection: any newly-visible aside/section with the session title as heading + edit/delete
    panels: Array.from(document.querySelectorAll('aside,section,div[role="dialog"]')).filter(e=>/rl-1/.test(e.innerText||'') && /edit|delete|description|repeats|time/i.test(e.innerText||'') && e.offsetWidth>250 && e.offsetWidth<600).map(e=>({tag:e.tagName, w:e.offsetWidth, text:(e.innerText||'').replace(/\n/g,' | ').slice(0,250)})).slice(0,2)
  };
});
console.log('AFTER2:', JSON.stringify(after, null, 1));
console.log('OVERFLOW', JSON.stringify(await ov()));
await browser.close();
log('done');
