# Wave 47 — T-4 Integration (DB + service, real Postgres via live api)

**Block:** T · **Stage:** T-4 · **Pattern:** B (active — live api over real Postgres) · **Mode:** automatic

## Subject: getDmCandidates ↔ real Postgres (server_members ⋈ users, who_can_dm filter, DISTINCT ON)
The unit layer (T-2) mocks the DB and cannot exercise the WHERE clause. T-4 proves the actual query against the deployed Postgres using two live co-member fixtures (A=21984eb2…, B=da74148e…, both members of proof server ad62cd12).

## Ground truth
- proof server ad62cd12 members = exactly [fixture A, fixture B] (GET /servers/ad62cd12/members → 2).

## Verified against real Postgres
| assertion | mechanism (real WHERE clause) | result |
|---|---|---|
| A's candidates INCLUDE co-member B | `inArray(server_members.server_id, callerServerIds)` join | **PASS** — B present |
| A's candidates EXCLUDE self | `ne(server_members.user_id, callerId)` | **PASS** — A absent from A's list |
| symmetry: B's candidates INCLUDE A, EXCLUDE self | same clauses, caller=B | **PASS** — A present, B absent |
| dedup (no duplicate userIds) | `selectDistinctOn([users.id])` | **PASS** — len(ids)==len(set(ids)) |
| DTO mapping strips internal cols | mapper drops email/who_can_dm | **PASS** — response carries neither (see T-8) |

## Honest limitations (routed to findings — non-blocking)
- **who_can_dm='nobody' exclusion NOT live-proven:** no co-member fixture with who_can_dm='nobody' exists in prod. Filter (`ne(users.who_can_dm,'nobody')`) is correct by inspection + covered by unit mock, but lacks a live positive-exclusion control.
- **Negative-isolation (non-co-member correctly hidden) NOT live-proven:** proof server has only 2 members; no third user in a disjoint server to serve as a hidden control. Correct by construction (`inArray(server_id, callerServerIds)`), but no live counterexample. See T-8 finding.

```yaml
mask_mode_signoff: PASS
test_pattern: active
evidence:
  - "live api authed probes A↔B against deployed Postgres; self-exclusion + co-member inclusion + dedup all confirmed"
  - "GET /servers/ad62cd12/members = 2 (ground truth for co-membership)"
findings:
  - {severity: low, layer: T-4, location: "getDmCandidates who_can_dm filter", description: "nobody-exclusion not live-proven (no nobody co-member fixture in prod); correct by inspection + unit mock."}
  - {severity: low, layer: T-4, location: "getDmCandidates server-scope", description: "negative-isolation (non-co-member hidden) not live-proven (only 2-member proof server; no disjoint 3rd user). Correct by construction."}
