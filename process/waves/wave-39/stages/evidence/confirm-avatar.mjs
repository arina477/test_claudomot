import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;
const EXEC='/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const WEB='https://web-production-bce1a8.up.railway.app';
const EMAIL='studyhall-e2e-fixture@example.com', PW='Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const EVID='/home/claudomat/project/process/waves/wave-39/stages/evidence';
(async()=>{
  const b=await chromium.launch({executablePath:EXEC,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await b.newContext({viewport:{width:1280,height:800}}); const p=await ctx.newPage();
  await p.goto(`${WEB}/login`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);
  await p.fill('input[type="email"]',EMAIL); await p.fill('input[type="password"]',PW);
  await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(3500);
  // go straight to profile — avatar already uploaded in prior run, should persist server-side
  await p.goto(`${WEB}/settings/profile`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
  const imgs = await p.locator('img').evaluateAll(a=>a.map(i=>({src:i.src, w:i.naturalWidth, h:i.naturalHeight, complete:i.complete})));
  console.log('PROFILE imgs (persisted avatar check):', JSON.stringify(imgs));
  await p.screenshot({path:`${EVID}/avatar-persisted.png`});
  await b.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
