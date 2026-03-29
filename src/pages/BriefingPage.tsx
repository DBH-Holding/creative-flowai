import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { generateCampaign } from "@/services/ai-service";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export default function BriefingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sub, canCreateCampaign, remainingCampaigns, loading: subLoading } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    campaignName: "",
    businessSegment: "",
    objective: "",
    targetAudience: "",
    mainChannel: "Instagram",
    notes: "",
    openBriefing: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleGenerate = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!canCreateCampaign()) {
      toast.error("Você atingiu o limite de campanhas do seu plano. Faça upgrade para continuar.");
      return;
    }

    setLoading(true);
    try {
      const campaign = await generateCampaign(form);

      // Save briefing to DB
      const { data: briefing, error: bErr } = await supabase
        .from("briefings")
        .insert({
          user_id: user.id,
          campaign_name: form.campaignName,
          business_segment: form.businessSegment || null,
          objective: form.objective,
          target_audience: form.targetAudience,
          main_channel: form.mainChannel,
          notes: form.notes || null,
          open_briefing: form.openBriefing || null,
        })
        .select()
        .single();

      if (bErr) throw bErr;

      // Save campaign to DB
      const { data: savedCampaign, error: cErr } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          briefing_id: briefing.id,
          summary: campaign.summary,
          objective: campaign.objective,
          target_audience: campaign.targetAudience,
          tone: campaign.tone,
          posts: campaign.posts as any,
          ad: campaign.ad as any,
          status: "em_analise",
        })
        .select()
        .single();

      if (cErr) throw cErr;

      // Increment campaigns_used via RPC (bypasses RLS)
      await supabase.rpc("increment_campaigns_used", { _user_id: user.id });

      navigate(`/campanha?id=${savedCampaign.id}`);
    } catch (err) {
      console.error("Error saving campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.campaignName && form.objective && form.targetAudience;

  const inputClass = "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
  const labelClass = "block text-sm font-medium mb-2";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Briefing Inteligente</h1>
          <p className="text-muted-foreground">Preencha os dados da campanha e deixe a IA fazer o resto.</p>
          {!user && (
            <p className="text-sm text-warning mt-2">Faça login para salvar suas campanhas.</p>
          )}
          {user && sub && !canCreateCampaign() && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-destructive">
                Limite de campanhas atingido ({sub.campaigns_used}/{sub.campaigns_limit}).{" "}
                <Link to="/planos" className="underline font-medium">Fazer upgrade</Link>
              </span>
            </div>
          )}
          {user && sub && canCreateCampaign() && remainingCampaigns() !== null && (
            <p className="text-xs text-muted-foreground mt-2">
              {remainingCampaigns()} campanha(s) restante(s) neste mês
            </p>
          )}
          {user && !sub && !subLoading && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-amber-500">
                Você não tem uma assinatura ativa.{" "}
                <Link to="/planos" className="underline font-medium">Escolher plano</Link>
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className={labelClass}>Nome da campanha *</label>
            <input className={inputClass} placeholder="Ex: Lançamento Produto X" value={form.campaignName} onChange={(e) => update("campaignName", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Segmento do negócio</label>
              <input className={inputClass} placeholder="Ex: Tecnologia, Saúde, Educação" value={form.businessSegment} onChange={(e) => update("businessSegment", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Canal principal</label>
              <select className={inputClass} value={form.mainChannel} onChange={(e) => update("mainChannel", e.target.value)}>
                <option>Instagram</option>
                <option>Facebook</option>
                <option>LinkedIn</option>
                <option>TikTok</option>
                <option>Google Ads</option>
                <option>Email</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Objetivo da campanha *</label>
            <input className={inputClass} placeholder="Ex: Aumentar vendas em 30% no trimestre" value={form.objective} onChange={(e) => update("objective", e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Público-alvo *</label>
            <input className={inputClass} placeholder="Ex: Empreendedores de 25-40 anos" value={form.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Observações</label>
            <textarea className={cn(inputClass, "min-h-[80px] resize-y")} placeholder="Referências, restrições, tom desejado..." value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Briefing aberto</label>
            <textarea className={cn(inputClass, "min-h-[120px] resize-y")} placeholder="Descreva livremente o que você precisa..." value={form.openBriefing} onChange={(e) => update("openBriefing", e.target.value)} />
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={handleGenerate} disabled={!isValid || loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Gerando campanha...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Gerar campanha com IA</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
