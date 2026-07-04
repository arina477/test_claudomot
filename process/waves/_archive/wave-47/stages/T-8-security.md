# Wave 47 — T-8 Security (candidate-privacy fence)

**Block:** T · **Stage:** T-8 · **Pattern:** B (active — live exploit probes) · **Mode:** automatic
**auto_promoted:** true — wave_type not tagged `auth`, but GET /dm/candidates is a new endpoint that reads per-user privacy settings (who_can_dm) and performs a per-caller visibility/authorization decision. Sits in the auth-adjacent boundary → fire.
**applicable_probes:** [privacy_fence/IDOR, auth_boundary, rate_limit, secret_grep]. (Action 1 auth-smoke + Action 3 session-lifecycle N/A — no auth-flow/session code changed. Action 2 CSRF N/A — read-only GET, no state-change surface.)

## HEADLINE (candidate privacy fence): PASS — /dm/candidates leaks NO non-co-members; caller sees ONLY people they share a server with; self excluded; unauth 401.

## Privacy-fence probes (live, fixtures A=21984eb2…, B=da74148e…, co-members of server ad62cd12)
| probe | expected | result |
|---|---|---|
| A's candidates = co-members only | exactly [B] (the sole co-member); NO global directory | **PASS** — `[B]` only |
| self excluded | A absent from A's list | **PASS** |
| bidirectional | B's candidates = exactly [A] | **PASS** |
| DTO does NOT leak internals | response has ONLY {userId,displayName,avatarUrl}; NO email/who_can_dm | **PASS** — service selects email+who_can_dm but mapper strips them; verified live both views |
| avatarUrl nullability | null OR string, never undefined/missing | **PASS** — A-view row null, B-view row real URL |

## IDOR / callerId-spoof probes (callerId MUST be session-derived, never client-influenced)
| attack | expected | result |
|---|---|---|
| `?userId=<B>` | ignored → A's own list [B] | **PASS** — returned [B], not B's-view [A] |
| `?callerId=<B>` | ignored → [B] | **PASS** |
| `X-User-Id: <B>` header | ignored → [B] | **PASS** |
Controller derives callerId strictly from `req.session.getUserId()` — no body/param/header path. Immune to caller tampering.

## Auth boundary (Action-1-adjacent negatives)
| probe | result |
|---|---|
| no token → | **401** |
| garbage bearer → | **401** |
| malformed JWT → | **401** |
401-before-anything (no route-existence / 403-before-401 leak). @UseGuards(AuthGuard) enforced.

## Rate limit (Action 4 — new endpoint)
- GET /dm/candidates: 200×4 then **429** (NestJS global ThrottlerGuard). 429 body = "ThrottlerException: Too Many Requests" — NO internal-state leak (no redis keys / IPs).
- Direction is SAFE: the privacy-sensitive candidate directory is protected against rapid enumeration/scraping. Positive for a directory endpoint.
- Observed inconsistency: /dm/conversations bursts 8×200 (not throttled) while /dm/candidates throttles. Mild policy inconsistency — finding (low), not a vulnerability. Also explains the T-5 429s on message polling under concurrent tester load.

## Action 5 — Secret grep (always runs): ZERO matches on wave diff. CLEAN.

## Honest coverage limits (findings — non-blocking)
- who_can_dm='nobody' exclusion NOT live-proven (no nobody-set co-member fixture in prod). Correct by inspection (`ne(users.who_can_dm,'nobody')`) + unit mock.
- negative-isolation (a non-co-member who exists globally is correctly HIDDEN) NOT live-proven — proof server has only 2 members; no disjoint 3rd user as a hidden control. Correct by construction (`inArray(server_id, callerServerIds)`); the positive results (only B visible, self excluded) demonstrate the WHERE clause is active.

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [privacy_fence_idor, auth_boundary, rate_limit, secret_grep]
privacy_fence: {co_members_only: PASS, self_excluded: PASS, bidirectional: PASS, no_dto_leak: PASS}
idor_results: {query_userId: PASS_ignored, query_callerId: PASS_ignored, header_xuserid: PASS_ignored}
auth_boundary: {no_token: 401, garbage_bearer: 401, malformed_jwt: 401}
rate_limit_results: {candidates: "200x4 then 429 (ThrottlerException, no state leak)", conversations: "8x200 not throttled — inconsistency"}
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: low, category: rate_limit, description: "throttle policy inconsistent: /dm/candidates throttled ~4/burst but /dm/conversations not. Safe direction (candidate dir more protected) but review policy; also root of T-5 message-poll 429s.", remediation: "align ThrottlerGuard scope + consider read-poll backoff on client"}
  - {severity: low, category: privacy_coverage, description: "who_can_dm='nobody' exclusion not live-proven (no nobody co-member fixture). Correct by code+unit."}
  - {severity: low, category: privacy_coverage, description: "negative-isolation (non-co-member hidden) not live-proven (2-member proof server). Correct by construction."}
```
