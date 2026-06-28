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
# Mirror the green CI build exactly (turbo: shared -> api -> web) to avoid
# any CI-vs-deploy divergence.
RUN pnpm build

ENV NODE_ENV=production

# main.ts reads process.env.PORT (Railway injects it) and binds the server.
CMD ["node", "apps/api/dist/src/main.js"]
