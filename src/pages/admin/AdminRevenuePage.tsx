import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

interface RevenueStats {
  mrr: number;
  arr: number;
  activeCount: number;
  cancelledCount: number;
  churnRate: number;
  totalEver: number;
  planBreakdown: { name: string; count: number; revenue: number }[];
}

export default function AdminRevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, plans(name, price)");

      const all = subs || [];
      const active = all.filter((s: any) => s.status === "active");
      const cancelled = all.filter((s: any) => s.status === "cancelled");

      const mrr = active.reduce((sum: number, s: any) => sum + (s.plans?.price || 0), 0);

      // Plan breakdown
      const planMap = new Map<string, { count: number; revenue: number }>();
      active.forEach((s: any) => {
        const name = s.plans?.name || "Sem plano";
        const existing = planMap.get(name) || { count: 0, revenue: 0 };
        planMap.set(name, {
          count: existing.count + 1,
          revenue: existing.revenue + (s.plans?.price || 0),
        });
      });

      setStats({
        mrr,
        arr: mrr * 12,
        activeCount: active.length,
        cancelledCount: cancelled.length,
        churnRate: all.length > 0 ? (cancelled.length / all.length) * 100 : 0,
        totalEver: all.length,
        planBreakdown: Array.from(planMap.entries()).map(([name, data]) => ({ name, ...data })),
      });
      setLoading(false);
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Vendas & Receita</h1>

      {loading || !stats ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="MRR" value={`R$${stats.mrr.toLocaleString("pt-BR")}`} icon={DollarSign} color="text-primary" />
            <MetricCard label="ARR" value={`R$${stats.arr.toLocaleString("pt-BR")}`} icon={TrendingUp} color="text-emerald-400" />
            <MetricCard label="Churn Rate" value={`${stats.churnRate.toFixed(1)}%`} icon={TrendingDown} color="text-destructive" />
            <MetricCard label="Assinaturas ativas" value={stats.activeCount.toString()} icon={BarChart3} color="text-amber-400" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Plan breakdown */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">Distribuição por Plano</h2>
              {stats.planBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa.</p>
              ) : (
                <div className="space-y-3">
                  {stats.planBreakdown.map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.count} assinante{p.count !== 1 && "s"}</p>
                      </div>
                      <span className="font-semibold text-sm">R${p.revenue.toLocaleString("pt-BR")}/mês</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">Resumo Geral</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de assinaturas (todos os tempos)</span>
                  <span className="font-medium">{stats.totalEver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ativas</span>
                  <span className="font-medium text-emerald-400">{stats.activeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Canceladas</span>
                  <span className="font-medium text-destructive">{stats.cancelledCount}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 mt-3">
                  <span className="text-muted-foreground">Receita mensal recorrente</span>
                  <span className="font-bold text-primary">R${stats.mrr.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
