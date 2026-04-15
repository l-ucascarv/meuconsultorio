import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [isWorking, setIsWorking] = useState(true);

  const code = useMemo(() => searchParams.get("code"), [searchParams]);
  const errorDescription = useMemo(
    () => searchParams.get("error_description") || searchParams.get("error"),
    [searchParams]
  );

  useEffect(() => {
    const run = async () => {
      try {
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (!code) {
          // In some flows the session may already be persisted by the time we land here.
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            navigate("/app", { replace: true });
            return;
          }
          throw new Error("Callback de autenticação inválido (código ausente).")
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        navigate("/app", { replace: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast({
          title: "Falha ao autenticar",
          description: message,
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      } finally {
        setIsWorking(false);
      }
    };

    run();
  }, [code, errorDescription, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">
          {isWorking ? "Concluindo login..." : "Redirecionando..."}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;