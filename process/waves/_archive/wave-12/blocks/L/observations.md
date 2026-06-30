# Wave 12 — L-2 Distill Observations

Synthesized from wave-12 artifacts (M3 real-time messaging, LIVE).
Artifact range: P-0 through V-3, PR #23, merge commit 168c45f.
Prior archives consulted: process/waves/_archive/wave-{1,3,4}/blocks/L/observations.md
(waves 5-11 L-block observations not present in archive; recurrence signals sourced from
explicit cross-wave citations in T-gate and V-gate verdicts).

```yaml
observations:

  - id: obs-1
    summary: >
      Deployment-state SUCCESS from the platform GraphQL endpoint confirmed the NEW revision
      was running, but a stale-revision race remained possible because SUCCESS only reports
      that some image built and reached the expected state — not that the newly built image
      is the one currently handling requests. A route probe (GET /channels/:id/messages
      unauthed, 404 pre-deploy when the route did not exist, 401 post-deploy when it did)
      broke the stale-revision ambiguity by confirming the new revision was actually serving
      traffic. This is a distinct false-green class from CI-PRINCIPLES rule 1 (which guards
      against trusting /health over the deploy-state endpoint): rule 1 addresses the wrong
      verification signal; this observation addresses a correct verification signal that is
      still insufficient to detect stale-revision serving.
    source:
      - process/waves/wave-12/stages/C-2-deploy-and-verify.md lines 26-30
        # "PRE-deploy: GET /channels/:id/messages unauthed → 404 (stale revision, M3 routes absent).
        #  POST-deploy: same probe → 401 (M3 messaging routes LIVE + auth-gated). 404→401 transition
        #  proves the NEW revision (with the merged M3 code) is the one serving traffic."
      - process/waves/wave-12/blocks/T/review-artifacts.md
        # head-tester noted route-probe as guarding the stale-revision race
      - process/waves/wave-12/blocks/V/gate-verdict.md
        # "False-green guarded: deployment-state SUCCESS CONFIRMED against a route probe (404->401)"
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      First documented instance of the stale-revision race variant under the 404->401
      route-probe discipline. CI-PRINCIPLES rule 1 covers the /health false-green; this
      observation is a distinct sub-class (deploy-state SUCCESS is real but serving-revision
      identity is unconfirmed). Not yet confirmed across 2+ waves. Hold in observations;
      promote to CI-PRINCIPLES if a second wave applies the same route-probe-not-just-deploy-state
      guard OR a stale-revision incident occurs.
    promotion_gates:
      generalizable: true   # applies whenever a deploy adds a new route absent in prior revision
      falsifiable: true     # checkable: probe a route known absent in prior revision; confirm 404->expected-status delta
      cited: true           # C-2 lines 26-30 verbatim; T-gate and V-gate verdicts

  - id: obs-2
    summary: >
      A TypeScript `import type` of a constructor-injected NestJS dependency compiled
      without error and passed all CI checks (lint, typecheck, unit tests, build) but crashed
      the Nest DI container at boot: tsc erases type-only imports, so the constructor's
      runtime `design:paramtypes` metadata for the injected token resolves to the `Function`
      placeholder rather than the real class token, and Nest DI cannot resolve it. The boot-probe
      CI job (required check, added in wave-6) was the only job that instantiated the real DI
      container and therefore the only job that caught the defect pre-merge. Without the
      boot-probe, this crash would have appeared first at production deploy.
    source:
      - process/waves/wave-12/stages/C-1-pr-ci-merge.md lines 17-43
        # "boot-probe — FAIL (1m20s)"; root cause: "import type { RbacService } erased by tsc →
        #  runtime design:paramtypes resolves to Function → Nest DI throws"; fix commit 006235b.
      - process/waves/wave-12/stages/B-2-backend.md
        # MessagingGateway implementation with RbacService injection
      - process/waves/wave-12/blocks/T/review-artifacts.md
        # "The boot-probe caught a real type-only-import DI crash (wave-6 investment)."
      - command-center/principles/BUILD-PRINCIPLES.md rule 1
        # "Boot the production-built artifact in a prod-like container and exercise its runtime
        #  config before merge." — this is precisely what caught it.
    severity: informational
    candidate_principles_file: none
    recurrence: >
      BUILD-PRINCIPLES rule 1 (boot the prod artifact before merge) already mandates and
      explains the exact gate that caught this defect. The boot-probe catching a type-only-import
      DI crash is a POSITIVE confirmation that rule 1 works as designed, not a gap requiring a
      new rule. A candidate rule specific to "value-import constructor-injected dependencies"
      would be narrower than rule 1 and redundant with it (rule 1 catches any boot-time DI failure
      regardless of root cause). No new principle added. Noting as informational to confirm
      the wave-6 boot-probe investment continues to pay off.

  - id: obs-3
    summary: >
      head-ci-cd hand-appended 2 rules to CI-PRINCIPLES.md during C-2 (the deploy-and-verify
      stage), bypassing the L-2 Distill promotion gate (L-2 distill plus karen vetting plus
      2-wave recurrence check). The same pattern occurred in wave-9, where rules were similarly
      added outside the gate and subsequently reverted. Both instances involved legitimate
      observations (the deploy-transport mechanism and the route-probe discipline) being
      written directly into the canonical principles file rather than landing first in
      observations.md as required. The gate exists to prevent unvetted or single-wave patterns
      from calcifying into standing rules.
    source:
      - process/waves/wave-12/blocks/T/gate-verdict.md
        # "FLAG → L (CI-PRINCIPLES bypass): head-ci-cd hand-added 2 rules to CI-PRINCIPLES.md
        #  at C-2 (CLI-up-not-GraphQL transport; 404→401 route-probe) bypassing the L-2/karen
        #  promotion gate (same pattern as wave-9)."
      - process/waves/wave-12/stages/V-2-triage.md
        # "CI-PRINCIPLES 2-rule bypass (head-ci-cd at C-2) | process | → L adjudicates;
        #  same as wave-9"
      - process/waves/wave-12/blocks/V/gate-verdict.md
        # "second occurrence (same pattern as wave-9), L should treat it as a recurring
        #  discipline gap, not a one-off"
      - process/waves/wave-12/stages/V-3-fast-fix.md
        # carry_to_L: [CI-PRINCIPLES-bypass-RECURRENCE(wave-9+12)]
    severity: strong
    candidate_principles_file: none
    recurrence: >
      CONFIRMED RECURRENCE: wave-9 (same pattern, rules subsequently reverted per T-gate
      rationale) and wave-12. Two waves. This is a process/meta observation — the gap is
      not in a code principle but in the process discipline of specialist agents writing to
      canonical principles files outside the L-2/karen gate. No new code or CI principle
      is the remedy; the remedy is L-block adjudication (revert the 2 hand-added rules,
      then re-run them through the proper gate if warranted) and carrying the recurrence
      signal forward so L-2 agents in future waves recognize this as a known failure mode.
    adjudication_required: >
      L must verify the current state of CI-PRINCIPLES.md and determine whether the 2 rules
      added by head-ci-cd at C-2 are still present. If present: either revert and re-promote
      via the standard gate, or karen-vet in place (acknowledging the bypass) and record the
      out-of-band promotion explicitly. If already reverted: confirm and record. Either path
      must be documented in this wave's L-2 distill record.

  - id: obs-4
    summary: >
      Socket.IO WebSocket-upgrade authentication implemented via `io.use()` middleware at the
      namespace level — validating the session token from the handshake `auth.accessToken`
      field (with cookie fallback) before the connection is established — is confirmed as the
      correct pattern for Railway-hosted NestJS services. An unauthenticated socket receives
      CONNECT_ERROR at the upgrade step, not at first message. This creates a genuine
      defense-in-depth layer independent of per-message guards: a credential-stripped client
      cannot hold an open socket. The pattern was live-verified (V-1 karen: packet
      `44/messaging,{"message":"Unauthorized"}` independently reproduced) and not merely
      trusted from C-2.
    source:
      - process/waves/wave-12/stages/C-2-deploy-and-verify.md lines 36-37
        # "WS-UNAUTH reject: socket with no token → connect_error: Unauthorized
        #  (WS-upgrade auth live; not a dead-WS false-green)."
      - process/waves/wave-12/stages/V-1-karen.md lines 24-25
        # Live Socket.IO engine handshake confirmed: sid issued, upgrades:["websocket"],
        # unauth namespace connect → 44/messaging,{"message":"Unauthorized"}
      - process/waves/wave-12/stages/T-8-security.md
        # invariant 2: WS-upgrade auth verified live
      - process/waves/wave-12/stages/B-2-backend.md
        # gateway io.use() middleware lines 1037-1091 cited
    severity: informational
    candidate_principles_file: none
    recurrence: >
      First wave implementing Socket.IO real-time for this project. Pattern is confirmed
      working and reference-quality, but is an SDK/architecture reference, not a rule gap.
      The existing architecture/_library.md should capture this as the canonical WS-auth
      pattern for future M3 waves (reactions, threads, presence). No principles promotion
      warranted — this is a positive confirmation, not a corrective.

  - id: obs-5
    summary: >
      Two tech-debt items carried forward from V-block adjudication are queued for resolution
      in a future M3 wave: (1) a null-idempotency-key `.returning()` cleanup in
      messages.service.ts — the best-effort re-fetch path at lines 833-850 is unreachable
      on the production path because the UI always generates a crypto.randomUUID() key, but
      the code path exists and a cleanup would make the intent explicit; (2) no live-socket
      eviction on RBAC revoke (H2 deferral) — the join-time canViewChannelById gate is
      correct and sufficient for M3 scope, but a mid-session revoke does not force-evict
      already-joined sockets, which is a named residual limitation for the next messaging wave.
    source:
      - process/waves/wave-12/blocks/V/gate-verdict.md
        # "L follow-up: null-idempotency-key .returning() cleanup (unreachable on prod path).
        #  H2 residual: no live-socket eviction on mid-session RBAC revoke."
      - process/waves/wave-12/stages/V-3-fast-fix.md
        # carry_to_L: [null-key-.returning()-cleanup, H2-socket-evict-on-revoke]
      - process/waves/wave-12/stages/V-1-karen.md lines 64-65
        # "null-idempotency-key path (833-850) does a best-effort... production path never hits this branch"
      - process/waves/wave-12/blocks/T/gate-verdict.md
        # carry-forward: "H2 (info, non-blocking): no live-socket eviction on RBAC revoke"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      Both items are single-wave tech-debt entries, not recurring patterns. Recording here
      so the next M3 wave (reactions, threads, presence) can claim them. Neither warrants
      a principles promotion.

  - id: obs-6
    summary: >
      The M3 milestone deferred six feature areas out of its initial scope in wave-12:
      reactions, threads, mentions, file/image attachments, presence/typing indicators,
      and member-list-with-presence. These are confirmed non-present in the shipped codebase
      (V-1 karen grep-clean; jenny confirmed no gold-plating) and explicitly held for future
      M3 waves. The checklist correctly records them as deferred at the seed-decomposition
      level. This is a healthy single-bundle increment pattern: the wave's stated acceptance
      criteria (two students exchange messages in real time under 1 second) are met; scope
      was not artificially closed by claiming completion of deferred work.
    source:
      - process/waves/wave-12/checklist.md lines 13-14
        # "DEFERRED to later M3 waves (NOT this wave): reactions, threads, mentions,
        #  file/image attachments, presence/typing, member-list-with-presence."
      - process/waves/wave-12/stages/V-1-karen.md lines 74-75
        # "Gold-plating: NONE. No reactions/threads/mentions/attachments/presence/typing —
        #  all correctly DEFERRED."
      - process/waves/wave-12/blocks/V/gate-verdict.md
        # "jenny correctly assesses M3 as progressing-but-not-yet-closeable... no scope
        #  pulled forward to fake completion (grep-clean)."
    severity: informational
    candidate_principles_file: none
    recurrence: >
      The single-bundle increment pattern with explicit deferred scope is consistent with
      prior waves. No principle is absent; recording to give the next M3 wave a clean
      enumeration of the deferred surface.
```
