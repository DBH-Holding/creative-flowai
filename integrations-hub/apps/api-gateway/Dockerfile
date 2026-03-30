FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/api-gateway/ apps/api-gateway/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @creativeflow/api-gateway build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app .
EXPOSE 3000
CMD ["node", "apps/api-gateway/dist/server.js"]
