/**
 * Backfill script: populate servers.invite_code for any servers that have
 * invite_code IS NULL (pre-wave-8 rows or rows inserted without the code).
 *
 * App-side CSPRNG — does NOT rely on pgcrypto or any SQL extension.
 * Uses randomBytes(16).toString('base64url') for ~128-bit URL-safe entropy,
 * consistent with the generation path in servers.service.ts.
 *
 * Idempotent: runs WHERE invite_code IS NULL, so re-running is a no-op once
 * all rows have been backfilled.
 *
 * Collision retry: mirrors the createInvite 23505 retry pattern (up to 5
 * attempts per row before giving up with an error).
 *
 * Usage:
 *   DATABASE_URL=<connection-string> pnpm --filter @studyhall/api db:backfill
 */

import { Pool } from 'pg';
import { generateCode } from '../servers/servers.service';

const MAX_RETRIES = 5;

async function backfill(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });

  try {
    // Fetch all servers missing an invite_code
    const { rows } = await pool.query<{ id: string }>(
      'SELECT id FROM servers WHERE invite_code IS NULL',
    );

    if (rows.length === 0) {
      console.info('backfill: no servers with NULL invite_code — nothing to do');
      return;
    }

    console.info(`backfill: found ${rows.length} server(s) with NULL invite_code`);

    let backfilled = 0;

    for (const row of rows) {
      let updated = false;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const code = generateCode();

        try {
          const result = await pool.query(
            'UPDATE servers SET invite_code = $1 WHERE id = $2 AND invite_code IS NULL',
            [code, row.id],
          );

          // Both branches (rowCount > 0 and rowCount === 0) succeed:
          // - rowCount > 0: we updated the row, count it
          // - rowCount === 0: row was already updated by a concurrent run — idempotent, skip
          if ((result.rowCount ?? 0) > 0) {
            backfilled++;
          }
          updated = true;
          break;
        } catch (err: unknown) {
          const pgErr = err as { code?: string };
          if (pgErr.code === '23505' && attempt < MAX_RETRIES - 1) {
            // unique_violation — collision on the generated code; retry with a new one
            console.warn(
              `backfill: unique collision on code for server ${row.id} — retrying (attempt ${attempt + 1})`,
            );
            continue;
          }
          throw err;
        }
      }

      if (!updated) {
        throw new Error(
          `backfill: failed to generate a unique invite_code for server ${row.id} after ${MAX_RETRIES} attempts`,
        );
      }
    }

    console.info(`backfill: done — ${backfilled} server(s) updated`);
  } finally {
    await pool.end();
  }
}

backfill().catch((err) => {
  console.error('backfill failed:', err);
  process.exit(1);
});
