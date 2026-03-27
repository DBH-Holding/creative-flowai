import { Plan, ApiEndpoint } from "@/types";

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 97,
    period: "/mês",
    cta: "Começar agora",
    features: [
      "Até 5 campanhas por mês",
      "Até 20 feedbacks por mês",
      "Geração básica com IA",
      "1 usuário",
      "Suporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 247,
    period: "/mês",
    highlighted: true,
    cta: "Assinar Pro",
    features: [
      "Campanhas ilimitadas",
      "Análise de feedback com IA",
      "Checklist de execução",
      "Histórico completo",
      "Até 5 usuários",
      "Suporte prioritário",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 597,
    period: "/mês",
    cta: "Falar com vendas",
    features: [
      "Tudo do Pro",
      "APIs abertas",
      "Webhooks",
      "Integrações externas",
      "Usuários ilimitados",
      "Suporte dedicado",
      "SLA garantido",
    ],
  },
];

export const apiEndpoints: ApiEndpoint[] = [
  { method: "POST", path: "/api/public/briefings", description: "Cria um novo briefing", body: '{ "campaignName": "...", "objective": "..." }', response: '{ "id": "...", "status": "created" }' },
  { method: "GET", path: "/api/public/briefings/:id", description: "Retorna detalhes de um briefing" },
  { method: "POST", path: "/api/public/campaigns/generate", description: "Gera campanha a partir de um briefing", body: '{ "briefingId": "..." }', response: '{ "campaignId": "...", "posts": [...] }' },
  { method: "GET", path: "/api/public/campaigns/:id", description: "Retorna detalhes de uma campanha" },
  { method: "POST", path: "/api/public/approvals", description: "Registra aprovação ou feedback", body: '{ "campaignId": "...", "status": "approved" }' },
  { method: "GET", path: "/api/public/approvals/:campaignId", description: "Lista aprovações de uma campanha" },
  { method: "POST", path: "/api/billing/subscribe", description: "Inicia assinatura de plano", body: '{ "planId": "pro", "paymentMethod": "..." }' },
  { method: "POST", path: "/api/billing/webhook/asaas", description: "Webhook do Asaas para atualização de pagamento" },
];

export const integrations = [
  { name: "Instagram", icon: "📸", status: "Em breve" },
  { name: "Facebook / Meta Ads", icon: "📘", status: "Em breve" },
  { name: "LinkedIn", icon: "💼", status: "Em breve" },
  { name: "TikTok", icon: "🎵", status: "Em breve" },
  { name: "Google Ads", icon: "📊", status: "Em breve" },
  { name: "CRM", icon: "🤝", status: "Em breve" },
  { name: "ERP", icon: "🏢", status: "Em breve" },
  { name: "Zapier / n8n", icon: "⚡", status: "Em breve" },
];
