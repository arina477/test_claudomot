import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[D]', ...a);
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

// Find a card heading (session title) and click it via real click on its container row
// The row is the clickable card. Use the title text 'rl-1' as an anchor.
const cardHandle = await page.evaluateHandle(() => {
  const h = Array.from(document.querySelectorAll('main h1,main h2,main h3,main h4')).find(x => (x.innerText||'').trim()==='rl-1');
  if (!h) return null;
  let row = h;
  while (row && row.offsetWidth < 400) row = row.parentElement;
  return row;
});
const box = await cardHandle.asElement()?.boundingBox().catch(()=>null);
log('card box', JSON.stringify(box));
if (box) {
  // click the left part of the card (avoid edit/delete on the right)
  await page.mouse.click(box.x + 60, box.y + box.height/2);
  await page.waitForTimeout(2500);
}
log('url', page.url());
await snap('detail-open-1440');
const after = await page.evaluate(() => {
  // detect a detail panel: an aside/section with Session detail-ish content, or a modal
  const dlg = document.querySelector('[role="dialog"]');
  const bodyTxt = document.body.innerText;
  // Look for detail-specific labels
  const hasDetail = /session details|description|starts soon|edit session|repeats/i.test(bodyTxt);
  return {
    dialogPresent: !!dlg,
    dialogText: dlg ? dlg.innerText.replace(/\n/g,' | ').slice(0,500) : null,
    url: location.href
  };
});
console.log('AFTER-CARD-CLICK:', JSON.stringify(after));

// Audit any detail region: danger delete color, surfaces, radius
const detailTokens = await page.evaluate(() => {
  const scope = document.querySelector('[role="dialog"]') || document.querySelector('aside[class*="detail"]') || document.body;
  const out = {};
  // Delete button
  const del = Array.from(scope.querySelectorAll('button')).find(b => /^delete$|delete session/i.test((b.innerText||'').trim()) || /delete/i.test(b.getAttribute('aria-label')||''));
  if (del) out.deleteBtn = { color: getComputedStyle(del).color, bg: getComputedStyle(del).backgroundColor, aria: del.getAttribute('aria-label'), text: del.innerText.trim() };
  // Edit button
  const edit = Array.from(scope.querySelectorAll('button')).find(b => /^edit/i.test((b.innerText||'').trim()));
  if (edit) out.editBtn = { color: getComputedStyle(edit).color, bg: getComputedStyle(edit).backgroundColor, borderRadius: getComputedStyle(edit).borderRadius };
  // "Weekly" chip in detail
  const chip = Array.from(scope.querySelectorAll('span,div')).find(e => (e.innerText||'').trim()==='Weekly');
  if (chip) out.weeklyChip = { color: getComputedStyle(chip).color, bg: getComputedStyle(chip).backgroundColor };
  // any "soon"/amber indicator
  const soon = Array.from(scope.querySelectorAll('span,div')).find(e => /starts soon|soon|today/i.test((e.innerText||'').trim()) && (e.innerText||'').length<20);
  if (soon) out.soonChip = { text: soon.innerText.trim(), color: getComputedStyle(soon).color, bg: getComputedStyle(soon).backgroundColor };
  return out;
});
console.log('DETAIL-TOKENS:', JSON.stringify(detailTokens, null, 1));
console.log('OVERFLOW-detail', JSON.stringify(await ov()));

// Now test at 1024 with detail open (collapse behavior)
await page.setViewportSize({ width: 1024, height: 900 });
await page.waitForTimeout(900);
await snap('detail-open-1024');
const collapse = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const channelSidebar = document.querySelector('aside');
  const wide = Array.from(document.querySelectorAll('body *')).filter(e => e.getBoundingClientRect().right > vw+2).slice(0,4).map(e=>({tag:e.tagName, right:Math.round(e.getBoundingClientRect().right)}));
  return { channelSidebarW: channelSidebar?channelSidebar.offsetWidth:0, wide };
});
console.log('COLLAPSE-1024', JSON.stringify(collapse));
console.log('OVERFLOW-detail-1024', JSON.stringify(await ov()));

// hover over a session card to reveal action buttons + audit delete danger color on hover state at 1440
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(600);
await browser.close();
log('done');
