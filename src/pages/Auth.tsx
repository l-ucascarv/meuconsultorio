import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().email('E-mail inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
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
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
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
        const { error } = await signUp(email, password, name);
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
          toast({
            title: 'Conta criada!',
            description: 'Seu cadastro foi realizado com sucesso.',
          });
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
          <h1 className="text-3xl font-black text-foreground">PsicoDoc AI</h1>
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
