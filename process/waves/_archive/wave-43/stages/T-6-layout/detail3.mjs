import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[D3]', ...a);
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

// open detail on the Weekly session (first card, has recurrence chip)
async function openDetail(title) {
  const h = await page.evaluateHandle((t) => {
    const hh = Array.from(document.querySelectorAll('main h3,main h4')).find(x => (x.innerText||'').trim()===t);
    if (!hh) return null;
    let el = hh;
    while (el && el.getAttribute('role')!=='button') el = el.parentElement;
    return el;
  }, title);
  const el = h.asElement();
  if (el) { await el.click({ position: { x: 40, y: 30 } }); await page.waitForTimeout(2000); return true; }
  return false;
}
await openDetail('zt5oneA1783135615169EDIT');
await snap('detail-weekly-1440');

// Audit detail panel tokens
const dt = await page.evaluate(() => {
  const out = {};
  // find detail panel by SESSION DETAILS header
  const hdr = Array.from(document.querySelectorAll('*')).find(e => (e.innerText||'').trim()==='SESSION DETAILS');
  let panel = hdr;
  while (panel && panel.offsetWidth < 300) panel = panel.parentElement;
  if (panel) { out.panelW = panel.offsetWidth; out.panelBg = getComputedStyle(panel).backgroundColor; }
  const scope = panel || document.body;
  // Delete button (footer)
  const del = Array.from(scope.querySelectorAll('button')).find(b => (b.innerText||'').trim()==='Delete');
  if (del) out.deleteBtn = { color: getComputedStyle(del).color, bg: getComputedStyle(del).backgroundColor, borderRadius: getComputedStyle(del).borderRadius };
  // Edit Session button
  const edit = Array.from(scope.querySelectorAll('button')).find(b => /edit session/i.test(b.innerText||''));
  if (edit) out.editBtn = { color: getComputedStyle(edit).color, bg: getComputedStyle(edit).backgroundColor, borderRadius: getComputedStyle(edit).borderRadius };
  // Weekly chip in detail
  const chip = Array.from(scope.querySelectorAll('span,div')).find(e => (e.innerText||'').trim()==='Weekly');
  if (chip) out.weeklyChip = { color: getComputedStyle(chip).color, bg: getComputedStyle(chip).backgroundColor, borderRadius: getComputedStyle(chip).borderRadius };
  // metagrid card surface
  const meta = Array.from(scope.querySelectorAll('div')).find(e => /Aug|AM|PM|\dhr/.test(e.innerText||'') && getComputedStyle(e).borderRadius!=='0px' && e.offsetWidth>200 && e.offsetWidth<400);
  if (meta) out.metaCard = { bg: getComputedStyle(meta).backgroundColor, borderColor: getComputedStyle(meta).borderColor, borderRadius: getComputedStyle(meta).borderRadius };
  return out;
});
console.log('DETAIL-TOKENS:', JSON.stringify(dt, null, 1));

// Hover Delete to catch danger-text color
const delBtn = await page.$('button:has-text("Delete")');
if (delBtn) {
  await delBtn.hover();
  await page.waitForTimeout(400);
  const hoverColor = await page.evaluate(() => {
    const del = Array.from(document.querySelectorAll('button')).find(b => (b.innerText||'').trim()==='Delete');
    return del ? { color: getComputedStyle(del).color, bg: getComputedStyle(del).backgroundColor } : null;
  });
  console.log('DELETE-HOVER:', JSON.stringify(hoverColor));
  await snap('detail-delete-hover-1440');
}

// selection ring color audit on the selected card
const ring = await page.evaluate(() => {
  const sel = Array.from(document.querySelectorAll('main [role="button"]')).find(e => /zt5oneA1783135615169EDIT/.test(e.innerText||''));
  if (!sel) return null;
  const cs = getComputedStyle(sel);
  return { boxShadow: cs.boxShadow, borderColor: cs.borderColor, outline: cs.outline };
});
console.log('SELECTED-CARD-RING:', JSON.stringify(ring));

// ---- 1280 detail ----
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(900);
await snap('detail-weekly-1280');
console.log('OVERFLOW-1280', JSON.stringify(await ov()));
const layout1280 = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const detailHdr = Array.from(document.querySelectorAll('*')).find(e=>(e.innerText||'').trim()==='SESSION DETAILS');
  const members = Array.from(document.querySelectorAll('*')).find(e=>(e.innerText||'').trim().startsWith('MEMBERS'));
  const wide = Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>vw+2).slice(0,3).map(e=>({tag:e.tagName,right:Math.round(e.getBoundingClientRect().right)}));
  return { detailVisible: !!detailHdr, membersVisible: !!members && members.offsetParent!==null, wide };
});
console.log('LAYOUT-1280', JSON.stringify(layout1280));

// ---- 1024 detail collapse ----
await page.setViewportSize({ width: 1024, height: 900 });
await page.waitForTimeout(900);
await snap('detail-weekly-1024');
console.log('OVERFLOW-1024', JSON.stringify(await ov()));
const layout1024 = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const detailHdr = Array.from(document.querySelectorAll('*')).find(e=>(e.innerText||'').trim()==='SESSION DETAILS');
  const members = Array.from(document.querySelectorAll('*')).find(e=>(e.innerText||'').trim().startsWith('MEMBERS'));
  const channelSidebar = document.querySelector('aside');
  const wide = Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>vw+2).slice(0,3).map(e=>({tag:e.tagName,cls:(e.className||'').toString().slice(0,30),right:Math.round(e.getBoundingClientRect().right)}));
  return {
    detailVisible: !!detailHdr && detailHdr.offsetParent!==null,
    detailW: detailHdr ? (()=>{let p=detailHdr; while(p&&p.offsetWidth<300)p=p.parentElement; return p?p.offsetWidth:0;})() : 0,
    membersVisible: !!members && members.offsetParent!==null,
    channelSidebarW: channelSidebar?channelSidebar.offsetWidth:0,
    wide
  };
});
console.log('LAYOUT-1024', JSON.stringify(layout1024));
await browser.close();
log('done');
