# V-1 Semantic-Spec Verification (jenny) — wave-73 privacy-events audit log

```yaml
stage: V-1
reviewer: jenny
scope: semantic-spec-intent
wave: 73
spec_task_ids: [156aa2ee-1235-4de1-b85e-995e88440eaa, 03940edd-aaea-4807-a924-52afea981edd, 5a2521bc-1b15-4310-aa27-5e32452e3c55]
deployed_commit: 29a140d
targets:
  api: https://api-production-b93e.up.railway.app
  web: https://web-production-bce1a8.up.railway.app
verdict: APPROVE
findings_count: 3
blocking_findings: 0
```

## Verdict: APPROVE

Deployed behavior at 29a140d matches the spec-contract intent across all three specs. Append-only semantics hold, all 5 shipped event seams are wired and live (T-8's block/unblock "N/A" was a probe-path artifact — the seam IS deployed), no-IDOR is enforced by session-only identity, context is PII-free, false-event gating is a sound improvement consistent with "durable record of what happened," and the read-list panel matches the spec. Founder-reserved scope is fenced with no leak.

---

## Point-by-point verification

### 1. Append-only audit semantics — MET

The spec requires an append-only log: record without update/delete, hooks best-effort/non-blocking so a logging failure never fails the user action.

- **Service surface is append-only.** `apps/api/src/privacy/append-privacy-event.service.ts` exposes exactly two methods: `append()` (single INSERT) and `listForActor()` (SELECT). No `update`/`delete` method exists on the service. The table is a ledger by construction.
- **Table has no cascade + no soft-delete columns.** Migration `apps/api/drizzle/migrations/0028_overjoyed_black_queen.sql` creates `privacy_events` with `actor_id ... ON DELETE no action ON UPDATE no action` — the FK deliberately does NOT cascade, so an event row survives after the actor's users row is scrubbed (satisfies the spec's "row persists with actor_id even after users row is scrubbed" edge case).
- **All 4 hooks are best-effort, after-commit, non-blocking.** Each append is wrapped in `try/catch` that logs a warning and swallows the error:
  - `account-deletion.service.ts:124` — fires after the erasure transaction AND after session revocation; catch at :128 logs "erasure is committed; audit log failure is non-fatal."
  - `account-data.service.ts:64` — fires after data is gathered; catch logs "export succeeded; audit log failure is non-fatal."
  - `privacy.service.ts:74` — fires after the update commits; catch logs "update is committed."
  - `blocks.service.ts:160` / `:196` — fires after block/unblock commits; catch logs "block/unblock is committed."
- **Live evidence:** T-8 Probe 4 measured `PUT /profile/privacy` at 152ms with the hook firing and the action succeeding — no hook-induced latency or failure. Behavior + code + T-8 all agree.

### 2. The 5 event types map to real shipped seams — MET (spec header says "4/5"; all 5 wired)

The prompt says "4/5"; the spec-contract (spec 03940edd) defines a **5-value** enum, and spec 156aa2ee wires **4 seams** (account deletion, export, privacy-settings, block/unblock) that emit **5 event types** (block/unblock is one seam emitting two types). Both the enum and the seams are fully realized — no phantom, none missing:

| Enum value (shared) | Seam (deployed) | Emit site |
|---|---|---|
| `account_deleted` | `AccountDeletionService.deleteAccount` | `account-deletion.service.ts:124` |
| `data_exported` | `AccountDataService.exportAccountData` | `account-data.service.ts:64` |
| `privacy_settings_changed` | `PrivacyService.updatePrivacy` | `privacy.service.ts:74` |
| `user_blocked` | `BlocksService.createBlock` | `blocks.service.ts:160` |
| `user_unblocked` | `BlocksService.removeBlock` | `blocks.service.ts:196` |

Shared enum (`packages/shared/src/privacy-events.ts`) is exactly `['account_deleted','data_exported','privacy_settings_changed','user_blocked','user_unblocked']` — matches the spec AC verbatim. `append()` calls `PrivacyEventTypeSchema.parse(eventType)` before every INSERT, so an unknown type is rejected before insert (satisfies the "unknown event_type → service rejects before insert" edge case).

### 3. no-IDOR (critical AC) — MET

- **Code:** `privacy.controller.ts` `GET /profile/privacy-events` resolves `callerId = req.session.getUserId()` and passes it to `listForActor(callerId)`, which filters `WHERE actor_id = callerId`. There is no `userId` path or query parameter on the route.
- **Live (T-8 Probe 2):** Fixture A generated an event; Fixture B's token returned `{"events":[]}` with A's event id and A's userId both absent. A `?userId=` query param was silently ignored (B got B's own empty list). A path-param variant returned 404 (no such route). No-IDOR holds. Spec intent met.

### 4. PII discipline — MET

- Spec constraint: context carries minimal non-PII only (never emails, message bodies, tokens).
- **Deployed context payloads:** `privacy_settings_changed` → `{visibilityFrom, visibilityTo, whoCanDmFrom, whoCanDmTo}` (all enum values); `account_deleted`/`data_exported` → no context; `user_blocked`/`user_unblocked` → context omitted, `targetId` = opaque blocked-user UUID (`targetType:'user'`).
- **Live (T-8 Probe 3):** the emitted `privacy_settings_changed` row contained only enum strings + opaque UUIDs + timestamp; no email/name/token in any field. PII discipline confirmed on the wire.

### 5. False-event gating (added at B-6 from /review) — SOUND IMPROVEMENT, not drift

The spec's core intent is a "durable record of **what happened**." A no-op did not happen, so it should not be logged. The gating is directly consistent with that intent, not a deviation from it:

- `privacy.service.ts` computes `settingsChanged = before.profileVisibility !== after.profileVisibility || before.whoCanDm !== after.whoCanDm` and appends **only** when true — a re-save of identical values writes nothing.
- `blocks.service.ts` appends `user_blocked` only when `insertReturning.length > 0` (a new row was actually inserted; the idempotent `onConflictDoNothing` path does not double-log) and `user_unblocked` only when `deleted.length > 0` (unblocking a never-blocked user is a no-op and logs nothing).

This tightens the ledger to true state transitions. It strengthens fidelity to the "what actually happened" intent — an improvement, not spec-drift.

### 6. Read-list UI — MET

`apps/web/src/shell/PrivacyActivityPanel.tsx`, wired into `SettingsPrivacyPage.tsx:600`:
- **Plain-language, no raw codes:** `buildLabel()` maps every one of the 5 enum values to plain English ("You deleted your account", "You exported your data", "You changed your privacy settings" + optional "(profile visibility X → Y)", "You blocked a user", "You unblocked a user"). No raw `event_type` surfaces.
- **Own-scoped:** renders `api.getPrivacyEvents()` which hits the session-scoped endpoint (§3).
- **Reverse-chron:** backend returns `ORDER BY created_at DESC LIMIT 100`; panel renders as-received newest-first.
- **States:** loading = shimmer skeleton (not spinner); empty = "No privacy activity yet"; error = message + "Try again" retry; null-context event renders the label without the from/to clause (`account_deleted` case). All four spec edge cases covered.
- **Live (T-5):** all 4 scenarios PASS on prod — panel renders, a settings change produced a new top row "You changed your privacy settings (profile visibility Visible to classmates → Hidden) · Just now", plain-language own-scoped confirmed, skeleton-not-spinner confirmed. No drift.

### 7. Founder-reserved scope — FENCED, no leak

Grep across the deployed privacy module, schema, shared DTO, and panel for `ferpa|coppa|gdpr|ccpa|consent|retention.polic|tamper|hash.chain|hmac|cryptograph|grace.period` returned **zero matches**. No compliance-regime pick, no FERPA/COPPA/GDPR posture, no consent flows, no deletion-hardening (grace-period/purge), no cryptographic tamper-evidence. Append-only-by-convention only, exactly as the spec fenced. Scope discipline held.

---

## Findings

### Finding 1 — spec-gap (informational): T-8's block/unblock "N/A" was a probe-path artifact; the seam IS deployed and live
**Severity: Low (non-blocking).** T-8 Probe 3 marked block/unblock **N/A** because `POST /profile/block/:userId`, `PUT/PATCH /profile/block/:userId`, and `POST /profile/blocks` all returned 404. Those paths never existed. The real route is `@Controller('blocks')` (`apps/api/src/blocks/blocks.controller.ts:55`, `@Post()` at :67, `@Delete(':blockedUserId')` at :85). I independently probed the deployed API: `POST https://api-production-b93e.up.railway.app/blocks` → **401** and `DELETE /blocks/<uuid>` → **401** (not 404) — confirming the block/unblock seam is mounted and live in prod, with the `user_blocked`/`user_unblocked` hooks wired (`blocks.service.ts:160,196`). Per-seam integration proof for all 4 seams is green in T-1..T-4 (`f1aee87`). So the seam is NOT unverified — T-8 simply probed a non-existent path. No action required for this wave; noting so the T-block record isn't mistaken for a coverage hole. Recommend @task-completion-validator note the corrected path if block/unblock live-fires are re-run.

### Finding 2 — spec-gap (accepted): SPA cold-nav hydration race on /settings/privacy
**Severity: Low (non-blocking).** T-5 observed that on the very first cold direct-navigation to `/settings/privacy`, the panel briefly did not mount and `GET /profile/privacy-events` had not yet fired; it self-resolved on the next clean navigation, and the backend was healthy throughout. The spec did not anticipate this SPA hydration/mount timing. It is a frontend mount-race, not a feature defect (the panel fetches on mount; the observation caught a pre-fetch frame). Classified spec-gap, non-blocking — worth a glance if it recurs. Consistent with T-5's own `blocking: false` classification.

### Finding 3 — cosmetic (non-blocking): stale example event-type names in schema comments
**Severity: Low (non-blocking).** `apps/api/src/db/schema/privacy_events.ts` comments cite illustrative old names (`'account_deletion_initiated'`, `'visibility_changed'`) that predate the final shipped enum. These are comment examples only — the runtime enum lives in `packages/shared/src/privacy-events.ts` and is validated correctly on every append. No behavioral impact; a doc-only cleanup for a future touch.

---

## Summary

| Spec check | Result | Primary evidence |
|---|---|---|
| Append-only (no update/delete, best-effort non-blocking) | MET | service surface + try/catch at all 4 seams + T-8 Probe 4 |
| 5 event types ↔ real shipped seams | MET | shared enum + 4 seam emit sites + T-1..T-4 integration proof |
| no-IDOR | MET | session-only callerId + T-8 Probe 2 (A/B isolation) |
| PII discipline | MET | enum-only context + T-8 Probe 3 |
| False-event gating a sound improvement | MET (improvement) | privacy.service + blocks.service change-gates |
| Read-list UI matches | MET | PrivacyActivityPanel + T-5 (4/4 PASS) |
| Founder-reserved fenced | MET | zero-match scope grep |

No divergence from spec intent. **APPROVE.**
