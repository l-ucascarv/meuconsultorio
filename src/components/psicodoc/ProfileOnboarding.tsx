import React, { useState } from "react";
import { COLOR_PALETTES } from "../../constants/psicodoc";
import { Icons } from "./Icons";

interface ProfileOnboardingProps {
  primaryColor: string;
  onComplete: (data: { crp: string; specialty: string }) => void;
}

type Step = "consent" | "professional";

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ primaryColor, onComplete }) => {
  const palette = COLOR_PALETTES[primaryColor] || COLOR_PALETTES.indigo;
  const [step, setStep] = useState<Step>("consent");
  const [consentChecked, setConsentChecked] = useState(false);
  const [crp, setCrp] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [errors, setErrors] = useState<{ crp?: string }>({});

  const handleConsent = () => {
    if (consentChecked) {
      setStep("professional");
    }
  };

  const handleSubmit = () => {
    const newErrors: { crp?: string } = {};
    if (!crp.trim()) {
      newErrors.crp = "O CRP é obrigatório para profissionais de psicologia.";
    } else if (crp.trim().length < 4) {
      newErrors.crp = "Informe um CRP válido (ex: 06/123456).";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onComplete({ crp: crp.trim(), specialty: specialty.trim() });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 text-center" style={{ backgroundColor: palette.hex + "15" }}>
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
              : "Informe seus dados para emissão de documentos"}
          </p>
        </div>

        {/* Content */}
        <div className="p-5">
          {step === "consent" && (
            <div className="space-y-4">
              <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-2 max-h-48 overflow-y-auto">
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
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground text-sm
                  ${errors.crp ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"}`}
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
        <div className="px-5 pb-4 flex gap-2">
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: palette.hex }} />
          <div
            className="flex-1 h-1.5 rounded-full"
            style={{ backgroundColor: step === "professional" ? palette.hex : palette.hex + "30" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboarding;
