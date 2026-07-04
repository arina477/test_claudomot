const { chromium } = require('/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/node_modules/playwright-core');
const EXE='/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE='https://web-production-bce1a8.up.railway.app';
const EMAIL='studyhall-e2e-fixture@example.com'; const PASS='Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
async function login(page){
  await page.goto(BASE+'/login',{waitUntil:'networkidle',timeout:45000});
  await page.locator('input[type=email]').first().fill(EMAIL);
  await page.locator('input[type=password]').first().fill(PASS);
  await page.getByRole('button',{name:/sign in/i}).first().click();
  await page.waitForURL(/\/app/,{timeout:30000}).catch(()=>{});
  await page.waitForTimeout(2000);
}
(async()=>{
  const browser=await chromium.launch({executablePath:EXE,headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  await login(page);
  // Get all server buttons (exclude Home/Your servers/add)
  const servers = await page.$$eval('[aria-label]', els => els.map(e=>e.getAttribute('aria-label')).filter(l=>l && !['Server rail','Home','Your servers','Add a server','Create server','Add server'].includes(l)));
  console.log('SERVER COUNT:', servers.length);
  const found=[];
  for(const s of servers.slice(0,60)){
    try{
      await page.getByRole('button',{name:s,exact:true}).first().click({timeout:5000});
      await page.waitForTimeout(900);
      // Read the channel sidebar (workspace area, not the rail). Grab text of the second aside/nav.
      const chans = await page.evaluate(()=>{
        // channel items usually have '#' or a glyph; grab the sidebar that contains WORKSPACE/GENERAL headers
        const cont = Array.from(document.querySelectorAll('div,aside,nav')).find(el=>/WORKSPACE|GENERAL/.test(el.innerText||'') && (el.innerText||'').length<600);
        return cont ? cont.innerText.replace(/\s+/g,' ').trim() : '';
      });
      const hasAssign = /assign/i.test(chans);
      if(hasAssign || chans) found.push({s, chans: chans.slice(0,200), hasAssign});
      if(hasAssign){ console.log('*** ASSIGNMENT CHANNEL in', s, '->', chans.slice(0,200)); }
    }catch(e){}
  }
  console.log('SERVERS-WITH-CHANNELS:');
  found.forEach(f=>console.log((f.hasAssign?'[A] ':'    ')+f.s+' :: '+f.chans));
  await browser.close();
})();
