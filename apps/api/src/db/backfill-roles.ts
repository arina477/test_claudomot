/**
 * Backfill script: seed a default 'Member' role for each existing server,
 * then point existing server_members with NULL role_id to their server's
 * default Member role.
 *
 * Contract (wave-10 spec):
 *   - Each server gets exactly ONE default role: name='Member', all flags
 *     false, is_default=true, position=0.
 *   - Existing server_members whose role_id IS NULL are updated to point to
 *     their server's default Member role.
 *   - owner_id stays superuser — no role insertion needed for ownership checks.
 *
 * Idempotent:
 *   - Uses INSERT ... ON CONFLICT DO NOTHING keyed on (server_id, is_default)
 *     via an application-level check (role already exists → skip).
 *   - member UPDATE uses WHERE role_id IS NULL — safe to re-run.
 *
 * Usage:
 *   DATABASE_URL=<connection-string> pnpm --filter @studyhall/api db:backfill-roles
 */

import { Pool } from 'pg';

async function backfill(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });

  try {
    // 1. Fetch all server IDs
    const { rows: serverRows } = await pool.query<{ id: string }>('SELECT id FROM servers');

    if (serverRows.length === 0) {
      console.info('backfill-roles: no servers found — nothing to do');
      return;
    }

    console.info(`backfill-roles: found ${serverRows.length} server(s)`);

    let rolesCreated = 0;
    let membersUpdated = 0;

    for (const server of serverRows) {
      // 2. Upsert the default Member role for this server (idempotent)
      const roleResult = await pool.query<{ id: string }>(
        `INSERT INTO roles (server_id, name, position, manage_server, manage_roles,
                            manage_channels, manage_members, manage_assignments, is_default)
         VALUES ($1, 'Member', 0, false, false, false, false, false, true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [server.id],
      );

      let defaultRoleId: string;

      if (roleResult.rows.length > 0) {
        // Freshly inserted
        defaultRoleId = (roleResult.rows[0] as { id: string }).id;
        rolesCreated++;
      } else {
        // Already exists — fetch it
        const existing = await pool.query<{ id: string }>(
          'SELECT id FROM roles WHERE server_id = $1 AND is_default = true LIMIT 1',
          [server.id],
        );
        if (!existing.rows[0]) {
          throw new Error(
            `backfill-roles: could not find or create default role for server ${server.id}`,
          );
        }
        defaultRoleId = existing.rows[0].id;
      }

      // 3. Point NULL-role members to the default Member role
      const memberUpdate = await pool.query(
        'UPDATE server_members SET role_id = $1 WHERE server_id = $2 AND role_id IS NULL',
        [defaultRoleId, server.id],
      );
      membersUpdated += memberUpdate.rowCount ?? 0;
    }

    console.info(
      `backfill-roles: done — ${rolesCreated} default role(s) created, ${membersUpdated} member(s) updated`,
    );
  } finally {
    await pool.end();
  }
}

backfill().catch((err) => {
  console.error('backfill-roles failed:', err);
  process.exit(1);
});
