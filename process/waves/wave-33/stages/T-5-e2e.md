# T-5 — E2E (LIVE API-behavior end-to-end against prod)

**Wave:** 33 (M6 hardening — malformed non-UUID route param → 400) · **Block:** T · **Stage:** T-5
**Pattern:** active-execution · **Target:** DEPLOYED PROD — api `https://api-production-b93e.up.railway.app` (merge `e1a64f6`, deployment `d69feba2` SUCCESS)
**Fixtures:** `studyhall-e2e-fixture` (A) — persistent prod fixture, member of proof server `ad62cd12…`. No real users touched.

## Scope note — why this is light

This wave has **NO UI change** (`design_gap_flag: false`; api-only diff — a global exception-filter extension). Per the T-5 skip/scope guidance, the "e2e" here is the **API behavior end-to-end at the deployed edge**: confirm the malformed→400 flow, the valid-UUID-unchanged flows, and the auth-boundary flows hold live, AND that no existing user journey regressed from the filter change. No Playwright swarm was warranted (no rendered surface changed); a curl-based check of valid authed journeys is the appropriate, honest coverage. The substance of this wave's verification is the T-8 malformed-UUID matrix (see `T-8-security.md`); T-5 confirms the happy path did not break.

## Scenarios (traced to acceptance criteria)

| # | AC trace | Scenario | Entry / auth | Expected observable | Observed | Verdict |
|---|----------|----------|--------------|---------------------|----------|---------|
| S1 | AC "valid-UUID UNCHANGED" | Valid authed member journey — server members | Fixture A bearer → `GET /servers/ad62cd12…/members` | 200 + member list (A+B) | **200** `[{userId:21984eb2…,username:studyhallfixturea},{…fixtureb}]` | **PASS** |
| S2 | AC "valid-UUID UNCHANGED" (non-voice) | Valid authed message-list journey | Fixture A bearer → `GET /channels/93982063…/messages?limit=5` | 200 + messages envelope | **200** `{"messages":[{id:8ecf2143…,channelId:93982063…}…]}` | **PASS** |
| S3 | AC "valid-UUID UNCHANGED" | Valid authed server-detail journey | Fixture A bearer → `GET /servers/ad62cd12…` | 200 + server object | **200** `{"server":{id:ad62cd12…,name:"Fixture Proof Ser…"}}` | **PASS** |
| S4 | AC "malformed → 400 at edge" | Malformed-UUID rejected at deployed edge (voice occupancy — wave-32 indicator path) | Fixture A bearer → `GET /channels/not-a-uuid/voice/participants` | 400 (not 500) | **400** `{"statusCode":400,"message":"Bad Request"}` | **PASS** |
| S5 | AC "auth boundary unchanged" | Valid voice-channel pre-join reachable (wave-32 occupancy path — Join reachable, gate + creds-guard intact) | Fixture A bearer → `GET /channels/<valid member voice>/voice/participants` | 503 (creds unset) — gate passed, NOT 400/broken | **503** `{"message":"Voice service is not configured",…}` | **PASS** |
| S6 | routing integrity | Nonexistent route control (filter did not become a catch-all) | unauth → `GET /this-route-does-not-exist-xyz` | 404 | **404** `{"message":"Cannot GET /…"}` | **PASS** |

## Result

**No regression.** All valid authed journeys (server members, message list, server detail) return 200 with real data — the global exception-filter extension did not intercept or alter any well-formed-UUID success path. The wave-32 voice-occupancy path is still reachable end-to-end for a valid member (503 = RBAC + type-check passed, execution reached the creds guard; Join flow's upstream is intact — the filter change touched only the malformed-format branch). Malformed input is now rejected cleanly at the edge (400, not 500). Routing is intact (404 on nonexistent). No FAIL, no FLAKE, no BLOCKED.

LiveKit media plane (actual voice join / SFU / track state) remains the documented boundary — `LIVEKIT_*` unset in prod; not headless-testable and not this wave's concern.

```yaml
test_pattern: active
skipped: false
testers_spawned: 0   # no UI change this wave; curl-based API-behavior e2e is the honest coverage (no rendered surface to sweep)
scenarios:
  - {id: S1, criterion_ref: "valid-UUID unchanged", verdict: PASS, evidence: "GET /servers/:id/members -> 200 member list"}
  - {id: S2, criterion_ref: "valid-UUID unchanged (non-voice)", verdict: PASS, evidence: "GET /channels/:id/messages -> 200 messages envelope"}
  - {id: S3, criterion_ref: "valid-UUID unchanged", verdict: PASS, evidence: "GET /servers/:id -> 200 server object"}
  - {id: S4, criterion_ref: "malformed -> 400 at edge", verdict: PASS, evidence: "GET /channels/not-a-uuid/voice/participants -> 400 generic Bad Request"}
  - {id: S5, criterion_ref: "auth boundary unchanged / occupancy path reachable", verdict: PASS, evidence: "valid member voice channel -> 503 creds-guard (gate passed), not 400"}
  - {id: S6, criterion_ref: "routing integrity", verdict: PASS, evidence: "nonexistent route -> 404 (filter is not a catch-all)"}
flakes_observed: []
fix_up_cycles: 0
findings: []
```

## head-tester sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-5
  reviewers: {}
  failed_checks: []
  rationale: >
    Every acceptance criterion has a live verdict against the deployed prod revision. No UI
    changed this wave (api-only exception-filter extension), so a Playwright swarm would be
    coverage theater against an unchanged surface — a curl-based API-behavior e2e of the valid
    authed journeys is the honest coverage. Three well-formed-UUID authed journeys (server
    members, message list, server detail) all return 200 with real data — the global filter did
    not touch any valid-UUID success path. The wave-32 voice-occupancy path is still reachable
    end-to-end for a valid member (503 creds-guard = the RBAC + type gate passed and execution
    reached the creds check; the filter changed only the malformed-format branch). Malformed
    input is rejected cleanly at the deployed edge (400, not 500), and routing integrity holds
    (404 on a nonexistent route proves the filter is not a blanket catch-all). No FAIL, FLAKE,
    or BLOCKED scenarios. LiveKit media plane is the documented non-testable boundary
    (LIVEKIT_* unset). Iron Law honored — nothing fixed here.
  next_action: PROCEED_TO_T9_GATE
```
