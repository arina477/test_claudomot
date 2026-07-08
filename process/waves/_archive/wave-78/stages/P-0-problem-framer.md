# P-0 Problem-Framer — wave-78 (M13 leg-2 follow-up: member-profile-card UX polish)

**Agent:** problem-framer (fresh-context, read-only)
**Wave:** 78 — 2-task bundle (seed 4be3b084 + sibling 3b3530d8)
**Milestone:** M13 (Institution partnerships & portable identity), in_progress, `## Class = product-feature`

## VERDICT: PROCEED

Both tasks are **cause-level**, correctly-layered, and free of the demo-path / symptom-masking antipatterns. No reframe or split needed. Two binding refinements carry to P-2 to protect the wave-77 privacy contract and to prevent an under-specified seed. Verdict is PROCEED (not PROCEED-with-caveats) because the refinements are spec-tightening, not scope changes.

## Reasoning

Both are genuine root-cause corrections to a surface that shipped LIVE in wave-77, verified against the actual code. **Seed 4be3b084** is cause-level: the defect is a contract-layer omission, not a UI patch — `UpdateProfileSchema.academicRole` is `z.enum(ACADEMIC_ROLES).optional()` with no null branch (`packages/shared/src/profile.ts:40`), so the editor's empty `<select>` option is a dead affordance that fails closed at validation. The fix belongs exactly where the defect lives (shared Zod contract → profile service write-path → editor wiring), which is the correct layer, not a wrong-layer band-aid. Critically, I confirmed the fix does **not** touch the visibility read path: `academicRole` nullability lives in the write contract (`UpdateProfileSchema`) and the DB column `academic_role` is already nullable text; the fail-closed read (`profile-visibility.service.ts`) gates only on `profile_visibility` and merely projects `academic_role` — it never depends on the enum being non-null. **Sibling 3b3530d8** is also cause-level and is the more antipattern-prone of the two: `MemberProfileCard.tsx`'s fetch `.catch` deliberately collapses the `err.status === 404` branch AND the network/5xx `else` branch into the identical `{ kind: 'hidden' }` state — the code comment itself documents the symptom-masking ("Network/other failure also degrades to the calm state"). This is the wave-77 anti-oracle done right for privacy but wrong for transport: a genuinely-hidden profile and a dropped connection read identically, so a student on flaky internet is told the peer hid their profile. The fix (branch on `HttpError.status`) is a client-side transport discrimination that needs **no server oracle** — `HttpError` already carries `.status` and `retryAfterMs` — so it can distinguish transport failure from the uniform-404 without ever asking the server *why* a profile is missing. That is precisely the distinction the anti-oracle permits.

## Antipattern red-team (PRODUCT-PRINCIPLES § Antipatterns)

- **Symptom-vs-cause:** PASS — both fixes land at the defect's own layer (Zod contract / client error-handler), not at a downstream surface masking an upstream cause.
- **Wrong-layer fix:** PASS — seed correctly fixes the shared contract + service write-path (not a UI-only hack that would leave PATCH still 400-ing); sibling fixes the client fetch handler (not a server change, which would risk the oracle).
- **Symptom-masking:** PASS — sibling specifically *removes* an existing symptom-mask (the network-error → calm-hidden collapse). Seed removes a dead affordance rather than hiding it.
- **Demo-path tunnel vision:** PASS — both address real non-happy paths (clearing a set value; transport failure) that a demo would skip.
- **Gold-plating:** PASS — ~10-20 LOC seed; a single new `FetchState` kind + retry affordance for the sibling. No scope bloat.

## Binding refinements to carry to P-2

1. **Anti-oracle preservation (sibling, HARD constraint).** The `err.status === 404` branch MUST remain byte-identical to today's `{ kind: 'hidden' }` render — same copy ("Profile Unavailable" / "hidden due to visibility settings"), same layout, same absence of retry. The new retryable state is reachable ONLY for client-observable transport failures (network error / timeout / non-404 5xx). Under NO circumstance may a hidden profile and a blocked/nonexistent one diverge, and no new server field may be introduced to signal error-kind — discrimination is purely client-side via `HttpError.status`. This is the wave-77 uniform-404 privacy contract; V-block and T-8 must re-prove it.

2. **Seed service write-path, not just the contract (seed).** Making `academicRole` nullable in `UpdateProfileSchema` is necessary but NOT sufficient: `users.service.ts:113` currently gates the write on `academicRole !== undefined` and only ever assigns a string. P-2 spec must require the service to distinguish `undefined` (field omitted → leave unchanged) from `null` (explicit clear → write `academic_role = NULL`), and an AC must assert that a PATCH sending `academicRole: null` persists NULL and a subsequent GET returns `academicRole: null`. Verify whether `PublicProfileSchema` / `ProfileResponseSchema` already tolerate null (they do — both are `z.enum(...).nullable()`), so no read-schema change is needed; call that out so B-block doesn't over-touch the read path.

3. **Contract-representation choice is a P-2/B-block call, flagged only.** `z.enum(...).nullable()` vs a `''→null` preprocess both satisfy the seed; prefer explicit `.nullable()` for a clean typed null over string-coercion, but this is an implementation detail, not a framing blocker.

## Confirmations requested by the caller

- **Seed nullable change does NOT touch the visibility read path:** CONFIRMED. Read path (`profile-visibility.service.ts`) gates on `profile_visibility` only and projects `academic_role` as `?? null`; it is independent of the write contract's nullability.
- **Sibling must not weaken the uniform-404 anti-oracle:** CONFIRMED as binding refinement #1 — carried as a HARD constraint to P-2, V-block, and T-8.
