import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;

const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const BASE = 'https://web-production-bce1a8.up.railway.app/';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = process.env.PW_PASS;
const EVID = '/home/claudomat/project/process/waves/wave-27/stages/evidence';

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrs = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });

  // ---- bundle check ----
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const bundle = await page.evaluate(() => {
    const s = [...document.querySelectorAll('script[src]')].map(x => x.getAttribute('src'));
    return s.filter(x => /index-.*\.js/.test(x));
  });
  log('BUNDLE:', JSON.stringify(bundle));

  // ---- login ----
  // Navigate to login; find email/password fields
  await sleep(1000);
  // Try to find email field
  const emailSel = 'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="mail" i]';
  const passSel = 'input[type="password"], input[name="password"]';
  const hasEmail = await page.$(emailSel);
  if (!hasEmail) {
    // maybe need to click a "sign in" link
    const linkTxt = await page.evaluate(() => document.body.innerText.slice(0, 400));
    log('NO email field on landing. Body head:', linkTxt.replace(/\n/g, ' | '));
    // try /login
    await page.goto(BASE.replace(/\/$/, '') + '/login', { waitUntil: 'domcontentloaded' });
    await sleep(1500);
  }
  await page.waitForSelector(emailSel, { timeout: 15000 });
  await page.fill(emailSel, EMAIL);
  await page.fill(passSel, PASS);
  await page.screenshot({ path: `${EVID}/login-filled.png` });
  // submit
  const submitBtn = await page.$('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")');
  if (submitBtn) await submitBtn.click();
  else await page.keyboard.press('Enter');
  await sleep(4000);
  await page.screenshot({ path: `${EVID}/post-login.png` });
  const afterUrl = page.url();
  log('AFTER LOGIN URL:', afterUrl);
  const bodyAfter = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n/g, ' | '));
  log('AFTER LOGIN BODY:', bodyAfter);

  // ---- open Fixture Proof Server ----
  await sleep(2000);
  // The FP rail button is the clickable server icon (initials "FP")
  let opened = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('button,a,[role="button"]')];
    // exact "FP" initials button in the server rail
    let el = cands.find(e => e.textContent.trim() === 'FP');
    if (!el) el = cands.find(e => /Fixture Proof/i.test((e.getAttribute('aria-label')||'') + (e.getAttribute('title')||'')));
    if (el) { el.click(); return el.textContent.trim() || el.getAttribute('aria-label'); }
    return false;
  });
  log('SERVER CLICK:', opened);
  await sleep(2500);
  await page.screenshot({ path: `${EVID}/server-open.png` });
  // Dump channel-list candidates
  const chanList = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('button,a,[role="button"],li,[data-testid]')];
    return cands.map(e => (e.textContent||'').trim()).filter(t => t && t.length < 40 && /#|general|channel|voice|chat/i.test(t)).slice(0, 20);
  });
  log('CHANNEL CANDIDATES:', JSON.stringify(chanList));

  // ---- open a channel ----
  // Real mouse click on the "# general" sidebar row (DOM .click on the wrapper does not route).
  let chanOpen = false;
  // Locate the innermost clickable channel element's bounding box
  const box = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('a,button,[role="button"],li,div')];
    // the channel row: contains the "#" hash + lowercase "general", not the uppercase category header
    const el = cands.find(e => {
      const t = (e.textContent||'').trim();
      return /general/.test(t) && !/^GENERAL/.test(t) && t.length < 20 && e.querySelector('svg,span');
    });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width/2, y: r.y + r.height/2, txt: el.textContent.trim() };
  });
  if (box) {
    await page.mouse.click(box.x, box.y);
    chanOpen = box.txt;
  } else {
    // fallback: fixed coordinate of the sidebar general row
    await page.mouse.click(150, 182);
    chanOpen = 'coord-fallback';
  }
  log('CHANNEL OPEN:', chanOpen, JSON.stringify(box));
  await sleep(3500);
  await page.screenshot({ path: `${EVID}/channel-open.png` });

  // ---- post a message ----
  const msgText = 'w27-regression-' + Date.now();
  const composer = await page.$('textarea, [contenteditable="true"], input[type="text"]');
  if (composer) {
    await composer.click();
    await page.keyboard.type(msgText);
    await sleep(400);
    await page.keyboard.press('Enter');
    log('POSTED:', msgText);
  } else {
    log('NO COMPOSER FOUND');
  }
  await sleep(3000);
  await page.screenshot({ path: `${EVID}/posted.png` });

  return { browser, ctx, page, consoleErrs, msgText, bundle };
}

async function inspect(page, tag) {
  // Scenario 1: author-avatar presence dot on the just-posted (or any self) message row
  const result = await page.evaluate((selfUuid) => {
    const rows = [...document.querySelectorAll('[data-testid^="message-row"], article.msg-row, .msg-row')];
    let dotted = 0, total = rows.length, sample = null, ownRowDot = null;
    for (const r of rows) {
      const inner = r.querySelector('[data-testid="presence-dot-inner"]');
      const sr = [...r.querySelectorAll('.sr-only')].map(s => s.textContent.trim()).filter(t => /online|offline/i.test(t));
      if (inner) {
        dotted++;
        const bg = getComputedStyle(inner).backgroundColor;
        if (!sample) sample = { bg, sr: sr[0] || null, html: r.querySelector('.relative')?.outerHTML?.slice(0, 400) || null };
      }
    }
    // Find own message row by text content (self UUID as author name)
    const selfRow = rows.find(r => r.textContent.includes(selfUuid));
    if (selfRow) {
      const inner = selfRow.querySelector('[data-testid="presence-dot-inner"]');
      const sr = [...selfRow.querySelectorAll('.sr-only')].map(s => s.textContent.trim()).filter(t => /online|offline/i.test(t));
      ownRowDot = inner ? { present: true, bg: getComputedStyle(inner).backgroundColor, sr: sr[0] || null,
        avatarHtml: selfRow.querySelector('.relative')?.outerHTML?.slice(0, 500) || null } : { present: false };
    }
    return { total, dotted, sample, ownRowDot };
  }, '21984eb2-8029-4c1b-9e73-bc586a0be4d2');

  // Scenario 2: member panel dots + a11y reachability
  const member = await page.evaluate(() => {
    const dots = [...document.querySelectorAll('[data-testid="presence-dot-inner"]')];
    const byColor = {};
    for (const d of dots) { const c = getComputedStyle(d).backgroundColor; byColor[c] = (byColor[c] || 0) + 1; }
    // a11y: sr-only presence labels not under aria-hidden
    const labels = [...document.querySelectorAll('.sr-only')].filter(s => /online|offline/i.test(s.textContent));
    let suppressed = 0;
    for (const l of labels) {
      let a = l, hidden = false;
      while (a) { if (a.getAttribute && a.getAttribute('aria-hidden') === 'true') { hidden = true; break; } a = a.parentElement; }
      if (hidden) suppressed++;
    }
    return { totalDots: dots.length, byColor, presenceLabels: labels.length, suppressed, reachable: labels.length - suppressed };
  });

  log(`[${tag}] SCENARIO1:`, JSON.stringify(result));
  log(`[${tag}] SCENARIO2:`, JSON.stringify(member));
  // element-level screenshot of a dotted message-row avatar for visual proof
  try {
    const dotEl = await page.$('[data-testid="message-row"] [data-testid="presence-dot-inner"], .msg-row [data-testid="presence-dot-inner"], [data-testid^="message-row"] [data-testid="presence-dot-inner"]');
    if (dotEl) {
      const rowHandle = await dotEl.evaluateHandle(el => el.closest('[data-testid^="message-row"], .msg-row, article'));
      const el = rowHandle.asElement();
      if (el) await el.screenshot({ path: `${EVID}/msgrow-dot-${tag}.png` });
    }
  } catch (e) { log('rowshot err', e.message); }
  await page.screenshot({ path: `${EVID}/inspect-${tag}.png`, fullPage: false });
  return { result, member };
}

(async () => {
  const { browser, page, consoleErrs, msgText, bundle } = await main();
  log('=== PASS 1 ===');
  const p1 = await inspect(page, 'pass1');
  // Re-post + re-inspect for pass 2 (fresh self message)
  await sleep(1500);
  const composer = await page.$('textarea, [contenteditable="true"], input[type="text"]');
  if (composer) { await composer.click(); await page.keyboard.type('w27-regression-p2-' + Date.now()); await page.keyboard.press('Enter'); await sleep(3000); }
  log('=== PASS 2 ===');
  const p2 = await inspect(page, 'pass2');
  log('CONSOLE ERRORS:', JSON.stringify(consoleErrs.slice(0, 10)));
  log('RESULT_JSON', JSON.stringify({ bundle, p1, p2 }));
  await browser.close(); // closes OUR launched chromium only, not any MCP instance
})().catch(e => { console.error('DRIVER_ERROR', e.message); process.exit(1); });
