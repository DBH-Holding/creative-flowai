import { Campaign, AIInsight, ChecklistItem } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateCampaign(briefing: {
  campaignName: string;
  businessSegment: string;
  objective: string;
  targetAudience: string;
  mainChannel: string;
  notes: string;
  openBriefing: string;
}): Promise<Campaign> {
  await delay(2200);

  return {
    id: crypto.randomUUID(),
    briefingId: crypto.randomUUID(),
    summary: `Campanha "${briefing.campaignName}" focada em ${briefing.objective.toLowerCase()} para o segmento de ${briefing.businessSegment}. A estratégia combina storytelling emocional com dados de mercado para maximizar conversão no ${briefing.mainChannel}.`,
    objective: briefing.objective,
    targetAudience: briefing.targetAudience,
    tone: briefing.businessSegment.toLowerCase().includes("tech")
      ? "Inovador, direto e inspirador"
      : "Profissional, empático e persuasivo",
    posts: [
      {
        id: "1",
        title: "Post de Abertura",
        copy: `🚀 ${briefing.campaignName}\n\nVocê sabia que ${briefing.targetAudience} enfrenta desafios diários para alcançar resultados reais?\n\nNós entendemos. E criamos algo que muda o jogo.\n\nDescubra como transformar sua rotina →`,
        cta: "Saiba mais",
        channel: briefing.mainChannel,
      },
      {
        id: "2",
        title: "Post de Prova Social",
        copy: `📈 Resultados que falam por si\n\n+340% de engajamento\n+89% de conversão\n-60% de retrabalho\n\nEmpresas como a sua já estão colhendo resultados com nossa solução.\n\nQuer ser a próxima? 👇`,
        cta: "Ver casos de sucesso",
        channel: briefing.mainChannel,
      },
      {
        id: "3",
        title: "Post de Conversão",
        copy: `⏰ Última chance!\n\nNosso programa exclusivo para ${briefing.targetAudience} fecha inscrições em 48h.\n\n✅ ${briefing.objective}\n✅ Suporte especializado\n✅ Garantia de resultados\n\nNão perca essa oportunidade.`,
        cta: "Garantir minha vaga",
        channel: briefing.mainChannel,
      },
    ],
    ad: {
      headline: `${briefing.campaignName} — Resultados reais para ${briefing.targetAudience}`,
      body: `Descubra como empresas do segmento de ${briefing.businessSegment} estão alcançando ${briefing.objective.toLowerCase()} com uma abordagem inovadora. Teste grátis por 14 dias.`,
      cta: "Começar teste grátis",
      format: "Carrossel / Stories",
    },
    createdAt: new Date().toISOString(),
  };
}

export async function analyzeFeeedback(feedbacks: string[]): Promise<AIInsight> {
  await delay(1800);
  
  return {
    summary: `Foram analisados ${feedbacks.length} feedbacks. O consenso aponta para necessidade de ajustes no tom de comunicação e fortalecimento do CTA principal. A mensagem central está alinhada, mas precisa de mais urgência e prova social.`,
    issues: [
      "Tom de comunicação considerado genérico por 2 revisores",
      "CTA principal não transmite urgência suficiente",
      "Falta de dados concretos na prova social",
      "Imagem do criativo não reflete o público-alvo",
    ],
    actions: [
      "Reescrever copy com tom mais direto e personalizado",
      "Adicionar números reais ou estimativas ao post de prova social",
      "Redesenhar criativo com personas do público-alvo",
      "Incluir deadline ou escassez no CTA",
      "Adicionar depoimento real ou case de sucesso",
    ],
    newCopy: `🎯 Para ${feedbacks.length > 0 ? "profissionais" : "times"} que exigem resultados reais\n\nChega de campanhas genéricas. Nossa solução já ajudou +200 empresas a reduzir 60% do retrabalho em marketing.\n\n📊 Dados reais. Resultados mensuráveis.\n\n⏰ Vagas limitadas — garanta a sua agora →`,
    newVisualDirection: "Utilizar fotografias reais do público-alvo em vez de ilustrações genéricas. Paleta de cores mais quente para gerar conexão emocional. Tipografia bold para os números e dados. Layout mais limpo com foco no CTA.",
  };
}

export async function generateChecklist(): Promise<ChecklistItem[]> {
  await delay(1000);
  
  return [
    { id: "1", text: "Ajustar copy conforme feedback da IA", done: false },
    { id: "2", text: "Revisar arte e direção visual", done: false },
    { id: "3", text: "Reforçar CTA com urgência", done: false },
    { id: "4", text: "Adicionar prova social com dados reais", done: false },
    { id: "5", text: "Validar campanha com stakeholders", done: false },
    { id: "6", text: "Aprovar versão final", done: false },
    { id: "7", text: "Agendar publicação", done: false },
    { id: "8", text: "Publicar nos canais selecionados", done: false },
  ];
}
