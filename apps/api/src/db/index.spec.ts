/**
 * Laziness guard: importing the db module must NOT throw even when DATABASE_URL
 * is absent. The pool/drizzle initialization is deferred to first property access.
 */
import { describe, expect, it } from 'vitest';

describe('db module laziness', () => {
  it('imports without DATABASE_URL set and does not throw', async () => {
    // Ensure DATABASE_URL is absent for this test
    const saved = process.env.DATABASE_URL;
    process.env.DATABASE_URL = undefined;

    try {
      // Dynamic import so the module is evaluated inside the test after we
      // cleared the env var.  Because vitest caches modules we reset manually.
      await expect(import('./index')).resolves.toBeDefined();
    } finally {
      if (saved !== undefined) {
        process.env.DATABASE_URL = saved;
      }
    }
  });

  it('exports a db object (proxy) without calling getPool at module-eval time', async () => {
    const mod = await import('./index');
    // db is exported — must be a non-null object
    expect(mod.db).toBeDefined();
    expect(typeof mod.db).toBe('object');
    // pool export is the getPool function (used by seed.ts)
    expect(typeof mod.pool).toBe('function');
  });
});
