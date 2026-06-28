# StudyHall Web (Vite + React SPA) — Railway deploy image.
# Build context = repo root (pnpm workspace must resolve @studyhall/shared).
# Selected per-service via RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile.
FROM node:22-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
# Build the SPA (turbo: shared -> web). Emits apps/web/dist (static assets).
RUN pnpm build

# Static file server, baked into the image (deterministic; no runtime fetch).
RUN npm install -g serve

ENV NODE_ENV=production

# serve must bind 0.0.0.0 on Railway's injected $PORT.
CMD ["sh", "-c", "serve -s apps/web/dist -l tcp://0.0.0.0:${PORT:-3000}"]
