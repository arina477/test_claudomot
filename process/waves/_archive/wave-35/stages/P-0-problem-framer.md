```yaml
verdict: ESCALATE
verdict_source: problem-framer
matched_antipatterns: [10, 6, 7]
reasoning: |
  Symptom-vs-cause: the seed's enforcement INSTINCT is correct — it demands
  server-side enforcement (not client toggles), pre-empting privacy-theater.
  But the who-can-DM control gates an enforcement target that does not exist
  and is not in MVP scope: there is NO direct-message feature in the codebase
  (messaging is entirely channel-based via ChannelMessageGuard; "threads" are
  channel reply-threads, not DMs), and feature-list.md line 43 places
  "Direct messages + group DMs" at feature #21 in the DEFERRED/H2 bucket
  ("likely pulls earlier if cohort demands"). Yet M7's success metric and the
  seed require "who can DM them" ENFORCED at a "DM-send / thread-open path"
  that has no implementation. This is a spec contradiction (catalog #10)
  between two founder-level artifacts — M7 success metric vs. feature-list
  roadmap — that the seed does not acknowledge. Shipping it anyway produces a
  toggle with no consumer (config-drift #6) enforcing nothing (validation-
  theater #7); building the DM feature to satisfy it is a multi-wave feature
  build, not "launch polish." Resolving which — beyond problem-framer's
  authority — is why this ESCALATEs.
escalation_reason: |
  M7's success metric ("a student can control ... who can DM them") is
  UNMEETABLE as written because DMs (feature #21) are deferred and unbuilt.
  Head-product / founder must choose one:
    (a) DESCOPE who-can-DM from wave-35: amend the M7 success metric to
        profile-visibility only (which HAS a real enforcement surface — see
        below); optionally persist a who-can-DM *preference* now with no
        enforcement, deferring the gate until DMs land. Keeps M7 as launch-
        polish. Recommended if DMs stay H2.
    (b) PULL feature #21 (DMs) into scope: then who-can-DM enforcement is
        real, but this bundle is no longer polish — it must first build the
        entire DM subsystem (endpoints, schema, gateway, guard). That is a
        milestone-scope expansion, not this bundle.
  This is a founder/head-product scope+metric call, not a relayer reframe.

  RECOVERABLE PARTS (proceed once who-can-DM is resolved):
  - profile-visibility (seed, other half): enforcement target EXISTS —
    GET /servers/:id/members returns "the public member roster
    [{userId, displayName, avatarUrl}]" and GET /profile (self-only today).
    Frame enforcement as a server-side gate on the roster/profile-read path
    (like the wave-31 uniform-403 voice gate), NOT a client filter. No new
    "view another student's profile" page exists — enforcement point is the
    roster exposure. Sound to build.
  - a4169fac (data view + download): server-side export scoped to the
    requesting student — right layer, real. PROCEED.
  - d40ece71 (Sentry): framing sound (env-gated DSN, no-op when unset).
    Spec note for T-8: privacy-first product must scrub PII / set
    sendDefaultPii=false so error capture does not exfiltrate student data.
  - 13b7ebfd (stub pages + empty/error/loading): PROCEED; ACs already
    require footer/settings links so stubs are not dead-ends.

  BUNDLE COHERENCE: the 4 tasks are a coherent launch-polish bundle; no
  coherence split warranted. The defect is isolated to the who-can-DM
  enforcement target inside the seed, not the bundle composition.
sibling_visible: false
```
