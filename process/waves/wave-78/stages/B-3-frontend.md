# Wave 78 — B-3 Frontend

react-specialist implemented both spec blocks (independent web files).

## Block 1 — editor clears academicRole (task 4be3b084) — commit 0f11579
- `apps/web/src/pages/ProfilePage.tsx`: academic-save payload now always sends academicRole for this form's edit: `academicRole: academicRole === '' ? null : academicRole` (was `...(academicRole ? {academicRole} : {})` which silently omitted → never cleared). Picking "Not specified" now sends explicit null → clears. Payload typed `UpdateProfileInput` (imported from shared).
- `apps/web/src/pages/profile-academic.test.tsx`: load 'student' → select empty → save → asserts PATCH `academicRole: null` + select reflects '' after round-trip.

## Block 2 — hidden vs transient error on card (task 3b3530d8) — commit 890658e — LOAD-BEARING anti-oracle
- `apps/web/src/shell/MemberProfileCard.tsx`: added 4th FetchState 'error'. `.catch` branches CLIENT-SIDE: HttpError && status===404 → EXISTING byte-identical 'hidden' state (unchanged copy/markup, NO retry); everything else (network throw, timeout, 5xx HttpError) → new 'error' retryable state (amber WarningIcon, DESIGN-SYSTEM amber tokens — no new hex; DS secondary "Try again" button, data-testid member-card-retry, real <button>, focus-visible). Retry = counter-bump re-running the single fetch effect.
- **Anti-oracle preserved:** 404 path byte-identical to pre-existing hidden state; retry ONLY on transport/5xx; 5xx classified transport (never hidden); NO new server field / no server why-signal — distinction is HTTP-status-vs-transport-throw client-side. api.ts already carried HttpError.status + distinct status-less network throw → no change needed.
- `apps/web/src/shell/member-profile-card.test.tsx`: +5 tests through REAL parent MemberListPanel (BUILD rule 12): 404→hidden NO retry (anti-oracle guard); network TypeError→retryable WITH button; 5xx→retryable; retry-after-transient→renders; retry-then-repeated-404→byte-identical hidden.
- BUILD rules honored: 14 (portal to body kept), 13 (opaque userId), 12 (real parent). /simplify applied (retry collapsed to counter reusing effect cancellation).

## Results
- Touched-file tests 15/15 (11 card + 4 academic); full web suite **702/702**; `pnpm --filter @studyhall/web typecheck` clean; shared dist rebuilt first.
- Deviation: none (kept "Not specified" empty-option label — spec-acceptable alternative).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/pages/ProfilePage.tsx, apps/web/src/pages/profile-academic.test.tsx, apps/web/src/shell/MemberProfileCard.tsx, apps/web/src/shell/member-profile-card.test.tsx]
designs_consumed: [design/member-profile-card.html]
deviations: []
simplify_applied: true
```
