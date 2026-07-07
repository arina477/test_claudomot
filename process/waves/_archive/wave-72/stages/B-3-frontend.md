# Wave 72 — B-3 Frontend

**Specialist:** react-specialist (per plan). Design consumed: `design/settings-privacy.html` Panel 5 (Danger Zone).

## Files implemented
- `apps/web/src/auth/api.ts` — `deleteAccount()`: POST /profile/delete `{confirm:true}`, credentials; 200 → parse DeleteAccountResponseSchema; **409 → throw `DeleteAccountBlockedError`** carrying `{reason, servers[]}`; other non-2xx → HttpError.
- `apps/web/src/shell/DangerZonePanel.tsx` (NEW) — `DangerZonePanel` section + internal `DeleteAccountDialog`: portaled to document.body (BUILD rule 14), focus-trap, Esc, consequence list, **acknowledgment checkbox gating the destructive confirm**, 409 blocked-server-list, double-submit prevention.
- `apps/web/src/pages/SettingsPrivacyPage.tsx` — renders `<DangerZonePanel />` as Panel 5.
- `apps/web/src/shell/DangerZonePanel.test.tsx` (NEW) — 18 tests through the real component (BUILD rule 12): checkbox gate, success (deleteAccount → Session.signOut → navigate('/login')), 409 owner-block (server list, NO navigate, dialog stays open), generic error, Esc-close, double-submit.

## Copy reconciliation (P-1 note — shipped, verified)
- Section desc drops email-verify + 30-day-grace; acknowledgment softened from "permanently deleted" → "deactivated and my personal data removed". No copy promises unimplemented behavior.

## Flow
- Success: `Session.signOut()` → `navigate('/login')`. 409: `DeleteAccountBlockedError` → reason + per-server list, non-destructive.

## Deviations (adjudicated)
1. DangerZonePanel in `apps/web/src/shell/` (matches BlockedUsersPanel pattern) — ACCEPT.

```yaml
skipped: false
fast_path_active: false
specialists_spawned: [react-specialist]
files_implemented: [apps/web/src/auth/api.ts, apps/web/src/shell/DangerZonePanel.tsx, apps/web/src/pages/SettingsPrivacyPage.tsx, apps/web/src/shell/DangerZonePanel.test.tsx]
designs_consumed: [design/settings-privacy.html]
deviations: [{specialist: react-specialist, change: panel-in-shell-dir, plan_said: co-located-or-inline, why: matches-BlockedUsersPanel-pattern, adjudication: accept}]
simplify_applied: true
```
