# T-8 — Security (wave-70) [Pattern B — active, live prod] — LAUNCH-GATE SAFETY PROOF
wave_type auth (block RBAC-less but session-gated + the DM HIDE is THE safety surface). penetration-tester, 2 fixtures (A 21984eb2 / B da74148e), prod api.

## ALL 13 CHECKS PASS — block + DM HIDE PROVEN LIVE (deployed revision a2c006a)
**Block authz:**
1. no-IDOR: POST /blocks with spoofed blocker_id → 201, persisted blocker_id = A's real session id (spoof ignored); GET /blocks A-only (no cross-user leak). PASS.
2. self-block → 400. PASS. 3. non-existent user → 404. PASS. 4. idempotent double-block → same row, single entry. PASS.
**DM HIDE (launch-gate core, bidirectional — no leak on ANY path):**
- 5a B→A createConversation → 403. 5b B→A sendMessage → 403. 5c A candidates exclude B ([]). 5d B candidates exclude A ([]). 5e A listConversations hides A-B convo ([]). 5f A listMessages A-B convo → 403. 5g reverse A→B createConversation → 403. ALL PASS.
6. unblock restores: DELETE /blocks/B → 204; lists empty; A↔B mutually visible again; convo re-appears; send → 200. HIDE lifts bidirectionally. PASS.
Note: DmParticipantGuard returns 404 (IDOR-non-leak) for genuine non-participants while the block-HIDE seam returns 403 — both correct + distinct.

## Secret grep: 15 diff bypasses ALL test-mock casts (dm.service.spec `as any` constructor mocks ×7, block-ui.test `as unknown as MockApi`) — zero production secrets/bypasses.
## Cleanup: prod restored to no-blocks (A/B GET /blocks []). Block 4fe73cbc created + removed.
```yaml
test_pattern: active
skipped: false
applicable_probes: [csrf_authz, session, secret_grep]
csrf_results: ["13/13 PASS: no-IDOR, self-block 400, exists 404, idempotent; DM HIDE bidirectional at all 5 seams (403/exclude/hide) + unblock-restores"]
secret_grep_findings: []
fix_up_cycles: 0
findings: []
```
