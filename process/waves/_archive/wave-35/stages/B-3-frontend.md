# Wave 35 — B-3 Frontend

4 react/devops specialists, parallel (non-overlapping file scopes). design_gap_flag=false (prior art existed). All typecheck-clean in isolation (repo-wide typecheck at B-4).

## react-specialist — settings-privacy page + api (56a50862 + a4169fac)
`apps/web/src/pages/SettingsPrivacyPage.tsx` (new) + `apps/web/src/auth/api.ts`. **HONEST 2-option visibility** (Visible→everyone / Hidden→nobody; `toUiVisibility` absorbs `server-members` silently, never a 3rd live choice — satisfies BOARD binding + karen finding). who-can-DM = DISABLED affordance (`pointer-events:none`, aria-disabled, "Takes effect when direct messages arrive") — not a live toggle. account-data section (Promise.all getPrivacy+getAccountData) + download. Skeletons per §113. api: getPrivacy/putPrivacy/getAccountData/exportAccountData. Commit `1582478`. No deviation.

## react-specialist — stubs + routing + footer (13b7ebfd)
PrivacyPage/TermsPage (per per-page-pd, DESIGN-SYSTEM typography, public); router.tsx +3 routes (/settings/privacy AuthGuard, /privacy, /terms); LandingPage Legal footer. Commit `b2e0a25`. No deviation.

## react-specialist — empty/error/loading states (13b7ebfd)
Per §113: MessageList (spinner→skeleton, error→ErrorState+retry, empty+CTA), AssignmentsPanel (skeleton+ErrorState), ProfilePage (skeleton+retry). Shared `components/states/ErrorState.tsx`; useMessages `reloadMessages`. Study-rooms (VoiceStudyRoom) already §113-compliant. Commit `a764738`.
- **HONEST finding:** **Notifications panel does NOT exist** in the app — the spec named it but no component exists. States applied to the 4 real surfaces; notifications is N/A until that feature is built. (V-block: do NOT mark a notifications-states AC green — surface absent.)
- Deviation (ACCEPT): ThreadPanel/MemberListPanel technically violate §113 but are secondary panels, not the named 5 surfaces — left untouched (surgical scope).

## devops-engineer — Sentry web (d40ece71)
`apps/web/src/instrument.ts` (new): VITE_SENTRY_DSN, no-op when unset, beforeSend PII scrub, NO replay/tracing. `main.tsx`: import first + `Sentry.ErrorBoundary` wraps app. Commit `2abae68`. No deviation.

```yaml
skipped: false
specialists_spawned: [react-specialist x3, devops-engineer]
files_implemented: [SettingsPrivacyPage.tsx, api.ts, PrivacyPage.tsx, TermsPage.tsx, router.tsx, LandingPage.tsx, MessageList.tsx, AssignmentsPanel.tsx, MainColumn.tsx, ProfilePage.tsx, useMessages.ts, components/states/ErrorState.tsx, instrument.ts, main.tsx]
designs_consumed: [design/settings-privacy.html, design/DESIGN-SYSTEM.md §113]
deviations: [{states: "ThreadPanel/MemberListPanel not in named 5 — left", accept}, {states: "notifications panel absent — N/A", accept-honest}]
simplify_applied: true
commits: [1582478, b2e0a25, a764738, 2abae68]
open_note: "notifications-panel states AC unmeetable (surface not built) — flag at V/L"
