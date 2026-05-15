import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  variant: "success" | "pending";
}

const CheckoutResult = ({ variant }: Props) => {
  const location = useLocation();

  useEffect(() => {
    document.title =
      variant === "success"
        ? "Pagamento confirmado — Meu Consultório"
        : "Pagamento em análise — Meu Consultório";
  }, [variant]);

  const isSuccess = variant === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>
        <h1 className="text-2xl font-black mb-2">
          {isSuccess ? "Pagamento recebido!" : "Pagamento em análise"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isSuccess
            ? "Sua assinatura foi confirmada. Em alguns instantes você receberá no e-mail informado os dados de acesso à sua conta."
            : "Estamos aguardando a confirmação do Mercado Pago. Assim que aprovado, enviaremos os dados de acesso por e-mail."}
        </p>
        <Link
          to="/auth"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
        >
          Ir para o login
        </Link>
        <p className="text-xs text-muted-foreground mt-4">
          Não recebeu o e-mail em alguns minutos? Verifique a caixa de spam.
        </p>
        <p className="text-xs text-muted-foreground mt-1">{location.search}</p>
      </div>
    </div>
  );
};

export default CheckoutResult;