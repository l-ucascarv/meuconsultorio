export type DocumentType = 'relatorio' | 'atestado' | 'laudo' | 'parecer' | 'declaracao';
export type AppTheme = 'light' | 'dark';
export type PrimaryColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
export type SubscriptionPlan = 'mensal' | 'anual';

export interface SessionNote {
  id: string;
  date: string;
  text: string;
  mood?: string;
}

export interface ExternalFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  content: string;
}

export interface Patient {
  id: string;
  name: string;
  responsibleName: string;
  birthDate: string;
  responsiblePhone: string;
  files?: ExternalFile[];
  notes?: SessionNote[];
}

export interface PsychologistInfo {
  name: string;
  crp: string;
  specialty?: string;
  slug?: string;
  theme: AppTheme;
  primaryColor: PrimaryColor;
  plan: SubscriptionPlan;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  patientId?: string;
}

export interface ReportData {
  id: string;
  patientId?: string;
  type: DocumentType;
  patientName: string;
  solicitor: string;
  purpose: string;
  demandDescription: string;
  procedures: string;
  analysis: string;
  conclusion: string;
  date: string;
  city: string;
  generated?: GeneratedReport;
  specificQuestion?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface GeneratedReport {
  title: string;
  identification: string;
  demand?: string;
  procedure?: string;
  analysis?: string;
  conclusion: string;
}

export type AppView = 'home' | 'create' | 'preview' | 'history' | 'profile' | 'agenda' | 'patients' | 'patient_folder' | 'financial';

export interface CalendarDay {
  day: number;
  date: string;
  appointments: Appointment[];
}

export interface DayInfo {
  date: string;
  appointments: Appointment[];
}

export interface ColorPalette {
  hex: string;
  shadow: string;
  bg: string;
}
