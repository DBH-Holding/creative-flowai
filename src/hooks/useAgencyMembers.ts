import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AgencyRole } from "./useAgency";

export function useAgencyMembers(agencyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["agency-members", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_members")
        .select("*, profiles(display_name, avatar_url)")
        .eq("agency_id", agencyId!);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["agency-invites", agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_invites")
        .select("*")
        .eq("agency_id", agencyId!)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AgencyRole }) => {
      const { data, error } = await supabase
        .from("agency_invites")
        .insert({
          agency_id: agencyId!,
          email,
          role,
          invited_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Call edge function to process invite (email + generate URL)
      const { data: inviteResult } = await supabase.functions.invoke("send-agency-invite", {
        body: { inviteId: data.id },
      });

      return { ...data, inviteUrl: inviteResult?.inviteUrl };
    },
    onSuccess: (data: any) => {
      if (data?.inviteUrl) {
        // Copy invite link to clipboard
        navigator.clipboard.writeText(data.inviteUrl).then(() => {
          toast.success("Convite criado! Link copiado para a área de transferência.", {
            description: `Envie o link para ${data.email}`,
            duration: 6000,
          });
        }).catch(() => {
          toast.success("Convite criado!", {
            description: data.inviteUrl,
            duration: 10000,
          });
        });
      } else {
        toast.success("Convite enviado com sucesso!");
      }
      queryClient.invalidateQueries({ queryKey: ["agency-invites", agencyId] });
    },
    onError: (err: any) => {
      if (err?.code === "23505") {
        toast.error("Este email já foi convidado para esta agência.");
      } else {
        toast.error("Erro ao enviar convite.");
      }
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: AgencyRole }) => {
      const { error } = await supabase
        .from("agency_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Papel atualizado!");
      queryClient.invalidateQueries({ queryKey: ["agency-members", agencyId] });
    },
    onError: () => toast.error("Erro ao atualizar papel."),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("agency_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido.");
      queryClient.invalidateQueries({ queryKey: ["agency-members", agencyId] });
    },
    onError: () => toast.error("Erro ao remover membro."),
  });

  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("agency_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite cancelado.");
      queryClient.invalidateQueries({ queryKey: ["agency-invites", agencyId] });
    },
    onError: () => toast.error("Erro ao cancelar convite."),
  });

  return {
    members: members ?? [],
    invites: invites ?? [],
    isLoading: isLoading || invitesLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvite,
  };
}
