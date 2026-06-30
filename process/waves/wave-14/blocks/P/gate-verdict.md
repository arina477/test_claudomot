# Wave 14 — P-4 Verdict

**Reviewer:** head-product (fresh spawn, P-4 Phase-1 gate)
**Reviewed against:** process/waves/wave-14/blocks/P/review-artifacts.md
**Attempt:** 1  (first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
Wave-14 ships the M3 real-time presence layer (online/offline + typing + live member-list) as one coherent backend-primitive-plus-its-two-consumer-surfaces slice, mapping 1:1 to the live displace-Discord bet and the M3 "presence + typing, member list with presence" scope clause (milestone 6198650e). The framing is cause-layer, not symptom: presence is the documented next M3 primitive, and both fresh-context reviewers (problem-framer PROCEED, ceo-reviewer PROCEED/HOLD-SCOPE) reconciled with mvp-thinner's THIN without silent override — author-row presence dots (10b9d18e) correctly deferred as a redundant second rendering of presence the member-list already exposes, leaving ~2650 LOC / 3 specs above the multi-spec floor (verified: the row exists, parented under the seed, wave_id NULL, parked — no phantom INSERT). Every acceptance criterion is independently falsifiable with an observable signal, the four security-tightened ACs (unauthed-WS-reject, multi-tab ref-count no-flap, membership-scoped no-leak fan-out, snapshot-on-join with self-presence stability) are explicit and verifiable, and the plan reuses the locked architecture — the wave-12 /messaging WS-upgrade auth path (task 723b5b6a, confirmed shipped in apps/api/src/messaging/messaging.gateway.ts) is factored for the new /presence namespace with no new auth surface, no migration, and no new dependency. Gold-plating is held off (idle/away + rich-presence explicitly OUT; in-memory presence with client re-snapshot on reconnect is correctly sized for the MVP, no Redis/multi-replica) and demo-path tunnel vision is avoided (multi-tab and no-leak enumerated as first-class edge cases, not afterthoughts). I find no failed checkbox. Proceed to Phase 2 (Karen + jenny + Gemini); design_gap_flag is TRUE, so the gate-pass handoff is to D-block before B.

## Stage-exit checklist (all ticked from artifacts)

**P-0 Frame**
- [x] Problem names a concrete user job (seeing who is present / typing in a server) and is the root-cause M3 primitive, not a demo-path artifact — confirmed by P-0 §Reframe.
- [x] Maps to exactly one live bet (displace-Discord) + active milestone M3 6198650e, cited by id.
- [x] Falsifiable: each surface has an observable solved-signal (presence dot moves group live; typing line appears/expires; unauthed WS refused).
- [x] problem-framer + ceo-reviewer verdicts both present and reconciled with mvp-thinner via explicit mediation (mvp-thinner wins on precedence; member-list KEPT by all three — no silent override).

**P-1 Decompose**
- [x] Bundle = one seed (d1c4693d /presence) + only the siblings that must ship for the mvp-critical claim (typing 58633934, member-list 058984c5 = the visible consumer surface; presence with no surface is invisible).
- [x] Every AC mvp-critical, or re-classified + split — author-row dots split to parked sibling 10b9d18e (verified parked, wave_id NULL).
- [x] No bundle task depends on an unbuilt task outside the bundle — reuses wave-12 gateway/auth (already LIVE) + existing server_members (M1).

**P-2 Spec**
- [x] ACs enumerated, each independently verifiable (per-block AC lists in canonical tasks.description of d1c4693d).
- [x] Non-happy states specified per surface: edge-cases blocks cover unauthed-reject, abrupt disconnect, multi-tab, no-shared-server, server-restart re-snapshot (presence); navigate-away/disconnect, throttle, non-viewer-receives-nothing, self-no-line (typing); no-avatar fallback, large list scroll, live group-move, narrow-collapse (member-list). Loading/empty handled by snapshot-on-join + grouped-list-with-count + responsive collapse.
- [x] Non-goals named explicitly (author-row dots deferred; idle/away + rich-presence OUT; threads/mentions/attachments later-M3).
- [x] **Security surface flagged for tightened gate** — WS-upgrade session auth + membership-scoped fan-out enumerated in the spec's SECURITY block and carried into review-artifacts §Open escalations → routed to T-8 + this P-4 tightened gate.
- [x] Full spec contract embedded as fenced YAML head of seed d1c4693d.description (verified via DB read, not only the pointer copy).

**P-3 Plan**
- [x] Reuses established architecture: WS-upgrade auth factored from messaging gateway (723b5b6a, verified shipped); room-model scoping (presence:server:<id>) chosen with the co-member-recompute alternative explicitly weighed and rejected (O(1) room emit vs O(members) set-math; room model also scopes typing for free).
- [x] No MVP-unneeded infra: in-memory presence/typing state, no Redis, no multi-replica, no billing; restart-resets accepted as soft-state with client re-snapshot.
- [x] Each plan step maps to a bundle task and an observable artifact (self-consistency sweep §1: every AC → ≥1 file step; presence ACs→B-3 gateway/service, typing→B-3 handlers+B-4 useTyping, member-list→B-4 MemberListPanel).

**P-4 Gate**
- [x] Every upstream checkbox ticked from a concrete artifact (DB spec, P-0/P-1/P-3 deliverables, git history of 723b5b6a), not inferred.
- [x] design_gap_flag handoff correctly set TRUE (member-list panel + typing indicator → D-block) — verdict next-action routes to D before B.
- [x] Security-tightened lens satisfied: unauthed-reject / multi-tab-ref-count / membership-scoped-no-leak / snapshot-on-join + self-presence-stable all explicit and verifiable; two-authenticated-client fan-out + no-leak verification mandated for T-8.

## Specialist verdicts reconciled (Phase 1)
| Specialist | Stage | Verdict | Reconciliation |
|---|---|---|---|
| problem-framer | P-0 | PROCEED | Cause-layer primitive, correctly-sized multi-tab ref-count, demo-paths enumerated. |
| ceo-reviewer | P-0 | PROCEED / HOLD-SCOPE | Traces to displace-Discord bet; idle/away + rich-presence OUT; no expansion. |
| mvp-thinner | P-0 | THIN (defer dots) | Accepted; precedence over problem-framer's coherent-slice (both keep member-list). Verified parked, no rework risk (dots consume same client store). |

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 2

---

## Phase 2 — Karen + jenny + Gemini (appended)

**Phase:** 2 (merged)

| Reviewer | Verdict | Notes |
|---|---|---|
| karen | **APPROVE** | 7 claims VERIFIED. Reuse grounded: messaging.gateway.ts:98-153 WS-auth factorable; server_members servers.ts:43-57; canViewChannelById rbac.service.ts:344-354; messagingSocket.ts mirror; no migration. Non-blocking: websocket-engineer was missing from AGENTS.md (now ADDED). |
| jenny | **APPROVE** | No drift. 3-block spec MATCHES M3 ## Scope 1:1; honors the 2-namespace lock (product-decisions #8); no creep (idle/away/rich-presence/DMs OUT); presence correctly does NOT close M3. |
| Gemini | **UNAVAILABLE** | helper exit=3 ("no text in response", retried once). Degrades per dispatcher — does NOT block; gate proceeds on karen+jenny APPROVE. |

## Gate result: PASSED → D-block (design_gap_flag: true)
- Phase 1 head-product APPROVED; Phase 2 karen+jenny APPROVE; Gemini UNAVAILABLE (degraded).
- Follow-up applied: added `websocket-engineer` row to command-center/AGENTS.md (karen hygiene flag).
- Next: D-1 Brief (member-list panel + typing indicator designs).
