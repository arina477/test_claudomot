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
  await page.waitForTimeout(2000);
}
(async()=>{
  const browser=await chromium.launch({executablePath:EXE,headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  await login(page);
  await page.getByRole('button',{name:'Fixture Proof Server',exact:true}).first().click();
  await page.waitForTimeout(2000);
  // Click Assignments channel
  await page.getByText('Assignments',{exact:true}).first().click();
  await page.waitForTimeout(2500);
  console.log('URL:', page.url());
  await page.screenshot({path:`${SHOT}/04-assign-channel.png`});
  const body = await page.evaluate(()=>document.body.innerText.slice(0,1500).replace(/\n+/g,' | '));
  console.log('BODY:', body);
  // list clickable assignment items in canvas
  const items = await page.evaluate(()=>{
    const main = document.querySelector('main') || document.body;
    return Array.from(main.querySelectorAll('button, a, [role=button], article, li, [class*=card]')).map(e=>(e.innerText||'').trim().replace(/\s+/g,' ')).filter(t=>t && t.length<120).slice(0,30);
  });
  console.log('CANVAS ITEMS:', JSON.stringify(items));
  await browser.close();
})();
