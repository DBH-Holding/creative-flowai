import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PlanRow {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        setPlans(
          (data || []).map((p: any) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : [],
          }))
        );
        setLoading(false);
      });
  }, []);

  const handleSelect = (planId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/billing?plan=${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Planos e Preços</h1>
          <p className="text-muted-foreground">Escolha o plano ideal para seu time. Cancele quando quiser.</p>
        </div>

        <div className={cn(
          "grid gap-6 max-w-5xl mx-auto",
          plans.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"
        )}>
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
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold">Grátis</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">R${plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? "hero" : "outline"}
                size="lg"
                onClick={() => handleSelect(plan.id)}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
