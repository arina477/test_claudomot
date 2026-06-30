```yaml
verdict: OK
verdict_source: mvp-thinner
milestone_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
milestone_title: M4 — Offline-first reliability (the wedge)
milestone_class: product-feature
milestone_success_metric: |
  A student loses connectivity mid-session, keeps reading cached channels and
  composing messages, and on reconnect every queued message sends exactly once
  in order with no data loss. THIS is the bet's offline-first leg made real.
mvp_critical_status: |
  N of M still pending — M4 offline-first ## Scope is partially shipped. The
  exactly-once send-path spine (idempotent server, Dexie store, outbox enqueue,
  forward catch-up cursor) and the pending/failed message UI landed in wave-20.
  The two reliability gaps in this bundle (dead connection-state indicator +
  single-page catch-up that drops messages past page 1) are the unmet residual
  of the "no data loss" + "felt offline UX" success-metric clauses. All three
  wave-21 ACs trace to that residual.

ok_rationale: |
  Every AC traces cleanly to the M4 mvp-critical floor; nothing is deferrable
  to a sibling without either breaking the success metric or costing MORE than
  keeping it. Trace test, per AC:

  (1) 94e41695 — multi-page catch-up loop. KEEP / mvp-critical. If absent, an
      offline window > 1 server page (50 msgs) recovers only the first 50 and
      loses the rest until newer socket traffic arrives. That is a direct
      violation of the success metric's "no data loss" clause. Not deferrable.
      It is a small bounded loop-until-nextCursor-null built ON the already-shipped
      forward ?after= cursor + getMessagesAfter — no new endpoint, no rebuild.

  (2) c1dbee64 — live connection-state derivation, FULL 3-state. KEEP / mvp-critical.
      Considered the one plausible THIN: ship 2-state (online/offline) now, defer
      "reconnecting". REJECTED on cost grounds. messagingSocket.ts:228
      getSocketState() ALREADY returns 'online' | 'reconnecting' | 'offline' — the
      s.active reconnect-attempt branch is already implemented — and
      ConnectionStateIndicator.tsx:14 already renders all three states. The hook
      this AC builds simply READS getSocketState() + reconciles navigator.onLine.
      Deferring "reconnecting" would mean writing a 2-state hook now and rewriting
      it to 3-state later — a sibling split that CREATES work rather than removing
      it. A split must peel off net work; this would add it. Not a valid THIN.
      The indicator is also the "felt offline UX" half of the wedge the metric's
      read-clause depends on being visibly real at runtime.

  (3) 2fe6b517 — transition + multi-page-drain tests. KEEP / mvp-critical. M4
      ## Scope explicitly mandates the offline surface be "Heavily tested
      (fake-indexeddb unit + integration)." The tests cover exactly the two
      reliability gaps in this bundle (connection-state transitions; exactly-once /
      in-order / gap-free multi-page recovery + loop-termination + bounded guard)
      and reuse the existing wave-20 harness — not gold-plated coverage. Scoped
      to the wave's own deltas. Not deferrable: dropping it leaves the no-data-loss
      claim unverified, which is the falsifiable heart of the wedge.

  The decomposer already applied PRODUCT-PRINCIPLES rule-1 premise-refinement
  (dropped the already-shipped pending/failed UI task; corrected the dead-component
  task to its real data-source scope). That refinement removed the genuinely
  surplus scope before P-0. No residual thinness remains for me to peel.

floor_constraint_active: false
floor_constraint_detail: |
  N/A — no THIN was blocked by the floor. There is no valid split to block:
  the only split candidate (deferring "reconnecting") fails the peel-off test on
  its own merits (it would add net work, not remove it), independent of any floor.
  Floor note for P-1 (advisory, NOT my authority): this is a 3-spec multi-spec
  bundle estimated ~1800–2600 LOC, which may sit at/below the multi-spec floor
  (> 2,500 LOC OR >= 6 specs). If P-1's estimate lands under, the wave-16 precedent
  (legit-small reliability/test-completion increment on a multi-wave milestone) is
  the relevant exemption frame, OR P-1 may pull a small re-homed M4 tech-debt task
  in to clear it. That is a P-1 sizing call, not an mvp-thinner re-classification —
  flagged only so P-1 has the context.

sibling_visible: false
```
