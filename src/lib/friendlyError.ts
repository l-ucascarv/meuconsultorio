// Converte erros técnicos em mensagens amigáveis, sem expor detalhes do banco/servidor.
const RULES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'],
  [/user already registered|already been registered/i, 'Este e-mail já está cadastrado.'],
  [/pwned|leaked|compromised|weak password/i, 'Essa senha apareceu em vazamentos públicos. Escolha outra senha.'],
  [/same.*password|different from the old/i, 'A nova senha deve ser diferente da atual.'],
  [/password/i, 'A senha não atende aos requisitos de segurança.'],
  [/rate limit|too many|429/i, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
  [/invalid.*(totp|code)|mfa/i, 'Código de verificação inválido.'],
  [/jwt|session|expired|not authenticated/i, 'Sua sessão expirou. Entre novamente.'],
  [/network|fetch|failed to fetch/i, 'Falha de conexão. Verifique sua internet e tente novamente.'],
];

export const LOCKED_MESSAGE = 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.';

export function friendlyError(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : (err as { message?: string })?.message ?? '';
  if (raw === LOCKED_MESSAGE) return raw;
  for (const [re, msg] of RULES) if (re.test(raw)) return msg;
  return fallback;
}
