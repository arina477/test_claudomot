# B-6 — Review (wave-53)

## Phase 1 — head-builder (fresh spawn)
**APPROVED.** Verified all 6 ACs against the actual diff (a188168): parse-layer `isUuid` guard in all 4 parsers routing malformed ids to the pre-existing generic branch before any DB call; all 7 catch blocks hardened via DRY `safeErrorMessage`; ForbiddenException passthrough correct; unknown errors server-logged + genericized. Both P-4 carries enforced (guard on serverId/roomId only never userId — wave-40:510 not re-tripped; ForbiddenException import present). Test honesty confirmed (no-leak assertions + DB-not-called on malformed path). B-5 integration-DB env classification confirmed sound (18 real-Postgres files, zero wave-53 overlap, deferred to CI). Verdict at `blocks/B/gate-verdict.md`.

## Phase 2 — /review (production-bug diff check via code-reviewer)
### Iteration 1 (commit a188168): 0 Critical / 0 High / 1 Medium / 2 Low
Leak fully closed (all 7 catches converted; no non-Forbidden fall-through; malformed ids short-circuit before DB). Findings:
- **Medium — over-genericization UX regression:** `safeErrorMessage` forwarded only `ForbiddenException`, genericizing other author-controlled client-safe HttpExceptions (e.g. `ConflictException('Reset the room timer to change durations')`, service:602). → FIXED.
- **Low #2 — logger `{error: err}` stringifies to `[object Object]`**, weakening server-side diagnostic (leak still contained). → FIXED.
- **Nit — per-call Zod schema in uuid.util.** → FIXED (hoisted to module scope).
- **Low #1 — parseConfigPayload lacks the 120/60 upper-bound the service enforces** → ACCEPTED-DEBT (out of scope for this security wave; service still rejects out-of-range, and the HttpException-forward fix now surfaces the service's own validation message to the client).

### Fix-up (commit 482c796) — routed to websocket-engineer (Iron Law)
- Discriminator `err instanceof ForbiddenException` → `err instanceof HttpException` (superclass — covers Forbidden/Conflict/BadRequest; mirrors `auth.exception.filter.ts`'s HttpException-first ordering). Raw Error/DrizzleQueryError (the 22P02 leak) is NOT an HttpException → still hits the generic fallback + server log. Leak stays fully closed.
- Logger → `this.logger.error/warn(msg, err instanceof Error ? err.stack : String(err))` (Nest `Logger.error(message, stack?)` signature) — detail logged server-side, never to client.
- uuid.util Zod schema hoisted to module scope.
- Spec: UUID-4 assertion strengthened (loggedDetail is a string ≠ `[object Object]`, contains error text); new UUID-4b locks the Medium fix (ConflictException message reaches client verbatim).

### Re-checks after fix-up (Action 3 mandated)
- Repo-wide typecheck (B-4 re-run): 4/4 PASS.
- Full lint (B-5 re-run): 306 files, no fixes.
- Full api unit suite (B-5 re-run): **717 passed** (+1 for UUID-4b).

### Iteration 2 (commit 482c796): **CLEAN — 0 Critical / 0 High / 0 Medium / 0 Low**
All 7 service throw sites verified: 4 HttpExceptions use static author strings (no interpolated ids/SQL/state); 2 plain Errors genericize correctly. No DB error is/can be an HttpException. Logger detail server-side only. Assertions real (UUID-3/4/4b exact-match, not vacuous).

## Action 6 — Commit-discipline check
SKIPPED — `wave_type: single-spec`.

```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 2
findings_critical: []
findings_high: []
findings_medium_accepted: []       # the 1 Medium was fixed, not accepted
findings_low_accepted:
  - "parseConfigPayload lacks 120/60 upper-bound (service enforces it) — out of scope for security wave; service still rejects + now surfaces its own message"
fix_up_commits: [482c796]
final_verdict: APPROVE
```
