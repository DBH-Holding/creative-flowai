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

    const { event, payment, subscription: asaasSub } = body;

    if (!event) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get externalReference from payment or subscription
    const externalReference = payment?.externalReference || asaasSub?.externalReference;
    if (!externalReference) {
      console.log("No externalReference, skipping");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user's latest subscription
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, status, payment_status, plan_id")
      .eq("user_id", externalReference)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!subs || subs.length === 0) {
      console.log("No subscription found for user:", externalReference);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subId = subs[0].id;
    let updates: Record<string, any> = {};

    switch (event) {
      // Payment events
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        updates = {
          payment_status: "paid",
          status: "active",
        };
        // Set next billing date to 30 days from now on confirmed payment
        const nextBilling = new Date();
        nextBilling.setDate(nextBilling.getDate() + 30);
        updates.next_billing_date = nextBilling.toISOString().split("T")[0];
        break;

      case "PAYMENT_OVERDUE":
        updates = { payment_status: "overdue" };
        break;

      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
        updates = { payment_status: "pending", status: "cancelled", cancelled_at: new Date().toISOString() };
        break;

      // Subscription events
      case "SUBSCRIPTION_RENEWED":
        // Reset monthly usage on renewal
        updates = {
          payment_status: "pending",
          campaigns_used: 0,
          feedbacks_used: 0,
        };
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + 30);
        updates.next_billing_date = renewalDate.toISOString().split("T")[0];
        break;

      case "SUBSCRIPTION_INACTIVE":
      case "SUBSCRIPTION_DELETED":
        updates = {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        };
        break;

      case "SUBSCRIPTION_UPDATED":
        // Handle plan change if value changed
        if (asaasSub?.value) {
          const { data: matchingPlan } = await supabase
            .from("plans")
            .select("id, name")
            .eq("price", asaasSub.value)
            .eq("active", true)
            .limit(1);

          if (matchingPlan && matchingPlan.length > 0) {
            updates.plan_id = matchingPlan[0].id;
          }
        }
        break;

      case "PAYMENT_CREATED":
      case "PAYMENT_UPDATED":
        // No action needed
        break;

      default:
        console.log("Unhandled event:", event);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", subId);

      if (error) {
        console.error("Error updating subscription:", error);
      } else {
        console.log(`Updated subscription ${subId}:`, updates);
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
