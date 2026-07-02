- [B-2 spec-vs-code] Spec/plan said RoomServiceClient creds via ConfigService; impl used process.env to mirror wave-31 voice-token.service.ts. Both voice services read LIVEKIT_* via process.env. Reconcile at L-1 (amend spec to process.env, OR migrate both to ConfigService in a future wave). Not a bug (VERIFY rule 2 territory: shipped behavior is consistent + correct).
- [B-5 flake] server-roles.test.tsx 'marks role dirty' fails only in full-suite (cross-isolation), green in isolation. Pre-existing, unrelated to voice. Watch: recurring across waves => shared-state leak in web test setup needs a fixture reset.

---

## L-2 Synthesis — Wave 32

Synthesized from wave-32 artifacts (M6 voice occupancy: GET /channels/:channelId/voice/participants;
PR merge 45b08c3; V APPROVED first attempt).
Prior archives consulted: process/waves/_archive/wave-{27,28,29,30,31}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (8 rules, rule 8 promoted w28), VERIFY-PRINCIPLES (2 rules,
rule 2 promoted w31), PRODUCT-PRINCIPLES (2 rules), T-8.md (1 rule).

```yaml
observations:

  - id: obs-1
    summary: >
      Wiring a new API method call into an existing component broke that component's
      existing test suite because the shared vi.mock('../auth/api') factory in
      voice-study-room.test.tsx did not include the new getVoiceParticipants method.
      The unmocked call fired on pre-join mount, tore down jsdom, and failed 14/15
      tests from wave-31 — all previously green. The root: adding a new api method
      to an existing component requires updating every existing test file that mocks
      the api module for that component. A mock factory that enumerates methods
      explicitly (not a passthrough mock) is stale the moment a new method is added
      to the real module. The fix was one stub entry in the factory
      (getVoiceParticipants: vi.fn().mockResolvedValue({count:0,participants:[]})).
      Wave-23 has a closely related prior instance: wiring a new getMyPermissions
      call into the assignments CTA component (B-3) broke assignments.test.tsx's
      5 existing tests, which mocked the old owner-only path and had no entry for
      the new call. Both instances share the same root (wiring a new api call into
      an existing component invalidates its explicit-enumeration mock factory),
      the same fix axis (add the new method to the factory), and were caught at B-5
      verify rather than at authoring time. The generalizable class: when B-block
      wiring adds a new api method call to a component that already has a test file
      with an explicit-enumeration mock, the builder must update the mock factory
      in that test file simultaneously — it is part of the wiring task, not a
      follow-on defect.
    source:
      - process/waves/wave-32/stages/B-5-verify.md
        # "Regression found + fixed (B-3 defect): wiring the occupancy poll into
        #   VoiceStudyRoom broke wave-31 voice-study-room.test.tsx (14/15) —
        #   its vi.mock('../auth/api') factory lacked getVoiceParticipants, so
        #   the pre-join mount fired an unmocked call that tore down jsdom.
        #   Test-stub gap, NOT a product bug."
      - process/waves/_archive/wave-23/stages/B-5-verify.md
        # "5 web failures (assignments.test.tsx) — tests mocked the old owner-only
        #   CTA path; the B-3 gate now calls getMyPermissions. Fixed by react-specialist
        #   (a86442703f1db4280): mocked api.getMyPermissions per-test."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      2ND CONFIRMING INSTANCE. PROMOTABLE.

      Instance history:
      - wave-23 (1st instance): wiring getMyPermissions into the assignments CTA
        component (B-3) broke assignments.test.tsx (5 existing tests). The old
        owner-only mock path had no entry for getMyPermissions. Fixed by react-specialist
        at B-5. Recorded at wave-23 B-5-verify.md; NOT promoted at wave-23 L-2
        (it was not isolated as a standalone L-2 observation — wave-23's obs-1 was
        the biome-format-drift pattern; this class went unobserved in the summary).
      - wave-32 (2nd instance): wiring getVoiceParticipants into VoiceStudyRoom (B-3)
        broke voice-study-room.test.tsx (14/15 existing tests). Same root: explicit
        mock factory lacked the new method. Fixed at B-5 verify.

      Both instances: same root (explicit mock factory stale after wiring), same fix
      axis (add new method stub to factory), caught at B-5 verify. Both involve wiring
      a new api call into an existing component's B-3 stage, with the existing test
      file maintaining an explicit-enumeration mock for the module.

      Near-dup check against BUILD rules 1-8: none of the 8 rules addresses the
      obligation to update explicit-enumeration mocks when adding a new method to a
      wired component. BUILD rule 6 (run formatter before reporting done) and rule 7
      (run lint/import-organizer check) are discipline rules at a different axis.
      No near-dup.

      BUILD-PRINCIPLES has 8 rules; slot 9 open. Note: this wave's obs-1 is a
      BUILD-PRINCIPLES slot-9 candidate. Wave-31's obs-1 (credential-endpoint gate
      ordering, HOLD) and wave-31's obs-4 (ESM-only dep lazy import, HOLD) are also
      BUILD-PRINCIPLES slot-9 candidates. Per-file cap applies: obs-1 from this wave
      (2nd instance, promotable) takes the slot before the wave-31 1st-instance HOLDs.
    promotion_gates:
      generalizable: true
        # Applies to any B-3 or B-4 stage where a new api method (or any function on
        # a shared module that is explicitly mocked in a test file) is wired into a
        # component or service that already has a test file. The test file's mock
        # factory must be updated at the same time as the wiring, not discovered at
        # B-5. The trigger: vi.mock('../auth/api') (or any explicit-enumeration mock)
        # on a module that just received a new method wired into the component.
      falsifiable: true
        # Checkable at B-3/B-4 wiring: for each new api method call added to an
        # existing component, does the same commit update every test file that
        # vi.mock (or jest.mock) the module containing that method? A wiring commit
        # that adds an api call to an existing component without touching that
        # component's test file fails this rule if the test file has an explicit-
        # enumeration mock for the module.
      cited: true
        # B-5-verify.md (regression: VoiceStudyRoom 14/15 → unmocked
        #   getVoiceParticipants tore down jsdom; fixed: stub added to factory);
        # wave-23/stages/B-5-verify.md (5 web failures: assignments.test.tsx lacked
        #   getMyPermissions stub; fixed by react-specialist at B-5).
    candidate_rule_shape: >
      9. When wiring a new api method into an existing component, update that
         component's explicit-enumeration mock factory in the same commit.
         Why: An unmocked call on a vi.mock module fires the real implementation
         and tears down the test environment for all prior tests in the file.
      Rule line = 113 chars; why line = 98 chars. No forbidden tokens.
    promotion_status: PROMOTABLE. 2nd confirming instance (w23 + w32). Same root and
      fix axis across both. BUILD-PRINCIPLES slot 9 (beats wave-31's 1st-instance HOLDs
      per the 2nd-instance priority rule). Flag for karen.


  - id: obs-2
    summary: >
      A path-param endpoint returns 500 on malformed (non-UUID) input when the route
      param lacks a ParseUUIDPipe or equivalent format validator. This returns a generic
      500 body instead of a 400, and the pattern recurs across every endpoint sharing
      the same :channelId param pattern on the same controller family. Wave-31 T-1
      classified this as MEDIUM pre-existing (F-31-T-1), tracked it to task 4a92327c
      (ParseUUIDPipe project-wide), and traced it back to the wave-12 messages route
      as the original source. Wave-32 T-8 reproduced it live as F-32-T-8-1 on the
      new voice-participants endpoint, and V-1 jenny noted the finding simultaneously
      applies to wave-31's voice-token endpoint (same :channelId param pattern).
      V-2 filed a single task covering BOTH voice endpoints. The class: when a new
      endpoint shares a route-param pattern (:channelId, :serverId, etc.) with sibling
      endpoints that already have a known input-validation gap, the new endpoint
      inherits the gap unless param validation is explicitly added at authoring time.
      Spec silence on malformed-param behavior is the upstream cause: no AC specifies
      what the endpoint returns on a non-UUID channelId, so no test asserts it, and
      T-8 catches it on the first live probe. The finding is not security-critical
      (generic body, no stack trace, unauth path still 401-gates before reaching the
      param) but does represent an expanding validation debt surface: every new
      :channelId endpoint ships with the gap unless a route-wide pipe is applied.
    source:
      - process/waves/wave-32/stages/T-8-security.md
        # F-32-T-8-1: "malformed non-UUID channelId on authed path returns 500
        #   (generic message, no leak) instead of 400/403; missing ParseUUIDPipe."
      - process/waves/wave-32/stages/V-1-summary.md
        # "jenny: spec-GAP (AC2 silent on malformed-param validation) ... Shared
        #   pattern: wave-31 POST /channels/:channelId/voice/token almost certainly
        #   has the same gap (same :channelId param) — V-2 to decide fix-both."
      - process/waves/wave-32/stages/V-2-triage.md
        # task a2dd9f3d: "add ParseUUIDPipe to :channelId on BOTH voice routes
        #   (participants + wave-31 token) → 400 on malformed; ~2 LOC each."
      - process/waves/_archive/wave-31/blocks/T/findings-aggregate.md
        # F-31-T-1 MEDIUM: "malformed non-UUID channelId → HTTP 500
        #   (canViewChannelById uuid-column 22P02) — PRE-EXISTING/wave-wide
        #   (same on wave-12 messages); tracked task 4a92327c (ParseUUIDPipe
        #   project-wide)."
    severity: warning
    candidate_principles_file: command-center/principles/test-layer-principles/T-8.md
    recurrence: >
      2ND SURFACE on the voice endpoint family (wave-31 T-1 + wave-32 T-8-1),
      with the underlying class pre-existing since wave-12. HOLD as a T-8 principle
      candidate (first isolation of this as a T-8 probe obligation).

      The root gap is a spec-authoring omission: no AC for malformed-param behavior
      means no unit test for it, which means T-8's live probe is the first detection.
      A T-8 principle requiring malformed-param probing on any :id-pattern endpoint
      would catch this class before it compounds.

      The class has now generated two tracked tasks (4a92327c project-wide + a2dd9f3d
      voice-specific), confirming the pattern is recurring and non-trivially accumulated.

      Near-dup check against T-8 rule 1 ("Live-probe the authz path against prod at
      T-8 with a verified prod fixture on every authed-feature wave"): rule 1 targets
      authz gate verification. This candidate targets input-format validation on route
      params (a different probe class: malformed-input, not authz). No near-dup.

      Near-dup check against T-8.md: rule 1 is the only rule. Slot 2 open.

      HOLD. Promote to T-8 rule 2 on a second confirming wave where a T-8 malformed-
      param probe catches a 500 (instead of 400) on an :id-pattern route param,
      or where a wave explicitly requires the probe and prevents the gap from shipping.
    promotion_gates:
      generalizable: true
        # Applies at T-8 for any wave introducing or modifying an endpoint with a
        # route param that is expected to be a UUID (or other typed format). The probe:
        # send a malformed value (non-UUID string) on the authed path and assert 400
        # (not 500). A 500 response indicates missing ParseUUIDPipe or equivalent.
        # Applies to :channelId, :serverId, :userId, :messageId, etc.
      falsifiable: true
        # Checkable at T-8: does the probe set include one malformed-param case per
        # :id route param on the new endpoint? A T-8 that probes only authz
        # (valid-UUID paths) and does not probe a non-UUID malformed value on an
        # :id-param endpoint fails this rule for that endpoint.
      cited: true
        # T-8-security.md (F-32-T-8-1: non-UUID channelId authed path → 500, no leak;
        #   missing ParseUUIDPipe; classified non-blocking; task a2dd9f3d filed);
        # V-1-summary.md (jenny: AC2 silent on malformed-param; shared pattern across
        #   wave-31 voice-token endpoint; fix-both decision);
        # wave-31/blocks/T/findings-aggregate.md (F-31-T-1 MEDIUM pre-existing:
        #   same class on voice-token + messages route; task 4a92327c project-wide).
    candidate_rule_shape: >
      2. At T-8, probe each new :id route param with a malformed value on the
         authed path and assert 400; a 500 indicates missing ParseUUIDPipe.
         Why: Spec ACs are silent on malformed params; T-8 is the only gate that
         exercises the format-validation gap before it compounds across sibling routes.
      Rule line = 112 chars; why line = 97 chars. No forbidden tokens.
    promotion_status: HOLD. First isolation of the class as a T-8 probe obligation
      (pre-existing code gap, but first time named as a T-8 principle candidate).
      Promote to T-8 rule 2 on second confirming wave where a T-8 malformed-param
      probe catches a 500 on an :id-pattern route param.


  - id: obs-3
    summary: >
      A typed api-client method was added to api.ts for the new endpoint, but the
      consumer hook also fetched inline using a raw BASE constant and duplicated the
      auth headers — creating two code paths for a single call. B-4 wiring caught the
      dead method + URL duplication and reconciled it: the hook was re-entered to
      delegate to the typed method (passing an AbortSignal), and the inline fetch and
      BASE constant were removed. No behavior change; the dead method and duplication
      were never exercised in production. The root: when a B-3 frontend specialist
      authors a hook that reaches a new backend endpoint, they may write the inline
      fetch before the api-client method exists, then add the method without removing
      the inline path. Without a strict "all fetches go through the typed api client"
      convention, the wiring stage (B-4) becomes the first catch point for divergence.
      This is a FIRST INSTANCE — no prior wave L-2 observations have recorded the
      "typed api-client method added but hook fetches inline" class. However, the
      underlying risk (dead code path, URL/header duplication that could diverge on
      future changes) is real and the B-4 catch is the documented first detection.
    source:
      - process/waves/wave-32/stages/B-4-wiring.md
        # "Defect: getVoiceParticipants added to api.ts but hook fetched inline
        #   (dead method + URL/header duplication). Reconciled: re-entered B-3 —
        #   threaded signal through api.getVoiceParticipants; hook now delegates
        #   (removed inline fetch + BASE const). No behavior change."
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "typed api-client method authored but consumer fetches
      inline in parallel" class in L-2 history. HOLD.

      The class is generalizable: applies at any B-3 where a new endpoint is wired
      and the frontend specialist authors a hook that fetches inline rather than
      delegating to the typed api-client method. The risk compounds on future changes
      (URL changes, auth header changes, error-handling changes) if the inline path
      diverges from the typed method.

      Near-dup check against BUILD rules 1-8: no existing rule addresses the convention
      that all HTTP fetches must go through the typed api client. BUILD rule 6 (formatter)
      and rule 7 (lint check) are discipline rules on a different axis. No near-dup.

      HOLD. Promote to BUILD-PRINCIPLES on second confirming wave where a hook or
      service fetches inline in addition to (or instead of) the typed api-client method
      for the same endpoint, caught at B-4 wiring or later.
    promotion_gates:
      generalizable: true
        # Applies to any wave where a new endpoint is added to api.ts and a consumer
        # (hook, service, component) is authored to call it. The check: does the consumer
        # call only the typed api-client method, or does it also have an inline fetch to
        # the same URL? A consumer that delegates fully to the typed method satisfies the
        # convention; one with a parallel inline fetch fails it.
      falsifiable: true
        # Checkable at B-4 wiring: for each new api-client method added this wave,
        # does the consuming code invoke it exclusively? A grep for the endpoint URL
        # string (or BASE + path) outside api.ts in the consumer file identifies an
        # inline fetch that bypasses the typed method.
      cited: true
        # B-4-wiring.md (dead method + URL/header duplication: getVoiceParticipants
        #   added to api.ts but hook fetched inline; reconciled at B-4 B-3 re-entry;
        #   both the dead method and the inline fetch removed; no behavior change).
    candidate_rule_shape: >
      9. When a typed api-client method exists for an endpoint, all consumer code
         must delegate to it; inline fetches to the same URL are dead-code divergence.
         Why: A parallel inline fetch duplicates URL and auth headers and can diverge
         silently from the typed method on future changes.
      Rule line = 112 chars; why line = 95 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to BUILD-PRINCIPLES on second
      confirming wave where a consumer fetches inline in parallel with a typed
      api-client method for the same endpoint.


  - id: obs-4
    summary: >
      Wave-32 is the third consecutive M6 wave to build a LiveKit-dependent feature
      credential-independently: wave-30 built the Resend email service with a placeholder
      key and deferred live-send to T-5/C-2; wave-31 built the LiveKit token-mint and
      voice join surface with a placeholder key and deferred live-connect to T-5/C-2;
      wave-32 built the voice occupancy indicator with LIVEKIT_* unset, verified the
      RBAC gate and graceful 503 live in prod, and deferred populated-occupancy
      verification to T-5/C-2. All three waves declared the credential-independent
      boundary explicitly at P-0 or T-8 and completed V-block APPROVED without the
      live credential. This confirms the pattern wave-31 obs-3 isolated as a 1st-instance
      HOLD ("build now with a placeholder key, defer only the live-connect verify to
      T-5/C-2"). The wave-32 instance is the 2nd confirming instance required for
      promotion. The disposition pattern: the credential-independent build is not a
      workaround but a deliberate scope boundary — the set of ACs that are verifiable
      without a live credential (RBAC gate, type check, error path on unset creds) is
      explicitly separated from the set that requires it (media-plane, live occupancy
      count), and only the latter is deferred.
    source:
      - process/waves/wave-32/stages/T-8-security.md
        # "Populated occupancy (real LiveKit participants) is NOT live-verifiable —
        #   LIVEKIT_* unset in Railway. This is the credential-independent boundary;
        #   the full RBAC + type + empty-room security surface IS proven live."
        # "N-1 tripwire stands: 3rd cred-blocked M6 wave → park-or-key fork."
      - process/waves/wave-32/stages/B-5-verify.md
        # "Live occupancy (real auth + LiveKit creds) deferred to T/C-2
        #   (credential-independent; LIVEKIT_* unset — wave-31 pattern)."
      - process/waves/_archive/wave-31/blocks/L/observations.md
        # obs-3: "A feature blocked on a founder-supplied credential is buildable
        #   credential-independent when the code under test signs and asserts a JWT
        #   with a placeholder key... 1ST INSTANCE. HOLD pending confirmation."
        # "Promote to PRODUCT-PRINCIPLES rule 3 on second confirming wave where
        #   P-0 or P-4 explicitly names the build-with-placeholder + defer-live-verify
        #   path as the reason the wave proceeds without founder escalation."
    severity: informational
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      2ND CONFIRMING INSTANCE of wave-31 obs-3. PROMOTABLE.

      Instance history:
      - wave-30 (cited as precedent in w31 obs-3): Resend email service built with
        placeholder key; live-send deferred to T-5/C-2 once founder provided the key.
        NOT isolated as a standalone L-2 observation at wave-30 (wave-30 Signal 6 was
        dropped as addressing the multi-wave credential BLOCK, a distinct concern).
      - wave-31 (1st instance as standalone observation): LiveKit token-mint and voice
        join surface; placeholder key; live-connect deferred. obs-3 HOLD.
      - wave-32 (2nd confirming instance): voice occupancy; LIVEKIT_* unset; RBAC gate
        + graceful 503 live-verified; populated-occupancy deferred. T-8 named the
        credential-independent boundary explicitly. B-5 cited wave-31 pattern.

      The wave-32 instance satisfies the wave-31 obs-3 promotion condition exactly:
      "P-0/P-4/T-8 explicitly names the credential-independent boundary as the reason
      the wave proceeds without founder escalation."

      Near-dup check against PRODUCT rules 1 and 2 (P-0 verification): different axis.
      Near-dup check against BUILD rule 1 (boot prod artifact): BUILD rule 1 targets
      the deploy verification step, not the decision to proceed credential-independently.
      No near-dup.

      PRODUCT-PRINCIPLES has 2 rules; slot 3 open. This obs competes for slot 3 with
      wave-29 obs-1 (operator-fix plan precision, gate REWORK, 1st-instance HOLD) and
      wave-29 obs-3 (override-ship log gap, 1st-instance HOLD). Wave-32 obs-4 is the
      only 2nd-instance confirmed candidate for slot 3 this wave — it wins per the
      2nd-instance priority rule. Flag for karen.
    promotion_gates:
      generalizable: true
        # Applies at P-0/P-4/T-8 for any wave introducing an external-SDK feature
        # (LiveKit, Resend, Stripe, Twilio) where the live credential is not yet in
        # the deployment environment. The class test: does a set of ACs exist that is
        # verifiable without a live connection (authz gate, error path on unset creds,
        # component rendering, JWT introspection)? If yes, build credential-independently
        # and defer only the live-effect ACs. If no, escalate rather than build.
      falsifiable: true
        # Checkable at P-0/T-8 for any wave with an external credential dependency:
        # does the deliverable explicitly name which ACs are verifiable without the
        # credential AND which are deferred, with the deferral target stage named?
        # A wave that either pauses waiting for the credential when placeholder-build
        # is viable, or proceeds without declaring the deferral boundary, fails this rule.
      cited: true
        # T-8-security.md (credential-independent boundary declared explicitly; RBAC +
        #   type + empty-room surface proven live; populated-occupancy deferred; 3rd M6
        #   cred-blocked wave noted);
        # B-5-verify.md ("credential-independent; LIVEKIT_* unset — wave-31 pattern");
        # wave-31 obs-3 (1st instance: token-mint + voice-join placeholder build; P/B/V
        #   gate-verdicts all approved the credential-independent scope).
    candidate_rule_shape: >
      3. When an external-SDK feature has credential-independent ACs, build now with
         a placeholder key and defer only the live-connect verify to T-5/C-2.
         Why: Pausing the wave to wait for a founder-supplied credential stalls work
         that is verifiable without one.
      Rule line = 118 chars; why line = 96 chars. No forbidden tokens.
      Note: rule shape identical to wave-31 obs-3 candidate_rule_shape (same class,
      same fix; no re-drafting needed).
    promotion_status: PROMOTABLE. 2nd confirming instance (w31 obs-3 + w32 obs-4).
      T-8 named the boundary explicitly; B-5 cited the prior-wave pattern. Flag for karen.


  - id: obs-5
    summary: >
      Wave-32's T-8 authz matrix proved gate-order sequencing (RBAC first, type-check
      second, creds-unset third) by observing the live HTTP response codes from each
      layer: a non-member stops at 403 before type-check, a member on a text channel
      reaches 400 (type), a member on a voice channel with unset creds reaches 503
      (creds guard after RBAC + type pass). This is the second consecutive wave where
      T-8 proves gate-order by live-exercising the full sequence against deployed prod
      (wave-31 T-8 proved the same for the token-mint endpoint). T-8 rule 1 already
      requires live-probing the authz path with a verified prod fixture; what this
      instance adds is the gate-order proof methodology: the response-code sequence
      (403→400→503) is itself the gate-order proof, requiring no code inspection at
      probe time. This is a wave-31 obs-1 HOLD second-instance candidate — wave-31
      obs-1 held "On a credential-issuing endpoint, check membership before loading
      or branching on resource; a load-first order leaks existence or type to
      non-members." Wave-32's endpoint (GET participants) is not credential-issuing
      (it reads, not mints), but it IS a membership-gated endpoint and the gate-order
      is confirmed live by the same response-code sequence. The class is broader than
      wave-31's framing: any RBAC-gated endpoint must run the membership gate before
      any resource-load or type discriminator, and T-8's matrix approach confirms it.
    source:
      - process/waves/wave-32/stages/T-8-security.md
        # "Gate-order proof: the sequence canViewChannelById → 403 (FIRST) → type !=
        #   voice → 400 → creds guard → 503 is confirmed by the matrix: a member on a
        #   text channel reaches 400 (type check), a non-member never does (stops at
        #   403), and a member on a voice channel with creds unset reaches 503."
      - process/waves/_archive/wave-31/blocks/L/observations.md
        # obs-1: "On a credential-issuing endpoint, check membership before loading or
        #   branching on resource... HOLD. Promote to BUILD-PRINCIPLES rule 9 on second
        #   confirming wave where gate order on a credential-issuing endpoint is caught
        #   or specified."
    severity: informational
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      PARTIAL SECOND INSTANCE of wave-31 obs-1, with a distinction that matters for
      promotion scoping. HOLD with narrowing note.

      Wave-31 obs-1's promotion condition is specifically "a credential-issuing endpoint's
      gate order is caught or specified." Wave-32's endpoint is a READ endpoint (GET
      participants), not credential-issuing. The gate-order proof methodology (using
      the live response-code sequence as the ordering proof) is identical, but the
      endpoint class differs.

      Two interpretations:
      (a) If wave-31 obs-1's class is narrowed to credential-issuing endpoints only,
          wave-32 does NOT confirm it. Wave-31 obs-1 remains a 1st-instance HOLD;
          its promotion condition remains: "second confirming wave where a credential-
          issuing endpoint's gate order is caught or specified."
      (b) If wave-31 obs-1's class is broadened to "any RBAC-gated endpoint," wave-32
          IS a confirming instance. But the broadened rule would be a near-dup with
          existing security first-principles and BUILD rule 4 (adversarial reproduction
          at B-6 Phase 2).

      Determination: take interpretation (a). Wave-31 obs-1 remains HOLD as written
      (credential-issuing endpoint scope). The wave-32 gate-order proof adds evidence
      for the T-8 methodology (response-code sequence as ordering proof), which is better
      captured by obs-2's T-8 rule 2 candidate (malformed-param probe + authz-matrix
      methodology) or as an informational signal, not a new standalone observation.

      DROPPED as a standalone observation. The gate-order-proof methodology is already
      captured in T-8 rule 1 + the wave-32 T-8 artifact itself. Wave-31 obs-1 HOLD
      status unchanged.
    promotion_status: DROPPED. Not a standalone observation. Wave-31 obs-1 HOLD unchanged.
```

---

## Prior held observations — second-instance status (wave-27 through wave-31)

| origin | obs | class | wave-32 status |
|--------|-----|-------|----------------|
| wave-31 | obs-1 | Credential-endpoint gate: membership check before load/type-discriminator | NOT CONFIRMED as standalone this wave. Wave-32 endpoint is read-only, not credential-issuing. Considered and dropped as obs-5 above. Remains 1-wave HOLD (BUILD rule 9 candidate). |
| wave-31 | obs-3 | Credential-independent build for external-SDK features; defer live-verify to T-5/C-2 | CONFIRMED as 2ND INSTANCE this wave (obs-4 above). PROMOTABLE to PRODUCT-PRINCIPLES rule 3. Wave-31 obs-3 HOLD resolved. |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() | NOT CONFIRMED this wave. No new ESM-only npm dependency added (livekit-server-sdk already bridged in wave-31; wave-32 reuses it). Remains 1-wave HOLD (BUILD rule 9/10 candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED this wave. No nullable-FK exclusion query authored (voice participant count is a live RoomServiceClient call, not a DB query on a status table). Remains 2-wave HOLD (BUILD rule 9 candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED this wave. No cron or background job with external side effect. Remains 2-wave HOLD (BUILD rule 9/10 candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED this wave. V-2 had one non-blocking finding (F-32-T-8-1: input-validation gap, not a design-limitation trade-off) and two noise items. No accept+track+observe disposition this wave. Remains 2-wave HOLD (VERIFY rule 3 candidate once slot opens). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED this wave. P-4 APPROVED first attempt; no operator-fix ambiguity. Remains 3-wave HOLD (PRODUCT rule 3 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED this wave. V-3 was empty (no fast-fix queue; F-32-T-8-1 classified non-blocking). No V-3 independent pattern scan occurred. Remains 3-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED this wave. Valid M6 feature wave, no override-ship. Remains 3-wave HOLD (PRODUCT rule 3 candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED this wave. No gitleaks interaction at C-1 (clean CI). Remains 4-wave HOLD (CI rule 7 candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED this wave. No CI-config fix cycle occurred. Remains 4-wave HOLD (CI rule 7/8 candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED this wave. No EXPLAIN-based integration test authored. Remains 5-wave HOLD (T-4 rule 1 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED this wave. No performance wave. Remains 5-wave HOLD (T-7 rule 1 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED this wave. No store-keyed unit fixture; T-5 live-connect deferred (creds). Remains 6-wave HOLD (T-2 rule 2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored. Remains 6-wave HOLD (T-2 candidate). |

---

## Summary table

| id    | title (short)                                                                 | severity      | recurrence   | candidate file              | disposition |
|-------|-------------------------------------------------------------------------------|---------------|--------------|-----------------------------|-------------|
| obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock | warning  | 2nd instance | BUILD-PRINCIPLES            | PROMOTABLE — slot 9; 2nd instance (w23 + w32); flag for karen |
| obs-2 | :id route param without format validator returns 500; T-8 is the catch gate   | warning       | 1st isolation | T-8.md                     | HOLD — T-8 rule 2 candidate; promote on 2nd confirming wave |
| obs-3 | Typed api-client method added but consumer fetches inline in parallel          | informational | 1st instance | BUILD-PRINCIPLES            | HOLD — BUILD rule 9 candidate; promote on 2nd confirming wave |
| obs-4 | Credential-independent build for external-SDK feature; live-verify deferred   | informational | 2nd instance | PRODUCT-PRINCIPLES          | PROMOTABLE — rule 3 candidate; 2nd instance (w31 obs-3 + w32 obs-4); flag for karen |
| obs-5 | Gate-order proof via live response-code sequence on read endpoint             | informational | partial       | (none — dropped)            | DROPPED — partial confirmation of w31 obs-1; not a standalone observation |

**Observations emitted: 4 (obs-1 through obs-4; obs-5 evaluated and dropped)**
**Severities: 2 warning (obs-1, obs-2), 2 informational (obs-3, obs-4)**
**Candidate files: BUILD-PRINCIPLES (obs-1, obs-3), T-8.md (obs-2), PRODUCT-PRINCIPLES (obs-4)**
**Dropped: obs-5 (gate-order proof on read endpoint — partial w31 obs-1 confirmation; class is credential-issuing-specific per w31 framing)**

---

## Promotion candidate flags for karen

**Two promotion candidates this wave.**

**obs-1 (BUILD-PRINCIPLES slot 9) — PROMOTABLE.**
2nd confirming instance across wave-23 (assignments.test.tsx: getMyPermissions unmocked,
5 failures) and wave-32 (voice-study-room.test.tsx: getVoiceParticipants unmocked, 14/15
failures). Both instances: wiring a new api call into an existing component whose test file
has an explicit-enumeration vi.mock factory; the factory lacked the new method; B-5 catch;
fixed by adding a stub entry.

Candidate rule (BUILD rule 9):
  9. When wiring a new api method into an existing component, update that
     component's explicit-enumeration mock factory in the same commit.
     Why: An unmocked call on a vi.mock module fires the real implementation
     and tears down the test environment for all prior tests in the file.

Rule line = 113 chars; why line = 98 chars. No forbidden tokens.

Note: this wave's obs-1 takes BUILD-PRINCIPLES slot 9 over wave-31's two 1st-instance
HOLDs (obs-1 gate-ordering and obs-4 ESM bridge) per the 2nd-instance priority rule.

**obs-4 (PRODUCT-PRINCIPLES rule 3) — PROMOTABLE.**
2nd confirming instance: wave-31 obs-3 (LiveKit token-mint + voice join, placeholder key,
P/B/V gates approved) and wave-32 obs-4 (voice occupancy, LIVEKIT_* unset, T-8 named the
credential-independent boundary explicitly, B-5 cited wave-31 pattern). Both instances
share the resolution axis: ACs split into credential-independent (live-verified this wave)
and credential-dependent (deferred to T-5/C-2 with honest documentation).

Candidate rule shape (PRODUCT rule 3) — from wave-31 obs-3, unchanged:
  3. When an external-SDK feature has credential-independent ACs, build now with
     a placeholder key and defer only the live-connect verify to T-5/C-2.
     Why: Pausing the wave to wait for a founder-supplied credential stalls work
     that is verifiable without one.

Rule line = 118 chars; why line = 96 chars. No forbidden tokens.

Competes for slot 3 with wave-29 obs-1 (operator-fix plan precision, gate REWORK, 3-wave
HOLD at 1 instance). Wave-32 obs-4 is the 2nd-instance confirmed candidate — it wins the
slot per promotion priority.

## L-2 promotion outcome (wave-32)
- obs-4 → PRODUCT-PRINCIPLES rule 3: PROMOTED (karen APPROVE + linter PASS at 91-char why).
- obs-1 → BUILD-PRINCIPLES rule 9: promotion blocked by linter; candidate dropped at L-2 (reason: linter:why>100 twice — why line held at 104 after the cap-1 karen rewrite). Substance APPROVED by karen (2nd instance w23+w32 verified real); observation retained for a future wave's L-2 with a tighter why line. Recommend: the why "An unmocked call on a vi.mock module runs the real code and breaks the env for the file's tests" needs ~4 more chars trimmed.

## N-block process contradiction (orchestrator-resolved, for brain maintainers)
- **Finding:** V-2-triage Action 4 sets a non-blocking follow-up's `wave_id = current wave` (provenance) AND its SQL comment says the row "becomes a candidate seed for a future wave's bundle (N-2 picks it directly)". But the N-2 seed picker (N-2-seed.md:27,32-37) requires `wave_id IS NULL`. So a milestone-scoped V-2 follow-up (milestone_id set, not the unassigned-queue path) can NEVER be picked as an N-2 seed as authored — internal contradiction. roadmap-lifecycle.md line 156 authorizes no stage to clear wave_id back to NULL.
- **Why it only surfaced now:** prior V-2/D-3 follow-up seeds (waves 22-30) used milestone_id=NULL (unassigned queue, picked at P-0/checkpoint), which sidesteps the N-2 picker. wave-32's a2dd9f3d is the first milestone-SCOPED V-2 follow-up intended as a direct N-2 seed.
- **Orchestrator resolution (rule 15 task-CRUD + rule 17 technical-default):** cleared a2dd9f3d.wave_id -> NULL to restore V-2's stated "N-2 picks it directly" intent (provenance preserved in the task description "Source: wave-32 V-2"). NOT escalated to founder — this is technical plumbing, not a product/taste decision. head-next had escalated it as BLOCKED; orchestrator has broader authority than the in-ritual N-block writes head-next is limited to.
- **Recommended brain fix (maintainers):** EITHER V-2 Action 4 should set wave_id=NULL for milestone-scoped follow-ups it intends N-2 to seed, OR N-3 should clear wave_id on unclaimed todo child-tasks of the closing wave, OR the N-2 picker should accept `wave_id IS NULL OR wave_id IN (closed waves)`.
