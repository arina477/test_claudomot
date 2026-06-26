# Architecture Branch: Tools (Dev Tooling, Linting, Build)

branch: tools
version: v6
status: draft
last_updated: 2026-06-26
authors: v6 architecture pass

---

## Summary

StudyHall ships as a Turborepo + pnpm monorepo with three primary workspaces: `apps/web` (Vite + React 19 SPA, PWA), `apps/api` (NestJS), and `packages/shared` (Zod schemas, TypeScript types, shared constants). A fourth workspace `packages/ui` is reserved for extracted shadcn/ui wrapper components but is not seeded until a second consumer of UI primitives exists. Biome is the single tool for lint and format across all workspaces — no ESLint, no Prettier. Turborepo orchestrates build/lint/typecheck/test with remote caching. TypeScript is strict with project references for incremental compilation. Node version is pinned via `.nvmrc` and `engines` in root `package.json`. Drizzle Kit manages schema migrations out of band from the NestJS build. The command surface exposed to developers and CI is a flat set of `pnpm` scripts at the monorepo root, which in turn delegate to Turborepo tasks.

This tooling architecture feeds `project.yaml`'s `commands[]` array at v6b and is the reference for the CI/CD pipeline authored in the DevOps architecture branch.

---

## Inventory

### Workspaces

```
studyhall/                          ← monorepo root
├── apps/
│   ├── web/                        ← Vite + React 19 SPA (PWA)
│   └── api/                        ← NestJS application
├── packages/
│   ├── shared/                     ← @studyhall/shared: Zod schemas, TS types, shared constants
│   └── ui/                         ← @studyhall/ui: shadcn/ui component wrappers (deferred — seed when second consumer exists)
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── tsconfig.base.json
├── .nvmrc
├── package.json                    ← root scripts + engines field
└── .env.example                    ← committed; secrets never committed (see stack-decisions.md)
```

**`apps/web`** — Vite 5 + React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui. Produces a static bundle deployed to Railway's static hosting. Includes `vite-plugin-pwa` for service worker generation (Workbox) to satisfy feature 4 (installable PWA) and feature 12 (offline-first local cache read). React Query or SWR for server-state; TanStack Router or React Router v7 for client routing — both decisions finalised at B-block when the frontend scaffold is created.

**`apps/api`** — NestJS 10, TypeScript strict. Entry point `src/main.ts`. Drizzle ORM for DB access; `@anatine/zod-nestjs` bridges `@studyhall/shared` Zod schemas to NestJS `ValidationPipe`. Socket.IO integrated via `@nestjs/platform-socket.io`. Built to `dist/` with `tsc` (NestJS CLI build); does not use Vite.

**`packages/shared`** — pure TypeScript library, no runtime dependencies beyond Zod. Exports: Zod schemas (message, channel, server, user, invite, assignment), inferred TS types (`z.infer<>`), and shared enumerations (role names, channel types, presence states). Consumed by both `apps/api` (DTOs) and `apps/web` (form validation, type safety).

**`packages/ui`** — deferred. When created: re-exports shadcn/ui components with StudyHall design-token overrides; depends only on React + Tailwind, no NestJS imports.

### Package manager and workspace config

**pnpm 9** (pinned via `packageManager` field in root `package.json` + `corepack`).

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Workspace protocol for internal dependencies: `"@studyhall/shared": "workspace:*"` — resolved at install time, not published to a registry.

### Node version pin

`.nvmrc`:
```
22
```

Root `package.json` `engines` field:
```json
"engines": { "node": ">=22", "pnpm": ">=9.0.0" }
```

CI uses `actions/setup-node` with `node-version-file: .nvmrc` and `cache: pnpm`.

### TypeScript configuration

**`tsconfig.base.json`** (monorepo root) — shared strict baseline:
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

`exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are enabled because the offline sync engine and message outbox handle a lot of nullable/optional state; catching those at compile time is load-bearing, not pedantic.

**Per-workspace `tsconfig.json`** extends `../../tsconfig.base.json` (or `../tsconfig.base.json` for packages) and sets `references` to internal packages. Example for `apps/api`:
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "baseUrl": ".",
    "paths": { "@studyhall/shared": ["../../packages/shared/src"] }
  },
  "references": [{ "path": "../../packages/shared" }]
}
```

`apps/web` additionally sets `"lib": ["ES2022", "DOM", "DOM.Iterable"]` and `"module": "ESNext"` / `"moduleResolution": "Bundler"` to align with Vite's bundler-mode resolution.

`tsc --build` (project references) enables incremental compilation: only changed packages recompile. Turborepo's `typecheck` task delegates to `tsc --build --noEmit` at each workspace.

### Biome configuration

Single `biome.json` at monorepo root. All workspaces inherit it — no per-package Biome config unless a workspace needs an explicit rule override (currently none planned).

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.8/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useTemplate": "error"
      },
      "suspicious": {
        "noConsoleLog": "warn",
        "noExplicitAny": "error"
      },
      "performance": {
        "noDelete": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": ["**/dist/**", "**/.turbo/**", "**/node_modules/**", "drizzle/migrations/**"]
  }
}
```

Key rule rationale:
- `noExplicitAny: error` — strict TypeScript loses meaning if `any` leaks through lint.
- `useExhaustiveDependencies: error` — offline sync hooks rely on stable effect deps; accidental omissions cause subtle reconnect bugs.
- `noConsoleLog: warn` (not error) — NestJS bootstrap and dev tooling legitimately call `console.log`; warn surfaces them for review without blocking CI.
- `noNonNullAssertion: warn` — NestJS decorators and Drizzle query results sometimes require `!`; warn without blocking.

Biome is run via `biome check --apply` (lint + format together) for local fix passes, and `biome ci` (read-only, exits non-zero on any violation) in CI.

### Turborepo task graph

`turbo.json` at monorepo root:

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env.example", "biome.json", "tsconfig.base.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": [],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

Pipeline behaviour:
- `build` — `^build` means every workspace's build waits for its dependency packages to build first. `packages/shared` builds before `apps/api` and `apps/web`.
- `typecheck` — same topological ordering; incremental via project references.
- `lint` — no inter-workspace dependency; all workspaces lint in parallel.
- `test` — runs after `build` so type-generated artifacts are present.
- `dev` — `persistent: true` + `cache: false` so Turborepo does not attempt to cache or terminate long-running dev servers.
- `db:generate` and `db:migrate` — Drizzle Kit commands; cache disabled because they touch the filesystem and DB.

Remote caching: Turborepo remote cache via `TURBO_TOKEN` + `TURBO_TEAM` environment variables. In CI (GitHub Actions) this cuts redundant rebuilds across PR branches that share a common ancestor. Locally, engineers opt in; not required.

### Vite build configuration (`apps/web`)

`vite.config.ts` key settings:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API responses: network-first, fall back to cache (offline read)
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
          },
        ],
      },
      manifest: {
        name: 'StudyHall',
        short_name: 'StudyHall',
        description: 'Offline-first study communication app',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-socket': ['socket.io-client'],
          'vendor-livekit': ['livekit-client'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
});
```

`manualChunks` splits the heaviest vendor bundles (React runtime, Socket.IO client, LiveKit SDK) so that first-paint loads only what the shell needs. The `NetworkFirst` Workbox strategy for `/api/` routes covers the offline-read requirement for feature 12 before the full IndexedDB local store is wired in — it acts as the first layer of the offline cache.

### Drizzle Kit (migrations)

Drizzle Kit runs in `apps/api`:

```typescript
// apps/api/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
```

`drizzle-kit generate` — produces SQL migration files in `drizzle/migrations/`. Committed to version control. Never run automatically on deploy; migrations are applied explicitly as a pre-deploy step in the Railway deploy hook or CI job.

`drizzle-kit migrate` — applies pending migrations against the target DB. Requires `DATABASE_URL` in the environment.

`drizzle-kit studio` — local DB browser; dev-only, not in CI.

Drizzle schema files live at `apps/api/src/db/schema/` (one file per domain entity, re-exported from `index.ts`). Schema types are inferred (`typeof table.$inferSelect`, `typeof table.$inferInsert`) and re-exported from `@studyhall/shared` where cross-workspace type sharing is needed.

### Root command surface

Root `package.json` scripts (these feed `project.yaml commands[]` at v6b):

```jsonc
"scripts": {
  "dev":         "turbo run dev --parallel",
  "build":       "turbo run build",
  "typecheck":   "turbo run typecheck",
  "lint":        "biome ci .",
  "lint:fix":    "biome check --apply .",
  "test":        "turbo run test",
  "test:watch":  "turbo run test -- --watch",
  "db:generate": "turbo run db:generate --filter=@studyhall/api",
  "db:migrate":  "turbo run db:migrate --filter=@studyhall/api",
  "db:studio":   "cd apps/api && drizzle-kit studio",
  "clean":       "turbo run clean && rimraf node_modules"
}
```

`lint` calls `biome ci` at the root (covers all workspaces via `biome.json`'s include glob) rather than routing through Turborepo, because Biome is fast enough across the whole tree that the caching overhead is not worth the complexity.

`db:generate` and `db:migrate` use `--filter` to target only `apps/api` — they should never run in `packages/shared` or `apps/web`.

### Vitest configuration

Each workspace with tests has its own `vitest.config.ts` extending a shared preset from `packages/shared/vitest.preset.ts`:

```typescript
// packages/shared/vitest.preset.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',   // overridden to 'jsdom' in apps/web
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
});
```

`apps/web` overrides `environment: 'jsdom'` and adds `@testing-library/jest-dom` setup. `apps/api` uses `environment: 'node'` with Supertest for HTTP integration tests.

---

## Conventions

1. **One `biome.json` at the root; no per-package overrides unless a workspace has a documented rule exception.** Consistency beats local flexibility here.

2. **All cross-workspace imports use the `@studyhall/<package>` workspace alias, never relative paths across package boundaries.** `import { MessageSchema } from '@studyhall/shared'`, not `import ... from '../../../packages/shared/src/...'`.

3. **TypeScript `paths` in each `tsconfig.json` must mirror the pnpm workspace protocol.** If a workspace declares `"@studyhall/shared": "workspace:*"` in its `package.json`, it must also declare the matching `paths` entry in its `tsconfig.json`. Divergence causes `tsc --build` to resolve differently from Vite/Node resolution.

4. **`dist/` and `.turbo/` are gitignored at the root.** Build artifacts are never committed. Turborepo remote cache is the persistence layer for CI.

5. **All secrets are environment variables; `.env.example` is the committed template.** Each workspace reads from `process.env` directly; no `dotenv` call in production paths. `dotenv` is loaded only in `apps/api/src/main.ts` behind a `NODE_ENV !== 'production'` guard for local dev.

6. **Migrations are versioned SQL files in `drizzle/migrations/`, committed to git, applied explicitly.** No auto-migrate on server start.

7. **`turbo run dev --parallel` starts all workspaces concurrently.** `apps/web` Vite dev server proxies `/api` and `/socket.io` to `apps/api` on port 3001. No separate reverse proxy needed in local dev.

8. **PWA service worker is not registered in test or CI environments.** `vite-plugin-pwa` is configured with `injectRegister: null` when `VITE_PWA_DISABLED=true`; tests import components without triggering service worker registration.

9. **`noExplicitAny` is an error, not a warning.** Use `unknown` + type narrowing instead. The one exception is third-party library typing gaps where the escape hatch is `// biome-ignore lint/suspicious/noExplicitAny: <reason>` with a mandatory comment.

10. **Package names follow `@studyhall/<name>` scope.** `apps/` packages: `@studyhall/web`, `@studyhall/api`. `packages/` packages: `@studyhall/shared`, `@studyhall/ui`.

---

## Reusability principles

1. **`packages/shared` is the single source of Zod schemas and inferred TypeScript types for every entity that crosses a service or package boundary.** `apps/api` imports schemas and wraps them in NestJS DTOs; `apps/web` imports them for form validation and API response typing. Neither app duplicates a schema.

2. **`packages/ui` is created only when a second consumer of a component exists.** Do not create it for `apps/web` alone — shadcn/ui components live in `apps/web/src/components/ui/` until a second consumer (e.g., an admin panel) is added. Premature abstraction here adds build complexity with no benefit.

3. **Turborepo task caching is the shared build contract.** Any new workspace task added to `turbo.json` must declare its `dependsOn` and `outputs` correctly — incorrect cache keys cause silent cache misses or stale-cache bugs. Use `turbo run <task> --dry=json` to verify the task graph before merging.

4. **Vitest preset in `packages/shared` is the shared test baseline.** Per-workspace configs extend it and add only workspace-specific overrides (jsdom vs node, setup files). Do not duplicate coverage threshold config.

5. **Internal package versions use `workspace:*` only.** Never pin internal packages to semver ranges — it defeats the workspace symlink mechanism and causes resolution divergence between local dev and CI.

---

## Cross-references

- `stack-decisions.md` — LOCKED choices this branch implements: Turborepo+pnpm, TypeScript strict, Vite+React SPA, NestJS, Biome, Vitest, Drizzle.
- `command-center/dev/architecture/modules.md` — NestJS module layout that `apps/api` hosts; TypeScript project references here must cover all modules listed there.
- `command-center/dev/architecture/databases.md` — Drizzle schema location (`apps/api/src/db/schema/`) and migration strategy align with the database branch.
- `command-center/dev/architecture/services.md` — Socket.IO and LiveKit SDK consumption happen in `apps/web` and `apps/api`; Vite `manualChunks` for LiveKit is a direct consequence of the services branch naming it a heavy SDK.
- `command-center/dev/architecture/security.md` — SuperTokens SDK loaded in `apps/web`; NestJS auth guards in `apps/api`; both are covered by the Biome `noExplicitAny` rule that prevents auth-bypass via type erasure.
- `feature-list.md` feature 4 (installable PWA) and feature 12 (offline-first) — directly served by `vite-plugin-pwa` + Workbox `NetworkFirst` runtime caching.
- `project.yaml commands[]` — `dev`, `build`, `typecheck`, `lint`, `test`, `db:generate`, `db:migrate` defined here; v6b writes them to `project.yaml`.

---

## Stack-specific decisions

**Biome over ESLint + Prettier.** Biome is 10–100x faster than ESLint on this codebase size, has zero config drift between lint and format (they share one tool and one config file), and the Turborepo `lint` step is already fast enough to run without caching. ESLint plugin ecosystem breadth is not needed here — the rules enabled in `biome.json` cover every correctness and style concern this stack requires. Decision is LOCKED per `stack-decisions.md`.

**`vite-tsconfig-paths` plugin.** Vite does not read `tsconfig.json` `paths` by default — the plugin bridges them. Without it, workspace-protocol imports resolve in Node (via pnpm symlinks) but fail in Vite's module graph, producing runtime 404s for internal packages.

**`manualChunks` for LiveKit.** `livekit-client` is approximately 400 KB gzipped. Without a manual chunk it lands in the main vendor bundle and delays every page load, even for users who never enter a voice room. Splitting it means the LiveKit chunk is only fetched when the voice room route is first visited.

**Workbox `NetworkFirst` with 5-second timeout for `/api/` routes.** This is the offline-read fallback before the full IndexedDB sync engine (feature 12) is built. It means a user with a cached session can read recent messages on a flaky connection. The timeout prevents the network-first handler from hanging indefinitely — after 5 seconds it falls through to the cache. This is a first-layer offline story, not the full outbox + reconciliation engine (that lives in the modules branch).

**`drizzle-kit strict: true`.** In strict mode, Drizzle Kit requires explicit confirmation before generating destructive migrations (column drops, table drops). CI runs `drizzle-kit generate --check` (read-only) to assert no schema drift; the actual `generate` is a developer action, not automated.

**`composite: true` in `tsconfig.base.json`.** Required for `tsc --build` project references. Every workspace `tsconfig.json` must set this; omitting it for any workspace silently breaks incremental compilation for packages that depend on it.

**No `eslint-disable` or `// @ts-ignore` conventions.** The Biome ignore comment `// biome-ignore lint/<rule>: <reason>` and TypeScript `// @ts-expect-error <reason>` are the only sanctioned suppression mechanisms. Both require an inline reason string. `// @ts-ignore` (no reason) is not used — Biome's `suspicious/noTsIgnore` rule will flag it.

---

## Risk / open items

1. **`packages/ui` creation trigger is undefined.** Currently deferred until a second consumer exists. If the admin panel (H2 feature 17) is built as a separate workspace, this trigger fires; the team should avoid prematurely extracting it as a refactor gesture during H1.

2. **Turborepo remote cache setup in CI requires `TURBO_TOKEN` and `TURBO_TEAM` secrets.** These are not provisioned until the CI/CD branch is implemented (DevOps architecture). Without them, Turborepo still works correctly — it just has no remote cache, so cold CI builds are slower. Not a blocker, but the DevOps branch must capture these as required CI secrets.

3. **`drizzle-kit migrate` in CI vs deploy hook.** The current convention is explicit human-triggered or deploy-hook-triggered migration. The risk is a deploy succeeding while a migration is pending, causing a schema/code mismatch. The DevOps architecture branch should mandate a `db:migrate` step as a blocking pre-deploy action in the Railway deploy hook, before the NestJS process starts.

4. **Service worker in test environments.** `vite-plugin-pwa` with `registerType: 'autoUpdate'` can cause JSDOM test failures if the test environment loads the Vite config. Vitest's `environment: 'jsdom'` does not implement `navigator.serviceWorker`; the `VITE_PWA_DISABLED=true` escape hatch must be set in `apps/web/vitest.config.ts`'s `env` block before the first component test suite is written.

5. **`noUncheckedIndexedAccess` strictness and third-party types.** Some NestJS decorator patterns and Drizzle query result access patterns trip this rule. The expected mitigation is type narrowing rather than suppression, but the team should expect a small set of `// @ts-expect-error` annotations in the NestJS bootstrap and Drizzle schema inference layer until upstream types improve.

6. **pnpm version drift between local and CI.** The `packageManager` field pins pnpm via `corepack`, but developers with corepack disabled will silently use their system pnpm. The CI job must run `corepack enable && corepack prepare` before `pnpm install`. Document this in the project README at the B-block scaffold step.
