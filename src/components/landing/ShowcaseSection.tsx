import React from 'react';
import { FileText, DollarSign, Users, CalendarDays, TrendingUp } from 'lucide-react';

const ShowcaseSection: React.FC = () => {
  return (
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
              <FileText className="w-3.5 h-3.5" />
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

        {/* Agenda + Financial Bento */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Agenda Mock */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
              <CalendarDays className="w-3.5 h-3.5" />
              Agenda Semanal
            </div>
            <h3 className="text-xl font-black text-foreground mb-4">
              Visualize sua semana de forma clara
            </h3>
            <div className="space-y-2">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day, i) => (
                <div key={day} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <span className="text-sm font-bold text-foreground w-20">{day}</span>
                  <div className="flex-1 flex gap-2">
                    {Array.from({ length: 2 + (i % 3) }).map((_, j) => (
                      <div
                        key={j}
                        className="h-8 rounded-lg bg-primary/15 flex-1 flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-primary">
                          {`${8 + j * 2}:00`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary Mock */}
          <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Resumo Financeiro
            </div>
            <h3 className="text-xl font-black text-foreground mb-4">
              Acompanhe suas finanças em tempo real
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-accent rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Receitas do mês</p>
                <p className="text-2xl font-black text-primary">R$ 8.450,00</p>
              </div>
              <div className="p-4 bg-accent rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Despesas do mês</p>
                <p className="text-2xl font-black text-destructive">R$ 1.230,00</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Saldo líquido</p>
                <p className="text-2xl font-black text-primary">R$ 7.220,00</p>
              </div>
              {/* Mini chart bars */}
              <div className="flex items-end gap-1 h-16 pt-2">
                {[40, 65, 55, 80, 70, 90, 75, 60, 85, 95, 70, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/20 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Management */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img 
                src="/images/screenshot-patients.png" 
                alt="Tela de gestão de pacientes no Meu Consultório" 
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4">
              <Users className="w-3.5 h-3.5" />
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
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
