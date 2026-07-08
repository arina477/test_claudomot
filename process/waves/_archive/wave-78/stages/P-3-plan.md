# Wave 78 — P-3 Plan

## Approach section

### Architecture deltas
- **Changed — shared profile WRITE contract:** `UpdateProfileSchema.academicRole` gains null-tolerance + empty-string→null coercion (today `z.enum(ACADEMIC_ROLES).optional()`, no null branch). **Alt:** a dedicated `DELETE/clear-role` endpoint — REJECTED (overkill; `PATCH {academicRole: null}` is the idiomatic clear). Read schemas (`ProfileResponseSchema` / `PublicProfileSchema`) already tolerate null and are NOT touched. Failure-domain: contract layer only; the fail-closed visibility resolver reads `academic_role` but never gates on it — untouched.
- **Changed — profile service write-path:** `updateProfile` must distinguish `undefined` (field absent → leave stored value) from `null` (→ write NULL). Today it gates on `academicRole !== undefined` then only writes a string. **Alt:** always assign whatever arrives — REJECTED (would clobber the role on every unrelated PATCH, since a missing field currently reads as undefined). No transaction-scope change.
- **Changed — web academic-role editor:** the `<select>`'s empty/unset option is wired to send `null` (currently a dead no-op). **Alt:** a separate "Clear role" button — REJECTED (the empty option is the natural affordance already rendered).
- **Changed — member-card fetch error handling:** `MemberProfileCard` branches CLIENT-SIDE on the fetch outcome — 404 → existing byte-identical hidden state (no retry); network/timeout/5xx → a distinct retryable error state. Today the `.catch` collapses both into one `hidden` state. **Alt:** a server-provided error-kind field — **REJECTED (violates the uniform-404 anti-oracle — would leak WHY a profile is missing).** Chosen: pure client-side discrimination via `HttpError.status`, needs no server oracle. Failure-domain: web read-path only; the server GET /profile/:userId contract is unchanged.

### Data model
- **No migration.** `users.academic_role` is already nullable text. No column/index/FK change.

### API contracts (concrete)
- **PATCH `/profile`** (self, modified) — SessionNoVerifyGuard. Request `academicRole`: enum-string | `null` | `''`(→null) | absent. Response 200 (persisted) | 400 (non-empty non-enum value) | 409 (username collision, unchanged). Idempotent.
- **GET `/profile/:userId`** (unchanged) — 200 `PublicProfile` | 404 uniform (no body oracle). Transport failures are client-observed, NOT a new server contract.

### New deps
- **None.**

## Plan section
### File-level steps by B-stage
**B-0 Branch** — branch `wave-78-profile-card-polish` off main. | **orchestrator** (no schema change) | first.
**B-1 Contracts** — `packages/shared/src/profile.ts`: `UpdateProfileSchema.academicRole` → null-tolerant + `''`→null preprocess (e.g. `z.preprocess(v=>v===''?null:v, z.enum(ACADEMIC_ROLES).nullable().optional())`); leave read schemas untouched; index.ts `.js` ESM re-export already present. | **typescript-pro** | after B-0.
**B-2 Backend** — profile service `updateProfile`: distinguish `undefined` (leave) from `null` (write NULL) for academicRole; controller PATCH already forwards the parsed DTO. Spec: PATCH `{academicRole:null}` persists + round-trips null; PATCH omitting it leaves value; PATCH `''`→null; PATCH non-enum→400; 409 preserved. | **backend-developer** | after B-1.
**B-3 Frontend** — | **react-specialist** | after B-1 (editor needs contract); the card/api work is web-only and can run alongside B-2:
- `apps/web/src/pages/ProfilePage.tsx` — academic-role `<select>` empty option sends `null`; client validation mirrors the nullable contract.
- `apps/web/src/auth/api.ts` — `getPublicProfile` surfaces the HTTP status (HttpError.status) / transport-failure marker so the card can branch.
- `apps/web/src/shell/MemberProfileCard.tsx` — branch 404 → hidden state (BYTE-IDENTICAL, no retry) vs network/timeout/5xx → distinct retryable error state + retry handler; **anti-oracle: no new server field, hidden stays identical across hidden/blocked/nonexistent.**
- tests: editor clear-role round-trip; card hidden-vs-retryable through the real parent (MemberListPanel), incl. a 404-stays-byte-identical assertion + a transport-error-shows-retry assertion.
**B-4 Wiring / B-5 Verify / B-6 Review** — standard.

### Specialist routing (validated against AGENTS.md)
typescript-pro (contract) · backend-developer (service + spec) · react-specialist (editor + api client + card + web tests). All present (used every prior wave). No D-block (design_gap_flag false).

### Parallelization map
- Serial: B-0 → B-1. After B-1: **B-2 (backend service) ∥ B-3-card (api.ts + MemberProfileCard, web-only)**; B-3-editor also after B-1. No file appears in two batches (service files vs web files disjoint).

### Self-consistency sweep
1. Every P-2 AC → ≥1 step: block-1 ACs (nullable contract B-1 + service undefined/null B-2 + editor empty-option B-3); block-2 ACs (api.ts status surface + card branch + tests B-3). ✓
2. Every step has a specialist. ✓ 3. No file in two parallel batches. ✓ 4. design_gap_flag false referenced. ✓ 5. Architecture deltas + alternatives (clear-endpoint rejected; always-assign rejected; server-error-kind-field rejected). ✓ 6. Contracts concrete (nullable PATCH pinned; no TBD). ✓ 7. No new deps. ✓ 8. No new SDK. ✓

**Binding refinements carried:** uniform-404 anti-oracle (card 404 byte-identical, retry only for client-observable transport failures, no server error-kind field — T-8 re-prove); service undefined-vs-null distinction with a null round-trip AC; read/visibility path untouched.
