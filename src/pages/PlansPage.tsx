import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { plans } from "@/data/constants";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlansPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Planos e Preços</h1>
          <p className="text-muted-foreground">Escolha o plano ideal para seu time. Cancele quando quiser.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-xl border p-8 flex flex-col",
                plan.highlighted ? "border-primary bg-primary/5 glow" : "border-border bg-card"
              )}
            >
              {plan.highlighted && (
                <span className="text-xs font-medium text-primary mb-2">Mais popular</span>
              )}
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <div className="mt-4 mb-8">
                <span className="text-4xl font-bold">R${plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={plan.highlighted ? "hero" : "outline"} size="lg" asChild>
                <Link to="/billing">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
