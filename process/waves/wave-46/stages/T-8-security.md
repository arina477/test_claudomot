# T-8 — Security (wave-46 M8 direct messages slice 1)

**Pattern:** B — Active-execution. The load-bearing security layer for PRIVATE MESSAGING. Active exploitation (penetration-tester agentId aa8b17b5) against the LIVE api + secret-grep of the wave diff.

## Applicable probes (subset per the wave's actual diff)

`wave_type` includes auth-adjacent (private messaging, sessions, authz, privacy). DM reuses the existing AuthGuard + Socket.IO WS-upgrade middleware — it does NOT modify auth flows / rate-limit policy. Applicable probes:
- **IDOR / participant-gating** (the core new authz surface)
- **who_can_dm authorization** (new load-bearing policy)
- **Socket.IO session-gating** (WS-upgrade, DM fan-out namespace)
- **CSRF/session** (state-changing DM endpoints reuse SuperTokens session cookies + anti-csrf)
- **Injection** (new DM write endpoints)
- **secret-grep** (ALWAYS)

Auth-smoke (Action 1) + rate-limit (Action 4) N/A — no auth flow or rate-limit policy modified this wave.

## Action 5 — Secret-grep (ALWAYS)

`git show 2a738f7 -- '*.ts' '*.tsx' '*.env*' | grep -iE 'api[_-]?key|secret|password|bearer …'` → **ZERO matches** (unfiltered). The DM diff introduces no credential literals (`idempotencyKey` doesn't match the secret patterns). **secret_grep_findings: [].**

## Active exploitation matrix (penetration-tester aa8b17b5, LIVE api, fixtures A+B)

| # | Attack | Expected | Actual | Violated? |
|---|---|---|---|---|
| A1 | A read+write own CONV_AB | 200 | 200 both | N |
| A2a/b | IDOR read (random / all-zeros UUID) | 404 non-leak | 404 "Conversation not found" | N |
| A2x | Malformed non-UUID id | no 500/leak | 400 generic (no internals) | N |
| A3 | IDOR write (random UUID) | 404, NO insert | 404; verified no marker written to any conv | N |
| **A4** | **Body-param smuggling** (route=CONV_AB, body conversationId=foreign) | uses ROUTE param | 200 → landed in CONV_AB; foreign→404 | N |
| **A5** | **Caller-spoofing** (body authorId/senderId=B while auth=A) | stored authorId=A | stored authorId=A (session-derived); GET re-confirms | N |
| A6a-d | Unauthenticated / bogus-token on all DM endpoints | 401 | 401 "unauthorised" (all) | N |
| A7 | Enumeration via GET list | only A's convs | returns only CONV_AB (A participant) | N |
| **B1** | A create→B while B='nobody' | 403, NO row | 403 policy reason; conv count unchanged; **find-or-create does NOT leak existing conv** | N |
| B2 | A send to pre-existing CONV_AB while B='nobody' | (report) | 200 — existing thread not muted (by-design; policy gates CREATE) | N (by design) |
| B3 | B='server-members', A (shared server) create | 200 | 200 | N |
| C1 | Unauth Socket.IO connect / receive DM | reject / no data | see § socket below | Partial→LOW |
| D1 | Oversized content >4000 | 400 | 400 typed field error (4001 & 4100) | N |
| D2 | SQL/script payload | literal, no exec, no 500 | 200 stored verbatim; table intact (Drizzle parameterized) | N |

## The four DM authz invariants — verdict under active attack

1. **Route-param-only IDOR (conversationId never from body):** **HELD** — A4 body-smuggling ignored; message landed in route-param conv only.
2. **404-non-leak for non-participants (never 403/500):** **HELD** — A2/A3 all 404, no existence confirmation, no stack trace.
3. **who_can_dm enforced pre-write, per-target, session-derived caller:** **HELD** — B1 'nobody'→403 with no row + no find-or-create leak; B3 server-members permits co-member; A5 caller-spoofing rejected.
4. **Socket session-gating on WS upgrade:** **HELD on the DM-carrying namespace** — see § socket (corrected).

## § Socket session-gating — source-grounded correction of the pen-tester's MEDIUM

The pen-tester flagged MEDIUM: "unauthenticated Socket.IO connect accepted at the namespace-connect layer." I verified against source and **corrected it to LOW**:
- The tester probed the **default `/` namespace** (unused; no handlers, no traffic) — which accepts idle anon connects (`40{sid}`) but the tester confirmed it receives ZERO DM data.
- StudyHall's DM fan-out runs on the **`/messaging` namespace**, which installs `installWsAuthMiddleware` (`apps/api/src/common/ws-auth.ts`): `server.use()` `io.use()` middleware that verifies the SuperTokens session + email-verification claim and calls `next(new Error('Unauthorized'))` on ANY failure (missing/expired token, unverified) — **rejecting the WS upgrade BEFORE `handleConnection`**. `socket.data.userId` is guaranteed set only after it passes; the DM per-user room `user:<userId>` is joined only then (`messaging.gateway.ts:100-114`). The tester's own C1 saw `/dm` → `44 Invalid namespace` and no data leak — consistent with this.
- **Verdict:** the documented invariant "WS-upgrade session validation rejects unauthenticated clients" IS literally true on the namespace that carries DM data. The residual (idle anon connects on the traffic-free default `/` namespace) is a minor DoS-surface note → **LOW**, not a DM confidentiality issue and not a regression of the DM boundary.

## Findings

- **F11 (LOW):** default `/` Socket.IO namespace accepts idle unauthenticated connects (no handlers, no data). The DM-carrying `/messaging` namespace correctly rejects unauth at WS-upgrade (`ws-auth.ts` → `next(Unauthorized)`), so no DM data leaks. Defense-in-depth note (idle-connection resource surface); optional hardening: reject anon connects on `/` too. Not a DM security defect.
- **F12 (LOW / by-design observation):** who_can_dm='nobody' gates STARTING new DMs but does NOT mute a pre-existing thread (A can still send to CONV_AB). Consistent with documented policy semantics; both parties are already authorized participants. No security impact. Product may want to note the UX expectation. Surfaced to V-2 as an observation.

**No CRITICAL, no HIGH.** Every core DM authz invariant held under active exploitation; injection safe; secret-grep clean.

## Cleanup
Fixture B `whoCanDm` restored to `everyone` (GET-confirmed). `pentest-`-prefixed test messages written only to the fixture-only CONV_AB — benign fixture data. `messages` table intact post-injection.

---
```yaml
test_pattern: active
skipped: false
auto_promoted: false
applicable_probes: [idor_participant_gating, who_can_dm_authz, socket_session_gating, csrf_session, injection, secret_grep]
auth_smoke: null   # no auth flow modified this wave
csrf_results:
  - "all DM state-changing endpoints reject unauthenticated (401) + caller session-derived (A5/A6)"
session_results:
  - "unauthenticated + bogus-token → 401 on all DM endpoints"
  - "/messaging WS-upgrade rejects unauth via io.use() next(Unauthorized); default / ns idle-only (F11 LOW)"
rate_limit_results: null   # no rate-limit policy modified this wave
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: LOW, category: socket-session, description: "default / namespace accepts idle anon connects; DM-carrying /messaging ns correctly rejects unauth — no DM leak", remediation: "optional: reject anon on / too (defense-in-depth)"}
  - {severity: LOW, category: authz-policy, description: "who_can_dm='nobody' gates create, not existing-thread send (by-design)", remediation: "product/UX note, not a security fix"}
head_signoff:
  verdict: APPROVED
  stage: T-8
  failed_checks: []
  rationale: >
    The load-bearing private-messaging security layer holds under ACTIVE exploitation, not just
    happy/deny cases. All four DM authz invariants survived attack: route-param-only IDOR (body
    conversationId smuggling ignored), 404-non-leak (every non-participant read 404, never
    403/500/stack-trace), who_can_dm enforced pre-write per-target with a session-derived caller
    (nobody→403 with no row and no find-or-create leak, caller-spoofing rejected), and unauthenticated
    access 401 on every endpoint. Injection is parameterized-safe, oversized content 400s, and the
    secret-grep is clean. The pen-tester's socket MEDIUM was corrected at source to LOW — the
    /messaging namespace that actually carries DM fan-out rejects unauthenticated WS upgrades via the
    io.use() middleware (next(Unauthorized)); the residual is idle anon connects on the traffic-free
    default namespace with zero DM data exposure. No CRITICAL, no HIGH. T-8 exits APPROVED with two
    LOW findings surfaced to V-2. Fixture state restored.
  next_action: PROCEED_TO_T-9
```
