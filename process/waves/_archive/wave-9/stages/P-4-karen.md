# P-4 Karen — Source-Claim Verification (wave-9 M2 invite-completion, PRE-build)

**Verdict: APPROVE** (security-tightened gate). Plan claims match live wave-8 code. Small, well-scoped 3-spec bundle finishing M2. One follow-up flagged (permanent-code rotation) — non-blocking, must be logged as a tracked deferral.

Method: every claim checked against live source, not against the spec's own prose. Files read: `apps/api/src/servers/servers.service.ts`, `servers.controller.ts`, `db/schema/invites.ts`, `db/schema/servers.ts`, `apps/web/src/shell/InviteShareModal.tsx`, `command-center/AGENTS.md`. pgcrypto + existing-endpoint greps run.

---

## Per-claim findings

**1. Revoke authz columns exist (servers.owner_id + invites.created_by) — VERIFIED.**
`servers.ts:8` `owner_id text NOT NULL → users.id`. `invites.ts:12` `created_by text NOT NULL → users.id`. Both columns present and NOT NULL, so the owner||creator gate is implementable with no schema change. The owner||creator authz check is the correct T-8 surface (RBAC-admin correctly deferred to wave-10).

**2. revoked→404 at BOTH preview + join; revoke just flips the flag — VERIFIED.**
`validateInviteActive()` (service.ts:32-47) throws `NotFoundException` on `invite.revoked` and is called at preview (`getInvitePreview`, line 251) AND inside the join transaction (`joinViaInvite`, line 325). Join additionally re-checks `NOT revoked` in the atomic consume UPDATE (line 374). So setting `revoked=true` makes both paths 404 with zero read-path changes — the revoke endpoint is purely a flag flip + authz. Claim is exactly right.
- Note for B/T: preview/join 404 only covers AD-HOC invites-table rows. The permanent `servers.invite_code` path (service.ts:276, 335) does NOT consult `revoked` and has no revoke surface — see Gemini flag. The spec correctly scopes revoke to invites-table rows (edge-case note in 863c10ef).

**3. 8a: pgcrypto NOT installed → app-side randomBytes(16).base64url backfill + 23505 retry, idempotent WHERE NULL — VERIFIED.**
`SELECT extname FROM pg_extension WHERE extname='pgcrypto'` returned empty → not installed. App generator `randomBytes(16).toString('base64url')` exists (service.ts:24-26). The 23505 per-row retry pattern exists (createInvite loop, service.ts:205-230). The plan reuses both — correct. No backfill script exists yet (`grep backfill apps/api` → none; `apps/api/src/db/` has only index/seed) → genuine gap to build, not a fake-complete. The "bulk SQL UPDATE can't per-row retry collisions → app-side script" rationale is sound. APPROVE the app-side-script-over-CREATE-EXTENSION call.

**4. 8b: invite_code exposable to members; mint-on-open exists to replace — VERIFIED.**
`InviteShareModal.tsx:90` calls `api.createInvite(serverId)` on mount (fetchInvite in useEffect) → confirmed mint-on-open, the exact wave-8 behavior 8b removes. `findServerDetail` (service.ts:120-170) currently does NOT return `invite_code` in its DTO — so 8b's backend delta (expose member-gated invite_code via server detail or a small GET) is a real, necessary add, member-gating already enforced by the `member` check at service.ts:127-135. Correct.

**5. createServer already sets invite_code → 8a only touches pre-existing NULL — VERIFIED.**
`createServer` sets `invite_code: inviteCode` at insert (service.ts:57, 61) inside the atomic txn. So all NEW servers are non-null; 8a is forward-safety for any legacy NULL rows. The "0 prod servers" figure is unverifiable from the brain Postgres (app `servers` table lives in the app DB, not this DB — `relation "servers" does not exist`), but it is consistent with pre-launch status and does not change the plan: the backfill must be correct + idempotent regardless of current row count, which the plan states.

**6. Specialists in AGENTS.md — VERIFIED.**
`head-designer` (AGENTS.md:44), `backend-developer` (:70), `postgres-pro` (:81), `react-specialist` (:82) all present. Full roster the plan names is registered. No agent-creator detour needed.

**7. Antipatterns (gold-plating / claimed-but-fake) — CLEAN.**
- No gold-plating: 8b's "generate limited invite" kept explicitly OPTIONAL/secondary; RBAC, kick/ban, settings all correctly pushed to wave-10. Backfill is the minimum correct shape, not an over-built migration framework.
- No claimed-but-fake: revoke endpoint and backfill script do NOT yet exist in code (greps confirm) — they are honestly framed as work-to-do, not as already-done. The only "already works" claims (read-path revoked-filter, createServer self-gen, mint-on-open present) all check out in source.

---

## Gemini flag disposition — permanent servers.invite_code is IRREVOCABLE

**Call: FOLLOW-UP (do NOT fold a rotate-permanent-code endpoint into this wave).**

The gap is real and correctly identified: revoke covers ad-hoc invites-table rows only; the permanent `servers.invite_code` (which 8b is now PROMOTING to the default shared link) has no rotation/revocation path — if leaked, it is permanent. 8b materially raises this surface's exposure (the permanent code becomes the link people actually share), so the gap is load-bearing in principle.

But it is NOT load-bearing for THIS wave:
- Pre-launch, effectively zero real servers/users → no live leaked-code exposure to mitigate now.
- Rotation is additive and independent: a future `POST /servers/:id/invite-code/rotate` (owner-gated, regenerate + 23505 retry — same locked pattern) does not require re-touching anything 8a/8b/revoke ship. No rework risk from deferring.
- Folding it in expands scope mid-wave against a tightened gate and adds a second authz surface + UI affordance for a threat that has no current victims.

**Condition on the APPROVE:** the rotation gap must be recorded as a tracked fast-follow, not left implicit. Append a one-line deferral to `command-center/product/product-decisions.md` ("permanent invite_code rotation deferred to fast-follow; ad-hoc revoke ships wave-9") and seed it as an M2-or-wave-10 task so it cannot silently evaporate. Reasonable trigger to pull it forward: first real external users OR any pre-launch shared-link distribution. With that logged, ad-hoc-revoke-now + rotation-fast-follow is the right disposition.

---

## Conditions on APPROVE (carry into B/T)
1. **8a idempotency + collision-safety are PASS-gated at T**, not assumed: re-run = no-op (WHERE invite_code IS NULL), and the 23505 retry must be exercised, not just present.
2. **revoke authz negative path tested**: non-owner AND non-creator → 403 (not 404, not silent success); re-revoke idempotent (200/no-op).
3. **revoked→404 on BOTH preview AND join** asserted in tests (the read path filters it — confirm, do not trust).
4. **8b: assert NO ad-hoc invite row is created on plain modal open** (the whole point of 8b — regression-guard the mint-on-open removal).
5. **Permanent-code rotation deferral logged** (Gemini flag condition above) before wave close.
