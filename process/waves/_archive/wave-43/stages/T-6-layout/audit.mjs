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
page.on('console', m => { if (m.type() === 'error') log('PAGE-ERR', m.text().slice(0,120)); });

const snap = async (n) => { await page.screenshot({ path: `${SHOTS}/${n}.png` }); log('shot', n); };
const ov = async () => await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));

// click an element by matching innerText exactly among a selector set
async function clickByText(text, sel='button, a, li, div[role="button"]') {
  return await page.evaluate(({text, sel}) => {
    const els = Array.from(document.querySelectorAll(sel));
    // prefer the smallest element whose trimmed text equals `text`
    const matches = els.filter(e => (e.innerText||'').trim() === text);
    if (!matches.length) return false;
    matches.sort((a,b)=> (a.innerText.length - b.innerText.length) || (a.offsetHeight - b.offsetHeight));
    const el = matches[0].closest('button,a,[role="button"]') || matches[0];
    el.click();
    return true;
  }, { text, sel });
}

// ---- Login ----
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
await (await page.$('input[type="email"], input[name="email"]')).fill(EMAIL);
await (await page.$('input[type="password"]')).fill(PASS);
await (await page.$('button[type="submit"]')).click();
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(1500);

// ---- Enter Fixture Proof Server (rail idx 1) ----
const rail = await page.$$('nav button');
await rail[1].click();
await page.waitForTimeout(2000);

// ---- Click Schedule channel ----
const okSched = await clickByText('Schedule');
log('clicked Schedule:', okSched);
await page.waitForTimeout(2500);
log('url', page.url());
console.log('OVERFLOW-1440', JSON.stringify(await ov()));

// Dump the schedule main content
const mainTxt = await page.evaluate(() => (document.querySelector('main')?.innerText || document.body.innerText).slice(0,800));
console.log('SCHEDULE-TXT:', JSON.stringify(mainTxt));
await snap('20-schedule-1440-initial');

// ---- Detect empty state; create a session if empty ----
const isEmpty = /no sessions|empty|first session|schedule.*session|nothing scheduled/i.test(mainTxt);
const hasNewBtn = await page.evaluate(() => {
  return !!Array.from(document.querySelectorAll('button')).find(b => /new session|schedule.*session|create session|\+ ?new/i.test(b.innerText||''));
});
log('empty?', isEmpty, 'hasNewBtn?', hasNewBtn);

async function openAuthoringModal() {
  const clicked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => /new session|schedule.*first|create session|new/i.test(x.innerText||'') && (x.innerText||'').length < 40);
    if (b) { b.click(); return b.innerText.trim(); }
    return false;
  });
  return clicked;
}

// Check if there are existing session cards
let cardCount = await page.evaluate(() => document.querySelectorAll('[class*="card"], [role="listitem"], article').length);
log('rough card count', cardCount);

// Create a session so cards + modal + detail render, if none exist
const openedForCreate = await openAuthoringModal();
log('opened authoring modal (create):', openedForCreate);
await page.waitForTimeout(1200);
await snap('30-authoring-modal-1440');
// dump modal fields
const modalDump = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"]') || document.querySelector('[class*="modal"]');
  if (!dlg) return null;
  return {
    text: dlg.innerText.replace(/\n/g,' | ').slice(0,400),
    inputs: Array.from(dlg.querySelectorAll('input,select,textarea')).map(i => ({ type:i.type||i.tagName, name:i.name, id:i.id, ph:i.placeholder }))
  };
});
console.log('MODAL-DUMP:', JSON.stringify(modalDump));

// Fill the modal to create a session (best-effort by field type)
if (modalDump) {
  await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]') || document.querySelector('[class*="modal"]');
    const setNative = (el, val) => {
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : (el.tagName==='SELECT'? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const q = (s) => dlg.querySelector(s);
    const title = dlg.querySelector('input[type="text"], input:not([type])');
    if (title) setNative(title, 'T-6 Audit Session');
    const desc = dlg.querySelector('textarea');
    if (desc) setNative(desc, 'Layout audit session for T-6.');
    const date = dlg.querySelector('input[type="date"]');
    if (date) setNative(date, '2026-07-10');
    const times = dlg.querySelectorAll('input[type="time"]');
    if (times[0]) setNative(times[0], '14:00');
    if (times[1]) setNative(times[1], '16:00');
  });
  await page.waitForTimeout(400);
  await snap('31-authoring-modal-filled-1440');
  // Try Weekly recurrence to render the chip
  await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]') || document.querySelector('[class*="modal"]');
    const sel = dlg.querySelector('select');
    if (sel) {
      const proto = window.HTMLSelectElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value').set.call(sel, 'weekly');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(500);
  await snap('32-authoring-modal-weekly-1440');
  // Save
  const saved = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]') || document.querySelector('[class*="modal"]');
    const b = Array.from(dlg.querySelectorAll('button')).find(x => /^save|create|schedule/i.test((x.innerText||'').trim()));
    if (b) { b.click(); return b.innerText.trim(); }
    return false;
  });
  log('save clicked:', saved);
  await page.waitForTimeout(3000);
  await snap('33-after-save-1440');
  console.log('AFTER-SAVE-TXT:', JSON.stringify(await page.evaluate(()=> (document.querySelector('main')?.innerText||'').slice(0,600))));
}

console.log('OVERFLOW-after', JSON.stringify(await ov()));
await browser.close();
log('done');
