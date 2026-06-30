# Wave 14 — V-3 Fast-fix

**Block-exit gate:** V (Verify). Phase 1 gate verdict + Phase 2 fast-fix loop.
**Mode:** automatic (direct push to main; CI gate per commit).

## Phase 1 — Gate verdict
**APPROVED.** Both V-1 reviewers ran independently and converged (Karen REJECT + jenny REJECT) on a single, well-localized, evidence-backed defect. Presence + member-list specs are demonstrably live and MATCH; typing (task 58633934) was the lone blocker — confirmed by both reviewers verbatim in shipped code at `presence.gateway.ts:381-386`. V-2 triage is sound: F-4 correctly the lone blocking fast-fix candidate (≤20 LOC, server-side), three real non-blocking items parked as task rows, remainder suppressed as noise. F-4 is a code DRIFT with a coherent spec (NOT a spec gap) → correctly routed to fast-fix, not ESCALATE. Full verdict at `process/waves/wave-14/blocks/V/gate-verdict.md`.

## Phase 2 — F-4 fast-fix loop (queue=[F-4])

### Round 1

**Finding:** F-4 — `emitTypingActive` computed one actor-excluded typers list and broadcast it to the whole `presence:channel:<id>` room → recipients got the actor stripped → sole-typer recipients received `typers: []`, no "X is typing…". Spec task 58633934 AC unmet in prod.

**Iron Law:** routed to specialist `websocket-engineer` (orchestrator did NOT edit). Steer: option (b) per-recipient/per-socket emit, fully server-side, ≤20 LOC.

**Fix applied (option b):** `apps/api/src/presence/presence.gateway.ts` — `emitTypingActive(channelId)` rewritten to `await this.server.in('presence:channel:<id>').fetchSockets()` then per-socket emit `typing:active { channelId, typers: getTypers(channelId, thatSocketsUserId) }`, excluding only each recipient's own userId. Signature became async, `selfUserId` param dropped; 4 call sites → `void this.emitTypingActive(channelId)`.
- **Production LOC changed:** 7 (method body 6 + signature 1); 4 in-place call-site edits. Well under 20 LOC budget. No abort.
- **No wire-contract change, no client change** (server-only).

**Mandatory recipient-sees-actor test:** added to `presence.gateway.spec.ts` — uses REAL `PresenceService.startTyping` (NOT a mocked `getTypers`), asserts a recipient socket receives the actor `{userId, displayName}` in a non-empty typers list AND the actor's own socket excludes itself. This is the assertion the prior coverage-theater test lacked.

**Local verify (orchestrator re-ran, not trusted):**
- `pnpm --filter @studyhall/api test` → 17 files, 252 tests, ALL PASS (incl. new F-4 regression).
- `pnpm --filter @studyhall/api typecheck` → exit 0.
- biome on both changed files → clean.

**Commit + push (automatic, direct to main):** `e85848e` "fix: V-3 fast-fix typing-fanout-per-recipient for wave-14" (task 58633934).

**CI (run 28425665658):** test/e2e/typecheck/build/boot-probe/secret-scan PASS; **lint FAIL** — pre-existing, NOT introduced by this fix: a biome format error in `presence.service.spec.ts` (from T-block commit `377d25c`) + 6 non-blocking `noNonNullAssertion` warnings in `useTyping.ts` (from feature merge `ef6afbf`). Both prior commits on main were already CI-red for this. Classified as a pre-existing repo-hygiene defect blocking a clean V-block exit.

**Lint-clear (routed to `code-quality-pragmatist`, behavior-preserving only):** `0f7db24` "style: V-3 fast-fix biome format pre-existing lint failure for wave-14" — whitespace-only AST-identical reflow of one call in `presence.service.spec.ts`. The 6 `useTyping.ts` warnings left as-is (biome's only fix is unsafe/behavior-changing; they are warnings, non-blocking). `pnpm lint` → exit 0.
**CI (run 28425845882):** ALL 7 jobs GREEN (typecheck, test, e2e, lint, build, secret-scan, boot-probe).

### Redeploy (F-4 is a backend change)
`npx @railway/cli up --service api --environment production --ci` from main @ `0f7db24`.
- api deployment `a520c586-4df5-47b4-aa3d-65aed82cb9a4` → status **SUCCESS**, instance RUNNING, prior revision REMOVED, `/health` → 200. New revision serving the fix.
- No web redeploy (server-only fix).

### Live re-verification (load-bearing proof, deployed prod api)
Two authenticated socket.io clients (fixtures `studyhall-e2e-fixture@example.com` + `studyhall-e2e-fixture-b@example.com`, co-members of server `ad62cd12`), both joined channel `93982063-4b70-4394-beaf-37168aef7098`. Client A emitted `typing:start`:
- **Recipient B received** `typing:active { typers: [{userId: 21984eb2-..., displayName: "studyhall-e2e-fixture"}] }` — NON-EMPTY, actor A present. (Previously B got `[]`.)
- **Actor A received** `typers: []` — self-exclusion preserved per-recipient.

**F-4 LIVE VERIFY: PASS.** The original failing condition no longer reproduces.

### Re-verification (Karen always + jenny since typing is spec-covered)
- **Karen → APPROVE** — per-recipient fan-out real in committed code; regression test genuine (real service, asserts recipient sees actor); no suppression/weakening; no wire/client change; 17/17 pass.
- **jenny → APPROVE** — typing AC now MATCHES; single-typer case restored; other ACs (throttle/TTL/aggregate/no-leak, channel-scoping) intact.
- Both noted a shared non-blocking observation (now-async emit is fire-and-forget via `void` → a rejected `fetchSockets()` would be an unhandled rejection; N getTypers per emit, negligible at MVP scale). Out of F-4 scope; logged for L-block.

## Final verdict
**APPROVED.** F-4 resolved-with-evidence: fixed in committed+deployed code, proven live with two real clients, both reviewers re-APPROVE. Queue cleared in 1 fast-fix round (cap 3 — 2 remaining). No B re-entry, no escalation. V-block exits to L.

```yaml
phase1_head_verifier_verdict: APPROVED
skipped: false
queue_items_processed: 1
queue_items_fixed: 1
queue_items_moved_to_b_re_entry: []
fast_fix_rounds: 1
loc_per_fix:
  F-4: 7   # production LOC (gateway.ts); +call-site edits; under 20 budget
re_verification:
  karen: APPROVE
  jenny: APPROVE
live_reverify: PASS   # two-client: recipient B saw actor A in typers; A self-excluded
api_redeploy_revision: a520c586-4df5-47b4-aa3d-65aed82cb9a4   # status SUCCESS
ci_run_final: 28425845882   # all 7 jobs green
commits: [e85848e, 0f7db24]
cap_escalation: false
escalation_destination: none
non_blocking_followups_for_L:
  - "emitTypingActive fire-and-forget: rejected fetchSockets() promise = unhandled rejection (pre-existing fan-out pattern)"
  - "N getTypers calls per emit (per-socket) — negligible at MVP scale; revisit if large-room perf AC added"
  - "useTyping.ts 6 noNonNullAssertion lint warnings — biome safe-fix unavailable; needs guarded rewrite under review"
```
