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

  const t = await page.evaluate(()=>{
    const out={};
    // ---- Awaiting badge: find the exact text node's badge container ----
    const awEl = Array.from(document.querySelectorAll('*')).find(e=>e.children.length===0 && /^Awaiting$/.test((e.innerText||'').trim()));
    if(awEl){
      // walk up to the pill container (has bg or border or rounded and contains a small dot)
      let badge=awEl;
      for(let i=0;i<4;i++){ if(!badge.parentElement) break; badge=badge.parentElement; const s=getComputedStyle(badge); if(/rounded/.test(badge.className)||s.borderRadius!=='0px'||s.backgroundColor!=='rgba(0, 0, 0, 0)') break; }
      const bs=getComputedStyle(badge);
      out.awaiting_label_color=getComputedStyle(awEl).color;
      out.awaiting_badge={bg:bs.backgroundColor,border:bs.borderColor,radius:bs.borderRadius,cls:(badge.className||'').toString().slice(0,80)};
      // the dot: small element inside badge with bg color (amber)
      const dots=Array.from(badge.querySelectorAll('*')).filter(c=>{const r=c.getBoundingClientRect(); const s=getComputedStyle(c); return r.width>0 && r.width<=10 && r.height<=10 && s.backgroundColor!=='rgba(0, 0, 0, 0)';});
      out.awaiting_dots=dots.map(d=>({bg:getComputedStyle(d).backgroundColor, boxShadow:getComputedStyle(d).boxShadow.slice(0,60), w:Math.round(d.getBoundingClientRect().width)}));
    } else out.awaiting='NOT FOUND';

    // ---- Assignment card surface + due chip ----
    const dueEl=Array.from(document.querySelectorAll('*')).find(e=>/^Due:/.test((e.innerText||'').trim()) && e.children.length<4);
    if(dueEl){ out.due_chip={color:getComputedStyle(dueEl).color, text:dueEl.innerText.replace(/\s+/g,' ').slice(0,30)}; }
    // roster panel outer
    const rosterHdr=Array.from(document.querySelectorAll('*')).find(e=>/^Submissions Roster/.test((e.innerText||'').trim()) && e.children.length<8);
    if(rosterHdr){
      let p=rosterHdr;
      for(let i=0;i<8&&p;i++){p=p.parentElement; if(!p)break; const s=getComputedStyle(p); const r=p.getBoundingClientRect(); if(r.height>200 && s.backgroundColor!=='rgba(0, 0, 0, 0)'){ out.panel_surface={bg:s.backgroundColor,border:s.borderColor,radius:s.borderRadius}; break; }}
      // count badge "0/1"
      const cnt=Array.from(rosterHdr.querySelectorAll('*')).find(e=>/^\d+\/\d+$/.test((e.innerText||'').trim()));
      if(cnt){const cs=getComputedStyle(cnt); out.count_badge={bg:cs.backgroundColor,color:cs.color,radius:cs.borderRadius};}
    }
    // ---- Return trigger button token ----
    const rt=Array.from(document.querySelectorAll('button')).find(b=>/^Return$/.test((b.innerText||'').trim()));
    if(rt){const s=getComputedStyle(rt); out.return_btn={bg:s.backgroundColor,color:s.color,border:s.borderColor,radius:s.borderRadius,boxShadow:s.boxShadow.slice(0,60)};}
    // ---- New Assignment primary ----
    const na=Array.from(document.querySelectorAll('button')).find(b=>/New Assignment/.test((b.innerText||'')));
    if(na){const s=getComputedStyle(na); out.new_assignment_btn={bg:s.backgroundColor,color:s.color,radius:s.borderRadius};}
    // ---- Mark as Done toggle ----
    const md=Array.from(document.querySelectorAll('*')).find(e=>/Mark as Done/.test(e.innerText||'') && e.children.length<6);
    if(md){ const box=md.querySelector('[role=switch],input,button')||md.querySelector('div[class*=rounded]'); if(box){const s=getComputedStyle(box); out.done_toggle={bg:s.backgroundColor,border:s.borderColor,radius:s.borderRadius};}}
    return out;
  });
  console.log(JSON.stringify(t,null,2));

  // Now the Return dialog header name check + focus ring alpha
  const row = page.locator('text=Awaiting').first();
  const rb=await row.boundingBox(); if(rb) await page.mouse.move(rb.x-150,rb.y+rb.height/2);
  await page.waitForTimeout(400);
  const rbtn=page.getByRole('button',{name:/^Return$/}).first();
  await rbtn.click({force:true}).catch(()=>{});
  await page.waitForTimeout(1000);
  const dlg=await page.evaluate(()=>{
    const d=document.querySelector('[role=dialog]'); if(!d) return {found:false};
    const hdr=d.querySelector('h1,h2,h3,header')?.innerText?.replace(/\s+/g,' ').trim();
    // aria-label
    return {found:true, header:hdr, aria:d.getAttribute('aria-label'), aria_modal:d.getAttribute('aria-modal')};
  });
  console.log('DIALOG-HEADER:', JSON.stringify(dlg));
  await browser.close();
})();
