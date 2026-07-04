# T-2 — Unit (wave-45)

**Block:** T (Test) · **Stage:** T-2 · **Pattern:** A (verified-via-CI) · **Mode:** automatic
**Wave:** 45 — M8 tech-debt HYGIENE

## Action 1 — Confirm CI evidence
C-1 `verdict_evidence`: **test** job green (1m22s, `pnpm test:ci` with containers) on merge SHA 8bb4e51, CI run 28698042797. Task brief cites 354 unit tests across 23 files; local inventory confirms 23 `*.test.ts*` files under `apps/web/src` (AppShell, shell-components, useAudioOnlyFallback, invite-share, HeaderBell, server-roles, assignments, multiPageCatchup, UserMenu, useMentionBadge, presence-dots, voice-occupancy, member-moderation, messaging, useConnectionState, mention-slug-parity, voice-study-room, invite-join, SettingsPrivacyPage, auth-pages, outbox, db, forwardCursor). Unit-test job present + green — no substitute needed.

## Action 2 — Coverage audit
Only executable module touched by the wave: `apps/web/src/shell/useTyping.ts` (biome change 4e994e96). playwright.config.ts + package.json are test-infra/config, not unit-testable app modules.

Audit of `useTyping.ts`:
- `buildTypingLabel(typers)` — pure function, 5-branch transition table (0/1/2/3/4+ typers). The wave changed its internals (6 `typers[N]!` → `typers[N] as Typer`) claiming byte-identical output.
- **No dedicated unit test exists** for `buildTypingLabel` / `useTyping` (`grep -rn "buildTypingLabel|typingLabel|useTyping|is typing|Several people" src/**/*.test.ts*` → 0 matches).
- **F1 finding (low, coverage-gap):** a behavior-preserving refactor of a pure transition table is the exact moment to lock the table with a unit test; it was not added. The byte-identical claim rests on code review (each cast bound after a length guard — verified correct against source) + typecheck + green e2e, NOT on a transition-table unit test. Pre-existing gap; the wave neither introduced nor regressed it. Non-blocking. Surfaced to V-2; L-2 debt candidate.

No other modules modified → nothing else to audit.

## Action 3 — Flake observation
C-1: `fix_up_cycles: 0`, no flakes observed; B-5 documented NO flakes. `gh run watch --exit-status` exit 0 with `retries: 1` configured but no rerun needed. No new flakes this wave.

## Action 4 — Discipline note
- Transition-table pure functions (label builders, conflict matrices, cursor codecs) should carry a table-driven unit test; the byte-identical-output claim of a biome/refactor change is only *provable* at the unit layer, not by lint/typecheck. Candidate T-2.md discipline note at L-2.

## Footer

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 unit-test job: CI run 28698042797 green (1m22s, pnpm test:ci + containers), 354 tests / 23 files on SHA 8bb4e51"
modules_audited: ["apps/web/src/shell/useTyping.ts"]
new_flakes: []
findings:
  - {severity: low, module: "apps/web/src/shell/useTyping.ts", description: "F1 — buildTypingLabel (5-branch transition table) has no dedicated unit test; byte-identical refactor claim not locked at unit layer. Pre-existing, non-blocking."}
```

head_signoff:
  verdict: APPROVED
  stage: T-2
  reviewers: {}
  failed_checks: []
  rationale: "Pattern-A CI-verified. Unit-test job green on merge SHA 8bb4e51 (354 tests, containers). Only touched module (useTyping.ts) audited; the biome change is behavior-preserving on review (casts scoped inside length guards). One low coverage-gap finding (F1) — buildTypingLabel transition table lacks a dedicated unit test, so the byte-identical-output claim is proven by review+typecheck+e2e rather than by a unit table. Pre-existing, non-blocking; surfaced to V-2. No new flakes."
  next_action: PROCEED_TO_T-3
