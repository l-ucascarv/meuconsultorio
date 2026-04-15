import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().email('E-mail inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

const formatCRP = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
};

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [crp, setCrp] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; crp?: string; consent?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; crp?: string; consent?: string } = {};
    
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
    
    if (!isLogin) {
      try {
        nameSchema.parse(name);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.name = e.errors[0].message;
        }
      }

      if (!crp.trim()) {
        newErrors.crp = 'O CRP é obrigatório para profissionais de psicologia.';
      } else if (crp.trim().length < 4) {
        newErrors.crp = 'Informe um CRP válido (ex: 06/123456).';
      }

      if (!consentChecked) {
        newErrors.consent = 'Você precisa autorizar o uso dos dados para criar a conta.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
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
      } else {
        const { error, userId } = await signUp(email, password, name, crp.trim(), specialty.trim());
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Erro no cadastro',
              description: 'Este e-mail já está cadastrado.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro no cadastro',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          if (userId) {
            localStorage.setItem(`data_consent_accepted_${userId}`, 'true');
            localStorage.setItem(`onboarding_completed_${userId}`, 'true');
          }

          toast({
            title: 'Verifique seu e-mail!',
            description: 'Enviamos um link de confirmação para ' + email + '. Confirme seu e-mail para ativar sua conta.',
            duration: 10000,
          });
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setName('');
          setCrp('');
          setSpecialty('');
          setConsentChecked(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-foreground">Meu Consultório</h1>
          <p className="text-muted-foreground mt-2">
            Documentos psicológicos em conformidade com o CFP
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-center mb-6">
            {isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome profissional"
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    errors.name ? 'border-destructive' : 'border-border'
                  }`}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-destructive text-xs ml-1">{errors.name}</p>
                )}
              </div>
            )}

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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-destructive text-xs ml-1">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  CRP (Obrigatório)
                </label>
                <input
                  type="text"
                  value={crp}
                  onChange={(e) => setCrp(formatCRP(e.target.value))}
                  placeholder="Ex: 06/123456"
                  maxLength={9}
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    errors.crp ? 'border-destructive' : 'border-border'
                  }`}
                  disabled={isLoading}
                />
                {errors.crp && (
                  <p className="text-destructive text-xs ml-1">{errors.crp}</p>
                )}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Especialidade (Opcional)
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Psicologia Clínica"
                  className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all border-border"
                  disabled={isLoading}
                />
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground text-sm">Autorização de uso de dados</p>
                  <p>
                    Para criar sua conta, precisamos do seu consentimento para usar seus dados (nome, e-mail, CRP e
                    especialidade) conforme a LGPD.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    Li e concordo com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>,
                    autorizando o uso dos meus dados.
                  </span>
                </label>

                {errors.consent && (
                  <p className="text-destructive text-xs ml-1">{errors.consent}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Aguarde...
                </span>
              ) : isLogin ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });

                if (result.error) {
                  toast({
                    title: 'Erro ao entrar com Google',
                    description: result.error.message,
                    variant: 'destructive',
                  });
                  return;
                }

                if (result.redirected) {
                  return;
                }

                navigate('/app');
              } catch (err) {
                toast({
                  title: 'Erro ao entrar com Google',
                  description: err instanceof Error ? err.message : String(err),
                  variant: 'destructive',
                });
              }
            }}
            disabled={isLoading}
            className="w-full py-3 px-4 border-2 border-border rounded-xl font-bold hover:bg-muted transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-primary font-medium hover:underline"
              disabled={isLoading}
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-primary hover:underline">Termos de Uso</a>
          {' '}e{' '}
          <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
