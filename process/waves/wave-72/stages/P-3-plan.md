# P-3 Plan — wave-72 (M10 account self-deletion, multi-spec)
## Approach
### Architecture deltas
**1. Erasure service + endpoint (apps/api, PrivacyModule) — spec A.** POST /profile/delete in privacy.controller; an AccountDeletionService (mirror AccountDataService structure). Soft-delete + scrub + session-revoke + leave-servers + owned-server block-if-owner. Alternative: hard-delete (SuperTokens deleteUser + destructive FK cascade) vs SOFT-delete + deleted_at re-auth block — SOFT WINS (users.id has ~20+ NO-ACTION FKs → hard-delete = destructive cascade / FK violations; soft is reversible + matches the message-tombstone convention + audit-friendly). Failure-domain: SECURITY-critical (a deleted user must not re-auth or leave PII).
**2. Re-auth block (apps/api/src/auth/supertokens.config.ts) — spec A, the CRITICAL split-identity fix.** The signIn override (and/or session-verify) rejects a user whose local users.deleted_at IS NOT NULL. Alternative: SuperTokens deleteUser (hard, irreversible) vs a deleted_at guard in signIn (reversible) — GUARD WINS (reversible soft-delete; deleteUser deferred). This is the load-bearing fix: revoking sessions alone lets the account re-authenticate.
**3. Owned-server disposition — spec A.** block-if-owner: if servers.owner_id=caller, reject (409) with the server list. Alternative: transfer/orphan/cascade — BLOCK WINS for the first slice (simplest, safe; no orphaned-server-with-scrubbed-owner; transfer is a later M10 slice).
**4. shared DTO — spec B.** DeleteAccountRequest/Response.
**5. Danger-Zone UI — spec C.** Per settings-privacy.html Panel 5; reuse the BlockConfirmDialog/ReportDialog danger-confirm chrome + the acknowledgment gate.
### Data model (spec A): users.deleted_at (timestamptz nullable) + migration (db:generate). Scrub = UPDATE (no destructive row DELETE). No new table.
### API: POST /profile/delete (AuthGuard). ### Deps: none (SuperTokens SDK already present). ### SDK: SuperTokens Session.revokeAllSessionsForUser + the signIn override.
## Plan (file-level, by B-stage)
**B-0 Schema:** apps/api/src/db/schema/users.ts (add deleted_at) + index.ts + generated migration | postgres-pro | 1st.
**B-1 Contracts:** packages/shared/src/account-deletion.ts (+index) — DeleteAccountRequest/Response | typescript-pro | after B-0.
**B-2 Backend:** apps/api/src/privacy/account-deletion.service.ts + privacy.controller.ts (POST /profile/delete) + supertokens.config.ts (signIn/session deleted_at re-auth block) + PrivacyModule wiring + pg-harness integration (no-IDOR own-account; block-if-owner 409; scrub+deleted_at+session-revoke+leave-servers; re-auth-blocked-after-delete) | backend-developer | after B-1.
**B-3 Frontend:** apps/web/src/auth/api.ts (deleteAccount fn) + SettingsPrivacyPage Danger-Zone (per settings-privacy.html Panel 5; acknowledgment-gated danger confirm; owner-block 409 surface; logout+redirect on success; copy reconcile) + tests | react-specialist | after B-2.
(No D-block — design_gap_flag=false, settings-privacy.html Panel 5 covers the UI.)
## Specialist routing (AGENTS.md, all present): postgres-pro, typescript-pro, backend-developer, react-specialist.
## Parallelization: B-0→B-1→B-2→B-3 serial (B-2 needs the schema+DTO; the signIn override + the endpoint are one backend unit; B-3 needs the endpoint). 
## Self-consistency: spec-A → B-0 (deleted_at) + B-2 (endpoint + re-auth block + owned-server guard); spec-B → B-1 (DTO); spec-C → B-3 (Danger-Zone UI). Every AC → ≥1 step. The CRITICAL re-auth block (supertokens.config signIn) + the P-4 security-scope-tightened gate + T-8 (auth/session/user-deletion) are load-bearing. design_gap_flag=false → B. No deps/TBD. Clean.
