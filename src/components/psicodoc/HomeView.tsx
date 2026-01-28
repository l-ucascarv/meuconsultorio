import React from 'react';
import { PrimaryColor, PsychologistInfo } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface HomeViewProps {
  psychoInfo: PsychologistInfo;
  setView: (view: 'create' | 'patients' | 'agenda' | 'history' | 'financial') => void;
  reportsCount: number;
  patientsCount: number;
  appointmentsToday: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  psychoInfo,
  setView,
  reportsCount,
  patientsCount,
  appointmentsToday,
}) => {
  const palette = COLOR_PALETTES[psychoInfo.primaryColor];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 page-enter">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: `linear-gradient(135deg, ${palette.hex} 0%, ${palette.hex}dd 100%)` }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <p className="text-white/80 font-medium mb-1">Bem-vindo(a) de volta,</p>
          <h1 className="text-2xl md:text-3xl font-black">
            {psychoInfo.name || 'Psicólogo(a)'}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            {psychoInfo.crp ? `CRP: ${psychoInfo.crp}` : 'Configure seu perfil para começar'}
          </p>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-black px-1">Ações Rápidas</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setView('create')}
            className="card-elevated p-6 flex flex-col items-center gap-3 active-touch hover:shadow-elevation-lg transition-shadow"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <div style={{ color: palette.hex }}>
                <Icons.FileText />
              </div>
            </div>
            <span className="font-bold text-sm">Novo Documento</span>
          </button>
          
          <button
            onClick={() => setView('patients')}
            className="card-elevated p-6 flex flex-col items-center gap-3 active-touch hover:shadow-elevation-lg transition-shadow"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <div style={{ color: palette.hex }}>
                <Icons.Users />
              </div>
            </div>
            <span className="font-bold text-sm">Ver Pacientes</span>
          </button>
          
          <button
            onClick={() => setView('agenda')}
            className="card-elevated p-6 flex flex-col items-center gap-3 active-touch hover:shadow-elevation-lg transition-shadow"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <div style={{ color: palette.hex }}>
                <Icons.Calendar />
              </div>
            </div>
            <span className="font-bold text-sm">Agenda</span>
          </button>
          
          <button
            onClick={() => setView('financial')}
            className="card-elevated p-6 flex flex-col items-center gap-3 active-touch hover:shadow-elevation-lg transition-shadow"
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <div style={{ color: palette.hex }}>
                <Icons.Wallet />
              </div>
            </div>
            <span className="font-bold text-sm">Financeiro</span>
          </button>
        </div>
      </div>

      {/* CFP Info Card */}
      <div className="card-elevated p-6">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${palette.hex}15` }}
          >
            <Icons.ClipboardList />
          </div>
          <div>
            <h3 className="font-black text-sm mb-1">Conformidade CFP</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Todos os documentos gerados seguem a Resolução CFP Nº 06/2019 e normas ABNT 
              para garantir a conformidade profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
