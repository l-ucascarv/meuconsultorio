import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://meuconsultorio.lovable.app";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Body {
  planId: string; // uuid in subscription_plans
  email: string;
  name?: string;
  frequency?: "monthly" | "yearly";
}

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 255;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as Partial<Body>;
    if (!body.planId || !isEmail(body.email)) {
      return json({ error: "Invalid input" }, 400);
    }

    const { data: plan, error: planErr } = await admin
      .from("subscription_plans")
      .select("id,name,price_monthly,price_yearly")
      .eq("id", body.planId)
      .eq("is_active", true)
      .maybeSingle();
    if (planErr || !plan) return json({ error: "Plan not found" }, 404);

    const isYearly = body.frequency === "yearly";
    const amount = isYearly && plan.price_yearly ? Number(plan.price_yearly) : Number(plan.price_monthly);
    if (!amount || amount <= 0) return json({ error: "Invalid plan price" }, 400);

    const preapprovalBody = {
      reason: `Assinatura ${plan.name}${isYearly ? " (anual)" : " (mensal)"} - Meu Consultório`,
      auto_recurring: {
        frequency: isYearly ? 12 : 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      payer_email: body.email,
      back_url: `${APP_URL}/checkout/sucesso`,
      status: "pending",
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preapprovalBody),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP preapproval failed:", mpData);
      return json({ error: "Mercado Pago error", detail: mpData }, 502);
    }

    return json({
      init_point: mpData.init_point,
      preapproval_id: mpData.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});