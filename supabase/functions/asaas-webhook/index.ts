import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook token
    const WEBHOOK_SECRET = Deno.env.get("ASAAS_WEBHOOK_SECRET");
    if (WEBHOOK_SECRET) {
      const incomingToken = req.headers.get("asaas-access-token");
      if (incomingToken !== WEBHOOK_SECRET) {
        console.error("Invalid webhook token");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    console.log("Asaas webhook received:", JSON.stringify(body));

    const { event, payment } = body;

    if (!event || !payment) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const externalReference = payment.externalReference;
    if (!externalReference) {
      console.log("No externalReference, skipping");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Asaas events to our statuses
    let updates: Record<string, string> = {};

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        updates = { payment_status: "paid", status: "active" };
        break;
      case "PAYMENT_OVERDUE":
        updates = { payment_status: "overdue" };
        break;
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
        updates = { payment_status: "pending", status: "cancelled" };
        break;
      case "PAYMENT_CREATED":
      case "PAYMENT_UPDATED":
        break;
      default:
        console.log("Unhandled event:", event);
    }

    if (Object.keys(updates).length > 0) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", externalReference)
        .order("created_at", { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        const { error } = await supabase
          .from("subscriptions")
          .update(updates)
          .eq("id", subs[0].id);

        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Updated subscription ${subs[0].id}:`, updates);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
