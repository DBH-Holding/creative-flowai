import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { briefing } = await req.json();
    if (!briefing || !briefing.campaignName || !briefing.objective || !briefing.targetAudience) {
      return new Response(JSON.stringify({ error: "Missing required briefing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um especialista em marketing digital e copywriting. 
Gere uma campanha completa baseada no briefing fornecido. 
Responda APENAS com o JSON da campanha, sem markdown ou explicações.`;

    const userPrompt = `Crie uma campanha de marketing com base neste briefing:
- Nome da campanha: ${briefing.campaignName}
- Segmento: ${briefing.businessSegment || "Não especificado"}
- Objetivo: ${briefing.objective}
- Público-alvo: ${briefing.targetAudience}
- Canal principal: ${briefing.mainChannel || "Instagram"}
- Observações: ${briefing.notes || "Nenhuma"}
- Briefing aberto: ${briefing.openBriefing || "Nenhum"}

Retorne um JSON com esta estrutura exata:
{
  "summary": "Resumo estratégico da campanha em 2-3 frases",
  "objective": "${briefing.objective}",
  "targetAudience": "${briefing.targetAudience}",
  "tone": "Tom de comunicação recomendado",
  "posts": [
    {
      "id": "1",
      "title": "Título do post",
      "copy": "Texto completo do post com emojis e formatação",
      "cta": "Call to action",
      "channel": "${briefing.mainChannel || "Instagram"}"
    }
  ],
  "ad": {
    "headline": "Título do anúncio",
    "body": "Corpo do anúncio",
    "cta": "CTA do anúncio",
    "format": "Formato sugerido (ex: Carrossel, Stories, Reels)"
  }
}

Gere exatamente 3 posts variados (abertura, prova social, conversão). Seja criativo e específico para o segmento.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_campaign",
            description: "Generate a marketing campaign with posts and ad",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                objective: { type: "string" },
                targetAudience: { type: "string" },
                tone: { type: "string" },
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      copy: { type: "string" },
                      cta: { type: "string" },
                      channel: { type: "string" },
                    },
                    required: ["id", "title", "copy", "cta", "channel"],
                  },
                },
                ad: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    body: { type: "string" },
                    cta: { type: "string" },
                    format: { type: "string" },
                  },
                  required: ["headline", "body", "cta", "format"],
                },
              },
              required: ["summary", "objective", "targetAudience", "tone", "posts", "ad"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_campaign" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let campaign;
    if (toolCall) {
      campaign = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        campaign = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify({ campaign }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-campaign error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
