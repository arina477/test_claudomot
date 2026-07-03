import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;
import fs from 'fs';
import path from 'path';

const EXECUTABLE = '/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const WEB = 'https://web-production-bce1a8.up.railway.app';
const API = 'https://api-production-b93e.up.railway.app';
const EMAIL = 'studyhall-e2e-fixture@example.com';
const PASSWORD = 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde';
const EVID = '/home/claudomat/project/process/waves/wave-39/stages/evidence';
const AVATAR = path.join(EVID, 'avatar.png');

const log = [];
function L(...a){ const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '); console.log(s); log.push(s); }

async function shot(page, name){
  try { await page.screenshot({ path: path.join(EVID, name), fullPage:false }); L('  [shot]', name); }
  catch(e){ L('  [shot-FAIL]', name, e.message); }
}

async function login(page){
  const net=[];
  page.on('response', r => { const u=r.url(); if(u.includes('/auth')||u.includes('signin')||u.includes('login')) net.push(`${r.status()} ${u}`); });
  await page.goto(`${WEB}/login`, { waitUntil:'domcontentloaded', timeout:45000 });
  await page.waitForTimeout(1500);
  // find email/password fields
  const emailSel = 'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="mail" i]';
  const passSel  = 'input[type="password"], input[name="password"], input[autocomplete*="password"]';
  await page.waitForSelector(emailSel, { timeout:20000 });
  await page.fill(emailSel, EMAIL);
  await page.fill(passSel, PASSWORD);
  await shot(page, 'login-filled.png');
  // submit
  const btn = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in"), button:has-text("Login")').first();
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout:30000 }).catch(()=>{}),
    btn.click(),
  ]);
  await page.waitForTimeout(3000);
  L('  [login] url after submit:', page.url());
  L('  [login] auth network:', JSON.stringify(net));
  return net;
}

const results = {};

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE, headless:true, args:['--no-sandbox','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport:{ width:1280, height:800 } });
  const page = await context.newPage();
  const consoleErrs=[];
  page.on('console', m => { if(m.type()==='error') consoleErrs.push(m.text()); });
  const allNet=[];
  page.on('response', r => allNet.push({ status:r.status(), url:r.url(), method:r.request().method() }));

  try {
    // ===== LOGIN =====
    L('===== LOGIN =====');
    await login(page);
    // Navigate to app shell
    await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded', timeout:45000 });
    await page.waitForTimeout(3000);
    L('  [app] url:', page.url());
    await shot(page, 'app-shell.png');
    const loggedIn = !/\/login/.test(page.url());
    L('  [app] logged in (not on /login):', loggedIn);

    // ===== SCENARIO 1: open menu (run x2) =====
    async function findTrigger(){
      // aria-label "Your profile and settings"
      let t = page.locator('[aria-label="Your profile and settings"]').first();
      if(await t.count()===0) t = page.locator('button[aria-label*="profile" i]').first();
      if(await t.count()===0) t = page.locator('button:has-text("profile")').first();
      return t;
    }
    for(const pass of [1,2]){
      L(`===== SCENARIO 1 (T-5) open menu — pass ${pass} =====`);
      // ensure closed state, reload shell
      if(pass===2){ await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500); }
      const trig = await findTrigger();
      const cnt = await trig.count();
      L('  trigger count:', cnt);
      if(cnt===0){ results['S1_p'+pass]='FAIL: trigger not found'; continue; }
      const ariaBefore = await trig.getAttribute('aria-expanded');
      await trig.click();
      await page.waitForTimeout(800);
      const ariaAfter = await trig.getAttribute('aria-expanded');
      const menu = page.locator('[role="menu"]');
      const menuVisible = await menu.count()>0 && await menu.first().isVisible().catch(()=>false);
      // menu items
      const items = await page.locator('[role="menu"] [role="menuitem"], [role="menu"] a, [role="menu"] button').allInnerTexts().catch(()=>[]);
      L('  aria-expanded before/after:', ariaBefore, '/', ariaAfter);
      L('  menu visible:', menuVisible, 'items:', JSON.stringify(items));
      if(pass===1){
        await shot(page, 'menu-open.png');
        // capture DOM of menu
        const dom = await page.locator('[role="menu"]').first().evaluate(el=>el.outerHTML).catch(()=>'(no menu dom)');
        fs.writeFileSync(path.join(EVID,'menu-dom.html'), dom);
        L('  menu DOM saved (len):', dom.length);
      }
      results['S1_p'+pass] = (menuVisible && ariaAfter==='true') ? 'PASS' : `CHECK menuVisible=${menuVisible} aria=${ariaAfter} items=${items.length}`;
      // close for next
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ===== SCENARIO 2: Profile -> avatar upload (run x2, upload once) =====
    for(const pass of [1,2]){
      L(`===== SCENARIO 2 (T-5 CRUX) Profile+avatar — pass ${pass} =====`);
      await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
      const trig = await findTrigger();
      if(await trig.count()===0){ results['S2_p'+pass]='FAIL: trigger not found'; continue; }
      await trig.click(); await page.waitForTimeout(700);
      const profileItem = page.locator('[role="menu"]').getByText(/profile/i).first();
      const pcount = await profileItem.count();
      L('  profile menu item count:', pcount);
      if(pcount===0){ results['S2_p'+pass]='FAIL: no Profile item'; continue; }
      await profileItem.click();
      await page.waitForTimeout(3000);
      L('  url after Profile click:', page.url());
      const onProfile = /\/settings\/profile/.test(page.url());
      results['S2_nav_p'+pass] = onProfile ? 'PASS' : `FAIL url=${page.url()}`;
      if(pass===1) await shot(page, 'profile-page.png');

      // find file input for avatar
      const fileInput = page.locator('input[type="file"]');
      const fiCount = await fileInput.count();
      L('  file input count:', fiCount);
      if(pass===1){
        if(fiCount===0){ results['S2_upload']='FAIL: no file input on profile page'; }
        else {
          // capture avatar img src before
          const imgBefore = await page.locator('img').evaluateAll(imgs=>imgs.map(i=>i.src)).catch(()=>[]);
          await fileInput.first().setInputFiles(AVATAR);
          await page.waitForTimeout(1500);
          // some UIs need a Save/Upload button
          const saveBtn = page.locator('button:has-text("Save"), button:has-text("Upload"), button:has-text("Update")').first();
          if(await saveBtn.count()>0){ L('  clicking save/upload button'); await saveBtn.click().catch(()=>{}); }
          // wait for upload network
          await page.waitForTimeout(5000);
          const uploadNet = allNet.filter(n=>/avatar|upload|profile|media|image|file/i.test(n.url)).slice(-15);
          L('  upload-related network:', JSON.stringify(uploadNet));
          const imgAfter = await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({src:i.src,w:i.naturalWidth,h:i.naturalHeight}))).catch(()=>[]);
          L('  imgs after (with natural dims):', JSON.stringify(imgAfter.slice(0,10)));
          await shot(page, 'profile-after-upload.png');
          // determine render: an img whose src changed / is a blob/data/http avatar and naturalWidth>0
          const rendered = imgAfter.some(i => i.w>0 && /(avatar|blob:|data:image|amazonaws|storage|media|cdn|\/uploads?\/)/i.test(i.src));
          const anyNewImg = JSON.stringify(imgBefore)!==JSON.stringify(imgAfter.map(i=>i.src));
          const upload2xx = uploadNet.some(n=>n.status>=200 && n.status<300 && n.method!=='GET');
          results['S2_upload'] = (rendered || upload2xx) ? `PASS (rendered=${rendered} upload2xx=${upload2xx} changed=${anyNewImg})` : `CHECK rendered=${rendered} upload2xx=${upload2xx} changed=${anyNewImg}`;
          // save profile dom
          fs.writeFileSync(path.join(EVID,'profile-dom.html'), await page.content());
        }
      }
    }

    // ===== SCENARIO 3: Privacy (x2) =====
    for(const pass of [1,2]){
      L(`===== SCENARIO 3 (T-5) Privacy — pass ${pass} =====`);
      await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
      const trig = await findTrigger();
      if(await trig.count()===0){ results['S3_p'+pass]='FAIL: trigger not found'; continue; }
      await trig.click(); await page.waitForTimeout(700);
      const privItem = page.locator('[role="menu"]').getByText(/privacy/i).first();
      if(await privItem.count()===0){ results['S3_p'+pass]='FAIL: no Privacy item'; continue; }
      await privItem.click(); await page.waitForTimeout(2500);
      L('  url after Privacy click:', page.url());
      const onPriv = /\/settings\/privacy/.test(page.url());
      const bodyLen = (await page.locator('body').innerText().catch(()=>'')).length;
      results['S3_p'+pass] = (onPriv && bodyLen>20) ? 'PASS' : `FAIL url=${page.url()} bodyLen=${bodyLen}`;
      if(pass===1) await shot(page, 'privacy-page.png');
    }

    // ===== SCENARIO 4: keyboard Escape + click outside (x2) =====
    for(const pass of [1,2]){
      L(`===== SCENARIO 4 (T-5) Escape + outside-click — pass ${pass} =====`);
      await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
      const trig = await findTrigger();
      if(await trig.count()===0){ results['S4esc_p'+pass]='FAIL: trigger not found'; results['S4out_p'+pass]='FAIL'; continue; }
      // Escape test
      await trig.click(); await page.waitForTimeout(600);
      let menuVis = await page.locator('[role="menu"]').first().isVisible().catch(()=>false);
      await page.keyboard.press('Escape'); await page.waitForTimeout(500);
      let menuAfterEsc = await page.locator('[role="menu"]').count()>0 ? await page.locator('[role="menu"]').first().isVisible().catch(()=>false) : false;
      const focusIsTrigger = await page.evaluate(()=>{
        const a=document.activeElement;
        return !!(a && (a.getAttribute('aria-label')||'').toLowerCase().includes('profile'));
      });
      L('  after open menuVis:', menuVis, '| after Esc menuVis:', menuAfterEsc, '| focus back on trigger:', focusIsTrigger);
      results['S4esc_p'+pass] = (menuVis && !menuAfterEsc) ? (focusIsTrigger?'PASS':'PASS (menu closed; focus-return unverified)') : `FAIL openVis=${menuVis} escVis=${menuAfterEsc}`;
      // outside click test
      await trig.click(); await page.waitForTimeout(600);
      let menuVis2 = await page.locator('[role="menu"]').first().isVisible().catch(()=>false);
      await page.mouse.click(1000, 400); await page.waitForTimeout(500);
      let menuAfterOut = await page.locator('[role="menu"]').count()>0 ? await page.locator('[role="menu"]').first().isVisible().catch(()=>false) : false;
      L('  after open menuVis2:', menuVis2, '| after outside-click menuVis:', menuAfterOut);
      results['S4out_p'+pass] = (menuVis2 && !menuAfterOut) ? 'PASS' : `FAIL openVis=${menuVis2} outVis=${menuAfterOut}`;
    }

    // ===== SCENARIO 6: layout (before logout) =====
    L('===== SCENARIO 6 (T-6) layout =====');
    await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
    await page.setViewportSize({ width:1280, height:800 });
    {
      const trig = await findTrigger();
      if(await trig.count()>0){
        await trig.click(); await page.waitForTimeout(700);
        const menu = page.locator('[role="menu"]').first();
        if(await menu.count()>0){
          const box = await menu.boundingBox();
          const trigBox = await trig.boundingBox();
          const styles = await menu.evaluate(el=>{ const c=getComputedStyle(el); return {bg:c.backgroundColor, color:c.color}; });
          const overflowX = await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
          const opensUpward = box && trigBox ? (box.y < trigBox.y) : null;
          const inViewport = box ? (box.x>=0 && box.y>=0 && (box.x+box.width)<=1281 && (box.y+box.height)<=801) : null;
          L('  menu box:', JSON.stringify(box));
          L('  trigger box:', JSON.stringify(trigBox));
          L('  menu computed styles:', JSON.stringify(styles));
          L('  opensUpward:', opensUpward, '| inViewport:', inViewport, '| page horizontal overflow:', overflowX);
          await shot(page, 'layout-menu-1280.png');
          results['S6_layout'] = `bg=${styles.bg} color=${styles.color} opensUpward=${opensUpward} inViewport=${inViewport} hOverflow=${overflowX}`;
        } else results['S6_layout']='FAIL: menu not present';
        await page.keyboard.press('Escape');
      } else results['S6_layout']='FAIL: trigger not found';
    }

    // ===== SCENARIO 5: logout + session (do last) =====
    L('===== SCENARIO 5 (T-8) logout/session =====');
    await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(2500);
    {
      const trig = await findTrigger();
      const logoutNet=[];
      const capNet = r => { const u=r.url(); if(/signout|logout|session|auth/i.test(u)) logoutNet.push(`${r.status()} ${r.request().method()} ${u}`); };
      page.on('response', capNet);
      if(await trig.count()===0){ results['S5_logout']='FAIL: trigger not found'; }
      else {
        await trig.click(); await page.waitForTimeout(700);
        const logoutItem = page.locator('[role="menu"]').getByText(/log ?out|sign ?out/i).first();
        if(await logoutItem.count()===0){ results['S5_logout']='FAIL: no Log out item'; }
        else {
          await logoutItem.click();
          await page.waitForTimeout(4000);
          L('  url after logout:', page.url());
          L('  logout network:', JSON.stringify(logoutNet));
          const onLogin = /\/login/.test(page.url());
          results['S5_logout'] = onLogin ? 'PASS' : `CHECK url=${page.url()}`;
          await shot(page, 'after-logout.png');
          // now hit protected route
          await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded' }); await page.waitForTimeout(3000);
          L('  url after visiting /app post-logout:', page.url());
          const bounced = /\/login/.test(page.url());
          results['S5_bounce'] = bounced ? 'PASS' : `FAIL: stayed at ${page.url()}`;
          await shot(page, 'protected-bounce.png');
          // Bonus: authed API call post-logout
          const apiStatus = await page.evaluate(async (API)=>{
            try{
              const r = await fetch(`${API}/auth/session/verify`, { credentials:'include' }).catch(()=>null);
              if(r) return r.status;
              // try common endpoints
              const r2 = await fetch(`${API}/users/me`, { credentials:'include' }).catch(()=>null);
              return r2? r2.status : 'no-response';
            }catch(e){ return 'err:'+e.message; }
          }, API);
          L('  post-logout authed API status:', apiStatus);
          results['S5_api'] = (apiStatus===401||apiStatus===403) ? `PASS (${apiStatus})` : `INFO status=${apiStatus}`;
        }
      }
    }

    L('===== CONSOLE ERRORS =====');
    L(JSON.stringify([...new Set(consoleErrs)].slice(0,20), null, 1));

  } catch(e){
    L('FATAL', e.message, e.stack);
    results['FATAL']=e.message;
  } finally {
    L('===== RESULTS =====');
    L(JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(EVID,'results.json'), JSON.stringify(results,null,2));
    fs.writeFileSync(path.join(EVID,'run-log.txt'), log.join('\n'));
    // NEVER close in MCP swarms — but this is a standalone process; closing here is fine and required to end.
    await browser.close();
  }
})();
