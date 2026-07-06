# P-0 Frame — wave-60

## Discover
- wave_db_id: 367f8732-6e42-4e5c-b70f-c40bdfc0e208 (wave_number 60, running)
- Prior-work: wave-46 T-6 F10 (origin of this token-drift finding). No prior wave fixed these 3 surfaces.
- Roadmap milestone: M8 (84e17739, in_progress, Class=product-feature). Wave milestone backfilled.
- Spec short-circuit: no-prior-spec (prose description) → full P-1..P-3.
- Product decisions: none (cosmetic token-hygiene, no Tier-3 signal).

## Reframe
- Original framing: swap 3 off-token DM surface shades to canonical DESIGN-SYSTEM.md tokens.
- **problem-framer: PROCEED** (matched antipattern #1 symptom-vs-cause). The off-token values are HARDCODED hex
  inline (`style={{...}}`), NOT consuming the token system — root cause is architectural (45 web-shell files
  hardcode palette hex). The seed's fix is valid for its intent. IMPLEMENTATION STEER: implement as a cause-fix
  by converting these 3 surfaces to consume canonical `var(--color-surface-*)` tokens (not just swapping to
  different hardcoded hex). CARRY-FORWARD (future wave / L-2): a token-consumption migration wave (inline hex →
  var() across apps/web/src) + an L-2 antipattern candidate "hardcoded palette hex where a consumable token
  exists" (PRODUCT-PRINCIPLES § Antipatterns currently empty).
- **ceo-reviewer: PROCEED (HOLD-SCOPE)** ~1/10 value; contract-correct tail-drainage. STRONG RECOMMENDATION
  (advice, not a loop-halt): FOREGROUND the founder digest — the engine has run out of work it can do alone
  (down to cosmetics, ~1-2 waves from stockout) while BOTH high-value milestones (M9 paid plans + M12 offline-first,
  the latter a 6/7 BOARD-wanted pivot HELD as founder-reserved) wait on the founder. Escalate from soft flag to a
  foregrounded plain-language "which first?" decision-request. Acted on below.
- **mvp-thinner: OK** — single indivisible token-hygiene AC (3 adjacent-surface swaps in one coherent pass);
  nothing to split; not OVER-CUT (deliberate BOARD/founder-endorsed tail drainage).
- Mediation: none needed.
- **Disposition: PROCEED.** Final framing: convert 3 off-token DM surfaces (server rail, picker modal card,
  disabled-send) to consume canonical DESIGN-SYSTEM.md tokens. design_gap_flag expected FALSE (existing surfaces,
  canonical tokens already defined).

## Carry-forward for N-1 / founder
- Founder decision foregrounded this wave (per ceo-reviewer) — see updated checkpoint file.
- Future token-consumption migration wave (problem-framer cause-fix) — candidate seed.
