import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import {
  PRICE_MONTHLY,
  PRICE_YEARLY,
  PRICE_MONTHLY_AMOUNT,
  PRICE_YEARLY_AMOUNT,
} from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";

const Checkout = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [frequency, setFrequency] = useState<"monthly" | "yearly">(
    (params.get("frequency") as "monthly" | "yearly") || "monthly",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    document.title = "Assinatura — Meu Consultório";
  }, []);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const priceId = frequency === "yearly" ? PRICE_YEARLY : PRICE_MONTHLY;
  const amount = frequency === "yearly" ? PRICE_YEARLY_AMOUNT : PRICE_MONTHLY_AMOUNT;
  const monthlyEquivalent = frequency === "yearly" ? PRICE_YEARLY_AMOUNT / 12 : PRICE_MONTHLY_AMOUNT;

  const returnUrl = useMemo(
    () => `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    [],
  );

  const canStart = !!user || (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && name.trim().length > 1);

  if (started) {
    return (
      <div className="min-h-screen bg-background">
        <PaymentTestModeBanner />
        <div className="max-w-3xl mx-auto py-8 px-4">
          <button
            onClick={() => setStarted(false)}
            className="text-sm text-muted-foreground mb-4 hover:underline"
          >
            ← Alterar dados
          </button>
          <StripeEmbeddedCheckout
            priceId={priceId}
            customerEmail={email}
            name={name}
            userId={user?.id}
            returnUrl={returnUrl}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-2xl mx-auto py-10 px-4">
        <button onClick={() => navigate("/")} className="text-sm text-muted-foreground mb-4 hover:underline">
          ← Voltar
        </button>
        <h1 className="text-3xl font-black mb-2">Finalize sua assinatura</h1>
        <p className="text-muted-foreground mb-8">
          Após o pagamento, sua conta é criada automaticamente e você recebe os dados de acesso por e-mail.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setFrequency("monthly")}
            className={`text-left border-2 rounded-2xl p-5 transition-all ${
              frequency === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mensal</p>
            <p className="text-2xl font-black mt-1">R$ {PRICE_MONTHLY_AMOUNT.toFixed(2)}<span className="text-sm font-medium text-muted-foreground">/mês</span></p>
            <p className="text-xs text-muted-foreground mt-1">Cobrado mensalmente</p>
          </button>
          <button
            type="button"
            onClick={() => setFrequency("yearly")}
            className={`text-left border-2 rounded-2xl p-5 transition-all relative ${
              frequency === "yearly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
              -15%
            </span>
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Anual</p>
            <p className="text-2xl font-black mt-1">R$ {(PRICE_YEARLY_AMOUNT / 12).toFixed(2)}<span className="text-sm font-medium text-muted-foreground">/mês</span></p>
            <p className="text-xs text-muted-foreground mt-1">R$ {PRICE_YEARLY_AMOUNT.toFixed(2)} cobrados uma vez por ano</p>
          </button>
        </div>

        {!user && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background"
                placeholder="Como devemos te chamar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="w-full px-4 py-3 border-2 border-border rounded-xl bg-background"
                placeholder="seu@email.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sua conta será criada com este e-mail. Você receberá uma senha temporária.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total {frequency === "yearly" ? "anual" : "mensal"}</p>
            <p className="text-2xl font-black">R$ {amount.toFixed(2)}</p>
            {frequency === "yearly" && (
              <p className="text-xs text-emerald-700 font-medium mt-1">
                Equivale a R$ {monthlyEquivalent.toFixed(2)}/mês
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={!canStart}
            onClick={() => setStarted(true)}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Continuar para pagamento
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Cancele a qualquer momento. Pagamento processado com segurança.
        </p>
      </div>
    </div>
  );
};

export default Checkout;