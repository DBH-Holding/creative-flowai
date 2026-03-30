import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Rocket, CheckCircle2, Clock, Calendar, Zap, Globe, BarChart3,
  Puzzle, Bot, Shield, Users, Palette, CreditCard, Bell, FileText,
  Target, TrendingUp, Layers,
} from "lucide-react";

type Phase = {
  title: string;
  status: "done" | "in_progress" | "planned";
  quarter: string;
  items: Array<{
    label: string;
    description: string;
    icon: React.ElementType;
    done: boolean;
  }>;
};

const phases: Phase[] = [
  {
    title: "MVP — Fundação",
    status: "done",
    quarter: "Q1 2025",
    items: [
      { label: "Briefing inteligente com IA", description: "Formulário que gera campanhas completas via IA generativa", icon: Bot, done: true },
      { label: "Geração automática de campanha", description: "Posts, anúncio e copy gerados em segundos", icon: Zap, done: true },
      { label: "Fluxo de aprovação", description: "Status machine com aprovação, ajustes e feedback", icon: CheckCircle2, done: true },
      { label: "Análise de feedback por IA", description: "IA analisa comentários e sugere melhorias na copy e visual", icon: Palette, done: true },
      { label: "Checklist de execução", description: "Transforme feedbacks em tarefas acionáveis automaticamente", icon: FileText, done: true },
      { label: "Autenticação e perfil", description: "Login com email/senha e Google, perfil personalizável", icon: Shield, done: true },
      { label: "Planos e assinaturas", description: "Controle de limites por plano com cobrança via Asaas", icon: CreditCard, done: true },
      { label: "Painel admin", description: "Dashboard de vendas, gestão de usuários, planos e assinaturas", icon: BarChart3, done: true },
      { label: "Landing page e SEO", description: "Página de venda otimizada com prova social e JSON-LD", icon: Globe, done: true },
    ],
  },
  {
    title: "Multi-tenant — Agências & Clientes",
    status: "in_progress",
    quarter: "Q2 2025",
    items: [
      { label: "Arquitetura multi-tenant", description: "Agências com gestão de clientes e membros da equipe", icon: Users, done: true },
      { label: "Hierarquia de papéis", description: "Dono, gerente, membro e cliente com permissões distintas", icon: Shield, done: true },
      { label: "Convite por email", description: "Convide membros e clientes para sua agência com um link seguro", icon: Bell, done: true },
      { label: "Aprovação por role", description: "Apenas donos e gerentes aprovam; clientes enviam para aprovação", icon: Target, done: true },
      { label: "Feedbacks com contexto", description: "Comentários exibem o papel do autor na agência", icon: Users, done: true },
      { label: "Email de convite automático", description: "Edge function para enviar email ao convidar membros", icon: Bell, done: false },
      { label: "Dashboard da agência", description: "Visão consolidada de todas as campanhas e clientes", icon: Layers, done: false },
      { label: "Filtros avançados", description: "Filtrar campanhas por cliente, status, data e canal", icon: Target, done: false },
    ],
  },
  {
    title: "Integrações Nativas",
    status: "planned",
    quarter: "Q3 2025",
    items: [
      { label: "Publicação no Instagram", description: "Publique posts aprovados diretamente no Instagram Business", icon: Globe, done: false },
      { label: "Meta Ads", description: "Crie campanhas de anúncios no Meta Ads a partir dos briefings", icon: Target, done: false },
      { label: "LinkedIn", description: "Publique conteúdo corporativo aprovado no LinkedIn Company Page", icon: Puzzle, done: false },
      { label: "Google Ads", description: "Exporte anúncios gerados para campanhas do Google Ads", icon: TrendingUp, done: false },
      { label: "Hub de integrações", description: "API REST pública e webhooks para sistemas externos (CRM, ERP)", icon: Puzzle, done: false },
    ],
  },
  {
    title: "Escala & Analytics",
    status: "planned",
    quarter: "Q4 2025",
    items: [
      { label: "Dashboard de performance", description: "Métricas de engajamento pós-publicação integradas", icon: BarChart3, done: false },
      { label: "A/B testing de copy", description: "Gere variações de copy e compare performance real", icon: Zap, done: false },
      { label: "Templates de campanha", description: "Salve briefings como templates reutilizáveis", icon: FileText, done: false },
      { label: "Notificações em tempo real", description: "Alertas de aprovação, feedback e status via push e email", icon: Bell, done: false },
      { label: "Workflow customizável", description: "Configure etapas de aprovação personalizadas por agência", icon: Layers, done: false },
      { label: "White-label", description: "Personalize a plataforma com a marca da sua agência", icon: Palette, done: false },
    ],
  },
];

const statusBadge: Record<Phase["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  done: { label: "Concluído", variant: "default" },
  in_progress: { label: "Em andamento", variant: "secondary" },
  planned: { label: "Planejado", variant: "outline" },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Rocket className="h-4 w-4" /> Roadmap do Produto
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Para onde estamos indo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe as entregas realizadas e as próximas funcionalidades que vão transformar a forma como sua agência trabalha.
          </p>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Entregues", count: phases.flatMap(p => p.items).filter(i => i.done).length, color: "text-primary" },
            { label: "Em progresso", count: phases.filter(p => p.status === "in_progress").flatMap(p => p.items).filter(i => !i.done).length, color: "text-yellow-500" },
            { label: "Planejadas", count: phases.filter(p => p.status === "planned").flatMap(p => p.items).length, color: "text-muted-foreground" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card text-center">
              <CardContent className="pt-6">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden sm:block" />

          <div className="space-y-8">
            {phases.map((phase, phaseIdx) => {
              const badge = statusBadge[phase.status];
              const doneCount = phase.items.filter(i => i.done).length;
              const totalCount = phase.items.length;

              return (
                <div key={phase.title} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 top-6 h-5 w-5 rounded-full border-2 hidden sm:flex items-center justify-center z-10 ${
                    phase.status === "done" ? "bg-primary border-primary" :
                    phase.status === "in_progress" ? "bg-yellow-500 border-yellow-500" :
                    "bg-background border-border"
                  }`}>
                    {phase.status === "done" && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    {phase.status === "in_progress" && <Clock className="h-3 w-3 text-background" />}
                  </div>

                  <Card className="sm:ml-14 border-border bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-xl text-foreground">{phase.title}</CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Calendar className="h-3.5 w-3.5" /> {phase.quarter}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <span className="text-xs text-muted-foreground">{doneCount}/{totalCount}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-secondary mt-3">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(doneCount / totalCount) * 100}%` }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {phase.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                item.done ? "bg-primary/5" : "bg-secondary/50"
                              }`}
                            >
                              <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                                item.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium flex items-center gap-1.5 ${
                                  item.done ? "text-foreground" : "text-muted-foreground"
                                }`}>
                                  {item.label}
                                  {item.done && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center p-8 rounded-xl border border-primary/20 bg-primary/5">
          <h2 className="text-2xl font-bold text-foreground mb-2">Tem uma ideia de feature?</h2>
          <p className="text-muted-foreground mb-4">
            Estamos construindo a plataforma junto com nossos clientes. Envie seu feedback e ajude a moldar o futuro do CreativeFlow AI.
          </p>
          <a
            href="mailto:contato@creativeflow.ai"
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enviar sugestão
          </a>
        </div>
      </div>
    </div>
  );
}
