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

    const { feedbacks, campaignContext } = await req.json();
    if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
      return new Response(JSON.stringify({ error: "No feedbacks provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um analista de marketing digital especializado em revisão de campanhas.
Analise os feedbacks recebidos e gere insights acionáveis para melhorar a campanha.`;

    const userPrompt = `Analise os seguintes feedbacks sobre uma campanha de marketing:

${campaignContext ? `Contexto da campanha: ${campaignContext}\n` : ""}
Feedbacks recebidos:
${feedbacks.map((f: string, i: number) => `${i + 1}. "${f}"`).join("\n")}

Gere uma análise completa com:
- Resumo geral dos feedbacks
- Problemas identificados (lista)
- Ações sugeridas (lista)
- Uma nova copy sugerida que incorpore os ajustes
- Uma nova direção visual sugerida`;

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
            name: "analyze_feedback",
            description: "Return structured feedback analysis",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Overall summary of the feedback analysis" },
                issues: { type: "array", items: { type: "string" }, description: "List of identified issues" },
                actions: { type: "array", items: { type: "string" }, description: "List of suggested actions" },
                newCopy: { type: "string", description: "New suggested copy incorporating feedback" },
                newVisualDirection: { type: "string", description: "New suggested visual direction" },
              },
              required: ["summary", "issues", "actions", "newCopy", "newVisualDirection"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_feedback" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let insight;
    if (toolCall) {
      insight = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insight = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
