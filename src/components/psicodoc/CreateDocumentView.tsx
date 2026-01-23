import React from 'react';
import { DocumentType, ReportData, PrimaryColor, Patient } from '../../types/psicodoc';
import { COLOR_PALETTES, DOC_DEFINITIONS } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface CreateDocumentViewProps {
  reportData: ReportData;
  setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
  patients: Patient[];
  primaryColor: PrimaryColor;
  onGenerate: () => void;
  onBack: () => void;
}

export const CreateDocumentView: React.FC<CreateDocumentViewProps> = ({
  reportData,
  setReportData,
  patients,
  primaryColor,
  onGenerate,
  onBack,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const docTypes: DocumentType[] = ['relatorio', 'atestado', 'laudo', 'parecer', 'declaracao'];

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setReportData(prev => ({
        ...prev,
        patientId: patient.id,
        patientName: patient.name,
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 page-enter">
      {/* Header */}
      <header className="flex items-center gap-4 px-2">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-muted active-touch"
        >
          <Icons.ArrowLeft />
        </button>
        <h2 className="text-2xl md:text-3xl font-black">Novo Documento</h2>
      </header>

      {/* Document Type Selection */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
          Tipo de Documento
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {docTypes.map((type) => (
            <button
              key={type}
              onClick={() => setReportData(prev => ({ ...prev, type }))}
              className={`p-4 rounded-xl border-2 text-left transition-all active-touch ${
                reportData.type === type 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              style={reportData.type === type ? { borderColor: palette.hex, background: `${palette.hex}10` } : {}}
            >
              <p className="font-black text-sm">{DOC_DEFINITIONS[type].label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{DOC_DEFINITIONS[type].description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Selection */}
      {patients.length > 0 && (
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
            Selecionar Paciente
          </label>
          <select
            value={reportData.patientId || ''}
            onChange={(e) => handlePatientSelect(e.target.value)}
            className="input-field"
          >
            <option value="">Digitar manualmente</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
            Nome do Paciente
          </label>
          <input
            type="text"
            value={reportData.patientName}
            onChange={(e) => setReportData(prev => ({ ...prev, patientName: e.target.value }))}
            placeholder="Nome completo do paciente"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Solicitante
            </label>
            <input
              type="text"
              value={reportData.solicitor}
              onChange={(e) => setReportData(prev => ({ ...prev, solicitor: e.target.value }))}
              placeholder="Quem solicitou o documento"
              className="input-field"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Finalidade
            </label>
            <input
              type="text"
              value={reportData.purpose}
              onChange={(e) => setReportData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Para que será utilizado"
              className="input-field"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
            Descrição da Demanda
          </label>
          <textarea
            value={reportData.demandDescription}
            onChange={(e) => setReportData(prev => ({ ...prev, demandDescription: e.target.value }))}
            placeholder="Descreva o motivo do atendimento e demanda apresentada"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
            Procedimentos Realizados
          </label>
          <textarea
            value={reportData.procedures}
            onChange={(e) => setReportData(prev => ({ ...prev, procedures: e.target.value }))}
            placeholder="Liste os procedimentos utilizados (entrevistas, testes, etc)"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
            Análise Clínica / Observações
          </label>
          <textarea
            value={reportData.analysis}
            onChange={(e) => setReportData(prev => ({ ...prev, analysis: e.target.value }))}
            placeholder="Suas observações e análise clínica do caso"
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
            Conclusão / Parecer
          </label>
          <textarea
            value={reportData.conclusion}
            onChange={(e) => setReportData(prev => ({ ...prev, conclusion: e.target.value }))}
            placeholder="Conclusão ou parecer final"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {reportData.type === 'parecer' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Questão Específica (Parecer)
            </label>
            <input
              type="text"
              value={reportData.specificQuestion || ''}
              onChange={(e) => setReportData(prev => ({ ...prev, specificQuestion: e.target.value }))}
              placeholder="Qual a questão a ser respondida?"
              className="input-field"
            />
          </div>
        )}

        {(reportData.type === 'atestado' || reportData.type === 'declaracao') && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                Data Início
              </label>
              <input
                type="date"
                value={reportData.periodStart || ''}
                onChange={(e) => setReportData(prev => ({ ...prev, periodStart: e.target.value }))}
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                Data Fim
              </label>
              <input
                type="date"
                value={reportData.periodEnd || ''}
                onChange={(e) => setReportData(prev => ({ ...prev, periodEnd: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Cidade
            </label>
            <input
              type="text"
              value={reportData.city}
              onChange={(e) => setReportData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Cidade"
              className="input-field"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
              Data
            </label>
            <input
              type="date"
              value={reportData.date}
              onChange={(e) => setReportData(prev => ({ ...prev, date: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        className="btn-primary w-full flex items-center justify-center gap-3"
        style={{ background: palette.hex }}
      >
        <Icons.Brain />
        <span>Gerar Documento com IA</span>
      </button>
    </div>
  );
};

export default CreateDocumentView;
