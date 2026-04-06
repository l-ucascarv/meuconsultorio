import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('E-mail inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  slug: string | null;
  crp: string | null;
  specialty: string | null;
}

const UserLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user profile by slug
  useEffect(() => {
    const loadProfile = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_profile_by_slug', { p_slug: slug });

        if (error) throw error;

        if (data && data.length > 0) {
          setProfileData(data[0] as UserProfile);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setNotFound(true);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [slug]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Erro no login',
            description: 'E-mail ou senha incorretos.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro no login',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            O perfil "{slug}" não existe ou foi removido.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground mb-4 text-2xl font-bold">
            {profileData?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h1 className="text-2xl font-black text-foreground">
            {profileData?.name || 'Profissional'}
          </h1>
          {profileData?.specialty && (
            <p className="text-muted-foreground mt-1">{profileData.specialty}</p>
          )}
          {profileData?.crp && (
            <p className="text-sm text-muted-foreground">CRP: {profileData.crp}</p>
          )}
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-center mb-6">
            Acesse sua conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  errors.email ? 'border-destructive' : 'border-border'
                }`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-destructive text-xs ml-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  errors.password ? 'border-destructive' : 'border-border'
                }`}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-destructive text-xs ml-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Aguarde...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/auth"
              className="text-primary font-medium hover:underline text-sm"
            >
              Acessar página de login padrão
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Meu Consultório
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
