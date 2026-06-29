```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Coherent invite-lifecycle completion bundle. All three tasks finish the M2
  invites feature shipped in wave-8: revoke (the missing write-side lifecycle
  verb — read-side enforcement already exists), plus two genuine wave-8 V-1
  drift fixes (8a backfill, 8b share-modal default). Symptom-vs-cause is sound:
  revoke is correctly framed as a missing WRITE capability, not a missing
  enforcement check (join/preview already 404 on revoked invites — confirmed
  servers.service.ts:38, :244, :374). No catalog antipattern matched. Three
  small, causally-linked tasks = one right-sized wave (not over/under). Flags
  below are P-2/T-8 inputs, not reframes.
proposed_reframe: |
  (n/a — PROCEED)
escalation_reason: |
  (n/a — PROCEED)
sibling_visible: false
```

## Symptom-vs-cause (mandatory)

PASS. The wave-8 V-1 deferrals named real causes, not symptoms:

- **Revoke (863c10ef):** Enforcement of `revoked` already exists end-to-end
  (preview + atomic join both 404/validate on `invites.revoked` — confirmed in
  `apps/api/src/servers/servers.service.ts` lines 38, 244, 374). The gap is
  purely the **write verb** to set `revoked = true` (and rotate the permanent
  code). Framing the wave as "add the revoke capability" rather than "fix
  revoke enforcement" is the correct cause-layer framing.
- **8b (5331b7d5):** Symptom = invite-row accumulation + unused permanent code.
  Cause = the share modal mints a fresh ad-hoc invite on every open
  (`InviteShareModal.tsx:90` calls `createInvite(serverId)` unconditionally).
  Fix targets the cause (default to `servers.invite_code`), not the symptom
  (e.g. garbage-collecting orphan rows). Correct layer.
- **8a (08ff762f):** Symptom = pre-existing servers have NULL `invite_code`.
  Cause = the wave-8 migration set it only on create; no backfill. Fix is the
  backfill. Correct. 0 prod servers today, but it must land before 8b is
  trustworthy (see dependency below).

## Antipattern scan (universal catalog)

| # | Antipattern | Result |
|---|---|---|
| 1 | Symptom vs cause | Not matched (see above) |
| 2 | Wrong layer | Not matched — revoke endpoint sits in ServersModule per locked arch decision #3 (invites owned by ServersModule, no standalone Invite module); task description targets `apps/api/src/servers/` correctly |
| 3 | Demo-path tunnel vision | Not matched — revoked-link preview/join already handled; the honest revoked affordance (BOARD wave-8 binding) is named in scope |
| 4 | Premature abstraction | Not matched — concrete endpoints, no framework |
| 5 | Scope creep via coupling | Not matched — all 3 tasks are invite-completion; tightly cohesive |
| 6 | Configuration drift | Not matched |
| 7 | Validation theater | Not matched |
| 8 | Backwards-compat shims | Not matched — 8a is a real backfill for real (future) consumers, not a no-op shim |
| 9 | Test-shape mismatch | Not matched (T-8 applies; flagged) |
| 10 | Spec contradiction | Not matched — consistent with arch _library.md decisions #3/#4 and M2 Scope prose |

## Flags for P-1 / P-2 / T-8 (not reframes)

1. **AUTHZ SEQUENCING (P-2/T-8, load-bearing).** 863c10ef says revoke is gated
   to "owner/admin", but RBAC roles are a *separate, still-pending* M2 bundle
   (the M2 `## Scope` lists RBAC as not-yet-shipped). P-2 must define who can
   revoke **today**, before roles exist — almost certainly **server owner**
   (`servers.owner_id`) + creator-of-the-invite (`invites.created_by`), with the
   role-based "admin" path deferred to the RBAC wave. Must be server-side
   authorized (BOARD wave-8 binding restated). Do not block on RBAC.

2. **REVOKED-LINK HONESTY (T-8, BOARD wave-8 binding).** Confirm revoked invite
   → preview AND join both return 404/410 (read path already does — keep the
   T-8 assertion). Revoke UI must reflect honest state, not optimistic-only.

3. **8a IDEMPOTENT + COLLISION-SAFE (BOARD wave-8 binding).** Backfill must be
   re-runnable (only fills WHERE `invite_code IS NULL`), generate CSPRNG codes,
   and respect `UNIQUE (invite_code)` with retry-on-collision (mirror the
   existing `createInvite` 23505 retry loop, servers.service.ts:203-233).
   Verify row count first (task already says so).

4. **8a → 8b ORDERING.** 8b (default to permanent code) is only safe once every
   server HAS a permanent code. 8a backfill must land before/with 8b, else a
   NULL-`invite_code` server breaks the share modal default. Same wave covers
   this; P-1 should sequence 8a ahead of 8b (or make 8b fall back gracefully).

5. **design_gap_flag → likely TRUE-delta.** `design/invite-share.html` exists;
   revoke affordance + share-modal default change are deltas to an existing
   surface. Confirm at P-1 (D-block needed for the revoke control + modal copy).

6. **SCOPE GUARD.** Keep out: RBAC roles (separate M2 bundle, BOARD-bound for
   wave-10), kick/ban, server settings. Watch P-2 doesn't let "admin" pull RBAC
   in early via flag #1.

## Disposition: PROCEED to P-1 (mvp-thinner not spawned — milestone Class is `platform-foundation`).
