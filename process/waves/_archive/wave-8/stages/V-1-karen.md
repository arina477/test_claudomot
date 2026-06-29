# V-1 Karen — Source-Claim Verification (wave-8, M2 invites/join)

**Scope:** LIVE merged+deployed state. main @ `8051435` (PR#18 = `8716b4e` + C/T-block follow-ups). API `https://api-production-b93e.up.railway.app`. Migration `0004_gigantic_saracen.sql` applied to prod.
**Method:** live curl boundary probes + direct read of merged code on `main` + spec read from `tasks.description` (c7443638).
**Verdict:** **APPROVE** (with 2 spec-drift findings logged below — neither is a security regression, neither blocks; one is a real partial-implementation that should be a tracked deferral, matching the V-block's existing T-9 deferral pattern).

---

## Per-claim findings

### Claim 1 — Live boundary (401/404/health) — **VERIFIED**
Live curl, this session:
- `GET /health` → **200**
- `GET /invites/zzz-invalid-zzz` → **404** (public route reached the handler without auth, then NotFound — proves both "public" and "invalid→404")
- `POST /invites/x/join` (unauthed) → **401**
- `POST /servers/x/invites` (unauthed) → **401**
All four match spec. Authed happy-path + valid-preview-minimal trusted from C-2 throwaway probe per instruction; the unauth boundary is re-confirmed live here.

### Claim 2 — Carry-forward A real (InvitesController in ServersModule, no standalone module) — **VERIFIED**
- `apps/api/src/servers/servers.module.ts:8` → `controllers: [ServersController, InvitesController]`; both imported from `./servers.controller` (line 3).
- `InvitesController` defined `apps/api/src/servers/servers.controller.ts:101`, shares the single `ServersService`.
- `ls apps/api/src/` → no `invites/` dir. Carry-forward A is genuine, not cosmetic.

### Claim 3 — Carry-forward B real (increment only on genuinely-new member; re-join no-op) — **VERIFIED**
`servers.service.ts` `joinViaInvite` (313-396):
- `onConflictDoNothing().returning()` (347-351) → `newMemberJoined = inserted.length > 0` (353).
- Increment block guarded by `if (newMemberJoined && isAdHoc && inviteId)` (364). Re-join → `inserted` empty → no increment, returns `{serverId}` 200. Correct.

### Claim 4 — Atomic max_uses (B-6 fix, TOCTOU) — **VERIFIED**
`servers.service.ts:369-384`: capped branch does a conditional `UPDATE invites SET uses=uses+1 WHERE id=… AND NOT revoked AND (expires_at IS NULL OR expires_at>now()) AND uses < max_uses RETURNING`; `if (consumed.length === 0) throw NotFoundException` → whole txn (incl. the member INSERT) rolls back. This is race-safe: the per-row lock on the conditional UPDATE means concurrent last-slot joiners — exactly one wins. The validate-then-consume is re-checked inside the txn (the WHERE re-asserts all three predicates), so the earlier `validateInviteActive` SELECT is not load-bearing for correctness. TOCTOU genuinely closed.

### Claim 5 — CSPRNG codes — **VERIFIED**
`servers.service.ts:24-26`: `randomBytes(16).toString('base64url')` → 128-bit entropy, URL-safe, non-sequential. Used for BOTH `servers.invite_code` (createServer, line 57) and ad-hoc `invites.code` (createInvite, line 207). Meets the ≥128-bit non-enumerable AC.

### Claim 6 — Public preview minimal — **VERIFIED**
`getInvitePreview` (246-295) returns ONLY `{server:{id,name,memberCount}}` on both the ad-hoc and permanent branches. No channels, categories, members, or presence touched. memberCount via `count(*)::int` on `server_members`. No leak.

### Claim 7 — Test count — **VERIFIED (adjusted)**
Repo currently has **180** `it/test` calls across `apps/api/src` + `apps/web/src` (claim said 179 — off by one; immaterial, likely one test added in a C/T follow-up commit after the 179 figure was recorded). Invite-specific: 68 cases across `servers.service.spec.ts`, `servers.controller.spec.ts`, `invite-join.test.tsx`, `invite-share.test.tsx`. CI green per C-block commit `c7e8915`. Not a regression — trending up.

### Claim 8 — Antipatterns (gold-plating / claimed-but-fake) — **2 FINDINGS**

**Finding 8a — Migration omits the permanent-code backfill (Medium / spec-drift, partial implementation).**
Task c7443638 AC: *"add `servers.invite_code` text UNIQUE null (permanent code; **backfill existing servers with a generated code**)"* and edge-case *"permanent code backfill for existing servers in the migration"*. The migration `0004_gigantic_saracen.sql` adds the column + UNIQUE constraint but contains **NO `UPDATE servers SET invite_code=…` backfill** (the two "UPDATE" grep hits are `ON UPDATE no action` FK clauses, not data backfill). Impact is bounded: any server row created **before** migration 0004 has `invite_code = NULL` and is unreachable via the permanent-code path (only its ad-hoc invites work). New servers (post-0004) get a code at creation time (`createServer` line 57), so the live happy-path the C-2 probe exercised works. Severity is Medium not High because: (a) the project is self-use MVP, (b) wave-7 servers may be few/zero in prod, (c) the ad-hoc path fully covers join, (d) no security exposure. **This is a genuine AC miss, not a fake claim** — recommend logging as a tracked deferral alongside the existing T-9 deferrals (or a one-line follow-up migration).

**Finding 8b — Share modal never uses the permanent code; always mints a fresh ad-hoc invite (Low / spec-drift, the "two-tier" value is half-wired on the UI).**
Task 54407e1d AC: *"a shareable invite link (**the permanent servers.invite_code by default**, OR generate an ad-hoc invite)"*. `InviteShareModal.tsx:86-98` calls `api.createInvite(serverId)` unconditionally on every modal open — so each open creates a new ad-hoc `invites` row, and the permanent `servers.invite_code` is **never surfaced to any user** (it is generated and is resolvable by preview/join, but no UI exposes it). The reviewer-flagged "two-tier = locked #4" framing holds: tier-1 (permanent) exists in the data + resolution layers but is dead on the share surface. Functionally the user still gets a working shareable link, so this is Low — but it means the "permanent by default" half of the two-tier feature is not actually reachable by a user. Side effect: repeated modal opens accumulate ad-hoc invite rows. Recommend a tracked deferral (surface the permanent code as the default link).

**No claimed-but-fake found.** No RBAC/kick-ban/roles/settings/realtime present (correctly deferred — no gold-plating in that direction). The only over-build risk (ad-hoc retry loop, 5 attempts) is spec-mandated ("code collision → retry/unique-constraint") and proportionate.

---

## T-9 deferrals (acknowledged, non-blocking)
no-verified-fixture, revoked-no-endpoint, no-/invite-e2e — already tracked. Findings 8a + 8b should join that deferral set.

## Verdict rationale
All 6 security/correctness ACs (CSPRNG, public-minimal, verified-join, atomic max_uses, idempotent re-join, member-gated create) and both carry-forwards are VERIFIED against live + merged code. The two findings are scope-completeness drift (a missing backfill + an unsurfaced permanent code), not security regressions and not fake completions. Consistent with the V-block's deferral-tracking posture, this is **APPROVE** with 8a/8b logged for V-2 triage as Medium/Low deferrals.
