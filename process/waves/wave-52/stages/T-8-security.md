# T-8 — Security (wave-52)
**Pattern:** B (active). auto_promoted: true — the /study-room namespace is a new session+membership-gated realtime surface. Applicable: authz/IDOR, session-gate, mass-assignment, secret-grep.
## Probe results (penetration-tester a67f74d7, live prod)
**Is /study-room session-gated + membership-gated + IDOR-safe? YES.** No Critical/High/Medium; 1 Low.
| Probe | Result |
|---|---|
| WS session gate (unauth/bogus token) | **REJECTED** at io.use — CONNECT_ERROR "Unauthorized"; no handler reachable |
| Non-member IDOR (subscribe/create/join on 3 foreign servers) | **DENIED** — study-room:join_error "not a member"; 0 rooms leaked, nothing created/joined (assertMember holds) |
| Own-server positive control | rooms list returned (empty) — 403s are real authz, not blanket break |
| Room-membership gate + mass-assignment | timer control on non-joined room DENIED; **injected userId IGNORED** (roster = session user); displayName/avatar server-resolved |
| Ephemeral | room vanishes on leave; re-subscribe rooms:[] |
| Secret grep (wave-52 diff) | CLEAN |
## Findings (→ V-2)
- **F-1 (LOW, info-disclosure, non-blocking):** a malformed (non-UUID) serverId fails the Postgres UUID cast inside assertMember; the gateway catch block forwards the raw Drizzle error verbatim to the client (leaks query text + server_members table/column names + echoes the caller's OWN userId). Request STILL DENIED (no rooms leaked; leaked id is the caller's own) → info-disclosure only, NOT an auth bypass. Same class as the wave-23 inherited "non-UUID :serverId → 500" (app-wide pattern). Fix: UUID-format validation at the payload-parse layer OR map non-ForbiddenException errors to a generic client message (log detail server-side). study-room.gateway.ts ~:372 catch. → V-2 (candidate: non-blocking task or accepted-debt; cheap).
```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [session_gate, idor_authz, mass_assignment, secret_grep]
session_gate: ["unauth/bogus → CONNECT_ERROR Unauthorized"]
csrf_results: ["non-member subscribe/create/join → join_error, 0 leak; injected userId ignored"]
secret_grep_findings: []
fix_up_cycles: 0
findings: [{severity: low, category: info-disclosure, description: "non-UUID serverId leaks raw Drizzle error via catch (request still denied); UUID-validate or generic error map"}]
```
