# V-1 Karen — source-claim verification (wave-39)

**Wave:** 39 — settings-doorway user menu (StudyHall)
**Target:** DEPLOYED production, against merge commit `21f02ee`
**Lane:** source-claim reality (NOT spec conformance — that is jenny's lane)
**Verdict:** **APPROVE**

Every load-bearing claim is TRUE. All three files exist at the merge commit, the B-6 C1 fix
is present in-code and guarded by a genuine (non-decorative, non-skipped) regression test, and
the live-served production bundle provably carries the new code. No claimed-but-fake, no
decorative test, no undocumented deferral found.

---

## Claim-by-claim

### Claim 1 — UserMenu.tsx: component + 3 menuitems + C1 signOut fix — TRUE
- `git show 21f02ee:apps/web/src/shell/UserMenu.tsx` → file EXISTS; exports `UserMenu`.
- 3 menuitems present: `Profile` → `navigate('/settings/profile')`; `Privacy` →
  `navigate('/settings/privacy')`; `Log out` → signOut + `navigate('/login')`
  (`UserMenu.tsx` `items` array).
- **C1 fix confirmed in-code** (`UserMenu.tsx`, Log out `action`): `await Session.signOut()`
  imported from `supertokens-auth-react/recipe/session`, inside a `try { … } catch { /* swallow */ }
  finally { navigate('/login'); }`. `navigate('/login')` is in the `finally` block — leaves on
  both success and revoke-failure. Commit `91bcb5a` is on branch `wave-39-settings-menu`,
  squash-merged into `21f02ee`; verified by content, not ancestry (squash merge).
- H1 (`handleSelect` awaits action before `onClose()`) and MEDIUM (opening-focus via
  `firstItemRef` effect) fixes also present.

### Claim 2 — ChannelSidebar.tsx wiring — TRUE
- `import { UserMenu } from './UserMenu'` (line 20); `menuOpen` state (171) + `settingsBtnRef`
  (173).
- Settings button (`aria-label="Your profile and settings"`, line ~412): `onClick={() =>
  setMenuOpen((prev) => !prev)}` (416), `aria-haspopup="menu"` (413), `aria-expanded={menuOpen}`
  (414). `{menuOpen && <UserMenu anchorRef={settingsBtnRef} onClose={…} />}` (407).
- Fixes wave-38 F1 (previously dead settings button with no onClick).

### Claim 3 — UserMenu.test.tsx C1 guard test — TRUE (genuine, not decorative)
- File EXISTS at `21f02ee`. Test `it('[C1] navigates to /login even when Session.signOut()
  rejects')` (line 129): arranges `mockSignOut.mockRejectedValueOnce(new Error('network error'))`,
  clicks Log out, then `await waitFor` asserting `mockSignOut` called once AND
  `mockNavigate` called with `'/login'` AND `onClose` called once. This asserts the failure-path
  behavior — a real regression guard, not a placeholder.
- 8 `it()` cases total; **zero** `.skip / .todo / xit / xdescribe` — no coverage theater.

### Claim 4 — Deploy serves the merge commit — TRUE
- C-2 claims web deployment `257dacb4` SUCCESS, served bundle `/assets/index-QN5fEltz.js`,
  marker `User menu` found. Re-confirmed against LIVE prod now:
  - `curl https://web-production-bce1a8.up.railway.app/` → **HTTP 200**.
  - index.html references `/assets/index-QN5fEltz.js` — **exact match** to C-2's cited hash
    (no re-deploy drift since C-2).
  - Served bundle contains `User menu` (1 occurrence) — the `UserMenu.tsx:aria-label`, a
    change-unique literal absent at `21f02ee~1`.
  - Corroborating markers in the live bundle: `/settings/privacy` (2), `/settings/profile` (2),
    `Your profile and settings` (1), `haspopup` (5). Bundle size 1,693,258 bytes (matches C-2's
    1,693,259 within a trailing-newline rounding). The new UserMenu code IS the code serving traffic.

### Claim 5 — Frontend-only, no schema/env/deps — TRUE
- B-0 deliverable (`process/waves/wave-39/stages/B-0-branch-and-schema.md`):
  `schema_skipped: true`, `deps_added: []`, `migrations: []`, "Env: none. Deps: none. Schema:
  SKIPPED (frontend-only wave)." Consistent with a UI-only change; no migration or env cutover
  claimed anywhere in B/C.

### Claim 6 — Antipattern sweep — CLEAN
- No claimed-but-fake: every file cited exists at the merge and serves live.
- No decorative test: C1 test exercises the real reject path with a real assertion; suite has no
  skipped/todo cases.
- No undocumented deferral: no TODO/stub/"phase 2" markers in the shipped UserMenu path;
  frontend-only scope matches the deliverables.

---

## Evidence trail
- `git show 21f02ee:apps/web/src/shell/{UserMenu.tsx, ChannelSidebar.tsx, UserMenu.test.tsx}`
- `git branch --contains 91bcb5a` → `wave-39-settings-menu` (squash-merged)
- Live: `curl` root (200) + served bundle `/assets/index-QN5fEltz.js` marker greps
- `process/waves/wave-39/stages/{B-0-branch-and-schema.md, C-2-deploy-and-verify.md}`

**Final: APPROVE** — 0 blocking findings.
