import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap, MessageSquare, CheckCircle, BarChart3, Shield, Globe, Star, Quote } from "lucide-react";
import { plans } from "@/data/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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

const testimonials = [
  {
    name: "Mariana Costa",
    role: "Head de Marketing, TechBR",
    text: "O CreativeFlow AI reduziu nosso tempo de criação de campanhas de dias para minutos. A qualidade das sugestões é impressionante.",
    rating: 5,
  },
  {
    name: "Rafael Oliveira",
    role: "CEO, Agência Pulse",
    text: "Finalmente uma ferramenta que entende o fluxo de aprovação. Nossos clientes adoram a organização e agilidade.",
    rating: 5,
  },
  {
    name: "Ana Beatriz Lima",
    role: "Diretora Criativa, Studio Digital",
    text: "A análise de feedback por IA transformou como revisamos campanhas. Economizamos horas toda semana.",
    rating: 5,
  },
];

const stats = [
  { value: "500+", label: "Campanhas geradas" },
  { value: "85%", label: "Redução no tempo" },
  { value: "4.9/5", label: "Satisfação" },
  { value: "50+", label: "Times ativos" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
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
              Plataforma de marketing com IA — Teste grátis
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Transforme briefings em campanhas completas{" "}
              <span className="text-gradient">com IA</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Reduza retrabalho em até 85%, acelere aprovações e gere campanhas profissionais em segundos. 
              Para agências e times de marketing que querem escalar resultados.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/briefing">
                  Criar campanha grátis <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/planos">Ver planos e preços</Link>
              </Button>
            </motion.div>

            {/* Social proof mini */}
            <motion.div variants={fadeUp} custom={4} className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>Usado por <strong className="text-foreground">50+ times</strong> de marketing</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-t border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <p className="text-3xl font-bold text-gradient">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
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

      {/* Testimonials */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O que nossos clientes dizem</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Profissionais de marketing que já transformaram seus resultados.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-xl border border-border bg-card relative"
              >
                <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
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
      <section className="py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/3 blur-3xl" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pronto para transformar seu marketing?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Crie sua primeira campanha em menos de 2 minutos. Sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/briefing">Começar agora — É grátis <ArrowRight size={18} /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/planos">Comparar planos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CreativeFlow AI" className="h-16 w-auto opacity-80" />
            <span className="text-sm text-muted-foreground">© 2026 CreativeFlow AI</span>
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
