import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ApprovalStatus, Feedback, AIInsight, ChecklistItem } from "@/types";
import { analyzeFeeedback, generateChecklist } from "@/services/ai-mock";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles, MessageSquare, CheckCircle, ArrowLeft, Send, Loader2,
  ThumbsUp, AlertTriangle, ListChecks, Eye, Clock, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<ApprovalStatus, { label: string; color: string; icon: React.ElementType }> = {
  em_analise: { label: "Em análise", color: "text-info", icon: Eye },
  aguardando_aprovacao: { label: "Aguardando aprovação", color: "text-warning", icon: Clock },
  aprovado: { label: "Aprovado", color: "text-success", icon: Check },
  ajustes_solicitados: { label: "Ajustes solicitados", color: "text-destructive", icon: AlertTriangle },
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
}

export default function CampaignPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const campaignId = searchParams.get("id");

  const [campaign, setCampaign] = useState<DBCampaign | null>(null);
  const [status, setStatus] = useState<ApprovalStatus>("em_analise");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

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
    }
  };

  const addFeedback = async () => {
    if (!newFeedback.trim() || !user || !campaignId) return;

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        author: user.email || "Usuário",
        message: newFeedback,
      })
      .select()
      .single();

    if (data && !error) {
      setFeedbacks((prev) => [...prev, { id: data.id, author: data.author, message: data.message, createdAt: data.created_at }]);
      setNewFeedback("");
    }
  };

  const handleAnalyze = async () => {
    setLoadingInsight(true);
    const result = await analyzeFeeedback(feedbacks.map((f) => f.message));
    setInsight(result);
    setLoadingInsight(false);
  };

  const handleChecklist = async () => {
    if (!campaignId) return;
    setLoadingChecklist(true);
    const items = await generateChecklist();

    // Save to DB
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
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/briefing"><ArrowLeft className="h-4 w-4 mr-1" /> Novo briefing</Link>
        </Button>

        {/* Campaign Summary */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Resultado da Campanha</h1>
            <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", statusConfig[status].color)}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig[status].label}
            </span>
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

        {/* Approval Section */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Aprovação do Criativo
          </h2>

          {/* Feedback input */}
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

          {/* Feedback list */}
          {feedbacks.length > 0 && (
            <div className="space-y-3 mb-6">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-3 rounded-lg bg-secondary text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{fb.author}</span>
                    <span className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleTimeString("pt-BR")}</span>
                  </div>
                  <p className="text-muted-foreground">{fb.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="sm" onClick={() => updateStatus("aprovado")}>
              <ThumbsUp className="h-4 w-4" /> Aprovar
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateStatus("ajustes_solicitados")}>
              <AlertTriangle className="h-4 w-4" /> Solicitar ajustes
            </Button>
            <Button variant="subtle" size="sm" onClick={handleAnalyze} disabled={loadingInsight}>
              {loadingInsight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analisar feedback com IA
            </Button>
            <Button variant="subtle" size="sm" onClick={handleChecklist} disabled={loadingChecklist}>
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
                    item.done ? "bg-primary/10" : "bg-secondary hover:bg-surface-hover"
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
