import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;
const EXECUTABLE = '/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const WEB='https://web-production-bce1a8.up.railway.app';
const API='https://api-production-b93e.up.railway.app';
const SERVER='ad62cd12-b78e-4a85-a214-042cf176b16c';
const A={email:'studyhall-e2e-fixture@example.com',pass:'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde'};
(async()=>{
  const b=await chromium.launch({executablePath:EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await (await b.newContext()).newPage();
  await p.goto(`${WEB}/login`,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200);
  await p.fill('input[type="email"]',A.email); await p.fill('input[type="password"]',A.pass);
  await Promise.all([p.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{}),p.locator('button[type="submit"]').first().click()]);
  await p.waitForTimeout(3000);
  const out=await p.evaluate(async({API,SERVER})=>{
    const r=await fetch(`${API}/servers/${SERVER}/roles`,{credentials:'include'});
    const roles=await r.json();
    const before=roles.map(x=>({id:x.id,name:x.name,isDefault:x.isDefault}));
    const results=[];
    for(const role of roles){
      if(!role.isDefault && /E2E Educator/i.test(role.name)){
        const d=await fetch(`${API}/servers/${SERVER}/roles/${role.id}`,{method:'DELETE',credentials:'include'});
        results.push({deleted:role.name,status:d.status});
      }
    }
    const r2=await fetch(`${API}/servers/${SERVER}/roles`,{credentials:'include'});
    const after=(await r2.json()).map(x=>({name:x.name,isDefault:x.isDefault}));
    return {before,results,after};
  },{API,SERVER});
  console.log(JSON.stringify(out,null,2));
  await b.close();
})();
