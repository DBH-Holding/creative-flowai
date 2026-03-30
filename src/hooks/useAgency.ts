import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AgencyRole = "owner" | "manager" | "member" | "client";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface AgencyMembership {
  agency: Agency;
  role: AgencyRole;
}

export function useAgency() {
  const { user } = useAuth();

  const { data: memberships, isLoading, refetch } = useQuery({
    queryKey: ["agency-memberships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_members")
        .select("role, agencies(*)")
        .eq("user_id", user!.id);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        agency: m.agencies as Agency,
        role: m.role as AgencyRole,
      }));
    },
  });

  const currentAgency = memberships?.[0]?.agency ?? null;
  const currentRole = memberships?.[0]?.role ?? null;

  const isOwner = currentRole === "owner";
  const isManager = currentRole === "manager";
  const isAgencyAdmin = isOwner || isManager;
  const isMember = currentRole === "member";
  const isClient = currentRole === "client";
  const hasAgency = !!currentAgency;

  return {
    memberships: memberships ?? [],
    currentAgency,
    currentRole,
    isOwner,
    isManager,
    isAgencyAdmin,
    isMember,
    isClient,
    hasAgency,
    isLoading,
    refetch,
  };
}
