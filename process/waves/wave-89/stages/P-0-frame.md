# Wave 89 — P-0 Frame

## Discover
- **wave_db_id:** 6d995b9d-f7a4-453a-85a8-6cbb15108164 (wave_number 89, running)
- **Prior-work citation:** wave-81 B-6 /review F5 (origin). wave-81 made /settings/profile scrollable (FullPageScroll), which created this gap.
- **Roadmap milestone:** unassigned (roadmap complete; bug-fix phase — backlog THINNING).
- **Spec-contract short-circuit verdict:** `no-prior-spec` → full P-1..P-3.
- **wave_type:** ui (frontend ProfilePage a11y).

## Reframe

### problem-framer — PROCEED
`stages/P-0-problem-framer.md`. Gap LIVE (verified against `apps/web/src/pages/ProfilePage.tsx`): the page is wrapped in `FullPageScroll` (`h-dvh overflow-y-auto`) so fields scroll off-screen; NO save handler calls `scrollIntoView`/`.focus()` on a failed-validation save (`useRef` bound only to `avatarInputRef`). Not evaporated (unlike the last 4+ seeds). Symptom==cause (no post-submit focus management). Scope constraints for P-1/P-2:
1. **Per-form, not page-global** — ProfilePage has FIVE independent `<form>`s; "first errored field" = first-invalid-in-DOM-order WITHIN the submitted form.
2. **Load-bearing case = the academic-identity form** — `handleAcademicSave` early-returns on a shared `academicClientError` without moving to the failing field, and it's long enough to scroll off-screen. The username form already has correct `aria-invalid`/`aria-describedby` (near-no-op); display-name/avatar/accent have no blocking client-validation path. Don't gold-plate all five uniformly.
3. **Focus, not mouse-only scroll** — `.focus()` the first invalid field (native scroll + keyboard/SR support), reusing the existing `aria-invalid` + `role="alert"` pattern; no new framework.

### ceo-reviewer — PROCEED (SCOPE-REDUCTION)
`stages/P-0-ceo-reviewer.md`. Genuine minor a11y defect (failed save with no visible cue) — clears the worth-doing bar. Ship EXACTLY the one-field scroll+focus fix; fence OUT aria-live error summaries, a generalized scroll-to-error abstraction, focus-trap/keyboard audits, SR-announcement work. Low risk, correct single-wave altitude. **Strategic signal (reinforced): the backlog-drain has crossed to "worth acting on" — the founder's parked strategic-direction decision is now the highest-leverage move (see digest).**

### Merge — PROCEED to P-1
Both PROCEED (no conflict, no BOARD, no hard-stop). mvp-thinner not spawned (no active product-feature milestone). Disposition: **PROCEED.**

### Final framing the rest of P-block will use
**On a failed-validation profile save, `scrollIntoView` + `.focus()` the first invalid field (in DOM order) WITHIN the submitted form — primarily `handleAcademicSave`.** Reuse the existing `aria-invalid`/`role="alert"` pattern; add refs to the client-validated fields. Minimal scope: fix the forms that have a blocking client-validation path + an off-screen risk (academic-identity is load-bearing); do NOT overhaul all five forms or build a generalized abstraction.

## Backlog-drain signal (informational; founder-deferred — reinforced this wave)
Both P-0 reviewers independently flag it. Evidence has crossed from "worth noting" to "worth acting on": 4+ consecutive N-2 seeds evaporated at P-0; wave-88's N-2 found 3 MORE candidates already fixed; this seed is P3 polish (not a functional bug). Roadmap terminal since wave-80. The founder's parked "what next?" strategic-direction decision is the highest-leverage move. Reinforced in `process/session/updates/backlog-signal-2026-07-09.md`. roadmap-planning stays founder-deferred; the loop continues on this legitimate polish fix; the signal surfaces at the founder's next checkpoint.
