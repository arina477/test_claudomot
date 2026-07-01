# Wave 26 — B-6 Review (Build block-exit gate)

**Branch:** wave-26-presence-author-dots @ `6c91573`. **wave_type:** single-spec (Action 6 commit-discipline skipped).

## Phase 1 — head-builder gate verdict
- **Attempt 1: REWORK** (agentId a0be0e328589d7c6d) — caught a real **AC3 miss**: `getPresenceStatus` collapsed unknown→`'offline'` (`?? 'offline'`), so an author never observed showed a persistent muted OFFLINE dot — the false-default AC3 forbids (unknown must render NO dot); the certifying test reinterpreted AC3 to bless it. AC2/AC4/AC5/CARRY-1/2 + the main-repairs all confirmed sound.
- **Fix (Iron-Law → react-specialist, `22437a3`):** added `hasPresence(userId)` accessor (`presenceStore.has`); `AuthorPresenceDot` tri-state (`boolean|null`), `if (!hasPresence(authorId)) return null` → unknown renders nothing; test corrected to assert unknown→no-dot + online→unknown transition case.
- **Attempt 2: APPROVED** (agentId a5d9608ec448ca8f0) — AC3 fix verified against source; KNOWN-offline still renders a muted dot (offline is a real state), only ABSENT→no-dot; AC4 single socket + CARRY-1 memo intact.

## Phase 2 — /review production-bug pass
Independent adversarial code-reviewer on the diff. Findings:
- **[P1] a11y REGRESSION** — `PresenceDot` outer container had `aria-hidden="true"` parenting the `sr-only` label → suppressed screen-reader announcement of presence for BOTH author dots AND the refactored member dots (the pre-refactor member dot had no aria-hidden). Tests masked it (JSDOM `getByText` ignores aria-hidden). **FIXED (react-specialist, `6c91573`):** moved `aria-hidden` to the inner decorative dot only; sr-only label now in the a11y tree; tests strengthened with an ancestor-walk guard that would catch the regression. web 250→251.
- **[P2] per-row subscription smell (accepted-debt):** each AuthorPresenceDot subscribes individually (O(rows×events) callback work); the member panel lifts one subscription. NOT a leak (unsub correct), NOT a re-render storm (CARRY-1 memo bails unchanged authors). → V-2 non-blocking / future perf task (T-7 watch). Do NOT refactor now (would disturb the AC4 test + CARRY-1).
- **[P3×2] accepted:** initial-load flash (dots pop in after first snapshot — acceptable per AC1 "updates live"); presence store session-persistent / "co-member somewhere" semantics (low impact for the model).
- **Verified clean:** subscription lifecycle (unsub correct, no leak on scroll/unmount), TOCTOU (same-tick Map read), CSS tokens defined, member-panel no unknown→no-dot inheritance, biome `process/**` drops zero source, clock-mock scoped no leak.

## Fix-up commits
`22437a3` (AC3 unknown→no-dot) · `6c91573` (a11y label reaches a11y tree). Plus B-4 pre-existing-main repairs (biome `process/**`, `fa6c9e6` assignments clock-mock).

## Post-fix re-verification
typecheck 4/4 · lint 0 errors (7 pre-existing warnings) · build 3/3 · api 395 · web 251/251. Both fix diffs surgical; no new critical/high (Phase-1 verdict not invalidated — a11y + AC3 are behavior fixes, not contract drift).

```yaml
phase1_head_builder_verdict: APPROVED   # Attempt 2 (Attempt 1 REWORK on AC3)
phase2_review_invocations: 1
findings_critical: []
findings_high: []                       # P1 a11y fixed
findings_medium_accepted:
  - "P2 per-row presence subscription (O(rows×events) callback) — not a leak/re-render storm; future perf lift (member-panel single-subscription pattern). → V-2 / T-7 watch."
findings_low_accepted:
  - "initial-load dot flash (self-heals on first snapshot, AC1-acceptable)"
  - "presence store session-persistent, co-member-somewhere semantics (low impact)"
fix_up_commits: [22437a3, 6c91573]
final_verdict: APPROVE
```

## Exit
Phase 1 APPROVED (Attempt 2), Phase 2 no open critical/high (a11y P1 fixed, AC3 fixed, 2 pre-existing main-repairs), re-verified green, pushed (HEAD 6c91573). → C block.
