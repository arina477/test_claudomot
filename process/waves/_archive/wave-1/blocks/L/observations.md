# Wave 1 — L-2 Distill Observations

Synthesized from wave-1 artifacts (first wave; no prior archive exists).
Artifact range: P-0 through V-3, merge commit 486d45b, PR #1 MERGED.

```yaml
observations:

  - id: obs-1
    summary: >
      The Playwright MCP requires the Google 'chrome' channel binary, which is absent
      in the sandbox environment, blocking live-browser E2E (T-5) and live visual-diff
      (T-6) simultaneously; RTL component tests plus live HTTP serve were accepted as
      coverage substitutes for a static no-flow foundation wave only.
    source:
      - process/waves/wave-1/stages/T-5-e2e.md
      - process/waves/wave-1/stages/T-6-layout.md
      - process/waves/wave-1/blocks/T/gate-verdict.md  # head-tester rationale: "prerequisite, not a nice-to-have, for the next UI/realtime/auth wave"
      - process/waves/wave-1/stages/V-2-triage.md      # task c51589cd inserted: CI chromium E2E job
    severity: strong
    candidate_principles_file: command-center/principles/test-layer-principles/T-5.md
    recurrence: first observation; no prior wave to confirm against

  - id: obs-2
    summary: >
      A NestJS workspace tsconfig without explicit `rootDir`/`outDir` pins, combined
      with a cross-workspace import from outside the app's source tree, causes
      `nest build` to emit the entrypoint to `dist/src/main.js` rather than
      `dist/main.js`, silently breaking the production start command while all
      dev/CI paths remain green.
    source:
      - process/waves/wave-1/blocks/B/gate-verdict.md  # HIGH carry-forward: "broken production start script — deploy-boot trap"
      - process/waves/wave-1/stages/B-0-branch-and-schema.md  # deviation: api CommonJS tsconfig override, no rootDir pinned
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: first observation; no prior wave to confirm against

  - id: obs-3
    summary: >
      A service version value drifted between the runtime response and package.json
      because the deploy platform does not inject `npm_package_version`, causing a
      controller literal fallback to win silently; the contract's `version:string`
      type was satisfied but the value was not traceable to any committed source.
    source:
      - process/waves/wave-1/stages/V-1-jenny.md       # minor observation #1: version 0.1.0 vs 0.0.1
      - process/waves/wave-1/stages/V-2-triage.md      # task e38c306e inserted: align /health version with package.json
      - process/waves/wave-1/blocks/B/gate-verdict.md  # LOW observation: version resolves to 0.0.1 at runtime
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: first observation; no prior wave to confirm against

  - id: obs-4
    summary: >
      An acceptance criterion specifying a responsive breakpoint as "≥1280px" while
      the implementation targeted Tailwind's `lg:` (1024px) threshold created a
      verifier investigation gap; both hard bounds held and no spec drift existed,
      but the under-specified middle band (1024-1280px) required explicit resolution
      at V-1.
    source:
      - process/waves/wave-1/stages/V-1-jenny.md       # minor observation #2: "Breakpoint band 1024-1280 — spec-gap, not drift"
      - process/waves/wave-1/stages/V-2-triage.md      # noise bucket: "Pattern: AC bound-wording precision -> VERIFY-PRINCIPLES candidate if recurs"
      - process/waves/wave-1/stages/P-2-spec.md        # AC5 text: "≥1280px shows all three columns"
    severity: informational
    candidate_principles_file: none
    recurrence: >
      first observation; no prior wave to confirm against. V-2 explicitly flagged
      "if recurs" before candidate promotion; holding in observations only.

  - id: obs-5
    summary: >
      GitHub Actions third-party action versions whose underlying Node runtime was
      superseded generated annotation noise across every CI job run, adding
      reviewer-facing clutter without any functional impact on gate results.
    source:
      - process/waves/wave-1/stages/V-1-jenny.md       # minor observation #3: CI Node 20 deprecation warnings
      - process/waves/wave-1/stages/V-2-triage.md      # task a7667fb7 inserted: clear CI Node-20 deprecation warnings
    severity: informational
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: first observation; no prior wave to confirm against
```
