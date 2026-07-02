# N-block gate verdict — wave-32 (head-next)

**Gate:** head-next (Program / Delivery Manager)
**Mode:** automatic
**Outcome:** HARD-STOP — loop paused (trigger d). Wave-32 NOT closed, NOT archived; wave-33 NOT opened.

## Verdicts

| Stage | Verdict | Basis |
|---|---|---|
| N-1 | ESCALATE | M6 seed-candidate existence unresolvable from state — a2dd9f3d wave_id=d25f8c47 fails line-214 seed contract; no enumerated stage clears wave_id |
| N-2 | REJECTED | Seed picker (WHERE wave_id IS NULL) returns 0 rows for M6; proposed seed a2dd9f3d excluded |
| N-3 | REJECTED | No valid seed to open wave-33 P-0; closing wave-32 would orphan a2dd9f3d; correctly pause on measured hard-stop |

## The finding

a2dd9f3d ("Harden voice endpoint param validation — non-UUID channelId returns 500", V-2 finding F-32-T-8-1) is a milestone-scoped V-2 follow-up INSERTed by wave-32 V-2 triage with `milestone_id=M6` AND `wave_id=d25f8c47` (wave-32), per roadmap-lifecycle line 90. Its scope is genuinely unshipped (sibling 78f51968 covers only the happy-path occupancy endpoint + RBAC gate, not the malformed-UUID 500→400 hardening).

The seed picker (line 214) requires `wave_id IS NULL`. No stage clears `wave_id` to NULL (line 156 lists writers B-0/L-2/V-2/N-2 for wave_id/claim/status but no clear-to-NULL; N-3 Action 5a closes only the `waves` row). Live-table check: no milestone-scoped, top-level, `todo` task with a non-NULL `wave_id` has ever been picked as a seed — all prior V-2/D-3 follow-up seeds were `milestone_id NULL` (unassigned-queue path).

**Root cause: latent lifecycle contradiction** — line 90 (milestone-scoped V-2 → `wave_id = current wave`) vs line 214 (seed needs `wave_id IS NULL`) with no clear-to-NULL writer authorized. Never surfaced before because prior V-2 follow-ups were unassigned (`milestone_id NULL`).

Not resolvable by any in-ritual N-block action:
- Cannot clear a2dd9f3d.wave_id (no writer; would be the anomaly).
- Cannot hand-INSERT a bundle (out-of-ritual; only decomposition may INSERT).
- Cannot fire decomposition (would author a duplicate M6 bundle while a2dd9f3d's scope-overlap disposition is undecided).

## Resolution needed (founder / BOARD)

- (A) Authorize N-2/V-2 to clear `wave_id` → NULL on a milestone-scoped V-2 residual (amends line 156; narrowest fix).
- (B) Re-home a2dd9f3d to unassigned queue (`milestone_id NULL`) → follows the proven follow-up path, re-assign via P-0/checkpoint.
- (C) Founder direct re-bundle into wave-33.

## Not the blocker (recorded)

- Cred-tripwire: count=2 (w31 token-mint, w32 occupancy); next intended M6 work (a2dd9f3d, ParseUUIDPipe) is credential-independent → 3rd-consecutive-cred-blocked condition NOT met → deferred, NOT tripped. Standing LiveKit founder ask stays open in the digest.
- M6 close correctly withheld: invariant-3 (open child) + undecomposed screen-share/audio-fallback → no premature close regardless.
