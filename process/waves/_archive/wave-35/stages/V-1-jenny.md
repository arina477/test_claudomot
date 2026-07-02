# V-1 Semantic-Spec Verification (jenny) — Wave-35 (M7 Privacy Controls)

**Verdict: APPROVE**

Source of truth: `tasks.description` of primary task `56a50862-790e-4868-a5c5-305b08b81e40` (DB row, 4-block multi-spec).
Verified against LIVE deploy — web `web-production-bce1a8.up.railway.app`, api `api-production-b93e.up.railway.app`. Deploy currency confirmed: JS bundle `index-B_iPgjvp.js` contains all wave-35 load-bearing strings (no stale/false-green deploy).

Scope of this pass: spec-INTENT conformance beyond the AC-literal lens the T-block applied. T-8 already reproduced authz enforcement live and PASSED; this pass re-derived the enforcement independently and probed intent + contract + journey + spec-gaps.

---

## What was verified against the LIVE deploy

### Block 1 — settings-privacy (56a50862): profile-visibility ENFORCED + who-can-DM persisted

- **Core intent — server-side enforcement CONFIRMED (independently re-derived).** Live two-fixture test on shared proof server `ad62cd12` (A + B co-members):
  - Baseline: A's roster of `ad62cd12` = count 2 (A + B).
  - Set B `profileVisibility=nobody` (PUT 200) → A's roster = **count 1, B ABSENT**. Row is excluded in the response, not client-hidden.
  - B's OWN roster view = count 2 → **B still sees self** (`servers.service.ts:253` `|| r.userId === userId`). Self-visible-to-self AC satisfied.
  - Restored B to `everyone` → A's roster back to count 2.
  Enforcement is woven into the roster query (`servers.service.ts:242-259`), not a UI filter. Spec's "ONLY live cross-user surface" (member-roster) intent is met exactly.
- **HONEST SELECTOR AC (karen P-4 binding) — SATISFIED.** Deployed UI (`SettingsPrivacyPage.tsx:34-45`) presents exactly TWO enabled radios — "Visible to classmates" (→`everyone`) and "Hidden" (→`nobody`). The 3-valued server enum stays locked (`packages/shared/src/privacy.ts:3`); `server-members` is absorbed into "Visible" on read (`toUiVisibility`, line 59-61) and never surfaced as a second live-identical choice. No two options behave identically on-screen. Anti-privacy-theater standard met.
- **who-can-DM NOT an active control — SATISFIED (BINDING AC).** Panel (`SettingsPrivacyPage.tsx:373-442`) is a disabled affordance: `aria-disabled`, `pointerEvents:none`, opacity 0.65/0.55, "Beta Feature" badge, "Takes effect when direct messages arrive" copy. Zero enabled inputs. Value is persisted server-side (default `everyone`, preserved across visibility PUTs, `line 166`) but the user cannot toggle it — persist-only, exactly BOARD Path A. No control appears active while enforcing nothing.
- **Contract conformance.** GET `/profile/privacy` (authed) → `{"profileVisibility":"everyone","whoCanDm":"everyone"}` matches `PrivacySettingsResponseSchema`. PUT round-trip persisted `{server-members, nobody}` and reloaded identically (survives reload AC). Shapes match the shared Zod schemas.
- **Edge cases (live):** no-row→defaults returns `{everyone,everyone}` without 500 (`privacy.service.ts:28-30`); invalid enum `banana`→**400** with Zod flatten error; unauth GET/PUT→**401** (both routes); self-visible-to-self confirmed above.

### Block 2 — account data view + export (a4169fac)

- **Read-only account-data section** ("Your data") renders profile (display name / username / email), membership summary, activity summary (servers joined, account created) — `SettingsPrivacyPage.tsx:444-588`; GET `/profile/data` live returns the real aggregate.
- **Export self-scoped — CONFIRMED honest.** GET `/profile/data/export?userId=<B's id>` returned **A's own data** (the `?userId` param is ignored; `userId` derived from session, `privacy.controller.ts:72-74`). No IDOR. Real data, not a stub. Response carries `Content-Disposition: attachment; filename="studyhall-account-data.json"` + `Content-Type: application/json`. Client triggers a blob download (`api.ts:513-523`).
- **Edge cases:** empty arrays remain valid (aggregation maps empty membership set); unauth→401 on both routes (live).

### Block 3 — Sentry (d40ece71)

- Initialized in **api** (`apps/api/src/instrument.ts`, `@sentry/nestjs`) and **web** (`apps/web/src/instrument.ts` + `Sentry.ErrorBoundary` in `main.tsx`, `@sentry/react`).
- **DSN from env, no-op when unset** — api auto-reads `process.env.SENTRY_DSN`; web reads `import.meta.env.VITE_SENTRY_DSN` (correctly VITE-prefixed for the bundle). Unset → SDK no-ops, app boots (credential-independent build).
- **beforeSend PII scrub, sendDefaultPii:false** — both strip `event.user.{email,username,ip_address}` and `event.request.{data,cookies}` before send. Matches the "no emails / message bodies / tokens / authorization headers" intent. api additionally guards `NODE_ENV!=='test'`.

### Block 4 — privacy/terms stubs + empty/error/loading states (13b7ebfd)

- **/privacy + /terms** routes live-return 200; render real stub content (PrivacyPage: "Privacy Policy" + data-use sections; TermsPage: "Terms of Service"); cross-linked and linked from the landing-page footer (`LandingPage.tsx:249,256`). Router has a `* → /` fallback — no dead-end / broken back.
- **States** present on the surfaces that exist, via shared `components/states/ErrorState.tsx`: feed (`MessageList.tsx` — empty-channel, loading, failed+Retry role=alert), study-rooms (`VoiceStudyRoom.tsx` — connecting/empty/error+"Try again"), assignments (`AssignmentsPanel.tsx` — §113 skeleton `data-testid="assignments-skeleton"`, clipboard empty + CTA, danger+retry), profile (`ProfilePage.tsx` — loadError + ErrorBanner). Skeletons (animate-pulse), not spinners, for content lists.

---

## Findings

### F1 — SPEC GAP (spec wrong, not code): notifications surface in §113 states AC does not exist
**Severity: Low** (already logged at T-9; file for a future wave — not a gate-block)
Block-4 states AC enumerates five surfaces: "server/channel feed, notifications, study-rooms list, profile, assignments." Four exist and carry the required loading/empty/error states. **There is no notifications surface in the deployed app** (`grep notification` over `apps/web/src` finds only an unrelated `aria-label="Notifications"` in `ServerRolesPage.tsx`; wave-30 shipped reminders as a backend `@Cron` email arc with *no* user-visible route). The AC references a surface that was never built. This is spec drift in the SPEC (an over-broad enumeration), not an implementation defect. The T-9 journey map already records it honestly as "notifications-panel surface does not exist → states AC N/A." Recommend the notifications-panel states AC be re-scoped onto the feature that actually introduces a notifications surface (feature backlog), not carried as an open wave-35 gap.

### F2 — Cosmetic, pre-existing: stub "Last updated: 2024"
**Severity: Low** (pre-existing, not wave-35-introduced)
`PrivacyPage.tsx:40` and `TermsPage.tsx:40` show "Last updated: 2024" (current date 2026). Same pre-existing `© 2024`-class string noted at T-9. Cosmetic; does not affect the reachable-and-linked AC. Cheap fix, not blocking.

### No spec DRIFT (code-wrong) found
Every acceptance criterion with a live surface was reproduced against the deploy and matched the spec's intent, including the two BINDING ACs (honest selector, who-can-DM-not-active) and the two security-scoped intents (roster enforcement, export self-scoping). Contract shapes conform to the shared Zod schemas.

### Prior-known debt (out of V-1 scope, already tracked → V-2)
- No dedicated automated regression tests for the new privacy endpoints (MEDIUM honest debt per T-9 / journey map). Behavior is proven at the live layer (T-8) + code-read (B-6); a regression-test task is a candidate follow-up. Not a spec-intent divergence — noted for V-2 triage continuity.

---

## Verdict rationale

All four spec blocks meet their intent on the live deploy. The two anti-privacy-theater BINDING ACs are honored (honest 2-option selector; disabled who-can-DM affordance). The core "enforced, not cosmetic" intent is independently confirmed live (a hidden user genuinely vanishes from a co-member's roster while still seeing self). Export is genuinely self-scoped and returns real data. Sentry is wired with a real PII scrub. Stubs render and are reachable. The single spec gap (F1, notifications) is a spec-side over-enumeration already logged honestly at T-9, not an implementation failure.

**APPROVE.**
