# Wave 80 — B-1 Contracts

typescript-pro (commit c091589): `packages/shared/src/privacy.ts` — `showPresence: z.boolean()` added to BOTH PrivacySettingsResponseSchema (GET, required — column NOT NULL) + UpdatePrivacySchema (PUT, required). Inferred types pick it up via z.infer; schemas already exported (ESM re-export intact — no index.ts edit). Isolation typecheck clean; dist rebuilt (gitignored).

**Deviation (ACCEPTED):** UpdatePrivacySchema is a FULL-REPLACE object (all 3 fields required — no existing per-field optionality to mirror). Consistent with the shipped contract: the SettingsPrivacyPage sends the full current settings + the changed field on any toggle (as profileVisibility/whoCanDm already do). Changing to `.partial()` would alter the other fields' contract → out of B-1 scope. B-2/B-3: the UI sends the full settings object; service treats PUT as full-replace.

```yaml
skipped: false
contracts_authored: [packages/shared/src/privacy.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: [{change: "showPresence required (full-replace PUT, matches existing shape)", adjudication: accepted}]
```
