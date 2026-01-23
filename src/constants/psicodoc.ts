import { DocumentType, ReportData, PsychologistInfo, PrimaryColor, ColorPalette } from "../types/psicodoc";

export const COLOR_PALETTES: Record<PrimaryColor, ColorPalette> = {
  indigo: { hex: '#4f46e5', shadow: 'rgba(79, 70, 229, 0.2)', bg: 'bg-indigo-600' },
  emerald: { hex: '#059669', shadow: 'rgba(5, 150, 105, 0.2)', bg: 'bg-emerald-600' },
  rose: { hex: '#e11d48', shadow: 'rgba(225, 29, 72, 0.2)', bg: 'bg-rose-600' },
  amber: { hex: '#d97706', shadow: 'rgba(217, 119, 6, 0.2)', bg: 'bg-amber-600' },
  slate: { hex: '#475569', shadow: 'rgba(71, 85, 105, 0.2)', bg: 'bg-slate-600' },
};

export const DOC_DEFINITIONS: Record<DocumentType, { label: string; description: string }> = {
  relatorio: { label: 'Relatório Psicológico', description: 'Descreve o processo e resultados do acompanhamento.' },
  atestado: { label: 'Atestado Psicológico', description: 'Certifica uma condição ou necessidade de afastamento.' },
  laudo: { label: 'Laudo Psicológico', description: 'Resultado de processo de avaliação pericial.' },
  parecer: { label: 'Parecer Psicológico', description: 'Pronunciamento técnico sobre questão específica.' },
  declaracao: { label: 'Declaração', description: 'Informa horários e comparecimento.' }
};

export const CFP_KNOWLEDGE_BASE = `
CONHECIMENTO DE BASE: RESOLUÇÃO CFP Nº 06/2019
O documento deve ser redigido com linguagem técnica, porém acessível, clara, precisa e objetiva.
ESTRUTURAS ESPECÍFICAS:
1. RELATÓRIO: Identificação, Demanda, Procedimento, Análise e Conclusão.
2. ATESTADO: Identificação, Finalidade, Registro de informações sobre o estado psicológico, Conclusão e Prazo.
3. LAUDO: Similar ao relatório, mas com maior rigor técnico.
4. PARECER: Responde a uma "Questão de Parecer".
5. DECLARAÇÃO: Informa horários e comparecimento, sem diagnóstico.
`;

export const INITIAL_REPORT_DATA = (type: DocumentType = 'relatorio'): ReportData => ({
  id: '',
  type,
  patientName: '',
  solicitor: '',
  purpose: '',
  demandDescription: '',
  procedures: '',
  analysis: '',
  conclusion: '',
  date: new Date().toISOString().split('T')[0],
  city: '',
  specificQuestion: '',
  periodStart: '',
  periodEnd: '',
});

export const INITIAL_PSYCHOLOGIST_INFO: PsychologistInfo = {
  name: '',
  crp: '',
  specialty: 'Psicólogo(a) Clínico(a)',
  theme: 'light',
  primaryColor: 'indigo',
  plan: 'mensal'
};
