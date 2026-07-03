import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;
import fs from 'fs';
const EXEC='/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const WEB='https://web-production-bce1a8.up.railway.app';
const API='https://api-production-b93e.up.railway.app';
const EMAIL='studyhall-e2e-fixture@example.com';
const PW='Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const EVID='/home/claudomat/project/process/waves/wave-39/stages/evidence';

(async()=>{
  const b=await chromium.launch({executablePath:EXEC,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await b.newContext({viewport:{width:1280,height:800}});
  const p=await ctx.newPage();
  // login
  await p.goto(`${WEB}/login`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1500);
  await p.fill('input[type="email"]',EMAIL); await p.fill('input[type="password"]',PW);
  await p.locator('button[type="submit"]').first().click(); await p.waitForTimeout(3500);

  // While AUTHED: discover a real authed endpoint status (baseline) — /profile was seen 200 authed
  const authedProfile = await p.evaluate(async(API)=>{ const r=await fetch(`${API}/profile`,{credentials:'include'}); return r.status; },API);
  console.log('AUTHED /profile status:', authedProfile);

  // capture redirect chain when navigating to /app while authed
  await p.goto(`${WEB}/app`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2000);
  console.log('AUTHED /app final url:', p.url());

  // ==== LOGOUT via menu ====
  await p.goto(`${WEB}/app`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
  const trig=p.locator('[aria-label="Your profile and settings"]').first();
  await trig.click(); await p.waitForTimeout(700);
  await p.locator('[role="menu"]').getByText(/log ?out/i).first().click();
  await p.waitForTimeout(4000);
  console.log('POST-LOGOUT url:', p.url());

  // Post-logout: hit /app and record redirect chain
  const resp = await p.goto(`${WEB}/app`,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2500);
  console.log('POST-LOGOUT /app resp status:', resp && resp.status(), '-> final url:', p.url());
  // was protected content rendered? check for app shell markers vs landing/login
  const hasShellTrigger = await p.locator('[aria-label="Your profile and settings"]').count();
  const bodyText=(await p.locator('body').innerText().catch(()=>'')).slice(0,200).replace(/\n/g,' ');
  console.log('POST-LOGOUT shell-trigger present on /app:', hasShellTrigger, '| body starts:', JSON.stringify(bodyText));

  // Post-logout authed API (the SAME endpoint that returned 200 while authed)
  const postProfile = await p.evaluate(async(API)=>{
    const r=await fetch(`${API}/profile`,{credentials:'include'});
    return {status:r.status};
  },API);
  console.log('POST-LOGOUT /profile status:', JSON.stringify(postProfile));

  // Also confirm session cookies cleared
  const cookies = await ctx.cookies();
  const sessionCookies = cookies.filter(c=>/sAccessToken|sRefreshToken|st-|session/i.test(c.name)).map(c=>({name:c.name,valLen:(c.value||'').length}));
  console.log('POST-LOGOUT session cookies:', JSON.stringify(sessionCookies));

  await p.screenshot({path:`${EVID}/logout-verify-final.png`});
  await b.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
