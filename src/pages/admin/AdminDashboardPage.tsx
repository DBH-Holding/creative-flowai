import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Users, FileText, CreditCard, TrendingUp, Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalCampaigns: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCampaigns: 0, activeSubscriptions: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profilesRes, campaignsRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("campaigns").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id, plan_id, status, payment_status, plans(price)").eq("status", "active"),
      ]);

      const activeSubs = subsRes.data || [];
      const revenue = activeSubs.reduce((sum, s: any) => sum + (s.plans?.price || 0), 0);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
        activeSubscriptions: activeSubs.length,
        totalRevenue: revenue,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Usuários", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Campanhas", value: stats.totalCampaigns, icon: FileText, color: "text-emerald-400" },
    { label: "Assinaturas ativas", value: stats.activeSubscriptions, icon: CreditCard, color: "text-amber-400" },
    { label: "Receita mensal", value: `R$${stats.totalRevenue.toLocaleString("pt-BR")}`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
