import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SubRow {
  id: string;
  status: string;
  current_period_end: string | null;
  mp_preapproval_id: string | null;
  plan_id: string | null;
}

interface PaymentRow {
  id: string;
  status: string;
  amount: number | null;
  currency: string | null;
  paid_at: string | null;
  created_at: string;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sub, setSub] = useState<SubRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    document.title = "Minha Assinatura — Meu Consultório";
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id,status,current_period_end,mp_preapproval_id,plan_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("payment_logs")
          .select("id,status,amount,currency,paid_at,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setSub((s as SubRow | null) || null);
      setPayments((p as PaymentRow[] | null) || []);
      setLoading(false);
    })();
  }, [user]);

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    setCancelling(true);
    const { error } = await supabase.functions.invoke("mp-cancel-subscription", { body: {} });
    setCancelling(false);
    if (error) {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Assinatura cancelada", description: "Você ainda tem acesso até o fim do período pago." });
    setSub((s) => (s ? { ...s, status: "cancelled" } : s));
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
        <button onClick={() => navigate("/app")} className="text-sm text-muted-foreground mb-4 hover:underline">
          ← Voltar ao app
        </button>
        <h1 className="text-3xl font-black mb-8">Minha assinatura</h1>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-xl font-bold capitalize">{sub?.status || profile?.subscription_status || "—"}</p>
          {sub?.current_period_end && (
            <p className="text-sm text-muted-foreground mt-2">
              Próxima cobrança: {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
            </p>
          )}
          <div className="flex gap-3 mt-4">
            {(!sub || ["cancelled", "expired", "pending"].includes(sub.status)) && (
              <button
                onClick={() => navigate("/checkout")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold"
              >
                Reativar assinatura
              </button>
            )}
            {sub && ["active", "past_due", "trial"].includes(sub.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 border-2 border-border rounded-xl font-bold hover:bg-muted"
              >
                {cancelling ? "Cancelando..." : "Cancelar assinatura"}
              </button>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">Histórico de pagamentos</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {p.currency || "BRL"} {Number(p.amount ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.paid_at || p.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      p.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;