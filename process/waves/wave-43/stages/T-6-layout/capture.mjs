import pkg from '/home/claudomat/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.js';
const { chromium } = pkg;
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOTS = '/home/claudomat/project/process/waves/wave-43/stages/T-6-layout/screens';
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const log = (...a) => console.log('[C]', ...a);
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type()==='error') log('PAGE-ERR', m.text().slice(0,100)); });
const snap = async (n) => { await page.screenshot({ path: `${SHOTS}/${n}.png` }); log('shot', n); };
const fullsnap = async (n) => { await page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true }); log('fullshot', n); };
const ov = async () => await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, diff: document.documentElement.scrollWidth - document.documentElement.clientWidth }));

// ---- Login + navigate to Schedule ----
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await (await page.$('input[type="email"], input[name="email"]')).fill(EMAIL);
await (await page.$('input[type="password"]')).fill(PASS);
await (await page.$('button[type="submit"]')).click();
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(1500);
const rail = await page.$$('nav button');
await rail[1].click();
await page.waitForTimeout(2500);
async function clickSchedule() {
  const btns = await page.$$('button, a');
  for (const b of btns) {
    const t = (await b.innerText().catch(()=>'')).trim();
    if (t === 'Schedule') { await b.click({ force: true }); return true; }
  }
  return false;
}
await clickSchedule();
await page.waitForTimeout(2500);
log('schedule loaded');

// ================= TOKEN AUDIT =================
const tokens = await page.evaluate(() => {
  const out = {};
  const rgb = (el, prop) => el ? getComputedStyle(el)[prop] : null;
  const main = document.querySelector('main');

  // Weekly chip
  const chip = Array.from(document.querySelectorAll('main span, main div')).find(e => (e.innerText||'').trim() === 'Weekly');
  if (chip) out.weeklyChip = { color: getComputedStyle(chip).color, bg: getComputedStyle(chip).backgroundColor, borderColor: getComputedStyle(chip).borderColor, borderRadius: getComputedStyle(chip).borderRadius };

  // New session button (primary emerald)
  const newBtn = Array.from(document.querySelectorAll('button')).find(b => /new session/i.test(b.innerText||''));
  if (newBtn) out.newBtn = { color: getComputedStyle(newBtn).color, bg: getComputedStyle(newBtn).backgroundColor, borderRadius: getComputedStyle(newBtn).borderRadius };

  // A session card row — find element with time text
  const timeEl = Array.from(document.querySelectorAll('main *')).find(e => /\d+:\d+ [AP]M —/.test(e.innerText||'') && e.children.length < 3);
  let card = timeEl;
  while (card && !(getComputedStyle(card).borderRadius !== '0px' && card.offsetWidth > 400)) card = card.parentElement;
  if (card) out.card = { bg: getComputedStyle(card).backgroundColor, borderColor: getComputedStyle(card).borderColor, borderRadius: getComputedStyle(card).borderRadius, padding: getComputedStyle(card).padding };

  // Date group header (SATURDAY etc)
  const dateHdr = Array.from(document.querySelectorAll('main h1,main h2,main h3,main h4')).find(h => /SATURDAY|MONDAY|TUESDAY|SUNDAY|WEDNESDAY|THURSDAY|FRIDAY|TODAY|TOMORROW/i.test(h.innerText||''));
  if (dateHdr) out.dateHdr = { color: getComputedStyle(dateHdr).color, fontSize: getComputedStyle(dateHdr).fontSize, textTransform: getComputedStyle(dateHdr).textTransform };

  // Main surface bg
  if (main) out.mainBg = getComputedStyle(main).backgroundColor;
  // Sidebar bg
  const aside = document.querySelector('aside');
  if (aside) out.sidebarBg = getComputedStyle(aside).backgroundColor;

  // Delete button (danger text) — find edit/delete action buttons
  const delBtn = Array.from(document.querySelectorAll('main button')).find(b => /delete session/i.test(b.getAttribute('aria-label')||''));
  if (delBtn) out.deleteBtn = { color: getComputedStyle(delBtn).color };

  // body font
  out.bodyFont = getComputedStyle(document.body).fontFamily;
  return out;
});
console.log('TOKENS-SCHEDULE:', JSON.stringify(tokens, null, 1));

// ================= BREAKPOINT CAPTURES =================
async function capForWidth(w) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(900);
  // scroll to top
  await page.evaluate(() => { const m = document.querySelector('main'); if (m) { const sc = m.querySelector('[class*="overflow"]')||m; sc.scrollTop = 0; } window.scrollTo(0,0); });
  await page.waitForTimeout(300);
  await snap(`agenda-${w}`);
  const o = await ov();
  console.log(`OVERFLOW-${w}`, JSON.stringify(o));

  // panel collapse check <1024: is right MEMBERS / detail visible?
  const layout = await page.evaluate(() => {
    const aside = document.querySelector('aside'); // channel sidebar
    const members = Array.from(document.querySelectorAll('aside, div')).find(e => /MEMBERS/.test(e.innerText||'') && e.offsetWidth < 360 && e.offsetWidth > 150);
    const cardEls = Array.from(document.querySelectorAll('main *')).filter(e => /\d+:\d+ [AP]M/.test(e.innerText||'') && e.children.length<3);
    // any element wider than viewport?
    const vw = document.documentElement.clientWidth;
    const wide = Array.from(document.querySelectorAll('body *')).filter(e => e.getBoundingClientRect().right > vw + 2).slice(0,5).map(e=>({tag:e.tagName, cls:(e.className||'').toString().slice(0,40), right: Math.round(e.getBoundingClientRect().right)}));
    return {
      channelSidebarVisible: aside ? aside.offsetWidth > 0 : false,
      channelSidebarW: aside ? aside.offsetWidth : 0,
      membersVisible: !!members,
      firstCardText: cardEls[0] ? (cardEls[0].innerText||'').slice(0,40) : null,
      wideElements: wide
    };
  });
  console.log(`LAYOUT-${w}`, JSON.stringify(layout));
  return o;
}
await capForWidth(1440);
await capForWidth(1280);
await capForWidth(1024);

// ================= AUTHORING MODAL (open) at each width =================
async function openModal() {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => /new session/i.test(x.innerText||''));
    if (b) b.click();
  });
  await page.waitForTimeout(1000);
}
async function closeModalIfOpen() {
  await page.keyboard.press('Escape').catch(()=>{});
  await page.waitForTimeout(500);
}
for (const w of [1440, 1280, 1024]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(600);
  await openModal();
  await snap(`modal-${w}`);
  // modal token + centering audit
  const modal = await page.evaluate((vw) => {
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return { present: false };
    const content = dlg.querySelector('[class*="modal-content"], form') ? (dlg.querySelector('form')?.parentElement || dlg) : dlg;
    const box = (dlg.querySelector('form')?.closest('div')||dlg).getBoundingClientRect();
    // find the visible modal card (child with bg + radius)
    const card = Array.from(dlg.children).find(c => c.offsetWidth>200) || dlg;
    const cb = card.getBoundingClientRect();
    const recSel = dlg.querySelector('select');
    return {
      present: true,
      cardRect: { left: Math.round(cb.left), right: Math.round(cb.right), width: Math.round(cb.width), top: Math.round(cb.top) },
      vw,
      centeredGap: Math.round(cb.left - (vw - cb.width)/2),
      inViewport: cb.left >= -2 && cb.right <= vw + 2,
      bg: getComputedStyle(card).backgroundColor,
      borderRadius: getComputedStyle(card).borderRadius,
      title: dlg.querySelector('h1,h2,h3')?.innerText,
      hasRecurrence: !!recSel
    };
  }, page.viewportSize().width);
  console.log(`MODAL-AUDIT-${w}`, JSON.stringify(modal));
  await closeModalIfOpen();
}

// ================= SESSION DETAIL panel =================
// Reset to 1440, click a session card to open detail
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(600);
await page.evaluate(() => {
  // click first session card (find card row and click it, not its edit/delete buttons)
  const timeEl = Array.from(document.querySelectorAll('main *')).find(e => /\d+:\d+ [AP]M —/.test(e.innerText||'') && e.children.length < 3);
  let card = timeEl;
  while (card && card.offsetWidth < 400) card = card.parentElement;
  if (card) card.click();
});
await page.waitForTimeout(2000);
await snap('detail-1440');
const detail = await page.evaluate(() => {
  const txt = (document.querySelector('main')?.innerText||'').slice(0,500);
  // detail panel — an aside or region that appeared
  return { mainTxt: txt };
});
console.log('DETAIL-1440:', JSON.stringify(detail));
console.log('OVERFLOW-detail-1440', JSON.stringify(await ov()));

// detail at 1024 (collapse behavior)
await page.setViewportSize({ width: 1024, height: 900 });
await page.waitForTimeout(800);
await snap('detail-1024');
console.log('OVERFLOW-detail-1024', JSON.stringify(await ov()));

await browser.close();
log('done');
