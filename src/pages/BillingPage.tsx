import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, BarChart3, ArrowRight } from "lucide-react";
import { Subscription } from "@/types";
import { cn } from "@/lib/utils";

const mockSubscription: Subscription = {
  planId: "pro",
  planName: "Pro",
  status: "active",
  paymentStatus: "paid",
  campaignsUsed: 12,
  campaignsLimit: null,
  feedbacksUsed: 47,
  feedbacksLimit: null,
  nextBillingDate: "2026-04-27",
};

export default function BillingPage() {
  const [sub] = useState<Subscription>(mockSubscription);
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground mb-8">Gerencie sua assinatura e pagamentos.</p>

        {/* Current plan */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Plano atual</h2>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle className="h-4 w-4" /> Ativo
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">{sub.planName}</span>
            <span className="text-muted-foreground">— R$247/mês</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Status do pagamento</span>
              <p className="font-medium mt-1 capitalize text-success">Pago</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Próxima cobrança</span>
              <p className="font-medium mt-1">{new Date(sub.nextBillingDate).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Gateway</span>
              <p className="font-medium mt-1">Asaas</p>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Consumo mensal</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Campanhas geradas</span>
                <span className="font-medium">{sub.campaignsUsed} / ilimitadas</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "35%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Feedbacks processados</span>
                <span className="font-medium">{sub.feedbacksUsed} / ilimitados</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "47%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Checkout simulation */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Alterar plano</h2>
          {!showCheckout ? (
            <Button variant="outline" onClick={() => setShowCheckout(true)}>
              Upgrade para Business <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="space-y-4 animate-slide-up">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="font-semibold mb-1">Business — R$597/mês</p>
                <p className="text-xs text-muted-foreground">APIs abertas, webhooks, integrações externas, suporte dedicado</p>
              </div>
              <div className="space-y-3">
                <input className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nome no cartão" />
                <input className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Número do cartão" />
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="MM/AA" />
                  <input className="rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="CVV" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Pagamento processado via Asaas. Ambiente de demonstração.</p>
              <Button variant="hero" className="w-full">Assinar plano Business</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
