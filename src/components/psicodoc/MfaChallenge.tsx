import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const MfaChallenge = () => {
  const { verifyMfa, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await verifyMfa(code);
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4 text-center">
        <h2 className="text-lg font-bold">Verificação em duas etapas</h2>
        <p className="text-sm text-muted-foreground">Digite o código de 6 dígitos do seu app autenticador.</p>
        <input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000"
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-xl tracking-widest" />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <button disabled={busy || code.length !== 6} className="w-full py-3 rounded-xl font-bold bg-primary text-primary-foreground disabled:opacity-50">Verificar</button>
        <button type="button" onClick={() => signOut()} className="w-full py-2 text-sm text-muted-foreground">Sair</button>
      </form>
    </div>
  );
};

export default MfaChallenge;
