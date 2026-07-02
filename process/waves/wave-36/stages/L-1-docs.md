# Wave 36 — L-1 Docs

**Stage:** L-1 (Docs), run concurrently with L-2 (Distill).
**Owner:** head-learn (spawn-pattern, owns L-block).
**Mode:** automatic. Milestone delta was mechanical (open_count > 0) — no BOARD, no deferral.

## Purpose recap

CHANGELOG entry + milestone delta for wave-36 (M7 test-hardening). T-9 already
regenerated the journey map (date-string-only change on already-inventoried pages);
L-1 does not redo journey work. This wave is mostly internal (durable regression tests
for the wave-35 privacy boundary) plus one tiny user-facing fix (stub-page date → 2026).

## Action 1 — CHANGELOG entry

Appended two terse bullets under the existing `[Unreleased]` subsections, matching
house style (user-facing, present-tense, one line each, `(#50)` cited). Length: 2
bullets, well under the headline + ≤5-bullet cap. Deliberately did NOT inventory the
states-AC re-scope (73e96a9d) — an internal spec/deferral note with no user-facing
surface — per the "do not over-inventory" discipline.

- **Changed** (CHANGELOG.md:74): the wave-35 privacy protections (Hidden-student roster
  hiding, self-scoped data export, PII-scrubbed error reports) are now covered by durable
  automated tests running against a real database on every change; phrased "(no visible
  change)" per the #40 precedent for noted-but-invisible hardening.
- **Fixed** (CHANGELOG.md:83): the "Last updated" date on /privacy and /terms now reads
  2026, correcting a stale year on the published policy pages.

## Action 2 — Milestone delta

Milestone touched by the claimed tasks: **M7 (6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007) —
Privacy controls, notifications & launch polish** [in_progress].

L-2 already marked the 3 claimed tasks (622a7bf3, 73e96a9d, b7feab30) `done`. Post-update
M7 child-task census:

```
done_count | open_count | cancelled_count
     7     |     2      |       0
```

`open_count = 2` (> 0) → **M7 does NOT close; it progresses.** No status transition, no
`milestones` write, no product-decisions.md append (append fires only on transition to
`done`). Mechanical, unambiguous → no mode escalation / BOARD.

The 2 open rows are BOTH parked credential-blocked founder-ops tasks:
- a1299e88 — Verify a Resend domain for transactional email (blocked on founder-provided keys)
- 84e09891 — Set Railway Bucket creds + verify avatar upload live (blocked on founder-provided keys)

**Flag for N-1 (soft signal, not a transition):** `open_count = 2` sits below the brain
fallback stock-out threshold (< 3), but this is NOT a genuine `backlog-stockout` that N-1
should auto-fill by decomposition — both open rows are credential-blocked founder-ops
(explicitly marked "do NOT auto-seed" on the wave-36 checklist). M7's remaining *core*
scope (notifications-module polish, final deploy-verification + canary wiring) is not yet
decomposed into task rows. N-1 should treat M7 as still-active with a decomposition need
for its core scope, and leave the two parked credential-ops tasks parked until the founder
supplies keys.

## Action 3 — README touchups

**Skipped.** Nothing user-facing beyond a date-string correction on two stub pages; no new
CLI command, env var, install step, or breaking change. README is unaffected.

## Action 4 — Commit

FS docs committed under `docs: L-1 wave-36 closeout` and pushed to main (see footer for SHA).
No split commit needed (no Security-section entry, no README breaking-change note).

## Footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:74 (Changed — regression coverage), CHANGELOG.md:83 (Fixed — /privacy+/terms 2026 date)"
  - "milestone M7 6e2f68d8: NO transition (open_count=2 > 0, both parked credential-blocked); in_progress retained"
  - "README.md: not touched (skip recorded)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M7 (6e2f68d8)", before: in_progress, after: in_progress, note: "progresses; 7 done / 2 open (both parked cred-blocked); does not close"}
roadmap_skip_reason: ""
readme_sections_touched: []
next_block_flag_for_N1: "M7 active; 2 open rows are parked credential-blocked founder-ops (do NOT auto-seed); core scope (notifications, canary) not yet decomposed — N-1 owns decomposition/roadmap decision."
note: "Test-hardening wave; mostly internal. Milestone delta fully mechanical under automatic mode."
head_signoff:
  verdict: APPROVED
  stage: L-1
  reviewers: {}
  failed_checks: []
  rationale: >
    CHANGELOG entry appended terse and user-facing (2 bullets, under cap), covering the one
    user-facing change (stub-date fix) and noting the internal regression-coverage hardening
    per house precedent; internal-only states-AC note correctly omitted. Milestone delta is
    mechanical — M7 open_count=2 > 0 so no close, no BOARD, no product-decisions append. README
    skip is correct (no user-facing surface beyond a date string). All L-1 exit boxes tick.
  next_action: PROCEED_TO_L-2
```
