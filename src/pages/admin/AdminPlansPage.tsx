import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface PlanRow {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  active: boolean;
  sort_order: number;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadPlans = async () => {
    const { data } = await supabase.from("plans").select("*").order("sort_order");
    setPlans((data || []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
    setLoading(false);
  };

  useEffect(() => { loadPlans(); }, []);

  const startNew = () => {
    setIsNew(true);
    setEditing({
      id: "",
      name: "",
      price: 0,
      period: "/mês",
      features: [""],
      highlighted: false,
      cta: "Assinar",
      active: true,
      sort_order: plans.length,
    });
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name,
      price: editing.price,
      period: editing.period,
      features: editing.features.filter(Boolean),
      highlighted: editing.highlighted,
      cta: editing.cta,
      active: editing.active,
      sort_order: editing.sort_order,
    };

    if (isNew) {
      await supabase.from("plans").insert(payload);
      toast.success("Plano criado");
    } else {
      await supabase.from("plans").update(payload).eq("id", editing.id);
      toast.success("Plano atualizado");
    }
    setEditing(null);
    setIsNew(false);
    loadPlans();
  };

  const remove = async (id: string) => {
    await supabase.from("plans").delete().eq("id", id);
    toast.success("Plano removido");
    loadPlans();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestão de Planos</h1>
        <Button onClick={startNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Novo plano</Button>
      </div>

      {editing && (
        <div className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4 animate-slide-up">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Nome</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Período</Label>
              <Input value={editing.period} onChange={(e) => setEditing({ ...editing, period: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>CTA</Label>
            <Input value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} />
          </div>
          <div>
            <Label>Features (uma por linha)</Label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
              value={editing.features.join("\n")}
              onChange={(e) => setEditing({ ...editing, features: e.target.value.split("\n") })}
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={editing.highlighted} onCheckedChange={(v) => setEditing({ ...editing, highlighted: v })} />
              <Label>Destacado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
            <Button variant="ghost" onClick={() => { setEditing(null); setIsNew(false); }}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.highlighted && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Destaque</span>}
                  {!plan.active && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Inativo</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">R${plan.price}{plan.period} · {plan.features.length} features</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(plan); setIsNew(false); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(plan.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
