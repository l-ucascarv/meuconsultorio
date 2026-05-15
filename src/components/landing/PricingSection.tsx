import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PRICE_MONTHLY_AMOUNT, PRICE_YEARLY_AMOUNT } from '@/lib/stripe';

const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const monthlyEquivalent = PRICE_YEARLY_AMOUNT / 12;

  const features = [
    'Pacientes ilimitados',
    'Agenda inteligente com lembretes',
    'Prontuário digital seguro',
    'Geração de documentos CFP',
    'Controle financeiro completo',
    'Agendamento online',
    'Suporte prioritário',
  ];

  return (
    <section id="pricing" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-4">
        Plano único, tudo incluso
      </h2>
      <p className="text-center text-muted-foreground mb-12">
        Sem pegadinhas. Cancele quando quiser.
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="bg-card border-2 border-border rounded-3xl p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Mensal</p>
          <p className="text-4xl font-black text-foreground mb-1">
            R$ {PRICE_MONTHLY_AMOUNT.toFixed(2).replace('.', ',')}
            <span className="text-lg font-medium text-muted-foreground">/mês</span>
          </p>
          <p className="text-muted-foreground mb-6">Cobrado mensalmente</p>
          <ul className="space-y-3 mb-8">
            {features.map((item) => (
              <li key={item} className="flex items-center gap-2 text-foreground">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/checkout?frequency=monthly')}
            className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Assinar mensal
          </button>
        </div>

        <div className="bg-primary text-primary-foreground rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white/20 text-xs font-bold px-3 py-1 rounded-full">
            Economize 15%
          </div>
          <p className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2">Anual</p>
          <p className="text-4xl font-black mb-1">
            R$ {monthlyEquivalent.toFixed(2).replace('.', ',')}
            <span className="text-lg font-medium opacity-80">/mês</span>
          </p>
          <p className="opacity-80 mb-6">
            R$ {PRICE_YEARLY_AMOUNT.toFixed(2).replace('.', ',')} cobrados uma vez por ano
          </p>
          <ul className="space-y-3 mb-8">
            {features.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="w-5 h-5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/checkout?frequency=yearly')}
            className="w-full py-3 bg-white text-primary font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Assinar anual
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
