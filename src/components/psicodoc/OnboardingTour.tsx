import React, { useState, useEffect } from 'react';
import { PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao Meu Consultório! 🎉',
    description: 'Este é o seu sistema completo para gerenciar pacientes, documentos, agenda e finanças. Vamos fazer um tour rápido pelas principais funcionalidades!',
    icon: <Icons.Home />,
  },
  {
    title: 'Pacientes',
    description: 'Cadastre e gerencie seus pacientes. Cada paciente tem sua pasta individual com todos os documentos, anamneses e histórico de sessões.',
    icon: <Icons.Users />,
    action: 'patients',
  },
  {
    title: 'Documentos e Relatórios',
    description: 'Crie relatórios, laudos, declarações e atestados com auxílio de IA. Os documentos são automaticamente salvos na pasta do paciente.',
    icon: <Icons.FileText />,
    action: 'create',
  },
  {
    title: 'Ficha de Anamnese',
    description: 'Preencha fichas de anamnese psicológica completas para cada paciente. As fichas ficam disponíveis na pasta do paciente.',
    icon: <Icons.ClipboardList />,
    action: 'anamnesis',
  },
  {
    title: 'Agenda',
    description: 'Gerencie seus agendamentos. Visualize, crie e acompanhe suas consultas de forma organizada por dia, semana ou mês.',
    icon: <Icons.Calendar />,
    action: 'agenda',
  },
  {
    title: 'Agendamento Online',
    description: 'Configure seus horários de disponibilidade e compartilhe um link personalizado para que seus pacientes agendem consultas online.',
    icon: <Icons.Share />,
    action: 'availability',
  },
  {
    title: 'Financeiro',
    description: 'Controle suas receitas e despesas, visualize DRE mensal, gráficos de acompanhamento e projeções de fluxo de caixa.',
    icon: <Icons.Wallet />,
    action: 'financial',
  },
  {
    title: 'Perfil e Personalização',
    description: 'Configure seu nome, CRP, especialidade, URL personalizada, tema (claro/escuro) e cor do sistema. Tudo do seu jeito!',
    icon: <Icons.User />,
    action: 'profile',
  },
  {
    title: 'Tudo pronto! ✅',
    description: 'Você está pronto para começar. Se precisar rever este tour, acesse seu Perfil. Bom trabalho!',
    icon: <Icons.Heart />,
  },
];

interface OnboardingTourProps {
  primaryColor: PrimaryColor;
  onComplete: () => void;
  onNavigate?: (view: string) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ primaryColor, onComplete, onNavigate }) => {
  const palette = COLOR_PALETTES[primaryColor];
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setIsAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setIsAnimating(false);
    }, 200);
  };

  const goBack = () => {
    if (isFirst) return;
    setIsAnimating(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setIsAnimating(false);
    }, 200);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Tour Card */}
      <div
        className={`relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%`, background: palette.hex }}
          />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {step + 1} de {TOUR_STEPS.length}
            </span>
            {!isLast && (
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular tour
              </button>
            )}
          </div>

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
            style={{ background: `${palette.hex}15` }}
          >
            <span className="scale-150" style={{ color: palette.hex }}>
              {current.icon}
            </span>
          </div>

          {/* Text */}
          <h3 className="text-xl font-black text-center mb-3">{current.title}</h3>
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
            {current.description}
          </p>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 24 : 6,
                  background: i === step ? palette.hex : `${palette.hex}30`,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {!isFirst && (
              <button
                onClick={goBack}
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              onClick={goNext}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: palette.hex }}
            >
              {isLast ? 'Começar!' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
