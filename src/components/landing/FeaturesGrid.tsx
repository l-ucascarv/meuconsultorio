import React from 'react';
import { Users, Sparkles, CalendarDays, DollarSign } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Gestão de Pacientes',
    description: 'Prontuários organizados com histórico completo e pastas para documentos anexos.',
  },
  {
    icon: Sparkles,
    title: 'Relatórios com IA',
    description: 'Geração automática de relatórios, laudos e declarações 100% conforme a Resolução CFP 06/2019.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda Inteligente',
    description: 'Controle de horários, agendamento online e lembretes para evitar faltas.',
  },
  {
    icon: DollarSign,
    title: 'Financeiro Simplificado',
    description: 'Fluxo de caixa, controle de receitas e despesas e visão clara da saúde financeira.',
  },
];

const FeaturesGrid: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-black text-center text-foreground mb-4">
        Tudo que você precisa em um só lugar
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Uma plataforma completa para psicólogos que querem focar no que importa: seus pacientes.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat) => (
          <div
            key={feat.title}
            className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <feat.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{feat.title}</h3>
            <p className="text-muted-foreground">{feat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesGrid;
