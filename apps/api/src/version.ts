/**
 * Reports the package version at runtime.
 *
 * process.env.npm_package_version is only set when the process was started
 * via `npm run` / `pnpm run`. In production (node dist/src/main.js) it is
 * absent, so we fall back to reading package.json directly.
 *
 * The challenge: a single relative literal cannot satisfy both depths:
 *   - apps/api/src/version.ts  (vitest / tsx)  → '../package.json' is correct
 *   - apps/api/dist/src/version.js (prod node)  → '../../package.json' is correct
 *
 * Strategy: try-both-paths. Attempt '../../package.json' first (prod path),
 * then '../package.json' (src/vitest path). One of the two will always resolve
 * to apps/api/package.json regardless of execution context.
 *
 * Fallback: '0.0.1' so health never returns an empty string.
 */

function readPackageVersion(): string {
  if (process.env.npm_package_version) {
    return process.env.npm_package_version;
  }
  for (const rel of ['../../package.json', '../package.json']) {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: require() is fine in CommonJS NestJS build
      const p = require(rel) as Record<string, any>;
      if (p.version) return p.version as string;
    } catch {
      // try next path
    }
  }
  return '0.0.1';
}

export const API_VERSION: string = readPackageVersion();
