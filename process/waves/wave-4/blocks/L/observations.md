# Wave 4 — L-2 Distill Observations

Synthesized from wave-4 artifacts (profile customization: username + accent + avatar path; M1/M2 profile shipped live; avatar real-upload deferred behind founder bucket creds).
Artifact range: P-0 through V-3, PRs #10 + #11, merge commits f28cda0 / 8537f0c.
Prior archives consulted: process/waves/_archive/wave-1/blocks/L/observations.md, process/waves/_archive/wave-3/blocks/L/observations.md.

```yaml
observations:

  - id: obs-1
    summary: >
      A service-layer catch block that reads a specific Postgres error code (23505
      unique violation) from `err.code` at the top level silently fails to match when
      the ORM (Drizzle) wraps the driver error: the real rejection places the PG code
      at `err.cause.code` or `err.cause.cause.code`, not at the top-level `err.code`.
      The unit test asserted against a hand-constructed `{code:'23505'}` synthetic
      object, which matched the (wrong) check, so CI went green. Live, the real
      Drizzle-wrapped error never matched, the ConflictException mapping never fired,
      and the duplicate-username path returned 500 instead of 409. A second PR and
      re-deploy were required to ship the correct error mapping.
    source:
      - process/waves/wave-4/stages/C-2-deploy-and-verify.md
        # "DEFECT — duplicate username returns 500 instead of 409"; root cause section:
        # "unit/integration tests mock or assert the catch with a synthetic {code:'23505'}
        # object rather than a real drizzle rejection, so the wrapper mismatch escaped CI"
      - process/waves/wave-4/stages/B-5-verify.md
        # 63/63 green CI — defect was not caught before deploy
      - process/waves/wave-4/stages/V-1-karen.md
        # Claim 4: PR #11 fix walks err.cause?.code AND err.cause.cause.code; confirmed
        # working in prod as 409
      - process/waves/wave-4/stages/T-2-unit.md
        # post-fix note: "username-409 test mirroring the REAL drizzle-wrapped error shape
        # (regression guard)" — this is the corrected state after PR #11
    severity: strong
    candidate_grade: true
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
    justification: >
      The failure lives in integration/unit test fidelity: the test drove a synthetic
      error object instead of triggering a real duplicate insert through Drizzle against
      a real DB, so the ORM's wrapping behavior was never exercised by CI. T-4 is the
      correct home because the fix is structural at the integration layer (drive a real
      duplicate insert so the actual Drizzle error shape is observed). T-3 covers API
      schema contracts (shape of the response, not the ORM error path). BUILD-PRINCIPLES
      rule 1 covers prod-artifact boot / runtime-config defects; this is a distinct
      mechanism — a test-layer fidelity failure where the mock doesn't match the real
      driver's error object shape. The rule would be: for any catch block that
      reads a driver/ORM error code, at least one integration test must drive the
      real DB operation (not a synthetic error throw) to verify the mapping.
    recurrence: >
      The broader CI-green-but-broke-live class has appeared in every prior wave:
        wave-1 obs-2 (tsconfig outDir emits to dist/src/main.js, passes CI, breaks prod boot)
        wave-3 obs-1 (VITE_API_ORIGIN not declared as Docker ARG, passes CI, breaks prod browser flow)
      The wave-3 BUILD-PRINCIPLES rule 1 was promoted to address the boot/config sub-class.
      This wave-4 instance is the first occurrence of the distinct driver-error-wrapping
      sub-class: the mechanism is not a deploy-config omission but a test mock that does not
      faithfully represent the real ORM error shape. The class (CI green, live broken) recurs;
      the specific mechanism (synthetic error object bypasses ORM wrapper) is novel to wave-4.
      Mark as candidate for T-4; hold until a second ORM-error-wrapping instance confirms
      the pattern OR the principle author judges the generalizing argument sufficient.
    promotion_gates:
      generalizable: true   # any ORM (Drizzle, Prisma, TypeORM) wraps driver errors differently
      falsifiable: true     # checkable: does the T-4 suite insert a real duplicate row, or throw({code:'23505'})?
      cited: true           # C-2 root cause section verbatim; T-2 post-fix regression note

  - id: obs-2
    summary: >
      Account-gated external service credentials (requiring founder action in a third-party
      console — not self-provisioned by the build system) have blocked or deferred a live
      feature in two consecutive waves: email deliverability (Resend domain verification,
      wave-3) and object storage (Railway Bucket AWS_* creds, wave-4). In both cases the
      application code was complete and deployed, but the feature was non-functional or
      stranded behind a 503 because the credential was not provisioned before the wave began.
    source:
      - process/waves/wave-4/stages/C-2-deploy-and-verify.md
        # "Avatar real-upload verification PENDING founder Railway Bucket creds
        # (AWS_*/STORAGE_BUCKET_NAME) — not a defect; 503-graceful is correct."
        # Update note: "Tracked follow-up (like Resend domain a1299e88)."
      - process/waves/wave-4/stages/V-1-karen.md
        # Claim 3: real upload deferred, task 84e09891 "bucket creds = founder-supplied"
      - process/waves/wave-4/stages/V-1-jenny.md
        # Deferral 84e09891: "Set Railway Bucket creds + verify avatar upload live
        # (avatar real-upload round-trip; AC5/AC6 completion). Founder-pending credential."
      - process/waves/_archive/wave-3/blocks/L/observations.md
        # (implicit, via C-2 cross-reference to Resend domain a1299e88 as the prior case)
    severity: warning
    candidate_grade: true
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    justification: >
      The principle candidate would be: name all account-gated external credentials
      explicitly at P-block planning time so they can be provisioned before the B-block
      begins, rather than discovering the gap at C-2. This is a planning/readiness
      question (PRODUCT-PRINCIPLES), not a build execution question (BUILD-PRINCIPLES).
      Honest assessment of strength: wave-4's bucket-cred gap was a PLANNED deferral,
      not a surprise — the P-3 plan called out avatar storage as founder-pending from the
      start, and the 503 degradation path was intentionally built. Wave-3's Resend domain
      verification was closer to an unplanned post-deploy gap. The recurrence is partial:
      one instance was scoped intent, one was mild planning miss. The pattern is real
      (both required a founder-action follow-up task after deploy) but the wave-4 instance
      is the weaker half. Marking warning rather than strong; hold for a third instance
      or a case where the gap is fully unplanned before promoting.
    recurrence: >
      wave-3: Resend domain verification (a1299e88) — email features non-functional at deploy
      until founder completes DNS verification in Resend console. Noted in C-2 update as
      the prior precedent: "Tracked follow-up (like Resend domain a1299e88)."
      wave-4: Railway Bucket creds (84e09891) — avatar upload 503 at deploy until founder
      supplies AWS_*/STORAGE_BUCKET_NAME. Planned deferral rather than surprise gap.
      Two consecutive waves, both involving founder-account-gated third-party credentials.
      Pattern is real but severity of the miss varies; hold for a stronger third instance.

  - id: obs-3
    summary: >
      A B-6 gate review caught a medium security hardening gap (avatar-confirm endpoint
      validating only `key.startsWith('avatars/')` instead of `key.startsWith('avatars/{callerId}/')`)
      that had been missed during B-block implementation and unit testing. The gap was
      correctly classified as non-critical (no confidentiality or integrity escalation
      for public-by-design avatar objects) and fixed in-wave in the B-6 Phase 2 carry-forward,
      before reaching the C-block or live deploy. No live exposure occurred.
    source:
      - process/waves/wave-4/blocks/B/gate-verdict.md
        # Phase 2 carry-forward: "change the confirm guard to key.startsWith(`avatars/${userId}/`)"
        # "NOT the firing-grade client-controlled-key / IDOR defect" but "cheap defense-in-depth"
      - process/waves/wave-4/stages/V-1-karen.md
        # Claim 4: f7b205a "confirm validates key.startsWith(`avatars/${userId}/`) (session-derived
        # userId), not the loose avatars/ prefix — prevents confirming another user's key.
        # Confirmed in code AND live (400 above)."
      - process/waves/wave-4/stages/B-6-review.md
        # phase2_fixup: f7b205a (avatar-confirm caller-scope)
    severity: informational
    candidate_grade: false
    candidate_principles_file: none
    justification: >
      The B-6 gate worked as intended: caught a non-critical gap, correctly triage-classified
      it (not IDOR-grade), and fixed it in-wave without a live exposure. This is a positive
      outcome confirming the gate is valuable, not a systemic gap. Promoting a rule here
      would be redundant with the existing gate-process design. Noting as informational
      to reinforce that B-6 Phase 2 carry-forward is effective for sub-critical hardening
      that passes unit tests but misses user-scoping tightness.
    recurrence: first observation of this specific B-6 catch; no prior wave has a parallel.

  - id: obs-4
    summary: >
      The wave's T-4 integration test layer operated in "active-live" mode (verifying
      behavior against the already-deployed prod instance at C-2) rather than running
      a pre-deploy integration suite against the real DB. As a result, the duplicate-username
      23505 error-mapping defect was detected only at C-2 live verification, not during
      the T-block. Integration test coverage of the DB-error-mapping path existed only
      in the unit layer (T-2) using a synthetic error object.
    source:
      - process/waves/wave-4/stages/T-4-integration.md
        # "active-live (C-2): username set→200 / dup→409 / bad→400..." — T-4 ran against prod
      - process/waves/wave-4/stages/C-2-deploy-and-verify.md
        # DEFECT section: "Why prod-only / passed CI: unit/integration tests mock or assert
        # the catch with a synthetic {code:'23505'} object rather than a real drizzle rejection"
    severity: warning
    candidate_grade: false
    candidate_principles_file: command-center/principles/test-layer-principles/T-4.md
    justification: >
      This is the structural precondition that enabled obs-1: T-4 ran post-deploy rather
      than as a pre-deploy integration gate. Recording separately from obs-1 because the
      cause (T-4 mode) and the effect (synthetic mock mismatch) are distinct structural
      observations. Not candidate-grade on its own because "run T-4 before deploy" is a
      stage-sequencing question (already implicit in the block order P→B→C→T) rather than
      a new rule; and the real remediation is obs-1's principle (use real DB rejections).
      Noting as context for obs-1 promotion.
    recurrence: first observation of T-4 operating in active-live mode for this project.
```

---

## L-2 head-learn distill verdict — wave-4: PROMOTE ZERO

- **obs-1 (T-4 candidate) — REJECTED, parked.** Karen verified the production fix is real (`apps/api/src/users/users.service.ts:23-38,85-92` walks `err.cause.code` / `err.cause.cause.code` → 409; `users_username_lower_idx` on `lower(username)` present at `db/schema/users.ts:17`). BUT the wave's "regression test" (`users.service.spec.ts:10-16,26-45,74-82`) still mocks the DB and hand-builds a synthetic `makeDrizzleUniqueViolation()` error — it does NOT drive a real duplicate insert. The proposed rule's only justifying artifact violates the rule itself; promoting it would canonize a hallucinated exemplar. Also: specific mechanism (synthetic-mock-bypasses-ORM-wrapper) is single-wave; T-4 contract requires 2+ waves. Held in observations. Re-submit when a real integration test (real/PGlite/testcontainer Postgres duplicate insert asserting 409) exists AND the pattern recurs.
- **obs-2 (PRODUCT candidate) — NOT PROMOTED.** Synthesizer self-rated `warning`: wave-4 bucket-cred gap was a PLANNED P-block deferral, not a recurring unplanned miss. Half the "recurrence" is intentional design behavior. Expected friction, not systemic failure. Held for a genuinely-unplanned third instance.
- **obs-3, obs-4 — informational/context.** No promotion.

Net: 4 observations emitted, 2 candidate-grade, 0 promoted. Restraint is the correct outcome — no principles file edited this wave.
