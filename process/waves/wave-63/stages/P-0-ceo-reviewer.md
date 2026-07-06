# P-0 — ceo-reviewer verdict (wave-63)

```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This bundle IS the headline of M12 — offline coverage for the academic content the
  milestone's success metric names by name ("assignments, study-group data"). It is not
  ambitious-under-reaching (SCOPE-EXPANSION): the scope already jumps from the DM
  pattern-prover to the metric's core academic surface, which is exactly the right next
  step now that bundle #1 proved the read-cache pattern cheaply. It is not over-reaching
  (SCOPE-REDUCTION): the slice is 1 substrate + 2 read wire-ins on shipped infra, and it
  deliberately holds the write/conflict story for a later bundle — the tightest slice that
  still advances the headline. No single cheap-but-disproportionate addition clears the
  SELECTIVE-EXPANSION bar (see below on schedule vs study-group). The scope is exactly
  right; the bar here is execution quality, so HOLD-SCOPE.
bet_traced_to: "Academic tools + offline-first win students from Discord (ad1a3685-dbf9-47b0-b244-f2245ce14c0a, status='live')"
milestone_traced_to: "36378340-0ea5-428e-bc94-03750fb103f6 — M12 — Offline-first moat (in_progress)"
proposed_scope_change: |
  None. HOLD-SCOPE.
sibling_visible: false
```

## Reasoning (the three questions posed)

### 1. Is this the RIGHT high-value next step, correctly hitting the moat's HEADLINE?

Yes, and unambiguously. The M12 success metric reads: "a student working fully offline
can access ALL their StudyHall content — not just recent channel messages (the shipped
M4 wedge) but **assignments, study-group data, and previously-loaded media**." Bundle #1
(wave-62, DM read-cache) was correctly framed as the cheapest-first pattern-prover — it
proved the Dexie substrate + read-path swap on the lowest-risk content type, not the
headline. The metric's center of gravity is coursework, and this bundle #2 is the FIRST
bundle to touch the coursework surface the bet actually rests on.

The founder's own choice makes this the traceable next step: the offline-first direction
was the founder's explicit answer at the M12 stockout, and the live bet's wedge is
"academic-specific features + offline-first reliability." Offline assignments is the
literal intersection of those two clauses — the single most on-thesis slice in the
roadmap right now. "Student doing coursework on bad wifi still sees their assignments"
is the bet's falsifier flipped into a shipped capability. This is not a real-bug-that-
doesn't-matter and it is not polish; it is core moat advance.

### 2. Ambition calibration — appropriately ambitious without over-reaching?

Correctly calibrated (why HOLD-SCOPE, not the other three modes):

- **Not SCOPE-EXPANSION (under-reaching):** the bundle already advances from the
  pattern-prover to the metric's named academic content. Pushing further this wave
  (e.g. pulling in the write/conflict story, or offline media) would couple a proven-safe
  read-cache extension to genuinely new, higher-risk problems and slow the headline win.
  The right expansion is *sequential bundles*, not a fatter wave.
- **Not SCOPE-REDUCTION (over-reaching):** 1 Dexie v3 substrate + 2 read wire-ins,
  reusing the bundle-#1 pattern and shipped infra, is a lean slice. There is no smaller
  cut that still ships an academic-content offline capability — dropping either wire-in
  would leave the substrate half-consumed. The slice is at the floor already.
- **Not SELECTIVE-EXPANSION:** no single cheap addition clears the disproportionate-value
  bar. The obvious candidate — folding in write/outbox for offline assignment edits — is
  explicitly NOT cheap (it opens the conflict-resolution problem the metric reserves for a
  later bundle) and would violate read-first sequencing.

### 3. Assignments + class SCHEDULE — right pair-mate, or is study-group data higher-leverage?

Class schedule is a defensible, arguably optimal pair-mate, and I do not recommend swapping
it for study-group data this wave:

- **Coherence with the seed substrate.** The seed is `cachedAssignments + cachedScheduledSessions`
  — schedule and assignments are the two time-anchored coursework primitives a student
  checks when "what do I have to do / where do I have to be." They are the natural offline
  pair: a disconnected student on bad wifi wanting *coursework context* wants both "what's
  due" and "when's my next class." The substrate already carries both, so wiring both read
  paths fully consumes the seed with no orphaned schema — this is the reuse-maximizing cut.
- **Study-group data is genuinely higher-leverage long-term but heavier now.** Study-group
  spaces are the third leg of the bet's wedge and the metric names them explicitly — so
  they ARE headline. But study-group data is a richer, more relational surface (membership,
  shared artifacts, session state) than the two flat read-lists here, and it deserves its
  own bundle rather than being crammed alongside assignments this wave. Sequencing schedule
  now (cheap, substrate-aligned) and study-group data as the NEXT M12 bundle is the correct
  order: it keeps this wave WIP-limited and lets the study-group offline slice get first-
  class attention. Flag for N-1: **bundle #3 should be offline study-group data** — it is
  the remaining named clause of the metric and the strongest social-collaboration moat
  surface.

### On read-only / deferred write+conflict story

Read-first is the correct sequencing, not a gap. The metric has two halves: (a) full-content
offline *access*, and (b) conflict-resolution UI on reconnect. Half (a) — the access surface —
is where near-term user value and the falsifier both live: a student on bad wifi seeing their
assignments and schedule is the concrete "it works offline" proof. Half (b) (offline edits +
two-place conflict reconcile) is a distinct, higher-risk problem that should not be entangled
with proving the read surface across content types. Proving offline *coverage* of the academic
surface first, then layering the write/conflict story once coverage is broad, is the lower-risk
build order and matches how the bet is falsified (coverage, not conflict, is what moves a
cohort off Discord). Deferring write/conflict to later M12 bundles is correct — not a
scope hole to flag at P-4.

**Disposition: PROCEED (HOLD-SCOPE).** This is the on-thesis headline slice of the
offline-first moat at the right ambition, correctly sequenced. The bar downstream is
execution quality: the seed must land the Dexie v3 migration cleanly against the shipped
v2 substrate, and each read wire-in must degrade to cache only when genuinely disconnected
(no stale-cache-over-live regressions). Non-blocking note for N-1: queue offline
study-group data as M12 bundle #3.
```
