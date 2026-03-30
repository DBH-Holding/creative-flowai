# CreativeFlow Integrations Hub

Monorepo Node.js/TypeScript — Hub de integrações e orquestrador de automações do CreativeFlow AI.

> ⚠️ Este diretório **não roda dentro do Lovable**. Ele faz parte do mesmo repositório Git para sincronizar via GitHub, mas deve ser executado/deployado separadamente (Docker, VPS, Railway, Render, AWS etc.).

---

## 📋 Índice

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Setup Local](#setup-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação](#autenticação)
- [Modelos de Dados](#modelos-de-dados)
- [Fluxo de Briefings](#fluxo-de-briefings)
- [Webhooks](#webhooks)
- [Workers e Filas](#workers-e-filas)
- [Adapters de Integração](#adapters-de-integração)
- [Deploy](#deploy)
- [Exemplos de Uso](#exemplos-de-uso)

---

## Arquitetura

```
integrations-hub/
├── apps/
│   ├── api-gateway/           # Fastify — API principal, auth, rate limit, Swagger
│   ├── briefing-service/      # Worker BullMQ — processa briefings recebidos
│   ├── orchestrator-service/  # Coordena integrações entre adapters
│   └── webhook-service/       # Worker BullMQ — processa webhooks recebidos
├── packages/
│   ├── config/                # Configurações centralizadas (env vars)
│   ├── core/                  # Regras de negócio, schemas Zod, services
│   ├── db/                    # Prisma schema, migrations, seed
│   ├── integrations/          # Adapters plugáveis (CreativeFlow, Instagram, LinkedIn)
│   ├── queue/                 # BullMQ + Redis (filas de processamento)
│   ├── types/                 # Tipos e contratos TypeScript compartilhados
│   └── utils/                 # Logger (pino), errors, responses, helpers
├── docker-compose.yml         # PostgreSQL + Redis + todos os serviços
├── turbo.json                 # Turborepo config
└── pnpm-workspace.yaml        # pnpm workspaces
```

### Fluxo de dados

```
Cliente externo (API Key)
       │
       ▼
  API Gateway (Fastify)
       │
       ├── Valida auth (X-API-Key → hash → IntegrationClient)
       ├── Valida payload (Zod schemas)
       ├── Persiste no banco (Prisma)
       └── Enfileira job (BullMQ → Redis)
              │
              ▼
       Workers (briefing-service / webhook-service)
              │
              ├── Processa briefing
              ├── Chama adapters (CreativeFlow AI, Instagram, etc.)
              └── Atualiza status no banco
```

---

## Stack

| Tecnologia | Uso |
|---|---|
| **Node.js 20** | Runtime |
| **TypeScript 5** | Tipagem estática |
| **Turborepo** | Build e cache de monorepo |
| **pnpm 9** | Gerenciador de pacotes |
| **Fastify** | HTTP framework (API Gateway) |
| **@fastify/swagger** | Documentação OpenAPI automática |
| **Zod** | Validação de schemas |
| **Prisma** | ORM + migrations |
| **PostgreSQL** | Banco relacional |
| **Redis** | Cache + broker de filas |
| **BullMQ** | Filas de processamento assíncronas |
| **Pino** | Logger estruturado |
| **Docker** | Containerização |

---

## Setup Local

### Pré-requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
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
- **Readiness**: http://localhost:3000/api/v1/health/ready

---

## Variáveis de Ambiente

| Variável | Descrição | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://creativeflow:creativeflow@localhost:5432/creativeflow_integrations` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `API_PORT` | Porta da API | `3000` |
| `API_HOST` | Host da API | `0.0.0.0` |
| `NODE_ENV` | Ambiente | `development` |
| `JWT_SECRET` | Secret para JWT (futuro) | — |
| `API_KEY_SALT` | Salt para hash de API keys | — |
| `CREATIVEFLOW_API_URL` | URL base do Supabase (edge functions) | — |
| `CREATIVEFLOW_API_KEY` | API key do CreativeFlow | — |
| `RATE_LIMIT_MAX` | Requisições por janela | `100` |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit (ms) | `60000` |
| `LOG_LEVEL` | Nível de log | `info` |

---

## Endpoints da API

### Briefings

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/v1/briefings` | Criar um novo briefing | ✅ API Key |
| `GET` | `/api/v1/briefings` | Listar briefings (paginado + filtros) | ✅ API Key |
| `GET` | `/api/v1/briefings/:id` | Buscar briefing por ID | ✅ API Key |
| `PATCH` | `/api/v1/briefings/:id/status` | Atualizar status do briefing | ✅ API Key |

### Webhooks

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/api/v1/webhooks/creativeflow` | Receber webhook do CreativeFlow AI | ❌ Público |

### Health

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health check básico | ❌ Público |
| `GET` | `/api/v1/health/ready` | Readiness (verifica DB + Redis) | ❌ Público |

---

## Autenticação

A API usa autenticação por **API Key** enviada no header `X-API-Key`.

### Como funciona

1. Cada cliente de integração possui uma API Key única
2. A key é hasheada com salt (`API_KEY_SALT`) via `crypto.createHash('sha256')`
3. O hash é armazenado na tabela `integration_clients`
4. A cada request, o hash da key enviada é comparado com os hashes ativos

### Formato da API Key

```
cfk_{environment}_{random_string}

Exemplos:
cfk_test_key_for_development_only
cfk_prod_a1b2c3d4e5f6g7h8i9j0
```

### Headers obrigatórios

```http
X-API-Key: cfk_prod_sua_chave_aqui
Content-Type: application/json
```

### Modelo IntegrationClient

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | cuid | ID único |
| `name` | string | Nome do cliente (único) |
| `apiKeyHash` | string | Hash SHA-256 da API key |
| `status` | enum | `active`, `inactive`, `revoked` |
| `rateLimit` | int | Limite de requests/minuto (default: 100) |
| `allowedOrigins` | string[] | Origens permitidas (CORS) |
| `createdAt` | DateTime | Data de criação |

### Gerenciamento de API Keys

Para criar uma nova API Key para um cliente:

```bash
# 1. Gere uma key aleatória
API_KEY="cfk_prod_$(openssl rand -hex 16)"
echo "API Key: $API_KEY"

# 2. Gere o hash (use o mesmo salt do .env)
echo -n "${API_KEY}${API_KEY_SALT}" | sha256sum

# 3. Insira no banco via Prisma ou SQL
```

O seed (`packages/db/src/seed.ts`) já cria um cliente de desenvolvimento com a key `cfk_test_key_for_development_only`.

---

## Modelos de Dados

### Briefing

```typescript
interface Briefing {
  id: string;               // cuid
  externalId?: string;       // ID do sistema de origem (único)
  title: string;             // Título da campanha
  description: string;       // Descrição detalhada
  objective: string;         // Objetivo da campanha
  targetAudience: string;    // Público-alvo
  toneOfVoice: string;       // Tom de voz desejado
  channels: string[];        // Canais: ["instagram", "facebook", "google_ads"]
  campaignType: string;      // Tipo: "promotional", "awareness", "engagement"
  attachments: string[];     // URLs de anexos
  references: string[];      // URLs de referências
  status: BriefingStatus;    // Status atual
  source: string;            // Origem: "api", "web", "webhook"
  sourceSystem?: string;     // Sistema de origem (ex: "client-crm")
  createdBy: string;         // Identificação de quem criou
  createdAt: Date;
  updatedAt: Date;
}
```

### WebhookEvent

```typescript
interface WebhookEvent {
  id: string;
  provider: string;          // "creativeflow", "instagram", etc.
  eventType: string;         // "briefing.completed", "briefing.failed"
  payload: object;           // Payload original do webhook
  processed: boolean;        // Se já foi processado pelo worker
  createdAt: Date;
}
```

### ProcessingJob

```typescript
interface ProcessingJob {
  id: string;
  briefingId: string;        // Referência ao briefing
  jobType: JobType;          // "send_to_creativeflow", "process_webhook", "publish_campaign"
  status: JobStatus;         // "pending", "processing", "completed", "failed", "retrying"
  attempts: number;          // Tentativas realizadas
  lastError?: string;        // Último erro registrado
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Fluxo de Briefings

### Status

```
received → validated → processing → sent_to_creativeflow → approved → published
                                                          → rejected → received
                                                          → failed   → received
```

### Ciclo de vida

1. **received** — Briefing criado via API
2. **validated** — Payload validado por Zod schemas
3. **processing** — Em processamento pelo worker
4. **sent_to_creativeflow** — Enviado para o CreativeFlow AI gerar campanha
5. **approved** — Campanha aprovada
6. **published** — Publicada nos canais destino
7. **rejected** — Rejeitado, retorna para `received`
8. **failed** — Erro no processamento, pode ser retentado

---

## Webhooks

### CreativeFlow Webhook

O endpoint `POST /api/v1/webhooks/creativeflow` recebe notificações quando uma campanha é processada.

#### Payload esperado

```json
{
  "briefingId": "clx1234...",
  "status": "completed",
  "observations": "Campanha gerada com sucesso",
  "assets": [
    "https://storage.example.com/campaign/post-1.jpg",
    "https://storage.example.com/campaign/ad-1.mp4"
  ],
  "logs": ["Step 1: Analyzed briefing", "Step 2: Generated copy"],
  "timestamps": {
    "receivedAt": "2024-01-15T10:00:00Z",
    "processedAt": "2024-01-15T10:01:30Z",
    "completedAt": "2024-01-15T10:02:00Z"
  }
}
```

#### Fluxo de processamento

1. Webhook recebido → salvo em `webhook_events`
2. Job enfileirado no `webhookQueue`
3. Worker processa: atualiza status do briefing, salva assets
4. Em caso de falha, o BullMQ gerencia retentativas

---

## Workers e Filas

### Briefing Service Worker

- **Fila**: `briefing-queue`
- **Função**: Processa briefings novos, valida dados, envia para adapters
- **Retentativas**: Configurado no BullMQ

### Webhook Service Worker

- **Fila**: `webhook-queue`
- **Função**: Processa webhooks recebidos, atualiza status de briefings
- **Idempotência**: Verifica `processed` flag antes de reprocessar

### Orchestrator Service

- **Função**: Coordena integrações complexas que envolvem múltiplos adapters
- **Status**: Base implementada, expansão conforme novos adapters

---

## Adapters de Integração

### Interface padrão

Todos os adapters implementam a interface `IntegrationAdapter`:

```typescript
interface IntegrationAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  healthCheck(): Promise<boolean>;
}
```

### Adapter Registry

Os adapters são registrados no `AdapterRegistry` que fornece:
- Registro/lookup de adapters por nome
- Health check consolidado de todos os adapters
- Listagem de adapters disponíveis

### Adapters disponíveis

| Adapter | Status | Descrição |
|---|---|---|
| **CreativeFlow AI** | ✅ Funcional (mock) | Envia briefings para geração de campanha |
| **Instagram** | 🔧 Stub | Publicação direta de posts |
| **LinkedIn** | 🔧 Stub | Publicação de conteúdo |
| **Facebook** | 📋 Planejado | Posts e Meta Ads |
| **TikTok** | 📋 Planejado | Publicação de vídeos |
| **WhatsApp** | 📋 Planejado | Notificações |
| **Google Ads** | 📋 Planejado | Criação de campanhas |

### Criando um novo adapter

```typescript
import type { IntegrationAdapter } from '@creativeflow/types';

export class MeuAdapter implements IntegrationAdapter {
  name = 'meu-adapter';
  private connected = false;

  async connect(): Promise<void> {
    // Configurar conexão
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<boolean> {
    // Verificar se a integração está saudável
    return this.connected;
  }

  // Adicione métodos específicos da integração
  async publishPost(content: string): Promise<void> {
    // ...
  }
}
```

---

## Deploy

### Docker Compose (recomendado para testes)

```bash
cd integrations-hub
docker-compose up -d --build
```

Isso sobe todos os serviços: API Gateway, Workers, PostgreSQL e Redis.

### Deploy no Render

#### API Gateway (Web Service)

| Config | Valor |
|---|---|
| **Root Directory** | `integrations-hub` |
| **Build Command** | `npm install -g pnpm && pnpm install && pnpm build` |
| **Start Command** | `node apps/api-gateway/dist/server.js` |
| **Environment** | Configurar todas as env vars do `.env.example` |

#### Workers (Background Workers)

Cada worker deve ser um serviço separado:

| Worker | Start Command |
|---|---|
| Briefing Service | `node apps/briefing-service/dist/worker.js` |
| Webhook Service | `node apps/webhook-service/dist/worker.js` |
| Orchestrator | `node apps/orchestrator-service/dist/index.js` |

#### Infra necessária

- **PostgreSQL** — Render Postgres ou externo
- **Redis** — Render Redis ou Upstash

### Deploy na AWS / VPS

```bash
# Build
cd integrations-hub
pnpm install
pnpm build

# Run com PM2
pm2 start apps/api-gateway/dist/server.js --name api-gateway
pm2 start apps/briefing-service/dist/worker.js --name briefing-worker
pm2 start apps/webhook-service/dist/worker.js --name webhook-worker
pm2 start apps/orchestrator-service/dist/index.js --name orchestrator
```

---

## Exemplos de Uso

### Criar briefing via API

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

**Resposta (201)**:
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "Campanha Black Friday",
    "status": "received",
    "channels": ["instagram", "facebook", "google_ads"],
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Briefing created"
}
```

### Listar briefings com filtros

```bash
curl "http://localhost:3000/api/v1/briefings?page=1&limit=10&status=received" \
  -H "X-API-Key: cfk_test_key_for_development_only"
```

**Resposta (200)**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Atualizar status de briefing

```bash
curl -X PATCH "http://localhost:3000/api/v1/briefings/clx1234567890/status" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: cfk_test_key_for_development_only" \
  -d '{"status": "approved", "notes": "Campanha aprovada pelo cliente"}'
```

### Integração via SDK (exemplo Node.js)

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://your-api-gateway.render.com/api/v1',
  headers: {
    'X-API-Key': process.env.CREATIVEFLOW_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Criar briefing
const { data } = await client.post('/briefings', {
  title: 'Campanha de Natal',
  description: 'Campanha sazonal para o período natalino',
  objective: 'Brand awareness',
  targetAudience: 'Famílias, classe A/B',
  toneOfVoice: 'Acolhedor e festivo',
  channels: ['instagram', 'facebook'],
  campaignType: 'awareness',
  source: 'api',
  createdBy: 'meu-sistema',
});

console.log('Briefing criado:', data.data.id);

// Verificar status
const { data: briefing } = await client.get(`/briefings/${data.data.id}`);
console.log('Status:', briefing.data.status);
```

### Integração via Python

```python
import requests

API_URL = "https://your-api-gateway.render.com/api/v1"
API_KEY = "cfk_prod_sua_chave"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Criar briefing
response = requests.post(f"{API_URL}/briefings", json={
    "title": "Campanha de Verão",
    "description": "Lançamento coleção verão 2025",
    "objective": "Gerar leads qualificados",
    "targetAudience": "Jovens 18-30, urbanos",
    "toneOfVoice": "Descontraído e moderno",
    "channels": ["instagram", "tiktok"],
    "campaignType": "promotional",
    "source": "api",
    "createdBy": "meu-crm"
}, headers=headers)

print(response.json())
```

---

## Licença

Projeto privado — todos os direitos reservados.
