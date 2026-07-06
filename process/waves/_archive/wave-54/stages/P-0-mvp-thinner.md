verdict: OK
verdict_source: mvp-thinner
milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
milestone_title: M8 — Educator tools & deeper academics
milestone_class: product-feature
milestone_success_metric: |
  A class cohort runs coursework end-to-end in StudyHall without falling back to
  Discord: the teacher side is live (roles, assignment collect/return, scheduling)
  AND students can hold private 1:1 and small-group conversations outside class
  channels — real-time and offline-tolerant. First slice: direct + group messages.
mvp_critical_status: |
  All M8 mvp-critical ## Scope items are covered by done tasks (roles + light
  moderation, assignment collect/return, class scheduling, DM 1:1 + group + fan-out
  + offline-tolerant, study-group tools incl. shared timer + focus rooms all shipped).
  The success metric is SILENT on security. This seed (c52a7a52) traces to NO metric
  item — it is LOW-severity hardening of an info-disclosure class that is ALREADY
  CLOSED (verified: zero remaining leaking sites). There is no mvp-critical AC to
  protect, so the thinness call is purely intra-seed separability + right-sizing.

# ---- Re-judged under CORRECTED framing (prior OK rested on a false premise) ----
# PRIOR VERDICT PREMISE (now INVALID): "fixing study-timer + messaging closes two
# more leak sites in the same class." VERIFIED FALSE. study-timer.gateway.ts:189 and
# messaging.gateway.ts:133 emit hard-coded LITERAL catch strings and never forward
# err.message; presence uses Zod .uuid() safeParse pre-DB; REST is covered by the
# global SupertokensExceptionFilter (22P02 -> generic 400). The one site that DID
# forward err.message (study-room) was fixed in wave-53. The info-disclosure class
# is CLOSED app-wide; residual gap-count is ZERO. The seed's "apply the guard to
# close leaks app-wide" premise does not hold. The reframed wave is VERIFY-AND-HARDEN,
# not a leak fix:
#   (A) per-WS-gateway negative regression test (malformed id -> generic + denied) — regression-lock.
#   (B) defense-in-depth isUuid on study-timer + messaging parsers — consistency/perf only.
#   (C) one canonical generic error string (folds wave-53 V-2 spec-gap).

ok_rationale: |
  Verdict OK on right-sizing grounds, floor-blocked. Under the corrected facts this is
  a ~100-200 LOC (mostly tests) verify-and-harden slice of an already-closed class —
  the same sub-floor situation that tripped wave-53 and shipped by override. Applying
  the trace test to each AC:
  - (A) regression-lock IS the core independently-valuable piece. It is the wave's real
    deliverable: proof-by-test that the class stays closed against future regression,
    one negative case per WS handler (study-timer / messaging / presence). Keep.
  - (C) canonical-error-string is a wave-53 V-2 spec-gap fold-in (~1 constant + call-site
    edits). It has no standalone value as a sibling and is deliberately folded INTO this
    slice; carrying it costs a handful of LOC and discharges an open spec-gap. Keep.
  - (B) defense-in-depth isUuid is the ONLY genuinely peelable candidate: since the
    literal-string catch already prevents any leak, the guard is pure consistency/perf
    (skip a wasted DB round-trip + match study-room's parser style), NOT a security fix.
    It IS separable in principle — but peeling it yields a ~20-40 LOC micro-sibling with
    no mvp-critical AC to protect and no independent product value, while pushing an
    already-sub-floor residual wave even deeper below the floor. That is the floor's own
    anti-goal (identical to the wave-53 call). Recommendation to head-product: KEEP (B)
    in-wave, but explicitly de-scope it from "security" framing per problem-framer — it
    must ship (if it ships) as style/perf, droppable at B-block if it adds any cost.
    Do NOT split it into a sibling. If a reviewer judges (B) not worth the LOC at all,
    the correct move is DROP it in-wave, not defer it to a sub-floor sibling.
  Net: the seed's three ACs are already the minimum coherent slice. The one peelable AC
  fails the separability-into-a-worthwhile-sibling test AND is floor-blocked. No THIN.
floor_constraint_active: true
floor_constraint_detail: |
  current_wave_loc: ~100-200 net LOC under the corrected framing (mostly negative
    regression tests; (B) is a couple of parser guards, (C) is one constant + call-site
    swaps). Same class as wave-53, which tripped the single-spec sub-floor and shipped
    by override-rule.
  would-have-split LOC sum: ~20-40 LOC — the (B) defense-in-depth isUuid guards on
    study-timer + messaging parsers, the sole separable AC.
  residual after split: ~80-160 LOC — deeper below the applicable floor than the wave
    already is, and the split-out sibling is itself a sub-floor micro-task with no
    mvp-critical AC and no product value (it guards a leak that cannot occur).
  floor threshold: single-spec > 1,500 LOC (per P-1 § Minimum size floor).
  Peeling (B) pushes BOTH the residual wave and the sibling deeper sub-floor with
  nothing mvp-critical to protect -> refuse to split. This is a floor-genuinely-blocks
  case only in the trivial sense: there is no right-sized THIN available at this scale.

  Not OVER-CUT: (A)+(C) still constitute a coherent, independently-valuable slice
  (the regression-lock proves + freezes the closed class, (C) discharges a real open
  spec-gap), so the reframed scope is not below the minimum coherent slice — it IS the
  minimum coherent slice. No ACs need adding back.

  Note for head-product / P-1: this seed has ALREADY been thinned once (it is itself the
  wave-53 P-0 mvp-thinner THIN split, parent fb1c367a). Re-thinning the now-bounded,
  already-once-thinned remainder is the anti-goal. The disposition question that remains
  is NOT thinness but WORTH-IT / right-sizing under the collapsed-to-zero gap-count —
  ceo-reviewer's and problem-framer's lane (whether A+C justify a standalone wave vs.
  folding the T-8 regression tests into the next security-touching wave). Flagged here
  only for the P-0 merge; it is not an mvp-thinner AC-split call.

sibling_visible: false
