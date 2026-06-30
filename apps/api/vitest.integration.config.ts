/**
 * Vitest project config for real-Postgres integration tests (wave-17+).
 *
 * B-4 (MANDATORY per P-3/P-4): integration specs run serially — NOT in
 * parallel — because they share a single Postgres DB (the CI service) and use
 * truncate-between-cases for isolation. Parallel file execution would let one
 * file's TRUNCATE wipe another file's in-flight rows, causing non-deterministic
 * failures the moment a second integration spec lands (task 02fa8011+).
 *
 * fileParallelism: false  — all integration spec files run serially within this
 *                           project so the shared-DB + truncate-between strategy
 *                           is safe for any number of integration spec files.
 *
 * pool: { singleFork: true } — runs integration specs in a single worker
 *                               process, reinforcing serial execution and
 *                               eliminating any cross-worker module-cache
 *                               contamination (CF-2 guard: DATABASE_URL must be
 *                               set once per process, not race across forks).
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.spec.ts'],
    // Serial execution — see module docstring above (B-4 requirement)
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // No setupFiles: pg-harness handles its own bootstrap via module-level
    // side effects (CF-2) + beforeAll/afterAll in each spec.
    reporters: ['verbose'],
  },
});
