# Wave 58 — P-4 Verdict

**Reviewer:** head-product (fresh spawn)
**Reviewed against:** process/waves/wave-58/blocks/P/review-artifacts.md
**Attempt:** 1  (1 = first gate)
**Phase:** 1 (head-product)

## Verdict
APPROVED

## Rationale
This wave fixes a real test-honesty defect with the correct scope and a precisely-specified robust shape. I verified the load-bearing claim at source: `apps/web/e2e/delete-any-message.spec.ts:153-162` is genuinely a pass-regardless soft-check (`.waitFor(...).then(()=>true).catch(()=>false)` feeding only a `console.log`; no `expect` gates it), while the NOTE at 148-152 documents the socket channel-join race and steps 6/8 (RBAC/IDOR, lines 136-144 and 164-178) are already hard-asserted with gating `expect().toBeHidden`. Fixing the TEST, not the feature, is the right layer — the backend fan-out is independently proven (wave-41 T-4/T-8, restated at spec line 151), so a hard cross-client assertion closes a genuine honesty gap rather than flaking on a broken feature. The spec SoT embedded in `tasks.description` (a1dda389) carries the full contract as a fenced YAML head and is exact on the two load-bearing halves: AC-2 mandates a race-free READY-GATE that confirms B is actually SUBSCRIBED (edge-case-1 explicitly forecloses a shallow page-loaded wait), and AC-3 mandates a BOUNDED RETRIED window (Playwright auto-retry), not a fixed one-shot. AC-4 is falsifiable by construction ("reverting the fan-out would fail the assertion"), and the RBAC/IDOR portions stay untouched and green. Scope is minimal and correctly floor-overridden (single indivisible sub-floor test-honesty unit; obs-B 9th / PRODUCT rule 5), and the M9 read is sound — M9's success metric is founder-TBD so it cannot be decomposed or built, making this tail-drain contract-correct while the M9 flag stays loud on close. design_gap_flag FALSE is correct (E2E test-only, no production/UI change), so the security-scope tightened gate does not apply (no auth/session/cookie surface touched).

## Watch item for B-6 / head-tester (does NOT block P-exit)
The spec correctly REQUIRES a genuine subscription ready-gate, but no observable "channel-joined" DOM signal exists that is DISTINCT from socket-connected: `joinChannel(channelId)` in `useMessages.ts:252` is a fire-and-forget emit (client sets `subscribedChannelRef` synchronously; server-side room-join completion is not surfaced), and `ConnectionStateIndicator` (`<output aria-label="Connection status: online">`) proves the socket is connected, NOT that B has joined the specific channel room. The builder must therefore choose a real subscription proxy (e.g. B observing an inbound fan-out for its own/A's message as positive proof of room membership before A deletes), not just await `Connection status: online` — awaiting socket-connected alone would leave the room-join race the NOTE documents. B-6 / head-tester MUST verify the final assertion genuinely GATES: it fails when the fan-out is reverted, and the ready-gate is a true SUBSCRIBED confirmation rather than a longer soft-check or a page-loaded proxy. This is a build/test-quality watch, correctly delegated by the plan (P-3 Note), not a P-block spec defect.

## Stage-exit checklist (all ticked from artifacts)
- P-0 Frame: root cause (join-race soft-check) named + verified at source; maps to live bet "Academic tools + offline-first win students from Discord" and milestone M8 (84e17739); problem is falsifiable; problem-framer PROCEED + ceo-reviewer PROCEED/HOLD-SCOPE + mvp-thinner OK all present and reconciled. PASS
- P-1 Decompose: single indivisible seed [a1dda389]; no splittable AC; no external unbuilt dependency; floor override justified by rule. PASS
- P-2 Spec: 4 ACs enumerated + independently verifiable; race-free + bounded-retried shape specified; edge cases named; non-goals explicit (RBAC/IDOR untouched); full contract embedded as YAML head in tasks.description (verified). PASS
- P-3 Plan: reuses existing realtime/connection surfaces (no parallel mechanism); no new infra; the one file-step maps to the AC and produces an observable artifact; load-bearing ready-gate flagged for downstream verify. PASS
- Security-scope gate: N/A — test-only, no auth/session/cookie/rate-limit surface. PASS

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
# Wave 58 — P-4 Phase 2 merge
| Reviewer | Verdict | Notes |
|---|---|---|
| karen | APPROVE | 5/5 VERIFIED: soft-check pass-regardless (spec:153-162, .catch swallows, no expect); NOTE :148-152 documents the race; RBAC/IDOR :134/:178 hard-asserted (untouched). **DECISIVE: no join-ack — joinChannel is fire-and-forget emit (messagingSocket.ts:104-106); server handleJoinChannel (messaging.gateway.ts:125-145) emits NO ack; "online" (useConnectionState) = socket-connected only.** Builder MUST use a realtime round-trip subscription proof, not an "online" wait. |
| jenny | APPROVE | 4/4 MATCHES: aligns with T-5 rule 3 (real-socket, removes single-client anti-pattern); is the wave-45-blessed F2 paydown (test-infra floor-exemption precedent); no journey change (test-only); minimal scope. |
| Gemini | UNAVAILABLE (429) | degrades |

**PASS.** karen+jenny APPROVE, Gemini UNAVAILABLE. design_gap_flag false → B-block. **B-3 + B-6 MANDATORY CARRIES: (1) the ready-gate MUST be a genuine realtime round-trip subscription proof — e.g. before A deletes, A sends a message and B is hard-asserted to RECEIVE it (proving B is subscribed to the channel room), NOT an "online"/page-loaded wait (there is no join-ack primitive). (2) head-tester/B-6 MUST verify the new assertion genuinely GATES — reverting/breaking the fan-out must turn the test RED (no green-by-suppression). (3) bounded-retried timeout sized to pass a working fan-out reliably but fail a broken one.**
