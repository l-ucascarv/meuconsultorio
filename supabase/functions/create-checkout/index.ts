import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { type StripeEnv, createStripeClient, corsHeaders } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 255;
}

function genTempPassword() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

async function ensureUser(email: string, name?: string): Promise<{ userId: string; created: boolean; tempPassword?: string }> {
  // Try to find existing user (paginate listUsers)
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return { userId: found.id, created: false };
    if (data.users.length < 200) break;
    page++;
  }
  const tempPassword = genTempPassword();
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: name || email.split("@")[0] },
  });
  if (createErr || !created.user) throw createErr ?? new Error("Failed to create user");

  // Mark must_change_password so onboarding kicks in
  await supabase
    .from("profiles")
    .update({ must_change_password: true })
    .eq("user_id", created.user.id);

  return { userId: created.user.id, created: true, tempPassword };
}

async function sendWelcomeEmail(email: string, name: string | undefined, tempPassword: string, appUrl: string) {
  try {
    await resend.emails.send({
      from: "Meu Consultório <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo(a) ao Meu Consultório — sua senha de acesso",
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
          <h1 style="font-size:22px;margin:0 0 16px;">Olá${name ? `, ${name}` : ""} 👋</h1>
          <p>Sua conta foi criada com sucesso. Use as credenciais abaixo para entrar:</p>
          <div style="background:#f5f5f5;padding:16px;border-radius:12px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin:0;"><strong>Senha temporária:</strong> <code>${tempPassword}</code></p>
          </div>
          <p>Por segurança, você será solicitado(a) a definir uma nova senha no primeiro acesso.</p>
          <p style="margin-top:24px;">
            <a href="${appUrl}/auth" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">Acessar minha conta</a>
          </p>
          <p style="color:#666;font-size:12px;margin-top:32px;">Se você não solicitou esta conta, ignore este e-mail.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Resend error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const priceId = String(body.priceId || "");
    const email = body.customerEmail;
    const name = body.name;
    const returnUrl = String(body.returnUrl || "");
    const environment = (body.environment === "live" ? "live" : "sandbox") as StripeEnv;

    if (!/^[a-zA-Z0-9_-]+$/.test(priceId)) return json({ error: "Invalid priceId" }, 400);
    if (!returnUrl) return json({ error: "returnUrl required" }, 400);

    // Resolve user: prefer logged-in, else create from email
    let userId = body.userId as string | undefined;
    let userEmail = isEmail(email) ? email : undefined;
    let createdUser = false;
    let tempPassword: string | undefined;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ") && !userId) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        userEmail = userEmail || data.user.email || undefined;
      }
    }

    if (!userId) {
      if (!userEmail) return json({ error: "Email required for anonymous checkout" }, 400);
      const result = await ensureUser(userEmail, name);
      userId = result.userId;
      createdUser = result.created;
      tempPassword = result.tempPassword;
    }

    const stripe = createStripeClient(environment);
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) return json({ error: "Price not found" }, 404);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    // Resolve or create Stripe Customer with userId metadata
    let customerId: string | undefined;
    if (userEmail || userId) {
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      if (found.data.length) {
        customerId = found.data[0].id;
      } else if (userEmail) {
        const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (existing.data.length) {
          customerId = existing.data[0].id;
          await stripe.customers.update(customerId, {
            metadata: { ...existing.data[0].metadata, userId: userId! },
          });
        }
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          ...(userEmail && { email: userEmail }),
          metadata: { userId: userId! },
        });
        customerId = created.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      metadata: { userId: userId! },
      ...(isRecurring && { subscription_data: { metadata: { userId: userId! } } }),
    });

    // Send welcome email AFTER session is created (so user has both account + checkout running)
    if (createdUser && tempPassword && userEmail) {
      const appUrl = new URL(returnUrl).origin;
      await sendWelcomeEmail(userEmail, name, tempPassword, appUrl);
    }

    return json({ clientSecret: session.client_secret });
  } catch (e) {
    console.error("create-checkout error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});