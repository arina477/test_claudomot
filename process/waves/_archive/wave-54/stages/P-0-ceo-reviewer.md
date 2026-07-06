verdict: SCOPE-REDUCTION
verdict_source: ceo-reviewer
mode_applied: SCOPE-REDUCTION
mode_rationale: |
  RE-JUDGE after framing correction. My prior SELECTIVE-EXPANSION rested on a
  now-falsified premise ("2-3 gateways still leak err.message") — problem-framer's
  code-verified REFRAME establishes the info-disclosure class is ALREADY CLOSED at
  every site (study-room fixed via safeErrorMessage; study-timer:189 + messaging:133
  emit hard-coded literal catch strings; presence Zod-validates pre-DB; REST covered by
  the global SupertokensExceptionFilter). Verified-leaking-site count = ZERO. A shared
  WS-error filter (my prior addition) would guard nothing; app-wide isUuid is validation
  theater. That expansion is dead.

  Not HOLD-SCOPE: the seed as written ("apply the guard app-wide to CLOSE the leak")
  ships a security fix for a class with no open defect — the fix-cost > fix-value trap.
  Not SCOPE-EXPANSION: the bet is served by verifying the class is closed, not by
  building a security epic on top of it. Not DROP: sub-part (A) — a negative regression
  test per WS gateway locking the class closed against a future refactor that
  reintroduces err.message forwarding — is genuinely worth doing; it is the cheapest
  durable protection for a real (if now-remediated) privacy defect on a bet whose
  differentiator vs Discord is privacy posture. SCOPE-REDUCTION strips the seed to that
  one high-value, low-risk slice and drops the theater.

bet_traced_to: "Academic tools + offline-first win students from Discord (ad1a3685, live) — privacy posture is the named differentiator; a regression-lock that keeps raw DB schema from ever leaking on malformed input protects it durably. Defense-in-depth guards + string standardization do NOT trace to the bet (no user-perceivable or privacy-posture delta)."
milestone_traced_to: "84e17739-af5e-4396-beb9-b6f3d6836fc4 — M8 Educator tools & deeper academics (in_progress). Sole draining path; M9-M13 remain BOARD-fenced H2/H3 horizon-jumps. This seed is wave-53 P-0's own deferred follow-up — finishing the class wave-53 opened is disciplined continuation, NOT drift. But see worth-it note below: the reduced scope is barely a wave on its own."

proposed_scope_change: |
  TRIM the seed (c52a7a52) to sub-part (A) ONLY — the regression-lock:

  KEEP (the real deliverable): one negative T-8 regression test per WS gateway handler
  (study-timer, messaging, presence) proving a malformed non-UUID client id yields a
  generic, non-leaking response AND is still denied. This LOCKS the info-disclosure
  class closed so a future refactor reintroducing err.message forwarding is caught by CI
  — the only piece with durable value now that the class is already closed.

  DROP from the security framing / DEMOTE to optional:
  - (B) defense-in-depth isUuid guards on study-timer + messaging parsers — this is
    style/perf parity with study-room, NOT a leak fix (the literal-string catch already
    prevents the leak). Include ONLY if it rides the same PR at trivial cost; do NOT
    frame it as closing a leak; seed no follow-up if dropped.
  - (C) canonical generic-error-string standardization — fold in ONLY as a byproduct of
    writing (A)'s assertions (the tests need one expected string); do NOT scope it as
    its own work item.
  Do NOT build the shared WS-transport exception filter (my prior expansion): it is
  net-new architecture guarding a closed class, and @Catch() WsException filters do not
  cleanly intercept errors the handler already catches. Do NOT re-touch REST controllers.

  WORTH-IT / AMBITION NOTE for the P-0 merge (head-product to arbitrate):
  Regression-hardening an already-closed LOW class is defensible but is the WEAKEST drain
  among M8's 8 open candidates, and (A) alone is a thin test-only wave. Two honest options,
  in preference order:
    1. PREFERRED — repurpose the seed: promote 344eabde (DM privacy 'server-members'
       positive-control integration case) as this wave's seed and FOLD (A)'s WS regression
       tests in as siblings. 344eabde is an ACTUALLY-MISSING control — the real-Postgres
       DM-candidates suite exercises who_can_dm 'nobody' + 'everyone' but NOT the third
       enum 'server-members'; that is an unverified privacy-posture path on the exact
       bet differentiator (who can DM whom vs Discord). Draining a genuinely-open privacy
       control + locking the closed leak-class in one security-themed test wave is a
       strictly higher-value use of the same test-writing effort than hardening-only.
    2. ACCEPTABLE — ship (A) as the reduced c52a7a52 seed if head-product wants to honor
       the strict N-2 seed pick; it clears the security tail's last verification debt.
  Either way the app-wide-guard framing must not survive P-1. This is a regression-lock
  (+ optional privacy-control drain), not a leak fix.

drop_rationale: |
  n/a (SCOPE-REDUCTION, not DROP — sub-part (A) survives; the leak-closing framing does not)
escalation_reason: |
  n/a
sibling_visible: false
