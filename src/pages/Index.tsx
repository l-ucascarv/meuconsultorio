import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-black text-foreground">Meu Consultório</span>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all"
        >
          Entrar
        </button>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          DOCUMENTOS COM O PADRÃO DO CONSELHO FEDERAL DE PSICOLOGIA
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
          Documentos Psicológicos<br />
          <span className="text-primary">Gerados por IA</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Crie relatórios, laudos, pareceres e atestados psicológicos em conformidade com as normas do CFP. 
          Economize horas de trabalho com geração inteligente.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/25"
          >
            Começar Gratuitamente
          </button>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 border-2 border-border text-foreground font-bold text-lg rounded-2xl hover:bg-muted transition-all"
          >
            Ver Planos
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Geração Rápida</h3>
            <p className="text-muted-foreground">
              Crie documentos completos em segundos usando inteligência artificial avançada.
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">100% Conforme</h3>
            <p className="text-muted-foreground">
              Todos os documentos seguem rigorosamente a Resolução CFP 06/2019.
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Dados Seguros</h3>
            <p className="text-muted-foreground">
              Seus dados e de seus pacientes são criptografados e protegidos com segurança de nível bancário.
            </p>
          </div>
        </div>
      </section>

      {/* Screenshots Showcase */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-4">
          Conheça o Sistema
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Veja como o nosso sistema simplifica sua rotina com ferramentas intuitivas e poderosas
        </p>

        <div className="space-y-16">
          {/* Document Creation */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Criação de Documentos
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Gere relatórios com IA em segundos
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Preencha os dados do paciente e a demanda, e nossa IA gera documentos completos 
                em conformidade com a Resolução CFP 06/2019. Relatórios, laudos, pareceres, 
                atestados e declarações — tudo pronto para uso.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src="/images/screenshot-document.png" 
                  alt="Tela de criação de documentos psicológicos com IA no Meu Consultório" 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Financial Management */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src="/images/screenshot-financial.png" 
                  alt="Dashboard de gestão financeira para psicólogos no Meu Consultório" 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gestão Financeira
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Controle suas finanças facilmente
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Acompanhe receitas, despesas e o saldo do seu consultório em tempo real. 
                Registre transações por paciente, categorize gastos e tenha uma visão 
                clara da saúde financeira da sua prática.
              </p>
            </div>
          </div>

          {/* Patient Management */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gestão de Pacientes
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Organize seus pacientes
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Cadastre pacientes, armazene prontuários, acompanhe históricos de atendimento 
                e tenha tudo organizado em um só lugar. Busca rápida e filtros inteligentes 
                para encontrar qualquer informação.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src="/images/screenshot-patients.png" 
                  alt="Tela de gestão de pacientes no PsicoDoc AI" 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-12">
          Tipos de Documentos
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { name: 'Relatório', desc: 'Análise detalhada' },
            { name: 'Laudo', desc: 'Avaliação técnica' },
            { name: 'Parecer', desc: 'Opinião especializada' },
            { name: 'Atestado', desc: 'Certificação' },
            { name: 'Declaração', desc: 'Afirmação formal' },
          ].map((doc) => (
            <div key={doc.name} className="bg-muted rounded-2xl p-6 text-center hover:bg-primary/10 transition-all cursor-default">
              <p className="font-bold text-foreground">{doc.name}</p>
              <p className="text-sm text-muted-foreground">{doc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-4">
          Planos
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Escolha o plano ideal para sua prática
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Mensal */}
          <div className="bg-card border-2 border-border rounded-3xl p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Mensal</p>
            <p className="text-4xl font-black text-foreground mb-1">
              R$ 59,90<span className="text-lg font-medium text-muted-foreground">/mês</span>
            </p>
            <p className="text-muted-foreground mb-6">Ideal para começar</p>
            <ul className="space-y-3 mb-8">
              {['Documentos ilimitados', 'Gestão de pacientes', 'Agenda integrada', 'Armazenamento na nuvem', 'Suporte por e-mail'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-foreground">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => navigate('/auth')}
              className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Assinar Mensal
            </button>
          </div>

          {/* Anual */}
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              Economize 33%
            </div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2">Anual</p>
            <p className="text-4xl font-black mb-1">
              R$ 39,99<span className="text-lg font-medium opacity-80">/mês</span>
            </p>
            <p className="opacity-80 mb-6">R$ 479,88 cobrados anualmente</p>
            <ul className="space-y-3 mb-8">
              {['Tudo do plano mensal', 'Prioridade no suporte', 'Novos recursos antecipados', 'Sem reajuste por 12 meses', 'Acesso a templates exclusivos'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => navigate('/auth')}
              className="w-full py-3 bg-white text-primary font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Assinar Anual
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-12 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Comece a usar hoje
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Faça seu teste gratuito de 7 dias e aproveite o nosso sistema. 
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-white text-primary font-bold text-lg rounded-2xl hover:opacity-90 transition-all"
          >
            Criar Conta Grátis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-foreground">Meu Consultório</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Meu Consultório. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
