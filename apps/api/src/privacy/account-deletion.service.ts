import { ConflictException, Injectable } from '@nestjs/common';
import type { DeleteAccountBlockedResponse, DeleteAccountResponse } from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import Session from 'supertokens-node/recipe/session';
import { db } from '../db/index';
import { server_members, servers, users } from '../db/schema/index';

@Injectable()
export class AccountDeletionService {
  async deleteAccount(callerUserId: string): Promise<DeleteAccountResponse> {
    // ── Idempotency guard ─────────────────────────────────────────────────────
    // If the account is already soft-deleted (deleted_at IS NOT NULL) we treat
    // this as a success rather than an error — the session-verify override will
    // already have rejected the caller's token, but the service must not throw
    // if it is somehow reached a second time.
    const existingRows = await db
      .select({ deleted_at: users.deleted_at })
      .from(users)
      .where(eq(users.id, callerUserId))
      .limit(1);

    const existing = existingRows[0];
    if (existing?.deleted_at !== null && existing?.deleted_at !== undefined) {
      return { status: 'deleted' };
    }

    // ── Owned-server guard ────────────────────────────────────────────────────
    // Block deletion if the caller owns any servers. The owner_id FK on servers
    // uses NO ACTION — orphaning a server with a scrubbed owner is not allowed.
    // Transfer/cascade is a later slice; this block forces the user to resolve
    // ownership first.
    const ownedServers = await db
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

    // ── Erasure ───────────────────────────────────────────────────────────────
    // The caller owns no servers — proceed with soft-deletion.
    //
    // Placeholder scheme:
    //   email   → "deleted+<userId>@deleted.invalid"
    //             (email is NOT NULL + UNIQUE; a constant would collide on the
    //             2nd deletion; per-userId makes the value unique and
    //             deterministic)
    //   username → null
    //              (username is nullable, uniqueIndex is on lower(username);
    //               nulling avoids any unique-constraint collision without
    //               reserving a per-user slug in the index)
    //   display_name → 'Deleted user'
    //   avatar_url   → null
    //   avatar_key   → null  (storage key — PII-linked residue; must be cleared)

    await db
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

    // Revoke all active SuperTokens sessions for the caller. This invalidates
    // every access-token / refresh-token the user currently holds, preventing
    // any in-flight session from continuing after erasure. Combined with the
    // session-verify and signIn overrides in supertokens.config.ts (which check
    // deleted_at on every request), this ensures both doors are independently
    // shut.
    await Session.revokeAllSessionsForUser(callerUserId);

    // Leave all servers — delete the caller's server_members rows. The
    // owned-server guard above passed, so the caller owns none of these servers.
    await db.delete(server_members).where(eq(server_members.user_id, callerUserId));

    // Presence is purely in-memory (PresenceService.presenceMap) — no DB rows
    // to clear. The in-process socket connections will be dropped when the
    // session revocation above causes the next request/ping to fail auth, at
    // which point the gateway's disconnect handler clears presence normally.
    // We do not inject PresenceService here to avoid a circular-module risk and
    // because in-memory state is inherently ephemeral.

    return { status: 'deleted' };
  }
}
