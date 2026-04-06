import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AppView, 
  ReportData, 
  GeneratedReport, 
  PsychologistInfo, 
  Patient, 
  Appointment 
} from '../types/psicodoc';
import { INITIAL_REPORT_DATA, INITIAL_PSYCHOLOGIST_INFO, COLOR_PALETTES } from '../constants/psicodoc';
import { 
  Sidebar, 
  BottomNav, 
  HomeView, 
  CreateDocumentView, 
  PreviewView, 
  PatientsView, 
  PatientFolderView, 
  AgendaView, 
  HistoryView, 
  ProfileView,
  LoadingOverlay,
  FinancialView,
  FinancialCategory,
  FinancialTransaction,
  AvailabilitySettingsView,
  AnamnesisView,
} from '../components/psicodoc';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordModal } from '@/components/psicodoc/ChangePasswordModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PsicoDocApp: React.FC = () => {
  const { user, profile, mustChangePassword, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();

  // State
  const [view, setView] = useState<AppView>('home');
  const [psychoInfo, setPsychoInfo] = useState<PsychologistInfo>(INITIAL_PSYCHOLOGIST_INFO);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [reportData, setReportData] = useState<ReportData>(INITIAL_REPORT_DATA());
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedReport | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [financialCategories, setFinancialCategories] = useState<FinancialCategory[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);

  // Sync profile data to psychoInfo
  useEffect(() => {
    if (profile) {
      setPsychoInfo(prev => ({
        ...prev,
        name: profile.name || '',
        crp: profile.crp || '',
        specialty: profile.specialty || '',
        slug: profile.slug || '',
        theme: (profile.theme as 'light' | 'dark') || 'light',
        primaryColor: (profile.primary_color as any) || 'indigo',
      }));
    }
  }, [profile]);

  // Load data from database
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load patients
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (patientsError) throw patientsError;

        const formattedPatients: Patient[] = (patientsData || []).map(p => ({
          id: p.id,
          name: p.name,
          responsibleName: p.responsible_name || '',
          birthDate: p.birth_date || '',
          responsiblePhone: p.responsible_phone || '',
          notes: (p.notes as any[]) || [],
          files: [],
        }));

        // Load patient files
        const { data: filesData } = await supabase
          .from('patient_files')
          .select('*')
          .eq('user_id', user.id);

        if (filesData) {
          for (const file of filesData) {
            const patient = formattedPatients.find(p => p.id === file.patient_id);
            if (patient) {
              patient.files = patient.files || [];
              patient.files.push({
                id: file.id,
                name: file.name,
                type: file.file_type || '',
                size: file.file_size || '',
                date: file.created_at,
                content: file.content || file.file_url || '',
              });
            }
          }
        }

        setPatients(formattedPatients);

        // Load appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: true });

        if (appointmentsError) throw appointmentsError;

        const formattedAppointments: Appointment[] = (appointmentsData || []).map(a => ({
          id: a.id,
          date: a.appointment_date,
          time: a.appointment_time,
          patientName: a.patient_name,
          patientId: a.patient_id || undefined,
          notes: a.notes || undefined,
        }));
        setAppointments(formattedAppointments);

        // Load reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (reportsError) throw reportsError;

        const formattedReports: ReportData[] = (reportsData || []).map(r => ({
          id: r.id,
          patientId: r.patient_id || undefined,
          type: r.type as any,
          patientName: r.patient_name,
          solicitor: r.solicitor || '',
          purpose: r.purpose || '',
          demandDescription: r.demand_description || '',
          procedures: r.procedures || '',
          analysis: r.analysis || '',
          conclusion: r.conclusion || '',
          date: r.created_at.split('T')[0],
          city: r.city || '',
          specificQuestion: r.specific_question || '',
          periodStart: r.period_start || '',
          periodEnd: r.period_end || '',
          generated: r.generated_content as unknown as GeneratedReport || undefined,
        }));
        setReports(formattedReports);

        // Load financial categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('financial_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (categoriesError) throw categoriesError;

        const formattedCategories: FinancialCategory[] = (categoriesData || []).map(c => ({
          id: c.id,
          name: c.name,
          type: c.type as 'income' | 'expense',
          color: c.color || '#6366f1',
        }));
        setFinancialCategories(formattedCategories);

        // Load financial transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false });

        if (transactionsError) throw transactionsError;

        const formattedTransactions: FinancialTransaction[] = (transactionsData || []).map(t => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          description: t.description,
          amount: parseFloat(t.amount as unknown as string),
          categoryId: t.category_id || undefined,
          patientId: t.patient_id || undefined,
          transactionDate: t.transaction_date,
        }));
        setFinancialTransactions(formattedTransactions);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar seus dados. Tente novamente.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  // Save profile changes to database
  const saveProfileToDb = useCallback(async (newInfo: PsychologistInfo) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: newInfo.name,
          crp: newInfo.crp,
          specialty: newInfo.specialty,
          theme: newInfo.theme,
          primary_color: newInfo.primaryColor,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }, [user]);

  // Update psychoInfo and save to DB
  const handleSetPsychoInfo: React.Dispatch<React.SetStateAction<PsychologistInfo>> = (value) => {
    setPsychoInfo(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      saveProfileToDb(newValue);
      return newValue;
    });
  };

  // Theme class
  const themeClass = psychoInfo.theme === 'dark' ? 'dark' : '';

  // Today's appointments count
  const appointmentsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date === today).length;
  }, [appointments]);

  // Handlers
  const handleGenerate = async () => {
    if (!psychoInfo.name) {
      setView('profile');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          type: reportData.type,
          patientName: reportData.patientName,
          solicitor: reportData.solicitor,
          purpose: reportData.purpose,
          demandDescription: reportData.demandDescription,
          procedures: reportData.procedures,
          analysis: reportData.analysis,
          conclusion: reportData.conclusion,
          specificQuestion: reportData.specificQuestion,
          periodStart: reportData.periodStart,
          periodEnd: reportData.periodEnd,
          psychologistName: psychoInfo.name,
          psychologistCrp: psychoInfo.crp,
          psychologistSpecialty: psychoInfo.specialty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar documento');
      }

      const generatedDoc: GeneratedReport = await response.json();
      setGeneratedDoc(generatedDoc);
      setView('preview');
    } catch (error) {
      console.error('Erro na geração:', error);
      toast({
        title: 'Erro ao gerar documento',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!generatedDoc || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          patient_id: reportData.patientId || null,
          type: reportData.type,
          patient_name: reportData.patientName,
          solicitor: reportData.solicitor,
          purpose: reportData.purpose,
          demand_description: reportData.demandDescription,
          procedures: reportData.procedures,
          analysis: reportData.analysis,
          conclusion: reportData.conclusion,
          city: reportData.city,
          specific_question: reportData.specificQuestion,
          period_start: reportData.periodStart || null,
          period_end: reportData.periodEnd || null,
          generated_content: generatedDoc as any,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-save document to patient folder if linked to a patient
      if (reportData.patientId) {
        const docLabel = reportData.type === 'relatorio' ? 'Relatório' :
                         reportData.type === 'atestado' ? 'Atestado' :
                         reportData.type === 'laudo' ? 'Laudo' :
                         reportData.type === 'parecer' ? 'Parecer' : 'Declaração';
        
        const textContent = [
          generatedDoc.title || docLabel,
          '',
          '1. IDENTIFICAÇÃO',
          generatedDoc.identification,
          generatedDoc.demand ? `\n2. DEMANDA\n${generatedDoc.demand}` : '',
          generatedDoc.procedure ? `\n3. PROCEDIMENTO\n${generatedDoc.procedure}` : '',
          generatedDoc.analysis ? `\n4. ANÁLISE\n${generatedDoc.analysis}` : '',
          `\nCONCLUSÃO\n${generatedDoc.conclusion}`,
          '',
          `${reportData.city}, ${new Date(reportData.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          psychoInfo.name,
          psychoInfo.crp ? `CRP: ${psychoInfo.crp}` : '',
        ].filter(Boolean).join('\n');

        await supabase.from('patient_files').insert({
          patient_id: reportData.patientId,
          user_id: user.id,
          name: `${docLabel} - ${reportData.patientName} - ${new Date().toLocaleDateString('pt-BR')}`,
          file_type: 'document',
          file_size: `${(textContent.length / 1024).toFixed(1)} KB`,
          content: textContent,
        });

        // Update local patient files list
        setPatients(prev => prev.map(p => {
          if (p.id === reportData.patientId) {
            return {
              ...p,
              files: [
                {
                  id: Date.now().toString(),
                  name: `${docLabel} - ${reportData.patientName} - ${new Date().toLocaleDateString('pt-BR')}`,
                  type: 'document',
                  size: `${(textContent.length / 1024).toFixed(1)} KB`,
                  date: new Date().toISOString(),
                  content: textContent,
                },
                ...(p.files || []),
              ],
            };
          }
          return p;
        }));
      }

      const newReport: ReportData = {
        id: data.id,
        patientId: data.patient_id || undefined,
        type: data.type as any,
        patientName: data.patient_name,
        solicitor: data.solicitor || '',
        purpose: data.purpose || '',
        demandDescription: data.demand_description || '',
        procedures: data.procedures || '',
        analysis: data.analysis || '',
        conclusion: data.conclusion || '',
        date: data.created_at.split('T')[0],
        city: data.city || '',
        specificQuestion: data.specific_question || '',
        periodStart: data.period_start || '',
        periodEnd: data.period_end || '',
        generated: generatedDoc,
      };
      
      setReports(prev => [newReport, ...prev]);
      setReportData(INITIAL_REPORT_DATA());
      setGeneratedDoc(null);
      setView('history');

      toast({
        title: 'Documento salvo!',
        description: reportData.patientId 
          ? 'O documento foi salvo no histórico e na pasta do paciente.' 
          : 'O documento foi salvo no histórico.',
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o documento.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setView('patient_folder');
  };

  const handleCreateDocumentForPatient = () => {
    if (selectedPatient) {
      setReportData(prev => ({
        ...prev,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
      }));
      setView('create');
    }
  };

  const handleSelectReport = (report: ReportData) => {
    if (report.generated) {
      setReportData(report);
      setGeneratedDoc(report.generated);
      setView('preview');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== reportId));
      toast({
        title: 'Documento excluído',
        description: 'O documento foi removido do histórico.',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o documento.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${themeClass}`}>
      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={mustChangePassword} />

      {/* Sidebar Desktop */}
      <Sidebar 
        view={view} 
        setView={setView} 
        primaryColor={psychoInfo.primaryColor}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-6 px-4 md:px-8">
        {view === 'home' && (
          <HomeView
            psychoInfo={psychoInfo}
            setView={setView}
            reportsCount={reports.length}
            patientsCount={patients.length}
            appointmentsToday={appointmentsToday}
          />
        )}

        {view === 'create' && (
          <CreateDocumentView
            reportData={reportData}
            setReportData={setReportData}
            patients={patients}
            primaryColor={psychoInfo.primaryColor}
            onGenerate={handleGenerate}
            onBack={() => setView('home')}
          />
        )}

        {view === 'preview' && generatedDoc && (
          <PreviewView
            generatedDoc={generatedDoc}
            reportData={reportData}
            psychoInfo={psychoInfo}
            onBack={() => setView('create')}
            onSave={handleSaveReport}
          />
        )}

        {view === 'history' && (
          <HistoryView
            reports={reports}
            primaryColor={psychoInfo.primaryColor}
            onSelectReport={handleSelectReport}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {view === 'patients' && (
          <PatientsView
            patients={patients}
            setPatients={setPatients}
            primaryColor={psychoInfo.primaryColor}
            onSelectPatient={handleSelectPatient}
          />
        )}

        {view === 'patient_folder' && selectedPatient && (
          <PatientFolderView
            patient={patients.find(p => p.id === selectedPatient.id) || selectedPatient}
            patients={patients}
            setPatients={setPatients}
            primaryColor={psychoInfo.primaryColor}
            onBack={() => setView('patients')}
            onCreateDocument={handleCreateDocumentForPatient}
          />
        )}

        {view === 'agenda' && (
          <AgendaView
            appointments={appointments}
            setAppointments={setAppointments}
            patients={patients}
            primaryColor={psychoInfo.primaryColor}
          />
        )}

        {view === 'financial' && (
          <FinancialView
            categories={financialCategories}
            setCategories={setFinancialCategories}
            transactions={financialTransactions}
            setTransactions={setFinancialTransactions}
            patients={patients}
            primaryColor={psychoInfo.primaryColor}
          />
        )}

        {view === 'availability' && (
          <AvailabilitySettingsView
            primaryColor={psychoInfo.primaryColor}
            slug={psychoInfo.slug}
          />
        )}

        {view === 'profile' && (
          <ProfileView
            psychoInfo={psychoInfo}
            setPsychoInfo={handleSetPsychoInfo}
          />
        )}
      </main>

      {/* Bottom Nav Mobile */}
      <BottomNav 
        view={view} 
        setView={setView} 
        primaryColor={psychoInfo.primaryColor} 
      />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isGenerating} />
    </div>
  );
};

export default PsicoDocApp;
