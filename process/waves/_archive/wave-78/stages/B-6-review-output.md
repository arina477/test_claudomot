# Wave 78 — B-6 /review output

Scope Check: **CLEAN** — Intent (nullable academicRole + card hidden-vs-transient-error) matches delivered diff; no unrelated files. 331 lines (7 files, ~90 production LOC + tests).

## Critical pass + adversarial subagent findings
Independent adversarial reviewer read full source of the 4 changed non-test files + api.ts/controller/schema.

| # | Sev | Conf | Finding | Disposition |
|---|---|---|---|---|
| 1 | **High** (P2→load-bearing) | 6→ | **Anti-oracle fail-OPEN default:** card branched `status !== 404 → retryable error state`, routing 401/403/410/429 into the visibly-distinct retryable surface. Safe today (server returns uniform 404, no 403 path — verified `profile.controller.ts` fail-closed NotFoundException), but a latent privacy oracle: a future target-specific non-404 would leak WHY a profile is hidden with no failing test. Also DRIFTS from the spec ("retryable only for network/timeout/5xx"). | **FIXED** — B-3 re-entry (react-specialist), commit 1fca71a: inverted to fail-CLOSED (`error` only for non-HttpError throw OR status>=500; every other status → byte-identical hidden). Added 403→hidden guard test. |
| 2 | P3 | 7 | Unbounded manual retry, no debounce; a 429 (now → hidden under the fix) is not backoff-aware. | **Accepted debt** — human-rate-limited single-click affordance; 429 routes to hidden (safe) under the fail-closed fix. Not blocking. |
| 3 | — | 9 | Retry race / stale-response / setState-after-unmount — **verified SAFE** (per-run `cancelled` flag + cleanup short-circuits). | No action. |
| 4 | P3 | 8 | Academic-form Save is all-or-nothing overwrite of the academic block (last-writer-wins across tabs). Pre-existing form pattern, confined to one form. | **Accepted debt** — pre-existing behavior, not introduced by this wave. |
| 5 | — | 8 | `z.preprocess('' → null)` vs absent-field — **verified SAFE** (undefined passes through untouched → filtered → leave). | No action. |
| 6 | — | 5 | self-DTO narrowing now tolerates NULL — **verified correct** end-to-end (roleLabel(null)→omitted row, read schemas already .nullable()). | No action. |

**Post-fix re-verification:** repo typecheck 4/4; biome ci 0 errors; web 703/703 (+1 for 403→hidden); shared 41/41. No remaining critical/high.

The finding-1 catch is the review's value: it aligned the implementation with the spec's stated intent AND hardened the crown-jewel anti-oracle to fail-closed.
