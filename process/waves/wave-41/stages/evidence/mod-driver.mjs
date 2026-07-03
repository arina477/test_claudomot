import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;
import fs from 'fs';
import path from 'path';

const EXECUTABLE = '/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const WEB = 'https://web-production-bce1a8.up.railway.app';
const API = 'https://api-production-b93e.up.railway.app';
const A = { email: 'studyhall-e2e-fixture@example.com', pass: 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde', id: '21984eb2-8029-4c1b-9e73-bc586a0be4d2' };
const B = { email: 'studyhall-e2e-fixture-b@example.com', pass: 'Tb8xKp2mQvWz5nRj7sLcDh3aEf9gYu4w', id: 'da74148e-132e-4faf-a526-a34c28e7481b' };
const SERVER = 'ad62cd12-b78e-4a85-a214-042cf176b16c';
const SERVER_NAME = 'Fixture Proof Server';
const EVID = '/home/claudomat/project/process/waves/wave-41/stages/evidence';

const log = [];
function L(...a){ const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '); console.log(s); log.push(s); }
const results = {};
async function shot(page, name){ try{ await page.screenshot({ path: path.join(EVID,name), fullPage:false }); L('  [shot]',name);}catch(e){ L('  [shot-FAIL]',name,e.message);} }

async function login(page, who){
  await page.goto(`${WEB}/login`, { waitUntil:'domcontentloaded', timeout:45000 });
  await page.waitForTimeout(1200);
  const emailSel='input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="mail" i]';
  const passSel='input[type="password"], input[name="password"]';
  await page.waitForSelector(emailSel,{timeout:20000});
  await page.fill(emailSel, who.email);
  await page.fill(passSel, who.pass);
  const btn = page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in"), button:has-text("Login")').first();
  await Promise.all([ page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{}), btn.click() ]);
  await page.waitForTimeout(3000);
  L(`  [login ${who.email}] url:`, page.url());
  return !/\/login/.test(page.url());
}

async function selectServer(page){
  await page.goto(`${WEB}/app`, { waitUntil:'domcontentloaded', timeout:45000 });
  await page.waitForTimeout(3500);
  const railBtn = page.locator(`[data-testid="server-rail"] button[aria-label="${SERVER_NAME}"]`).first();
  const cnt = await railBtn.count();
  L('  [server] rail button count:', cnt);
  if(cnt===0){ L('  [server] available rail buttons:', JSON.stringify(await page.locator('[data-testid="server-rail"] button').evaluateAll(bs=>bs.map(b=>b.getAttribute('aria-label'))))); return false; }
  await railBtn.click();
  await page.waitForTimeout(3000);
  L('  [server] selected', SERVER_NAME);
  return true;
}

// ---- API helper via page fetch (uses cookie session) ----
async function apiState(page){
  return await page.evaluate(async ({API,SERVER,B})=>{
    const out={};
    try{ const r=await fetch(`${API}/servers/${SERVER}/members`,{credentials:'include'}); out.membersStatus=r.status; const j=await r.json().catch(()=>null); out.members=(j||[]).map(m=>({id:m.userId,name:m.displayName,mutedUntil:m.mutedUntil})); }catch(e){ out.membersErr=String(e);}
    try{ const r=await fetch(`${API}/servers/${SERVER}/permissions`,{credentials:'include'}); out.permStatus=r.status; out.perms=await r.json().catch(()=>null);}catch(e){ out.permErr=String(e);}
    return out;
  },{API,SERVER,B});
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE, headless:true, args:['--no-sandbox','--disable-dev-shm-usage'] });

  // ========================= SESSION A (owner/moderator) =========================
  const ctxA = await browser.newContext({ viewport:{ width:1280, height:800 } });
  const pageA = await ctxA.newPage();
  const netA=[];
  pageA.on('response', r=>{ const u=r.url(); if(/\/timeout|\/roles|\/members|\/permissions/.test(u)) netA.push(`${r.status()} ${r.request().method()} ${u.replace(API,'')}`); });
  const consErrA=[]; pageA.on('console', m=>{ if(m.type()==='error') consErrA.push(m.text()); });

  try {
    L('===== SESSION A LOGIN =====');
    results.A_login = (await login(pageA, A)) ? 'PASS' : 'FAIL';
    const okServer = await selectServer(pageA);
    results.A_serverSelect = okServer ? 'PASS' : 'FAIL';
    await shot(pageA,'A-01-app-shell.png');

    const st0 = await apiState(pageA);
    L('  [state pre]', JSON.stringify(st0));
    results.A_perms = st0.perms ? JSON.stringify(st0.perms) : 'n/a';

    // ---------- SCENARIO 1 (T-5): Moderate Members permission toggle ----------
    L('===== SCENARIO 1 (T-5) roles: Moderate Members toggle =====');
    const settingsBtn = pageA.locator('[data-testid="server-settings-btn"]').first();
    if(await settingsBtn.count()===0){ results.S1_toggle='FAIL: server-settings-btn not found'; }
    else {
      await settingsBtn.click();
      await pageA.waitForTimeout(1500);
      await pageA.waitForSelector('[data-testid="roles-loaded"], [data-testid="roles-empty"], [data-testid="roles-load-error"]',{timeout:20000}).catch(()=>{});
      await shot(pageA,'A-02-roles-page.png');
      // select first role in list, then look for the toggle
      const roleItems = pageA.locator('[data-testid^="role-item-"]');
      const roleCount = await roleItems.count();
      L('  role items:', roleCount);
      let toggleEnabled=false, toggledOn=false, selectedRoleName='';
      for(let i=0;i<roleCount;i++){
        await roleItems.nth(i).click();
        await pageA.waitForTimeout(900);
        const chk = pageA.locator('input[aria-label="Moderate Members"]').first();
        if(await chk.count()===0){ continue; }
        const disabled = await chk.isDisabled().catch(()=>true);
        selectedRoleName = await roleItems.nth(i).innerText().catch(()=>'');
        L(`  role[${i}] "${selectedRoleName.replace(/\n/g,' ')}" — Moderate Members toggle present, disabled=${disabled}`);
        results.S1_toggle_present = 'PASS';
        if(!disabled){
          toggleEnabled=true;
          const before = await chk.isChecked();
          // click the presentation track (sibling) since input is sr-only
          const track = pageA.locator('input[aria-label="Moderate Members"] ~ div[role="presentation"]').first();
          if(await track.count()>0){ await track.click(); } else { await chk.click({force:true}); }
          await pageA.waitForTimeout(600);
          const after = await chk.isChecked();
          toggledOn = (after !== before);
          L(`  toggled Moderate Members: ${before} -> ${after}`);
          await shot(pageA,'A-03-moderate-toggle.png');
          // revert to original state to keep role clean, then break
          if(after!==before){ if(await track.count()>0){ await track.click(); } else { await chk.click({force:true}); } await pageA.waitForTimeout(400); }
          break;
        }
      }
      if(!results.S1_toggle_present){
        // no role had the toggle; still record whether any input exists
        const anyChk = await pageA.locator('input[aria-label="Moderate Members"]').count();
        results.S1_toggle_present = anyChk>0 ? 'PASS' : 'FAIL: toggle input not found on any role';
      }
      results.S1_toggle_enableable = toggleEnabled ? (toggledOn?'PASS (toggled)':'PARTIAL (enabled, no state change)') : 'INFO: only default role(s) present (toggle read-only)';
      // close roles page
      const closeBtn = pageA.locator('button[aria-label="Close"], button[aria-label*="close" i], [data-testid="roles-close-btn"]').first();
      if(await closeBtn.count()>0){ await closeBtn.click(); } else { await pageA.keyboard.press('Escape'); }
      await pageA.waitForTimeout(1500);
    }

    // ---------- Ensure roster visible; find B's row + kebab ----------
    L('===== SCENARIO 2 (T-5) moderator timeout flow (run x2) =====');
    await pageA.waitForSelector('[data-testid="member-list-panel"]',{timeout:15000}).catch(()=>{});
    await shot(pageA,'A-04-roster.png');
    const kebabAll = await pageA.locator('[data-testid^="mod-kebab-"]').evaluateAll(bs=>bs.map(b=>b.getAttribute('data-testid')));
    L('  kebabs present:', JSON.stringify(kebabAll));
    results.S2_kebab_present = kebabAll.length>0 ? 'PASS' : 'FAIL: no mod-kebab on any row';
    const targetId = B.id; // moderate B
    const kebab = pageA.locator(`[data-testid="mod-kebab-${targetId}"]`).first();
    results.S2_kebab_on_B = (await kebab.count())>0 ? 'PASS' : `FAIL: no kebab for B(${targetId})`;

    for(const pass of [1,2]){
      L(`----- timeout pass ${pass} -----`);
      const kb = pageA.locator(`[data-testid="mod-kebab-${targetId}"]`).first();
      if(await kb.count()===0){ results[`S2_p${pass}`]='FAIL: kebab gone'; continue; }
      // capture timeout network for this pass
      const tnet=[];
      const cap = r=>{ const u=r.url(); if(/\/timeout/.test(u)) tnet.push(`${r.status()} ${r.request().method()} ${u.replace(API,'')}`); };
      pageA.on('response', cap);
      await kb.click();
      await pageA.waitForTimeout(700);
      const menu = pageA.locator(`[data-testid="mod-popover-${targetId}"]`).first();
      const menuVis = await menu.count()>0 && await menu.isVisible().catch(()=>false);
      L('  popover visible:', menuVis);
      if(pass===1){ await shot(pageA,'A-05-mod-menu.png'); results.S2_menu = menuVis?'PASS':'FAIL'; }
      const timeoutBtn = pageA.locator(`[data-testid="mod-timeout-btn-${targetId}"]`).first();
      if(await timeoutBtn.count()===0){ results[`S2_p${pass}`]='FAIL: no Time out item (already muted?)'; pageA.off('response',cap); await pageA.keyboard.press('Escape'); continue; }
      await timeoutBtn.click();
      await pageA.waitForTimeout(600);
      // duration popover
      const dur5 = pageA.locator(`[data-testid="mod-dur-5-${targetId}"]`).first();
      const durVis = await dur5.count()>0 && await dur5.isVisible().catch(()=>false);
      L('  duration popover (5m) visible:', durVis);
      if(pass===1){ await shot(pageA,'A-06-duration-popover.png'); results.S2_duration = durVis?'PASS':'FAIL'; }
      await dur5.click();
      await pageA.waitForTimeout(2000);
      pageA.off('response', cap);
      L('  timeout network:', JSON.stringify(tnet));
      results[`S2_p${pass}_net`] = tnet.join(' | ') || 'none';
      // muted indicator on B row
      const ind = pageA.locator(`[data-testid="muted-indicator-${targetId}"]`).first();
      const indVis = await ind.count()>0 && await ind.isVisible().catch(()=>false);
      L('  muted indicator visible after timeout:', indVis);
      if(pass===1){ await shot(pageA,'A-07-muted-indicator.png'); }
      const postOk = tnet.some(x=>/^20[0-9]\sPOST/.test(x));
      results[`S2_p${pass}`] = (postOk && indVis) ? 'PASS' : `CHECK post=${postOk} indicator=${indVis}`;

      // ---- Remove timeout ----
      const dnet=[];
      const capD = r=>{ const u=r.url(); if(/\/timeout/.test(u)) dnet.push(`${r.status()} ${r.request().method()} ${u.replace(API,'')}`); };
      pageA.on('response', capD);
      const kb2 = pageA.locator(`[data-testid="mod-kebab-${targetId}"]`).first();
      await kb2.click();
      await pageA.waitForTimeout(700);
      const removeBtn = pageA.locator(`[data-testid="mod-remove-timeout-btn-${targetId}"]`).first();
      if(await removeBtn.count()===0){ results[`S2_p${pass}_remove`]='FAIL: no Remove timeout item'; }
      else {
        if(pass===1){ await shot(pageA,'A-08-remove-menu.png'); }
        await removeBtn.click();
        await pageA.waitForTimeout(2000);
        L('  remove network:', JSON.stringify(dnet));
        results[`S2_p${pass}_remove_net`]=dnet.join(' | ')||'none';
        const indAfter = pageA.locator(`[data-testid="muted-indicator-${targetId}"]`).first();
        const indStill = await indAfter.count()>0 && await indAfter.isVisible().catch(()=>false);
        const delOk = dnet.some(x=>/^2(0[0-9]|04)\sDELETE/.test(x));
        results[`S2_p${pass}_remove`] = (delOk && !indStill) ? 'PASS' : `CHECK del=${delOk} indicatorStill=${indStill}`;
        if(pass===1){ await shot(pageA,'A-09-after-remove.png'); }
      }
      pageA.off('response', capD);
    }

    // ---------- SCENARIO 3 (T-5): keyboard ----------
    L('===== SCENARIO 3 (T-5) keyboard nav =====');
    try{
      const kb = pageA.locator(`[data-testid="mod-kebab-${targetId}"]`).first();
      await kb.focus();
      await pageA.keyboard.press('Enter');
      await pageA.waitForTimeout(600);
      let menuVis = await pageA.locator(`[data-testid="mod-popover-${targetId}"]`).isVisible().catch(()=>false);
      L('  menu open via Enter:', menuVis);
      // arrow nav
      await pageA.keyboard.press('ArrowDown');
      await pageA.waitForTimeout(200);
      const active1 = await pageA.evaluate(()=>document.activeElement?.getAttribute('data-testid')||document.activeElement?.getAttribute('role')||document.activeElement?.tagName);
      await pageA.keyboard.press('ArrowUp');
      await pageA.waitForTimeout(200);
      const active2 = await pageA.evaluate(()=>document.activeElement?.getAttribute('data-testid')||document.activeElement?.getAttribute('role')||document.activeElement?.tagName);
      L('  activeElement after ArrowDown/ArrowUp:', active1,'/',active2);
      // Esc closes + refocuses trigger
      await pageA.keyboard.press('Escape');
      await pageA.waitForTimeout(400);
      const menuAfterEsc = await pageA.locator(`[data-testid="mod-popover-${targetId}"]`).isVisible().catch(()=>false);
      const focusedTestid = await pageA.evaluate(()=>document.activeElement?.getAttribute('data-testid'));
      L('  menu visible after Esc:', menuAfterEsc, '| focused testid:', focusedTestid);
      const refocused = focusedTestid===`mod-kebab-${targetId}`;
      // outside click close
      await kb.click(); await pageA.waitForTimeout(500);
      const openAgain = await pageA.locator(`[data-testid="mod-popover-${targetId}"]`).isVisible().catch(()=>false);
      await pageA.mouse.click(400,300); await pageA.waitForTimeout(500);
      const closedByOutside = !(await pageA.locator(`[data-testid="mod-popover-${targetId}"]`).isVisible().catch(()=>false));
      L('  reopened:',openAgain,'| closed by outside-click:',closedByOutside);
      results.S3_keyboard = (menuVis && !menuAfterEsc && refocused && openAgain && closedByOutside)
        ? 'PASS'
        : `CHECK open=${menuVis} escClosed=${!menuAfterEsc} refocus=${refocused} outsideClose=${closedByOutside}`;
    }catch(e){ results.S3_keyboard='ERROR '+e.message; }

    // ---------- T-6 LAYOUT: menu + popover + indicator at 1280 ----------
    L('===== T-6 LAYOUT @1280 =====');
    try{
      await pageA.setViewportSize({ width:1280, height:800 });
      const overflowX = await pageA.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
      const kb = pageA.locator(`[data-testid="mod-kebab-${targetId}"]`).first();
      await kb.click(); await pageA.waitForTimeout(600);
      const menu = pageA.locator(`[data-testid="mod-popover-${targetId}"]`).first();
      const box = await menu.boundingBox();
      const styles = await menu.evaluate(el=>{ const c=getComputedStyle(el); return {bg:c.backgroundColor,color:c.color,z:c.zIndex,w:c.width}; });
      const inViewport = box ? (box.x>=0 && box.y>=0 && (box.x+box.width)<=1281 && (box.y+box.height)<=801) : null;
      L('  menu box:',JSON.stringify(box),'styles:',JSON.stringify(styles),'inViewport:',inViewport,'hOverflow:',overflowX);
      await shot(pageA,'A-10-layout-menu-1280.png');
      // open duration for layout capture
      const tb = pageA.locator(`[data-testid="mod-timeout-btn-${targetId}"]`).first();
      if(await tb.count()>0){ await tb.click(); await pageA.waitForTimeout(400); await shot(pageA,'A-11-layout-duration-1280.png'); }
      await pageA.keyboard.press('Escape');
      results.S_layout = `bg=${styles.bg} inViewport=${inViewport} hOverflow=${overflowX} z=${styles.z} w=${styles.w}`;
    }catch(e){ results.S_layout='ERROR '+e.message; }

    // ---------- Set B timed-out for Scenario 4 (non-moderator sees indicator) ----------
    L('===== prep for S4: time out B (5m) so non-moderator can observe indicator =====');
    try{
      const kb = pageA.locator(`[data-testid="mod-kebab-${targetId}"]`).first();
      await kb.click(); await pageA.waitForTimeout(500);
      const tb = pageA.locator(`[data-testid="mod-timeout-btn-${targetId}"]`).first();
      if(await tb.count()>0){ await tb.click(); await pageA.waitForTimeout(400);
        const d5 = pageA.locator(`[data-testid="mod-dur-5-${targetId}"]`).first();
        await d5.click(); await pageA.waitForTimeout(1500);
        L('  B timed out for S4 window');
      } else { L('  B already muted or no timeout btn'); await pageA.keyboard.press('Escape'); }
    }catch(e){ L('  S4-prep error', e.message); }

    L('===== A console errors ====='); L(JSON.stringify([...new Set(consErrA)].slice(0,15)));
    L('===== A moderation network ====='); L(JSON.stringify(netA.slice(-40)));
  } catch(e){ L('A FATAL', e.message, e.stack); results.A_FATAL=e.message; }

  // ========================= SESSION B (non-moderator) =========================
  const ctxB = await browser.newContext({ viewport:{ width:1280, height:800 } });
  const pageB = await ctxB.newPage();
  try {
    L('===== SCENARIO 4 (T-5) non-moderator view (session B) =====');
    results.B_login = (await login(pageB, B)) ? 'PASS':'FAIL';
    await selectServer(pageB);
    await pageB.waitForSelector('[data-testid="member-list-panel"]',{timeout:15000}).catch(()=>{});
    await pageB.waitForTimeout(2000);
    await shot(pageB,'B-01-roster.png');
    const kebabsB = await pageB.locator('[data-testid^="mod-kebab-"]').count();
    L('  [B] kebab count (expect 0):', kebabsB);
    results.S4_no_kebab = kebabsB===0 ? 'PASS' : `FAIL: ${kebabsB} kebabs visible to non-moderator`;
    // muted indicator for B (self, timed out by A)
    const indB = pageB.locator(`[data-testid="muted-indicator-${B.id}"]`).first();
    const indBvis = await indB.count()>0 && await indB.isVisible().catch(()=>false);
    L('  [B] muted indicator visible (public state):', indBvis);
    results.S4_sees_indicator = indBvis ? 'PASS' : 'FAIL: non-moderator cannot see muted indicator';
    await shot(pageB,'B-02-muted-indicator.png');
  } catch(e){ L('B FATAL', e.message); results.B_FATAL=e.message; }

  // ========================= CLEANUP: clear B timeout as A =========================
  try {
    L('===== CLEANUP: clear any B timeout =====');
    const cleaned = await pageA.evaluate(async ({API,SERVER,B})=>{
      const r = await fetch(`${API}/servers/${SERVER}/members/${B.id}/timeout`, { method:'DELETE', credentials:'include' });
      return r.status;
    },{API,SERVER,B});
    L('  cleanup DELETE status:', cleaned);
    results.cleanup = (cleaned===204||cleaned===200||cleaned===404) ? `OK (${cleaned})` : `CHECK (${cleaned})`;
    const stFinal = await apiState(pageA);
    L('  [state final]', JSON.stringify(stFinal));
    results.final_state = JSON.stringify((stFinal.members||[]).map(m=>({name:m.name,mutedUntil:m.mutedUntil})));
  } catch(e){ L('cleanup error', e.message); results.cleanup='ERROR '+e.message; }

  L('===== RESULTS ====='); L(JSON.stringify(results,null,2));
  fs.writeFileSync(path.join(EVID,'results.json'), JSON.stringify(results,null,2));
  fs.writeFileSync(path.join(EVID,'run-log.txt'), log.join('\n'));
  await browser.close();
})();
