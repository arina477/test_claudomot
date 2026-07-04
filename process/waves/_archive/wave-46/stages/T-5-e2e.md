# T-5 — E2E (wave-46 M8 direct messages slice 1)

**Pattern:** B — Active-execution, Playwright, against LIVE web (`https://web-production-bce1a8.up.railway.app`). **Headline: two-client real-time DM fan-out.**

## Action 1 — Scenarios (traced to P-2 acceptance criteria)

| ID | Criterion | Scenario |
|---|---|---|
| S1 | Real-time DM delivery | 2-client: A starts DM with B, sends → B receives live (dm:message) no reload; B replies → A sees live. Run twice (flake check). |
| S2 | Start-picker + who_can_dm affordance | Picker lists users, chip+confirm, 403 handled inline |
| S3 | Conversation list + optimistic send | Thread in A's list; own message renders immediately |
| S4 | Offline send → pending → reconnect | Offline send shows pending, sends on reconnect |

## Action 2/3 — Tester results (ui-comprehensive-tester, agentId a2a37ef9)

**Two-client rigor:** the tester built a genuinely-separate second client (CLIENT B = independent headless Chrome, own profile dir, own `page.on('websocket')` frame capture) after discovering the pooled Playwright MCP instances share one Chrome `--user-data-dir` (SingletonLock → only one browser per profile). This is a TRUE two-client test — sender and receiver are separate processes/sessions, NOT a single-client optimistic echo. No `browser_close` called on any MCP instance.

| Scenario | Verdict | Evidence |
|---|---|---|
| **S1 two-client real-time** | **PASS (both runs)** | A→B delivery confirmed by REAL on-wire Socket.IO frame at B: `42/messaging,["dm:message",{conversationId:"5f62052f…",message:{id:"62d407c5…",authorId:"21984eb2…"(A),content:"RT-PING-…"}}]` AND DOM (no reload). Second run RT-PING2 same. Reply B→A DOM-confirmed live (A's transport is HTTP long-polling so in-page frame capture failed on A — DOM evidence only for the reply direction; the headline A→B direction has full frame evidence). |
| **S2 start-picker** | **PASS** | `dialog "Start a new direct message"` → `listbox "Member list"` → `option`s by display name (role queries, not testId); chip + "Open DM" enable confirmed; server-context dependency (no server → "Join a server to find people"). All targets open → no 403 to observe. |
| **S3 list + optimistic** | **PASS (+F3)** | Conversation in A's list (but shows raw UUID — F3); optimistic row rendered **11.3ms** after Enter (~1 frame, far below RTT), composer cleared immediately. |
| **S4 offline→pending→reconnect** | **PASS** | Offline send → `"Sending…"` + `Offline — 1 pending`, no error-drop; reconnect → pending cleared, persisted, delivered cross-client to A. Full cycle verified. |

## Action 4 — Failure triage (Iron Law — surfaced, NOT fixed by T-block)

No CRITICAL fan-out failure — the core acceptance criterion (real-time DM delivery) HOLDS on both runs with genuine two-client network-frame + DOM evidence. Two MAJOR client-side rendering defects observed; per T-5 Action 4 these are "edge cases observed but the core criterion holds" → findings for V-2 (not a T-5-blocking FAIL requiring a fix-up cycle). Root causes confirmed against source rather than trusted from the tester note:

- **F6 (MAJOR) — sender's own message DOUBLE-RENDERS.** Confirmed at source `apps/web/src/shell/useDm.ts:205`: the `dm:message` socket handler dedups ONLY against `m.kind==='real' && m.id===message.id`. When the M1 fix's fan-out echo reaches the SENDER's own tab BEFORE the REST `onDelivered` reconcile (the common race), the sender's row is still `kind:'optimistic'` (id not yet = confirmedId), so `alreadyPresent` is FALSE → the handler appends a SECOND `real` row; then `onDelivered` reconciles the optimistic → real → two rows, SAME server id (tester saw identical `data-testid=dm-message-row-<same-id>`). **The socket dedup is missing an optimistic-by-idempotencyKey check.** This is the M1 "fan-out reaches sender" fix not paired with an idempotencyKey-aware socket dedup on the originating tab. User-visible: every self-sent message can double-render. Distinct from the B-6 double-*send* fix (e3f6a9b) — this is double-*render*/reconcile.
- **F7 (MAJOR) — author renders "Unknown user"** on some delivered messages. Root: `DmThread.tsx:54` `participantMap.get(msg.authorId) ?? 'Unknown user'`; the map (built from `conversation.participants`, L353) is keyed by userId but the socket-delivered row's authorId isn't resolving — compounded by F6's duplicate/echo rows. Same server-side displayName gap as T-3 F1 feeds this. User-visible.
- **F3 (MINOR, = T-3 F1)** — conversation list + thread header show raw participant UUID instead of display name. Same server-side root as T-3 F1 (displayName falls back to userId). Picker resolves names correctly (different data source), making the inconsistency visible.
- **F8 (INFO)** — CLIENT A Socket.IO uses HTTP long-polling, no `wss://` upgrade observed. Works; worth confirming intended (latency/overhead + blocks in-page frame inspection). Not a defect.

## Findings

- **F6 (MAJOR):** self-message double-render, `apps/web/src/shell/useDm.ts:205` socket dedup missing optimistic-by-idempotencyKey path (M1-fan-out ↔ optimistic-reconcile race). Live-observed both directions.
- **F7 (MAJOR):** "Unknown user" author on delivered messages, `DmThread.tsx:54` participant-map resolution gap (interacts with F6 + T-3 F1).
- **F3 (MINOR):** raw UUID as participant name in list/header (= T-3 F1 server displayName fallback).
- **F8 (INFO):** long-polling transport, not a defect.

---
```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios:
  - {id: S1, criterion_ref: "real-time DM delivery (2-client)", verdict: PASS, evidence_path: "agentId a2a37ef9 — dm:message frame at CLIENT B + DOM, both runs"}
  - {id: S2, criterion_ref: "start-picker + who_can_dm affordance", verdict: PASS, evidence_path: "agentId a2a37ef9"}
  - {id: S3, criterion_ref: "conversation list + optimistic send", verdict: PASS, evidence_path: "agentId a2a37ef9 (optimistic 11.3ms)"}
  - {id: S4, criterion_ref: "offline send → pending → reconnect", verdict: PASS, evidence_path: "agentId a2a37ef9"}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: MAJOR, scenario: S1/S3, description: "sender's own message double-renders — useDm.ts:205 socket dedup missing optimistic-by-idempotencyKey; M1-fanout ↔ reconcile race"}
  - {severity: MAJOR, scenario: S1, description: "'Unknown user' author on delivered messages — DmThread.tsx:54 participant-map resolution gap"}
  - {severity: MINOR, scenario: S3, description: "raw UUID as participant name (= T-3 F1 server displayName fallback)"}
  - {severity: INFO, scenario: S1, description: "Socket.IO long-polling, no wss upgrade — confirm intended"}
head_signoff:
  verdict: APPROVED
  stage: T-5
  failed_checks: []
  rationale: >
    The DM feature's core is PROVEN: two-client real-time fan-out succeeded on both runs with a
    genuine second client (separate process/session/profile) capturing a real on-wire dm:message
    Socket.IO frame at the receiver AND the DOM update with no reload — not a single-client echo.
    Start-picker (role queries), optimistic send (11.3ms), and the offline→pending→reconnect cycle
    all pass. Two MAJOR client-side rendering defects surfaced — self-message double-render (a real
    race between the M1 sender-fan-out and the optimistic reconcile, root-caused at useDm.ts:205)
    and "Unknown user" author resolution — plus the T-3 UUID-displayName gap. All are user-visible
    but do NOT break the delivery criterion; per T-5 Action 4 they are surfaced to V-2 with confirmed
    root causes and routed per the Iron Law (frontend/react-specialist), not fixed in-block. T-5
    exits APPROVED with the headline verified and the defects honestly on the V-2 docket.
  next_action: PROCEED_TO_T-6
```
