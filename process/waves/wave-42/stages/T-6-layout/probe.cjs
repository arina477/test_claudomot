const { chromium } = require('/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/node_modules/playwright-core');
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE = 'https://web-production-bce1a8.up.railway.app';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`.slice(0,180)));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`.slice(0,180)));
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
    console.log('URL:', page.url());
    console.log('TITLE:', await page.title());
    const inputs = await page.$$eval('input', els => els.map(e => ({type:e.type, name:e.name, id:e.id, ph:e.placeholder})));
    console.log('INPUTS:', JSON.stringify(inputs));
    const btns = await page.$$eval('button, a[role=button], [type=submit], a', els => els.slice(0,25).map(e => (e.innerText||e.value||'').trim()).filter(Boolean));
    console.log('BUTTONS/LINKS:', JSON.stringify(btns));
  } catch (e) { console.log('PROBE ERROR:', e.message); }
  console.log('---LOGS---'); console.log(logs.join('\n'));
  await browser.close();
})();
