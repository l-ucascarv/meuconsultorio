import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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

function verifySignature(headerSig: string | null, requestId: string | null, dataId: string): boolean {
  if (!headerSig || !requestId || !MP_WEBHOOK_SECRET) return false;
  const parts = Object.fromEntries(
    headerSig.split(",").map((p) => {
      const [k, v] = p.trim().split("=");
      return [k, v];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = createHmac("sha256", MP_WEBHOOK_SECRET).update(manifest).digest("hex");
  return hmac === v1;
}

function generateTempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14) + "!A1";
}

async function mpFetch(path: string) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sendWelcomeEmail(email: string, name: string, password: string) {
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("Resend not configured — skipping welcome email");
    return;
  }
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h1 style="color:#4f46e5;margin:0 0 16px">Bem-vindo(a) ao Meu Consultório, ${name || ""}!</h1>
      <p>Sua assinatura foi confirmada com sucesso.</p>
      <p>Use as credenciais abaixo para o seu primeiro acesso:</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>E-mail:</strong> ${email}</p>
        <p style="margin:4px 0"><strong>Senha temporária:</strong> <code>${password}</code></p>
      </div>
      <p>No primeiro acesso você definirá uma nova senha pessoal.</p>
      <p style="margin:24px 0">
        <a href="${APP_URL}/auth" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Acessar minha conta</a>
      </p>
      <p style="color:#64748b;font-size:13px">Se você não reconhece esta assinatura, entre em contato com nosso suporte.</p>
    </div>
  `;
  try {
    const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Meu Consultório <onboarding@resend.dev>",
        to: [email],
        subject: "Sua conta no Meu Consultório está pronta",
        html,
      }),
    });
    if (!r.ok) console.error("Resend error:", r.status, await r.text());
  } catch (e) {
    console.error("Resend send failed:", e);
  }
}

async function ensureUser(email: string, name: string | null) {
  // Try to find existing user
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return { userId: existing.id, password: null as string | null, created: false };

  const password = generateTempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);

  // Mark must_change_password
  await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("user_id", data.user.id);

  return { userId: data.user.id, password, created: true };
}

async function upsertActiveSubscription(params: {
  userId: string;
  preapprovalId?: string | null;
  payerId?: string | null;
  payerEmail?: string | null;
  periodEnd?: Date | null;
  status: "active" | "past_due" | "cancelled" | "expired";
}) {
  const { userId, preapprovalId, payerId, payerEmail, periodEnd, status } = params;
  // Try update by mp_preapproval_id first
  if (preapprovalId) {
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id")
      .eq("mp_preapproval_id", preapprovalId)
      .maybeSingle();
    if (existing) {
      await admin
        .from("subscriptions")
        .update({
          status,
          current_period_end: periodEnd?.toISOString() ?? null,
          mp_payer_id: payerId,
          mp_payer_email: payerEmail,
        })
        .eq("id", existing.id);
      return existing.id;
    }
  }
  const { data: ins } = await admin
    .from("subscriptions")
    .insert({
      user_id: userId,
      status,
      mp_preapproval_id: preapprovalId,
      mp_payer_id: payerId,
      mp_payer_email: payerEmail,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd?.toISOString() ?? null,
    })
    .select("id")
    .single();
  return ins?.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = req.headers.get("x-request-id");
  const signature = req.headers.get("x-signature");
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const dataId = String((body as any)?.data?.id ?? (body as any)?.id ?? "");
  const eventType = String((body as any)?.type ?? (body as any)?.action ?? "unknown");
  const sigValid = verifySignature(signature, requestId, dataId);

  // Always log webhook (idempotency UNIQUE on provider+event_type+resource_id)
  const { error: logErr } = await admin.from("webhook_logs").insert({
    provider: "mercadopago",
    event_type: eventType,
    mp_resource_id: dataId,
    signature_valid: sigValid,
    payload: body,
  });
  // If duplicate event, ack with 200 to stop retries
  if (logErr && (logErr as any).code === "23505") {
    return json({ ok: true, duplicate: true });
  }

  if (!sigValid) {
    return json({ error: "Invalid signature" }, 401);
  }

  try {
    if (eventType.startsWith("payment")) {
      const payment = await mpFetch(`/v1/payments/${dataId}`);
      const status = payment.status as string;
      const payerEmail = payment.payer?.email as string | undefined;
      const payerName = (payment.payer?.first_name || "") + " " + (payment.payer?.last_name || "");
      const preapprovalId = payment.metadata?.preapproval_id || payment.point_of_interaction?.transaction_data?.subscription_id || null;
      const amount = payment.transaction_amount;
      const currency = payment.currency_id || "BRL";

      // Idempotency on payment id
      const { error: payErr } = await admin.from("payment_logs").insert({
        mp_payment_id: String(payment.id),
        status,
        amount,
        currency,
        paid_at: payment.date_approved ?? null,
        raw: payment,
      });
      const isDuplicate = payErr && (payErr as any).code === "23505";

      if (status === "approved" && payerEmail && !isDuplicate) {
        const { userId, password, created } = await ensureUser(payerEmail, payerName.trim() || null);
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 31);
        const subId = await upsertActiveSubscription({
          userId,
          preapprovalId,
          payerId: payment.payer?.id ? String(payment.payer.id) : null,
          payerEmail,
          periodEnd,
          status: "active",
        });
        // backfill payment_logs with user/subscription
        await admin
          .from("payment_logs")
          .update({ user_id: userId, subscription_id: subId })
          .eq("mp_payment_id", String(payment.id));

        if (created && password) {
          await sendWelcomeEmail(payerEmail, payerName.trim(), password);
        }
      }
    } else if (eventType.startsWith("preapproval") || eventType.startsWith("subscription")) {
      const pre = await mpFetch(`/preapproval/${dataId}`);
      const status = pre.status as string; // authorized, paused, cancelled, finished
      const payerEmail = pre.payer_email as string | undefined;
      if (payerEmail) {
        const { userId } = await ensureUser(payerEmail, null);
        const mapped: "active" | "cancelled" | "past_due" | "expired" =
          status === "authorized"
            ? "active"
            : status === "paused"
              ? "past_due"
              : status === "cancelled"
                ? "cancelled"
                : "expired";
        const nextDate = pre.next_payment_date ? new Date(pre.next_payment_date) : null;
        await upsertActiveSubscription({
          userId,
          preapprovalId: String(pre.id),
          payerId: pre.payer_id ? String(pre.payer_id) : null,
          payerEmail,
          periodEnd: nextDate,
          status: mapped,
        });
      }
    }

    await admin
      .from("webhook_logs")
      .update({ processed: true })
      .eq("provider", "mercadopago")
      .eq("event_type", eventType)
      .eq("mp_resource_id", dataId);

    return json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Webhook error:", msg);
    await admin
      .from("webhook_logs")
      .update({ processed: false, error: msg })
      .eq("provider", "mercadopago")
      .eq("event_type", eventType)
      .eq("mp_resource_id", dataId);
    return json({ error: msg }, 500);
  }
});