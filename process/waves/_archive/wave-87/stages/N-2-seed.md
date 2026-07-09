# N-2 — Seed (wave-87 → seeds wave-88)

## Seed selection (Actions 1–2)

No active milestone (bug-fix phase). Seed drawn from the unassigned improvement backlog via `Task — next claimable`: oldest eligible `status='todo'`, `parent_task_id IS NULL`, `wave_id IS NULL`, re-verified against live code (PRODUCT-PRINCIPLES rule 1 stale-backlog check).

The strict-oldest candidates were skipped as NON-bugs (premise not a live defect):
- `4b397de0` Assignments IDOR controller-spec — test-debt ("behavior correct, assertion absent").
- `6f257c82` Assignments rowToDto N+1 → JOIN — "correct results, fine at 0-user scale."
- `72cb6ebb` stale manage_channels comment sweep — misleading comments, LOW, not a bug.
- `ee6421a7` mention tokenizer split boundary — "NEUTRALIZED... zero user-visible harm today."
- `4905dc3a` reminder retry — real harm but "deferred until real traffic; triage when DAU > 0."
- `ed34c749` /settings/privacy hydration race — "not a functional defect... first-frame artifact."
- `db90252a` createServer TOCTOU — "UNREACHABLE at the current free placeholder (100_000)."

Also avoided per directive: `54ec742c` (delete-server FEATURE, needs-design — not a bug), `5cc59349` (e2e-flake) and `2c4fe8c3` (analytics) — low-priority items just filed this wave, not the highest-value claimable.

**Seed: `6eed0fc2-6f5e-42cd-8be4-b2364a5d066b`** — "Service-worker cache-bust on deploy (stale bundle served once to returning users)".

**Live-premise verification (PASS — not self-healed):** `apps/web/vite.config.ts` `VitePWA({ registerType: 'autoUpdate', workbox: {...} })` has NO `skipWaiting` and NO `clientsClaim`. With `autoUpdate`, the new service worker installs but waits (does not `clients.claim` / take control) until all tabs close — so a returning user is served the OLD cached bundle once after every deploy until the SW self-updates, exactly as the finding describes. Genuine, live, user-visible defect that recurs on every web redeploy; surfaced acutely during the wave-72 P0 white-screen fix. Well-scoped: add `skipWaiting: true` + `clientsClaim: true` (+ optional build-hash cache name / `cleanupOutdatedCaches`) so a new deploy activates immediately for returning users.

## Siblings (Action 2)

`SELECT ... WHERE parent_task_id='6eed0fc2...'` → 0 rows. Single-task bundle (valid).

## Validation (Action 3)

Seed row re-confirmed: `status='todo'`, `wave_id=NULL`, `milestone_id=NULL` (bug-fix phase — no milestone link, valid unassigned state), `parent_task_id=NULL`. PASS.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 6eed0fc2-6f5e-42cd-8be4-b2364a5d066b"
  - "bundled siblings: 0"
  - "validation: pass"
seed_task_id: 6eed0fc2-6f5e-42cd-8be4-b2364a5d066b
seed_task_title: "Service-worker cache-bust on deploy (stale bundle served once to returning users)"
bundled_sibling_ids: []
claimed_task_ids: [6eed0fc2-6f5e-42cd-8be4-b2364a5d066b]
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: "Live bug confirmed against apps/web/vite.config.ts — VitePWA workbox lacks skipWaiting/clientsClaim. Single-task bundle."

head_signoff:
  verdict: APPROVED
  stage: N-2
  reviewers: {}
  failed_checks: []
  rationale: >
    WIP-limited to one seed, zero siblings — no bundle bloat. Seed has parent_task_id IS NULL,
    status='todo', wave_id IS NULL. Premise re-verified live against apps/web/vite.config.ts (no
    skipWaiting/clientsClaim under autoUpdate) — a genuine, recurring, user-visible bug, not a
    self-healed or test-debt item; the strict-oldest candidates were correctly skipped as non-bugs
    with cited premises. Not hand-authored (pulled from the existing backlog). claimed_task_ids
    populated for B-0 claim + L-2 close.
  next_action: PROCEED_TO_N-3
```
