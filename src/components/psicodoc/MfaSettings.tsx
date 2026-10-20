import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, logSecurityEvent } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { friendlyError } from '@/lib/friendlyError';

export const MfaSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactorId(data?.totp.find((f) => f.status === 'verified')?.id ?? null);
  };
  useEffect(() => { void load(); }, []);

  const start = async () => {
    setBusy(true);
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `app-${Date.now()}` });
    setBusy(false);
    if (error || !data) return toast({ title: 'Erro', description: friendlyError(error), variant: 'destructive' });
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirm = async () => {
    if (!enroll) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() });
    setBusy(false);
    if (error) return toast({ title: 'Código inválido', description: friendlyError(error), variant: 'destructive' });
    if (user) void logSecurityEvent(user.id, 'mfa_enabled');
    setEnroll(null); setCode('');
    toast({ title: 'Verificação em duas etapas ativada' });
    void load();
  };

  const disable = async () => {
    if (!factorId || !window.confirm('Desativar a verificação em duas etapas?')) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) return toast({ title: 'Erro', description: friendlyError(error), variant: 'destructive' });
    if (user) void logSecurityEvent(user.id, 'mfa_disabled');
    toast({ title: 'Verificação em duas etapas desativada' });
    void load();
  };

  return (
    <div className="mt-6 pt-4 border-t border-border space-y-3">
      <p className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Verificação em duas etapas</p>
      {factorId ? (
        <button onClick={disable} disabled={busy} className="w-full py-3 rounded-xl font-bold text-sm border-2 border-border hover:bg-muted">
          Ativada — desativar
        </button>
      ) : enroll ? (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Escaneie o QR code com um app autenticador (Google Authenticator, Authy) e digite o código de 6 dígitos.</p>
          <img src={enroll.qr} alt="QR code para verificação em duas etapas" className="w-44 h-44 mx-auto bg-card rounded-lg" />
          <p className="text-xs text-center text-muted-foreground break-all">Chave: {enroll.secret}</p>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center tracking-widest" />
          <button onClick={confirm} disabled={busy || code.length !== 6} className="w-full py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50">
            Confirmar e ativar
          </button>
        </div>
      ) : (
        <button onClick={start} disabled={busy} className="w-full py-3 rounded-xl font-bold text-sm border-2 border-border hover:bg-muted">
          Ativar verificação em duas etapas
        </button>
      )}
    </div>
  );
};

export default MfaSettings;
