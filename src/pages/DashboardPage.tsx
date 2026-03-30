import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/hooks/useAgency";
import { useAgencyMembers } from "@/hooks/useAgencyMembers";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, FileText, Clock, CheckCircle2, AlertCircle, Eye, Building2,
  Users, TrendingUp, Filter, Search, X, CalendarDays, User,
} from "lucide-react";

interface CampaignRow {
  id: string;
  summary: string;
  objective: string;
  status: string;
  created_at: string;
  updated_at: string;
  briefing_id: string;
  user_id: string;
  agency_id: string | null;
}

interface BriefingRow {
  id: string;
  campaign_name: string;
  main_channel: string;
  user_id: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  em_analise: { label: "Em análise", variant: "secondary" },
  aguardando_aprovacao: { label: "Aguardando aprovação", variant: "outline" },
  aprovado: { label: "Aprovado", variant: "default" },
  ajustes_solicitados: { label: "Ajustes solicitados", variant: "destructive" },
};

const channels = ["Instagram", "Facebook", "LinkedIn", "TikTok", "Google Ads", "Email"];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentAgency, hasAgency, isAgencyAdmin } = useAgency();
  const { members } = useAgencyMembers(currentAgency?.id);

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [briefings, setBriefings] = useState<BriefingRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // Fetch campaigns
      let campaignQuery = supabase
        .from("campaigns")
        .select("id, summary, objective, status, created_at, updated_at, briefing_id, user_id, agency_id")
        .order("created_at", { ascending: false });

      if (currentAgency) {
        campaignQuery = campaignQuery.eq("agency_id", currentAgency.id);
      } else {
        campaignQuery = campaignQuery.eq("user_id", user.id);
      }

      // Fetch briefings for channel info
      let briefingQuery = supabase
        .from("briefings")
        .select("id, campaign_name, main_channel, user_id, created_at")
        .order("created_at", { ascending: false });

      if (currentAgency) {
        briefingQuery = briefingQuery.eq("agency_id", currentAgency.id);
      } else {
        briefingQuery = briefingQuery.eq("user_id", user.id);
      }

      const [{ data: campaignData }, { data: briefingData }] = await Promise.all([
        campaignQuery,
        briefingQuery,
      ]);

      setCampaigns(campaignData ?? []);
      setBriefings(briefingData ?? []);
      setLoading(false);
    };
    fetchData();
  }, [user, currentAgency]);

  // Build briefing lookup
  const briefingMap = useMemo(() => {
    const map: Record<string, BriefingRow> = {};
    briefings.forEach((b) => { map[b.id] = b; });
    return map;
  }, [briefings]);

  // Build member lookup for client names
  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m: any) => {
      map[m.user_id] = m.profiles?.display_name || "Sem nome";
    });
    return map;
  }, [members]);

  // Unique clients from campaigns
  const clientOptions = useMemo(() => {
    if (!hasAgency) return [];
    const userIds = [...new Set(campaigns.map((c) => c.user_id))];
    return userIds.map((uid) => ({ id: uid, name: memberMap[uid] || "Usuário" }));
  }, [campaigns, memberMap, hasAgency]);

  // Date range filter
  const getDateThreshold = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return null;
    }
  };

  // Apply filters
  const filteredCampaigns = useMemo(() => {
    let result = campaigns;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (clientFilter !== "all") {
      result = result.filter((c) => c.user_id === clientFilter);
    }

    if (channelFilter !== "all") {
      result = result.filter((c) => {
        const briefing = briefingMap[c.briefing_id];
        return briefing?.main_channel === channelFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.summary.toLowerCase().includes(q) ||
        c.objective.toLowerCase().includes(q) ||
        (briefingMap[c.briefing_id]?.campaign_name || "").toLowerCase().includes(q)
      );
    }

    const dateThreshold = getDateThreshold(dateRange);
    if (dateThreshold) {
      result = result.filter((c) => new Date(c.created_at) >= dateThreshold);
    }

    return result;
  }, [campaigns, statusFilter, clientFilter, channelFilter, searchQuery, dateRange, briefingMap]);

  const hasActiveFilters = statusFilter !== "all" || clientFilter !== "all" || channelFilter !== "all" || searchQuery.trim() || dateRange !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setClientFilter("all");
    setChannelFilter("all");
    setSearchQuery("");
    setDateRange("all");
  };

  if (authLoading) return null;

  const stats = {
    total: campaigns.length,
    approved: campaigns.filter((c) => c.status === "aprovado").length,
    pending: campaigns.filter((c) => ["em_analise", "aguardando_aprovacao"].includes(c.status)).length,
    adjustments: campaigns.filter((c) => c.status === "ajustes_solicitados").length,
  };

  // Agency-specific stats
  const agencyStats = hasAgency ? {
    totalClients: members.filter((m: any) => m.role === "client").length,
    totalMembers: members.length,
    recentCampaigns: campaigns.filter((c) => {
      const d = new Date(c.created_at);
      const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return d >= week;
    }).length,
  } : null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {hasAgency && <Building2 className="h-7 w-7 text-primary" />}
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasAgency
                ? `Painel da ${currentAgency?.name}`
                : "Gerencie suas campanhas criativas"}
            </p>
          </div>
          <Button asChild>
            <Link to="/briefing">
              <Plus className="mr-2 h-4 w-4" /> Novo briefing
            </Link>
          </Button>
        </div>

        {/* Stats Row */}
        <div className={`grid grid-cols-2 ${hasAgency ? "sm:grid-cols-4 lg:grid-cols-6" : "sm:grid-cols-4"} gap-4 mb-8`}>
          <Card className="border-border bg-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Campanhas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Aprovadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.adjustments}</p>
                  <p className="text-xs text-muted-foreground">Ajustes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasAgency && agencyStats && (
            <>
              <Card className="border-border bg-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{agencyStats.totalClients}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{agencyStats.recentCampaigns}</p>
                      <p className="text-xs text-muted-foreground">Últimos 7d</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filters */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
                  <X className="h-3.5 w-3.5" /> Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="em_analise">Em análise</SelectItem>
                  <SelectItem value="aguardando_aprovacao">Aguardando aprovação</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="ajustes_solicitados">Ajustes solicitados</SelectItem>
                </SelectContent>
              </Select>

              {/* Channel */}
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  {channels.map((ch) => (
                    <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date range */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client filter - only for agencies */}
            {hasAgency && clientOptions.length > 0 && (
              <div className="mt-3">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground mt-3">
                {filteredCampaigns.length} de {campaigns.length} campanhas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Campaign List */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>
              {hasAgency ? "Campanhas da Agência" : "Histórico de campanhas"}
            </CardTitle>
            <CardDescription>
              {hasAgency
                ? `Todas as campanhas dos clientes da ${currentAgency?.name}`
                : "Todas as campanhas criadas por você"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? "Nenhuma campanha encontrada com esses filtros." : "Nenhuma campanha ainda."}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/briefing">Criar primeira campanha</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCampaigns.map((c) => {
                  const cfg = statusConfig[c.status] ?? { label: c.status, variant: "secondary" as const };
                  const briefing = briefingMap[c.briefing_id];
                  const clientName = hasAgency ? (memberMap[c.user_id] || "Usuário") : null;

                  return (
                    <Link
                      key={c.id}
                      to={`/campanha?id=${c.id}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium truncate">{briefing?.campaign_name || c.summary}</p>
                          {briefing?.main_channel && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                              {briefing.main_channel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{c.objective}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {clientName && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" /> {clientName}
                            </span>
                          )}
                        </div>
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
