import React from 'react';
import { AppView, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface BottomNavProps {
  view: AppView;
  setView: (view: AppView) => void;
  primaryColor: PrimaryColor;
}

export const BottomNav: React.FC<BottomNavProps> = ({ view, setView, primaryColor }) => {
  const palette = COLOR_PALETTES[primaryColor];

  const navItems = [
    { id: 'home' as AppView, label: 'Início', icon: <Icons.Home /> },
    { id: 'patients' as AppView, label: 'Pacientes', icon: <Icons.Users /> },
    { id: 'create' as AppView, label: 'Novo', icon: <Icons.PlusCircle />, isMain: true },
    { id: 'financial' as AppView, label: 'Financeiro', icon: <Icons.Wallet /> },
    { id: 'profile' as AppView, label: 'Perfil', icon: <Icons.User /> },
  ];

  return (
    <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
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
      </div>
    </nav>
  );
};

export default BottomNav;
