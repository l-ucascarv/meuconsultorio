import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  useEffect(() => { document.title = "Pagamento concluído"; }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-3xl shadow-xl p-8 max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-black mb-2">Pagamento confirmado!</h1>
        <p className="text-muted-foreground mb-6">
          {sessionId ? "Verifique seu e-mail: enviamos seus dados de acesso." : "Sessão processada. Confira seu e-mail."}
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={() => navigate("/auth")} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all">Acessar minha conta</button>
          <button onClick={() => navigate("/")} className="px-6 py-3 border-2 border-border rounded-xl font-bold hover:bg-muted transition-all">Voltar ao início</button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutReturn;