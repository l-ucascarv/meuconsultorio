import React, { useState, useEffect, useMemo } from 'react';
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
  LoadingOverlay 
} from '../components/psicodoc';

// Storage keys
const STORAGE_KEYS = {
  PSYCHO_INFO: 'psicodoc_psycho_info',
  PATIENTS: 'psicodoc_patients',
  REPORTS: 'psicodoc_reports',
  APPOINTMENTS: 'psicodoc_appointments',
};

const PsicoDocApp: React.FC = () => {
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

  // Load from localStorage
  useEffect(() => {
    const savedPsycho = localStorage.getItem(STORAGE_KEYS.PSYCHO_INFO);
    const savedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    const savedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const savedAppointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);

    if (savedPsycho) setPsychoInfo(JSON.parse(savedPsycho));
    if (savedPatients) setPatients(JSON.parse(savedPatients));
    if (savedReports) setReports(JSON.parse(savedReports));
    if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PSYCHO_INFO, JSON.stringify(psychoInfo));
  }, [psychoInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

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
    
    // Simulate AI generation (replace with actual API call)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockGenerated: GeneratedReport = {
        title: `${reportData.type.toUpperCase()} PSICOLÓGICO`,
        identification: `Paciente: ${reportData.patientName}\nSolicitante: ${reportData.solicitor}\nFinalidade: ${reportData.purpose}\n\nProfissional Responsável: ${psychoInfo.name}\nCRP: ${psychoInfo.crp}\nEspecialidade: ${psychoInfo.specialty}`,
        demand: reportData.demandDescription ? `A demanda apresentada refere-se a: ${reportData.demandDescription}` : undefined,
        procedure: reportData.procedures ? `Foram realizados os seguintes procedimentos: ${reportData.procedures}` : undefined,
        analysis: reportData.analysis ? `Com base nos procedimentos realizados, observa-se que: ${reportData.analysis}` : undefined,
        conclusion: reportData.conclusion || 'Conclusão a ser definida pelo profissional responsável.',
      };
      
      setGeneratedDoc(mockGenerated);
      setView('preview');
    } catch (error) {
      console.error('Erro na geração:', error);
      alert('Erro ao gerar documento. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = () => {
    if (!generatedDoc) return;
    
    const newReport: ReportData = {
      ...reportData,
      id: Date.now().toString(),
      generated: generatedDoc,
    };
    
    setReports(prev => [newReport, ...prev]);
    setReportData(INITIAL_REPORT_DATA());
    setGeneratedDoc(null);
    setView('history');
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

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${themeClass}`}>
      {/* Sidebar Desktop */}
      <Sidebar 
        view={view} 
        setView={setView} 
        primaryColor={psychoInfo.primaryColor} 
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
            patient={selectedPatient}
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

        {view === 'profile' && (
          <ProfileView
            psychoInfo={psychoInfo}
            setPsychoInfo={setPsychoInfo}
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
