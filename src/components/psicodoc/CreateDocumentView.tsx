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

const TextField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="input-field resize-none" />
  </div>
);

const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">{label}</label>
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
  </div>
);

/** Renders type-specific fields per CFP 06/2019 */
const TypeSpecificFields: React.FC<{ reportData: ReportData; setReportData: React.Dispatch<React.SetStateAction<ReportData>> }> = ({ reportData, setReportData }) => {
  const update = (field: keyof ReportData) => (value: string) => setReportData(prev => ({ ...prev, [field]: value }));

  switch (reportData.type) {
    case 'relatorio':
      return (
        <>
          <TextField label="Solicitante / Demandante" value={reportData.solicitor} onChange={update('solicitor')} placeholder="Quem solicitou o relatório" />
          <TextField label="Finalidade" value={reportData.purpose} onChange={update('purpose')} placeholder="Para que será utilizado o relatório" />
          <TextArea label="Descrição da Demanda" value={reportData.demandDescription} onChange={update('demandDescription')} placeholder="Informações referentes à problemática apresentada, motivos, razões e expectativas" rows={4} />
          <TextArea label="Procedimentos Realizados" value={reportData.procedures} onChange={update('procedures')} placeholder="Recursos e instrumentos técnicos utilizados: nº de encontros, pessoas ouvidas, testes aplicados (com registro SATEPSI quando aplicável)" rows={4} />
          <TextArea label="Análise" value={reportData.analysis} onChange={update('analysis')} placeholder="Exposição descritiva fundamentada teoricamente, correlacionando os dados obtidos nos procedimentos" rows={5} />
          <TextArea label="Conclusão" value={reportData.conclusion} onChange={update('conclusion')} placeholder="Síntese dos resultados, encaminhamentos e indicações respondendo à demanda" rows={4} />
        </>
      );

    case 'atestado':
      return (
        <>
          <TextField label="Finalidade do Atestado" value={reportData.purpose} onChange={update('purpose')} placeholder="Para que fim está sendo emitido o atestado" />
          <TextArea label="Estado / Condição Psicológica" value={reportData.demandDescription} onChange={update('demandDescription')} placeholder="Descrição sintética do estado psicológico, condição ou situação (SEM diagnóstico completo)" rows={4} />
          <TextArea label="Conclusão / Afirmação" value={reportData.conclusion} onChange={update('conclusion')} placeholder="Afirmação objetiva sobre a condição atestada" rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Validade – Início" value={reportData.periodStart || ''} onChange={update('periodStart')} />
            <DateField label="Validade – Fim" value={reportData.periodEnd || ''} onChange={update('periodEnd')} />
          </div>
          <p className="text-[10px] text-muted-foreground italic px-1">⚠ Conforme CFP 06/2019, Art. 15-17: o atestado NÃO deve conter diagnóstico psicológico completo.</p>
        </>
      );

    case 'laudo':
      return (
        <>
          <TextField label="Solicitante / Demandante" value={reportData.solicitor} onChange={update('solicitor')} placeholder="Quem solicitou a avaliação pericial" />
          <TextField label="Finalidade da Perícia" value={reportData.purpose} onChange={update('purpose')} placeholder="Motivo da avaliação pericial" />
          <TextArea label="Quesitos a Responder" value={reportData.specificQuestion || ''} onChange={update('specificQuestion')} placeholder="Liste os quesitos formulados pelo solicitante, se houver" rows={3} />
          <TextArea label="Descrição da Demanda Pericial" value={reportData.demandDescription} onChange={update('demandDescription')} placeholder="Descreva o contexto e a problemática da avaliação pericial" rows={4} />
          <TextArea label="Procedimentos Detalhados" value={reportData.procedures} onChange={update('procedures')} placeholder="Descrição detalhada: testes (com registro SATEPSI), entrevistas, observações, número de sessões e datas" rows={5} />
          <TextArea label="Análise Técnica" value={reportData.analysis} onChange={update('analysis')} placeholder="Exposição fundamentada com rigor técnico, referenciando teorias e autores, correlacionando todos os dados obtidos" rows={5} />
          <TextArea label="Conclusão" value={reportData.conclusion} onChange={update('conclusion')} placeholder="Resposta objetiva aos quesitos (quando houver), parecer técnico fundamentado, prognóstico quando pertinente" rows={4} />
        </>
      );

    case 'parecer':
      return (
        <>
          <TextField label="Solicitante" value={reportData.solicitor} onChange={update('solicitor')} placeholder="Quem solicitou o parecer" />
          <TextField label="Questão Focal" value={reportData.specificQuestion || ''} onChange={update('specificQuestion')} placeholder="Qual a questão específica a ser respondida?" />
          <TextArea label="Exposição de Motivos" value={reportData.demandDescription} onChange={update('demandDescription')} placeholder="Apresentação da questão focal que motivou o parecer e seu contexto" rows={4} />
          <TextArea label="Análise Fundamentada" value={reportData.analysis} onChange={update('analysis')} placeholder="Discussão fundamentada do tema com referencial teórico-científico, indicando procedimentos adotados" rows={5} />
          <TextArea label="Conclusão / Resposta" value={reportData.conclusion} onChange={update('conclusion')} placeholder="Resposta DIRETA e OBJETIVA à questão formulada, com posicionamento técnico" rows={4} />
          <p className="text-[10px] text-muted-foreground italic px-1">⚠ Conforme CFP 06/2019, Art. 18-20: o parecer responde a uma questão ESPECÍFICA com fundamentação resumida.</p>
        </>
      );

    case 'declaracao':
      return (
        <>
          <TextField label="Finalidade" value={reportData.purpose} onChange={update('purpose')} placeholder="Para que fim está sendo emitida a declaração" />
          <TextArea label="Informações Objetivas Declaradas" value={reportData.demandDescription} onChange={update('demandDescription')} placeholder="Registre APENAS informações objetivas: comparecimento, horários de atendimento, número de sessões realizadas, período de acompanhamento" rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Período – Início" value={reportData.periodStart || ''} onChange={update('periodStart')} />
            <DateField label="Período – Fim" value={reportData.periodEnd || ''} onChange={update('periodEnd')} />
          </div>
          <p className="text-[10px] text-muted-foreground italic px-1">
            ⚠ Conforme CFP 06/2019, Art. 21-22: a declaração NÃO pode conter diagnósticos, prognósticos, análises clínicas ou opiniões técnicas. Apenas dados objetivos de comparecimento e atendimento.
          </p>
        </>
      );

    default:
      return null;
  }
};

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
      setReportData(prev => ({ ...prev, patientId: patient.id, patientName: patient.name }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 page-enter">
      {/* Header */}
      <header className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-muted active-touch">
          <Icons.ArrowLeft />
        </button>
        <h2 className="text-2xl md:text-3xl font-black">Novo Documento</h2>
      </header>

      {/* Document Type Selection */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Tipo de Documento</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {docTypes.map((type) => (
            <button
              key={type}
              onClick={() => setReportData(prev => ({ ...prev, type }))}
              className={`p-4 rounded-xl border-2 text-left transition-all active-touch ${
                reportData.type === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
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
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Selecionar Paciente</label>
          <select value={reportData.patientId || ''} onChange={(e) => handlePatientSelect(e.target.value)} className="input-field">
            <option value="">Digitar manualmente</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Patient Name (always shown) */}
      <TextField
        label="Nome do Paciente / Interessado"
        value={reportData.patientName}
        onChange={(v) => setReportData(prev => ({ ...prev, patientName: v }))}
        placeholder="Nome completo"
      />

      {/* Type-specific fields */}
      <div className="space-y-4">
        <TypeSpecificFields reportData={reportData} setReportData={setReportData} />
      </div>

      {/* City and Date (always shown) */}
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Cidade" value={reportData.city} onChange={(v) => setReportData(prev => ({ ...prev, city: v }))} placeholder="Cidade" />
        <DateField label="Data" value={reportData.date} onChange={(v) => setReportData(prev => ({ ...prev, date: v }))} />
      </div>

      {/* Generate Button */}
      <button onClick={onGenerate} className="btn-primary w-full flex items-center justify-center gap-3" style={{ background: palette.hex }}>
        <Icons.Brain />
        <span>Gerar Documento com IA</span>
      </button>
    </div>
  );
};

export default CreateDocumentView;
