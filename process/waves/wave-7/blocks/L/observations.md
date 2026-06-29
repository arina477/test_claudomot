# Wave 7 — L-2 Distill Observations

Synthesized from wave-7 artifacts (M2 servers/channels first bundle; create-server + owner membership + default General category + #general channel; server rail + channel sidebar + create modal; PR#17 LIVE, V-APPROVED, 133 tests). Wave included a worker-restart recovery that rebuilt P/D/B work from the DB-canonical spec.
Prior archives consulted: process/waves/_archive/wave-{1,3,4,5}/blocks/L/observations.md.
Note: wave-2 and wave-6 archives are absent/lost; recurrence claims for those waves cannot be confirmed.

```yaml
observations:

  - id: obs-1
    summary: >
      A worker restart reset the local git working tree to the pre-wave baseline
      (fbca667), erasing all local-only commits: the wave-7 backend (B-0/B-1/B-2 —
      server schema, shared types, all four service methods, migration
      0002_certain_miek.sql) and D-block designs (design/server-rail-sidebar.html,
      design/create-server.html revert to old 3-step wizard) were lost because they
      had never been pushed to origin. The DB-canonical state (waves, milestones,
      tasks with full specs) survived intact and allowed full reconstruction without
      re-planning, but every FS artifact required a complete rebuild. The RECOVERY.md
      codified a new push cadence: push to origin immediately after each major build
      stage (not only at C-1 merge), to protect against restart-loss.
    source:
      - process/waves/wave-7/RECOVERY.md
        # "Lost (local-only, never pushed): wave-7 P-block + D-block + backend commits."
        # "Recovery: ... Rebuild backend (B-0/B-1/B-2) from DB spec → PUSH branch immediately.
        #  Re-do D-block design ... Build B-3 frontend. PUSH after each major stage to survive restarts."
      - process/waves/wave-7/blocks/B/review-artifacts.md
        # header: "[REBUILD post-restart]" — confirms full backend rebuild was required
      - process/waves/wave-7/blocks/D/review-artifacts.md
        # header: "[REBUILD post-restart]" — D-block recovery event confirmed in gate artifacts
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First occurrence across all available archives (wave-1, wave-3, wave-4, wave-5).
      No prior observation records a lost-local-commit event triggered by a worker restart.
      Wave-2 and wave-6 archives are absent; cannot confirm or deny occurrence there.
      Single wave — hold; promote if the same FS-loss-from-unpushed-work mechanism recurs
      in a subsequent wave, or if the RECOVERY.md instruction is violated at B-block in a
      future wave without the corrective push.
    generalizable: true
      # note: applies to any project where build stages involve local FS state not yet
      # replicated to origin; not specific to this platform or stack.
    falsifiable: true
      # note: checkable per stage — does `git status --porcelain` and `git log --branches
      # --not --remotes` show committed-but-unpushed work at any B or D stage exit?
    disposition_hint: rule-candidate

  - id: obs-2
    summary: >
      The project's EmailVerification=REQUIRED global gate (applied to every
      SuperTokens-protected route) blocks access for any session whose email has not
      been verified, including test accounts used during C-block and T-block live
      verification. Because no persistent pre-verified prod test account exists,
      verifying the authed create-server path at C-2 / T-8 required verifying an
      email ad hoc via the SuperTokens core admin API (and temporarily exposing a
      public domain on the core). This manual step is undocumented in any standing
      test-account record, is not reproducible without admin API access, and will
      recur on every future authed feature wave (every M2+ wave that adds or modifies
      session-gated routes) as long as no verified fixture is provisioned.
    source:
      - process/waves/wave-7/stages/T-8-security.md
        # finding: "no persistent VERIFIED prod test fixture; C-2 verified email via
        #  SuperTokens core admin API → flag for L (record a verified fixture in
        #  command-center/testing/test-accounts.md)"
        # live probe: "authed-but-email-unverified → 403 (invalid claim)" — confirms
        # EmailVerification gate actively blocks unverified sessions on new routes
      - process/waves/wave-7/blocks/T/findings-aggregate.md
        # item 4: "(T-8/L, info) no persistent VERIFIED prod test fixture (C-2 used
        #  SuperTokens core admin API)"
      - process/waves/wave-7/blocks/T/gate-verdict.md
        # "(5) the L-flag: no persistent VERIFIED prod test fixture (C-2 verified email
        #  via the SuperTokens core admin API)"
        # "All five are info/significant-severity items for V-2 triage and L capture"
      - process/waves/wave-7/stages/V-2-triage.md
        # "no verified prod test fixture | T-9/C-2 | non-blocking | L follow-up: record
        #  a verified fixture in command-center/testing/test-accounts.md"
      - process/waves/wave-7/stages/V-3-fast-fix.md
        # carry_to_L: [verified-prod-test-fixture, ...]
    severity: warning
    candidate_principles_file: null
    recurrence: >
      First formal L-capture of this specific test-fixture gap. Wave-3 was the auth
      wave (SuperTokens session setup); wave-3's L observations (wave-3 obs-1 through obs-6)
      do not record a test-fixture gap, though wave-3 operated at a stage where all routes
      were unauthenticated (the auth wave added auth to the shell, not new gated API routes).
      Wave-6 archive is absent. The pattern is analytically certain to recur: every future
      wave that ships or modifies a session+verify-gated API endpoint requires a verified
      session for live C/T verification; if no fixture exists, the admin-API workaround
      will be repeated.
    generalizable: true
      # note: applies to any project with a global email-verification gate and no
      # pre-provisioned verified test account for the prod environment.
    falsifiable: true
      # note: checkable — does command-center/testing/test-accounts.md contain a record
      # of a verified prod account (email + SuperTokens user_id + verified status)?
    disposition_hint: task-candidate

  - id: obs-3
    summary: >
      The first auth-gated UI feature (create-server flow: rail '+' → modal → POST
      → server selected → #general shown) shipped with no browser E2E path, blocked
      by two independent structural constraints: (1) the Playwright smoke suite covers
      only unauthenticated routes (/ and /login) and has not been extended to authed
      flows, and (2) no pre-provisioned verified test account exists to drive an
      authenticated browser session. Each constraint independently prevents an authed
      browser E2E test; their coincidence means authenticated UI coverage is structurally
      absent as new gated features ship in M2+. The happy path was covered by 54
      component tests (mocked API) and a live C-2 HTTP probe, which is acceptable for
      the first slice but not a substitute for ongoing authed browser E2E coverage.
    source:
      - process/waves/wave-7/blocks/T/gate-verdict.md
        # T-5 finding: "New authenticated create-server flow ... has no browser E2E;
        #  Playwright smoke covers only / and /login. Covered today by component tests
        #  (mocked api) + live C-2 HTTP probe."
        # T-8/L finding: "No persistent VERIFIED prod test fixture (C-2 verified email
        #  via SuperTokens core admin API)."
      - process/waves/wave-7/blocks/T/findings-aggregate.md
        # item 2: "(T-5, significant) new authed create-server flow has NO browser E2E"
      - process/waves/wave-7/stages/V-2-triage.md
        # "no browser E2E for create-server flow | T-9 significant | non-blocking |
        #  tracked (c51589cd e2e + verified-fixture gap) → L"
      - process/waves/wave-7/stages/V-3-fast-fix.md
        # carry_to_L: [..., browser-E2E-for-create-server]
      - process/waves/_archive/wave-1/blocks/L/observations.md
        # obs-1 (severity: strong): "The Playwright MCP requires the Google 'chrome'
        #  channel binary, which is absent in the sandbox environment, blocking live-browser
        #  E2E (T-5) and live visual-diff (T-6) simultaneously."
        # T-5 candidate for wave-1: "prerequisite, not a nice-to-have, for the next
        #  UI/realtime/auth wave"
    severity: strong
    candidate_principles_file: null
    recurrence: >
      wave-1 obs-1 (strong): chrome channel absent → all browser E2E blocked; T-5 candidate
      noted as "prerequisite for the next UI/realtime/auth wave." By wave-7 CI E2E
      is green (T-5 done: "CI playwright e2e green (PR#17)") meaning the chrome channel
      constraint was resolved between waves; however, the Playwright suite remained limited
      to unauthenticated routes and was never extended to cover authed flows. The mechanism
      has shifted from "chrome binary missing" to "authed E2E coverage gap compound with
      missing verified fixture" but the structural outcome is identical: each new authed
      UI feature ships without browser E2E. The wave-1 obs-1 recurrence condition ("next
      UI/realtime/auth wave") has now fired across wave-7 without resolution.
      Note: wave-2 and wave-6 archives absent — cannot confirm or deny intermediate state.
    generalizable: true
      # note: any project where the Playwright suite grows but is never extended beyond
      # its initial unauthenticated-routes scope, despite new auth-gated flows shipping.
    falsifiable: true
      # note: checkable — does the Playwright suite contain at least one test that
      # signs in with a verified session and exercises a session-gated UI flow?
    disposition_hint: task-candidate

  - id: obs-4
    summary: >
      The create-server service wraps four sequential inserts (server → owner
      server_members → 'General' category → #general channel) in a single db.transaction
      call, making the happy-path atomicity verifiable from source. However, the unit
      test suite mocks db.transaction using a stub that always invokes its callback,
      meaning the rollback path (mid-transaction insert failure → full rollback, no
      orphan server row) is tested only against a mock that structurally cannot fail.
      The negative atomicity guarantee — the feature's primary safety property — is
      empirically unverifiable without a real-Postgres or in-process Postgres harness
      that can force a mid-transaction insert failure. The live C-2 happy-path probe
      does not exercise this path.
    source:
      - process/waves/wave-7/blocks/T/findings-aggregate.md
        # item 1: "(T-4, significant) txn rollback-on-failure asserted via mocked
        #  db.transaction — needs a real-Postgres mid-txn-fail test."
      - process/waves/wave-7/blocks/T/gate-verdict.md
        # T-4 finding: "Transaction atomicity asserted only via mocked db.transaction
        #  (always invokes callback); rollback-on-partial-failure path unproven.
        #  Needs a real-Postgres integration test that forces a mid-transaction failure
        #  and asserts no orphaned server row."
      - process/waves/wave-7/stages/V-2-triage.md
        # "txn rollback proven only via mock | T-9/Karen significant | non-blocking |
        #  needs real-PG mid-txn-fail test → L follow-up / M2 backlog"
      - process/waves/wave-7/stages/V-1-karen.md
        # deferrals: "rollback-test-mocked (T-4, significant): atomicity asserted only
        #  via mocked db.transaction that always invokes the callback — negative rollback
        #  path unproven without real Postgres."
      - process/waves/_archive/wave-4/blocks/L/observations.md
        # obs-1 (severity: strong): "A service-layer catch block that reads a specific
        #  Postgres error code (23505 unique violation) from err.code at the top level
        #  silently fails to match when the ORM (Drizzle) wraps the driver error ...
        #  The unit test asserted against a hand-constructed {code:'23505'} synthetic
        #  object, which matched the (wrong) check, so CI went green."
    severity: informational
    candidate_principles_file: null
    recurrence: >
      wave-4 obs-1 (strong, same family): synthetic DB mock ({code:'23505'} hand-built
      error object) did not match the real Drizzle driver error shape; the mismatch escaped
      CI and caused a live 500 instead of 409. Wave-4's mechanism was error-shape mismatch;
      wave-7's is always-invokes-callback mock never exercising rollback. Both are instances
      of the same class: a synthetic DB interaction mock does not expose the failure mode
      it purports to test. Class-level recurrence is confirmed (two waves); specific mechanism
      is distinct per wave. Wave-4 obs-1 was held pending a real integration test existing;
      wave-7 adds another distinct mechanism in the same family.
    generalizable: true
      # note: applies to any ORM transaction test where the test double always succeeds,
      # making the rollback assertion vacuous regardless of which ORM or DB is used.
    falsifiable: true
      # note: checkable — does the create-server test suite contain a case that forces
      # a real (non-stub) db.transaction to abort mid-sequence and asserts zero server rows?
    disposition_hint: task-candidate

  - id: obs-5
    summary: >
      When a worker restart erased the wave's full local filesystem state (P-block
      process files, D-block design HTML, B-0/B-1/B-2 source and committed-but-unpushed
      migration), the Postgres task table retained the complete spec contracts for all
      four in-progress tasks (tasks.description for the seed task contained 5120 chars
      of typed, structured AC). No re-planning was required: the rebuild proceeded
      directly from the DB spec without any information loss. The recovery re-derived
      designs from the spec-contract + existing design language and rebuilt the backend
      from the spec's API surface and data-model section. The DB-canonical spec storage
      discipline (always-on rule 7) functioned exactly as intended under an adversarial
      condition.
    source:
      - process/waves/wave-7/RECOVERY.md
        # "DB CANONICAL survived: M1 done, M2 in_progress, wave-7 running, 4 tasks
        #  in_progress w/ full specs in tasks.description (a47ed9bc = 5120 chars)."
        # "P-block specs intact in DB (no re-plan). Rebuild backend (B-0/B-1/B-2)
        #  from DB spec → PUSH branch immediately."
      - process/waves/wave-7/blocks/D/gate-verdict.md
        # "both were re-derived from the spec (POST /servers {name}; GET /servers;
        #  GET /servers/:id) and the existing visual language in design/direction.html
        #  + design/app-home.html" — confirms spec in DB was the complete rebuild basis
    severity: informational
    candidate_principles_file: null
    recurrence: >
      First occurrence of FS loss from a worker restart in available archives (wave-1,
      wave-3, wave-4, wave-5). No prior observation records a recovery from this event.
      Validates existing always-on rule 7 ("Embed specs in the task's tasks.description
      field") under an adversarial condition that was not previously tested. No new
      principle is needed — the existing rule held.
    generalizable: true
      # note: the durability property of DB-canonical spec storage is general; the
      # resilience demonstrated here is not wave-specific.
    falsifiable: true
      # note: checkable — if a future FS reset occurred, would tasks.description still
      # contain the full spec contract? Yes, by definition of DB-canonical storage.
    disposition_hint: informational
```

---

## L-2 distill disposition (head-learn)

**Verdict: PROMOTE ZERO.** No observation clears the full bar (new + recurring across 2+ waves + costly + binary/enforceable + backed by a real, non-self-violating exemplar). Karen was not spawned — the bar to spawn is a candidate clearing the promotion gate, and none did.

- **obs-1** (push-after-stage → BUILD-PRINCIPLES): HOLD. First occurrence across all available archives; BUILD-PRINCIPLES "Authoring discipline" requires a second confirming wave before promotion. Mechanism is infra/harness-driven (worker restart erasing unpushed commits), not a code-convention failure. Re-evaluate if a second restart-loss recurs.
- **obs-2** (no verified prod test fixture): TASK, not a rule. Queued as task 4a2ad286 (provision + record a persistent verified prod fixture in command-center/testing/test-accounts.md, gitignored), milestone M2.
- **obs-3** (no authed browser E2E): recurs vs wave-1 obs-1, but disposition is tasks, not a rule — a rule is unsatisfiable until a verified fixture exists to drive an authed session. Queued as task 46f16288 (browser E2E for create-server), milestone M2; depends on 4a2ad286.
- **obs-4** (txn rollback proven only via stub): recurs class-level vs wave-4 obs-1, but wave-4 was held with the explicit condition "re-submit when a real integration test exists AND the pattern recurs." Promoting a rule now would canonize a mock exemplar — the exact trap karen rejected in wave-4. Queued as task 25523fb0 (real-Postgres mid-txn-failure rollback test), milestone M2; promote the rule only once a real exemplar exists.
- **obs-5** (DB-canonical spec survived FS loss): informational; validates always-on rule 7 as intended. No rule needed.

Follow-up tasks queued this wave (all milestone M2, flat follow-ups, not bundle seeds): 4a2ad286, 25523fb0, 46f16288.
