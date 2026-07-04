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
async function openAssignments(page){
  await page.getByRole('button',{name:'Fixture Proof Server',exact:true}).first().click();
  await page.waitForTimeout(1500);
  await page.getByText('Assignments',{exact:true}).first().click();
  await page.waitForTimeout(2500);
}

// Token normalizer helpers
function rgb(s){ return s.replace(/\s+/g,''); }

(async()=>{
  const browser=await chromium.launch({executablePath:EXE,headless:true,args:['--no-sandbox']});
  const results={};
  for(const W of [1440,1280,1024]){
    const ctx=await browser.newContext({viewport:{width:W,height:900},deviceScaleFactor:1});
    const page=await ctx.newPage();
    const errs=[];
    page.on('pageerror',e=>errs.push(e.message.slice(0,120)));
    await login(page);
    await openAssignments(page);

    // ---- overflow / clipping check ----
    const overflow = await page.evaluate((W)=>{
      const de=document.documentElement;
      const horizOverflow = de.scrollWidth > W + 1;
      // find elements whose right edge exceeds viewport
      const off=[];
      document.querySelectorAll('main *').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>0 && r.right > W+2){ off.push({tag:el.tagName, cls:(el.className||'').toString().slice(0,50), right:Math.round(r.right)}); }
      });
      return {scrollWidth:de.scrollWidth, clientWidth:de.clientWidth, horizOverflow, offRight:off.slice(0,8)};
    }, W);

    // ---- locate roster + badge + submission row + panel geometry ----
    const geo = await page.evaluate((W)=>{
      const out={};
      // Submissions Roster header
      const rosterHdr = Array.from(document.querySelectorAll('*')).find(e=>/^Submissions Roster/.test((e.innerText||'').trim()) && e.children.length<6);
      out.rosterHdrText = rosterHdr ? rosterHdr.innerText.replace(/\s+/g,' ').trim().slice(0,40) : null;
      // roster panel container = closest sizable ancestor
      // "Awaiting" badge
      const awaiting = Array.from(document.querySelectorAll('*')).find(e=>/^Awaiting$/.test((e.innerText||'').trim()) && e.children.length===0);
      if(awaiting){
        const badge = awaiting.closest('[class*=rounded],span,div') || awaiting.parentElement;
        const cs=getComputedStyle(awaiting);
        const bcs=getComputedStyle(badge);
        const r=badge.getBoundingClientRect();
        out.awaiting={ text_color:cs.color, badge_bg:bcs.backgroundColor, badge_border:bcs.borderColor, badge_radius:bcs.borderRadius,
          rect:{top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom)}, inViewport: r.right<=W && r.top>=0 };
        // the amber dot (first small round child in the badge)
        const dot = Array.from(badge.querySelectorAll('*')).find(c=>{const s=getComputedStyle(c);const rr=c.getBoundingClientRect(); return rr.width>0 && rr.width<12 && s.borderRadius.includes('9999')||/50%|9999/.test(s.borderRadius) && rr.width<12;});
        if(dot){ out.awaiting.dot_bg=getComputedStyle(dot).backgroundColor; }
      }
      // Panel surface (Submissions Roster panel) — go up from roster header to a bordered box
      if(rosterHdr){
        let p=rosterHdr;
        for(let i=0;i<6 && p;i++){ p=p.parentElement; if(p){const s=getComputedStyle(p); const r=p.getBoundingClientRect(); if(r.height>150 && (s.borderTopWidth!=='0px'||s.backgroundColor!=='rgba(0, 0, 0, 0)')){ out.panel={bg:s.backgroundColor,border:s.borderColor,radius:s.borderRadius,rect:{left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}}; break;}}}
      }
      // Assignment card surface
      const doneToggle = Array.from(document.querySelectorAll('*')).find(e=>/Mark as Done/.test((e.innerText||'')) && e.children.length<8);
      if(doneToggle){ const card=doneToggle.closest('div'); }
      return out;
    }, W);

    // ---- Return dialog: hover row, click Return, capture ----
    let dialog=null;
    try{
      const row = page.locator('text=Awaiting').first();
      await row.scrollIntoViewIfNeeded();
      // hover the submission row area to reveal Return btn
      const rowBox = await row.boundingBox();
      if(rowBox){ await page.mouse.move(rowBox.x-200, rowBox.y+rowBox.height/2); await page.waitForTimeout(400); }
      const returnBtn = page.getByRole('button',{name:/^Return$/}).first();
      if(await returnBtn.count()){
        await returnBtn.click({force:true,timeout:5000});
        await page.waitForTimeout(1200);
        await page.screenshot({path:`${SHOT}/return-dialog-${W}.png`});
        dialog = await page.evaluate((W)=>{
          const dlg = document.querySelector('[role=dialog]');
          if(!dlg) return {found:false};
          const s=getComputedStyle(dlg); const r=dlg.getBoundingClientRect();
          // primary btn (Mark Returned / Return)
          const btns=Array.from(dlg.querySelectorAll('button'));
          const primary = btns.find(b=>/return|mark returned|send/i.test(b.innerText)) || btns[btns.length-1];
          let pinfo=null;
          if(primary){const ps=getComputedStyle(primary); pinfo={text:primary.innerText.trim().slice(0,20),bg:ps.backgroundColor,color:ps.color,radius:ps.borderRadius};}
          // focused element / focus ring
          const ae=document.activeElement; let focus=null;
          if(ae && dlg.contains(ae)){const fs=getComputedStyle(ae); focus={tag:ae.tagName,boxShadow:fs.boxShadow.slice(0,80),outline:fs.outline};}
          return {found:true, bg:s.backgroundColor, border:s.borderColor, radius:s.borderRadius, boxShadow:s.boxShadow.slice(0,100),
            rect:{left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),width:Math.round(r.width)}, inViewport:r.right<=W&&r.left>=0&&r.top>=0, primary:pinfo, focus};
        }, W);
        // close dialog
        await page.keyboard.press('Escape').catch(()=>{});
        await page.waitForTimeout(400);
      } else { dialog={found:false, note:'Return button not found after hover'}; }
    }catch(e){ dialog={found:false, error:e.message.slice(0,120)}; }

    // main roster screenshot (after closing dialog)
    await page.waitForTimeout(300);
    await page.screenshot({path:`${SHOT}/roster-${W}.png`});

    results[W]={overflow, geo, dialog, pageerrors:errs.slice(0,5)};
    await ctx.close();
  }
  console.log(JSON.stringify(results,null,2));
  await browser.close();
})();
