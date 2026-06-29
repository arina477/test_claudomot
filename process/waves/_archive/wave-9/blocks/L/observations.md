# Wave 9 — L-block observations (candidate principle promotions)

> Append-only. L-2 distill + karen vet these; promotion to a `*-PRINCIPLES.md` file requires the observation to recur across 2+ waves AND the relevant head to approve. "Broke once" stays here until a second wave confirms.

## D-block (Design)

### Candidate: destructive/disabled-state colored text must meet WCAG AA on its own surface

- **Origin:** D-3 invite-share. The revoked-row label used `text-danger` (#ef4444) on surface-800 (#1c1c1f) ≈ 3.5:1, below WCAG AA 4.5:1 for body text. Caught by the D-3 accessibility reviewer; fixed by moving the label to `t-primary` (white) while keeping the danger icon + strikethrough + dimming as the color-independent revoked signal.
- **Why it matters:** Semantic colors (danger/warning) read as low-contrast text on dark surfaces; the danger MEANING should be carried by icon + state styling, with the text itself on a high-contrast token. This is a recurring dark-theme trap (a designer eyeballs red-on-near-black as "fine").
- **Candidate rule (for L-2/karen if it recurs):** "Semantic-color text (danger/warning) on dark surfaces must use a high-contrast text token; carry the state meaning with an icon plus styling, not colored text alone."
  Why: "Red/amber on near-black often falls below WCAG AA 4.5:1 and becomes unreadable for some students."
- **Status:** single-wave occurrence — do NOT promote yet. Confirm on a second wave before L-2 considers it for `command-center/principles/DESIGN-PRINCIPLES.md`.

### Note: rejected variant / decision lineage (this wave, for the record)

- **Rejected approach:** revoking via a one-click trash with no confirm — rejected for accidental-revoke risk; adopted a two-step inline `role="alert"` confirm instead.
- **Rejected approach:** silently removing a revoked invite from the list — rejected for dishonesty; adopted an explicit honest "Revoked — this link no longer works" row (icon + strikethrough + dimming).
- **Rejected approach:** keeping the wave-8 single-link default without naming it — rejected because 8b requires the default to be unambiguously the PERMANENT link; adopted a labeled "Server invite link" + "Permanent" pill with limited-invite generation demoted to a secondary action.

---

## L-2 synthesis — wave-9 M2 invite-completion

Synthesized from wave-9 artifacts (M2 invite-completion: revoke + permanent-default share + 8a backfill; PR#19, merge 371b9fe; V-APPROVED; 197 tests).
Prior archives consulted: `process/waves/_archive/wave-{4,5,7,8}/blocks/L/observations.md`.

```yaml
observations:

  - id: obs-1
    title: "Deploy-verification: authoritative deployment-state required, /health alone is a false-green"
    summary: >
      Wave-9 C-2 explicitly records: "Authoritative deployment-state GraphQL (NOT /health): api
      NEW revision 191b282b-... status SUCCESS (distinct from baseline; no stale-revision race)."
      The C-2 head-signoff rationale states: "Deploy verified via authoritative Railway
      deployment-state (new revision ids distinct from baselines, both SUCCESS) not /health alone;
      no false-green, no stale-revision race." This pattern — the /health endpoint can serve a
      200 from the PRIOR revision while the new revision is still rolling in, making health-only
      verification a structural false-green — has now been explicitly named and defended against
      in multiple consecutive waves. Wave-8 C-block observations state: "Verified deploy via the
      authoritative Railway deployments GraphQL status (SUCCESS) AND confirmed the prior
      deployment flipped to REMOVED, then health 200 — three independent signals that the NEW
      revision serves." Wave-5 obs-5 records: "Deploy-state SUCCESS alone would have declared
      a false-green" after a stale-tree deploy where the platform returned SUCCESS for a revision
      that served the wrong code. Wave-4 C-2 records a false-green of a different sub-class
      (correct revision deployed but a live defect not caught by health; the health check declared
      200 while POST /auth returned 500). The common thread across all four waves: health-endpoint
      200 is a necessary but not sufficient signal; only the platform's deployment-state API
      (confirming a NEW distinct revision id at SUCCESS) closes the stale-revision race.
    source:
      - process/waves/wave-9/stages/C-2-deploy-and-verify.md
        # "Authoritative deployment-state GraphQL (NOT /health): api NEW revision 191b282b-...
        #  status SUCCESS (distinct from baseline; no stale-revision race)."
        # head_signoff rationale: "verified via authoritative Railway deployment-state ...
        #  not /health alone; no false-green, no stale-revision race."
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # "Verify Railway deploys via the deployments GraphQL status plus prior-deployment
        #  REMOVED, never health alone. Why: A health 200 can answer from the old process
        #  before the new revision serves." (Candidate rule phrasing, HELD for second wave.)
      - process/waves/_archive/wave-5/blocks/L/observations.md
        # obs-5: "Deploy-state SUCCESS alone would have declared a false-green."
        # source C-2: "Attempt 1 — STALE-TREE deploy: railway deployment a36adbf0 reported
        #  SUCCESS... /health version 0.1.0 (fallback), NO 429 — the merged code was NOT deployed."
        # "Held for a second occurrence before considering a CI-PRINCIPLES candidate."
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      wave-5 obs-5 (informational, HELD): platform returned SUCCESS for a stale-tree deploy;
        /health was irrelevant (serving wrong code but no crash); behavior probes exposed it.
        "Hold for a second occurrence."
      wave-8 C-block observations (candidate rule phrasing, HELD for second wave):
        "Verify Railway deploys via the deployments GraphQL status plus prior-deployment REMOVED,
        never health alone. Why: A health 200 can answer from the old process before the new
        revision serves."
      wave-9 (this): C-2 head-signoff explicitly closes the gap: authoritative GraphQL
        deployment-state checked for NEW distinct revision id at SUCCESS before /health probes run.
        The prior HELD candidate fires its second-wave condition.
      Three waves with direct evidence of the /health-alone false-green risk (wave-5 stale-tree,
      wave-8 reasoning, wave-9 close). Additionally wave-4 C-2 records health 200 while a live
      API path returned 500 (different sub-class: health lies about functional correctness, not
      just revision identity). Pattern is consistent across the full archive.
    generalizable: true
      # applies to any Railway CLI-deploy project (source.repo null, not auto-deploy);
      # the revision-id check generalizes to any platform that exposes a deployment-state API
      # with a revision/deployment identifier (Render, Fly.io, Vercel have equivalent APIs).
    falsifiable: true
      # checkable at every C-2: does the deploy log record a Railway deployments GraphQL
      # query confirming a new deployment id distinct from the pre-deploy baseline, BEFORE
      # declaring the deploy successful? If it records only "GET /health 200" as the success
      # signal, the rule is violated.
    disposition_hint: strong-rule-candidate
    proposed_rule: >
      1. Confirm a new distinct deployment id at SUCCESS via the platform deployment-state API
         before marking deploy complete; never rely on /health alone.
         Why: A health 200 can answer from the prior revision while the new code is not yet serving.

  - id: obs-2
    title: "CI-PRINCIPLES bypass: a C-block agent hand-added 4 rules bypassing the L-2 gate"
    summary: >
      During the wave-9 C-block, the head-ci-cd agent directly appended 4 rules to
      CI-PRINCIPLES.md without going through the L-2 distill gate. V-2 triage surfaced this as a
      process-discipline finding: "CI-PRINCIPLES 4-rule bypass (head-ci-cd at C) → L-block
      adjudicates (revert or karen-vet); rule-12 / ≤1-per-wave violation." The rules were
      subsequently reverted before L-2 ran. The bypass violated two standing constraints: the
      "≤1 rule per wave per file" cap and the L-2 gate requirement (observation must recur across
      2+ waves before promotion). All four candidate rules were substantively about deploy
      verification (correct practices already applied in C-2 this wave), so the content was not
      wrong — the path was wrong. The V-2 triage correctly identified this as a process finding
      rather than a content defect.
    source:
      - process/waves/wave-9/stages/V-2-triage.md
        # "CI-PRINCIPLES 4-rule bypass (head-ci-cd at C) | process |
        #  → L-block adjudicates (revert or karen-vet); rule-12/≤1-per-wave violation"
      - process/waves/wave-9/stages/V-3-fast-fix.md
        # "L-block flag (process discipline, NOT a V fix): CI-PRINCIPLES 4-rule bypass by
        #  head-ci-cd at C (rule-12 + ≤1-promotion-per-wave violation) → routed to L-block."
    severity: warning
    candidate_principles_file: null
    recurrence: >
      First recorded instance of a C-block agent bypassing the L-2 gate to directly edit a
      principles file. No prior wave archive records a parallel. The V-2 triage caught it
      correctly; the revert was applied before L-2 ran; no permanent damage to the principles
      file occurred. The mitigation (V-block surfacing the bypass, L-block adjudication, revert)
      functioned correctly. Noting as a single-wave process-discipline observation; hold for a
      second instance before considering any structural guard (e.g., a gate-verdict check in C-2
      that no principles file was modified outside the L-block).
    generalizable: true
      # any agent that has write access to command-center/ during a non-L block could
      # make the same class of bypass; the gate relies on process discipline, not FS permissions.
    falsifiable: true
      # checkable: does `git diff HEAD~1 -- 'command-center/principles/*.md'` show any change
      # committed outside an L-2 stage? If yes, the gate was bypassed.
    disposition_hint: informational-hold
      # do not promote; no structural rule can be authored from a single instance without
      # a second confirming wave. The existing process (V-block surfacing + L-block adjudication)
      # is the correct guard; it worked this wave.

  - id: obs-3
    title: "No verified prod fixture: third consecutive authed-feature wave without 4a2ad286 resolved"
    summary: >
      Wave-9 V-2 triage records: "authed-revoke/join browser e2e gap | non-blocking |
      same fixture gap 4a2ad286; deny-side live-proven." V-3 deferred: "Authed revoke/join
      browser E2E — deny-side (401/403/404) live-proven; fixture gap 4a2ad286." V-1 karen
      notes: "No authed live e2e exercised revoke end-to-end against prod (no test session).
      Authed-path E2E gap is the tracked deferral. Acceptable for APPROVE given zero prod users."
      Task 4a2ad286 was queued at wave-7 L-2, confirmed as escalation at wave-8 L-2 (obs-3,
      "wave-8: same gap recurs for the authed-join path; task 4a2ad286 still open"), and
      now recurs a third time at wave-9. The pattern is consistent: every wave shipping a new
      session-gated verb (create-server, join, revoke) cannot exercise its authed happy-path
      live because no persistent verified prod fixture exists.
    source:
      - process/waves/wave-9/stages/V-2-triage.md
        # "authed-revoke/join browser e2e gap | non-blocking | same fixture gap 4a2ad286"
      - process/waves/wave-9/stages/V-1-karen.md
        # "No authed live e2e exercised revoke end-to-end against prod (no test session).
        #  Authed-path E2E gap is the tracked deferral. Acceptable for APPROVE given zero prod users."
      - process/waves/_archive/wave-8/blocks/L/observations.md
        # obs-3: "second consecutive authed-feature wave without a persistent prod fixture"
        # source cited: T-8: "authed-join not live-probed (no persistent verified prod fixture)
        #  -> tracked 4a2ad286; covered by 179 tests + CI integration"
        # disposition: task-escalation; "task 4a2ad286 should be prioritized before the
        #  next authed-feature wave; the gap is now two-wave confirmed and the workaround
        #  is increasingly costly"
      - process/waves/_archive/wave-7/blocks/L/observations.md
        # obs-2 (warning): first formal capture; task 4a2ad286 queued.
    severity: warning
    candidate_principles_file: null
    recurrence: >
      wave-7 obs-2: first formal capture; task 4a2ad286 queued.
      wave-8 obs-3: second consecutive wave; task still open; disposition upgraded to
        task-escalation ("prioritize before next authed-feature wave").
      wave-9 (this): third consecutive wave; task still open. The escalation signal from
        wave-8 was not actioned. The cost is now three waves of authed E2E coverage missing
        for all session-gated API verbs shipped.
      Disposition remains task-escalation, not a rule. No structural principle can be authored
      here — the fix is executing task 4a2ad286. The observation is escalated one more level:
      if 4a2ad286 is not resolved before wave-10, every wave-10 authed-surface verification
      (RBAC + channel permissions) will be structurally unable to live-verify its authed paths.
    generalizable: true
    falsifiable: true
      # checkable: does command-center/testing/test-accounts.md record a prod account
      # with email-verified status + SuperTokens user_id?
    disposition_hint: task-escalation-critical
      # task 4a2ad286 is now three-wave-blocked; RBAC wave (wave-10) will require authed
      # live verification for every permission boundary; the fixture gap will become
      # blocking, not just non-blocking, at that point.
```

---

## Wave-9 L-2 distill disposition

**obs-1 (deploy-verification / CI-PRINCIPLES) — STRONG CANDIDATE.**

The deploy-verification pattern clears the L-2 promotion bar:

- Recurs across 2+ waves with direct cited evidence: wave-5 obs-5 (HELD pending second wave), wave-8 C-block observations (candidate rule HELD pending second wave), wave-9 C-2 (fires the second-wave condition).
- Generalizable: applies to any Railway CLI-deploy project; the revision-id check generalizes to any platform exposing a deployment-state API.
- Falsifiable: checkable at every C-2 by examining whether a distinct new deployment id was confirmed before declaring success.
- No near-dup in CI-PRINCIPLES (Rules section currently empty — "no rules yet").
- Candidate rule satisfies format constraints: rule line within 120 chars, why line within 100 chars, no forbidden tokens, exactly 2 non-empty lines.

Proposed rule:
```
1. Confirm a new distinct deployment id at SUCCESS via the platform deployment-state API
   before marking deploy complete; never rely on /health alone.
   Why: A health 200 can answer from the prior revision while the new code is not yet serving.
```

Refer to karen + head-ci-cd for promotion to `command-center/principles/CI-PRINCIPLES.md`. Per-file cap: no other CI-PRINCIPLES rule is being promoted this wave; cap is clear.

**obs-2 (CI-PRINCIPLES bypass) — informational-hold; no promotion.**
Single-wave process-discipline event. V-block caught it; revert applied; no permanent damage. Hold for a second instance.

**obs-3 (no verified prod fixture) — task-escalation-critical; no promotion.**
Three-wave streak. Task 4a2ad286 now critically overdue. Escalate to next-wave planning (N-block): 4a2ad286 must be resolved before wave-10 RBAC, or wave-10 authed verification will be structurally blocked.

**D-block candidate (semantic-color contrast) — single wave; hold.** Per the existing status in this file: do not promote until a second confirming wave.
