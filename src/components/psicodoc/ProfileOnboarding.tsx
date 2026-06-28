import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { COLOR_PALETTES } from "../../constants/psicodoc";
import { Icons } from "./Icons";

const formatCRP = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
};

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

interface ProfileOnboardingProps {
  primaryColor: string;
  requirePassword?: boolean;
  skipConsent?: boolean;
  initialCrp?: string;
  initialSpecialty?: string;
  onComplete: (data: { crp: string; specialty: string; password?: string }) => void;
}

type Step = "consent" | "professional";

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({
  primaryColor,
  requirePassword = false,
  skipConsent = false,
  initialCrp = "",
  initialSpecialty = "",
  onComplete,
}) => {
  const palette = useMemo(() => COLOR_PALETTES[primaryColor] || COLOR_PALETTES.indigo, [primaryColor]);

  // Prevent background page from scrolling while this full-screen onboarding is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const [step, setStep] = useState<Step>(skipConsent ? "professional" : "consent");
  const [consentChecked, setConsentChecked] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [crp, setCrp] = useState(initialCrp);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [errors, setErrors] = useState<{ crp?: string; password?: string; confirm?: string }>({});

  const handleConsent = () => {
    if (consentChecked) {
      setStep("professional");
    }
  };

  const handleSubmit = () => {
    const newErrors: { crp?: string; password?: string; confirm?: string } = {};

    if (requirePassword) {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }

      if (password !== confirmPassword) {
        newErrors.confirm = "As senhas não coincidem";
      }
    }

    if (!crp.trim()) {
      newErrors.crp = "O CRP é obrigatório para profissionais de psicologia.";
    } else if (crp.trim().length < 4) {
      newErrors.crp = "Informe um CRP válido (ex: 06/123456).";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onComplete({
        crp: crp.trim(),
        specialty: specialty.trim(),
        password: requirePassword ? password : undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start md:items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
          {/* Header */}
          <div className="p-5 text-center shrink-0" style={{ backgroundColor: palette.hex + "15" }}>
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3"
            style={{ backgroundColor: palette.hex }}
          >
            {step === "consent" ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            ) : (
              <Icons.User />
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {step === "consent" ? "Permissão de Uso de Dados" : "Dados Profissionais"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {step === "consent"
              ? "Precisamos da sua permissão antes de continuar"
              : requirePassword
                ? "Defina sua senha e complete seus dados"
                : "Informe seus dados para emissão de documentos"}
          </p>
        </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto min-h-0">
            {step === "consent" && (
              <div className="space-y-4">
                <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground text-sm">Termos de Consentimento</p>
                <p>
                  Ao utilizar o <strong>Meu Consultório</strong>, você autoriza o uso dos seguintes dados obtidos
                  através do seu cadastro:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>Nome e e-mail</strong> — para identificação e comunicação na plataforma.
                  </li>
                  <li>
                    <strong>CRP e especialidade</strong> — para emissão de documentos psicológicos conforme as normas do
                    CFP.
                  </li>
                  <li>
                    <strong>Dados de pacientes</strong> — armazenados de forma segura e acessíveis somente por você.
                  </li>
                </ul>
                <p>
                  Seus dados são protegidos conforme a <strong>LGPD (Lei Geral de Proteção de Dados)</strong> e não
                  serão compartilhados com terceiros sem sua autorização prévia.
                </p>
                <p>
                  Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato com o suporte da
                  plataforma.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                  style={{ accentColor: palette.hex }}
                />
                <span className="text-xs text-foreground leading-relaxed">
                  Li e concordo com os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>,
                  autorizando o uso dos meus dados conforme descrito acima.
                </span>
              </label>

              <button
                onClick={handleConsent}
                disabled={!consentChecked}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: palette.hex }}
              >
                Concordar e Continuar
              </button>
            </div>
          )}

          {step === "professional" && (
            <div className="space-y-4">
              {requirePassword && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Senha (Obrigatório)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                        errors.password ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                      }`}
                    />
                    {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                        errors.confirm ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                      }`}
                    />
                    {errors.confirm && <p className="text-destructive text-xs">{errors.confirm}</p>}
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                    <p className="font-semibold mb-1">A senha deve conter:</p>
                    <ul className="space-y-1">
                      <li className={password.length >= 8 ? "text-green-600" : ""}>• Pelo menos 8 caracteres</li>
                      <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>• Uma letra maiúscula</li>
                      <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>• Uma letra minúscula</li>
                      <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>• Um número</li>
                    </ul>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  CRP (Obrigatório)
                </label>
                <input
                  type="text"
                  value={crp}
                  onChange={(e) => setCrp(formatCRP(e.target.value))}
                  placeholder="Ex: 06/123456"
                  maxLength={9} // 2 + "/" + 6 = 9
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                    errors.crp ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
                  }`}
                />
                {errors.crp && <p className="text-destructive text-xs">{errors.crp}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Especialidade (Opcional)
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Psicologia Clínica"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: palette.hex }}
              >
                Finalizar Cadastro
              </button>
            </div>
          )}
        </div>

          {/* Progress */}
          <div className="px-5 pb-4 flex gap-2 shrink-0">
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: palette.hex }} />
            <div
              className="flex-1 h-1.5 rounded-full"
              style={{ backgroundColor: step === "professional" ? palette.hex : palette.hex + "30" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboarding;
