/**
 * Reports the package version at runtime.
 *
 * process.env.npm_package_version is only set when the process was started
 * via `npm run` / `pnpm run`. In production (node dist/src/main.js) it is
 * absent. This module reads the real version from package.json directly,
 * which is always present next to the compiled dist/ tree.
 *
 * Strategy: require('../package.json') resolves relative to this file's
 * location at runtime.  dist/src/version.js → ../../package.json → apps/api/package.json.
 * The TypeScript source lives at apps/api/src/version.ts, compiles to
 * apps/api/dist/src/version.js, so '../..' from the compiled file lands at
 * apps/api/package.json — the correct location.
 *
 * Fallback: '0.0.1' so health never returns an empty string.
 */

// biome-ignore lint/suspicious/noExplicitAny: require() is fine in CommonJS NestJS build
const pkg = require('../package.json') as Record<string, any>;

export const API_VERSION: string =
  process.env.npm_package_version ?? (pkg.version as string | undefined) ?? '0.0.1';
