import React from 'react';
import { AppView, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface SidebarProps {
  view: AppView;
  setView: (view: AppView) => void;
  primaryColor: PrimaryColor;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Início', icon: <Icons.Home /> },
  { id: 'create', label: 'Novo Documento', icon: <Icons.FileText /> },
  { id: 'history', label: 'Histórico', icon: <Icons.History /> },
  { id: 'patients', label: 'Pacientes', icon: <Icons.Users /> },
  { id: 'agenda', label: 'Agenda', icon: <Icons.Calendar /> },
  { id: 'profile', label: 'Perfil', icon: <Icons.User /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, primaryColor }) => {
  const palette = COLOR_PALETTES[primaryColor];

  return (
    <nav className="no-print hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col fixed h-full z-40">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: palette.hex }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight">PsicoDoc</span>
        </div>
      </div>
      
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`sidebar-item w-full ${
              view === item.id ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }`}
            style={view === item.id ? { background: `${palette.hex}20` } : {}}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="p-6 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 font-medium">
          PsicoDoc AI © 2024
        </p>
      </div>
    </nav>
  );
};

export default Sidebar;
