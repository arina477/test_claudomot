verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  Scope is exactly right and the bar is execution quality, not ambition tuning.
  Not SCOPE-EXPANSION: the bet implies no larger CI ambition — a single compiled-boot
  probe is the precise gap (CI-green builds that crash at prod first-boot). Not
  SELECTIVE-EXPANSION: any cheap addition (matrix boots, smoke-test of more routes,
  migration dry-run) is gold-plating at self-use-mvp with one user and no recurring
  signal yet. Not SCOPE-REDUCTION/DROP: this is the opposite of a real-bug-that-
  doesn't-matter — the failure class caused 4 prod outages across waves 2/3/5 incl.
  one this session, so it clears the worth-doing bar decisively at near-zero cost.
bet_traced_to: "Academic tools + offline-first win students from Discord (status='live')"
milestone_traced_to: "5a6efc9e-9de7-4594-a75d-d45e30d9a417 — M1 Foundation: app shell, auth & profiles (in_progress)"
proposed_scope_change: |
  None. One pre-merge CI job that boots the compiled `dist` artifact and probes
  /health. No elaborate harness.
sibling_visible: false

# Reasoning (concise)

## Strategic value — worth a wave NOW: YES
- This is not a fix-cost > fix-value bug. It is the inverse: a ~1-job CI change that
  closes a 4x-recurring prod-outage class (wave-2 init-order, wave-3 shared-pkg,
  wave-5 version.ts MODULE_NOT_FOUND — one of those this session). The existing e2e
  job only hits the already-deployed URL, so first-boot crashes are caught AFTER
  deploy — the most expensive place to catch them.
- Leverage is high and durable: the guard protects EVERY future deploy, and M2
  (servers/channels) → M3 (messaging) add more compiled surfaces + more boot-time
  wiring (module init order, DI graph), exactly the failure shape this catches.
  Buying the guard before M2 is correctly timed, not premature.
- Direction fit: founder's logged ruling is "harden-then-core" — do the highest-value
  hardening, then move to M2. This is explicitly the last engineering hardening item
  before the 2 founder-ops loose ends + M2. Traces cleanly to the live bet via M1
  foundation reliability (a platform that crashes on deploy cannot win students off
  Discord).
- Deferring to M2 is the wrong call: it would carry a known, repeatedly-realized
  outage class into a larger, more boot-fragile build — paying the outage tax again
  during the harder work.

## Ambition — right-sized: YES
- One CI job, node dist + /health probe. That is the minimum slice that closes the
  class. Not timid (it covers the actual gap: compiled-artifact first-boot, which
  src-level lint/typecheck/test/build provably miss).
- Not grandiose: no multi-node matrix, no full prod-parity harness, no broad smoke
  suite — all of which would be gold-plating at one-user self-use-mvp. HOLD the line
  here; B-block should resist any harness creep.

## Not reframing
Problem framing (is "boot the compiled artifact" the right root-cause fix vs, e.g.,
a bundler/packaging change) is problem-framer's call, not mine.

verdict: PROCEED at the proposed scope.
