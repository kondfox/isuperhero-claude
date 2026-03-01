# ---- Install dependencies ----
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/game-logic/package.json packages/game-logic/
COPY packages/game-data/package.json packages/game-data/
RUN bun install --frozen-lockfile

# ---- Build web frontend ----
FROM deps AS build
COPY . .
RUN cd apps/web && bun run build

# ---- Production runtime ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

# Dependencies
COPY --from=deps /app/node_modules/ ./node_modules/

# Server source + workspace packages (Colyseus can't be bundled, run source directly)
COPY --from=build /app/apps/server/src/ ./apps/server/src/
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/packages/ ./packages/

# Web static files
COPY --from=build /app/apps/web/dist/ ./web/

# Drizzle migrations (used by one-shot migration container during deploy)
COPY --from=build /app/apps/server/drizzle/ ./apps/server/drizzle/
COPY --from=build /app/apps/server/drizzle.config.ts ./apps/server/

EXPOSE 2567
CMD ["bun", "run", "apps/server/src/index.ts"]
