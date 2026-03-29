import { Campaign, AIInsight, ChecklistItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export async function generateCampaign(briefing: {
  campaignName: string;
  businessSegment: string;
  objective: string;
  targetAudience: string;
  mainChannel: string;
  notes: string;
  openBriefing: string;
}): Promise<Campaign> {
  const { data, error } = await supabase.functions.invoke("generate-campaign", {
    body: { briefing },
  });

  if (error) throw new Error(error.message || "Failed to generate campaign");
  if (data?.error) throw new Error(data.error);

  const c = data.campaign;
  return {
    id: crypto.randomUUID(),
    briefingId: crypto.randomUUID(),
    summary: c.summary,
    objective: c.objective,
    targetAudience: c.targetAudience,
    tone: c.tone,
    posts: c.posts,
    ad: c.ad,
    createdAt: new Date().toISOString(),
  };
}

export async function analyzeFeeedback(
  feedbacks: string[],
  campaignContext?: string
): Promise<AIInsight> {
  const { data, error } = await supabase.functions.invoke("analyze-feedback", {
    body: { feedbacks, campaignContext },
  });

  if (error) throw new Error(error.message || "Failed to analyze feedback");
  if (data?.error) throw new Error(data.error);

  return data.insight;
}

export async function generateChecklist(
  feedbacks?: string[],
  campaignSummary?: string
): Promise<ChecklistItem[]> {
  const { data, error } = await supabase.functions.invoke("generate-checklist", {
    body: { feedbacks, campaignSummary },
  });

  if (error) throw new Error(error.message || "Failed to generate checklist");
  if (data?.error) throw new Error(data.error);

  return data.items;
}
