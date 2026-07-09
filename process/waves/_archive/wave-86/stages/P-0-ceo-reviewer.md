verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: SCOPE-REDUCTION
mode_rationale: |
  The seed's literal ask (set antiCsrf: VIA_TOKEN) is a grandiose/wrong-shaped
  version of the right outcome. Under wave-84's header transport, VIA_TOKEN is a
  cookie-mode value that changes nothing observable AND misrepresents the actual
  posture — that is the "3/10 hardening theater" trap this mode exists to catch.
  But the underlying goal (a permanent, load-bearing regression-guard on the auth
  CSRF posture) is genuinely 9/10-worth-doing given wave-84's documented pre-GA
  cookie-migration trigger. So I strip the seed to its correct essential slice:
  document + assert the header-transport CSRF-safety posture and set antiCsrf to
  the CORRECT value, not the seed's stale VIA_TOKEN. Not SCOPE-EXPANSION (no
  adjacent capability is worth widening this), not SELECTIVE-EXPANSION (no cheap
  add multiplies value), not HOLD-SCOPE (the seed's literal config value is wrong
  and must change). PROCEED because the reduced slice is unambiguously worth a
  bug-fix-phase wave; DROP would be wrong — the regression-guard has real future
  value.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "unassigned — project-wide auth config; no milestone (roadmap complete, founder bug-fix phase). Traces to the bet via auth-surface trust/privacy posture, consistent with the prior 4 bug-fix waves (81-84), all shipped milestone_id NULL."
proposed_scope_change: |
  KEEP the intent (make the anti-CSRF posture explicit + add a regression test
  that a cookie-only forged state-changing POST is rejected). CHANGE the literal
  config value: do NOT set antiCsrf: VIA_TOKEN (a cookie-transport value that is
  moot/misleading now that wave-84 pinned tokenTransferMethod:'header'). Instead:
    (1) set antiCsrf explicitly to the value that is CORRECT for header transport
        (problem-framer / security-engineer determine the exact value — likely
        NONE, since header/bearer transport is not a CSRF vector: the browser
        does not auto-attach a bearer token cross-site);
    (2) add a short in-code + product-decisions note recording WHY (header
        transport = structurally CSRF-safe) so the explicit setting reads as
        intentional, not accidental;
    (3) keep the regression test — assert a cookie-only forged state-changing
        POST is rejected — as the durable guard;
    (4) cross-reference wave-84's recorded pre-GA cookie-migration trigger: if the
        app ever moves back to cookie transport (revisit httpOnly-via-custom-domain
        before real users), the anti-CSRF posture becomes load-bearing again and
        VIA_TOKEN (or equivalent) must be re-established THEN. The regression test
        authored this wave is what makes that future migration safe.
  This is a reduction (drop the wrong VIA_TOKEN mechanism) not a drop (keep the
  legibility + regression-guard outcome). Whether it is worth a full wave at its
  reduced ~size is a floor question for P-1, not a strategic-value question — the
  value is real.
drop_rationale: |
  (n/a)
escalation_reason: |
  (n/a — this is NOT a security-posture decision requiring BOARD. The live-vuln
  question is already settled: wave-49 penetration-tester verified NO exploitable
  CSRF today, and wave-84's BOARD already ruled header transport is correct. This
  wave neither reopens transport nor introduces a new exposure — it makes an
  existing safe posture explicit + regression-guarded. No strategic conflict
  beyond my authority. The one thing that WOULD warrant escalation — "is the
  correct antiCsrf value NONE vs VIA_TOKEN under header transport?" — is a
  technical-correctness call owned by problem-framer/security-engineer, not a
  strategic one.)
sibling_visible: false
