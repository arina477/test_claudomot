# Wave 21 — P-4 Gate Verdict (Phase 1)

**Block:** P (Product) | **Gate:** P-4 | **Head:** head-product
**Wave:** M4 wave-2 — offline UX completion (live connection-state + multi-page catch-up loop + tests)
**Verdict:** **APPROVED** → proceed to Phase 2 (karen + jenny + gemini reviewer pool)

---

## Load-bearing check — PRODUCT-PRINCIPLES rule 1 (premise verification against real code)

Rule 1: *"Verify every seed claim about what exists or is absent in the code at P-0; decomposer prose drifts both ways."* This wave's lineage promoted this rule; it is APPLIED here, not merely cited. All four premises were read against the actual source this turn:

| # | Premise (decomposer/P-0 claim) | Ground truth | Verdict |
|---|---|---|---|
| a | `getSocketState()` returns the 3 states (hook just reads it, no rebuild) | `messagingSocket.ts:228-234` — returns `'online'\|'reconnecting'\|'offline'` from `s.connected` / `s.active` / else | TRUE — false-present would have rebuilt; it genuinely exists |
| b | `AppHome.tsx:39` hardcodes `connectionState="online"` (the dead wiring — the real gap) | `AppHome.tsx:39` — `<AppShell connectionState="online" />`, literal string | TRUE — the indicator is dead; this is the actual fix target |
| c | `runDrainAndCatchup` calls `getMessagesAfter` ONCE + ignores `nextCursor` (multi-page data loss) | `useMessages.ts:138` — single `await api.getMessagesAfter(forChannelId, cursor)`; advances cursor to last item (L155) but **never loops on `result.nextCursor`** | TRUE — >1-page offline window silently drops everything past page 1 |
| d | `ConnectionStateIndicator` + `PendingRow`/`FailedRow` already shipped (correctly NOT rebuilt) | `ConnectionStateIndicator.tsx` — complete 3-state component; `MessageList.tsx:1215` PendingRow, `:1296` FailedRow, rendered `:1570/:1572` | TRUE — false-absent would have re-spec'd shipped UI; correctly dropped |

**Buildability cross-check (so 94e41695's gating AC is not vacuous):** `getMessagesAfter` returns `MessagesAfterResponse` (`auth/api.ts:280`); that type carries `nextCursor` (consumed by the separate paged path at `useMessages.ts:222`). The looped plan `while (cursor) { page = getMessagesAfter(...); cursor = page.nextCursor }` is implementable against the real API contract. No server change required.

**Result:** zero premise drift in either direction. Scope is aimed at the true causes (the hardcode + the single-shot fetch), not symptoms. Rule-1 check PASS.

---

## Stage-exit checklist

### P-0 Frame
- [x] Concrete user job, root cause not symptom — invisible-wedge (dead indicator) + silent-data-loss-past-page-1; both are causes, premise-verified above.
- [x] Maps to exactly one live bet / milestone — M4 (Offline-first reliability, eb2a1688, in_progress, multi-wave); cites the wave-20 spine + the M4 "no data loss" metric.
- [x] Falsifiable — observable signals: (1) dot reflects real socket state; (2) a >1-page offline window recovers ALL messages. Both T/V-provable.
- [x] Trio present + reconciled — problem-framer PROCEED, ceo-reviewer PROCEED/HOLD-SCOPE, mvp-thinner OK; merged PROCEED, no silent override.

### P-1 Decompose
- [x] One seed + only must-ship siblings — c1dbee64 (seed) + 94e41695 (catch-up) + 2fe6b517 (tests); all three required for the M4 mvp-critical "visible + no-data-loss offline UX" claim.
- [x] Every AC mvp-critical — the one thin candidate (2-state-now / 3-state-later) tested + rejected by mvp-thinner: `getSocketState()` already returns 3 states + the component renders 3, so splitting CREATES net work (fails peel-off test).
- [x] No dependency on an unbuilt out-of-bundle task — reuses only shipped wave-20 spine + already-adopted components.
- [x] Floor exemption sound — BELOW-2500-LOC, EXEMPT under the wave-16 legit-small-increment precedent: genuine UX-completion on a multi-wave milestone reusing shipped infra (indicator + getSocketState + Dexie/outbox/?after=), NOT under-scoped or padded. No unrelated re-homed tech-debt pulled in (correct — don't pad). Precedent to be re-recorded at L.

### P-2 Spec
- [x] ACs enumerated + each independently verifiable — three tasks, each with concrete pass conditions (loop-until-null + all-pages-recovered; live dot per socket state; deterministic tests).
- [x] Empty/loading/error/offline states specified — catch-up edge-cases cover null-first-call (single page), dedup vs socket replay, max-iter guard without data loss, mid-loop disconnect resume-from-persisted-cursor; connection-state covers initial-mount default, flap debounce, window-offline-before-socket-timeout.
- [x] Non-goals explicit — OUT: new design surfaces, non-message connection-state, reconnect animations, offline for other entities.
- [x] Security gate — N/A: frontend-only, no auth/session/cookie/rate-limit/user-creation surface touched. No tightened-gate routing required.
- [x] Full spec contract embedded as fenced YAML at head of seed `tasks.description` (c1dbee64) — confirmed via psql; convenience copy is a pointer.

### P-3 Plan
- [x] Reuses locked architecture — opaque forward cursor (wave-20 V-3 `encodeForwardCursor` / server `nextCursor`), dedup-by-id against `message:new`, order-preserving, Dexie write-through per page, resume-from-persisted-cursor. No parallel mechanism invented.
- [x] No unneeded infra — no Redis / multi-replica / billing; frontend-only, no server change, no new dependency.
- [x] Each step → bundle task + observable artifact — useConnectionState.ts + AppHome edit (c1dbee64); runDrainAndCatchup loop (94e41695); tests (2fe6b517). Parallelizable (independent files), tests land with each.

---

## Anti-pattern sweep
- **Symptom framing** — cleared; fixes target the hardcode + single-shot fetch (rule-1 verified causes).
- **Orphan wave** — cleared; cited live milestone M4 + its no-data-loss metric.
- **Decomposition bloat / gold-plating** — cleared; NO rebuild of shipped components, no connection-state-everywhere, bounded MAX_ITERS loop (pathological guard, not infinite), tests scoped to the 2 gaps.
- **Happy-path-only spec** — cleared; non-happy states enumerated for both surfaces.
- **Vague AC** — cleared; each AC independently testable via the wave-20 fake-indexeddb harness.
- **Architecture-blind plan** — cleared; opaque cursor + dedup + write-through reuse the wave-20 spine.
- **Floor under-scope** — exemption sound (legit small UX-completion increment, not padding).

---

## design_gap handoff
**design_gap_flag: FALSE** — correct. ConnectionStateIndicator + PendingRow/FailedRow already built + adopted; this wave is live-wiring + catch-up-loop logic + tests, no new design surface. D-block SKIPS → handoff to **B-block** on final APPROVED.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 1
  reviewers: {}   # Phase 2 pool (karen + jenny + gemini) spawns next
  failed_checks: []
  rule1_premise_verification: PASS   # a/b/c/d all TRUE against real code; nextCursor buildability confirmed
  floor: EXEMPT   # wave-16 legit-small-increment precedent
  design_gap_flag: false
  next_action: PROCEED_TO_P-4_PHASE_2
  handoff_on_final_approve: B-block
  rationale: >
    All four rule-1 premises verified TRUE against the actual source (getSocketState 3-state
    at messagingSocket.ts:228; AppHome.tsx:39 hardcode; useMessages.ts:138 single-shot ignoring
    nextCursor; ConnectionStateIndicator + Pending/FailedRow shipped) with zero drift in either
    direction, and getMessagesAfter's MessagesAfterResponse.nextCursor confirms the loop is
    buildable. The wave maps to live milestone M4 and its no-data-loss metric, fixes causes not
    symptoms, holds the offline-messaging wedge with no gold-plating (no rebuild, bounded loop,
    frontend-only), and specifies every non-happy state with independently verifiable ACs. Floor
    exemption is the legitimate wave-16 small-increment case, not padding. design_gap FALSE is
    correct. Every stage-exit checkbox ticked from a concrete artifact.
```

---

# Wave 21 — P-4 Gate Verdict (Phase 2) — Gemini reviewer triage

**Phase 1:** APPROVED. **karen:** APPROVED. **jenny:** APPROVED. **gemini:** one CONCERN (below).

## Gemini CONCERN — connection-state source priority
**Verbatim (truncated):** *"The connection state hook conflates two sources of truth — the specific socket state and the general browser online status — without defining a clear priority. This risks displaying a state that misrepresents the user's actual ability to communicate, as the browser's global event is a coarse symptom, while the socket's state is the direct cause of connectivity."* SUGGESTION: treat the socket's state as authoritative.

## Triage — MATERIAL

**1. Is the concern real?** YES. The seed (c1dbee64) + P-3 derive displayed connection-state from BOTH `getSocketState()` (the direct StudyHall-connectivity signal: online/reconnecting/offline) AND `window` online/offline events (coarse OS-level network signal), and the spec does NOT define which wins when they disagree. Two real disagreement cases produce a wrong dot:
   - `window=online` but `socket=reconnecting` → dot could show "online" while the user CANNOT send. Actively misleading.
   - `window=offline` but `socket=connected (stale)` → dot lags on "online" after the network drops; a faster definitive no-network signal is ignored.

**2. Does it fire THIS wave?** YES, immediately — the hook combines the two sources in c1dbee64 this wave; the undefined priority is a present correctness gap, not a future-wave concern.

**3. Is it load-bearing?** YES. This wave's falsifiable AC is the HONEST connectivity signal (dot reflects real ability to communicate). An undefined priority defeats that AC rather than merely degrading polish — it is the wedge's whole point. Not cosmetic.

**4. Is the fix a small annotation (not a rework)?** YES — a single conditional in the hook, no architecture change, no new infra, no scope expansion.

## P-3 annotation (the source-priority rule)
Add to the c1dbee64 seed `tasks.description` P-3 plan section (and the P-2 connection-state non-happy-state ACs):

> **Connection-state source priority — socket state is authoritative for the displayed state.**
> Resolution order in `useConnectionState`:
> 1. `offline` if (`window` offline OR `socket` offline) — `window`-offline short-circuits to `offline` (definitive no-network signal reaches the dot fast);
> 2. else `reconnecting` if `socket` reconnecting;
> 3. else `online`.
>
> `window 'online'` is a TRIGGER to re-evaluate the socket, NEVER an override: a regained network with a still-reconnecting socket shows `reconnecting`, not `online`. Net rule: **window-offline can only pull the state toward offline; window-online can never push it to online while the socket is not connected.** Add a test (in 2fe6b517) for the two disagreement cases: (window=online, socket=reconnecting)→"reconnecting"; (window=offline, socket=connected)→"offline".

## Disposition
MATERIAL → small P-3/P-2 annotation + one test case. NOT a rework; bundle, floor exemption, design_gap, and architecture findings from Phase 1 all stand unchanged. B-block handoff proceeds with this annotation folded into the seed spec.

```yaml
head_signoff:
  verdict: APPROVED
  stage: P-4
  phase: 2
  reviewers:
    karen: APPROVED
    jenny: APPROVED
    gemini: CONCERN
  gemini_concern_triage:
    concern: connection-state-source-priority-undefined
    decision: MATERIAL
    fires_this_wave: true
    load_bearing: true   # defeats the honest-connectivity AC, the wedge's point
    remediation: P-3/P-2 annotation (socket authoritative; window-offline short-circuits to offline; window-online re-triggers, never overrides) + 1 test case in 2fe6b517
    rework: false        # single hook conditional, no architecture/infra/scope change
    precedent: wave-17/18/19/20 Gemini forward-correctness CONCERN -> MATERIAL -> small annotation
  failed_checks: []
  design_gap_flag: false
  next_action: ANNOTATE_SEED_THEN_PROCEED_TO_B_BLOCK
  handoff_on_final_approve: B-block
  rationale: >
    Gemini's CONCERN is real and fires this wave: c1dbee64 combines getSocketState() and
    window online/offline with no defined priority, so the dot can read "online" while the
    socket is reconnecting (user cannot send) or lag "online" after a network drop. This is
    load-bearing — it defeats this wave's honest-connectivity AC, not a cosmetic edge. The fix
    is a small hook conditional (socket authoritative for displayed state; window-offline
    short-circuits to offline; window-online only re-triggers, never overrides to online while
    the socket is not connected) plus one test case for the two disagreement cases. MATERIAL ->
    small annotation, consistent with the wave-17/18/19/20 forward-correctness precedent. No
    rework; bundle/floor/architecture/design_gap findings unchanged. Final P-4 verdict APPROVED;
    seed gets the annotation, then handoff to B-block.
```

---
## Phase 2 final (appended by orchestrator)
| Reviewer | Verdict |
|---|---|
| karen | APPROVE — all 5 rule-1 premises VERIFIED (getSocketState 3-state, AppHome:39 hardcode, runDrainAndCatchup one-shot ignoring nextCursor, indicator+pending/failed shipped, getMessagesAfter→nextCursor). Catch-up loop buildable (terminate-on-null). B-carries: cursor-advance-outside-setState + per-page write-through. |
| jenny | APPROVE — spec MATCHES M4 ## Scope (connection-state indicator + catch-up cursor + heavily-tested) + the no-data-loss metric; floor-exemption consistent (record extended precedent at L-1: wave-16 test-infra → wave-21 UX-completion); no rebuild; M4 not over-claimed. |
| Gemini | CONCERN (connection-state source-priority undefined) → head-product MATERIAL → SOURCE-PRIORITY annotation (socket authoritative; window-offline short-circuits; window-online only re-triggers). Gate stays APPROVED. |

## Gate result: PASSED → B-block (design_gap_flag FALSE → D SKIPS)
- B-block carries: (1) SOURCE-PRIORITY rule for useConnectionState (socket authoritative; window-offline→offline; window-online re-trigger-only) + a disagreement-case test; (2) catch-up cursor-advance OUTSIDE setRealMessages (no stale closure) + per-page write-through; (3) catch-up loop opaque-cursor + dedup-by-id + MAX_ITERS guard (no silent loss); (4) reuse shipped ConnectionStateIndicator + pending/failed UI + Dexie/outbox/?after= (NO rebuild, rule 1); (5) floor-EXEMPT (wave-16 legit-small-increment); (6) gating AC: multi-page recovery no-data-loss + dot reflects real socket state (tested, fake-indexeddb).
- Frontend-only, no server change, no new dep. Next: B-0 (branch + claim; no schema).
