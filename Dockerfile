# =============================================================================
# FoodieFinds Dockerfile
# =============================================================================
# Single-stage build — npm workspaces hoist deps to /app/node_modules so a
# subsequent `npx vite build` (running from /app, using the root vite.config.ts)
# resolves react/vite/etc from the hoisted location.
#
# Runtime uses `tsx` to run server/index.prod.ts directly so the server stays
# a single TS source of truth. esbuild bundling could shave ~30 MB off the
# image but adds a build step we don't currently need for the test deploy.
# =============================================================================

FROM node:20-slim

WORKDIR /app

# OS deps for native modules (drizzle / ws use sodium, etc).
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Manifests + lockfile first for layer caching. The Replit-shaped repo doesn't
# have apps/*/package-lock.json, so this is the simplest cacheable copy.
COPY package.json package-lock.json* ./
COPY apps/ ./apps/
COPY packages/ ./packages/

# Install all workspace deps (devDeps included — vite is in apps/user-app's
# package.json and we need it during build).
RUN npm install --include=dev --no-audit --no-fund

# Copy the rest of the source.
COPY . .

# Build the React client into dist/public (root vite.config.ts handles this).
RUN npm run build

ENV NODE_ENV=production \
    PORT=5000 \
    LOG_LEVEL=info

EXPOSE 5000

# Boot script:
#   1. If DATABASE_URL is set, run pending migrations + seed (idempotent).
#   2. Start the server. The factory in server/storage.ts auto-picks
#      DrizzleStorage (Postgres) or MemStorage based on DATABASE_URL.
#
# `dumb-init` makes Ctrl-C / SIGTERM propagate cleanly so Render can stop
# the container without a 10-second forced kill.
CMD ["dumb-init", "sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npm run db:migrate && npm run db:seed; fi && npm start"]
