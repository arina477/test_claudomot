# Wave 1 — B-0 Branch & Schema

**Branch:** wave-1-foundation-scaffold (off main)
**Task claimed:** cbf25dd5-… → in_progress
**Commit:** 3530e75

## Env
No new env vars committed this wave. `.env.example` already carries future placeholders (auth/storage/etc. are later waves). API/web origins use localhost defaults in code.

## Deps + scaffold (Action 4)
Full greenfield monorepo skeleton created by devops-engineer: 20 files (root configs + 3 workspace package.json + tsconfigs + minimal compilable placeholders). `pnpm install` succeeded (755 packages; `pnpm-lock.yaml` committed). `pnpm lint` (Biome) + `pnpm typecheck` both exit 0 on the skeleton.

## Schema (Actions 5–8): SKIPPED
No DB this wave — Postgres + Drizzle is the deferred auth-backend task (b9118041). `schema_skipped: true`.

## Deviations (all accepted — minor, no silent contradictions)
1. Added `@types/react` + `@types/react-dom` to apps/web (React 19 ships no bundled types; required for JSX typecheck).
2. apps/api/tsconfig overrides module=CommonJS / moduleResolution=Node (NestJS decorators incompatible with base NodeNext without .js import extensions).
3. vite.config uses `import { defineConfig } from 'vitest/config'` (Biome import organizer breaks triple-slash directives; idiomatic equivalent).
4. pnpm 11.7 added `allowBuilds` supply-chain block (biome/esbuild/@nestjs/core true; @scarf/scarf false).
5. db:* root scripts are `echo ... && exit 0` placeholders (no DB workspace scripts yet; real ones at B-4 when Drizzle lands — but DB is deferred, so they stay no-op this wave).

---
```yaml
branch: wave-1-foundation-scaffold
deps_added: [turbo, vite, "@vitejs/plugin-react", vite-plugin-pwa, react, react-dom, "@nestjs/core", "@nestjs/common", "@nestjs/platform-express", reflect-metadata, rxjs, zod, "@anatine/zod-nestjs", "@biomejs/biome", vitest, "@testing-library/react", "@testing-library/jest-dom", jsdom, supertest, tailwindcss, "@tailwindcss/vite", typescript]
env_vars_added: []
schema_skipped: true
migrations: []
orm_models_changed: []
backfill_ran: false
deviations: [types-react-added, api-commonjs-override, vitest-config-import, pnpm-allowbuilds, db-placeholder-scripts]
```
