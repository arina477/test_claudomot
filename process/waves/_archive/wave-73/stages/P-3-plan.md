# Wave 73 — P-3 Plan

## Approach

### Architecture deltas
- **New:** `privacy_events` append-only table + `AppendPrivacyEvent` service inside the EXISTING `apps/api/src/privacy/` PrivacyModule (already registered in AppModule since wave-35). One new own-scoped read endpoint `GET /profile/privacy-events` on the existing `privacy.controller`. One new read-list panel on the existing SettingsPrivacyPage.
- **Changed:** 4 existing services gain a single best-effort after-commit `append(...)` call each (deleteAccount, exportAccountData, privacy-settings update, block/unblock). No change to their existing behavior — the hook is additive and wrapped so a failure is caught+logged.
- **Why this approach over alternatives:** (a) after-commit best-effort hooks vs. transactional-with-the-action — chosen best-effort because an audit-log write MUST NOT be able to fail/rollback a privacy action (a user's delete must succeed even if logging is down); mirrors the shipped deleteAccount post-commit best-effort session-revoke. (b) A dedicated `privacy_events` table vs. reusing an existing log — dedicated because the query/retention/shape are distinct and it keeps PII isolation explicit. (c) app-level event logging vs. a general audit platform — WIP-limited to the shipped surfaces per the N-1 fence (no compliance-grade infra).
- **Failure-domain impact:** the hooks are read-only w.r.t. the user action (append a row), non-blocking; no transaction-scope expansion on the host actions. The new read endpoint is session-scoped (no-IDOR), same guard as sibling privacy routes.

### Data model
- **Added:** `privacy_events` (`apps/api/src/db/schema/privacy-events.ts`): id uuid PK defaultRandom; actor_id text (FK users.id, NO cascade — actor may be soft-deleted, event persists); event_type text (NO pgEnum; Zod-validated in service); target_type text; target_id text nullable; context jsonb nullable (minimal non-PII); created_at timestamptz defaultNow notNull. **Index:** (actor_id, created_at desc) for the read query. Drizzle migration generated + applied at C-2 (additive, no backfill).

### API contracts
- `GET /profile/privacy-events` — guarded (SessionNoVerifyGuard), callerId from session (no userId param → no-IDOR), returns `PrivacyEventListResponse` (`{events: PrivacyEvent[]}`, own events, created_at desc, limit ~100). 401 unauth. Zod response from `@studyhall/shared`.
- Internal (not public): `AppendPrivacyEvent.append(actorId, eventType, {targetType, targetId?, context?})`.

### New deps
- None (Drizzle, Zod, SuperTokens, React all present).

## Plan (file-level steps by B-stage)

**B-0 Schema** — `apps/api/src/db/schema/privacy-events.ts` (create, privacy_events + index) + Drizzle migration (generate) | **postgres-pro** | first.
**B-1 Contracts** — `packages/shared/src/privacy-events.ts` (create: PrivacyEventTypeSchema z.enum + PrivacyEvent + PrivacyEventListResponse) + `packages/shared/src/index.ts` (re-export, .js) | **typescript-pro** | after B-0.
**B-2 Backend** — `apps/api/src/privacy/append-privacy-event.service.ts` (create, append-only, Zod-validated) + `privacy.module.ts` (provider) + hook edits in `account-deletion.service.ts` + `account-data.service.ts` + `privacy.service.ts` + `blocks.service.ts` (best-effort after-commit append) + `privacy.controller.ts` (GET /profile/privacy-events) + `apps/api/test/integration/privacy-events.spec.ts` (pg-harness LIVE-DB per-seam: assert a real row after each of the 4 actions + no-IDOR read + best-effort-non-blocking) | **backend-developer** | after B-1.
**B-3 Frontend** — `apps/web/src/auth/api.ts` (getPrivacyEvents fn) + `apps/web/src/shell/PrivacyActivityPanel.tsx` (create, read-list panel; reuse BlockedUsersPanel chrome) + `apps/web/src/pages/SettingsPrivacyPage.tsx` (render panel) + `PrivacyActivityPanel.test.tsx` (list/empty/error/loading) | **react-specialist** | after B-2.
**B-4 Wiring / B-5 Verify / B-6 Review** — standard.

## Specialist routing (all in AGENTS.md)
postgres-pro, typescript-pro, backend-developer, react-specialist.

## Parallelization
B-0 → B-1 → B-2 → B-3 serial (B-1 DTO needed by B-2+B-3; B-2 endpoint+service needed by B-3; B-0 schema needed by B-2).

## Self-consistency sweep
1. Every P-2 AC maps to a step: DTO (B-1); table+service+4 hooks+live-DB test (B-0+B-2); read endpoint+panel (B-2+B-3). ✓
2. Every step has a specialist. ✓
3. No file in multiple parallel batches (serial). ✓
4. design_gap_flag=false referenced (P-1). ✓
5. Architecture deltas + alternative trade-offs declared. ✓
6. Data + API contracts concrete (no TBD). ✓
7. No new deps. ✓
8. No new external SDK. ✓

**Binding refinement carried (problem-framer):** B-2's live-DB integration test asserts an ACTUAL privacy_events row after each of the 4 real actions — never a code-read that the hook exists (guards the "plumbing built but not wired" pattern). B-6 must verify each hook fires at its seam.
