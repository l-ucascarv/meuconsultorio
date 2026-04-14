import React, { useState, useEffect } from 'react';
import { PsychologistInfo, PrimaryColor, SubscriptionPlan } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileViewProps {
  psychoInfo: PsychologistInfo;
  setPsychoInfo: React.Dispatch<React.SetStateAction<PsychologistInfo>>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  psychoInfo,
  setPsychoInfo,
}) => {
  const palette = COLOR_PALETTES[psychoInfo.primaryColor];
  const colors: PrimaryColor[] = ['indigo', 'emerald', 'rose', 'amber', 'slate'];
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [slug, setSlug] = useState(psychoInfo.slug || '');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setSlug(profile?.slug || '');
  }, [profile]);

  // Check slug availability
  const checkSlugAvailability = async (newSlug: string) => {
    if (!newSlug || newSlug.length < 3) {
      setIsSlugAvailable(null);
      return;
    }

    const { data, error } = await supabase
      .rpc('get_profile_by_slug', { p_slug: newSlug });

    if (error) {
      setIsSlugAvailable(null);
      return;
    }

    // Available if not found or if it's the current user's slug
    const isAvailable = !data || data.length === 0 || data[0].user_id === user?.id;
    setIsSlugAvailable(isAvailable);
  };

  const handleSlugChange = (value: string) => {
    const formatted = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setSlug(formatted);
    checkSlugAvailability(formatted);
  };

  const handleSaveSlug = async () => {
    if (!user || !isSlugAvailable) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ slug })
        .eq('user_id', user.id);

      if (error) throw error;

      setPsychoInfo(prev => ({ ...prev, slug }));
      toast({
        title: 'URL salva!',
        description: `Sua URL personalizada é: ${window.location.origin}/${slug} | Agendamento: ${window.location.origin}/${slug}/agendamento`,
      });
    } catch (error) {
      console.error('Error saving slug:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a URL.',
        variant: 'destructive',
      });
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      setPsychoInfo(prev => ({ ...prev })); // triggers save via handleSetPsychoInfo
      toast({
        title: 'Perfil salvo!',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 page-enter">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black">Perfil</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure suas informações profissionais
          </p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-5 py-2.5 text-white rounded-xl font-bold text-sm disabled:opacity-50"
          style={{ background: palette.hex }}
        >
          {isSaving ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </header>

      {/* Profile Form */}
      <div className="space-y-6">
        {/* Personal Info */}
        <div className="card-elevated p-6 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
            Dados Profissionais
          </h3>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Nome Completo
            </label>
            <input
              type="text"
              value={psychoInfo.name}
              onChange={(e) => setPsychoInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Seu nome profissional"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                CRP
              </label>
              <input
                type="text"
                value={psychoInfo.crp}
                onChange={(e) => setPsychoInfo(prev => ({ ...prev, crp: e.target.value }))}
                placeholder="00/00000"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                Especialidade
              </label>
              <input
                type="text"
                value={psychoInfo.specialty || ''}
                onChange={(e) => setPsychoInfo(prev => ({ ...prev, specialty: e.target.value }))}
                placeholder="Ex: Psicólogo Clínico"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Custom URL */}
        <div className="card-elevated p-6 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
            URL Personalizada
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie uma URL exclusiva para acessar sua conta diretamente.
          </p>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Seu Endereço
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border border-border rounded-xl overflow-hidden bg-background">
                <span className="px-3 text-sm text-muted-foreground bg-muted border-r border-border">
                  {window.location.origin}/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="seu-nome"
                  className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-sm"
                />
              </div>
              <button
                onClick={handleSaveSlug}
                disabled={!isSlugAvailable || slug.length < 3}
                className="px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: palette.hex, 
                  color: 'white',
                }}
              >
                Salvar
              </button>
            </div>
            {slug.length >= 3 && (
              <p className={`text-xs ml-1 ${isSlugAvailable ? 'text-emerald-500' : 'text-destructive'}`}>
                {isSlugAvailable 
                  ? '✓ URL disponível' 
                  : '✗ URL já está em uso'}
              </p>
            )}
          </div>
        </div>

        {/* Subscription */}
        <div className="card-elevated p-6 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
            Plano
          </h3>

          {psychoInfo.plan === 'mensal' ? (
            <div className="p-6 rounded-2xl bg-muted border-2 border-border relative overflow-hidden">
              <p className="text-2xl font-black">R$ 59,90<span className="text-xs font-bold opacity-40">/mês</span></p>
              <button 
                onClick={() => setPsychoInfo(prev => ({ ...prev, plan: 'anual' }))}
                className="mt-4 text-[9px] font-black uppercase tracking-widest block"
                style={{ color: palette.hex }}
              >
                Trocar para Anual (Economize)
              </button>
            </div>
          ) : (
            <div 
              className="p-6 rounded-2xl border-2 relative overflow-hidden text-white"
              style={{ background: palette.hex }}
            >
              <p className="text-2xl font-black">Anual Premium</p>
              <p className="text-sm opacity-80 mt-1">R$ 479,88/ano (R$ 39,99/mês)</p>
              <button 
                onClick={() => setPsychoInfo(prev => ({ ...prev, plan: 'mensal' }))}
                className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/80 block"
              >
                Trocar para Mensal
              </button>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="card-elevated p-6 space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
            Aparência
          </h3>

          {/* Theme */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Tema
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setPsychoInfo(prev => ({ ...prev, theme: 'light' }))}
                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
                  psychoInfo.theme === 'light' 
                    ? 'border-primary' 
                    : 'border-border text-muted-foreground'
                }`}
                style={psychoInfo.theme === 'light' ? { borderColor: palette.hex, color: palette.hex } : {}}
              >
                <Icons.Sun /> Light
              </button>
              <button
                onClick={() => setPsychoInfo(prev => ({ ...prev, theme: 'dark' }))}
                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
                  psychoInfo.theme === 'dark' 
                    ? 'border-primary' 
                    : 'border-border text-muted-foreground'
                }`}
                style={psychoInfo.theme === 'dark' ? { borderColor: palette.hex, color: palette.hex } : {}}
              >
                <Icons.Moon /> Dark
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Cor Principal
            </label>
            <div className="flex gap-3 justify-center">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setPsychoInfo(prev => ({ ...prev, primaryColor: color }))}
                  className={`w-12 h-12 rounded-full transition-all active-touch ${
                    psychoInfo.primaryColor === color 
                      ? 'ring-4 ring-offset-2 ring-offset-background' 
                      : ''
                  }`}
                  style={{ 
                    background: COLOR_PALETTES[color].hex,
                    ...(psychoInfo.primaryColor === color && { boxShadow: `0 0 0 4px ${COLOR_PALETTES[color].hex}40` }),
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <button
            onClick={async () => {
              const { signOut } = await import('@/hooks/useAuth').then(() => ({ signOut: async () => { await supabase.auth.signOut(); } }));
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all border-2 border-border text-foreground hover:bg-muted flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair da Conta
          </button>

          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.')) {
                toast({
                  title: "Solicitação enviada",
                  description: "Para excluir sua conta, entre em contato com o suporte da plataforma.",
                });
              }
            }}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all border-2 border-destructive text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Excluir Conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
