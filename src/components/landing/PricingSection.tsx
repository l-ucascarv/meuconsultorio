import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-4">
        Planos
      </h2>
      <p className="text-center text-muted-foreground mb-12">
        Escolha o plano ideal para sua prática
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Plano Inicial */}
        <div className="bg-card border-2 border-border rounded-3xl p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Inicial</p>
          <p className="text-4xl font-black text-foreground mb-1">
            R$ 39,90<span className="text-lg font-medium text-muted-foreground">/mês</span>
          </p>
          <p className="text-muted-foreground mb-6">Ideal para começar sua prática</p>
          <ul className="space-y-3 mb-8">
            {[
              'Até 10 pacientes ativos',
              'Relatórios com IA',
              'Agenda básica',
              'Agendamento online',
              'Armazenamento na nuvem',
              'Suporte por e-mail',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-foreground">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Começar Grátis
          </button>
        </div>

        {/* Plano Profissional */}
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white/20 text-xs font-bold px-3 py-1 rounded-full">
            Mais Popular
          </div>
          <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2">Profissional</p>
          <p className="text-4xl font-black mb-1">
            R$ 69,90<span className="text-lg font-medium opacity-80">/mês</span>
          </p>
          <p className="opacity-80 mb-6">Para clínicas em crescimento</p>
          <ul className="space-y-3 mb-8">
            {[
              'Pacientes ilimitados',
              'IA avançada para documentos',
              'Agenda inteligente com lembretes',
              'Financeiro avançado',
              'Pastas criptografadas',
              'Prioridade no suporte',
              'Novos recursos antecipados',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="w-5 h-5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-3 bg-white text-primary font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Assinar Agora
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
