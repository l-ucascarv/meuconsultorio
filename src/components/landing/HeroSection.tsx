import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-20 md:py-32 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
        <Shield className="w-4 h-4" />
        EM CONFORMIDADE COM AS NORMAS DO CONSELHO FEDERAL DE PSICOLOGIA
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
        Controle Total da Sua Clínica,<br />
        <span className="text-primary">Relatórios com IA</span> e Mente Tranquila
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
        Crie relatórios, laudos, pareceres e atestados psicológicos conforme as normas do CFP, 
        e ainda gerencie sua agenda e financeiro em um só lugar.
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
  );
};

export default HeroSection;
