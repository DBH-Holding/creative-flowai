FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/orchestrator-service/ apps/orchestrator-service/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @creativeflow/orchestrator-service build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app .
CMD ["node", "apps/orchestrator-service/dist/index.js"]
