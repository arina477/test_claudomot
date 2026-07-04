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
  await page.getByRole('button',{name:'Fixture Proof Server',exact:true}).first().click();
  await page.waitForTimeout(1500);
  await page.getByText('Assignments',{exact:true}).first().click();
  await page.waitForTimeout(2500);
  const t=await page.evaluate(()=>{
    const out={};
    // Walk from "Submissions Roster" header up, recording EVERY ancestor's border+bg+radius (skip text-color misreads)
    const hdr=Array.from(document.querySelectorAll('*')).find(e=>/^Submissions Roster/.test((e.innerText||'').trim()) && e.children.length<8);
    out.ancestors=[];
    let p=hdr;
    for(let i=0;i<8&&p;i++){ const s=getComputedStyle(p); const r=p.getBoundingClientRect();
      out.ancestors.push({i, tag:p.tagName, w:Math.round(r.width),h:Math.round(r.height), bg:s.backgroundColor, borderW:s.borderTopWidth, borderColor:s.borderColor, radius:s.borderRadius, cls:(p.className||'').toString().slice(0,70)});
      p=p.parentElement; }
    // Assignment card: from due chip up
    const due=Array.from(document.querySelectorAll('*')).find(e=>/^Due:/.test((e.innerText||'').trim()) && e.children.length<4);
    if(due){ let c=due; for(let i=0;i<6&&c;i++){ const s=getComputedStyle(c); const r=c.getBoundingClientRect(); if(r.height>80 && (s.borderTopWidth!=='0px'||s.backgroundColor!=='rgba(0, 0, 0, 0)')){ out.assignment_card={bg:s.backgroundColor,borderColor:s.borderColor,borderW:s.borderTopWidth,radius:s.borderRadius}; break;} c=c.parentElement; } }
    return out;
  });
  console.log(JSON.stringify(t,null,2));
  // Return trigger focus ring
  const row=page.locator('text=Awaiting').first(); const rb=await row.boundingBox(); if(rb)await page.mouse.move(rb.x-150,rb.y+rb.height/2);
  await page.waitForTimeout(300);
  const rbtn=page.getByRole('button',{name:/^Return$/}).first();
  await rbtn.focus().catch(()=>{});
  await page.waitForTimeout(200);
  const rf=await page.evaluate(()=>{const b=Array.from(document.querySelectorAll('button')).find(x=>/^Return$/.test((x.innerText||'').trim())); if(!b)return null; b.focus(); const s=getComputedStyle(b); return {boxShadow:s.boxShadow.slice(0,80),outline:s.outlineColor+' '+s.outlineWidth, hoverBg:s.backgroundColor};});
  console.log('RETURN-TRIGGER-FOCUS:', JSON.stringify(rf));
  await browser.close();
})();
