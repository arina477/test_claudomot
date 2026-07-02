# Wave 35 — L-2 Distill Observations

Synthesized from wave-35 artifacts (M7 privacy controls + Sentry observability; PR #49 merge
0c71585; V-block APPROVED first round — V-2 triage returned 0 blocking findings, V-3
fast-fix skipped). Inputs read: P-2-spec.md, P-3-plan.md, P-4-gemini-review.md (UNAVAILABLE
— HTTP 429; gate proceeded on karen + jenny per Phase-2 rule), blocks/P/gate-verdict.md,
B-6-review.md, blocks/B/gate-verdict.md, C-2-deploy-and-verify.md, V-1-karen.md,
V-1-jenny.md, V-2-triage.md, V-3-fast-fix.md, blocks/V/gate-verdict.md,
command-center/dev/SDK-Docs/Sentry/sentry.md.
Prior archives consulted: process/waves/_archive/wave-{31,32,33,34}/blocks/L/observations.md.
Principles files read: PRODUCT-PRINCIPLES (3 rules), CI-PRINCIPLES (6 rules),
BUILD-PRINCIPLES, DESIGN-PRINCIPLES (absent — no file exists in this project yet).

---

```yaml
observations:

  - id: obs-1
    summary: >
      When a feature ships two settings options whose enforcement behavior is identical on
      every currently-live surface, the rendered UI must not present both as distinct,
      independently meaningful choices. In wave-35 the profile-visibility enum carried
      three values (everyone | server-members | nobody), but the only live cross-user
      surface (the member roster) is always co-member-scoped — so `everyone` and
      `server-members` both cause a user to appear in every co-member's roster. A selector
      offering both options would be privacy-theater: users believe they control their
      exposure while the setting has no differentiated effect. Karen's P-4 Phase-2 review
      identified this as a non-blocking Medium and it was elevated to a binding acceptance
      criterion before B-block: the rendered control must collapse behaviorally-identical
      enum values to one option ("Visible to classmates" → `everyone`) while the
      server-side enum stays 3-valued (locked for the future DM guard, feature #21). A
      companion B-6 Phase-2 finding (L2) confirmed the same class can appear in help text:
      a footnote falsely claimed organizers retain visibility even when set to Hidden, a
      direct contradiction of the nobody-hidden-from-all enforcement. Both the selector
      collapse and the footnote correction were applied before shipping (commit c27c4ae).
      Karen and jenny independently confirmed the anti-privacy-theater ACs were satisfied
      in the shipped product. The generalizable class: before authoring a privacy-adjacent
      settings selector, enumerate every live surface that enforces it and verify whether
      any two option values produce identical real-world outcomes on all of them; if so,
      collapse those options or add explicit equivalence copy rather than presenting them
      as independent controls.
    source:
      - process/waves/wave-35/blocks/P/gate-verdict.md
        # Phase-2 karen (non-blocking Medium): "visibility selector `everyone`≡`server-members`
        #   on the only live surface → potential privacy-theater in the selector."
        # Footer: "Added HONEST VISIBILITY SELECTOR AC (karen) — rendered control must not
        #   present `everyone`/`server-members` as two live-but-identical choices; enum stays
        #   3-valued server-side (locked for feature #21), UI collapses to behaviorally-honest
        #   options today."
      - process/waves/wave-35/stages/B-6-review.md
        # Phase-2 code-reviewer L2: "false organizer-visibility copy — privacy-theater —
        #   FIXED (c27c4ae)."
        # "footnote falsely claimed organizers retain visibility, contradicting
        #   nobody-hidden-from-all enforcement — privacy-theater."
      - process/waves/wave-35/stages/V-1-karen.md
        # F8: "Honest visibility selector: SettingsPrivacyPage.tsx:36-43 renders only
        #   `Visible to classmates` (→`everyone`) and `Hidden` (→`nobody`). No two options
        #   behave identically on-screen. Anti-privacy-theater standard met."
      - process/waves/wave-35/stages/V-1-jenny.md
        # "HONEST SELECTOR AC (karen P-4 binding) — SATISFIED. Deployed UI renders exactly
        #   TWO enabled radios... `server-members` absorbed into `Visible` on read... No two
        #   options behave identically on-screen. Anti-privacy-theater standard met."
    severity: strong
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "two settings options behave identically on every live surface →
      rendered selector is privacy-theater" class in L-2 history.

      The generalizable check: for each option pair in a privacy-adjacent settings selector,
      identify the enforcement surface(s) in the plan and ask whether the two values produce
      different query results, response shapes, or enforcement actions on any current live
      surface. If no live surface distinguishes them, the options must be collapsed in the
      UI or annotated as equivalent. The cost of the miss is highest on privacy-labeled
      controls, where users reasonably assume their choice has effect.

      Near-dup check against PRODUCT-PRINCIPLES rules 1-3: rule 1 addresses verifying seed
      claims about what exists (P-0); rule 2 addresses verifying the named target entity
      (P-0); rule 3 addresses credential-independent builds. None address identical-behavior
      privacy options. No near-dup.

      HOLD. Promote to PRODUCT-PRINCIPLES rule 4 on second confirming wave where a reviewer
      identifies two identically-behaving options in a privacy-adjacent selector (at P-4 or
      B-6), OR where an explicit per-option-pair behavior check prevents the class from
      shipping. Note: wave-33 obs-1 and wave-29 obs-1 are also PRODUCT-PRINCIPLES rule 4
      candidates (first instances); this obs-1 is the most recent and has measured gate
      cost (P-4 binding AC elevation + B-6 fix commit).
    promotion_gates:
      generalizable: true
        # Applies at P-2/P-4 for any settings selector with N enum values where the spec
        # does not enumerate behavioral differences per option, per live surface.
        # The check: for each option pair (X, Y), is there at least one live surface where
        # choosing X produces a different server response or enforcement action than Y?
        # A spec that ships N options without this per-pair verification fails the check.
      falsifiable: true
        # Checkable at P-4 and B-6: for each option pair in a privacy-adjacent selector,
        # name the enforcement surface in the plan and assert that the two values produce
        # DIFFERENT outcomes on it. A selector presenting `everyone` and `server-members`
        # as independent options without identifying a live surface where they differ fails
        # this rule. Verification: grep the plan's enforcement surface section for each
        # option value and confirm at least one conditional branch distinguishes them.
      cited: true
        # P/gate-verdict.md (Phase-2 karen Medium; "privacy-theater" named; elevated to
        #   binding AC before B-block); B-6-review.md Phase-2 L2 (help-text theater instance
        #   caught and fixed, commit c27c4ae); V-1-karen.md F8 + V-1-jenny.md (independent
        #   live confirmations of anti-theater ACs in the shipped product).
    candidate_rule_shape: >
      [target: PRODUCT-PRINCIPLES rule 4]
      Before shipping a settings selector, confirm each option pair has distinct behavior
      on at least one live surface; collapse identical-behavior pairs in the UI.
      Why: An option that behaves identically to another on every live surface is
      privacy-theater: users believe they control exposure while the setting has no effect.
    promotion_status: HOLD. First instance. Promote to PRODUCT-PRINCIPLES rule 4 on second
      confirming wave where a reviewer identifies or prevents two identically-behaving options
      from shipping in a privacy-adjacent settings selector.


  - id: obs-2
    summary: >
      The P-2 spec's structured `data:` contract (in the YAML head of tasks.description
      for the seed task) specified a dedicated `privacy_settings` table with its own PK/FK
      and `updated_at`. The P-3 plan independently arrived at a different, correct
      architecture: two additive columns on the existing `users` table, explicitly rejecting
      the separate table ("adds a join + a table for two scalar prefs, against convention").
      The two artifacts described incompatible data models for the same wave. Because
      tasks.description is the source of truth from which B-0 claims against (always-on
      rule 7), a builder reading the spec would construct a `privacy_settings` table while
      B-1's file steps modified `users.ts` — a guaranteed build-time divergence. The P-4
      gate (attempt 1) returned REWORK: "Heuristic fired: H-P-05 spec-vs-plan drift on a
      load-bearing data contract." The fix was narrow: align the spec's `contracts.data`
      line to the plan's settled model (columns on `users`, not a separate table). P-3 was
      re-confirmed with no substantive change needed; B-6 was APPROVED on first attempt,
      confirming the corrected spec and plan agreed throughout the build. The generalizable
      class: when P-3 authors or explicitly documents an architecture decision that determines
      the data model, P-2's structured `data:` contract must reflect the same model verbatim
      before the P-4 gate passes. The failure mode is that P-2 and P-3 are written with
      shared intent but independently, so the spec may carry an early design sketch
      (dedicated table) while the plan arrives at the final convention-driven choice
      (columns on an existing table). The verification step is mechanical: at P-4, compare
      the spec's `contracts.data` field with the plan's § Data model or § Architecture
      deltas section and assert they describe the same table(s) and column(s).
    source:
      - process/waves/wave-35/blocks/P/gate-verdict.md
        # Attempt-1 REWORK: "the spec contract's structured `data:` field for the seed
        #   hard-specifies a separate `privacy_settings` table... while the P-3 plan explicitly
        #   rejects that table and commits to two additive columns on the existing `users`
        #   table... a guaranteed build-time divergence."
        # "Heuristic fired: H-P-05 spec-vs-plan drift on a load-bearing data contract."
        # Attempt-2 APPROVED: "The attempt-1 REWORK defect is resolved. The seed's structured
        #   `contracts.data` line... now specifies exactly the data model P-3 builds —
        #   two additive columns on the existing users table."
      - process/waves/wave-35/stages/P-2-spec.md
        # "Rework note (attempt-1): Spec `data:` contract corrected to columns-on-`users`
        #   (matches P-3). Source of truth = tasks.description of 56a50862."
      - process/waves/wave-35/stages/P-3-plan.md
        # § Architecture deltas: "separate `privacy_settings` table — rejected: adds a join +
        #   a table for two scalar prefs, against convention."
        # § Data model: "users + profile_visibility text NOT NULL DEFAULT 'everyone',
        #   who_can_dm text NOT NULL DEFAULT 'everyone'. One drizzle-kit-generated migration."
    severity: warning
    candidate_principles_file: command-center/principles/PRODUCT-PRINCIPLES.md
    recurrence: >
      1ST INSTANCE of the "P-2 structured data: contract describes a different schema than
      the P-3 architecture decision; P-4 REWORK required" class in L-2 history.

      Near-dup check against PRODUCT-PRINCIPLES rules 1-3: rule 1 verifies seed claims about
      what exists in the code (P-0); rule 2 verifies the target entity is the right cost
      source (P-0). Neither addresses spec↔plan data model consistency as a P-4 gate check.
      No near-dup.

      The candidate check is mechanical and fast: at P-4, extract the spec's `contracts.data`
      field from tasks.description and the plan's § Data model / § Architecture deltas.
      If one names a dedicated table and the other names columns on an existing table, REWORK.
      The heuristic H-P-05 already fires this; the question is whether it becomes a
      permanent PRODUCT-PRINCIPLES rule.

      HOLD. Promote to PRODUCT-PRINCIPLES on second confirming wave where P-4 issues a REWORK
      for spec↔plan data-model inconsistency, OR where an explicit diff check at P-4
      explicitly prevents the divergence from reaching B-block.
    promotion_gates:
      generalizable: true
        # Applies at P-4 whenever a wave introduces new persisted state via a spec data:
        # contract AND P-3 contains a § Data model or § Architecture deltas section.
        # The check: do the spec contracts.data field and the plan data model describe
        # the same table(s), column(s), and migration strategy?
      falsifiable: true
        # Checkable at P-4: extract the spec seed's `contracts.data` value and the plan's
        # data model section. If one names a dedicated table (own PK/FK) and the other
        # names additive columns on an existing table, the check fails. A P-4 gate verdict
        # that approves without asserting spec↔plan data-model agreement fails this rule
        # when the two artifacts describe different schemas.
      cited: true
        # P/gate-verdict.md attempt-1 (REWORK; H-P-05 fired; "guaranteed build-time divergence"
        #   stated explicitly); P-2-spec.md rework note (corrected to columns-on-users);
        #   P-3-plan.md (table rejected + columns-on-users settled; B-6 APPROVED first attempt
        #   confirming corrected spec + plan agreed through build).
    candidate_rule_shape: >
      [target: PRODUCT-PRINCIPLES next open slot — rule 4 if no prior candidate promotes first]
      At P-4, assert the spec contracts.data field and the plan data model name the same
      tables and columns; REWORK if they describe different schemas.
      Why: A spec data: contract naming a different schema than the plan creates a guaranteed
      build-time divergence when B-0 builds from the spec.
    promotion_status: HOLD. First instance. Promote on second confirming wave where P-4 REWORK
      fires for spec↔plan data-model inconsistency, OR where an explicit P-4 data-model diff
      check prevents the divergence from reaching B-block. Note: if wave-35 obs-1 (strong)
      also reaches a second instance first, the cap (1 rule promoted per file per wave)
      requires sequencing; obs-1 takes priority by severity.


  - id: obs-3
    summary: >
      Three integration constraints are specific to @sentry/nestjs@v10 (OTel-based) and
      @sentry/react and must be respected to avoid silent misbehavior:
      (1) Instrument-first ordering. `import './instrument'` must be the FIRST statement in
      apps/api/src/main.ts and apps/web/src/main.tsx, before NestFactory, createRoot, and
      every other import. @sentry/nestjs v8+ uses OpenTelemetry auto-instrumentation that
      patches modules at import time; if Sentry.init() runs after other modules load,
      per-request spans are silently absent — no error, no warning.
      (2) Exception filter decorator, not a competing global filter. For an app that already
      has a custom NestJS @Catch() filter (SupertokensExceptionFilter), add
      @SentryExceptionCaptured() to its catch() method. Do NOT add SentryGlobalFilter — it
      competes with the custom filter and does not capture HttpException (401/404/422, which
      are control flow, not bugs).
      (3) VITE_ prefix required for the browser DSN. Vite only exposes VITE_-prefixed env
      vars to the bundle via import.meta.env. Passing SENTRY_DSN (without prefix) resolves
      to undefined in the browser bundle — silently no events, no crash. No-op-when-unset
      is safe by design (app boots normally, credential-independent per PRODUCT rule 3).
      All three constraints are captured in the project SDK-doc at
      command-center/dev/SDK-Docs/Sentry/sentry.md. This is an SDK integration gotcha,
      not a generalizable process principle.
    source:
      - command-center/dev/SDK-Docs/Sentry/sentry.md
        # "call ONCE from apps/api/src/instrument.ts, imported as the FIRST line of main.ts
        #   (before NestFactory / any other import). v8+ uses OpenTelemetry auto-instrumentation;
        #   init-after-import = silently no per-request spans."
        # "@SentryExceptionCaptured() ... USE THIS for StudyHall — the app already has
        #   SupertokensExceptionFilter. Do NOT add for StudyHall (would compete with
        #   SupertokensExceptionFilter; use the decorator instead)."
        # "VITE_SENTRY_DSN ... Vite only exposes VITE_-prefixed via import.meta.env.
        #   SENTRY_DSN is silently undefined in the bundle."
      - process/waves/wave-35/stages/B-2-backend.md
        # devops-engineer (d40ece71): "main.ts: `import './instrument'` as line 1 (before all).
        #   @SentryExceptionCaptured() on SupertokensExceptionFilter.catch()
        #   (no competing SentryGlobalFilter)."
      - process/waves/wave-35/stages/V-1-karen.md
        # F1 deviation: "`import './instrument'` MUST be the first import so the SDK
        #   instruments before other modules load; confirmed as line 1 of both
        #   apps/api/src/main.ts and apps/web/src/main.tsx."
      - process/waves/wave-35/stages/B-6-review.md
        # Phase-2 code-reviewer: "@SentryExceptionCaptured correctly skips HttpExceptions
        #   (verified against @sentry/nestjs@10.63.0 source)."
    severity: informational
    candidate_principles_file: none (SDK-doc only — finding lives in command-center/dev/SDK-Docs/Sentry/sentry.md)
    promotion_status: NOT A PRINCIPLES CANDIDATE. SDK-specific to @sentry/nestjs@v10 /
      @sentry/react at this version. All three constraints are authored in the SDK-doc at
      command-center/dev/SDK-Docs/Sentry/sentry.md (task d40ece71, authored at B-2).
      No principle generalizable beyond the Sentry v10 SDK. No recurrence tracking needed.


  - id: obs-4
    summary: >
      Railway services in this project are NOT git-connected (repoTriggers.edges = []).
      A dashboard/GraphQL "redeploy" on a non-git-connected service rebuilds the EXISTING
      source snapshot rather than the merged commit. This produces a genuine new image digest
      and a deployment-state SUCCESS — both of which a naive gate treats as proof of a fresh
      build — while the served artifact contains none of the merged changes.

      Wave-34 discovered this class via a false-green at V-3 fast-fix: the C-2 gate
      asserted only (a) deployment-state SUCCESS and (b) new digest != baseline digest.
      Karen and jenny independently fetched the live bundle and grepped for change-unique
      markers; both found 0/0 occurrences (stale bundle behind a green gate). Root cause:
      `serviceInstanceDeployV2` on a non-git-connected service re-serves the existing source
      snapshot. Correction: `railway up --service web` (CLI-push model, uploads and builds
      the local merged tree). A served-bundle content assertion was identified as the
      load-bearing verification step.

      Wave-35 applied both lessons explicitly. C-2 stated: "A dashboard/GraphQL 'redeploy'
      re-serves the STALE image (false green, bit us in wave-34). Both changed services were
      force-rebuilt from merged main via railway up." C-2 Check 4 performed a served-bundle
      content assertion with three wave-35-unique markers, explicitly noting "wave-34 lesson:
      digest-diff is NOT enough"; all three markers were present at matchcount 1/1/1 in the
      live bundle. Wave-35 added a confirmed sub-lesson absent from wave-34: the api
      DATABASE_URL uses a Railway private DNS (postgres.railway.internal) unreachable from
      outside the Railway network; migrations must be applied via the Postgres service's
      DATABASE_PUBLIC_URL (TCP proxy) BEFORE the new api image begins serving. Both services
      were deployed via CLI push and both content assertions passed; no stale-serve occurred.

      Two-wave recurrence (wave-34: discovered/near-miss; wave-35: applied/confirmed)
      satisfies the promotion bar. The rule covers: (a) deploy mechanism — railway up CLI
      push, not GraphQL/dashboard redeploy; (b) verification gate — served-bundle content
      assertion, not deployment-state + digest-diff; (c) migration ordering — apply
      migrations via the public TCP proxy URL before the new api code begins serving.
    source:
      - process/waves/wave-35/stages/C-2-deploy-and-verify.md
        # Deploy model: "A dashboard/GraphQL 'redeploy' re-serves the STALE image (false
        #   green, bit us in wave-34). Both changed services were force-rebuilt from merged
        #   main via railway up."
        # Check 4: "web served-bundle CONTENT assertion (wave-34 lesson: digest-diff is NOT
        #   enough). Served bundle: /assets/index-B_iPgjvp.js — Takes effect when direct
        #   messages arrive: 1, studyhall-account-data: 1, Download my data: 1.
        #   ≥1 marker present across THREE independent strings → the served bundle is the
        #   NEW wave-35 bundle."
        # Migration: "api service DATABASE_URL points at postgres.railway.internal (private
        #   DNS) — unreachable from a local railway run... Resolved by using the Postgres
        #   service's DATABASE_PUBLIC_URL (TCP proxy yamanote.proxy.rlwy.net:40008)."
        # "Migration applied explicitly, in order, BEFORE the new code began serving."
      - process/waves/_archive/wave-34/blocks/L/observations.md
        # obs-1: "for any Railway service that is NOT git-connected, a GraphQL redeploy must
        #   never be used as the deploy mechanism, and a digest-diff gate is insufficient as
        #   the deploy-verification signal — the load-bearing check is whether a change-unique
        #   marker (from the merged source) is present in the bytes the live CDN/edge is
        #   actually serving."
        # "Karen and jenny independently fetched the live /assets/index-*.js bundle and
        #   grepped it for the two fast-fix-unique markers; both were absent (0/0) from the
        #   1,557,244-byte stale bundle."
        # promotion_status: "HOLD. First instance. Promote to CI-PRINCIPLES rule 7 on second
        #   confirming wave where a non-git deploy gate passes on digest-diff while the served
        #   bundle lacks the change, or where a content assertion catches the gap."
    severity: strong
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      2ND INSTANCE — CONFIRMED. Wave-34: discovered (false-green deploy; stale bundle served
      behind deployment-state SUCCESS + new digest; near-miss caught by karen + jenny at
      V-3 re-verify). Wave-35: applied (explicit `railway up` CLI push for both changed
      services; served-bundle content assertion with 3 independent markers confirmed live;
      migration applied before api boot via public TCP proxy URL).

      Both waves confirm that for non-git-connected Railway services: (a) the deploy
      mechanism must be CLI push (`railway up`), not a GraphQL/dashboard snapshot redeploy;
      (b) the verification gate must assert a change-unique string is present in the
      actually-served bundle — deployment-state SUCCESS + digest-diff is not sufficient.
      Wave-35 adds the confirmed migration sub-lesson: apply drizzle migrations via the
      DATABASE_PUBLIC_URL (external TCP proxy) BEFORE the new api image serves, because
      the private DNS endpoint (postgres.railway.internal) is unreachable from outside
      Railway's private network.

      Near-dup check against CI-PRINCIPLES rules 1-6:
      Rule 1 (verify via platform deployment-state endpoint, not /health) — orthogonal:
        deployment-state can report SUCCESS while serving stale content; the content
        assertion is a second, non-redundant check.
      Rule 2 (probe new-only route for 401-not-404 after SUCCESS) — adjacent but different:
        catches "module not deployed" (404 on a new route); obs-4 catches "stale bundle
        served" (200 from the old bundle on an existing route). Different failure class.
      Rules 3-6: CI merge gating, formatter, integration job count, CI on push.
        None address non-git deploy mechanism or served-bundle content assertion.
      No near-dup. CI-PRINCIPLES slot 7 is open.

      Memory note `railway-deploy-is-cli-push-not-git-trigger.md` encodes the mechanism
      (use railway up, not git-trigger). This observation encodes the GATE (verify the
      mechanism produced a real build by asserting content, not just digest). The two are
      complementary: the memory note prevents the wrong mechanism; this observation prevents
      the gate from falsely passing when the wrong mechanism is used. Orthogonal layers,
      no near-dup.
    promotion_gates:
      generalizable: true
        # Applies at C-2 (or V-3 fast-fix re-deploy) for any Railway service where
        # repoTriggers.edges = [] (not git-connected). After deploying via railway up,
        # the gate must: (1) confirm mechanism was CLI push, not GraphQL/dashboard redeploy;
        # (2) fetch the live-served JS bundle root HTML → extract index-*.js path → fetch
        # that bundle; (3) grep for at least one string unique to the merged change;
        # (4) assert matchcount >= 1. For api services with schema changes: also assert
        # migrations ran before new api code served (ordered, confirmed against live DB).
      falsifiable: true
        # Checkable at C-2: a gate declaring SUCCESS with only (a) deployments[0].status
        # == SUCCESS and (b) new imageDigest != old imageDigest, WITHOUT a served-bundle
        # content assertion, fails this rule for a non-git-connected Railway service.
        # Test: curl <live-web-root> → grep src="/assets/index-*.js" → curl that bundle →
        # grep for a change-unique string. Absence (matchcount 0) = gate must FAIL.
      cited: true
        # C-2-deploy-and-verify.md: "wave-34 lesson: digest-diff is NOT enough"; Check 4
        #   with 3 markers at 1/1/1; migration via public TCP proxy before api boot;
        # wave-34/blocks/L/observations.md obs-1: original discovery with full false-green
        #   trace; root cause (GraphQL snapshot redeploy = stale build from same source);
        #   proposed candidate rule shape (CI-PRINCIPLES rule 7). Two-wave confirmation
        #   meets promotion criteria.
    candidate_rule_shape: >
      [target: CI-PRINCIPLES rule 7]
      For non-git-connected Railway services, assert a change-unique marker is present in
      the served bundle after deploy; deployment-state SUCCESS + digest-diff is not sufficient.
      Why: A snapshot redeploy yields a new digest from the same source, serving stale
      code behind a green gate.
      Rule line = 121 chars; if linter enforces <= 120: "For non-git Railway services,
      assert a change-unique marker in the served bundle; digest-diff alone is a
      false-green." (83 chars). Why line at 100 chars: "A snapshot redeploy builds the
      same source into a new digest, serving stale code behind a green gate." (89 chars).
    promotion_status: PROMOTE. Two confirming waves (wave-34 discovered/near-miss;
      wave-35 applied/confirmed). Strong severity in both waves. Proven false-green mechanism
      with multi-reviewer independent verification (wave-34) and explicit lesson-application
      with content assertion (wave-35). Meets 2+ wave bar, binary/falsifiable gate check,
      non-trivial cost (stale deploy would have shipped unreachable code behind a green CI).
      Promote to CI-PRINCIPLES rule 7 per L-2 promotion path (head-ci-cd approves + karen
      vets rule shape).
```

---

## Prior held observations — second-instance status (wave-30 through wave-34)

| origin | obs | class | wave-35 status |
|--------|-----|-------|----------------|
| wave-34 | obs-1 | Non-git Railway redeploy yields false-green; digest-diff gate insufficient; served-bundle content assertion required | **CONFIRMED — now wave-35 obs-4. PROMOTION CANDIDATE.** Applied at C-2 (CLI push for both services; 3-marker content assertion; migration before boot). 2-wave recurrence met. Promote to CI-PRINCIPLES rule 7. |
| wave-34 | obs-2 | D-3 gate checked brief states but not brief interactions; named entry control omitted from mockup | NOT CONFIRMED. Wave-35 is a backend+privacy wave; `design_gap_flag=false`, no D-block. Remains 1-wave HOLD (DESIGN-PRINCIPLES / D-3 rubric candidate). |
| wave-33 | obs-1 | Plan names a framework-specific error class absent from the actual stack; P-4 catches it | NOT CONFIRMED. Wave-35 P-4 REWORK was a data-model divergence (obs-2 above), not an error-class naming error. Remains 1-wave HOLD (PRODUCT-PRINCIPLES rule 4 candidate). |
| wave-33 | obs-2 | Error-mapping fix must fire against a real upstream error from the actual code path, not a unit-constructed mock | NOT CONFIRMED. No error-mapping fix cycle this wave. Remains 1-wave HOLD (VERIFY rule 3 candidate). |
| wave-33 | obs-3 | Clone the shipped error-walk helper depth for new error codes on the same stack | NOT CONFIRMED. No new pg error-code mapping authored. Remains 1-wave HOLD (BUILD candidate). |
| wave-32 | obs-1 | Wiring new api method into existing component invalidates explicit-enumeration mock factory | NOT CONFIRMED. Wave-35 adds new api methods (`getPrivacy`, `putPrivacy`, etc.) but SettingsPrivacyPage is a new component (not an existing one being modified). No explicit-enumeration mock staleness observed. Remains 1-wave HOLD (BUILD slot 9 candidate). |
| wave-32 | obs-3 | Typed api-client method added but consumer fetches inline in parallel | NOT CONFIRMED. `api.ts` methods added and consumed by SettingsPrivacyPage (same wave author, no inline-fetch race). Remains 1-wave HOLD (BUILD candidate). |
| wave-31 | obs-1 | Credential-endpoint gate: membership check before load/type-discriminator on credential-issuing endpoints | NOT CONFIRMED. New endpoints (`/profile/privacy`, `/profile/data`) are data-privacy, not credential-issuing; existing voice-token gate order unchanged. Remains 2-wave HOLD (BUILD rule 9 candidate). |
| wave-31 | obs-4 | ESM-only npm package in CJS service: lazy-cached dynamic import() bridge | NOT CONFIRMED. @sentry/nestjs@10 and @sentry/react@10 are CJS-compatible; no ESM-only bridge needed. Remains 2-wave HOLD (BUILD candidate). |
| wave-30 | obs-1 | LEFT JOIN + IS DISTINCT FROM for nullable-FK exclusion mirroring app-code ?? default | NOT CONFIRMED. No DB query on a nullable FK status table. Remains 3-wave HOLD (BUILD candidate). |
| wave-30 | obs-2 | INSERT-RETURNING-gated external side effect for at-most-once cron delivery | NOT CONFIRMED. No cron or background job with external side effect. Remains 3-wave HOLD (BUILD candidate). |
| wave-30 | obs-3 | Accept + track + observe: dispose a spec-consistent design-limitation finding | NOT CONFIRMED. V-2 triage had 0 blocking; all non-blocking findings carried forward tasks (not accepted-design-limitation dispositions). Remains 3-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-1 | Plan-level operator fix must lock a single expression form and exclude wrong candidates | NOT CONFIRMED. No operator-fix shorthand in plan; P-4 REWORK was data-model. Remains 4-wave HOLD (PRODUCT rule 4 candidate). Note: wave-33 obs-1 and wave-35 obs-1 and obs-2 are also PRODUCT rule 4 candidates; wave-35 obs-1 is the most recent and has measured gate cost. |
| wave-29 | obs-2 | V-3 head-verifier pattern scan beyond named sites catches reviewer-missed occurrence | NOT CONFIRMED. V-3 was skipped (fast_fix_queue empty). Remains 4-wave HOLD (VERIFY rule 3 candidate). |
| wave-29 | obs-3 | Override-ship log gap: P-1 entry missing from product-decisions.md | NOT CONFIRMED. Valid M7 feature wave; no override-ship. Remains 4-wave HOLD (PRODUCT candidate). |
| wave-28 | obs-1 | Entropy scanner false-positives on model-authored transcript directories | NOT CONFIRMED. No gitleaks interaction (clean CI). Remains 5-wave HOLD (CI candidate). |
| wave-28 | obs-2 | CI-config fix pushed unverified reproduces identical failure | NOT CONFIRMED. No CI-config fix cycle. Remains 5-wave HOLD (CI candidate). |
| wave-27 | obs-1 | EXPLAIN test on small-seeded table needs enable_seqscan=off | NOT CONFIRMED. No EXPLAIN-based integration test. Remains 6-wave HOLD (T-4 candidate). |
| wave-27 | obs-3 | Perf wave: spec structural proofs sufficient for T-7, no load test | NOT CONFIRMED. No performance wave. Remains 6-wave HOLD (T-7 candidate). |
| wave-26 | obs-1 | Unit fixture seeds store with value real producer excludes; T-5 caught it | NOT CONFIRMED. No store-keyed unit fixture. Remains 7-wave HOLD (T-2 candidate). |
| wave-26 | obs-3 | Hard-coded date fixture without clock-mock rots as wall-time advances | NOT CONFIRMED. No date-dependent test authored. Remains 7-wave HOLD (T-2 candidate). |

---

## Signals evaluated and dropped

**Signal: V-2 0-blocking triage is itself a win (first wave with no fast-fix):**
V-2 returned 0 blocking findings and V-3 Phase 2 was skipped. The wave's clean V-block pass
is attributable to the binding ACs (honest selector + who-can-DM disabled) being enforced in
spec before B-block began. This is correct gate behavior, not a new observation — the interesting
events (privacy-theater catch at P-4, spec REWORK at P-4) are captured in obs-1 and obs-2
above. No standalone observation value in the 0-blocking count itself. DROPPED.

**Signal: Multi-spec wave (4 tasks) with only 1 P-4 REWORK round:**
The P-4 REWORK touched one `data:` line in one seed task's YAML head; the other three spec
blocks (a4169fac, d40ece71, 13b7ebfd) required no changes. B-6 was APPROVED first attempt.
This is correct gate behavior with a narrow rework — the interesting event is the
spec↔plan divergence mechanism, captured in obs-2. The 1-round count itself has no new
principle. DROPPED.

**Signal: Gemini P-4 reviewer UNAVAILABLE (HTTP 429 rate limit):**
Gemini returned HTTP 429 at P-4 Phase 2. The gate proceeded on karen + jenny per the
Phase-2 gate rule (helper already retried once; gate is non-blocking on Gemini unavailability).
No product impact. This is a tooling-availability gap, not a process observation. Note to
L-block: if Gemini is unavailable at P-4 Phase 2 on a subsequent wave, confirm retry was
attempted before treating it as non-blocking. DROPPED as a one-off availability event.

**Signal: Migration applied via public TCP proxy (not private DNS):**
The api DATABASE_URL uses postgres.railway.internal (private DNS) unreachable from outside
Railway's private network. Migrations were applied via DATABASE_PUBLIC_URL (TCP proxy). This
is a correct operational procedure and is documented in C-2. It is absorbed as a sub-lesson
into obs-4 (migration-ordering-before-deploy, wave-34 reinforced class), not a standalone
observation. DROPPED as a sub-lesson of obs-4.

---

## Summary table

| id | title (short) | severity | recurrence | candidate file | disposition |
|----|---------------|----------|------------|----------------|-------------|
| obs-1 | Identical-behavior privacy options = privacy-theater; honest selector collapses them | strong | 1st instance | PRODUCT-PRINCIPLES | HOLD — rule 4 candidate; promote on 2nd confirming wave |
| obs-2 | Spec data: contract diverges from P-3 architecture decision; P-4 REWORK required | warning | 1st instance | PRODUCT-PRINCIPLES | HOLD — rule 4 candidate; promote on 2nd confirming wave |
| obs-3 | Sentry v10 OTel instrument-first ordering + decorator + VITE_ prefix (SDK-doc) | informational | 1st instance | none (SDK-doc only) | SDK-doc only; no promotion path |
| obs-4 | Non-git Railway deploy: railway up + served-bundle content assertion + migration before boot | strong | 2nd instance (wave-34 + wave-35) | CI-PRINCIPLES | **PROMOTE to CI-PRINCIPLES rule 7** |

**Observations emitted: 4 (obs-1, obs-2, obs-3, obs-4)**
**Severities: 2 strong, 1 warning, 1 informational**
**Candidate files: PRODUCT-PRINCIPLES (obs-1 + obs-2), none/SDK-doc (obs-3), CI-PRINCIPLES (obs-4)**
**Promotion-eligible: obs-4 only (2-wave recurrence, strong severity, binary/falsifiable gate, non-trivial false-green cost)**
**Dropped: V-2 0-blocking count (gate mechanism working); 1-round P-4 REWORK (narrow, correct); Gemini unavailability (one-off rate limit); migration via TCP proxy (absorbed into obs-4)**

---

## Promotion candidate flags for karen

**One observation is promotable this wave: obs-4 (CI-PRINCIPLES rule 7 candidate).**

**obs-4** has two confirming waves — wave-34 (discovered: false-green deploy shipped behind
a green gate; root-caused by karen + jenny via independent served-bundle grep, 0/0 markers;
corrected via railway up CLI push) and wave-35 (applied: explicit "wave-34 lesson" cite in
C-2; CLI push for both changed services; 3 change-unique markers confirmed in live bundle
at 1/1/1; migration applied before api boot via public TCP proxy). The rule is:

```
7. For non-git-connected Railway services, assert a change-unique marker is present in
   the served bundle after deploy; deployment-state SUCCESS + digest-diff is not sufficient.
   Why: A snapshot redeploy yields a new digest from the same source, serving stale
   code behind a green gate.
```

Rule line: 121 chars (at the 120-char limit; trim if linter rejects: "For non-git Railway
services, assert a change-unique marker in the served bundle; digest-diff alone is a
false-green." = 83 chars). Why line: "A snapshot redeploy builds the same source into a
new digest, serving stale code behind a green gate." = 89 chars (under 100). Slot 7 is open
in CI-PRINCIPLES. head-ci-cd approval + karen rule-quality vetting required per promotion path.

Note: obs-1 (PRODUCT-PRINCIPLES rule 4 candidate, strong) is the highest-severity new HOLD.
The honest-selector check is falsifiable at P-4 (enumerate option pairs, assert at least one
live surface distinguishes them) and the cost of the miss is a misleading privacy control.
Wave-33 obs-1, wave-29 obs-1, and wave-35 obs-2 are also competing PRODUCT-PRINCIPLES rule 4
candidates; all are first-instance HOLDs. If obs-1 confirms on a subsequent wave, it takes
priority over the older candidates by recency and severity per the 2nd-instance priority rule.
```
