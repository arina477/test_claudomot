# V-1 Karen — wave-59 (StudyHall)

**Verdict: APPROVE**

Verifying the merged/deployed state at merge commit `42c95bce9cadce71714948b13804fdd3355e6925` on `main` (HEAD confirmed). Every load-bearing claim is TRUE against independently-gathered evidence. No overclaim, no antipattern, no false-green.

---

## Claim-by-claim findings (all VERIFIED)

### Claim 1 — test file EXISTS, real table-driven, all 5 buckets, verbatim `.toBe()`, not decorative — VERIFIED
- File present on main and in the merge tree: `git ls-tree 42c95bc` → `apps/web/src/shell/useTyping.test.ts` (blob `a02b46a`).
- Table-driven via `it.each(TABLE)` with exact-match assertion `expect(buildTypingLabel(typers)).toBe(expected)` at `apps/web/src/shell/useTyping.test.ts:74`.
- All 5 buckets covered with verbatim expected strings:
  - `apps/web/src/shell/useTyping.test.ts:40` — 0 typers → `''`
  - `:44` — 1 → `'Alice is typing'`
  - `:49` — 2 → `'Alice and Bob are typing'`
  - `:54` — 3 → `'Alice, Bob and Carol are typing'`
  - `:59` — 4 typers → `'Several people are typing'`
  - `:64` — 5 typers → `'Several people are typing'` (the 6th row; proves 4+ is a TRUE fallthrough, not a magic 4-only branch)
- Not skipped/decorative: `grep -E '\.(skip|only|todo)|xit|xdescribe'` → NONE. Plain `describe` + `it.each`.

### Claim 2 — `buildTypingLabel` now `export`ed; 5 branch bodies + wave-45 `as Typer` casts byte-identical — VERIFIED
- The full wave diff (`git diff 85471a3b 42c95bc`) touches this file with exactly `2 files changed, 76 insertions(+), 1 deletion(-)` — the single deletion/insertion pair is the `function` → `export function` line.
- Body-only diff (parent `85471a3b` vs merge `42c95bc`, lines 62–100) reports a SINGLE changed line:
  `< function buildTypingLabel(...)` → `> export function buildTypingLabel(...)`.
- All 5 branch bodies unchanged (`useTyping.ts:67-83`): `length===0 → ''`; `===1 → \`${a.displayName} is typing\``; `===2 → \`...and...are typing\``; `===3 → \`...,...and...are typing\``; fallthrough `return 'Several people are typing'`.
- wave-45 `as Typer` casts UNCHANGED and present at `useTyping.ts:69, 73, 74, 78, 79, 80`. Byte-identical logic confirmed.

### Claim 3 — CI ran the test (green `test` check, executed not skipped) — VERIFIED
- PR #74 `statusCheckRollup`: all 7 checks SUCCESS. The `test` check (CI workflow) completed SUCCESS at `2026-07-06T06:06:41Z` (run 28771310736, job 85305454168).
- The `test` job runs `pnpm test:ci` (`.github/workflows/ci.yml:53`) → `turbo run test:ci` (`package.json:17`) → vitest.
- vitest include glob `src/**/*.{test,spec}.{ts,tsx}` (`apps/web/vite.config.ts:50`) matches `src/shell/useTyping.test.ts` → the test is discovered and executed by the green `test` check, not skipped. B-5 records `vitest run useTyping: 6/6 pass` and B-3 `vitest 6/6 pass` (`B-5-verify.md:3`, `B-3-frontend.md:7`).

### Claim 4 — deploy serves the merge; web 200; api /health 200 (api unchanged, not redeployed) — VERIFIED (independent probe + Railway API)
- Railway GraphQL (`backboard.railway.com/graphql/v2`, `Project-Access-Token`) — **web** service `latestDeployment.status = SUCCESS`, `commitHash = 42c95bce9cadce71714948b13804fdd3355e6925` (the merge commit), domain `web-production-bce1a8.up.railway.app`.
- **api** service `latestDeployment.status = SUCCESS`, `commitHash = 65b92fbc...` — wave-58's PR #73 commit, NOT the wave-59 merge → api was NOT redeployed, exactly as claimed.
- Live probes (independent, this session): `web-production-bce1a8.up.railway.app/` → **HTTP 200**; `api-production-b93e.up.railway.app/health` → **HTTP 200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.

### Claim 5 — no production logic change beyond the export keyword — VERIFIED
- Whole-wave diff stat: only 2 files (`useTyping.test.ts` +75, `useTyping.ts` net +1/-1 = the export keyword). Test files are not bundled to prod (Vite only bundles imported runtime graph; `.test.ts` is excluded). The `export` keyword is runtime-inert. Zero runtime-behavior change. Consistent with C-2 ("test not bundled, export inert").

---

## Antipattern watch — CLEARED

- **Load-bearing, not count-only / always-true:** the test asserts `.toBe(expected)` against verbatim output strings per bucket, not `expect(x).toBeTruthy()` or a length count. If any branch body drifted (e.g. `is typing` → `is typing…`, or the 2-typer separator changed, or the 4+ constant changed), the corresponding row would fail. The 5-typer row additionally guards against a `===4`-only regression masquerading as coverage. Genuinely load-bearing.
- **F-4 NOT falsely closed:** the wave nowhere claims to fix defect F-4 (task `58633934` — server-side empty-typers fan-out, UPSTREAM of `buildTypingLabel`). Every reference carries it forward as SEPARATE and STILL OPEN: `P/gate-verdict.md:31`, `T/gate-verdict.md:25-27`, `T/findings-aggregate.md:4-5`, `T-9-journey.md:5`. This wave locks the pure-function label contract only; it does not touch the server fan-out path and does not imply F-4 resolution. Correctly scoped and honestly documented.

---

## Bottom line

A minimal, honest wave: one visibility-only export + one genuinely load-bearing 6-row contract test. Merge, CI, and deploy state all confirm the claims with no gap between claimed and actual. F-4 correctly left open and not overclaimed. **APPROVE.**
