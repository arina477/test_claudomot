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
page.on('console', m => { if (m.type() === 'error') log('PAGE-ERR', m.text().slice(0,200)); });

async function snap(name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
  log('shot', name);
}

async function overflowCheck() {
  return await page.evaluate(() => {
    const de = document.documentElement;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, overflow: de.scrollWidth - de.clientWidth };
  });
}

try {
  // 1. Sign in
  log('navigate to base');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await snap('00-landing-1440');
  log('url after load:', page.url());
  log('title:', await page.title());

  // Find login. Try common paths.
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  log('body snippet:', JSON.stringify(bodyText));

  // Attempt to find email/password fields on current page; else go to /auth or /login
  let emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="mail" i]');
  if (!emailField) {
    for (const path of ['/login', '/auth', '/signin', '/sign-in']) {
      log('trying', path);
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => log('nav fail', path, e.message));
      emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="mail" i]');
      if (emailField) { log('found login at', path); break; }
    }
  }

  if (emailField) {
    await emailField.fill(EMAIL);
    const pw = await page.$('input[type="password"], input[name="password"]');
    if (pw) await pw.fill(PASS);
    await snap('01-login-filled');
    // submit
    const submit = await page.$('button[type="submit"]') || await page.$('button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")');
    if (submit) { await submit.click(); } else { await pw.press('Enter'); }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
    await page.waitForTimeout(2500);
    log('after login url:', page.url());
    await snap('02-after-login');
  } else {
    log('NO LOGIN FIELD FOUND — dumping HTML head');
    const html = await page.content();
    log('html len', html.length);
    console.log(html.slice(0, 3000));
  }

  await browser.close();
} catch (e) {
  log('FATAL', e.message);
  await snap('99-fatal');
  await browser.close();
  process.exit(1);
}
