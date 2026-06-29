# Wave 8 — T-block review artifacts
**Block:** T · **Wave topic:** M2 invites/join (LIVE) · **Gate:** T-9 · **Status:** gate-passed
| Stage | Status | Notes |
|---|---|---|
| T-1 Static | done | CI lint/typecheck green (PR#18) |
| T-2 Unit | done | 179 tests (111 api: CSPRNG/preview-minimal/atomic-max_uses-concurrency/re-join-no-increment/member-gate; 68 web: join-page/share-modal) |
| T-3 Contract | done | GET /invites/:code + POST /:code/join + POST /servers/:id/invites; shared Zod |
| T-4 Integration | done | invite/join verified LIVE (C-2): preview-404/200-minimal, join-401, createInvite-401 |
| T-5 E2E | done | CI playwright e2e green (PR#18) |
| T-6 Layout | active | invite-join page (8 states) + invite-share modal (per designs) |
| T-7 Perf | skip | not heavy |
| T-8 Security | active | MANDATORY (invites = access control: CSPRNG codes, verified-join, atomic max_uses, minimal preview) |
| T-9 Journey | active | gate + journey regen (new /invite/:code route) |
## Context: security gate APPLIES. Live: invalid-preview→404, valid→200-minimal(no leak), join→401 unauthed, createInvite→401. Atomic max_uses + re-join-no-increment tested. L-flag: no persistent verified prod fixture (authed-join via tests not live).

## Block exit (T-9 gate)
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy)]
findings_total:       3
findings_critical:    0
findings_aggregate:   inline (gate-verdict.md findings table — no report file per harness)
journey_map_commit:   bef5584
ready_for_verify:     true
```
T-9 head-tester verdict: APPROVED (attempt 1). Journey map regenerated for new public /invite/:code route + verified join + invite-share. 3 non-blocking findings → V-2.
