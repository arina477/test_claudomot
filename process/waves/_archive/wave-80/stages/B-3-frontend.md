# Wave 80 — B-3 Frontend (presence toggle) — task 3038a4bc — commit 4c45224

react-specialist. SettingsPrivacyPage presence toggle.
- `SettingsPrivacyPage.tsx`: "Show my online status" toggle — REAL working control (button role=switch aria-checked, ENABLED, emerald #10b981 on / #52525b off via DESIGN-SYSTEM tokens, no Beta badge, no pointer-events:none — patterned on profileVisibility, NOT the whoCanDm-Beta affordance). Auto-saves via handlePresenceChange (optimistic + presenceSaving/Error/Success trio, mirrors handleVisibilityChange). Binary online status copy (no last-seen).
- **PUT full-object wiring:** UpdatePrivacySchema is full-replace (3 fields) → handlePresenceChange PUTs {profileVisibility, whoCanDm, showPresence} preserving unchanged from state. **Fixed a latent bug:** handleVisibilityChange was sending only 2 fields — would 400 under the new full-replace schema — now sends showPresence from current state too. Default reflects server (GET hydrates showPresence, defaults true → on).
- SettingsPrivacyPage.test.tsx: +enabled-switch assertion, default reflects server, full-object PUT + preserved siblings + GET round-trip, failure-revert. api.ts JSDoc updated.

## Results
- SettingsPrivacyPage 7/7; full web **733/733**; typecheck clean; biome ci clean (394). /simplify no change (handlers intentionally mirror).
- **Deviations (ACCEPTED):** (1) /simplify no change; (2) biome-formatted 2 apps/api B-2 test files failing the shared-branch biome gate (whitespace/import-order only, no logic) to unblock — flagged. The handleVisibilityChange full-object fix is load-bearing (prevents the existing toggle 400ing under the new schema).

```yaml
skipped: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/pages/SettingsPrivacyPage.tsx, apps/web/src/pages/SettingsPrivacyPage.test.tsx, apps/web/src/auth/api.ts]
designs_consumed: []
deviations: [{change: "handleVisibilityChange now sends full 3-field object", adjudication: accepted}, {change: "biome format 2 B-2 api test files", adjudication: accepted}]
simplify_applied: true
```
