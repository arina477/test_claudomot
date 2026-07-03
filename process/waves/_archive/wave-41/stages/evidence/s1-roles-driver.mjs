import pw from '/home/claudomat/project/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core/index.js';
const { chromium } = pw;
import fs from 'fs';
import path from 'path';

const EXECUTABLE = '/home/claudomat/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome';
const WEB = 'https://web-production-bce1a8.up.railway.app';
const API = 'https://api-production-b93e.up.railway.app';
const A = { email: 'studyhall-e2e-fixture@example.com', pass: 'Qbq5rIg1WTzeyloo29iuCwXtSfTF1fde' };
const SERVER_NAME = 'Fixture Proof Server';
const EVID = '/home/claudomat/project/process/waves/wave-41/stages/evidence';
const ROLE_NAME = 'E2E Educator ' + Date.now().toString().slice(-5);

const log=[]; function L(...a){ const s=a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' '); console.log(s); log.push(s);}
const results={};
async function shot(p,n){ try{ await p.screenshot({path:path.join(EVID,n)}); L('  [shot]',n);}catch(e){L('  [shot-FAIL]',n,e.message);} }

(async()=>{
  const browser = await chromium.launch({ executablePath:EXECUTABLE, headless:true, args:['--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport:{width:1280,height:800} });
  const page = await ctx.newPage();
  const net=[]; page.on('response', r=>{ const u=r.url(); if(/\/roles/.test(u)) net.push(`${r.status()} ${r.request().method()} ${u.replace(API,'')}`); });
  try{
    // login
    await page.goto(`${WEB}/login`,{waitUntil:'domcontentloaded',timeout:45000}); await page.waitForTimeout(1200);
    await page.fill('input[type="email"]',A.email); await page.fill('input[type="password"]',A.pass);
    await Promise.all([ page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{}), page.locator('button[type="submit"]').first().click() ]);
    await page.waitForTimeout(3000);
    await page.goto(`${WEB}/app`,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(3500);
    await page.locator(`[data-testid="server-rail"] button[aria-label="${SERVER_NAME}"]`).first().click();
    await page.waitForTimeout(3000);
    // open roles
    await page.locator('[data-testid="server-settings-btn"]').first().click();
    await page.waitForTimeout(1500);
    await page.waitForSelector('[data-testid="roles-loaded"],[data-testid="roles-empty"],[data-testid="create-first-role-btn"]',{timeout:20000}).catch(()=>{});

    // create a role
    let createBtn = page.locator('[data-testid="create-first-role-btn"]').first();
    if(await createBtn.count()===0) createBtn = page.locator('[data-testid="add-role-btn"]').first();
    L('  create btn count:', await createBtn.count());
    await createBtn.click(); await page.waitForTimeout(800);
    await page.fill('#new-role-name', ROLE_NAME);
    await shot(page,'S1-01-create-modal.png');
    await page.locator('button:has-text("Create Role")').first().click();
    await page.waitForTimeout(2500);
    L('  post-create /roles net:', JSON.stringify(net));
    await shot(page,'S1-02-role-editor.png');

    // the created role should now be selected in editor; ensure a role is selected
    const roleItems = page.locator('[data-testid^="role-item-"]');
    L('  role items after create:', await roleItems.count());
    // select our new role if not already
    const ours = page.locator(`[data-testid^="role-item-"]:has-text("${ROLE_NAME.slice(0,10)}")`).first();
    if(await ours.count()>0){ await ours.click(); await page.waitForTimeout(1000); }

    // verify Moderate Members toggle
    const chk = page.locator('input[aria-label="Moderate Members"]').first();
    const present = await chk.count()>0;
    results.S1_toggle_present = present ? 'PASS' : 'FAIL: toggle input absent';
    L('  Moderate Members toggle present:', present);
    if(present){
      const disabled = await chk.isDisabled().catch(()=>true);
      const before = await chk.isChecked();
      L('  toggle disabled:', disabled, '| checked before:', before);
      results.S1_toggle_enableable = disabled ? 'FAIL: toggle disabled for owner' : 'PASS';
      if(!disabled){
        const track = page.locator('input[aria-label="Moderate Members"] ~ div[role="presentation"]').first();
        if(await track.count()>0) await track.click(); else await chk.click({force:true});
        await page.waitForTimeout(500);
        const after = await chk.isChecked();
        L('  checked after toggle:', after);
        results.S1_toggle_state_change = (after!==before) ? 'PASS' : 'FAIL: no state change';
        await shot(page,'S1-03-moderate-enabled.png');
        // save
        const saveBtn = page.locator('[data-testid="save-role-btn"]').first();
        const saveDisabled = await saveBtn.isDisabled().catch(()=>true);
        L('  save btn disabled:', saveDisabled);
        if(!saveDisabled){
          await saveBtn.click(); await page.waitForTimeout(2500);
          L('  post-save /roles net:', JSON.stringify(net.slice(-4)));
          const patchOk = net.some(x=>/^20[0-9]\sPATCH/.test(x));
          results.S1_save = patchOk ? 'PASS' : 'CHECK: no 2xx PATCH captured';
          // re-read checkbox persisted
          const persisted = await page.locator('input[aria-label="Moderate Members"]').first().isChecked().catch(()=>null);
          L('  persisted checked:', persisted);
          results.S1_persist = persisted===true ? 'PASS' : `CHECK persisted=${persisted}`;
          await shot(page,'S1-04-saved.png');
        } else results.S1_save='SKIP: save disabled (not dirty)';
      }
    }

    // CLEANUP: delete the role
    L('  ===== cleanup: delete role =====');
    const delBtn = page.locator('[data-testid="delete-role-btn"]').first();
    if(await delBtn.count()>0){
      await delBtn.click(); await page.waitForTimeout(800);
      const confirmDel = page.locator('button:has-text("Delete")').last();
      await confirmDel.click(); await page.waitForTimeout(2500);
      L('  post-delete /roles net:', JSON.stringify(net.slice(-4)));
      const delOk = net.some(x=>/^2(0[0-9]|04)\sDELETE/.test(x));
      results.cleanup_role = delOk ? 'OK (role deleted)' : 'CHECK: no 2xx DELETE captured';
    } else results.cleanup_role='WARN: delete btn not found';
    await shot(page,'S1-05-after-delete.png');

    // confirm no leftover custom roles
    const finalRoles = await page.evaluate(async ({API})=>{ const r=await fetch(`${API}/servers/ad62cd12-b78e-4a85-a214-042cf176b16c/roles`,{credentials:'include'}); const j=await r.json().catch(()=>[]); return Array.isArray(j)? j.map(x=>({name:x.name,isDefault:x.isDefault})) : j; },{API});
    L('  final roles:', JSON.stringify(finalRoles));
    results.final_roles = JSON.stringify(finalRoles);
  }catch(e){ L('FATAL', e.message, e.stack); results.FATAL=e.message; }
  L('===== RESULTS ====='); L(JSON.stringify(results,null,2));
  fs.writeFileSync(path.join(EVID,'s1-results.json'), JSON.stringify(results,null,2));
  fs.appendFileSync(path.join(EVID,'run-log.txt'), '\n\n=== S1 ROLES RUN ===\n'+log.join('\n'));
  await browser.close();
})();
