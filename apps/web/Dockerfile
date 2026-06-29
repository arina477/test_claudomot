# StudyHall Web (Vite + React SPA) — Railway deploy image.
# Build context = repo root (pnpm workspace must resolve @studyhall/shared).
# Selected per-service via RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile.
FROM node:22-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

# VITE_API_ORIGIN must be baked into the SPA bundle at build time — Vite
# replaces import.meta.env.VITE_API_ORIGIN statically; it cannot be injected
# at runtime. Railway passes service variables as Docker build args when the
# ARG name matches the variable name, so declaring ARG here + ENV below
# threads the Railway variable into the Vite build.
# Set VITE_API_ORIGIN=https://api-production-b93e.up.railway.app on the
# Railway `web` service (Variables tab) so the deployed bundle reaches the api.
ARG VITE_API_ORIGIN
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN

# Build the SPA (turbo: shared -> web). Emits apps/web/dist (static assets).
RUN pnpm build

# Static file server, baked into the image (deterministic; no runtime fetch).
RUN npm install -g serve

ENV NODE_ENV=production

# serve must bind 0.0.0.0 on Railway's injected $PORT.
CMD ["sh", "-c", "serve -s apps/web/dist -l tcp://0.0.0.0:${PORT:-3000}"]
