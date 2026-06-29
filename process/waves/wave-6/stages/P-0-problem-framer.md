verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Symptom-vs-cause check PASSES. The recurring symptom is "CI green, prod crashes at
  first boot" (wave-5: version.ts require(../package.json) MODULE_NOT_FOUND, plus three
  prior waves). The cause is structurally confirmed in .github/workflows/ci.yml: CI runs
  lint/typecheck/test/build on SOURCE only and never executes the compiled dist entrypoint;
  the e2e job (line 80) probes a static already-deployed Railway URL, so the compiled
  artifact is first exercised in prod. The proposed fix — a pre-merge job that boots the
  compiled dist and probes /health — closes the gap at the correct (CI) layer, not at the
  symptom layer (it does not chase individual MODULE_NOT_FOUND bugs). Scope is one CI job:
  no bundling, no config knobs, no premature abstraction, no backwards-compat shims. This is
  genuine M1-foundation hardening (CI safety net for the foundation). No catalog antipattern
  matches.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false

# Flag for P-2 Spec / P-3 Plan (framing-sound, but the spec must resolve "how far to boot")

# The single real design decision this task hides is the boot envelope — how far the compiled
# artifact must start for the probe to be meaningful WITHOUT becoming a flaky full-integration job.
# The recurring crash class (version.ts require, shared-pkg resolution, init-ordering, supertokens.init
# at bootstrap) all fire at MODULE LOAD / app-wiring time, BEFORE any DB/core connection. So:
#
#   1. Minimum viable probe target: "node dist/src/main.js boots far enough to bind a port and
#      return /health 200" catches the entire observed crash class. P-2 should make /health 200
#      (or process-stays-up + port-bound) the acceptance criterion, NOT a full request flow.
#
#   2. External dependency reach — the spec MUST decide one of two boot envelopes and state it:
#      (a) Minimal-env boot: provide dummy/placeholder env (DATABASE_URL, SUPERTOKENS_CONNECTION_URI,
#          etc.) sufficient for module-load + wiring; accept that lazy/deferred connections are fine
#          because the crashes occur before connect. Risk: if main.ts eagerly connects to DB or calls
#          a live supertokens.init at bootstrap (note: wave-3/f856f88 moved supertokens.init to run
#          BEFORE SDK consumption at bootstrap), a dummy URI may itself crash the boot — so the probe
#          must either stub the supertokens core reachability or boot far enough to tolerate it.
#      (b) Throwaway-service boot: stand up a Postgres service (the test job already does this) plus a
#          dummy/stubbed SuperTokens core (or a tolerant SUPERTOKENS_CONNECTION_URI) so /health 200 is
#          reachable cleanly. Heavier, but deterministic and catches connect-time wiring too.
#      P-2 should pick (a) unless main.ts's bootstrap eagerly requires a live SuperTokens core; if it
#      does, (b) or a targeted stub is required. P-3/B-block must verify against the actual
#      apps/api/src/main.ts bootstrap order before locking the env shape.
#
#   3. Artifact form: task offers two equivalent vehicles — "node dist entrypoint" vs "docker run with
#      HEALTHCHECK". Either satisfies the cause-layer fix; P-2 should pick the lighter one that matches
#      how Railway actually boots the service in prod (parity matters — the goal is to reproduce the
#      prod first-boot path). No need to introduce Docker if prod boots via node dist directly.
#
# These are spec-resolution items, not framing defects. The problem is framed right.
