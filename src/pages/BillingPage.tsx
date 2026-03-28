import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, CreditCard, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SubData {
  id: string;
  status: string;
  payment_status: string;
  plan_name: string;
  plan_price: number;
  campaigns_used: number;
  campaigns_limit: number | null;
  feedbacks_used: number;
  feedbacks_limit: number | null;
  next_billing_date: string | null;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedPlanId = searchParams.get("plan");

  const [sub, setSub] = useState<SubData | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Checkout form
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Load current subscription
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, plans(name, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        const s = subs[0] as any;
        setSub({
          id: s.id,
          status: s.status,
          payment_status: s.payment_status,
          plan_name: s.plans?.name || "—",
          plan_price: s.plans?.price || 0,
          campaigns_used: s.campaigns_used,
          campaigns_limit: s.campaigns_limit,
          feedbacks_used: s.feedbacks_used,
          feedbacks_limit: s.feedbacks_limit,
          next_billing_date: s.next_billing_date,
        });
      }

      // Load available plans
      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      const mapped = (plansData || []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      }));
      setPlans(mapped);

      if (selectedPlanId) {
        const found = mapped.find((p: any) => p.id === selectedPlanId);
        if (found) setSelectedPlan(found);
      }

      setLoading(false);
    };

    load();
  }, [user, selectedPlanId]);

  const handleCheckout = async () => {
    if (!selectedPlan || !user) return;

    if (selectedPlan.price > 0 && (!name.trim() || !cpfCnpj.trim())) {
      toast.error("Preencha seu nome e CPF/CNPJ");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-checkout", {
        body: {
          plan_id: selectedPlan.id,
          name: name.trim() || user.email,
          cpfCnpj: cpfCnpj.trim() || "00000000000",
        },
      });

      if (error) throw error;

      if (data.paymentUrl) {
        toast.success("Redirecionando para pagamento...");
        window.open(data.paymentUrl, "_blank");
      } else {
        toast.success("Plano ativado com sucesso!");
      }

      // Reload subscription
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, plans(name, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        const s = subs[0] as any;
        setSub({
          id: s.id,
          status: s.status,
          payment_status: s.payment_status,
          plan_name: s.plans?.name || "—",
          plan_price: s.plans?.price || 0,
          campaigns_used: s.campaigns_used,
          campaigns_limit: s.campaigns_limit,
          feedbacks_used: s.feedbacks_used,
          feedbacks_limit: s.feedbacks_limit,
          next_billing_date: s.next_billing_date,
        });
      }

      setSelectedPlan(null);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar assinatura");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Faça login para gerenciar sua assinatura.</p>
        <Button asChild><Link to="/auth">Entrar</Link></Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    active: "Ativo",
    pending: "Pendente",
    cancelled: "Cancelado",
  };

  const paymentLabels: Record<string, string> = {
    paid: "Pago",
    pending: "Pendente",
    overdue: "Atrasado",
  };

  const statusColors: Record<string, string> = {
    active: "text-emerald-400",
    paid: "text-emerald-400",
    pending: "text-amber-400",
    overdue: "text-destructive",
    cancelled: "text-destructive",
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground mb-8">Gerencie sua assinatura e pagamentos.</p>

        {/* Current plan */}
        {sub ? (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Plano atual</h2>
              <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", statusColors[sub.status])}>
                <CheckCircle className="h-4 w-4" /> {statusLabels[sub.status] || sub.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">{sub.plan_name}</span>
              <span className="text-muted-foreground">
                {sub.plan_price === 0 ? "— Grátis" : `— R$${sub.plan_price}/mês`}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-muted-foreground">Status do pagamento</span>
                <p className={cn("font-medium mt-1 capitalize", statusColors[sub.payment_status])}>
                  {paymentLabels[sub.payment_status] || sub.payment_status}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-muted-foreground">Próxima cobrança</span>
                <p className="font-medium mt-1">
                  {sub.next_billing_date
                    ? new Date(sub.next_billing_date).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <span className="text-muted-foreground">Gateway</span>
                <p className="font-medium mt-1">Asaas</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 mb-6 text-center">
            <p className="text-muted-foreground mb-3">Você ainda não tem uma assinatura ativa.</p>
            <Button asChild variant="hero">
              <Link to="/planos">Ver planos</Link>
            </Button>
          </div>
        )}

        {/* Usage */}
        {sub && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Consumo mensal
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Campanhas geradas</span>
                  <span className="font-medium">
                    {sub.campaigns_used} / {sub.campaigns_limit ?? "ilimitadas"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: sub.campaigns_limit
                        ? `${Math.min(100, (sub.campaigns_used / sub.campaigns_limit) * 100)}%`
                        : "10%",
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Feedbacks processados</span>
                  <span className="font-medium">
                    {sub.feedbacks_used} / {sub.feedbacks_limit ?? "ilimitados"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: sub.feedbacks_limit
                        ? `${Math.min(100, (sub.feedbacks_used / sub.feedbacks_limit) * 100)}%`
                        : "10%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout / Change plan */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> {sub ? "Alterar plano" : "Assinar plano"}
          </h2>

          {!selectedPlan ? (
            <div className="grid gap-3">
              {plans
                .filter((p) => !sub || p.name !== sub.plan_name)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition text-left"
                  >
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.price === 0 ? "Grátis" : `R$${p.price}${p.period}`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
            </div>
          ) : (
            <div className="space-y-4 animate-slide-up">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="font-semibold mb-1">
                  {selectedPlan.name} — {selectedPlan.price === 0 ? "Grátis" : `R$${selectedPlan.price}${selectedPlan.period}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedPlan.features.slice(0, 3).join(" · ")}
                </p>
              </div>

              {selectedPlan.price > 0 && (
                <div className="space-y-3">
                  <div>
                    <Label>Nome completo</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label>CPF ou CNPJ</Label>
                    <Input
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pagamento processado via Asaas. Você será redirecionado para concluir o pagamento.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedPlan.price === 0 ? "Ativar plano grátis" : `Assinar ${selectedPlan.name}`}
                </Button>
                <Button variant="ghost" onClick={() => setSelectedPlan(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
