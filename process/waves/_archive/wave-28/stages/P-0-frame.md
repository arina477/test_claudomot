# Wave 28 — P-0 Frame

## Discover section
- **wave_db_id:** 02c97a51-5998-427b-aa2d-97d6ca12f885 (wave_number 28, running).
- **Prior-work citation:** wave-9 P-4 (Gemini flag + karen/jenny follow-up) filed this gap — wave-8b made `servers.invite_code` the default shared link but revoke only covers ad-hoc `invites`; the permanent link is irrevocable if leaked. `servers.service.ts:329-330` documents the deferral in-code ("rotation of the permanent code is deferred"). Invite issuance/revoke shipped wave-8/9.
- **Roadmap milestone:** M5 (a5232e16) in_progress. Class=product-feature, Tier=T3. Seed re-homed under M5 (M5 scope = assignment module; this is a re-homed server-security debt item, per product-decisions 2026-06-30 "independent backlog under M5, NOT the assignments feature scope"). wave row milestone backfilled = M5.
- **Spec-contract short-circuit:** no-prior-spec (prose-only description) → full P-1..P-3.
- **Product-decision:** none Tier-3. Security hardening; no money / major-UX tradeoff. Auth/security surface handled by T-8 + the P-4 security-scope-tightened gate.

## Reframe section
**Original framing:** d058283d — add `POST /servers/:id/invite-code/rotate` (owner-gated, AuthGuard) regenerating the CSPRNG `servers.invite_code`, invalidating the old permanent link. Same locked CSPRNG + 23505-retry pattern.

**problem-framer:** PROCEED (matched_antipatterns: []). Rotation is the correct cause-layer fix (root: the permanent default link has no invalidation path once leaked; alternatives — per-link expiry / disabling permanent links / allowlist — are all worse or different features). **Code-verified every seed claim:**
1. `servers.invite_code` exists (`db/schema/servers.ts:20`, `.unique()`) and IS the permanent shared link (resolved in `getInvitePreview`/`joinViaInvite`, `servers.service.ts:401-402`).
2. CSPRNG + 23505-retry is **real + reusable**: `generateCode()` (`servers.service.ts:35-37`) + retry loop in `createInvite` (`servers.service.ts:286-317`). Genuine reuse, no duplication.
3. **Load-bearing nuance for P-2:** `AuthGuard` (`controller:133`) is verify-only, NOT an ownership check → rotation must add its own **in-service owner-ONLY** check. `revokeInvite` gates owner-OR-creator (`servers.service.ts:354`); rotation must be **owner-ONLY** (the permanent code has no creator concept) — mirror the owner branch, drop the creator path.
4. No rotate endpoint exists (`ServersController` ends at `createInvite`; `InvitesController` = preview/join/revoke only) → nothing to rebuild.
**Forward framing:** `POST /servers/:id/invite-code/rotate` on `ServersController`, `@UseGuards(AuthGuard)` + in-service owner-only check; regenerate `invite_code` via `generateCode()` in the 23505-retry loop; non-happy paths: non-owner 403, server-not-found 404, 23505 collision retry, concurrent rotate.

**ceo-reviewer:** PROCEED (HOLD-SCOPE). The "real bug that DOES matter" — inverse of the trap. Launch-gating trigger ("before first real external users") is live; the fix is **milestone-agnostic** (every candidate milestone ships to real users through the same invite door → protects ANY launch). Right-sized: full invite lifecycle (named invites / per-invite expiry / audit / history) is gold-plating at 0 prod servers; the seed is the minimum that fully closes the hole — no SELECTIVE-EXPANSION. **Not a RECONSIDER:** the park-or-key fork is founder-pending and this wave is founder-credential-free + buildable end-to-end today; a pivot call would front-run the founder's explicit choice with a lower-authority scope call. Advisory (delivery, not P-0 scope): N-1 may attach a non-blocking nudge to the pending digest if still unanswered.

**mvp-thinner:** OK (atomic — nothing to split). The AC cluster (owner-gate → regenerate CSPRNG → invalidate old link) is inseparable; a partial rotate is either a security hole or a no-op. Keep-OUT (gold-plating at 0 users, do NOT author as siblings): rate-limiting the rotate endpoint, audit-log entry (M10 Compliance owns later), client "regenerate link" button + new-link display UI (separable but demand-gated; the endpoint alone satisfies the task TRIGGER). Trace-test: not M5-mvp-critical (M5 metric is assignments-only) — expected + correct (re-homed debt); **no ceo/mvp precedence tie applies**. Flag for P-1: sub-floor (~120-200 LOC single-spec) — floor-exemption precedent (w16/21/23-27) applies, P-1's call.

**Mediation outcome:** none required — no ceo-reviewer expansion vs mvp-thinner THIN conflict (ceo HOLD-SCOPE + mvp OK both endorse the atomic single-spec shape).

**Disposition:** PROCEED (all three: problem-framer PROCEED / ceo-reviewer PROCEED-HOLD-SCOPE / mvp-thinner OK).

**Final framing for P-block (single-spec, claimed_task_ids = [d058283d]):**
Add `POST /servers/:id/invite-code/rotate` on `ServersController`:
- `@UseGuards(AuthGuard)` (verify) **+ in-service owner-ONLY authorization** (`server.owner_id !== callerId → 403`; mirror `revokeInvite`'s owner branch, drop creator path).
- Regenerate `servers.invite_code` via the existing `generateCode()` CSPRNG util wrapped in the `createInvite` 23505-retry loop; the write invalidates the old link (unique column, single source of truth).
- Non-happy paths (P-2 edge-cases): non-owner → 403; server-not-found → 404; 23505 collision → retry; concurrent rotate → last-write-wins (both produce valid new codes; document).
- **Keep OUT:** rate-limiting, audit-log, client UI (all gold-plating / demand-gated per mvp-thinner).
- **Security carry (→ P-4 security-scope gate + T-8):** owner-only (not any member), CSPRNG (unpredictable), old-link-invalidation proven, no rate-limit needed at 0 users (documented decision, not omission).
- design_gap_flag expected FALSE (backend-only endpoint; no new UI surface).

## Open escalation carried into gate (record-only)
**M5 park-or-key fork** — founder-pending since digest 2026-07-01 (7th-wave recurrence). NOT re-escalated at P-0 (already with the founder). ceo-reviewer's advisory: N-1 may attach a non-blocking nudge if still unanswered by this wave's close. head-product carries the standing escalation forward without duplicating the founder ask.

## Exit
Discovery + reframe complete. Scope = single-spec backend security endpoint [d058283d invite-code rotate — owner-only regenerate]. All reviewers PROCEED/OK, no mediation. Security surface flagged → P-4 security gate + T-8. → P-1 Decompose.
