# StudyHall API (NestJS) — Railway deploy image.
# Build context = repo root (pnpm workspace must resolve @studyhall/shared).
# Selected per-service via RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile.
FROM node:22-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

RUN corepack enable

# Copy the whole workspace (node_modules / dist excluded via .dockerignore) so
# the lockfile + every workspace package.json are present for a frozen install.
COPY . .

RUN pnpm install --frozen-lockfile
# Build ONLY @studyhall/api and its workspace deps (shared) — NOT web.
# `--filter=@studyhall/api...` (trailing `...`) selects api + everything it
# depends on, so turbo runs shared -> api and skips the web app entirely. This
# keeps the api image lean and, crucially, avoids invoking the web Vite build
# here — the wave-84 build-time CSP guard (apps/web/src/csp.ts) hard-fails a
# prod web build when VITE_API_ORIGIN is unset, and the api service has no VITE_*
# vars. Scoping web out removes that coupling entirely.
RUN pnpm build --filter=@studyhall/api...

ENV NODE_ENV=production

# main.ts reads process.env.PORT (Railway injects it) and binds the server.
CMD ["node", "apps/api/dist/src/main.js"]
