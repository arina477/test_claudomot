import { ConflictException, Injectable, Logger } from '@nestjs/common';
import type { DeleteAccountBlockedResponse, DeleteAccountResponse } from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import Session from 'supertokens-node/recipe/session';
import { db } from '../db/index';
import { server_members, servers, users } from '../db/schema/index';

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  async deleteAccount(callerUserId: string): Promise<DeleteAccountResponse> {
    // ── Idempotency guard (fast-path, outside transaction) ────────────────────
    // If the account is already soft-deleted (deleted_at IS NOT NULL) we treat
    // this as a success rather than an error — the session-verify override will
    // already have rejected the caller's token, but the service must not throw
    // if it is somehow reached a second time.
    //
    // Kept outside the transaction as a cheap short-circuit. If this read races
    // with a concurrent first deletion the transaction below handles it safely
    // (the scrub UPDATE is idempotent on an already-scrubbed row and the
    // SERIALIZABLE isolation closes the TOCTOU window end-to-end).
    const existingRows = await db
      .select({ deleted_at: users.deleted_at })
      .from(users)
      .where(eq(users.id, callerUserId))
      .limit(1);

    const existing = existingRows[0];
    if (existing?.deleted_at !== null && existing?.deleted_at !== undefined) {
      return { status: 'deleted' };
    }

    // ── Atomic erasure transaction ────────────────────────────────────────────
    // The owner-check, PII scrub, and server_members deletion are wrapped in a
    // single SERIALIZABLE transaction so that either ALL three mutations commit
    // or NONE do. SERIALIZABLE also closes a TOCTOU window where a concurrent
    // createServer could insert a server owned by the caller between the
    // owner-check SELECT and the UPDATE.
    //
    // drizzle-orm 0.45.2 (node-postgres adapter) — PgTransactionConfig accepts
    // isolationLevel: 'read uncommitted' | 'read committed' | 'repeatable read'
    // | 'serializable' — serializable is fully supported.
    //
    // ConflictException thrown inside the callback aborts the transaction
    // (nothing mutated yet) and is rethrown by Drizzle with the original body
    // intact, so callers still receive the { status:'blocked', reason, servers }
    // shape unchanged.
    await db.transaction(
      async (tx) => {
        // ── Owner-check (first in txn so we roll back before any mutation) ──
        const ownedServers = await tx
          .select({ id: servers.id, name: servers.name })
          .from(servers)
          .where(eq(servers.owner_id, callerUserId));

        if (ownedServers.length > 0) {
          const body: DeleteAccountBlockedResponse = {
            status: 'blocked',
            reason: 'Transfer or delete the servers you own before deleting your account',
            servers: ownedServers.map((s) => ({ id: s.id, name: s.name })),
          };
          throw new ConflictException(body);
        }

        // ── PII scrub ────────────────────────────────────────────────────────
        // Placeholder scheme:
        //   email        → "deleted+<userId>@deleted.invalid"
        //                  (email is NOT NULL + UNIQUE; a constant would collide
        //                  on the 2nd deletion; per-userId makes it unique and
        //                  deterministic)
        //   username     → null
        //                  (nullable; nulling avoids unique-constraint collision)
        //   display_name → 'Deleted user'
        //   avatar_url   → null
        //   avatar_key   → null  (storage key — PII-linked residue; must be cleared)
        await tx
          .update(users)
          .set({
            display_name: 'Deleted user',
            username: null,
            email: `deleted+${callerUserId}@deleted.invalid`,
            avatar_url: null,
            avatar_key: null,
            deleted_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(users.id, callerUserId));

        // ── Membership cleanup ───────────────────────────────────────────────
        // Leave all servers — delete the caller's server_members rows. The
        // owned-server guard above passed, so the caller owns none of these.
        await tx.delete(server_members).where(eq(server_members.user_id, callerUserId));
      },
      { isolationLevel: 'serializable' },
    );

    // ── Session revocation (best-effort, AFTER transaction commits) ───────────
    // The transaction above is already committed at this point. The signIn and
    // getSession/refreshSession overrides in supertokens.config.ts read
    // users.deleted_at on every auth/verify/refresh — so the moment the
    // transaction commits, every re-auth door independently rejects this user.
    // Session revocation here is defence-in-depth: it eagerly invalidates
    // in-flight tokens. A failure here must NOT strand the already-committed
    // erasure or produce a misleading 500 to the caller.
    try {
      await Session.revokeAllSessionsForUser(callerUserId);
    } catch (err) {
      this.logger.warn(
        `revokeAllSessionsForUser failed for ${callerUserId} after successful erasure — erasure is committed and both re-auth doors are closed via deleted_at; token revocation is defence-in-depth and its failure is non-fatal.`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    // Presence is purely in-memory (PresenceService.presenceMap) — no DB rows
    // to clear. The in-process socket connections will be dropped when the
    // session revocation above causes the next request/ping to fail auth, at
    // which point the gateway's disconnect handler clears presence normally.
    // We do not inject PresenceService here to avoid a circular-module risk and
    // because in-memory state is inherently ephemeral.

    return { status: 'deleted' };
  }
}
