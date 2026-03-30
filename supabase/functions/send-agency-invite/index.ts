import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { inviteId } = await req.json();

    if (!inviteId) {
      return new Response(JSON.stringify({ error: "inviteId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invite details using service role for full access
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: invite, error: inviteError } = await adminClient
      .from("agency_invites")
      .select("*, agencies(name)")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get inviter profile
    const { data: inviterProfile } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const inviterName = inviterProfile?.display_name || user.email || "Alguém";
    const agencyName = invite.agencies?.name || "uma agência";
    const roleLabels: Record<string, string> = {
      owner: "Dono",
      manager: "Gerente",
      member: "Membro da equipe",
      client: "Cliente",
    };
    const roleLabel = roleLabels[invite.role] || invite.role;

    // Build invite URL - use the project URL
    const siteUrl = Deno.env.get("SITE_URL") || 
      `https://${Deno.env.get("VITE_SUPABASE_PROJECT_ID") || "app"}.lovable.app`;
    const inviteUrl = `${siteUrl}/convite?token=${invite.token}`;

    // Send email via Lovable AI edge function invoke or fallback
    // For now, we log the invite and return the URL for manual sharing
    // When email domain is configured, this will use send-transactional-email
    
    console.log(`[send-agency-invite] Invite email for ${invite.email}`, {
      agencyName,
      inviterName,
      roleLabel,
      inviteUrl,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Convite processado",
        inviteUrl,
        email: invite.email,
        agencyName,
        role: roleLabel,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[send-agency-invite] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
