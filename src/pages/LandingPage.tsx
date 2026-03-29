import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap, MessageSquare, CheckCircle, BarChart3, Shield, Globe } from "lucide-react";
import { plans } from "@/data/constants";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const benefits = [
  { icon: Zap, title: "Briefing → Campanha em segundos", desc: "IA gera copy, posts e anúncios a partir de um simples formulário." },
  { icon: MessageSquare, title: "Feedback centralizado", desc: "Organize aprovações, comentários e revisões em um só lugar." },
  { icon: CheckCircle, title: "Checklist inteligente", desc: "Transforme feedback em tarefas acionáveis automaticamente." },
  { icon: BarChart3, title: "IA de análise", desc: "Resumo consolidado de feedbacks com sugestões de melhoria." },
  { icon: Shield, title: "Pronto para escalar", desc: "APIs abertas, webhooks e integrações para seu stack atual." },
  { icon: Globe, title: "Integrações futuras", desc: "Instagram, Meta Ads, LinkedIn, TikTok, Google Ads e mais." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-xs text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Plataforma de marketing com IA
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Transforme briefings em campanhas e organize aprovações{" "}
              <span className="text-gradient">com IA</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Reduza retrabalho, acelere aprovações e gere campanhas completas em segundos. 
              Uma plataforma para agências e times de marketing que querem escalar.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/briefing">
                  Testar agora <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/planos">Ver planos</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tudo que seu time precisa</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Da ideia à publicação, com IA em cada etapa do processo criativo.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <b.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Preview */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Planos simples, resultado real</h2>
            <p className="text-muted-foreground">Comece grátis. Escale quando precisar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl border p-6 flex flex-col",
                  plan.highlighted
                    ? "border-primary bg-primary/5 glow"
                    : "border-border bg-card"
                )}
              >
                {plan.highlighted && (
                  <span className="text-xs font-medium text-primary mb-2">Mais popular</span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-3xl font-bold">R${plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlighted ? "hero" : "outline"} asChild>
                  <Link to="/billing">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar seu marketing?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Crie sua primeira campanha agora. Sem cadastro, sem fricção.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/briefing">Começar agora <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CreativeFlow AI" className="h-16 w-auto opacity-80" />
            <span className="text-sm text-muted-foreground">© 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/planos" className="hover:text-foreground transition-colors">Planos</Link>
            <Link to="/apis" className="hover:text-foreground transition-colors">APIs</Link>
            <Link to="/integracoes" className="hover:text-foreground transition-colors">Integrações</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
