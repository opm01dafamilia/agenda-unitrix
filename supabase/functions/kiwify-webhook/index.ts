import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const WEBHOOK_TOKEN = Deno.env.get("KIWIFY_WEBHOOK_TOKEN") || "SIMULATED_ADMIN_TOKEN";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { email, evento, token } = payload;

  // Validate token
  if (token !== WEBHOOK_TOKEN) {
    await supabase.from("webhook_logs").insert({
      email: email || null,
      event_type: evento || "unknown",
      status_processing: "error",
      error_message: "Invalid token",
      raw_payload: payload,
    });
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!email || !evento) {
    await supabase.from("webhook_logs").insert({
      email, event_type: evento || "missing",
      status_processing: "error",
      error_message: "Missing email or evento",
      raw_payload: payload,
    });
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Find business by email
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, premium_status")
    .eq("email", email)
    .maybeSingle();

  let planApplied = "no_change";
  let errorMessage: string | null = null;

  try {
    if (!biz) {
      planApplied = "no_change";
      errorMessage = "Business not found for email";
    } else {
      switch (evento) {
        case "compra_aprovada":
        case "assinatura_renovada": {
          await supabase.from("businesses").update({
            premium_status: "active",
            premium_until: new Date(Date.now() + 30 * 86400000).toISOString(),
            grace_period_until: null,
          }).eq("id", biz.id);
          planApplied = "premium";
          break;
        }
        case "assinatura_atrasada": {
          await supabase.from("businesses").update({
            premium_status: "past_due",
            grace_period_until: new Date(Date.now() + 7 * 86400000).toISOString(),
          }).eq("id", biz.id);
          planApplied = "premium";
          break;
        }
        case "assinatura_cancelada": {
          await supabase.from("businesses").update({
            premium_status: "inactive",
            grace_period_until: null,
          }).eq("id", biz.id);
          planApplied = "free";
          break;
        }
        case "pix_gerado": {
          planApplied = "no_change";
          break;
        }
        default:
          planApplied = "no_change";
          errorMessage = `Unknown event: ${evento}`;
      }
    }
  } catch (err: any) {
    errorMessage = err.message;
  }

  await supabase.from("webhook_logs").insert({
    email,
    event_type: evento,
    status_processing: errorMessage ? "error" : "success",
    plan_applied: planApplied,
    error_message: errorMessage,
    raw_payload: payload,
  });

  return new Response(
    JSON.stringify({ success: !errorMessage, plan_applied: planApplied }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
