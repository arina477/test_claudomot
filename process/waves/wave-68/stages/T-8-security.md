# T-8 — Security (live, LOAD-BEARING) — wave-68

**Layer:** T-8 Security · **Head:** head-tester · **Mode:** automatic
**Key assertion:** a NON-OWNER must NOT be able to publish/edit someone else's server (the publish path is owner-only, NOT a member-writable door).

## Setup
- Fixture A owns all 573 of its servers → no non-A-owned server existed in prod. Created a fixture-B-owned server for the test:
  `bbbbbbbb-0000-4000-8000-000000000068` "T8 Non-Owner Security Fixture", owner = fixture B (`da74148e-…`), `is_public=false`, desc/topic NULL.
- Probe issued as **authenticated fixture A** via `browser_evaluate` authenticated `fetch` (credentials:include), against the LIVE api.

## Probes + results

| Probe | Request (as auth'd fixture A) | Status | Body |
|---|---|---|---|
| **Non-owner publish (core)** | `PATCH /servers/bbbbbbbb-…-068` body `{is_public:true, description:"HACKED by non-owner", topic:"pwned"}` | **403** | `{"message":"Not authorized to update this server","error":"Forbidden","statusCode":403}` |
| **Row-unmodified (the second half of the AC)** | psql read of the target row AFTER the 403 | — | `is_public=f`, description NULL, topic NULL — **UNCHANGED. The attack payload had ZERO effect.** |
| **Missing server** | `PATCH /servers/cccccccc-…-999` `{is_public:true}` | **404** | `{"message":"Server not found","error":"Not Found","statusCode":404}` |
| **Owner positive control** | (T-5) fixture A `PATCH`ing its OWN server `ad62cd12` | **200** | update applied + persisted |

## Findings
- **Owner-only publish is enforced SERVER-SIDE (NestJS), not merely a UI hide.** A 403 + an unmodified row is the load-bearing proof: a member (or any non-owner) cannot publish someone else's server to the public directory or edit its description/topic.
- Guard ordering correct: authenticated-but-unauthorized returns **403** (not 401), and a genuinely missing resource returns **404** — the owner-gate distinguishes existence from authorization as expected.
- **UI owner-gate** (publish control hidden for non-owners): fixture A is not a member of B's server, so B's server is not reachable in A's rail to open its settings live. This negative UI case is CI-covered — the B-3 suite has 13 Overview settings tests including "owner sees the control / non-owner doesn't" (`isOwner` gate, ServerRolesPage:675 pattern). The authoritative door — the server-side PATCH guard — is proven live (403 + row-unmodified), so the UI hide is defense-in-depth, not the sole control.

## Cleanup
- T-8 fixture `bbbbbbbb-…-068` DELETED. Prod verified: **0 public servers** remain, target server restored to private. No test residue.

## Verdict
```yaml
stage: T-8
layer: security
verdict: PASS
load_bearing_assertion: owner-only-publish ENFORCED (non-owner PATCH → 403, row UNMODIFIED)
guard_side: server-side (NestJS), not UI-only
negative_cases: [non-owner→403, missing→404, row-unmodified-after-403]
ui_owner_gate: CI-covered (13 overview tests; live-unreachable because A not a member of B's server — server-side guard is the authoritative control)
idor_class: closed (non-owner cannot mutate another owner's server)
prod_left_clean: true
```
