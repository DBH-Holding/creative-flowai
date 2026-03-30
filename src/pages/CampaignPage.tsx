import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApprovalStatus, Feedback, AIInsight, ChecklistItem } from "@/types";
import { analyzeFeeedback, generateChecklist } from "@/services/ai-service";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import {
  Sparkles, MessageSquare, CheckCircle, ArrowLeft, Send, Loader2,
  ThumbsUp, AlertTriangle, ListChecks, Eye, Clock, Check, X,
  Building2, User, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<ApprovalStatus, { label: string; color: string; icon: React.ElementType; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  em_analise: { label: "Em análise", color: "text-muted-foreground", icon: Eye, badgeVariant: "secondary" },
  aguardando_aprovacao: { label: "Aguardando aprovação", color: "text-yellow-500", icon: Clock, badgeVariant: "outline" },
  aprovado: { label: "Aprovado", color: "text-primary", icon: Check, badgeVariant: "default" },
  ajustes_solicitados: { label: "Ajustes solicitados", color: "text-destructive", icon: AlertTriangle, badgeVariant: "destructive" },
};

interface DBCampaign {
  id: string;
  summary: string;
  objective: string;
  target_audience: string;
  tone: string;
  posts: any;
  ad: any;
  status: string;
  user_id: string;
  agency_id: string | null;
}

export default function CampaignPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { canAddFeedback, remainingFeedbacks } = useSubscription();
  const { currentAgency, currentRole, isAgencyAdmin, isClient, hasAgency } = useAgency();
  const campaignId = searchParams.get("id");

  const [campaign, setCampaign] = useState<DBCampaign | null>(null);
  const [status, setStatus] = useState<ApprovalStatus>("em_analise");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [statusHistory, setStatusHistory] = useState<Array<{ status: string; changed_at: string; changed_by: string }>>([]);

  // Permission logic based on role
  const canApprove = isAgencyAdmin || (!hasAgency && campaign?.user_id === user?.id);
  const canRequestChanges = isAgencyAdmin || isClient || (!hasAgency && campaign?.user_id === user?.id);
  const canSubmitForApproval = isClient || (!hasAgency && campaign?.user_id === user?.id);
  const canComment = true; // Everyone can comment

  useEffect(() => {
    if (!campaignId) { navigate("/briefing"); return; }

    const loadCampaign = async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error || !data) { navigate("/briefing"); return; }
      setCampaign(data);
      setStatus(data.status as ApprovalStatus);

      // Load feedbacks
      const { data: fbs } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (fbs) setFeedbacks(fbs.map(f => ({ id: f.id, author: f.author, message: f.message, createdAt: f.created_at })));

      // Load checklists
      const { data: cls } = await supabase
        .from("checklists")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true });
      if (cls) setChecklist(cls.map(c => ({ id: c.id, text: c.text, done: c.done })));
    };

    loadCampaign();
  }, [campaignId, navigate]);

  const updateStatus = async (newStatus: ApprovalStatus) => {
    setStatus(newStatus);
    if (campaignId) {
      await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaignId);

      // Add a system feedback for status change
      const statusLabel = statusConfig[newStatus].label;
      const authorName = user?.email || "Sistema";
      const systemMessage = `📋 Status alterado para "${statusLabel}" por ${authorName}`;

      const { data } = await supabase
        .from("feedbacks")
        .insert({
          campaign_id: campaignId,
          user_id: user!.id,
          author: "Sistema",
          message: systemMessage,
        })
        .select()
        .single();

      if (data) {
        setFeedbacks(prev => [...prev, { id: data.id, author: data.author, message: data.message, createdAt: data.created_at }]);
      }

      toast.success(`Status atualizado para "${statusLabel}"`);
    }
  };

  const addFeedback = async () => {
    if (!newFeedback.trim() || !user || !campaignId) return;

    if (!canAddFeedback()) {
      toast.error("Limite de feedbacks atingido. Faça upgrade do seu plano.");
      return;
    }

    const roleSuffix = hasAgency && currentRole ? ` (${currentRole === "owner" ? "Dono" : currentRole === "manager" ? "Gerente" : currentRole === "member" ? "Equipe" : "Cliente"})` : "";
    const authorName = (user.user_metadata?.full_name || user.email || "Usuário") + roleSuffix;

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        author: authorName,
        message: newFeedback,
      })
      .select()
      .single();

    if (data && !error) {
      setFeedbacks((prev) => [...prev, { id: data.id, author: data.author, message: data.message, createdAt: data.created_at }]);
      setNewFeedback("");
      await supabase.rpc("increment_feedbacks_used", { _user_id: user.id });
    }
  };

  const handleAnalyze = async () => {
    setLoadingInsight(true);
    try {
      const result = await analyzeFeeedback(feedbacks.map((f) => f.message), campaign?.summary);
      setInsight(result);
    } catch (err) {
      console.error("Error analyzing feedback:", err);
    }
    setLoadingInsight(false);
  };

  const handleChecklist = async () => {
    if (!campaignId) return;
    setLoadingChecklist(true);
    const items = await generateChecklist(
      feedbacks.map(f => f.message),
      campaign?.summary
    );

    const rows = items.map(item => ({
      campaign_id: campaignId,
      text: item.text,
      done: false,
    }));

    const { data } = await supabase.from("checklists").insert(rows).select();
    if (data) {
      setChecklist(data.map(c => ({ id: c.id, text: c.text, done: c.done })));
    }
    setLoadingChecklist(false);
  };

  const toggleCheck = async (id: string) => {
    const item = checklist.find(c => c.id === id);
    if (!item) return;

    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
    await supabase.from("checklists").update({ done: !item.done }).eq("id", id);
  };

  if (!campaign) return null;

  const StatusIcon = statusConfig[status].icon;
  const posts = campaign.posts as Array<{ id: string; title: string; copy: string; cta: string; channel: string }>;
  const ad = campaign.ad as { headline: string; body: string; cta: string; format: string };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>
          </Button>
          {hasAgency && (
            <Badge variant="outline" className="gap-1.5">
              <Building2 className="h-3 w-3" />
              {currentAgency?.name}
            </Badge>
          )}
        </div>

        {/* Campaign Summary */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Resultado da Campanha</h1>
            <Badge variant={statusConfig[status].badgeVariant} className="gap-1.5">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig[status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6">{campaign.summary}</p>

          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Objetivo</span>
              <p className="font-medium mt-1">{campaign.objective}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Público-alvo</span>
              <p className="font-medium mt-1">{campaign.target_audience}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <span className="text-muted-foreground">Tom de comunicação</span>
              <p className="font-medium mt-1">{campaign.tone}</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <h2 className="text-xl font-bold mb-4">Sugestões de Posts</h2>
        <div className="grid gap-4 mb-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{post.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{post.channel}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans mb-3">{post.copy}</pre>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                CTA: {post.cta}
              </span>
            </div>
          ))}
        </div>

        {/* Ad */}
        <h2 className="text-xl font-bold mb-4">Ideia de Anúncio</h2>
        <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6 glow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary">{ad.format}</span>
          </div>
          <h3 className="font-bold text-lg mb-2">{ad.headline}</h3>
          <p className="text-sm text-muted-foreground mb-3">{ad.body}</p>
          <Button variant="hero" size="sm">{ad.cta}</Button>
        </div>

        {/* Simulated Creative Card */}
        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <div className="aspect-video bg-gradient-to-br from-primary/20 via-card to-primary/5 flex items-center justify-center relative">
            <div className="text-center p-8">
              <p className="text-4xl font-bold mb-2">{ad.headline.split("—")[0]}</p>
              <p className="text-muted-foreground">{ad.body.slice(0, 80)}...</p>
              <div className="mt-4 inline-flex items-center justify-center px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
                {ad.cta}
              </div>
            </div>
            <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">Preview do Criativo</div>
          </div>
        </div>

        {/* Approval & Feedback Section */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Aprovação & Feedback
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {hasAgency
              ? "Todos os membros da agência podem comentar. Apenas donos e gerentes podem aprovar."
              : "Gerencie o status e adicione comentários."}
          </p>

          {/* Status Flow Actions */}
          <div className="flex flex-wrap gap-2 mb-6 p-4 rounded-lg bg-secondary/50 border border-border">
            <span className="w-full text-xs font-medium text-muted-foreground mb-1">Ações de status:</span>

            {/* Client: Submit for approval */}
            {canSubmitForApproval && status === "em_analise" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus("aguardando_aprovacao")} className="gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Enviar para aprovação
              </Button>
            )}

            {/* Admin: Approve */}
            {canApprove && (status === "aguardando_aprovacao" || status === "em_analise") && (
              <Button size="sm" variant="default" onClick={() => updateStatus("aprovado")} className="gap-1.5 bg-primary hover:bg-primary/90">
                <ThumbsUp className="h-3.5 w-3.5" /> Aprovar
              </Button>
            )}

            {/* Admin/Client: Request changes */}
            {canRequestChanges && status !== "ajustes_solicitados" && status !== "aprovado" && (
              <Button size="sm" variant="destructive" onClick={() => updateStatus("ajustes_solicitados")} className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Solicitar ajustes
              </Button>
            )}

            {/* Re-submit after adjustments */}
            {canSubmitForApproval && status === "ajustes_solicitados" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus("aguardando_aprovacao")} className="gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Reenviar para aprovação
              </Button>
            )}

            {/* Show current status info */}
            {status === "aprovado" && (
              <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <Check className="h-4 w-4" /> Campanha aprovada ✓
              </div>
            )}
          </div>

          {/* Feedback input */}
          {canComment && (
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Adicione um comentário..."
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFeedback()}
              />
              <Button size="default" onClick={addFeedback}><Send className="h-4 w-4" /></Button>
            </div>
          )}

          {/* Feedback list */}
          {feedbacks.length > 0 && (
            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
              {feedbacks.map((fb) => {
                const isSystem = fb.author === "Sistema";
                return (
                  <div
                    key={fb.id}
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      isSystem ? "bg-primary/5 border border-primary/10" : "bg-secondary"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("font-medium flex items-center gap-1.5", isSystem && "text-primary")}>
                        {isSystem ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3 text-muted-foreground" />}
                        {fb.author}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={cn("text-muted-foreground", isSystem && "text-primary/80 italic")}>{fb.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button variant="subtle" size="sm" onClick={handleAnalyze} disabled={loadingInsight || feedbacks.length === 0}>
              {loadingInsight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analisar feedback com IA
            </Button>
            <Button variant="subtle" size="sm" onClick={handleChecklist} disabled={loadingChecklist || feedbacks.length === 0}>
              {loadingChecklist ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
              Transformar em checklist
            </Button>
          </div>
        </div>

        {/* AI Insight */}
        {insight && (
          <div className="rounded-xl border border-primary/30 bg-card p-6 mb-6 animate-slide-up">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gradient">
              <Sparkles className="h-5 w-5 text-primary" /> Análise da IA
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{insight.summary}</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><X className="h-3 w-3 text-destructive" /> Problemas identificados</h4>
                <ul className="space-y-1">
                  {insight.issues.map((issue, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-destructive">{issue}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Ações sugeridas</h4>
                <ul className="space-y-1">
                  {insight.actions.map((action, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">{action}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary">
                <h4 className="text-sm font-semibold mb-2">Nova copy sugerida</h4>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans">{insight.newCopy}</pre>
              </div>
              <div className="p-4 rounded-lg bg-secondary">
                <h4 className="text-sm font-semibold mb-2">Nova direção visual</h4>
                <p className="text-xs text-muted-foreground">{insight.newVisualDirection}</p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 animate-slide-up">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5" /> Checklist de Execução
            </h2>
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-colors",
                    item.done ? "bg-primary/10" : "bg-secondary hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                    item.done ? "bg-primary border-primary" : "border-border"
                  )}>
                    {item.done && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className={cn(item.done && "line-through text-muted-foreground")}>{item.text}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              {checklist.filter((c) => c.done).length}/{checklist.length} concluídos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
