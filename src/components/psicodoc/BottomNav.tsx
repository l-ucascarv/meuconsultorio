import React, { useState } from 'react';
import { AppView, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface BottomNavProps {
  view: AppView;
  setView: (view: AppView) => void;
  primaryColor: PrimaryColor;
}

const moreItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: 'history', label: 'Histórico', icon: <Icons.History /> },
  { id: 'anamnesis', label: 'Anamnese', icon: <Icons.ClipboardList /> },
  { id: 'availability', label: 'Agendamento Online', icon: <Icons.Share /> },
  { id: 'financial', label: 'Financeiro', icon: <Icons.Wallet /> },
  { id: 'profile', label: 'Perfil', icon: <Icons.User /> },
];

export const BottomNav: React.FC<BottomNavProps> = ({ view, setView, primaryColor }) => {
  const palette = COLOR_PALETTES[primaryColor];
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { id: 'home' as AppView, label: 'Início', icon: <Icons.Home /> },
    { id: 'patients' as AppView, label: 'Pacientes', icon: <Icons.Users /> },
    { id: 'create' as AppView, label: 'Novo', icon: <Icons.PlusCircle />, isMain: true },
    { id: 'agenda' as AppView, label: 'Agenda', icon: <Icons.Calendar /> },
  ];

  const isMoreActive = moreItems.some(i => i.id === view);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 right-2 left-2 pb-safe">
            <div 
              className="bg-card border border-border rounded-2xl shadow-elevation-lg p-2 animate-slide-up"
              onClick={e => e.stopPropagation()}
            >
              {moreItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setShowMore(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                  style={view === item.id ? { background: `${palette.hex}20`, color: palette.hex } : {}}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {mainItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setShowMore(false); }}
              className={`bottom-nav-item flex-1 py-2 ${
                item.isMain ? '' : view === item.id ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'
              }`}
              style={view === item.id && !item.isMain ? { color: palette.hex } : {}}
            >
              {item.isMain ? (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg -mt-4"
                  style={{ background: palette.hex }}
                >
                  {item.icon}
                </div>
              ) : (
                <>
                  {item.icon}
                  <span className="text-[10px] font-bold">{item.label}</span>
                </>
              )}
            </button>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`bottom-nav-item flex-1 py-2 ${
              isMoreActive || showMore ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'
            }`}
            style={isMoreActive || showMore ? { color: palette.hex } : {}}
          >
            <Icons.MoreHorizontal />
            <span className="text-[10px] font-bold">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
