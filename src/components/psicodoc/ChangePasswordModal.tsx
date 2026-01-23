import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número');

interface ChangePasswordModalProps {
  isOpen: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { updatePassword } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { password?: string; confirm?: string } = {};
    
    try {
      passwordSchema.parse(newPassword);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirm = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        toast({
          title: 'Erro ao alterar senha',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Senha alterada!',
          description: 'Sua nova senha foi salva com sucesso.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Alterar Senha Temporária</DialogTitle>
          <DialogDescription>
            Por segurança, você precisa criar uma nova senha antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.password ? 'border-destructive' : 'border-border'
              }`}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-destructive text-xs ml-1">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.confirm ? 'border-destructive' : 'border-border'
              }`}
              disabled={isLoading}
            />
            {errors.confirm && (
              <p className="text-destructive text-xs ml-1">{errors.confirm}</p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-semibold mb-1">A senha deve conter:</p>
            <ul className="space-y-1">
              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                • Pelo menos 8 caracteres
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                • Uma letra maiúscula
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                • Uma letra minúscula
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                • Um número
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Salvando...
              </span>
            ) : (
              'Alterar Senha'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
