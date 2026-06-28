import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

let _pool: Pool | undefined;

function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

export const db = drizzle(getPool, { schema });

export { getPool as pool };
