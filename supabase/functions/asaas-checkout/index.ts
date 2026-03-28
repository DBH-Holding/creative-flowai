import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_API_URL = "https://api.asaas.com/v3"; // produção
// const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3"; // sandbox

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
  if (!ASAAS_API_KEY) {
    return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const body = await req.json();
    const { plan_id, name, cpfCnpj } = body;

    if (!plan_id || !name || !cpfCnpj) {
      return new Response(JSON.stringify({ error: "plan_id, name e cpfCnpj são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get plan details
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: plan, error: planError } = await serviceClient
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free plan — just create subscription directly
    if (plan.price === 0) {
      const { data: sub, error: subError } = await serviceClient
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: "active",
          payment_status: "paid",
          campaigns_limit: 3,
          feedbacks_limit: 15,
          next_billing_date: null,
        })
        .select()
        .single();

      if (subError) {
        return new Response(JSON.stringify({ error: subError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ subscription: sub, paymentUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create or find customer in Asaas
    const asaasHeaders = {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
    };

    // Check existing customer by email
    const customerSearch = await fetch(
      `${ASAAS_API_URL}/customers?email=${encodeURIComponent(userEmail)}`,
      { headers: asaasHeaders }
    );
    const customerSearchData = await customerSearch.json();

    let customerId: string;

    if (customerSearchData.data?.length > 0) {
      customerId = customerSearchData.data[0].id;
    } else {
      const createCustomer = await fetch(`${ASAAS_API_URL}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name,
          email: userEmail,
          cpfCnpj,
          externalReference: userId,
        }),
      });
      const customerData = await createCustomer.json();
      if (!createCustomer.ok) {
        return new Response(
          JSON.stringify({ error: "Erro ao criar cliente no Asaas", details: customerData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      customerId = customerData.id;
    }

    // 2. Create subscription in Asaas
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split("T")[0];

    const asaasSub = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "CREDIT_CARD",
        value: Number(plan.price),
        cycle: "MONTHLY",
        nextDueDate: dueDateStr,
        description: `Assinatura ${plan.name} - CreativeFlow AI`,
        externalReference: userId,
      }),
    });

    const asaasSubData = await asaasSub.json();
    if (!asaasSub.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar assinatura no Asaas", details: asaasSubData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create local subscription record
    const billingDate = new Date();
    billingDate.setMonth(billingDate.getMonth() + 1);

    const { data: sub, error: subError } = await serviceClient
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: "pending",
        payment_status: "pending",
        next_billing_date: billingDate.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return payment link
    const paymentUrl = asaasSubData.paymentLink || `https://www.asaas.com/c/${asaasSubData.id}`;

    return new Response(
      JSON.stringify({ subscription: sub, paymentUrl, asaasSubscriptionId: asaasSubData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
