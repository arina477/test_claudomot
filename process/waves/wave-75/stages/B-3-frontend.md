# Wave 75 — B-3 Frontend

Specialist: react-specialist. Commit ddc9b14 (task 77665ee5).

## Files
- `apps/web/src/auth/api.ts` (modify) — `getServerPlan(serverId)` (GET /billing/plan) + `changeServerTier(serverId, targetTier)` (POST /billing/tier, TierSchema.parse at boundary). Single NAMED value-imports from @studyhall/shared (wave-72 ESM discipline).
- `apps/web/src/shell/ServerPlanPanel.tsx` (create) — current tier name + limits (storage GB, voice, educator on/off); owner-only radio-group tier picker + "Switch plan (test mode — no charge)" confirm → changeServerTier → refresh from returned ServerPlan (no reload); non-owner read-only; mock-checkout disclosure ("test checkout — StudyHall does not charge"); failed change → inline error, plan unchanged. Load path has cancelled-flag guard. Reuses PrivacyActivityPanel chrome + palette.
- `apps/web/src/shell/ServerOverviewSettings.tsx` (modify) — mounts ServerPlanPanel with isOwner (resolved via getMe().userId === ownerId, opaque-id comparison — BUILD-13).
- `apps/web/src/shell/ServerPlanPanel.test.tsx` (create) — success-via-real-parent (BUILD-12), non-owner read-only, failed-change-unchanged, mock-label.
- 2 pre-existing mocks extended (shell-components.test.tsx, server-overview-settings.test.tsx) — added getServerPlan/changeServerTier stubs (required by the new mount).

## Verify
- **Full web suite: 46 files, 679 tests green.** Biome format + lint clean. isOwner = opaque-id (BUILD-13); success tested through real parent (BUILD-12); ESM named imports (wave-72). /simplify: no changes (lean, consistent with sibling panels).

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/auth/api.ts, apps/web/src/shell/ServerPlanPanel.tsx, apps/web/src/shell/ServerOverviewSettings.tsx, apps/web/src/shell/ServerPlanPanel.test.tsx, +2 pre-existing mocks extended]
designs_consumed: []   # design_gap_flag=false; reused existing DS patterns
deviations:
  - {specialist: react-specialist, change: "extended 2 pre-existing test mocks with getServerPlan/changeServerTier", plan_said: "4 named files", why: "panel mount fires the call in every parent render; mocks lacked it", adjudication: "ACCEPTED — required consequence of the mount"}
  - {specialist: react-specialist, change: "benign act() warnings on 19 pre-existing server-overview-settings tests (panel async load settles post sync test body); no test fails", plan_said: "n/a", why: "chose not to rewrite 19 tests to await panel load (scope creep)", adjudication: "ACCEPTED for B-3; CARRY to B-6 head-builder — latent flake vector (wave-72 act() lesson); head-builder decides REWORK vs accept. Panel load path IS guarded; the warning is test-hygiene in the parent tests."}
simplify_applied: true
