# Wave 89 — P-3 Plan

## Approach

### Action 1 — Architecture deltas
**Module:** `ProfilePage` academic-identity form (`apps/web/src/pages/ProfilePage.tsx`) — add post-submit focus management to the failed-validation path.
- **What changes:** `handleAcademicSave` currently `if (academicClientError) return;` (:347) — a silent early-return. Add refs to the 5 client-validated academic fields, derive which field is invalid (same priority order as `academicClientError`: pronouns → bio → institution → program → academicYear), and on the error path scroll+focus that field before returning.
- **Why this approach (vs alternatives):**
  - *Alt A — a generalized `scrollToFirstError(formRef)` DOM-query abstraction:* rejected (ceo SCOPE-REDUCTION) — over-engineered for one form; a keyed ref map is minimal + explicit.
  - *Alt B — rely on native `<form>` HTML5 validation focus:* rejected — the validation is a JS over-length guard (`academicClientError`), not native `required`/`maxLength` constraints, so the browser won't auto-focus; and the early-return preempts any native behavior.
- **Failure-domain impact:** none — client-only, single form; no network/state-machine change. The focus fires only on the existing error early-return path.

### Action 2 — Data model / Action 3 — API contracts / Action 4 — Deps
None (frontend-only; no schema, no API, no deps).

## Plan

### Action 5 — File-level steps
**B-0/B-1/B-2 (schema/contracts/backend):** skip (frontend-only).

**B-3 Frontend** (`react-specialist`):
| Path | Op | What changes | Order |
|---|---|---|---|
| `apps/web/src/pages/ProfilePage.tsx` | modify | (a) add a ref per academic field OR a `Record<fieldKey, HTMLElement>` ref map for pronouns/bio(textarea)/institution/program/academicYear; (b) derive `academicInvalidFieldKey` in the SAME priority order as `academicClientError` (:332-343), returning the first over-length field's key or null; (c) in `handleAcademicSave`, replace the bare `if (academicClientError) return;` with: focus + `scrollIntoView({block:'center'})` the invalid field's ref, then return; (d) set `aria-invalid` on the invalid academic field (reuse the username pattern at :737). Do NOT touch the username/display-name/avatar/accent forms. | single |

**B-4 Frontend cont / B-5 Verify** — test (`react-specialist`):
| Path | Op | What changes | Order |
|---|---|---|---|
| `apps/web/src/pages/profile-academic.test.tsx` | modify | Add cases: (1) submit the academic form with an over-length field scrolled context → assert the first invalid field receives focus (`toHaveFocus()`) + `aria-invalid=true`; (2) multiple over-length fields → the FIRST (priority order) is focused; (3) a VALID submit → no focus interference, save proceeds (existing happy-path test still passes); mock `scrollIntoView` (jsdom no-op) and assert it was called on the invalid field. | after B-3 |

### Action 6 — Specialist routing (validated)
- `react-specialist` — React 19 component + test. ✓ in `command-center/AGENTS.md`.

### Action 7 — Parallelization map
Single file for B-3; B-5 test after. `/simplify` on ProfilePage.tsx after B-3.

### Action 8 — Post-write consistency sweep
1. AC→step: AC1/AC2 → B-3 focus-first-invalid + B-5 focus assertions; AC3 → valid-submit unaffected + B-5 happy-path; AC4 → aria-invalid + preserved role="alert" (unchanged); AC5 → only the academic form touched. ✓
2. Every step has `react-specialist`. ✓
3. No parallel-batch conflict (single file). ✓
4. `design_gap_flag: false`. ✓
5. Alternatives with trade-offs (A/B). ✓
6/7/8. No data/API/deps/SDK. ✓
Sweep clean — ready for P-4. (Not a security wave; standard P-4 gate.)
