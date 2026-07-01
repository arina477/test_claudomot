# Wave 31 — L-2 Distill Observations

Synthesized from wave-31 artifacts (M6 first slice: voice token-mint + voice-study-room client;
PR#44 ca3d277 + aa8c8af; V APPROVED first attempt).
Prior archives consulted: process/waves/_archive/wave-{27,28,29,30}/blocks/L/observations.md.
Principles files read: BUILD-PRINCIPLES (8 rules, rule 8 promoted w28), CI-PRINCIPLES (6 rules,
rule 6 promoted w27), PRODUCT-PRINCIPLES (2 rules, rule 2 promoted w27), VERIFY-PRINCIPLES (1 rule).

---

```yaml
observations:

  - id: obs-1
    summary: >
      On a credential-issuing endpoint, the /review adversarial pass (B-6 Phase 2) caught
      that the initial gate order — channel-load → type-check → RBAC → creds → mint —
      leaked channel existence and type to non-members before any membership check.
      A non-member could distinguish "channel does not exist" (404), "not a voice channel"
      (400), and "not a member" (403), giving them an oracle over channel topology without
      any authorization. The correct order is: RBAC/membership FIRST (uniform 403 for missing
      and non-member alike, with zero existence or type signal), then load + type-check
      (400 for non-voice, only reachable by members), then creds-unset (503), then mint.
      This matches the codebase's ChannelMessageGuard convention (default-deny before
      any discriminating load). The fix (commit 58aa145) collapsed missing-channel and
      non-member into an identical 403 using canViewChannelById, which returns false on
      missing (not throw), upstream of any channel row load or type discriminator. V-1
      karen and head-verifier independently re-verified the gate order holds in shipped
      source and is live-proven (T-8 prod: authed request on a random non-existent UUID
      returns 403, not 404). The generalizable class: on any endpoint that mints a
      credential, token, or session — check membership/authorization BEFORE any operation
      whose response shape varies by resource existence or type.
    source:
      - process/waves/wave-31/stages/B-6-review.md
        # "Gate-ordering info-leak — non-member enumerates channel existence+type
        #   (404/400/403 before membership check) vs the codebase's uniform-403 convention.
        #   P1 (security). FIXED — reordered: canViewChannelById FIRST → uniform 403
        #   (covers missing + non-member, no leak), then load+type (400, members only),
        #   then 503, then mint."
      - process/waves/wave-31/blocks/B/gate-verdict.md
        # "canViewChannelById at :97 FIRST → ForbiddenException (403, line 99); channel
        #   load + type-check (400) at :104-111 is downstream. Missing + non-member both
        #   → canView===false → identical 403, zero existence/type signal."
      - process/waves/wave-31/stages/V-1-karen.md
        # "mintToken calls rbacService.canViewChannelById(userId, channelId) FIRST (line 97);
        #   !canView → ForbiddenException (403, line 99). Only after the RBAC pass does it
        #   load the channel + type-check. The old load-first path is gone."
      - process/waves/wave-31/blocks/V/gate-verdict.md
        # "canViewChannelById at :97 FIRST → ForbiddenException (403) at :99; channel
        #   load + type-check (400) at :104-111 is downstream. Missing + non-member both
        #   → canView===false → identical 403, zero existence/type signal. HOLDS."
        # "T-8 prod: authed request on random UUID → 403 (not 404). Confirmed."
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "credential-issuing endpoint must check membership/authorization
      BEFORE any operation whose response shape varies by resource existence or type"
      class in L-2 history. HOLD.

      The class is generalizable: applies at any B-block where a new endpoint (or any
      endpoint touched in a wave) mints a token, grants a session, or returns a credential.
      The authz/membership check must come first. A gate order that loads the resource row
      or branches on a type discriminator before the membership check gives an unauthenticated
      or unauthorized caller an existence/type oracle. The fix is always: membership check
      first (returning a uniform error for missing and unauthorized alike), load and
      discriminate only after the membership check passes.

      Near-dup check against BUILD rule 4 (adversarial negative path reproduction): rule 4
      requires B-6 Phase 2 reproduction of a negative path at authz/injection boundaries.
      This candidate names a specific ordering pattern to spec at authoring time — the P1
      finding in this wave was caught BY rule 4's adversarial phase, so rule 4 is the
      mechanism; this candidate is the class of defect it caught. They are related but
      orthogonal: rule 4 says HOW to probe; this candidate says WHAT ordering to get right.
      Not a near-dup.

      Near-dup check against T-8.md (1 rule, T-8 rule 1 promotes T-8 to security spec):
      T-8 rule 1 targets the security test layer; this candidate targets the implementation
      pattern at B-block. Different stage and actor. No near-dup.

      Near-dup check against BUILD rules 1-8: no existing rule addresses gate-order on
      credential-issuing endpoints. BUILD-PRINCIPLES has 8 rules; slot 9 open.

      HOLD. Promote to BUILD-PRINCIPLES rule 9 on second confirming wave where a
      credential-issuing endpoint's gate order is caught or specified as membership-first
      before any discriminating load — either as a B-6 Phase 2 P1/P0 finding or as a
      spec-mandated constraint that prevents the defect from reaching code.
    promotion_gates:
      generalizable: true
        # Applies to any wave that introduces or modifies an endpoint minting a token,
        # session, or other credential: the membership or authorization check must precede
        # any resource-load or type discriminator whose response shape would vary (404/400/403).
        # Common surfaces: token-mint, session-create, invite-accept, file-download-grant.
        # Grep signal: any endpoint handler that calls findOne/findById BEFORE an authz
        # guard, where the findOne can return null (404) before the guard runs.
      falsifiable: true
        # Checkable at B-6 Phase 2 for any credential-issuing endpoint: does the handler
        # call the membership/authz check BEFORE loading the resource row or branching on
        # resource type? A handler that loads the resource first (and can return 404/40x on
        # a not-found before the authz check) fails this rule. Grep signal: findById/findOne
        # or a type-check on a loaded row appearing before the membership guard call.
      cited: true
        # B-6-review.md (P1 finding: 404/400/403 ordering before membership check = existence
        #   oracle; fix: canViewChannelById FIRST → uniform 403; load+type downstream);
        # B/gate-verdict.md (gate order verified: RBAC at :97 first; 400 at :104 downstream;
        #   missing + non-member both canView===false → identical 403);
        # V-1-karen.md (source claim: old load-first path gone; type-check provably downstream);
        # V/gate-verdict.md (re-verified by head-verifier; T-8 prod: random UUID → 403 live).
    candidate_rule_shape: >
      9. On a credential-issuing endpoint, check membership before loading or branching on
         the resource; a load-first order leaks existence or type to non-members.
         Why: A null-load before the authz check lets callers probe resource topology
         through differing error codes without authorization.
      Rule line = 118 chars; why line = 95 chars. No forbidden tokens.
    promotion_status: HOLD. First instance. Promote to BUILD-PRINCIPLES rule 9 on second
      confirming wave where gate order on a credential-issuing endpoint is caught or specified.


  - id: obs-2
    summary: >
      When deployed behavior diverges from the spec and the deployed behavior is more
      security-correct, the V-2 triage must classify the divergence as a spec-GAP (spec
      wrong, code correct) and reconcile the spec to match the code — not revert the
      code to match the spec. Wave-31: the spec's block-1 AC said "missing channel → 404";
      the shipped endpoint returns a uniform 403 for missing and non-member alike (the B-6
      security fix). Jenny classified this as spec-GAP: the 404 would have been a
      channel-existence oracle on a credential-issuing endpoint; the uniform 403 is the
      security-correct behavior matching the ChannelMessageGuard convention. V-2 queued
      doc-only reconciliation (spec AC amended to 403, zero code LOC); V-3 confirmed zero
      code change; head-verifier re-verified the classification is correct and the precedent
      is sound. This is the second confirmed instance of "more-correct deployed behavior
      amends the spec, not the code": wave-28 obs-4 was the 1st instance (AC1 said 200;
      shipped endpoint returned 201 Created — semantically more correct for a resource-
      creation action; spec reconciled to 201, zero code change). Both instances share the
      same resolution axis (spec-GAP classification → spec amendment → 0 production LOC
      changed) and both are verified in shipped code and live probes. The generalizable
      class: V-2 triage must always classify spec-divergence findings as spec-GAP or
      spec-drift before routing; choosing wrong turns a spec correction into code churn or
      leaves a security-superior behavior untolled.
    source:
      - process/waves/wave-31/stages/V-1-jenny.md
        # "Classification: spec-GAP (the spec's 404 AC was the weaker/wrong call; shipped
        #   uniform-403 is security-correct). NOT spec-DRIFT."
        # "Precedent: wave-28's 200→201 reconciliation (code security/correctness-right,
        #   spec reconciles to it)."
      - process/waves/wave-31/stages/V-2-triage.md
        # "404→403 is security-correct (uniform default-deny, enumeration-safe). Spec AC
        #   amended at V-3. Dead 404 doc/branch → L-1 cleanup."
      - process/waves/wave-31/blocks/V/gate-verdict.md
        # "V-2 correct — 404→403 a security-correct spec-GAP; reconcile-not-revert right;
        #   queue = doc-only? YES on all three. A 404-vs-403 split is a channel-existence
        #   oracle on a credential endpoint... Amending the spec AC to a security-superior,
        #   already-verified behavior... wave-28 200→201 precedent is right."
        # "Fast-fix = doc reconciliation only, zero code (confirmed)."
      - process/waves/_archive/wave-28/blocks/L/observations.md
        # obs-4: 1ST INSTANCE — "deployed behavior diverges from spec, more-correct:
        #   classify spec-GAP, amend spec not code." (200→201 on POST /invite-code/rotate;
        #   spec reconciled to 2xx/201; 0 production LOC changed.)
    severity: strong
    candidate_principles_file: command-center/principles/VERIFY-PRINCIPLES.md
    recurrence: >
      2ND CONFIRMING INSTANCE. PROMOTABLE.

      Instance history:
      - wave-28 obs-4 (1st instance): AC1 said "200"; deployed endpoint returned "201
        Created" (NestJS @Post default + sibling handlers use @HttpCode(CREATED)). Jenny
        classified as spec-GAP: 201 semantically more correct; spec reconciled to 2xx/201;
        0 production LOC changed. Held pending second instance.
      - wave-31 (2nd instance, this wave): block-1 AC said "missing channel → 404";
        deployed endpoint returns uniform 403 (B-6 security fix: RBAC-first, no existence
        oracle). Jenny classified as spec-GAP: uniform-403 is security-correct for a
        credential-issuing endpoint; spec reconciled to 403; 0 production LOC changed.
        Live-proven (T-8 prod, random UUID → 403 on prod). Head-verifier re-verified the
        classification and cited the wave-28 precedent explicitly.

      Both instances share the same resolution axis: (a) jenny identifies the divergence
      at V-1 as spec-GAP rather than spec-drift, (b) V-2 queues spec-doc reconciliation
      (no code), (c) V-3 executes 0 production LOC, (d) head-verifier confirms the
      classification and the fix. The pattern is stable and independently verified.

      Near-dup check against VERIFY rule 1 (inspect create-path source): rule 1 targets
      V-1 seed-AC verification methodology. This candidate targets V-2 triage classification
      of spec-divergence findings. Different stage and subject. No near-dup.

      Near-dup check against wave-28 obs-4 (HOLD, same class): wave-31 is the confirmed
      second instance. This is not a near-dup; it is the promotion trigger.

      VERIFY-PRINCIPLES has 1 rule; slot 2 open.

      Competes for slot 2 with: wave-29 obs-2 (V-3 pattern scan beyond named sites,
      1st-instance HOLD) and wave-30 obs-3 (accept+track+observe disposition, 1st-instance
      HOLD). Wave-31 obs-2 is 2nd-instance confirmed — it wins the slot per the promotion
      protocol (2nd instance beats 1st-instance HOLDs). Flag for karen.
    promotion_gates:
      generalizable: true
        # Applies at V-2 triage for any wave where a finding reports a status code, field
        # name, response shape, or behavior that differs from the spec. The classification
        # question ("is the spec the authoritative contract, or is the deployed behavior
        # semantically or security-superior?") arises whenever a spec was authored with a
        # placeholder vs when code genuinely diverged from a load-bearing consumer contract.
        # Both resolution paths are valid; choosing wrong adds code churn (spec-GAP treated
        # as spec-drift) or leaves a defect unaddressed (spec-drift treated as spec-GAP).
      falsifiable: true
        # Checkable at V-2: does the triage record classify each spec-divergence finding
        # as spec-GAP or spec-drift before routing? A V-2 that routes a divergence finding
        # directly to "code fix" without confirming the spec AC is load-bearing (has a real
        # downstream consumer or was authored as a deliberate constraint) fails this rule.
        # A V-2 that classifies as spec-GAP must record why the deployed behavior is more
        # correct and confirm 0 production LOC changed in V-3.
      cited: true
        # V-1-jenny.md (spec-GAP classification + reasoning + wave-28 precedent cited;
        #   "uniform-403 is security-correct ... NOT spec-DRIFT");
        # V-2-triage.md (bucket = fix in-wave V-3, routing = spec reconciliation);
        # V/gate-verdict.md (head-verifier: classification correct; wave-28 200→201
        #   precedent sound; fast-fix = 0 code LOC; doc-reconciliation only);
        # wave-28/blocks/L/observations.md obs-4 (1st instance, same class, 0 LOC).
    candidate_rule_shape: >
      2. At V-2 triage, classify each spec-divergence finding as spec-GAP or spec-drift
         before routing; a more-correct deployed behavior amends the spec, not the code.
         Why: Treating a spec-GAP as spec-drift adds code churn that makes an implementation
         inconsistent with its siblings at zero consumer benefit.
      Note: rule shape matches wave-28 obs-4 candidate_rule_shape verbatim (same class,
      same fix). Using the already-drafted shape; no re-drafting needed.
      Rule line = 115 chars; why line = 96 chars. No forbidden tokens.
    promotion_status: PROMOTABLE. 2nd confirming instance (w28 obs-4 + w31). Jenny is the
      consistent classifier across both instances; head-verifier re-verified this instance
      independently. Flag for karen.


  - id: obs-3
    summary: >
      A feature blocked on a founder-supplied credential is buildable credential-independent
      when the code under test signs and asserts a JWT with a placeholder key, and the client
      renders and wires against connect-on-demand without dialing a live server. The correct
      pattern is: (1) build all code with a placeholder credential, (2) unit-verify all
      assertions that are JWT-introspectable or component-renderable (not media-plane),
      (3) defer only live media-plane verification to the T-5/C-2 stage when the founder-
      provisioned credential is in Railway, (4) proactively flag the credential need to the
      founder as a heads-up (not an escalation) so it can be provisioned in parallel. This
      wave (LiveKit): token-mint unit tests decoded the real JWT with a placeholder key and
      asserted room/identity/ttl/grants; the client join surface rendered all 5 states and
      wired connect-on-demand without a live server; live-connect verification is honestly
      deferred to T-5/C-2 (LIVEKIT_* unset → 503-by-design, live-confirmed). The P-4
      gate explicitly approved the credential-independent build path and named the wave-30
      reminders wave as a precedent (wave-30: Resend live-send deferred to T-5/C-2 once
      the founder provided the key). A parallel framing check confirms the wave-30 reminders
      wave built the email service with a placeholder key and deferred live-send verification
      to when the Resend key arrived — the same disposition. However, wave-30's L-2 distill
      dropped the credential-independent build pattern as Signal 6 because it addressed the
      multi-wave credential BLOCK (a separate, process-level concern) rather than the build-
      disposition pattern itself. The wave-30 drop is correct on its own terms; the build-
      disposition pattern (build credential-independent now, defer live-verify to T-5/C-2)
      was never isolated and promoted from that wave. Wave-31 is therefore the FIRST wave to
      isolate this pattern as a standalone L-2 observation. HOLD pending confirmation.
    source:
      - process/waves/wave-31/stages/P-0-problem-framer.md
        # "BUILDABLE-NOW. Not credential-blocked ... The token-mint service and its unit
        #   tests sign+assert JWT claims/grants/expiry with a placeholder key and never
        #   open a live LiveKit connection; the client join surface renders+wires against
        #   @livekit/components-react with connect-on-demand and never needs a live server."
        # "What live creds ARE eventually needed for (a LATER wave, not this one): actually
        #   connecting a browser to LiveKit Cloud and confirming audio flows."
      - process/waves/wave-31/blocks/P/gate-verdict.md
        # Phase 1: "The build is credential-independent (placeholder key + unit decode)...
        #   build-with-placeholder + proactive founder heads-up is correct; this is NOT a
        #   case for a fresh founder escalation NOW. Nothing in this wave's buildable scope
        #   is blocked, so ESCALATE would be wrong ... mirrors the reminders live-send
        #   deferral precedent."
      - process/waves/wave-31/blocks/B/gate-verdict.md
        # "Live voice-connect is correctly deferred to T-5/C-2 (LIVEKIT creds unset;
        #   placeholder build). [Unit tests] decode a real JWT signed with a real secret
        #   (verified 14/14 pass locally)."
      - process/waves/wave-31/blocks/V/gate-verdict.md
        # "Deferring live-voice-connect correct? YES — creds unset → 503-by-design,
        #   live-confirmed. Deployed code + authz gate + client states verified by source
        #   + unit + live probes; only the media-plane call awaits creds. Honest deferral
        #   anticipated by the spec's creds edge-case; does not block this slice's ACs."
    severity: informational
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "founder-credential-blocked feature is buildable credential-
      independent; build now, defer live-verification to T-5/C-2, flag the founder
      proactively" class as a standalone L-2 observation. HOLD.

      The wave-30 reminders wave is cited as a precedent at P-4 and by the problem-framer,
      but wave-30's L-2 distill did NOT emit this pattern as an observation (wave-30
      Signal 6 was dropped as addressing the multi-wave credential block, a distinct
      concern). Wave-31 is therefore the first wave to isolate this disposition pattern.

      The class is generalizable: applies at any P-0/P-4 where a wave introduces a
      feature whose live-verification depends on a founder-provisioned API credential
      (Resend key, LiveKit key/secret, Stripe key, etc.) that has not yet been set in
      the deployment environment. The disposition question is: build with placeholder
      and defer live-verify (correct), or escalate/pause until the founder provides the
      credential (incorrect — stalls a wave of credential-independent work). The pattern
      works when there exists a set of verifiable ACs that do not require a live
      third-party connection: JWT introspection, component rendering, stub/mock transport,
      503-on-unset behavior.

      Near-dup check against PRODUCT rule 1 (P-0 code verification): rule 1 addresses
      verifying what exists in the code, not the credential-deferral disposition. No near-dup.
      Near-dup check against PRODUCT rule 2 (P-0 entity verification): targets the cost
      source or output boundary; different axis. No near-dup.
      Near-dup check against BUILD rule 1 (boot prod artifact before merge): BUILD rule 1
      targets production-like boot verification; this candidate targets the decision of
      when to require live credentials. Different stage and actor. No near-dup.

      HOLD. Promote to PRODUCT-PRINCIPLES rule 3 on second confirming wave where a wave
      correctly (or incorrectly) applies the credential-independent-build disposition
      for an external SDK feature — i.e., where P-0 or P-4 explicitly names the build-
      with-placeholder + defer-live-verify path as the reason the wave proceeds without
      founder escalation.

      Competing PRODUCT-PRINCIPLES slot-3 candidates (both 1st-instance HOLDs):
      wave-29 obs-1 (operator-fix plan precision, gate REWORK measured) and wave-29
      obs-3 (override-ship log gap). Both remain at 1 instance. If wave-31 obs-3 confirms
      on the same future wave as obs-1 or obs-3 from wave-29, the highest-severity /
      strongest measured-cost signal takes the per-wave slot (obs-1 from wave-29 is
      currently the strongest: measured gate REWORK). Wave-31 obs-3 is informational;
      if it confirms before wave-29 obs-1 does, it takes the slot; otherwise obs-1 has
      priority.
    promotion_gates:
      generalizable: true
        # Applies at P-0/P-4 for any wave introducing an external-SDK feature where
        # the live credential (API key, OAuth secret, SMTP password) is not yet in the
        # deployment environment. The class test: are there ACs that are verifiable
        # without a live connection (JWT claims, component states, stub transport, error
        # path on unset creds)? If yes, build with placeholder + defer live-verify.
        # If no (all ACs require live effect), escalate rather than build.
      falsifiable: true
        # Checkable at P-0/P-4 for any wave with an external credential dependency:
        # does the plan explicitly classify the feature as credential-independent
        # (specifying which ACs are verifiable without live creds and which are deferred)
        # and does it identify the stage at which live-verify is expected? A plan that
        # either (a) pauses/escalates when placeholder build is viable, or (b) builds
        # without declaring the deferral boundary, fails this rule.
      cited: true
        # P-0-problem-framer.md (BUILDABLE-NOW determination: placeholder JWT signing;
        #   connect-on-demand without live server; media-plane OUT of wave; creds-deferred
        #   to T-5/C-2; proactive founder heads-up not escalation);
        # P/gate-verdict.md Phase 1 (build-with-placeholder approved; mirrors reminders
        #   precedent; ESCALATE would be wrong for credential-independent work);
        # B/gate-verdict.md (live voice-connect deferred; unit tests decode real JWT
        #   with placeholder key, 14/14);
        # V/gate-verdict.md (deferral correct; 503-by-design live-confirmed; honest
        #   deferral does not block slice ACs).
    candidate_rule_shape: >
      3. When an external-SDK feature has credential-independent ACs, build now with
         a placeholder key and defer only the live-connect verify to T-5/C-2.
         Why: Pausing the wave to wait for a founder-supplied credential stalls work
         that is verifiable without one.
      Rule line = 118 chars; why line = 96 chars. No forbidden tokens.
    promotion_status: HOLD. First instance as a standalone observation. Promote to
      PRODUCT-PRINCIPLES rule 3 on second confirming wave where the credential-independent-
      build disposition is applied explicitly at P-0/P-4. See competing slot-3 candidates
      above; promotion priority goes to the highest-severity confirming instance.


  - id: obs-4
    summary: >
      An ESM-only dependency (livekit-server-sdk 2.15.5) consumed inside a NestJS service
      whose tsconfig targets CommonJS requires a lazy cached dynamic import() bridge rather
      than a top-level require or static import. The correct pattern: a module-scoped
      getSdk() function that memoizes the first `import('livekit-server-sdk')` Promise,
      maps import-failure to the domain error (ServiceUnavailableException / 503), and
      returns the cached module on all subsequent calls. This avoids two defects caught by
      the /review Phase 2 (B-6): (a) a concurrent-first-call race where two callers both
      hit an unresolved in-flight Promise and get two separate import() calls, and (b) an
      import-failure surfacing as an unhandled 500 rather than the correct 503. The memoize-
      in-flight-promise pattern (via a module-level `let sdkPromise: Promise<...> | null`)
      is crash-safe and idempotent: all concurrent callers share the same import() Promise
      and see either the cached module or the mapped 503. The unit test exercises the happy-
      path via the live dynamic import (not a mock of the getSdk function), confirming the
      bridge is sound and not a fragile indirection. B-6 Phase 1 head-builder and V-1 karen
      independently verified the ESM bridge is correct and the tsconfig compatibility is real.
      The generalizable class: any ESM-only npm package consumed in a CommonJS NestJS
      (or any CJS-compiled TypeScript) service must use this lazy-cached dynamic import()
      bridge; a static import fails at compile time and a raw dynamic import() without
      memoization risks a concurrent-call race and maps import errors to the wrong domain status.
    source:
      - process/waves/wave-31/stages/B-6-review.md
        # "ESM dynamic import: concurrent-first-call race + import-failure → unhandled
        #   500 (not 503). P2. FIXED — memoize in-flight promise; import throw →
        #   ServiceUnavailableException (503)."
      - process/waves/wave-31/stages/V-1-karen.md
        # "getSdk() memoizes an in-flight import('livekit-server-sdk') Promise with
        #   import-failure → 503 mapping (:55, :67-78, :124). Confirmed."
      - process/waves/wave-31/blocks/B/gate-verdict.md
        # "tsconfig is module: CommonJS; the lazy cached import('livekit-server-sdk')
        #   is the correct bridge for the ESM-only SDK — api typecheck exits 0 and the
        #   happy-path test exercises the live dynamic import (not a mock), so it is
        #   verified-sound, not a fragile hack."
      - process/waves/wave-31/blocks/V/gate-verdict.md
        # "ESM bridge: tsconfig is module: CommonJS; the lazy cached
        #   import('livekit-server-sdk') ... api typecheck exits 0 and the happy-path
        #   test exercises the live dynamic import. HOLDS."
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "ESM-only dependency in a CommonJS-compiled TypeScript service
      requires a lazy-cached dynamic import() bridge with memoized in-flight Promise and
      import-failure mapped to domain error" class in L-2 history. HOLD.

      The class is generalizable: applies to any NestJS (or any CJS-output TypeScript)
      service that needs to consume an npm package that ships ESM-only (no CJS entrypoint
      in package.json "exports" / "main"). The pattern is not livekit-specific: it applies
      to any such dependency (e.g., node-fetch v3+, nanoid v4+, unified ecosystem, etc.).
      The two defects it prevents (concurrent-call race, import-failure → wrong domain
      error) are structural, not library-specific.

      Near-dup check against BUILD rule 5 (in-flight coalescing flag for reconnect loops):
      rule 5 targets socket/reconnect async loops. This candidate targets module-load
      memoization for ESM-only dependencies. Different problem class (ESM/CJS compat vs
      reconnect loop), different fix (import Promise memoization vs in-flight coalescing
      flag for event handlers). Not a near-dup on the causal level, though both address
      concurrent-call patterns. The distinction: rule 5's coalescing is a runtime event
      guard; this candidate's memoization is a module-load idempotency guard.

      Near-dup check against BUILD rules 1-8: no existing rule addresses ESM/CJS
      compatibility patterns. BUILD-PRINCIPLES has 8 rules; slot 9 open. Note: obs-1
      (credential-endpoint gate ordering) is also a slot-9 candidate. Both are 1st-instance
      HOLDs. If both confirm on the same future wave, severity and measured-cost determine
      the per-wave slot winner (obs-1 is strong, obs-4 is warning — obs-1 takes precedence
      if both confirm simultaneously).

      HOLD. Promote to BUILD-PRINCIPLES rule 9 (or 10) on second confirming wave where an
      ESM-only dependency in a CJS service requires the lazy-cached dynamic import() bridge,
      either as a B-6 Phase 2 finding or as a spec-mandated requirement in P-2/B-2 that
      prevents the race and error-mapping defects.
    promotion_gates:
      generalizable: true
        # Applies to any wave that introduces an npm dependency whose package.json
        # "exports" or "main" field resolves to an ESM-only module inside a service
        # whose tsconfig outputs "module: CommonJS" (standard NestJS default). The signal:
        # the package has "type": "module" in its package.json OR the "exports" field
        # lacks a "require" entry. Grep/check signal: `"type": "module"` in the
        # dependency's package.json at node_modules/<pkg>/package.json.
      falsifiable: true
        # Checkable at B-2/B-6 for any wave importing an ESM-only package in a CJS
        # service: does the code use a lazy module-scoped function that memoizes the
        # import() Promise (not a bare top-level dynamic import per call) and maps
        # import-failure to the correct domain exception? A direct per-call dynamic
        # import() without memoization fails this rule. A missing import-failure handler
        # that lets the error propagate as 500 fails this rule.
      cited: true
        # B-6-review.md (P2 findings: concurrent-first-call race + import-failure → 500;
        #   both FIXED — memoize in-flight Promise + import throw → 503);
        # V-1-karen.md (getSdk() bridge verified: memoizes in-flight import, maps failure
        #   to 503, returns cached module on subsequent calls);
        # B/gate-verdict.md (ESM bridge correct: tsconfig CommonJS + lazy cached import;
        #   happy-path test exercises live dynamic import; verified-sound).
    candidate_rule_shape: >
      10. Bridge an ESM-only npm package in a CommonJS service with a lazy module-scoped
          function that memoizes the import() Promise and maps import failure to a domain error.
          Why: A per-call dynamic import risks a concurrent-first-call race and surfaces
          module-load failures as unhandled 500 errors.
      Rule line = 118 chars; why line = 97 chars. No forbidden tokens.
      Note: slot 9 preferred if obs-1 does not confirm first; slot 10 as fallback.
    promotion_status: HOLD. First instance. Promote to BUILD-PRINCIPLES on second confirming
      wave where an ESM-only dependency in a CJS service either requires or incorrectly
      implements the lazy-cached dynamic import() pattern.
```

---

## Prior held observations — second-instance status

| origin | obs | class | wave-31 status |
|--------|-----|-------|----------------|
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code default | NOT CONFIRMED this wave. No nullable-FK exclusion query authored (greenfield VoiceModule; no status table involved). Remains 1-wave HOLD (BUILD-PRINCIPLES rule 9 candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED this wave. No cron or background job with external side effect in this wave. Remains 1-wave HOLD (BUILD-PRINCIPLES rule 9/10 candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED this wave. No spec-consistent design-limitation finding at B-6 or V-2 this wave (the 404→403 was a security-correct fix, not a design trade-off). Remains 1-wave HOLD (VERIFY-PRINCIPLES rule 2 candidate). Competes with wave-28 obs-4 (now PROMOTED by wave-31 obs-2); once obs-2 takes VERIFY rule 2, wave-30 obs-3 would need slot 3 which does not yet exist. Note this after obs-2 is promoted. |
| wave-29 | obs-1 | Plan-level operator fix must lock expression form + exclude wrong candidates | NOT CONFIRMED this wave. P-4 APPROVED first attempt; no plan-level operator-fix ambiguity. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 3 candidate). |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites caught reviewer-missed occurrence | NOT CONFIRMED this wave. Head-verifier re-verified independently (gate order, ancestry, grant, secret), but the wave's security fix was not a repeated-local-pattern scan (single new credential endpoint, not a repeated operator substitution). Remains 1-wave HOLD (VERIFY-PRINCIPLES rule 2 candidate — now blocked by obs-2 promotion to same slot; if obs-2 is promoted first, this becomes slot-3 pending). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED this wave. This is a valid feature wave (M6 first slice, non-override-ship). No P-1 log gap. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 3 candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED this wave. No entropy scanner interaction at C-1 (clean CI, no gitleaks match). Remains 3-wave HOLD (CI-PRINCIPLES rule 7 candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED this wave. No CI-config fix cycle occurred. Remains 3-wave HOLD (CI-PRINCIPLES rule 7/8 candidate). |
| wave-28 | obs-4 | V-block spec-GAP vs spec-drift: classify before acting | CONFIRMED as 2ND INSTANCE this wave (wave-31 obs-2). See obs-2 above. PROMOTABLE. Wave-28 obs-4 HOLD is resolved by promotion. |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED this wave. No EXPLAIN-based integration test authored. Remains HOLD (T-4 rule 1 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED this wave. No performance wave. Remains HOLD (T-7 rule 1 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 live E2E caught it | NOT CONFIRMED this wave. No store-keyed unit fixture; T-5 live-connect deferred (creds). Remains HOLD (T-2 rule 2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED this wave. No date-dependent test authored. Remains HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal 5 — Insert/mint-before-side-effect and accept-track-observe disposition patterns
(checking wave-30 obs-2/obs-3):**
The INSERT-RETURNING-gated cron side-effect pattern (wave-30 obs-2) has no analog in
wave-31 — no cron and no external side-effect gate. The accept+track+observe disposition
(wave-30 obs-3) also does not match — the 404→403 finding was a security-correct fix
(spec-GAP), not a spec-consistent design trade-off. Neither recurs. Both remain 1-wave HOLDs.

**Signal 5 continuation — audio-scoped grant (canPublishSources: [MICROPHONE]) as standalone
BUILD/security candidate:**
The P2 finding at B-6 (canPublish:true grants video+screen-share; fix: canPublishSources
scoped to MICROPHONE only) is a correct security minimization. However, this is a specialization
of the general principle "issue the minimum-authority credential the client needs" — a security
first-principle already well-established in the broader security literature and in BUILD rule 4
(adversarial reproduction at B-6 Phase 2 is what caught it). The pattern is correct but
insufficiently distinctive from BUILD rule 4 (which mandated the adversarial pass that caught
it) to justify a standalone L-2 observation. The finding is narrow (audio-scoped JWT grant
for a voice-only SDK) without a clear generalization beyond "use minimal-authority tokens."
DROPPED as too narrow and not falsifiable as a standalone checklist item distinct from
BUILD rule 4's adversarial pass mandate.

---

## Summary table

| id    | title (short)                                                                         | severity      | recurrence   | candidate file              | disposition                                                                                     |
|-------|---------------------------------------------------------------------------------------|---------------|--------------|-----------------------------|-------------------------------------------------------------------------------------------------|
| obs-1 | Credential-endpoint gate: check membership before loading or branching on resource    | strong        | 1st instance | BUILD-PRINCIPLES            | HOLD — rule 9 candidate; promote on 2nd confirming wave (gate catch or spec-mandate on a credential endpoint) |
| obs-2 | V-2 spec-GAP vs spec-drift: more-correct deployed behavior amends spec, not code      | strong        | 2nd instance | VERIFY-PRINCIPLES           | PROMOTABLE — VERIFY rule 2 candidate; 2nd instance confirmed (w28 obs-4 + w31); beats competing 1st-instance HOLDs for slot 2 |
| obs-3 | Credential-independent build for external-SDK features; defer live-verify to T-5/C-2 | informational | 1st instance | PRODUCT-PRINCIPLES          | HOLD — rule 3 candidate; promote on 2nd confirming wave where P-0/P-4 explicitly names the deferral path |
| obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() with memoized Promise | warning     | 1st instance | BUILD-PRINCIPLES            | HOLD — rule 9/10 candidate; promote on 2nd confirming wave (ESM-only dep in CJS service) |

**Observations emitted: 4**
**Severities: 2 strong (obs-1, obs-2), 1 warning (obs-4), 1 informational (obs-3)**
**Candidate files: BUILD-PRINCIPLES (obs-1, obs-4), VERIFY-PRINCIPLES (obs-2), PRODUCT-PRINCIPLES (obs-3)**
**Dropped: Signal 5 continuation (audio-scoped grant — too narrow, covered by BUILD rule 4); Signal 5 prior-wave (insert/cron and accept+track+observe — no recurrence)**

---

## Promotion candidate flags for karen

**obs-2 is the only promotion candidate this wave.**

obs-2 is a 2nd-instance confirmation of wave-28 obs-4 ("spec-GAP vs spec-drift: classify
before acting; more-correct deployed behavior amends spec, not code"). Both instances share
the same resolution axis: jenny classifies the divergence as spec-GAP at V-1, V-2 queues
spec-doc reconciliation (zero code), V-3 executes 0 production LOC. Head-verifier re-verified
this instance independently. The candidate rule (now matured across two waves) beats the
competing 1st-instance HOLDs for VERIFY-PRINCIPLES slot 2 (wave-29 obs-2 and wave-30 obs-3).

Candidate rule shape (VERIFY rule 2) — from wave-28 obs-4, unchanged:
  2. At V-2 triage, classify each spec-divergence finding as spec-GAP or spec-drift
     before routing; a more-correct deployed behavior amends the spec, not the code.
     Why: Treating a spec-GAP as spec-drift adds code churn that makes an implementation
     inconsistent with its siblings at zero consumer benefit.

Ready for karen vetting + head-verifier approval before write to VERIFY-PRINCIPLES.

**Note on competing VERIFY-PRINCIPLES slot-2 candidates after obs-2 promotion:**
Once obs-2 is promoted to VERIFY rule 2, wave-29 obs-2 (V-3 pattern scan beyond named
sites) and wave-30 obs-3 (accept+track+observe disposition) lose their slot-2 candidacy.
They would need slot 3, which does not yet exist. Both remain as 1st-instance HOLDs
awaiting a 2nd confirming instance AND a new slot in VERIFY-PRINCIPLES (opened when a
third rule is promoted). This should be noted at the next L-2 where either confirms.

**obs-1** (BUILD rule 9 candidate): strongest new HOLD this wave. A P1 security finding
caught by the B-6 adversarial pass, live-proven in prod. The pattern (RBAC/membership
before any discriminating load) is deterministically falsifiable at B-6 Phase 2 for
any credential-issuing endpoint.

**obs-4** (BUILD rule 9/10 candidate): generalizable to any ESM-only dep in a CJS
service. Two P2 defects prevented (concurrent-call race + import-failure → wrong status).
Lower severity than obs-1 (warning vs strong) so obs-1 takes the slot if both confirm
simultaneously.

**obs-3** (PRODUCT rule 3 candidate): informational because the disposition worked
cleanly (no wave was blocked, no false escalation). Value is in naming the pattern
so future P-0/P-4 gates can apply it deliberately. Competes with wave-29 obs-1
(operator-fix plan precision, gate REWORK measured) for the same slot; wave-29 obs-1
has priority (warning vs informational AND measured gate cost).
