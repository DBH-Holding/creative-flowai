# CreativeFlow Integrations Hub

Monorepo Node.js/TypeScript — Hub de integrações e orquestrador de automações do CreativeFlow AI.

> ⚠️ Este diretório **não roda dentro do Lovable**. Ele faz parte do mesmo repositório Git para sincronizar via GitHub, mas deve ser executado/deployado separadamente (Docker, VPS, Railway, Render, AWS etc.).

## Arquitetura

```
integrations-hub/
├── apps/
│   ├── api-gateway/         # Fastify — API principal, auth, rate limit, Swagger
│   ├── briefing-service/    # Worker BullMQ — processa briefings
│   ├── orchestrator-service/# Coordenador de integrações futuras
│   └── webhook-service/     # Worker BullMQ — processa webhooks
├── packages/
│   ├── config/              # Configurações centralizadas
│   ├── core/                # Regras de negócio, schemas Zod, services
│   ├── db/                  # Prisma schema, migrations, seed
│   ├── integrations/        # Adapters (CreativeFlow, Instagram, LinkedIn)
│   ├── queue/               # BullMQ + Redis
│   ├── types/               # Tipos e contratos compartilhados
│   └── utils/               # Logger, errors, responses, helpers
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Setup local

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker e Docker Compose

### 1. Instalar dependências

```bash
cd integrations-hub
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Subir infra (Postgres + Redis)

```bash
docker-compose up -d postgres redis
```

### 4. Rodar migrations e seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Iniciar em desenvolvimento

```bash
pnpm dev
```

Acesse:
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/docs
- **Health**: http://localhost:3000/api/v1/health

## Endpoints da API

### Briefings

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/briefings` | Criar briefing |
| `GET` | `/api/v1/briefings` | Listar briefings (paginado) |
| `GET` | `/api/v1/briefings/:id` | Buscar briefing por ID |
| `PATCH` | `/api/v1/briefings/:id/status` | Atualizar status |

### Webhooks

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/webhooks/creativeflow` | Receber retorno do CreativeFlow |

### Health

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/health/ready` | Readiness (DB + Redis) |

## Exemplos de requests

### Criar briefing

```bash
curl -X POST http://localhost:3000/api/v1/briefings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cfk_test_key_for_development_only" \
  -d '{
    "title": "Campanha Black Friday",
    "description": "Campanha para promoção de Black Friday com foco em conversão",
    "objective": "Aumentar vendas em 30%",
    "targetAudience": "Consumidores 25-45, classe B/C",
    "toneOfVoice": "Urgente e persuasivo",
    "channels": ["instagram", "facebook", "google_ads"],
    "campaignType": "promotional",
    "source": "api",
    "createdBy": "partner-xyz"
  }'
```

### Listar briefings

```bash
curl http://localhost:3000/api/v1/briefings?page=1&limit=10&status=received \
  -H "X-API-Key: cfk_test_key_for_development_only"
```

### Atualizar status

```bash
curl -X PATCH http://localhost:3000/api/v1/briefings/{id}/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cfk_test_key_for_development_only" \
  -d '{"status": "approved"}'
```

## Deploy com Docker

```bash
cd integrations-hub
docker-compose up -d --build
```

Isso sobe: API Gateway, Briefing Service, Orchestrator, Webhook Service, PostgreSQL e Redis.

## Status dos briefings

```
received → validated → processing → sent_to_creativeflow → approved → published
                                                         → rejected → received
                                                         → failed   → received
```

## Adapters disponíveis

| Adapter | Status |
|---------|--------|
| CreativeFlow AI | ✅ Funcional (com mock) |
| Instagram | 🔧 Stub preparado |
| LinkedIn | 🔧 Stub preparado |
| Facebook | 📋 Planejado |
| TikTok | 📋 Planejado |
| WhatsApp | 📋 Planejado |

## Stack

- **Runtime**: Node.js 20 + TypeScript
- **Monorepo**: Turborepo + pnpm
- **API**: Fastify + Swagger/OpenAPI
- **Validação**: Zod
- **ORM**: Prisma
- **Banco**: PostgreSQL
- **Cache/Filas**: Redis + BullMQ
- **Auth**: API Key (JWT futuro)
- **Infra**: Docker + docker-compose
