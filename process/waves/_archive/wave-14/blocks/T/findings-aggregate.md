# Wave 14 — T-block findings aggregate

Canonical V-2 input. T-block surfaces findings with evidence; V-2 classifies blocking vs non-blocking. Severity: CRITICAL / HIGH / MEDIUM / LOW / INFO.

## Carried-in known items (B-6 accepted debt — confirm at T-9)

| ID | Source | Severity | Item | Status |
|---|---|---|---|---|
| KI-1 (M-1) | B-6 | INFO | Perf scan deferred (presence in-memory, single-pod; no Redis fan-out at scale) | accepted debt — re-confirm not regressed |
| KI-2 (M-3) | B-6 | LOW | displayName falls back to email prefix when display_name is ''/null | accepted debt — behavior-as-designed |
| KI-3 (M-4) | B-6 | INFO | shared schema dist wrapper needed manual rebuild to emit presence.d.ts | accepted debt — build-process note |

## Findings (appended per stage)

_No new findings yet._

### T-2 unit
| ID | Severity | Location | Finding | Evidence |
|---|---|---|---|---|
| F-1 | HIGH (CLOSED in-stage) | presence.service.ts + presence.gateway.ts | Presence modules shipped with ZERO unit tests at merge (351-test baseline predates presence). Ref-count/typing-TTL/co-member-scoping had no isolated coverage. | Closed: +31 mutation-survivable unit tests added; 251 passed; mutation-sanity confirms a real bug fails a test (presence.service.spec.ts:101). Not blocking — gap closed this stage. |

### T-1 static
No findings. 0 ts-bypasses in wave diff; lint+typecheck green on merge commit.

### T-3 contract
| ID | Severity | Location | Finding | Evidence |
|---|---|---|---|---|
| F-2 | HIGH (CLOSED in-stage) | packages/shared/src/presence.ts | Presence Zod contracts shipped with zero contract tests (shared pkg had no test infra). | Closed: +37 tests (valid+meaningful-invalid per schema, assert issue path/code), wired into turbo test:ci. Full repo green. Not blocking. |

### T-4 integration
| ID | Severity | Location | Finding | Evidence |
|---|---|---|---|---|
| F-3 | MEDIUM (open) | presence co-member resolution + members member-gate | No dedicated real-Postgres integration tier (vitest mocks db). DB boundaries verified via mocked unit + live T-8 prod probe, not repeatable isolated integration. | Missing-infra path; non-blocking. boot-probe+e2e give real-stack smoke. Load-bearing scoping proof delivered live at T-8. V-2/L-2 to weigh. |
| F-3b | LOW (open) | ServersService.listServerMembers | Member-gate 403 query untested except live at T-8; controller.spec mocks the service. | Candidate servers.service.spec case. Non-blocking. |

### T-8 security (LOAD-BEARING)
| ID | Severity | Location | Finding | Evidence |
|---|---|---|---|---|
| **F-4** | **HIGH** | apps/api/src/presence/presence.gateway.ts:381 emitTypingActive() | **Typing indicator is structurally non-functional for co-members.** emitTypingActive(channelId, selfUserId) builds ONE typers list via getTypers(channelId, selfUserId) excluding the ACTOR, then broadcasts that same list to the whole channel room. Every recipient (not just the actor) gets the actor filtered out, so a co-member NEVER sees "<name> is typing". Violates spec task 58633934 AC: "Other members CURRENTLY VIEWING the same channel see a '<name> is typing…' line." | LIVE two-client (verified fixture A + verified account-b B, both members, both joined channel general 93982063): A emits typing:start x3 (renewed); B receives 3x typing:active each with typers:[] — B NEVER saw A. A's own event correctly []. Self-exclusion is right; the bug is excluding the actor from EVERYONE via a single broadcast instead of per-recipient (or letting clients self-filter). Reproducible 3/3. Unit test passed because it tested getTypers() in isolation, not the gateway broadcast composition — classic single-layer false-green. |

**T-8 LOAD-BEARING two-client results (verified distinct users A=fixture, B=account-b; provisioned + email-verified B via SuperTokens Core admin API, then joined proof server ad62cd12 via invite; co-membership confirmed 2 members):**
| Probe | Verdict | Evidence |
|---|---|---|
| WS upgrade WITHOUT session | PASS (rejected) | connect_error "Unauthorized" |
| WS upgrade UNVERIFIED user | PASS (rejected) | account-b pre-verify → connect_error "Unauthorized" (email-verified claim enforced) |
| WS upgrade VERIFIED user | PASS (accepted) | fixture connects + presence:snapshot |
| presence:snapshot on join | PASS | B's snapshot includes co-member A |
| Two-client presence:online fan-out | PASS | B receives presence:online{A} 311ms after A connects (cross-user, not echo) |
| Fan-out latency <1s | PASS | 311ms online, 79ms offline |
| presence:offline fan-out | PASS | B receives presence:offline{A} on A disconnect, 79ms |
| Multi-tab self no-flap | PASS | 2nd tab of A → 0 self online/offline on tab1 |
| presence NO-LEAK (id scoping) | PASS | B only ever received co-member presence ids; 0 foreign |
| typing fan-out (B sees A typing) | **FAIL → F-4** | B receives typing:active but typers ALWAYS [] (defect) |
| typing self-exclusion | PASS | A never in own typers |
| typing TTL auto-expire | PASS | A clears from typers ~5s idle |
| typing channel-scoped NO-LEAK | PASS | B NOT joined to channel → 0 typing:active received |
| GET /servers/:id/members unauthed | PASS (401) | AuthGuard |
| GET members member (fixture) | PASS (200) | roster {userId,displayName,avatarUrl} |
| GET members non-member/unverified (account-b pre-join) | PASS (403) | st-ev claim 403 (verify-before-authz guard order) |
| Secret grep (always) | PASS (clean) | 27 matches all code identifiers/comments, 0 literal credentials; gitleaks PASS @C-1 |

Note on members member-gate: the verified-non-member 403 path (service ForbiddenException 'Not a member') was not isolated live because the email-verification claim (defense-in-depth) returns 403 one layer earlier for account-b before it joined. Guard order (verify before member-check) is correct security behavior. Member-gate logic covered by mocked controller.spec 403-propagation + the in-code service check (F-3b notes the missing dedicated test).

### T-5 e2e
| ID | Severity | Location | Finding | Evidence |
|---|---|---|---|---|
| F-5 | LOW | member-list panel (web) | DOM-level live group-move (Online↔Offline) not directly observed in E2E (browser held no /presence socket at snapshot). Underlying live fan-out proven at T-8 wire level. | Non-blocking. Recommend future T-5 scenario opening a /presence socket in page context. |

### T-6 layout
| ID | Severity | Location | Finding | Evidence |
|---|---|---|---|---|
| F-6 | INFO | member-list panel | Static capture shows members "Offline" (no live socket in browser); presence-dot live color change verified at T-8. Not a layout issue. | INFO. Panel renders correctly all breakpoints; collapses <1024; no token violation. |

### T-7 perf — SKIPPED (not heavy)

## Summary for V-2
- **Blocking-candidate:** F-4 (HIGH) — typing indicator structurally non-functional (co-members never see typer name). Realtime-correctness, not a security leak. V-2 decides blocking; recommend BLOCKING for spec task 58633934 (its core AC is unmet).
- **Non-blocking gaps (closed/deferred):** F-1 (closed +31 unit), F-2 (closed +37 contract), F-3/F-3b (integration-tier infra gap, MED/LOW deferred), F-5 (LOW e2e live-move re-capture), F-6 (INFO).
- **Carried-in (B-6):** KI-1/KI-2/KI-3 — no wave-14 regression.
- **Security/scoping verdict:** SOUND. Two-client presence fan-out + no-leak PROVEN with distinct verified users; WS rejects unauth+unverified; members 401/403; secret grep clean. The tightened-gate load-bearing proof HOLDS.
