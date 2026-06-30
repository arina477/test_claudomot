# T-8 — Security (wave-14) — LOAD-BEARING

**Block:** T · **Stage:** T-8 · **Layer:** Auth/session/WS-upgrade + membership-scoping · **Pattern:** B (active, two-client live) · **Mode:** automatic

## Wave classification
`wave_type` includes **auth** (WS-upgrade session validation reused from /messaging; sessions). T-8 fires. This is the security-tightened-gate carry: every presence/typing event MUST be membership-scoped, verified with two authenticated clients (fan-out + no-leak). `applicable_probes: [auth_smoke(WS), session, authz/IDOR(members), secret_grep]`.

## Test infrastructure (two genuine distinct verified users)
The single primary fixture cannot prove co-member fan-out (same userId = multi-tab only). Provisioned + email-verified a SECOND user (studyhall-e2e-fixture-b, da74148e) via SuperTokens Core admin API (temp public domain → generate+consume verify token → isVerified=true → domain deleted, PORT var removed; Core restored to prior state). Joined account-b to the proof server (ad62cd12) via invite → both co-members (members count 2). Recorded in command-center/testing/test-accounts.md (gitignored).
Wire-level harness: socket.io-client 4.8.3 against deployed wss /presence; real st-access-token from /auth/signin.

## Results — WS-upgrade auth (Action 1)
| Probe | Verdict | Evidence |
|---|---|---|
| WS upgrade WITHOUT session | PASS (rejected) | connect_error "Unauthorized" — no namespace join, no events |
| WS upgrade UNVERIFIED user | PASS (rejected) | account-b pre-verify → connect_error "Unauthorized" (EmailVerificationClaim enforced — defense-in-depth) |
| WS upgrade VERIFIED user | PASS (accepted) | fixture connects + presence:snapshot delivered |

## Results — two-client presence fan-out + NO-LEAK (the load-bearing proof)
| Probe | Verdict | Evidence |
|---|---|---|
| presence:snapshot on join (co-member resolution) | PASS | B's snapshot includes co-member A {userId:A,status} |
| Cross-user presence:online fan-out | PASS | B receives presence:online{userId:A} 311ms after A connects (distinct user, not self-echo) |
| Fan-out latency < 1s | PASS | online 311ms / offline 79ms |
| presence:offline fan-out | PASS | B receives presence:offline{A} 79ms on A disconnect (ref-count→0) |
| Multi-tab self-presence no-flap | PASS | A's 2nd tab → 0 self online/offline events on A's tab1 (AC#5) |
| NO-LEAK (presence id scoping) | PASS | B only ever received co-member presence ids (A,B); 0 foreign userIds |
| typing channel-scoped NO-LEAK | PASS | B NOT joined to channel general → received 0 typing:active for it |

## Results — typing fan-out
| Probe | Verdict | Evidence |
|---|---|---|
| typing self-exclusion | PASS | A never appears in A's own typing:active typers |
| typing TTL auto-expire | PASS | A removed from typers ~5s idle (typers:[] clear emitted) |
| **typing fan-out (B sees A typing)** | **FAIL → F-4 HIGH** | B (joined channel, co-member) receives typing:active but typers ALWAYS [] across 3 renewed typing:starts. B NEVER sees A as a typer. |

### F-4 root cause (HIGH, surfaced for V-2 — NOT fixed per Iron Law)
`presence.gateway.ts:381 emitTypingActive(channelId, selfUserId)` calls `getTypers(channelId, selfUserId)` which excludes the ACTOR, then broadcasts that SINGLE list to the whole `presence:channel:<id>` room. Every recipient (not just the actor) gets the actor filtered out → co-members never see "<name> is typing". Violates task 58633934 AC ("Other members CURRENTLY VIEWING the same channel see a '<name> is typing…' line"). The typing indicator is structurally non-functional for its core purpose. Correct fix (B-block, V-2 to route): emit the full typers list to the room and let each client filter itself client-side, OR emit per-recipient with per-socket exclusion. Triage tag: bug-realtime / B-2 backend. Unit tests passed (getTypers tested in isolation) — this is precisely the single-layer false-green that two-client live testing exists to catch.

## Results — members endpoint authz/IDOR (Action 2)
| Probe | Verdict | Evidence |
|---|---|---|
| GET /servers/:id/members unauthed | PASS (401) | AuthGuard rejects no-token |
| GET members as member (fixture) | PASS (200) | roster [{userId,displayName,avatarUrl}] |
| GET members as account-b pre-join (unverified) | PASS (403) | st-ev claim 403 — verify-before-authz guard order (correct: 401/verify before 403/member-gate) |

Note: the verified-non-member member-gate 403 (service ForbiddenException 'Not a member') was not isolated live because the email-verification claim returns 403 one layer earlier; once account-b verified+joined it became a member (200). Guard stacking order is correct. The pure member-gate query lacks a dedicated test (F-3b, LOW).

## Action 5 — Secret grep (ALWAYS)
`git diff 71633ac..ef6afbf` secret grep: 27 matches, ALL code identifiers (accessToken/sAccessToken), doc-comments, and supertokens-node imports — ZERO literal credential values. gitleaks/secret-scan CI job PASS at C-1. **secret_grep_findings: [] (clean).**

```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [ws_auth_smoke, session, authz_idor_members, secret_grep]
auth_smoke:
  positive: ["verified fixture WS upgrade accepted + snapshot", "GET members member 200"]
  negative: ["WS upgrade no-session rejected", "WS upgrade unverified rejected", "GET members unauthed 401", "GET members unverified 403"]
two_client_results:
  presence_snapshot: PASS
  presence_online_fanout: "PASS 311ms"
  presence_offline_fanout: "PASS 79ms"
  multitab_no_flap: PASS
  presence_no_leak: "PASS (0 foreign ids)"
  typing_channel_scoped_no_leak: PASS
  typing_self_exclusion: PASS
  typing_ttl: PASS
  typing_fanout_to_comember: "FAIL — F-4 HIGH"
session_results: ["WS upgrade reuses SuperTokens session; unauth+unverified+verified all behave correctly"]
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: HIGH, category: realtime-correctness, description: "F-4: typing indicator structurally non-functional — emitTypingActive excludes the actor from ALL recipients via single broadcast; co-members never see who is typing (task 58633934 AC unmet).", remediation: "B-2: emit full typers list + client-side self-filter, or per-recipient exclusion. V-2 to triage blocking."}
head_signoff:
  verdict: APPROVED-WITH-FINDING
  stage: T-8
  failed_checks: []
  rationale: "Membership-scoping SECURITY is sound: two-client presence fan-out + no-leak PROVEN (B sees A online 311ms/offline 79ms; 0 foreign ids; typing channel-scoped no-leak; WS rejects unauth+unverified; members 401/403). Secret grep clean. NO security/scoping leak. The one FAIL (F-4) is a realtime-CORRECTNESS defect (typing payload always empty), not a security leak — surfaced HIGH for V-2 to triage blocking. The security-tightened gate's load-bearing proof (no presence/typing leak to non-co-members) HOLDS."
  next_action: PROCEED_TO_T-9
```
