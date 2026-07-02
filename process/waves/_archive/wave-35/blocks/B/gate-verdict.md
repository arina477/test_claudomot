# Wave 35 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase 1 gate)
**Reviewed against:** process/waves/wave-35/blocks/B/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
All four spec blocks land contract-faithful with both authz doors structurally sound. Profile-visibility is genuinely enforced server-side in `servers.service.ts:252-259` — the roster query filters `profileVisibility !== 'nobody' || userId === caller`, a response-level row exclusion with the caller-sees-self clause present (not client-side hiding). Data-export is IDOR-safe: `account-data.service.ts` derives `userId` solely from `req.session.getUserId()` (`privacy.controller.ts:72-74`), with NO `userId` request param anywhere on `/profile/data` or `/profile/data/export`. The visibility UI is honest per the BOARD binding — `SettingsPrivacyPage.tsx` renders exactly two behaviorally-distinct options (Visible→`everyone` / Hidden→`nobody`), absorbing `server-members` into `everyone` rather than shipping two live-identical choices; the 3-valued enum stays locked server-side (`packages/shared/src/privacy.ts`) for the future DM guard. who-can-DM is a clearly-inactive disabled affordance (`pointerEvents:none`, `aria-disabled`, "Beta Feature" badge, "Takes effect when direct messages arrive"), not a no-op toggle. Sentry is credential-independent (api auto-reads `SENTRY_DSN`, web reads `VITE_SENTRY_DSN`, both no-op when unset — confirmed by B-5 Action 3's DSN-less build), scrubs PII in `beforeSend` (email/username/ip/request.data/cookies), omits replay+tracing, and hangs `@SentryExceptionCaptured()` off the EXISTING `SupertokensExceptionFilter` (no competing SentryGlobalFilter). The migration (0014) is additive, defaulted NOT NULL, committed as SQL, and matches the schema; no startup auto-migrate exists (grep of main.ts + app.module.ts clean). Stubs (/privacy, /terms + footer links) and DESIGN-SYSTEM §113 states (skeletons-not-spinners, error+retry, empty+CTA) land on the real surfaces, and the absent notifications panel is honestly reported N/A in commit a764738 rather than faked. The B-5 server-roles flake is confirmed pre-existing (wave-35 touches no server-roles file; passes 24/24 in isolation).

## Commit-discipline check (Action 6, multi-spec)
PASS with documented cohesion judgment.
- **d40ece71 (Sentry):** cleanly isolated — b018ae9, 30ef06f, 90047e6, 2abae68.
- **13b7ebfd (stubs+states):** cleanly isolated — b2e0a25, a764738.
- **56a50862 ↔ a4169fac:** four commits cite BOTH task_ids (b4f2cb4 shared barrel, 22ba39d privacy controller/module, 1582478 settings page + api client, 581442f module registration). Judged ACCEPTABLE, not a split-required violation: a4169fac is by spec design the data-rights section that lives ON the settings-privacy page (its AC reads "settings-privacy page shows a read-only account-data section"). The two specs share one controller file, one shared-contracts barrel, one page component, and one module registration — atomic units that cannot be split across commits without producing artificial, review-hostile history. Action 6's split mandate targets UNRELATED cross-spec mixing that harms review/revert; this is cohesive-same-surface work. Every claimed_task_id has ≥1 commit. (Process-docs commit 4c8d014 cites no task_id — exempt as a non-code `process/` deliverable.)

## Non-blocking observations (accepted-debt, not rework)
- Footer copyright reads "© 2024 StudyHall Inc." (pre-existing in LandingPage, not wave-35-introduced) — cosmetic.
- `handleVisibilityChange` falls back to `whoCanDm: 'server-members'` when `privacy` is null, but the panel only renders after `privacy` is loaded, so the fallback is unreachable in practice — benign.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---

## Phase 2 — production-bug review (recorded by orchestrator)

**Reviewer:** code-reviewer (production-bug check on `git diff main...HEAD`) — the `/review`-equivalent pre-CI gate.

**Result: no Critical, no High.** Every security concern verified correct: roster visibility filter (no 'nobody' leak, caller-sees-self), IDOR-free self-scoped endpoints, PUT enum validation → 400 before DB write, Sentry beforeSend PII scrub + DSN-unset no-op + no replay, `@SentryExceptionCaptured` correctly skips HttpExceptions (verified against @sentry/nestjs@10.63.0 source), export self-scoped, migration 0014 additive/reversible.

**4 Low findings:**
- **L1** (SettingsPrivacyPage whoCanDm fallback `'server-members'` ≠ column default `'everyone'`) — FIXED (commit c27c4ae).
- **L2** (footnote falsely claimed organizers retain visibility, contradicting nobody-hidden-from-all enforcement — privacy-theater) — FIXED (commit c27c4ae).
- **L3** (updatePrivacy doesn't check rows-affected; anomaly-only, session userIds always have a row) — ACCEPTED-DEBT.
- **L4** (revokeObjectURL sync after anchor.click; Chromium-reliable, small JSON) — ACCEPTED-DEBT.

L1+L2 re-verified: repo typecheck 4/4, lint clean. No Critical/High existed → no re-review iteration needed (Action 5 cap is for clearing Critical/High).

## Phase 2 — commit-discipline (Action 6, multi-spec) — PASS
head-builder (Phase 1) ratified: the 4 commits citing both 56a50862+a4169fac are cohesive-same-surface (data-rights is a section ON the settings-privacy page; shared controller/barrel/page/module-reg — unsplittable without review-hostile history). Sentry (d40ece71) + stubs/states (13b7ebfd) commits cleanly isolated. Every claimed_task_id has ≥1 commit.

## Final verdict: APPROVE — B-block gate-passed.
