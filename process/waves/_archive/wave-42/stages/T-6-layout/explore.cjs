const { chromium } = require('/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/node_modules/playwright-core');
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASS = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOT = '/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/screens';

async function dump(page, label) {
  const btns = await page.$$eval('button, a', els => els.slice(0,40).map(e => (e.innerText||'').trim().replace(/\s+/g,' ')).filter(Boolean));
  console.log(`[${label}] URL=${page.url()}`);
  console.log(`[${label}] BTNS=`, JSON.stringify(btns));
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { if(m.type()==='error') logs.push(`[err] ${m.text()}`.slice(0,150)); });
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
    // Click the top "Sign in"
    await page.getByRole('button', { name: /^Sign in$/ }).first().click().catch(async()=>{
      await page.getByText(/Already a member\? Sign in/).click();
    });
    await page.waitForTimeout(1500);
    await dump(page, 'after-signin-click');
    // Fill login
    const emailField = page.locator('input[type=email], input[name=email], input[placeholder*="mail" i]').first();
    await emailField.fill(EMAIL, { timeout: 10000 });
    const passField = page.locator('input[type=password]').first();
    await passField.fill(PASS);
    await page.screenshot({ path: `${SHOT}/00-login-filled.png` });
    // Submit
    await page.getByRole('button', { name: /sign in|log in|continue/i }).first().click();
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(()=>{});
    await page.waitForTimeout(3000);
    await dump(page, 'after-login');
    await page.screenshot({ path: `${SHOT}/01-after-login.png`, fullPage: false });

    // Look for server rail items and channel list
    const railInfo = await page.evaluate(() => {
      const out = {};
      out.aria = Array.from(document.querySelectorAll('[aria-label]')).slice(0,40).map(e=>e.getAttribute('aria-label'));
      out.headings = Array.from(document.querySelectorAll('h1,h2,h3')).slice(0,20).map(e=>e.innerText.trim());
      return out;
    });
    console.log('RAIL/ARIA:', JSON.stringify(railInfo.aria));
    console.log('HEADINGS:', JSON.stringify(railInfo.headings));
  } catch (e) { console.log('EXPLORE ERROR:', e.message); }
  console.log('---ERRLOGS---'); console.log(logs.slice(0,10).join('\n'));
  await browser.close();
})();
