# Wave 44 — V-1 Reviews summary
Independent Karen + jenny vs deployed LIVE (api+web @ 4522101; PR #58).
## Karen — source-claim: APPROVE (0 blocking; 1 Low non-defect)
All 6 polish fixes + no-regression verified in merge tree + deployed: DTO timestamps additive (scheduling.ts:27-28); a11y overlay real code + in the live bundle index-CX7LuM3C.js (aria-modal ×12); 31 unit cases executed in green CI 28695990855; c50f3040 done; scheduling routes 401, /health 200. No claimed-but-fake / decorative / undocumented-deferral. Low non-defect: assignments.service.ts:41 has "manage_channels" but it's a factual HISTORICAL note ("swapped from manage_channels per plan"), active comments + can() call all manage_assignments.
## jenny — semantic-spec: APPROVE (0 drift; 2 spec-anticipated ENV-gaps)
All 6 ACs meet intent live: DTO projection gap CLOSED (GET returns createdAt+updatedAt ISO, updatedAt advances on edit); 1024 overlay/focus-restore/refresh/"Save" in the deployed bundle; focus-ring 0.4 + username-fallback live (organizer has displayName:"" username:"studyhallfixturea" — exactly the fallback case); comment fix live. 2 ENV-gaps: 8828484f muted-padding (no timed-out fixture member to render — fix in diff), 8d971bc2 presign-integration (deferred per spec). No regression in scheduling/assignment/moderation flows.
```yaml
karen_verdict: APPROVE
karen_findings_count: 1
jenny_verdict: APPROVE
jenny_findings_count: 2
spec_drift_count: 0
spec_gap_count: 0
findings:
  - {id: V1-F1, src: karen, sev: none, kind: historical-note, desc: "assignments.service.ts:41 manage_channels = historical note not stale claim", route: noise}
  - {id: V1-F2, src: jenny, sev: info, kind: env-gap, desc: "muted-padding not live-renderable (no timed-out fixture member); fix in diff", route: noise}
  - {id: V1-F3, src: jenny, sev: info, kind: deferred, desc: "presign-integration deferred per spec (CI S3 creds)", route: existing-8d971bc2-note}
```
