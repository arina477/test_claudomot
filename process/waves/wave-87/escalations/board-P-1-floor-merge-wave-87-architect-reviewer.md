# BOARD vote — architect-reviewer — P-1-floor-merge-wave-87

## Vote
APPROVE A

## Rationale (<=150 words, cite evidence paths)
Ground truth verified. `createServer` seeds `is_default=true` 'Member' (servers.service.ts:102-111); both join paths insert `{server_id,user_id}` only → `role_id` NULL (:708-711, :751-755); `backfill-roles.ts` perpetually UPDATEs NULL-role members onto the default (:78-82). The fix converges joins onto the existing default in the shared insert path — a strangler move that retires a standing repair job. Blast radius is genuinely tiny: server-side insert + tests, ~0 external users, behavior-preserving. Option A wins on technical coherence and reversibility (single revertable commit). Option B — bundling 6 cross-cutting bugs (auth/servers/privacy/web) into one branch/deploy — inflates integration surface, couples independent rollback decisions, and defeats floor-as-quality by gaming task count; strictly worse blast/rollback profile. Floor is a proxy for value, not a hard gate; overriding for a coherent single fix is correct. One caveat below.

## Hard-stop?
none

## Dissent note (only if APPROVE with concerns)
Defensive-handling requirement, not a blocker: there is NO unique constraint on `(server_id, is_default)` in the schema (servers.ts:54 — plain boolean default false; grep found no uniqueIndex). Legacy pre-backfill servers may have zero OR multiple `is_default` rows. The join-path fix MUST resolve the default via a defensive `SELECT ... WHERE is_default=true LIMIT 1` (mirroring backfill-roles.ts:65-74) and handle the no-default case — either create-on-demand inside the join txn or fall back to NULL (preserving today's backfill-repairable behavior) rather than throwing and breaking joins. Spec/plan must cover this branch and test it. Also: keep the standing backfill in place until the fix has shipped and drained, then retire it in a follow-up — do not delete it in the same wave.
