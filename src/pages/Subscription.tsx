import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getStripeEnvironment } from "@/lib/stripe";

interface SubRow {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  price_id: string | null;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    document.title = "Minha Assinatura — Meu Consultório";
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id,status,current_period_end,cancel_at_period_end,price_id")
        .eq("user_id", user.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub((data as SubRow | null) || null);
      setLoading(false);
    })();
  }, [user]);

  const openPortal = async () => {
    setOpening(true);
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: {
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/assinatura`,
      },
    });
    setOpening(false);
    if (error || !data?.url) {
      toast({ title: "Erro ao abrir gerenciador", description: error?.message || "Tente novamente", variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank");
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
              {sub.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}: {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
            </p>
          )}
          <div className="flex gap-3 mt-4 flex-wrap">
            {(!sub || ["canceled", "unpaid", "incomplete_expired"].includes(sub.status)) && (
              <button onClick={() => navigate("/checkout")} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold">
                Reativar assinatura
              </button>
            )}
            {sub && (
              <button onClick={openPortal} disabled={opening} className="px-4 py-2 border-2 border-border rounded-xl font-bold hover:bg-muted">
                {opening ? "Abrindo..." : "Gerenciar assinatura"}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Cancele, atualize forma de pagamento ou veja faturas no gerenciador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
