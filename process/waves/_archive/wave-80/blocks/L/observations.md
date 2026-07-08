# Wave-80 L-block observations — knowledge-synthesizer

Append-only. L-2 Distill (karen) reads these; promotes to `*-PRINCIPLES.md` ONLY when an
observation recurs across 2+ waves AND the head-X gate approves (max 1 rule/file/wave). Single-wave
observations stay here until a second wave confirms, UNLESS a strong 1st instance clears the bar on
its own merit (head-X discretion, per the wave-78 BUILD-17 precedent).

---

## Inputs read

- Wave deliverables: `process/waves/wave-80/stages/` full set — P-0-frame / P-0-ceo-reviewer /
  P-0-mvp-thinner / P-0-problem-framer, P-1-decompose, P-2-spec, P-3-plan, P-4-gemini-review,
  B-0..B-6, B-6-review, B-6-review-output, C-1-pr-ci-merge, C-2-deploy-and-verify, T-1..T-9,
  V-1-karen, V-1-jenny, V-1-summary, V-2-triage, V-3-fast-fix. Blocks: B/C/D/L/N/P/T/V.
- Wave outcome: presence (online-status) privacy toggle, LIVE @ 4795638, V-block APPROVED,
  0 blocking. B-6 /review found 4 privacy-intent findings (F1 clobber, F2 connect-vs-toggle leak,
  F3 audience mismatch, F4 optimistic-revert) — all FIXED (5cca542 + 7ecb493), re-review CLOSED.
- Prior archives consulted (most recent 5): wave-79 (BUILD promotions history), wave-78
  (BUILD-17 fail-closed strong-1st precedent; VERIFY HOLD), wave-77 (BUILD-16 delegate-to-seam +
  T-8 rule-4 both 2nd-instance promoted), wave-76, wave-75.
- Principles files read: BUILD-PRINCIPLES.md (18 rules), PRODUCT-PRINCIPLES.md (5 rules),
  VERIFY-PRINCIPLES.md, T-8.md, T-5.md (3 rules).

**De-dup up front (already-shipped rules this wave touched — do NOT re-propose):**
- BUILD-16 (delegate-to-seam) / BUILD-18 (reused seam gates the exact setting) — this wave's honor
  gate is a NEW cross-module emit, not a re-query drift; adjacent but not the same failure.
- BUILD-5 (guard reconnect-triggered async loop with mutex) — F2's per-user `withPresenceLock` is
  the SAME family; the connect-vs-toggle race is already covered in spirit. Do NOT re-promote.
- T-5 rule 3 (cover a realtime feature's initial server-push with a real-socket E2E, not round-trip
  unit tests) — this wave's two-client honor test EXTENDS but does not contradict it.
- T-8 rule 5 (spoofed-key two-client) — same two-subject realtime-authz family.

---

## L-2 synthesis observations

### obs-1 — Anti-theater descope: a privacy control that can't yet enforce its promise must not ship as a live no-op
- **Source:** P-0-frame (Reframe section; unanimous problem-framer REFRAME + ceo-reviewer
  SELECTIVE-EXPANSION + mvp-thinner THIN), product-decisions log 2026-07-08.
- **What happened:** The seed proposed two privacy toggles — `sendReadReceipts` + `showPresence`.
  All three P-0 reviewers verified against code that StudyHall has NO message read-receipt feature
  (`read_at` is on notifications, not a sender-visible "seen-by"), so `sendReadReceipts` would gate
  a nonexistent surface. The wave descoped to `showPresence` (a real, shipped presence service),
  deferring read-receipts as a seedable M13 sibling. Decisive lever: the project's OWN convention —
  `whoCanDm` ships DISABLED as a "Beta Feature" affordance because its enforcement isn't built — so
  a stored-but-unenforced toggle was off the table by precedent.
- **Generalizable / falsifiable:** Yes. Any wave adding a privacy/security control can be checked:
  does the enforcement surface exist? If not, the control ships disabled/deferred, never as a live
  toggle that appears to work. A reviewer can falsify by finding a shipped control with no
  enforcement path behind it.
- **Distinct from existing:** PRODUCT-1 (verify absent/present premise at P-0) is the *detection*
  step; this is the *disposition* rule for when the enforcement surface is confirmed absent. Not a
  near-dup. Relates to the anti-security-theater theme but is a product-scope rule, not a test rule.
- **Severity:** HIGH (a control that lies about privacy is worse than an absent one).
- **Candidate:** PRODUCT-PRINCIPLES.md (rule 6). **1st wave-loop instance** — the whoCanDm-Beta
  precedent is a project code convention, not a prior L-observation.
- **Disposition:** **PROMOTION CANDIDATE via strong-1st discretion** (privacy/security-scope,
  clean unanimous cite, follows wave-78 BUILD-17 precedent). If head-product/head-learn decline
  strong-1st → HOLD for a 2nd instance. Suggested wording (contract-formatted):
  > 6. A privacy or security control whose enforcement surface is absent ships disabled or deferred, never as a live no-op toggle.
  >    Why: A control that appears to work but enforces nothing lies about protection and is worse than its absence.

### obs-2 — Full-object PUT re-sent from stale client state silently clobbers a concurrent field change
- **Source:** B-6-review-output F1 (P2/conf 9), fix 5cca542 + 7ecb493; T-8 §2 live-proven;
  V-1-jenny (partial-PUT no-clobber). 
- **What happened:** The settings PUT originally sent the full privacy object from client state. A
  stale tab changing only visibility would re-send `showPresence=true`, silently re-enabling a
  presence the user had just turned off in another tab. Fixed by making the schema `.partial()`,
  the service merge only present keys, and the UI send only the changed field.
- **Generalizable / falsifiable:** Yes. For any resource whose fields are toggled independently, a
  full-object replace from client state is a last-write-wins clobber of concurrent edits. Checkable
  at review: does the update send the full object or only changed fields? Falsifiable by a
  two-tab / concurrent-edit test.
- **Distinct from existing:** Not covered. BUILD-15 (wrap all-or-nothing mutation in a txn) is about
  atomicity within one write, not cross-write clobber. Genuinely new BUILD class.
- **Severity:** MEDIUM-HIGH (silent privacy regression; caught pre-merge here, no prod impact).
- **Candidate:** BUILD-PRINCIPLES.md (rule 19). **1st instance, no prior in 5-wave window.**
- **Disposition:** **HOLD** (1st instance; per-file cap is ≤1 BUILD/wave and this is a
  data-integrity/concurrency class, not a strong-1st security enforcement rule on its own merit —
  the clobber was caught by review, not shipped). Promote on 2nd instance. Suggested wording if a
  future wave confirms:
  > 19. For independently-toggled fields, send and persist only the changed field, not a full-object replace from client state.
  >     Why: A full replace re-sends stale unchanged fields and silently clobbers a concurrent edit.

### obs-3 — A realtime-enforced privacy toggle must PROACTIVELY emit the state change to peers, not rely on passive gating at next connect
- **Source:** P-3-plan §"P-4 Phase-2 binding corrections" (proactive emit is the real AC-2
  mechanism); B-6-review-output F2; T-5 S2/S3 (A off → B offline ~126ms, no A reconnect);
  V-1-jenny AC-2.
- **What happened:** Passive gating (exclude a hidden user only at the next connect/snapshot) fails
  the two-client test — a mid-session toggle appears not to work because peers already have the
  user cached online. The fix wired a proactive `presence:offline` / `presence:online` cross-module
  emit from the privacy-update path so peers update WITHOUT the subject reconnecting.
- **Generalizable / falsifiable:** Partially. Applies specifically to visibility state that peers
  cache from a push channel. Checkable: does the toggle emit the correction, or only gate future
  fan-out? Falsifiable by a two-client mid-session-toggle test asserting the peer-received event.
- **Distinct from existing:** T-5 rule 3 covers *testing* the initial server-push with a real
  socket; this is a *build* rule about the enforcement mechanism (proactive vs passive). Adjacent,
  not a dup. Also relates to BUILD-16/18 (honor at the right seam) but is about push timing.
- **Severity:** MEDIUM-HIGH (toggle silently no-ops mid-session; caught at P-4/B-6).
- **Candidate:** BUILD-PRINCIPLES.md (would compete with obs-2 for the ≤1 BUILD/wave slot).
- **Disposition:** **HOLD** (1st instance; narrower than obs-2; and the ≤1-BUILD-per-wave cap means
  at most one of obs-2/obs-3 could promote — obs-2 is the more general of the two). Promote on 2nd
  instance.

### obs-4 — Two-client honor test asserting the CO-MEMBER-received event is the make-or-break proof for a realtime-visibility feature (2nd data point)
- **Source:** T-5 (two distinct verified users, two live sockets, asserting B's RECEIVED frames);
  T-8 §1; P-0-frame binding refinement 3; head-tester carried [presence-honor-two-client-live].
- **What happened:** The load-bearing AC was proven only by a genuine two-subject test where the
  co-member's socket logged the received `presence:offline{A}` — a single-client test would have
  been coverage theater (self-emit proves nothing about what peers see).
- **Generalizable / falsifiable:** Yes, but LARGELY ALREADY PRINCIPLED. T-5 rule 3 (real-socket,
  not round-trip) + T-8 rule 5 (spoofed-key two-client) cover the two-subject realtime-authz family.
  The novel refinement here is "assert the OTHER subject's received event, not the emitter's" — a
  narrow sharpening.
- **Distinct from existing:** Marginal. Risk of near-dup with T-5 rule 3.
- **Severity:** LOW as a new rule (theme already covered); HIGH as reinforcement of the existing
  T-5/T-8 realtime-honor family.
- **Candidate:** T-5.md — but likely a near-dup of rule 3.
- **Disposition:** **HOLD / reinforcement only.** This is the 2nd wave-loop data point for the
  co-member-received two-client realtime-honor pattern (wave-77 T-8 rule-4 assert-body + this).
  Recommend NOT a new rule (near-dup); note it as strengthening T-5 rule 3 + T-8 rule 5. If
  head-tester wants an explicit "assert the co-member's received event, not the emitter's" rule,
  it is a legitimate 2nd-instance promotion, but at real dup risk with T-5 rule 3.

---

## Summary for head-learn / karen

- **Observations emitted: 4 (obs-1..obs-4).**
- **Promotion candidates:**
  - obs-1 → PRODUCT-PRINCIPLES.md rule 6 (anti-theater descope), via **strong-1st discretion**
    (privacy/security scope, unanimous P-0 cite). This is the one true promotion candidate.
  - obs-2 → BUILD-PRINCIPLES.md rule 19 (partial-not-full-replace) — **HOLD**, 1st instance.
  - obs-3 → BUILD-PRINCIPLES.md (proactive-emit) — **HOLD**, 1st instance; competes with obs-2 for
    the ≤1-BUILD/wave slot (obs-2 more general).
  - obs-4 → T-5.md — **HOLD**, near-dup of T-5 rule 3; reinforcement only.
- **Per-file cap note:** ≤1 promotion per file per wave. Only PRODUCT has a candidate (obs-1); BUILD
  has two HOLDs of which at most one could ever promote in a single wave.
- **Standing HOLDs that gained a 2nd data point:** obs-4 (co-member-received two-client realtime
  honor) is arguably a 2nd instance of the T-5/T-8 realtime-honor family — but it reinforces
  existing rules rather than needing a new one. **The full-replace-clobber (obs-2) and proactive-emit
  (obs-3) patterns have NO prior instance** in the 5-wave archive window — both are genuine 1st
  instances, hence HOLD.
- **Most waves promote 0.** Recommend head-learn promote obs-1 only (strong-1st, privacy scope) or,
  if strong-1st is declined, promote nothing and carry all four as HOLDs.
