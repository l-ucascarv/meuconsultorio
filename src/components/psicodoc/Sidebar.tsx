import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppView, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  view: AppView;
  setView: (view: AppView) => void;
  primaryColor: PrimaryColor;
  onSignOut?: () => void;
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
  { id: 'availability', label: 'Agendamento Online', icon: <Icons.Share /> },
  { id: 'financial', label: 'Financeiro', icon: <Icons.Wallet /> },
  { id: 'profile', label: 'Perfil', icon: <Icons.User /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, primaryColor, onSignOut }) => {
  const palette = COLOR_PALETTES[primaryColor];
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      const { data } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

      setIsAdmin(!!data);
    };

    checkAdmin();
  }, [user]);

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
      
      <div className="p-6 border-t border-sidebar-border space-y-3">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors w-full font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Painel Admin
          </button>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors w-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        )}
        <p className="text-xs text-sidebar-foreground/50 font-medium">
          PsicoDoc AI © 2025
        </p>
      </div>
    </nav>
  );
};

export default Sidebar;
