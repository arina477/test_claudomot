# P-0 Frame — wave-59

## Discover
- wave_db_id: 66ce66c5-c268-455d-be44-5b4bb6e3ab55 (wave_number 59, status running)
- Prior-work: wave-45 V-2 F1 (the origin of this coverage-gap seed). No prior wave tested buildTypingLabel.
- Roadmap milestone: M8 (84e17739, in_progress, Class=product-feature). Wave milestone backfilled.
- Spec-contract short-circuit: **no-prior-spec** (task description is prose, no fenced YAML head) → full P-1..P-3.
- Product decisions: none (test-only, no Tier-3 signal).

## Reframe
- Original framing: add a table-driven unit test for buildTypingLabel's 5 branches (0/1/2/3/4+).
- **problem-framer:** PROCEED. Cause-level framing correct (absence of a locked behavioral characterization
  test); behavior-testing not implementation-testing; T-1 unit is the right layer; the `as Typer` casts are
  length-guarded and mask no type hole. Too-tiny concern dismissed (intentional tail-drainage).
- **ceo-reviewer:** PROCEED (HOLD-SCOPE). Contract-correct but ~2/10 value (M8 substantive scope shipped).
  **STRATEGIC FLAG for N-1:** don't grind the low-value M8 tail indefinitely while M9 (founder-reserved) waits.
  Once the tail drains, promote **M12 "Offline-first moat" (36378340, todo)** — the differentiator half of the
  live founder bet (ad1a3685), which needs NO founder gate and IS autonomously advanceable. This reframes the
  "only low-value work remains until founder decides M9" picture: high-value founder-gate-free work exists.
- **mvp-thinner:** OK. One indivisible AC; nothing to split; test-coverage waves exempt from feature-LOC floor
  (product-decisions wave-16 precedent). Not OVER-CUT — deliberate minimal cleanup item.
- Mediation: none needed (no ceo-expansion vs mvp-thin conflict).
- **Disposition: PROCEED.** Final framing: single-AC table-driven unit test locking buildTypingLabel's 5-branch
  output contract. design_gap_flag expected false (test-only).

## Carry-forward for N-1 (this wave)
ceo-reviewer's M12-promotion recommendation — evaluate promoting M12 (offline-first moat) at N-1 rather than
continuing to drain low-value M8 tail. Surface to founder alongside the standing M9 flag.
