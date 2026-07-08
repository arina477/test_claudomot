/**
 * EncryptionKeyService — wave-79 E2E DM encryption (task 60bda5be)
 *
 * Server-blind key registry: stores/rotates/fetches a user's PUBLIC key in
 * user_encryption_keys, keyed on the SuperTokens opaque userId (text).
 *
 * SECURITY INVARIANT: the server NEVER receives or stores private material.
 * There is no private-key column; only public_key + algorithm are persisted.
 * The private key never leaves the client device (see task 3fb88f44).
 *
 * Rotation semantics: one active key row per user (UNIQUE(user_id)). An
 * upsert (ON CONFLICT (user_id) DO UPDATE) REPLACES the row — the old public
 * key is discarded and updated_at is bumped.
 */

import { Injectable } from '@nestjs/common';
import type { EncryptionKeyInput } from '@studyhall/shared';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { user_encryption_keys } from '../db/schema/index';

export interface StoredPublicKey {
  userId: string;
  publicKey: string;
  algorithm: string;
  createdAt: Date;
}

@Injectable()
export class EncryptionKeyService {
  // -------------------------------------------------------------------------
  // upsertKey — store or rotate the caller's public key.
  //
  // ON CONFLICT (user_id) DO UPDATE replaces public_key + algorithm and bumps
  // updated_at, guaranteeing exactly one active row per user. created_at is
  // preserved on the row's first insert only (not touched on rotation).
  // -------------------------------------------------------------------------

  async upsertKey(userId: string, input: EncryptionKeyInput): Promise<void> {
    await db
      .insert(user_encryption_keys)
      .values({
        user_id: userId,
        public_key: input.publicKey,
        algorithm: input.algorithm,
      })
      .onConflictDoUpdate({
        target: user_encryption_keys.user_id,
        set: {
          public_key: input.publicKey,
          algorithm: input.algorithm,
          updated_at: sql`now()`,
        },
      });
  }

  // -------------------------------------------------------------------------
  // getKeyFor — fetch the target user's public key row, or null if none is
  // registered. This is the raw fetch WITHOUT any visibility gate; callers
  // MUST apply the who_can_dm gate before exposing the result (see
  // ProfileController.getEncryptionKey). Kept separate so the permission
  // decision stays in the controller/service seam, not buried in the query.
  // -------------------------------------------------------------------------

  async getKeyFor(userId: string): Promise<StoredPublicKey | null> {
    const [row] = await db
      .select({
        userId: user_encryption_keys.user_id,
        publicKey: user_encryption_keys.public_key,
        algorithm: user_encryption_keys.algorithm,
        createdAt: user_encryption_keys.created_at,
      })
      .from(user_encryption_keys)
      .where(eq(user_encryption_keys.user_id, userId))
      .limit(1);

    return row ?? null;
  }
}
