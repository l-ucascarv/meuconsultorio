import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  description: string | null;
  features: string[] | null;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string | null>(params.get("plan"));
  const [frequency, setFrequency] = useState<"monthly" | "yearly">(
    (params.get("frequency") as "monthly" | "yearly") || "monthly",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Assinatura — Meu Consultório";
    (async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id,name,price_monthly,price_yearly,description,features")
        .eq("is_active", true)
        .gt("price_monthly", 0)
        .order("price_monthly");
      if (error) {
        toast({ title: "Erro ao carregar planos", description: error.message, variant: "destructive" });
      } else {
        const list = (data || []) as Plan[];
        setPlans(list);
        if (!planId && list[0]) setPlanId(list[0].id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => plans.find((p) => p.id === planId) || null, [plans, planId]);
  const amount = selected
    ? frequency === "yearly" && selected.price_yearly
      ? Number(selected.price_yearly)
      : Number(selected.price_monthly)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("mp-create-checkout", {
      body: { planId, email: email.trim(), name: name.trim(), frequency },
    });
    setSubmitting(false);
    if (error || !data?.init_point) {
      toast({
        title: "Erro ao iniciar pagamento",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = data.init_point as string;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/")} className="text-sm text-muted-foreground mb-4 hover:underline">
          ← Voltar
        </button>
        <h1 className="text-3xl font-black mb-2">Finalize sua assinatura</h1>
        <p className="text-muted-foreground mb-8">
          Selecione o plano e a periodicidade. Após o pagamento, sua conta é criada automaticamente.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanId(p.id)}
              className={`text-left border-2 rounded-2xl p-4 transition-all ${
                planId === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                R$ {Number(p.price_monthly).toFixed(2)}/mês
                {p.price_yearly ? ` · R$ ${Number(p.price_yearly).toFixed(2)}/ano` : ""}
              </p>
              {p.description && <p className="text-xs text-muted-foreground mt-2">{p.description}</p>}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(["monthly", "yearly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              disabled={f === "yearly" && !selected?.price_yearly}
              className={`flex-1 py-2 rounded-xl border-2 font-medium transition-all ${
                frequency === f ? "border-primary bg-primary text-primary-foreground" : "border-border"
              } disabled:opacity-40`}
            >
              {f === "monthly" ? "Mensal" : "Anual"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
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

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Total {frequency === "yearly" ? "anual" : "mensal"}</p>
              <p className="text-2xl font-black">R$ {amount.toFixed(2)}</p>
            </div>
            <button
              type="submit"
              disabled={submitting || !selected}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {submitting ? "Redirecionando..." : "Pagar com Mercado Pago"}
            </button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Pagamento processado com segurança pelo Mercado Pago. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
};

export default Checkout;