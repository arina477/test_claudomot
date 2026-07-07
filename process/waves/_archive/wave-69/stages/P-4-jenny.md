# P-4 jenny — DRIFT check (wave-69, M14 moderation bundle #1)

**Role:** Phase-2 spec+plan DRIFT verification against prior decisions + journey map.
**Scope:** multi-spec `tasks` row `9f2bb017` (3 blocks: A report substrate+unlist / B action-loop / C report UI+inbox) + `P-3-plan.md` + `P-0-frame.md`.
**Method:** cross-referenced spec/plan against `command-center/product/product-decisions.md` (M14 authoring L7-13; wave-68 M11-close BOARD L16-22), `command-center/artifacts/user-journey-map.md`, and the LIVE codebase (wave-41 ModerationService, is_public discover model). Reuse targets verified in-repo, not taken on faith.

---

## Evidence base (verified against live codebase)

- `apps/api/src/rbac/moderation.service.ts:40-53,79-96,116-131` — `setMemberTimeout` + delete path gated on `rbacService.can(callerUserId, serverId, 'moderate_members')` then `assertRankGuard(serverId, callerUserId, targetUserId)`. **The exact idiom spec B mandates routing through — confirmed present, unchanged.**
- `apps/api/src/messaging/messages.service.ts:785` + `messages.controller.ts:169-175` — `deleteMessage(channelId, messageId, userId)` soft-delete + `message:deleted` fan-out. Matches spec B "resolve channel_id from the message row."
- `apps/api/src/servers/servers.service.ts:615` — `discoverServers` filters `eq(servers.is_public, true)`; `:471` owner-gated PATCH sets `is_public`; `:683` join-time `is_public` check. Matches spec A/plan "unlist = is_public=false drops from /discover."
- `apps/api/src/db/schema/` — no `reports.ts`, no `reports` table anywhere. **Net-new; zero schema collision.**
- `user-journey-map.md` L375 — the ONLY prior "report" reference: *"Deferred (later M8 slices): … per-user block/report."* An explicit DEFERRAL, NOT a shipped surface and NOT a "no reports" prohibition.
- `user-journey-map.md` L34/L45 (wave-41 T-9) — `moderate_members` permission (migration 0018), rank guard ("a moderator CANNOT delete/timeout a server owner or manage_server/manage_roles holder above them, nor self") shipped + T-8-proven LIVE. This is the substrate spec B reuses.

---

## Per-question verdict

### Q1 — Report-actions THROUGH ModerationService (reuse wave-41 timeout + rank-guard + moderate_members) — MATCH or drift?
**MATCH.** Spec B AC3 is explicit and load-bearing: *"the action MUST route THROUGH ModerationService.setMemberTimeout / MessagesService.deleteMessage so the wave-41 assertRankGuard applies UNCHANGED … Do NOT re-implement the rank check."* Plan §2 confirms ROUTE-THROUGH WINS over a re-implemented check. The GET/resolve endpoints are gated on `can(callerUserId, serverId, 'moderate_members')` mirroring `moderation.service.ts:47`. **No second permission system** — matches the established wave-41 RBAC model exactly, and matches the M14 authoring decision (product-decisions L9: "adds no second permission system"). The spec-contract's own REUSE clause names the exact file/line targets I verified.

### Q2 — Report substrate (reports table + POST /reports) fits schema/domain conventions?
**MATCH.** New Drizzle schema file + `db/schema/index.ts` export + generated migration (`db:generate`) — the established convention (mirrors assignments.ts, dm.ts, messages.ts already in the dir). FKs to `users.id` (text) / `servers.id` (uuid) / `messages.id` (uuid) match existing column-type conventions (users.id is text per SuperTokens). `POST /reports` derives `callerUserId` from `req.session.getUserId()` mirroring the ModerationController session idiom (no IDOR). No `reports` table pre-exists → **no contradiction of any prior data-model decision** (product-decisions "Data Model Decisions" section is empty of any report/flag primitive). Index `(target_server_id, status)` is purpose-built for the owner-queue read. Clean.

### Q3 — Directory unlist reusing is_public=false (wave-68 owner-gated PATCH) — MATCH the discovery model?
**MATCH.** Spec A reuses the wave-68 `PATCH /servers/:id {is_public:false}` owner-gated path (`servers.service.ts:471`), so an unlisted server drops from `discoverServers` (`:615 WHERE is_public=true`) — the identical mechanism M11 shipped (product-decisions L17: "owner-gated publish toggle PATCH /servers/:id sets is_public"). Owner-authz `owner_id !== callerId → Forbidden` idiom reused. **Platform-admin (non-owner) unlist role is correctly DEFERRED** (spec A + frame L11 + product-decisions L9), matching the wave-68 BOARD's founder-reserved posture. No new discovery mechanism invented.

### Q4 — Moderation scope (report→action→unlist now; block/admin-queue/appeals later) consistent with M14 decomposition + wave-68 BOARD mandate?
**MATCH.** This IS the bundle the wave-68 M11-close BOARD unanimously mandated: product-decisions L21 — *all 7 seats' dissent-note: moderation (report/block/takedown of public servers) MUST be authored as a real queued milestone/bundle … and MUST gate any ACTUAL public launch.* M14 was authored to satisfy exactly this (L7-13). The deferral set (user-block, full triage/review-queue UI, appeals, auto-detection, rate-limits, platform-admin unlist) is verbatim the M14-authoring deferral list (product-decisions L9) — **no scope drift, no double-cut.** The frame's ceo-reviewer HOLD-SCOPE (frame L12: "this bundle does NOT complete the launch gate … do NOT close M14 or imply launch-ready") is carried as a strategic note, not violated by the spec.

### Q5 — Journey: report dialog + owner inbox + report→action flow = a journey ADDITION (T-9), not a contradiction?
**CONFIRMED — addition, not contradiction.** The journey map has NO existing report-submission surface, report inbox, or report→action flow (the only prior "report" token is L375's *deferral* of per-user block/report). The report affordance reuses existing discovery-listing / member-context / message components (wave-67/68) and the inbox mirrors the existing wave-41 moderator-only UI gating (`can(moderate_members)` via `/me/permissions`). These are new surfaces to be inventoried at T-9 (the frame flags `design_gap_flag: true` → D-block), which is the correct handling — additive, no existing flow overwritten or contradicted.

### Q6 — Any prior decision this contradicts (e.g. "no user-generated reports" / conflicting moderation-policy)?
**NONE found.** I searched product-decisions and the journey map for any prohibition. There is no "no user-generated reports" decision; the closest reference (journey L375) DEFERS report, and the wave-68 BOARD AFFIRMATIVELY mandates it. Moderation POLICY is explicitly scoped as owner/mod discretion this wave, NOT a platform-policy call (frame L8) — consistent with wave-41 (per-server moderator discretion) and with the founder-reserved items (public-launch-go, platform-admin-takedown-role) left untouched (frame L17). No conflicting moderation-policy decision exists. This is **intentional new-capability**, not drift: it delivers a BOARD-mandated primitive by reusing established substrate.

---

## DRIFTS
None material.

Two non-drift observations (already handled by the spec — logged for completeness, NOT rework items):
- **Idempotency of re-resolving an already-resolved report** is flagged as "define" in spec B edge-cases (409 vs no-op) — left open by design for B-block to pin. Not a drift; a spec-internal TODO the plan carries.
- **Owner-vs-non-owner-mod unlist** — frame L11 notes non-owner-mod unlist is a P-2 scoping question resolved to owner-only for now. Spec A lands owner-only + defers platform-admin. Consistent, no drift.

## MATCHES
Q1 ✓ (ModerationService reuse, no 2nd permission system) · Q2 ✓ (reports table fits conventions, no prior-decision conflict) · Q3 ✓ (is_public unlist = wave-67/68 model) · Q4 ✓ (scope = M14 decomposition + wave-68 BOARD mandate) · Q5 ✓ (journey addition, T-9) · Q6 ✓ (no contradicting prior decision).

---

## Verdict: **APPROVE**

No material drift. This is the BOARD-mandated M14 bundle #1, reusing the established moderation substrate (wave-41 `ModerationService` / `moderate_members` / `assertRankGuard`), the wave-67/68 `is_public` discovery model, and existing session/owner-authz idioms — all verified present in the live codebase at the exact call sites the spec-contract names. The report substrate is genuinely net-new (no collision), the deferral set matches the authoring decision verbatim, and the new UI surfaces are a proper journey addition for T-9. No prior decision is contradicted; the wave-68 BOARD and M14-authoring decisions affirmatively require this work.

**Carry to P-4 gate (head-product):** the strategic caveats are from the frame (ceo-reviewer), not jenny findings — reproduced so they're not lost: (1) do NOT close M14 or imply launch-ready at N-1 (launch gate incomplete after this bundle); (2) public-launch-go + platform-admin-takedown-role stay founder-reserved; (3) T-9 must prove the report→action→resolution loop end-to-end LIVE (the resolve endpoint's route-through-ModerationService + rank-guard is the load-bearing, security-critical AC).
