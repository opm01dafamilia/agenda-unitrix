import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate token
  const WEBHOOK_TOKEN = Deno.env.get("KIWIFY_WEBHOOK_TOKEN") || "";
  const receivedToken = payload?.token || req.headers.get("x-webhook-token") || "";

  if (receivedToken !== WEBHOOK_TOKEN) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const eventType = payload?.evento || payload?.event || "unknown";
  const customerEmail = payload?.Customer?.email || payload?.customer?.email || null;
  const subscriptionId = payload?.Subscription?.id || payload?.subscription?.id || null;
  const productName = payload?.Product?.name || payload?.product?.name || "";

  // Determine plan from product name
  let plan = "Mensal";
  if (productName.toLowerCase().includes("anual") || productName.toLowerCase().includes("annual")) {
    plan = "Anual";
  }

  // Log event to admin_logs
  await supabase.from("admin_logs").insert({
    event_type: eventType,
    source: "kiwify",
    payload: payload,
  });

  // Log to webhook_logs for detailed tracking
  let processingStatus = "success";
  let errorMessage: string | null = null;

  // Process subscription events if we have a customer email
  if (customerEmail) {
    // Find user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (profile) {
      const userId = profile.id;
      const normalizedEvent = eventType.toLowerCase().replace(/\s+/g, "_");

      if (
        normalizedEvent.includes("compra_aprovada") ||
        normalizedEvent.includes("order_paid") ||
        normalizedEvent.includes("purchase_approved")
      ) {
        // Activate access
        const { error } = await supabase
          .from("access_control")
          .upsert(
            {
              user_id: userId,
              status: "active",
              source: "kiwify",
              external_subscription_id: subscriptionId,
              external_customer_id: payload?.Customer?.id || payload?.customer?.id || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        if (error) { processingStatus = "error"; errorMessage = error.message; }

      } else if (
        normalizedEvent.includes("assinatura_renovada") ||
        normalizedEvent.includes("subscription_renewed")
      ) {
        // Renew - ensure active
        const { error } = await supabase
          .from("access_control")
          .update({
            status: "active",
            source: "kiwify",
            external_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        if (error) { processingStatus = "error"; errorMessage = error.message; }

      } else if (
        normalizedEvent.includes("assinatura_cancelada") ||
        normalizedEvent.includes("subscription_cancelled") ||
        normalizedEvent.includes("reembolso") ||
        normalizedEvent.includes("refund") ||
        normalizedEvent.includes("chargeback")
      ) {
        // Block access
        const { error } = await supabase
          .from("access_control")
          .update({
            status: "cancelled",
            source: "kiwify",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        if (error) { processingStatus = "error"; errorMessage = error.message; }

      } else if (
        normalizedEvent.includes("assinatura_atrasada") ||
        normalizedEvent.includes("subscription_overdue")
      ) {
        // Mark as overdue
        const { error } = await supabase
          .from("access_control")
          .update({
            status: "overdue",
            source: "kiwify",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        if (error) { processingStatus = "error"; errorMessage = error.message; }
      }
    } else {
      processingStatus = "error";
      errorMessage = `Usuário não encontrado: ${customerEmail}`;
    }
  } else {
    processingStatus = "error";
    errorMessage = "Email do cliente não encontrado no payload";
  }

  // Log to webhook_logs
  await supabase.from("webhook_logs").insert({
    event_type: eventType,
    email: customerEmail,
    raw_payload: payload,
    status_processing: processingStatus,
    plan_applied: plan,
    error_message: errorMessage,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
