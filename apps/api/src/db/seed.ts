import { db, pool } from './index';

async function seed(): Promise<void> {
  console.log('[seed] connected — no fixtures required for wave-2 (auth users created via signup)');
  // Idempotent: nothing to insert. Auth users are created by the SuperTokens
  // signUp hook in UsersModule. This scaffold exists so db:seed is wired and
  // exits 0 cleanly; future waves add fixture rows here.
  const p = pool();
  await p.end();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
