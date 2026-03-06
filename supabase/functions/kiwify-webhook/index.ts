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

  // Log event to admin_logs
  await supabase.from("admin_logs").insert({
    event_type: eventType,
    source: "kiwify",
    payload: payload,
  });

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
        await supabase
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

      } else if (
        normalizedEvent.includes("assinatura_renovada") ||
        normalizedEvent.includes("subscription_renewed")
      ) {
        // Renew - ensure active
        await supabase
          .from("access_control")
          .update({
            status: "active",
            source: "kiwify",
            external_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

      } else if (
        normalizedEvent.includes("assinatura_cancelada") ||
        normalizedEvent.includes("subscription_cancelled") ||
        normalizedEvent.includes("reembolso") ||
        normalizedEvent.includes("refund") ||
        normalizedEvent.includes("chargeback")
      ) {
        // Block access
        await supabase
          .from("access_control")
          .update({
            status: "cancelled",
            source: "kiwify",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

      } else if (
        normalizedEvent.includes("assinatura_atrasada") ||
        normalizedEvent.includes("subscription_overdue")
      ) {
        // Mark as overdue
        await supabase
          .from("access_control")
          .update({
            status: "overdue",
            source: "kiwify",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
