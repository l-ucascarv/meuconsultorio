import React from 'react';
import { useNavigate } from 'react-router-dom';

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
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
          Começar Grátis
        </button>
      </div>
    </section>
  );
};

export default CTASection;
