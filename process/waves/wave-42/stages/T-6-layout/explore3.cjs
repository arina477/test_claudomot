const { chromium } = require('/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/node_modules/playwright-core');
const EXE='/home/claudomat/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE='https://web-production-bce1a8.up.railway.app';
const EMAIL='studyhall-e2e-fixture@example.com'; const PASS='Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const SHOT='/home/claudomat/project/process/waves/wave-42/stages/T-6-layout/screens';
async function login(page){
  await page.goto(BASE+'/login',{waitUntil:'networkidle',timeout:45000});
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
    await page.getByRole('button',{name:'Fixture Proof Server'}).click();
    await page.waitForTimeout(3000);
    console.log('URL after server click:', page.url());
    // Dump full DOM structure of channel sidebar: look for links with /channels/ or channel names
    const info = await page.evaluate(()=>{
      const links = Array.from(document.querySelectorAll('a[href]')).map(a=>({t:(a.innerText||'').trim().replace(/\s+/g,' '),h:a.getAttribute('href')})).filter(x=>x.h && x.h.includes('/app'));
      const navText = document.querySelector('aside, nav[aria-label], [class*=sidebar]')?.innerText?.slice(0,400) || 'NO SIDEBAR';
      const allText = document.body.innerText.slice(0,1200);
      return {links: links.slice(0,40), navText, allText};
    });
    console.log('APP LINKS:', JSON.stringify(info.links));
    console.log('SIDEBAR TEXT:', info.navText.replace(/\n+/g,' | '));
    await page.screenshot({path:`${SHOT}/02b-server-open.png`});
  }catch(e){console.log('ERR',e.message);}
  await browser.close();
})();
