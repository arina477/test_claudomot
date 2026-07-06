# V-1 — Source-claim verification (wave-53) — Karen

**Wave:** Backend-only security fix — study-room Socket.IO gateway info-disclosure hardening.
**Merge commit under test:** `9c114d0` on `main` (`fix: study-room non-UUID serverId info-disclosure hardening (#68)`).
**Deployed state:** api LIVE on Railway (`https://api-production-b93e.up.railway.app`), `/health` 200.

## Verdict

**APPROVE** — all 6 load-bearing claims are TRUE in the merge-commit tree AND the deployed/CI state. Zero fabrications, zero decorative tests, zero hidden deferrals. The single deferral (app-wide sweep) is explicitly documented in the spec SoT and exists as a real seedable `todo` task.

---

## Findings (claim → evidence)

### Claim 1 — Files exist + `isUuid` exported — CONFIRMED
- `git ls-tree -r 9c114d0` lists both `apps/api/src/common/uuid.util.ts` and `apps/api/src/common/uuid.util.spec.ts`.
- `uuid.util.ts:16` — `export function isUuid(value: string): boolean` backed by module-scope `const UUID_SCHEMA = z.string().uuid()` (`uuid.util.ts:14`). Pure, hoisted, convention-aligned with `packages/shared`.

### Claim 2 — Function edits present — CONFIRMED (all sub-claims)
File: `apps/api/src/study-room/study-room.gateway.ts` @ `9c114d0`.
- **`safeErrorMessage` helper exists** — defined `gateway.ts:541`; body forwards `err.message` only for `err instanceof HttpException` (`gateway.ts:542-543`), else logs full detail server-side (`.warn` on `isInvalidTextRepresentation`, else `.error`) and returns the generic fallback string. Discrimination mirrors `SupertokensExceptionFilter`.
- **All 4 parsers apply `isUuid` to serverId** — `parseServerPayload` (`gateway.ts:564`→`:567`), `parseCreatePayload` (`:571`→`:574`), `parseRoomPayload` (`:579`→`:582`), `parseConfigPayload` (`:587`→`:595`). Guard fires before any DB access → existing generic-null branch. (roomId is additionally guarded at `:583`/`:596` — superset of the spec, not a violation.)
- **Catch blocks use `safeErrorMessage`** — 7 call-sites (`grep -c` = 7): `:198, :222, :374, :401, :423, :445, :467`. Matches the 7 catch blocks named in P-3.
- **`HttpException` imported** — `gateway.ts:36` `import { HttpException, Logger } from '@nestjs/common';`.
- **`isUuid` NOT applied to any userId** — grep for `isUuid(...user...)` returns NONE. All `isUuid` args are `p.serverId` (×4) and `p.roomId` (×2). Correct: user ids are SuperTokens-issued, not user-supplied uuid-cast params, so guarding them would be wrong.

### Claim 3 — No schema/migration — CONFIRMED
- `git show 9c114d0 --name-only` (source files only): exactly 4 files touched — `uuid.util.ts`, `uuid.util.spec.ts`, `study-room.gateway.ts`, `study-room.gateway.spec.ts`. No Drizzle migration, no `.sql`, no schema file. (The only `migration`/`drizzle` string hits are prose in the commit message, not files.) B-0 `schema_skipped:true` claim holds.

### Claim 4 — Deploy hash match — CONFIRMED
- Live probe: `curl https://api-production-b93e.up.railway.app/health` → HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- C-2 Railway deployment-state evidence: both api + web deployments SUCCESS pinned to `commitSha=9c114d0bf12b7d0469b46519f550624b3db92aea` (== merge SHA), triggered explicitly via `serviceInstanceDeploy` (Railway is API-push, not git-triggered — matches the known deploy model). Stale-revision guard PASS.

### Claim 5 — Claimed tests exist + ran — CONFIRMED
- `uuid.util.spec.ts` @ `9c114d0`: 8 `it()` cases (valid v4 ×2 → true; `"abc"`, `""`, `"123"`, SQL-injection-style, malformed, too-few-segments → false).
- `study-room.gateway.spec.ts` @ `9c114d0`: UUID-1a/1b/1c (`:457/:477/:490`), UUID-2 (`:509`), UUID-3 (`:531`), UUID-4 (`:553`), UUID-4b (`:589`), UUID-5 (`:612`), UUID-6 (`:632`) — the full claimed set incl. 4b.
- CI run `28758318294`: overall `conclusion:success`; `test` job (id 85269069340) SUCCESS running `pnpm test:ci`; plus typecheck/lint/build/e2e/boot-probe/secret-scan all green. (Run headSha `444c0432` is the PR-head pre-squash commit — expected; the squash produced `9c114d0` with identical tree for these 4 files.)

### Claim 6 — Antipattern catalog — CLEAN
- **Not decorative:** UUID-1a (`gateway.spec.ts:457`) asserts the emitted `JOIN_ERROR` message contains none of `SQL_LEAK_PATTERNS` AND that `svc.getOpenRooms` was never called (parse rejection before DB) — real no-leak + no-DB-access assertions. UUID-3/4b assert exact HttpException message forwarding; UUID-4 asserts logger called with real stack detail (not `[object Object]`).
- **Deferral is documented, not hidden:** spec SoT (`tasks.description` of `fb1c367a`) explicitly states the reusable guard "is the durable artifact the deferred app-wide-sweep follow-up (seed c52a7a52) consumes." Seed `c52a7a52-c2da-48d7-ac08-a8d849e9f429` exists as a real `todo` task ("App-wide sweep: apply UUID-format guard to all remaining cli…"), `wave_id=NULL` (correctly seedable). Legitimate scope-split, not a fake completion.

---

## Severity summary
| Severity | Count | Notes |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 0 | — |

No gaps between claimed and actual. **APPROVE.**
