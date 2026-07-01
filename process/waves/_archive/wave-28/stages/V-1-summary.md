# Wave 28 — V-1 Summary

Karen + jenny ran independently against the LIVE deployed state (api-production-b93e.up.railway.app, merge 8996230). Both APPROVE.

```yaml
karen_verdict: APPROVE
karen_findings_count: 1               # LOW informational only
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 1               # F28-T8a spec-gap (200-vs-201)
spec_drift_count: 0
spec_gap_count: 1                     # F28-T8a — spec text wrong, deployed 201 correct
jenny_false_positives_documented: 0
findings:
  - {id: F28-T8a, source: jenny, class: spec-gap, summary: "spec AC1 said 200; deployed-correct is 201 (NestJS @Post default, matches sibling create handlers)"}
  - {id: F28-V1k, source: karen, class: informational, summary: "B-2 deliverable says 6 integration cases, actual 7 (extra = AC5 404); no impact"}
```

- **karen APPROVE:** every load-bearing claim holds in the deployed state — rotateInviteCode owner-ONLY (no creator path, contrast revoke:354), generateCode reuse + 23505-retry, route live 401 (not 404 → serves the merge), no orphan migration, the 2 documented limitations actually in the JSDoc, product-decisions wave-28 entry present. Only a cosmetic 6-vs-7 count typo.
- **jenny APPROVE:** all 7 AC intents met live; owner-ONLY 403 proven vs a REAL verified non-owner session (T-8 fixture B, server ad62cd12); old-link invalidation complete (single UNIQUE column, both preview+join re-resolve). F28-T8a classified spec-GAP → amend spec to 201 (not @HttpCode(200)).

→ V-2 triage.
