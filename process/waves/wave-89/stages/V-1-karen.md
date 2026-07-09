# V-1 Karen — Source-Claim Verification (wave-89, StudyHall)

**Reviewer:** karen (fresh context, source-claim verification against DEPLOYED state)
**Target:** merge commit `b27277db04547c8c49b5f7c501fe6de68ddf4a12` (PR #110, on main)
**Deployed web:** `https://web-production-bce1a8.up.railway.app/` (deployment `cf2cf979` per C-2)
**Local main HEAD:** `125d8e6b` (contains b27277db; verified `git branch --contains`)

## VERDICT: APPROVE

All 6 load-bearing claims verified with hard evidence (file:line at the merge commit + command output). The fix is genuinely reachable (not dead-code-behind-a-disabled-button), `patchProfile` is NOT called on the error path, the deploy serves the merge commit, and the required `test` job passed. One non-blocking caveat noted below (e2e failure — not a required check).

---

## Per-claim evidence

### Claim 1 — `handleAcademicSave` scrolls+focuses first invalid field via ref map + `academicInvalidFieldKey`; DRY `academicInvalid` derivation. ✅ CONFIRMED
`apps/web/src/pages/ProfilePage.tsx` @ b27277db:
- L347–370: single DRY `academicInvalid: { key; message } | null` chained ternary over all 5 fields (pronouns→bio→institution→program→academicYear), each `.length > ACADEMIC_MAX.<field>`.
- L371–372: `academicClientError = academicInvalid?.message ?? null`, `academicInvalidFieldKey = academicInvalid?.key ?? null` — both derived from the one source (no duplicated validation).
- L374–384 error path: `if (academicInvalidFieldKey) { const ref = academicFieldRefs.current[academicInvalidFieldKey]; if (ref) { ref.scrollIntoView({ block: 'center' }); ref.focus(); } return; }` — scrollIntoView + focus + early return, all present.
- Supporting: L150 `type AcademicFieldKey = 'pronouns' | 'bio' | 'institution' | 'program' | 'academicYear'`; L151–152 `academicFieldRefs = useRef<Record<AcademicFieldKey, HTMLInputElement | HTMLTextAreaElement | null>>`.

### Claim 2 — Save button is `disabled={academicSaving}` (NOT `|| !!academicClientError`); reachable on client error. ✅ CONFIRMED
`ProfilePage.tsx` L1080–1081: `<button type="submit" disabled={academicSaving}` — only the in-flight guard. No `academicClientError` term. The button is enabled while an over-length error exists, so the submit handler (and its focus/scroll error branch) is reachable. (Contrast the sibling username button L832 which still uses `|| !!usernameClientError` — confirms this change was deliberate and scoped to the academic form.)

### Claim 3 — 5 academic fields have refs + `aria-invalid` bound to per-field over-length state. ✅ CONFIRMED
`ProfilePage.tsx` — each field assigns its ref and binds `aria-invalid` to `academicInvalidFieldKey === '<field>'`:
- pronouns: ref L890, `aria-invalid` L899
- bio: ref L922, `aria-invalid` L930
- institution: ref L957, `aria-invalid` L966
- program: ref L989, `aria-invalid` L998
- academicYear: ref L1053, `aria-invalid` L1062

### Claim 4 — Deploy serves the merge commit; web live = 200. ✅ CONFIRMED
- `curl -fsS -o /dev/null -w "%{http_code}" https://web-production-bce1a8.up.railway.app/` → **200** (live re-probe this session).
- C-2 record (`process/waves/wave-89/stages/C-2-deploy-and-verify.md`): deployment `cf2cf979-2748-4bce-b942-2d25813ad8f8`, status `SUCCESS`, `commit_hash: b27277db…` matches target, read from Railway's authoritative deployment-state endpoint (not /healthz), fresh `createdAt 2026-07-09T22:35:32Z`, `GET / → 200` (SPA index, `serve -s dist`, no /health endpoint). Commit-match (CI-13) explicitly confirmed — no stale-commit race.
- Deployed index serves bundle `assets/index-QG5ZtZS4.js` (SPA, 200).

### Claim 5 — Tests real + merged: 8 cases incl. reachability guard + focus assertions; PR #110 required `test` job passed. ✅ CONFIRMED
`apps/web/src/pages/profile-academic.test.tsx` @ b27277db exists; **8** `it(...)` blocks:
1. loads existing academic fields
2. role select populated from ACADEMIC_ROLES
3. Save round-trips PATCH /profile + refreshes shell
4. renders FullPageScroll wrapper as root
5. **failed over-length save scrolls+focuses invalid field + aria-invalid** — L164 `expect(saveBtn).not.toBeDisabled()` (reachability guard), L146 `scrollIntoView` spy, L172 `expect(bio).toHaveFocus()`, L173 `aria-invalid='true'`, L178 `expect(patchProfile).not.toHaveBeenCalled()`
6. **multiple over-length → FIRST in priority order** — L199 `not.toBeDisabled`, L205 pronouns `toHaveFocus`, L206–207 pronouns aria-invalid true / bio false, L209 patchProfile not called
7. valid save proceeds, no focus interference, no scrollIntoView (L216 spy asserted not triggered)
8. empty role option + Save clears role via `academicRole:null`

Required-check status on merge commit (`gh api .../commits/b27277db.../check-runs`): **test = success** (also lint/typecheck/build/secret-scan/boot-probe = success). Branch protection required contexts = `[lint, typecheck, test, build, secret-scan, boot-probe]`. The required `test` job passed on the merged commit — claim exact.

### Claim 6 — Antipattern check: genuinely reachable? patchProfile still NOT called on error path? ✅ CONFIRMED (both good)
- **Reachable:** button `disabled={academicSaving}` only (Claim 2) → an over-length client error no longer disables the button, so the error branch executes on submit. Not dead-code-behind-a-disabled-button (the B-6 attempt-1 failure mode is fixed). Tests 5 & 6 assert `not.toBeDisabled()` before triggering, proving the path is live.
- **patchProfile guarded:** `handleAcademicSave` `return`s inside the `if (academicInvalidFieldKey)` block (L383) BEFORE `setAcademicSaving(true)` (L387) and BEFORE `await api.patchProfile(payload)` (L407). The invalid PATCH is never sent on the error path. Independently asserted by tests 5 (L178) and 6 (L209): `expect(patchProfile).not.toHaveBeenCalled()`.

---

## Non-blocking caveat (does NOT affect verdict)
- PR #110 `e2e` check = **FAILURE**. Verified against branch protection: `e2e` is **NOT** a required status check (required = lint/typecheck/build/test/secret-scan/boot-probe). Merge was legitimate; all 6 required checks green on b27277db. T-5 (`process/waves/wave-89/stages/T-5-e2e.md`) already dispositioned the e2e failures as pre-existing, unrelated sign-in + study-timer flakes (component-test-authoritative for this client-side focus/aria change), logged low/non-blocking, head-tester APPROVE. Flagging for visibility only — the e2e suite is red on main and should be tracked for a future stabilization wave, but it is outside this wave's changed surface.

## Summary
APPROVE — all 5 source claims + the antipattern check verified at merge commit b27277db against DEPLOYED state: DRY focus-management fix is real and reachable (button no longer disabled on client error), patchProfile stays unsent on the error path, 8 real merged tests carry the reachability + focus tripwires, all required checks green, and the live web serves the merge commit (200, commit-match confirmed). Only caveat: the non-required e2e suite is failing on pre-existing unrelated flakes.
