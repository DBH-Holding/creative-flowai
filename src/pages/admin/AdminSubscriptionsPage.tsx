import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubRow {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  plan_name: string;
  plan_price: number;
  started_at: string;
  next_billing_date: string | null;
  display_name: string | null;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubs = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, plans(name, price)")
      .order("created_at", { ascending: false });

    // Get profiles for display names
    const userIds = [...new Set((data || []).map((s: any) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.display_name]));

    setSubs(
      (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        status: s.status,
        payment_status: s.payment_status,
        plan_name: s.plans?.name || "—",
        plan_price: s.plans?.price || 0,
        started_at: s.started_at,
        next_billing_date: s.next_billing_date,
        display_name: profileMap[s.user_id] || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { loadSubs(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("subscriptions").update({ status }).eq("id", id);
    toast.success("Status atualizado");
    loadSubs();
  };

  const updatePayment = async (id: string, payment_status: string) => {
    await supabase.from("subscriptions").update({ payment_status }).eq("id", id);
    toast.success("Pagamento atualizado");
    loadSubs();
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    cancelled: "bg-destructive/20 text-destructive",
  };

  const paymentColors: Record<string, string> = {
    paid: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    overdue: "bg-destructive/20 text-destructive",
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Gestão de Assinaturas</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : subs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Nenhuma assinatura registrada.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium">{s.display_name || s.user_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{s.plan_name}</TableCell>
                  <TableCell className="text-sm">R${s.plan_price}</TableCell>
                  <TableCell>
                    <Select defaultValue={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={s.payment_status} onValueChange={(v) => updatePayment(s.id, v)}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.started_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}
