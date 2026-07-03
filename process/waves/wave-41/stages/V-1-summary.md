# Wave 41 — V-1 Reviews summary

Independent Karen + jenny (no shared context) against deployed LIVE state (merge 5a5f79a; api c9e34766 + web 856562ad).

## Karen — source-claim: **APPROVE** (7/7 claim groups, 0 contradictions)
Migration 0018 (roles.moderate_members + server_members.muted_until) real + deployed-reflected (401 not 500 on route). Backend moderation.service/controller + rbac.module + messages.service assertNotMuted (createMessage:461 AND createReply:1062) + assertDeleteRankGuard (deleteMessage:847) all present, real throws not stubs. Shared rbac.ts/servers.ts contracts present. Frontend MemberListPanel/ServerRolesPage/api.ts present. Live: timeout POST+DELETE→401 (control 404), /health→200, web bundle index-DAuJKUJG.js contains "Moderate Members"+"Member moderation" (git-sourced, cliCaller:null, not stale). delete-any UI E2E deferral genuinely disclosed (not hidden). No false-green.

## jenny — semantic-spec: **APPROVE** (3 findings)
- **F1 (Medium, DRIFT, frontend-only, non-blocking → V-3 fast-fix):** delete-any message affordance is rendered for ALL viewers (`apps/web/src/shell/MainColumn.tsx:296` passes `onDelete` unconditionally) instead of "visible only with moderate_members". Backend correctly enforces 403 + degrades gracefully, so no security/data risk — cosmetic/UX drift only. This is the SAME surface T-block flagged as "delete-any UI coverage gap"; V-2 folds them.
- **F2 (Low, pre-existing):** not wave-41-introduced.
- **F3 (verification limitation, NOT a product defect):** deployed auth rejects the fixture-B credential in the test-account doc (`WRONG_CREDENTIALS_ERROR`) → jenny couldn't do live 2-user repro; verified the send-block/non-mod-403 paths via source + T-8 instead. **Action: correct command-center/testing/test-accounts.md fixture-B password.**
- All other ACs pass live: timeout/rank-guard/validation/roster-mutedUntil/grant-revoke; send-block + reply-bypass fix + server-side auto-expiry + delete-any fan-out present in deployed source + T-8-covered.

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 3
spec_drift_count: 1
spec_gap_count: 0
jenny_false_positives_documented: 0
findings:
  - {id: V1-F1, src: jenny, sev: medium, kind: drift, scope: in-scope, area: frontend, file: "apps/web/src/shell/MainColumn.tsx:296", desc: "delete-any affordance rendered for all viewers; should be moderate_members-gated (backend enforces 403, cosmetic). Folds with T-block delete-any-UI gap.", route: V-3-fast-fix}
  - {id: V1-F2, src: jenny, sev: low, kind: pre-existing, scope: out-of-scope, desc: "pre-existing, not wave-41-introduced", route: backlog}
  - {id: V1-F3, src: jenny, sev: infra, kind: test-fixture, scope: in-scope, desc: "fixture-B credential in test-accounts.md rejected by deployed auth; correct the doc", route: V-3-fast-fix}
  - {id: T-LOW1, src: T-6, sev: low, kind: cosmetic, scope: in-scope, desc: "muted-icon right-edge padding", route: V-2-classify}
  - {id: T-LOW2, src: T-5, sev: low, kind: coverage, scope: in-scope, desc: "delete-any UI E2E + 2nd-client fan-out assertion (folds with V1-F1)", route: backlog-or-fold}
  - {id: T-NOISE, src: T-2, sev: noise, kind: infra, desc: "throwaway test server persists (no server DELETE endpoint)", route: suppress}
```
