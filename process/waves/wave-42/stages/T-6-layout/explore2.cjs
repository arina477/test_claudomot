const { chromium } = require('/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/node_modules/playwright-core');
const EXE = '/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE = 'https://web-production-bce1a8.up.railway.app';
const EMAIL='studyhall-e2e-fixture@example.com'; const PASS='Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOT='/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/screens';

async function login(page){
  await page.goto(BASE+'/login',{waitUntil:'networkidle',timeout:45000});
  await page.waitForTimeout(1200);
  await page.locator('input[type=email]').first().fill(EMAIL);
  await page.locator('input[type=password]').first().fill(PASS);
  await page.getByRole('button',{name:/sign in/i}).first().click();
  await page.waitForURL(/\/app/,{timeout:30000}).catch(()=>{});
  await page.waitForTimeout(2500);
}
(async()=>{
  const browser=await chromium.launch({executablePath:EXE,headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  try{
    await login(page);
    // Click "Fixture Proof Server" (A is organizer on all)
    await page.getByRole('button',{name:'Fixture Proof Server'}).click().catch(e=>console.log('server click fail',e.message));
    await page.waitForTimeout(2500);
    // Dump channels
    const chans = await page.evaluate(()=>{
      return Array.from(document.querySelectorAll('a,button')).map(e=>({t:(e.innerText||'').trim().replace(/\s+/g,' '), href:e.getAttribute('href')||''})).filter(x=>x.t && x.t.length<40).slice(0,60);
    });
    console.log('CHANNELS:', JSON.stringify(chans,null,0));
    await page.screenshot({path:`${SHOT}/02-server-open.png`});
    // Try to find an Assignments channel
    const assignBtn = page.getByText(/assignment/i).first();
    if(await assignBtn.count()){
      await assignBtn.click(); await page.waitForTimeout(2500);
      console.log('AFTER ASSIGN URL:', page.url());
      await page.screenshot({path:`${SHOT}/03-assignments.png`});
      const txt = await page.evaluate(()=>document.body.innerText.slice(0,800));
      console.log('ASSIGN BODY:', txt.replace(/\n+/g,' | '));
    } else { console.log('NO assignment channel text found'); }
  }catch(e){console.log('ERR',e.message);}
  await browser.close();
})();
