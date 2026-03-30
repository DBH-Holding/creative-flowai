import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Clock, CheckCircle2, AlertCircle, Eye, Building2 } from "lucide-react";

interface CampaignRow {
  id: string;
  summary: string;
  objective: string;
  status: string;
  created_at: string;
  updated_at: string;
  briefing_id: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  em_analise: { label: "Em análise", variant: "secondary" },
  aguardando_aprovacao: { label: "Aguardando aprovação", variant: "outline" },
  aprovado: { label: "Aprovado", variant: "default" },
  ajustes_solicitados: { label: "Ajustes solicitados", variant: "destructive" },
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentAgency, hasAgency } = useAgency();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchCampaigns = async () => {
      setLoading(true);
      let query = supabase
        .from("campaigns")
        .select("id, summary, objective, status, created_at, updated_at, briefing_id")
        .order("created_at", { ascending: false });

      // If user belongs to an agency, show all agency campaigns
      if (currentAgency) {
        query = query.eq("agency_id", currentAgency.id);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;
      setCampaigns(data ?? []);
      setLoading(false);
    };
    fetchCampaigns();
  }, [user, currentAgency]);

  if (authLoading) return null;

  const stats = {
    total: campaigns.length,
    approved: campaigns.filter((c) => c.status === "aprovado").length,
    pending: campaigns.filter((c) => ["em_analise", "aguardando_aprovacao"].includes(c.status)).length,
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas campanhas criativas</p>
          </div>
          <Button asChild>
            <Link to="/briefing">
              <Plus className="mr-2 h-4 w-4" /> Novo briefing
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de campanhas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Aprovadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de campanhas</CardTitle>
            <CardDescription>Todas as campanhas criadas por você</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma campanha ainda.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/briefing">Criar primeira campanha</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => {
                  const cfg = statusConfig[c.status] ?? { label: c.status, variant: "secondary" as const };
                  return (
                    <Link
                      key={c.id}
                      to={`/campanha?id=${c.id}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{c.summary}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.objective}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
