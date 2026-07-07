# Wave 73 — B-3 Frontend

**Specialist:** react-specialist (task 5a2521bc). design_gap_flag=false (reused existing panel/list patterns).

## Files implemented
- `apps/web/src/auth/api.ts` — `getPrivacyEvents()` (GET /profile/privacy-events, safeParse PrivacyEventListResponseSchema). Schema added to the SINGLE existing shared value-import block (wave-72 P0 lesson — no second import statement).
- `apps/web/src/shell/PrivacyActivityPanel.tsx` (NEW) — mirrors BlockedUsersPanel chrome: fetch-on-mount, loading skeleton (not spinner), error+retry, empty state ("No privacy activity yet"), reverse-chron list; plain-language labels for all 5 event types; relative timestamps (DmConversationList idiom); privacy_settings_changed renders "(profile visibility X → Y)" when context present, base label when null (no crash).
- `apps/web/src/pages/SettingsPrivacyPage.tsx` — renders `<PrivacyActivityPanel />` as Panel 5 (after "Your data", before Danger Zone).
- `apps/web/src/shell/PrivacyActivityPanel.test.tsx` (NEW) — 10 tests through the real component (BUILD rule 12): loading→list labels, null-context base label, empty, error+retry, from→to clause.

## Verify
- typecheck clean; build ✓; **built bundle zero raw `require("./`** (wave-72 P0 regression guard passes); web tests 673/673 (45 files), PrivacyActivityPanel 10/10.

## Deviations
- none.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/auth/api.ts, apps/web/src/shell/PrivacyActivityPanel.tsx, apps/web/src/pages/SettingsPrivacyPage.tsx, apps/web/src/shell/PrivacyActivityPanel.test.tsx]
designs_consumed: []
deviations: []
simplify_applied: true
```
