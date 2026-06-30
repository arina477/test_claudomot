import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    // Exclude integration specs — only vitest.integration.config.ts runs them
    // (serially, with singleFork). Without this exclude, `vitest run` (the
    // first leg of test:ci) also collects test/integration/** with default
    // parallelism, defeating the isolation guarantee. (H1 fix — wave-17 B-6)
    exclude: [...configDefaults.exclude, 'test/integration/**'],
  },
});
