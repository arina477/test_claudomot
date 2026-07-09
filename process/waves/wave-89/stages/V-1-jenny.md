# V-1 jenny — semantic spec verification (wave-89)

- **Task:** `45f0a88d-90dd-47b1-a827-e6cf8bbf606e` — focus first errored academic field on failed save
- **Target verified:** DEPLOYED merge `b27277db` (web `https://web-production-bce1a8.up.railway.app`, 200 on `/` and `/settings/profile`)
- **Provenance check:** working tree HEAD `125d8e6b` (docs-only) — `git diff b27277db..HEAD -- apps/web/src/pages/ProfilePage.tsx` is EMPTY, so the source I read IS the deployed source.
- **Verdict: APPROVE (with one Important semantic finding — pre-existing reachability gap, NOT introduced by this wave)**
- **One-line:** Every AC is faithfully realized in the deployed code; the wave is a sound, correctly-scoped a11y addition — but the over-length client-error state it defends is unreachable in practice (native `maxLength` + server Zod `.max()`), so the shipped behavior is a correct fix for a path that, in the real app, does not fire.

---

## AC-by-AC (INTENT vs deployed behavior)

**AC1 — failed academic save → first invalid field scrolled+focused (pronouns→bio→institution→program→academicYear).** MET (code).
`handleAcademicSave` (`ProfilePage.tsx:374`): on `academicInvalidFieldKey` truthy it looks up `academicFieldRefs.current[key]`, calls `ref.scrollIntoView({ block: 'center' })` + `ref.focus()` BEFORE `return` (`:379-384`). Replaces the former silent early-return. Priority order is DRY-derived (see AC2).

**AC2 — focused element = ACTUAL first over-length field.** MET.
`academicInvalid` (`:347-370`) derives `{key,message}` together from one priority-ordered ternary chain (pronouns→bio→institution→program→academicYear), first-match wins. `academicClientError` and `academicInvalidFieldKey` both read from it (`:371-372`) — cannot diverge. The focused ref is keyed off the same `key`. Test `profile-academic.test.tsx:183` proves pronouns wins over bio when both over-length.

**AC3 — valid submit unaffected.** MET.
When `academicInvalidFieldKey` is null the early block is skipped entirely; save proceeds (`:387-422`). Test `:214` asserts a valid save triggers no `scrollIntoView`.

**AC4 — existing error surfacing preserved + focused field aria-invalid.** MET.
`academicClientError` still renders in `<p role="alert">` (`:1073-1077`) — unchanged surfacing. Each academic field carries `aria-invalid={academicInvalidFieldKey === '<key>'}` (`:899,930,966,998,1062`), reusing the username `aria-invalid` pattern (`:775`). Test `:173` asserts the errored field gets `aria-invalid=true`.

**AC5 — academic form ONLY; username left as-is; display-name/avatar/accent unchanged.** MET.
Refs/aria-invalid/focus logic touch only the 5 academic fields + `handleAcademicSave`. Username form retains its own `aria-invalid` + `id="username-error" role="alert"` + `disabled={... || !!usernameClientError}` (`:775,832`) — untouched. Diff `b27277db` shows changes confined to `ProfilePage.tsx` academic region + the academic test file.

---

## Semantic / edge / drift analysis (prompt items 6 & 7)

### Finding I1 (Important) — the defended state is UNREACHABLE in the deployed app; this wave's premise is neutralized one layer up.
The wave's problem statement: "a user whose over-length academic field is scrolled off-screen gets no cue their save failed." But `academicClientError` fires ONLY when `field.length > ACADEMIC_MAX.field`. In the deployed app that condition is blocked on every real path:

1. **Native `maxLength` caps (pre-existing).** Every academic field carries `maxLength={ACADEMIC_MAX.<field>}` (`:900,931,967,999,1063`) — the SAME numeric cap the validator checks against. Confirmed pre-existing: in the `b27277db` diff these `maxLength` lines are unchanged context, not additions. The browser blocks keyboard entry and paste beyond the cap, so `.length` cannot exceed `ACADEMIC_MAX` via UI input.
2. **Server Zod `.max()` (mirror).** `UpdateProfileInput` in `packages/shared/src/profile.ts:35-43` enforces `pronouns .max(40)`, `bio .max(500)`, `institution/program .max(120)`, `academicYear .max(40)` — identical caps. The API rejects any over-length write, so a persisted (hence load-time) value can never exceed the cap either. `maxLength` does not truncate programmatically-set state, but there is no route to an over-length persisted value to load.

Net: through typing, paste, and server-load, the over-length branch never fires in the deployed app. The test suite itself documents this — `profile-academic.test.tsx:152` (`fireEvent.change bypasses the maxLength attribute in jsdom, so we can push` over-length) and `:162` (`dead-code-in-practice, reachable only via fireEvent.submit`). The head-tester ruled component tests authoritative, and they ARE internally correct — but they exercise a state the browser prevents.

**This is a spec-GAP against the wave's stated JOB (fix a live off-screen-error UX hole), NOT a spec-DRIFT against the ACs.** The B-6 reachability rework (see below) addressed the button layer but did not — and within the wave's fenced scope, arguably should not — touch the `maxLength` layer that actually blocks the state. The gap is inherited from the wave framing (P-0 claimed the gap was "LIVE / verified"; that verification checked the handler's absence of scroll/focus, not whether the client-error state can ever be entered).

### Finding I2 (Minor / consistency) — B-6 button-enable is UX-sound and does NOT contradict a recorded decision.
B-6 changed the Save button from `disabled={academicSaving || !!academicClientError}` to `disabled={academicSaving}` (diff line 231→232) so the submit path is reachable. Semantically this is the correct realization of "on a failed submit, scroll+focus" — a permanently-disabled button with an off-screen error is worse UX (mysterious dead control) than an enabled button that jumps the user to the problem. It also now matches the general form pattern of letting submit run and surfacing errors. Note it does NOT match the username form, which still disables on `usernameClientError` (`:832`) — a deliberate, spec-sanctioned asymmetry (AC5 fences username as "already correct, left as-is"), so this is not drift. No `product-decisions.md` entry mandates disabling-invalid-submit for the academic form; no contradiction found.

### Journey continuity (prompt item 7) — no dead-end introduced.
- Valid save: unaffected, still persists (AC3).
- Invalid save (were it reachable): now enabled button → click → jump+focus+aria-invalid+alert = strictly more actionable than before. No trap, no broken state, focus fires only on the early-return path so it never fights the spinner/success state (edge-case list confirmed in code: `setAcademicSaving` only runs after the invalid guard).
- Because the invalid state is unreachable in practice (I1), the real-world user impact of the whole wave is effectively nil — but there is no NEGATIVE journey impact. The change is inert-to-beneficial, never harmful.

---

## Categorization
- **Missing:** none.
- **Incorrect (drift):** none — all 5 ACs faithfully implemented on the deployed code.
- **Incomplete (gap vs stated job):** I1 — the fix defends a state the pre-existing `maxLength` + server `.max()` render unreachable; the wave's "live off-screen-error" premise does not hold in the deployed app.
- **Extra:** none.

## Recommendation
APPROVE for V-1. The implementation is a correct, well-scoped, accessible realization of the spec's ACs against deployed code — ship-safe, no regressions, no journey harm. Route Finding I1 to V-2 triage as an **Important (Medium)** observation for the head-verifier: it is a framing/reachability gap inherited from P-0, not a build defect, and closing it (e.g. dropping the redundant client branch, or intentionally allowing over-length entry so the a11y path can fire) is a scope question for a future wave — explicitly NOT a V-3 fast-fix here. The backlog-drain / roadmap-replan signal already flagged in P-0 is the right home for that call.

Suggest @karen cross-check that the "gap LIVE / verified" P-0 claim is reconciled against this reachability finding at the V-block gate.
