# Wave 78 — V-1 Independent reviews (summary)

Karen + jenny spawned in parallel, no shared context. Both APPROVE. wave-78 (member-profile-card UX polish, LIVE 855e811) verified on both axes.

## Karen (source-claim) — APPROVE (6/6, 0 REJECT)
Files exist on merge tree; **fail-closed branch confirmed** MemberProfileCard.tsx:215 `if (!(err instanceof HttpError) || err.status >= 500)` → error, else hidden (NOT the old `!== 404` fail-open — the B-6 fix content is in the squash-merge tree); service undefined-vs-null (users.service.ts:73/86/118); contract profile.ts:39-42 preprocess ''→null + read schemas untouched; Railway api+web SUCCESS @ 855e811, unauth 401; no migration; integration test is REAL (separate-connection pg read-back of set→clear→NULL + undefined-not-clobbered + idempotent). Non-blocking note: the cited fix commit 1fca71a isn't an ancestor of 855e811 because PR #97 squash-merged — content verified present, stale-hash only.

## jenny (spec-semantic) — APPROVE (0 REJECT, 0 blocking drift)
Block 1: PATCH null→persists+round-trips null; **PATCH omitting field → stays 'educator' (undefined-leave proven)**; ''→null; non-enum→400; idempotent clear; 409 preserved. Block 2: uniform 404 (68 bytes) byte-identical across nonexistent/malformed/second; PublicProfile no email; live minified bundle carries the fail-closed branch (transport/5xx→retryable, every other status→hidden); T-9 journey map regenerated with 5th state. Prod left clean.
3 LOW findings: J-1 displayName residue; J-2 cross-viewer hidden-404 not re-probed live (fixture B creds absent; mitigated by server byte-identity + T-8); J-3 spec under-specified the fail-closed superset (safe hardening beyond spec wording).

```yaml
karen_verdict: APPROVE
karen_findings_count: 0
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 3
spec_drift_count: 0
spec_gap_count: 1
jenny_false_positives_documented: 0
findings:
  - {id: J-1, sev: low, kind: test-hygiene, desc: "Fixture A displayName left 'Fixture A' by T-3 probe"}
  - {id: J-2, sev: low, kind: coverage, desc: "cross-viewer hidden-404 not re-probed live (fixture B creds absent; mitigated)"}
  - {id: J-3, sev: low, kind: spec-gap, desc: "spec under-specified fail-closed superset (code safer than spec wording)"}
```
