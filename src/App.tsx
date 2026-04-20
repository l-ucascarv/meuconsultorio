import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProfileOnboarding } from "@/components/psicodoc";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import PsicoDocApp from "./pages/PsicoDocApp";
import AdminPanel from "./pages/AdminPanel";
import UserLogin from "./pages/UserLogin";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const NotFoundOrRedirect = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    const path = location.pathname || '';

    // Se tentar acessar rotas do app sem login, manda para login.
    if (path.startsWith('/app') || path.startsWith('/admin')) {
      return <Navigate to="/auth" replace />;
    }

    // Qualquer outra rota inválida sem login volta para a página inicial.
    return <Navigate to="/" replace />;
  }

  return <NotFound />;
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile, mustChangePassword, updatePassword, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-bold">Carregando seu perfil...</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Se isso não concluir em alguns segundos, pode haver um problema ao criar/buscar seu cadastro no banco.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2">
            <button
              onClick={() => refreshProfile()}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => signOut()}
              className="w-full py-3 px-4 border-2 border-border rounded-xl font-bold hover:bg-muted transition-all"
            >
              Sair e voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gate: só libera o app após consentimento + CRP + (se necessário) definição de senha.
  const consentKey = `data_consent_accepted_${user.id}`;
  const consentAccepted = localStorage.getItem(consentKey) === 'true';
  const needsGate = mustChangePassword || !profile.crp || !consentAccepted;

  if (needsGate) {
    return (
      <ProfileOnboarding
        primaryColor={(profile.primary_color as any) || 'indigo'}
        requirePassword={mustChangePassword}
        showPasswordFields
        skipConsent={consentAccepted}
        initialCrp={profile.crp || ''}
        initialSpecialty={profile.specialty || ''}
        onComplete={async ({ crp, specialty, password }) => {
          try {
            // Consentimento foi aceito ao concluir o fluxo.
            localStorage.setItem(consentKey, 'true');

            if (password) {
              const { error: pwError } = await updatePassword(password);
              if (pwError) {
                toast({
                  title: 'Erro ao salvar senha',
                  description: pwError.message,
                  variant: 'destructive',
                });
                return;
              }
            }

            const { error } = await supabase
              .from('profiles')
              .update({
                crp,
                specialty: specialty || null,
              })
              .eq('user_id', user.id);

            if (error) {
              toast({
                title: 'Erro ao salvar cadastro',
                description: error.message,
                variant: 'destructive',
              });
              return;
            }

            // Marca como concluído no dispositivo (usado para tour e para pular telas repetidas)
            localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
            await refreshProfile();
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            toast({
              title: 'Erro ao concluir cadastro',
              description: message,
              variant: 'destructive',
            });
          }
        }}
      />
    );
  }

  // Check subscription status
  if (!['active', 'trial'].includes(profile.subscription_status)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card border border-border rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Assinatura Inativa</h2>
          <p className="text-muted-foreground mb-6">
            Sua assinatura está {profile.subscription_status === 'pending' ? 'pendente' : 'inativa'}. 
            Por favor, ative sua assinatura para continuar usando o Meu Consultório.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Ver Planos
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route 
        path="/app" 
        element={
          <ProtectedRoute>
            <PsicoDocApp />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      {/* Public booking route */}
      <Route path="/:slug/agendamento" element={<PublicBooking />} />
      {/* User personalized login route */}
      <Route path="/:slug" element={<UserLogin />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFoundOrRedirect />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
