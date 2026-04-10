import React, { useState } from 'react';
import { AnamnesisData, Patient, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnamnesisViewProps {
  patients: Patient[];
  primaryColor: PrimaryColor;
  onBack: () => void;
  selectedPatientId?: string;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-elevated overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center gap-3 active-touch">
        <span className="text-primary">{icon}</span>
        <span className="font-black text-sm flex-1 text-left">{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}><Icons.ChevronDown /></span>
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
  </div>
);

const Area = ({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="input-field resize-none" />
  </div>
);

const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
      <option value="">Selecionar...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const INITIAL_ANAMNESIS: Omit<AnamnesisData, 'patientId' | 'patientName'> = {
  birthDate: '', age: '', gender: '', maritalStatus: '', education: '', occupation: '',
  address: '', phone: '', email: '',
  responsibleName: '', responsibleRelation: '', responsiblePhone: '',
  mainComplaint: '', referralSource: '', previousTreatment: '', currentMedications: '',
  healthHistory: '', psychiatricHistory: '', familyHealthHistory: '', substanceUse: '',
  sleepPattern: '', feedingHabits: '',
  pregnancyNotes: '', developmentMilestones: '', schoolHistory: '',
  familyComposition: '', familyRelationships: '', socialRelationships: '',
  emotionalState: '', copingStrategies: '', selfPerception: '',
  behavioralObservations: '', additionalNotes: '',
  initialHypothesis: '', therapeuticPlan: '',
};

const PatientSearchSelect: React.FC<{
  patients: Patient[];
  selectedPatient: string;
  onSelect: (id: string) => void;
  palette: { hex: string };
}> = ({ patients, selectedPatient, onSelect, palette }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = patients.find(p => p.id === selectedPatient);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className="input-field flex items-center gap-2 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <span className="flex-1 truncate">{selected.name}</span>
        ) : (
          <span className="flex-1 text-muted-foreground">Buscar paciente...</span>
        )}
        <Icons.ChevronDown />
      </div>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digitar nome do paciente..."
              className="w-full px-3 py-2 text-sm bg-muted rounded-lg focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">Nenhum paciente encontrado</p>
            ) : (
              filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    p.id === selectedPatient ? 'font-bold' : ''
                  }`}
                  style={p.id === selectedPatient ? { color: palette.hex } : {}}
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AnamnesisView: React.FC<AnamnesisViewProps> = ({ patients, primaryColor, onBack, selectedPatientId }) => {
  const palette = COLOR_PALETTES[primaryColor];
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(selectedPatientId || '');
  const [data, setData] = useState<Omit<AnamnesisData, 'patientId' | 'patientName'>>(INITIAL_ANAMNESIS);

  const update = (field: keyof typeof data) => (value: string) => setData(prev => ({ ...prev, [field]: value }));

  const patient = patients.find(p => p.id === selectedPatient);

  const handleSave = async () => {
    if (!user || !selectedPatient || !patient) {
      toast.error('Selecione um paciente.');
      return;
    }

    setIsSaving(true);
    try {
      // Generate text content for the anamnesis
      const content = generateAnamnesisText(data, patient.name);

      const { error } = await supabase
        .from('patient_files')
        .insert({
          patient_id: selectedPatient,
          user_id: user.id,
          name: `Anamnese - ${patient.name} - ${new Date().toLocaleDateString('pt-BR')}`,
          file_type: 'anamnesis',
          file_size: `${(content.length / 1024).toFixed(1)} KB`,
          content,
        });

      if (error) throw error;

      toast.success('Ficha de anamnese salva na pasta do paciente!');
      setData(INITIAL_ANAMNESIS);
      onBack();
    } catch (err) {
      console.error('Error saving anamnesis:', err);
      toast.error('Erro ao salvar anamnese.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 py-4 page-enter overflow-x-hidden">
      <header className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-muted active-touch">
          <Icons.ArrowLeft />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-black">Ficha de Anamnese</h2>
          <p className="text-xs text-muted-foreground">Anamnese Psicológica Completa</p>
        </div>
      </header>

      {/* Patient Selection with Search */}
      <div className="card-elevated p-4 space-y-2">
        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Paciente</label>
        <PatientSearchSelect
          patients={patients}
          selectedPatient={selectedPatient}
          onSelect={setSelectedPatient}
          palette={palette}
        />
      </div>

      {selectedPatient && (
        <>
          {/* Seção 1 - Dados Pessoais */}
          <Section title="Dados Pessoais" icon={<Icons.User />} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de Nascimento" value={data.birthDate} onChange={update('birthDate')} placeholder="" type="date" />
              <Field label="Idade" value={data.age} onChange={update('age')} placeholder="Ex: 32 anos" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Sexo" value={data.gender} onChange={update('gender')} options={['Masculino', 'Feminino', 'Outro', 'Prefiro não informar']} />
              <SelectField label="Estado Civil" value={data.maritalStatus} onChange={update('maritalStatus')} options={['Solteiro(a)', 'Casado(a)', 'União Estável', 'Divorciado(a)', 'Viúvo(a)']} />
            </div>
            <SelectField label="Escolaridade" value={data.education} onChange={update('education')} options={['Ensino Fundamental Incompleto', 'Ensino Fundamental Completo', 'Ensino Médio Incompleto', 'Ensino Médio Completo', 'Ensino Superior Incompleto', 'Ensino Superior Completo', 'Pós-graduação', 'Mestrado', 'Doutorado']} />
            <Field label="Profissão / Ocupação" value={data.occupation} onChange={update('occupation')} placeholder="Profissão atual" />
            <Field label="Endereço" value={data.address} onChange={update('address')} placeholder="Endereço completo" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone" value={data.phone} onChange={update('phone')} placeholder="(00) 00000-0000" />
              <Field label="E-mail" value={data.email} onChange={update('email')} placeholder="email@exemplo.com" />
            </div>
          </Section>

          {/* Seção 2 - Responsável */}
          <Section title="Dados do Responsável (se menor)" icon={<Icons.Users />}>
            <Field label="Nome do Responsável" value={data.responsibleName} onChange={update('responsibleName')} placeholder="Nome completo" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parentesco" value={data.responsibleRelation} onChange={update('responsibleRelation')} placeholder="Ex: Mãe, Pai" />
              <Field label="Telefone" value={data.responsiblePhone} onChange={update('responsiblePhone')} placeholder="(00) 00000-0000" />
            </div>
          </Section>

          {/* Seção 3 - Motivo da Consulta */}
          <Section title="Motivo da Consulta" icon={<Icons.FileText />} defaultOpen={true}>
            <Area label="Queixa Principal" value={data.mainComplaint} onChange={update('mainComplaint')} placeholder="Descreva a queixa principal do paciente, com suas próprias palavras" rows={4} />
            <Field label="Encaminhamento" value={data.referralSource} onChange={update('referralSource')} placeholder="Quem encaminhou? (médico, escola, busca espontânea)" />
            <Area label="Tratamentos Anteriores" value={data.previousTreatment} onChange={update('previousTreatment')} placeholder="Já realizou acompanhamento psicológico ou psiquiátrico antes? Quando? Motivo?" rows={3} />
            <Area label="Medicações Atuais" value={data.currentMedications} onChange={update('currentMedications')} placeholder="Medicações em uso (nome, dosagem, médico responsável)" rows={2} />
          </Section>

          {/* Seção 4 - Histórico de Saúde */}
          <Section title="Histórico de Saúde" icon={<Icons.Heart />}>
            <Area label="Histórico de Saúde Geral" value={data.healthHistory} onChange={update('healthHistory')} placeholder="Doenças crônicas, cirurgias, internações, alergias" rows={3} />
            <Area label="Histórico Psiquiátrico" value={data.psychiatricHistory} onChange={update('psychiatricHistory')} placeholder="Diagnósticos prévios, internações psiquiátricas, crises" rows={3} />
            <Area label="Histórico Familiar de Saúde Mental" value={data.familyHealthHistory} onChange={update('familyHealthHistory')} placeholder="Transtornos mentais na família (depressão, ansiedade, esquizofrenia, uso de substâncias)" rows={3} />
            <Area label="Uso de Substâncias" value={data.substanceUse} onChange={update('substanceUse')} placeholder="Álcool, tabaco, drogas ilícitas - frequência e quantidade" rows={2} />
            <Area label="Padrão de Sono" value={data.sleepPattern} onChange={update('sleepPattern')} placeholder="Qualidade do sono, insônia, pesadelos, horas de sono" rows={2} />
            <Area label="Alimentação" value={data.feedingHabits} onChange={update('feedingHabits')} placeholder="Hábitos alimentares, apetite, compulsão, restrições" rows={2} />
          </Section>

          {/* Seção 5 - Desenvolvimento */}
          <Section title="Histórico de Desenvolvimento" icon={<Icons.Book />}>
            <Area label="Gestação e Parto" value={data.pregnancyNotes} onChange={update('pregnancyNotes')} placeholder="Intercorrências na gestação, tipo de parto, condições ao nascer" rows={3} />
            <Area label="Marcos do Desenvolvimento" value={data.developmentMilestones} onChange={update('developmentMilestones')} placeholder="Quando andou, falou, controle esfincteriano, socialização" rows={3} />
            <Area label="Histórico Escolar" value={data.schoolHistory} onChange={update('schoolHistory')} placeholder="Adaptação escolar, dificuldades de aprendizagem, relacionamento com colegas" rows={3} />
          </Section>

          {/* Seção 6 - Dinâmica Familiar e Social */}
          <Section title="Dinâmica Familiar e Social" icon={<Icons.Users />}>
            <Area label="Composição Familiar" value={data.familyComposition} onChange={update('familyComposition')} placeholder="Com quem mora, membros da família, idades" rows={3} />
            <Area label="Relacionamentos Familiares" value={data.familyRelationships} onChange={update('familyRelationships')} placeholder="Qualidade dos relacionamentos, conflitos, vínculos afetivos" rows={3} />
            <Area label="Relacionamentos Sociais" value={data.socialRelationships} onChange={update('socialRelationships')} placeholder="Amizades, vida social, rede de apoio, atividades de lazer" rows={3} />
          </Section>

          {/* Seção 7 - Aspectos Emocionais */}
          <Section title="Aspectos Emocionais e Comportamentais" icon={<Icons.Brain />}>
            <Area label="Estado Emocional Atual" value={data.emotionalState} onChange={update('emotionalState')} placeholder="Humor predominante, sentimentos recorrentes, intensidade" rows={3} />
            <Area label="Estratégias de Enfrentamento" value={data.copingStrategies} onChange={update('copingStrategies')} placeholder="Como lida com situações de estresse e dificuldades" rows={3} />
            <Area label="Autopercepção" value={data.selfPerception} onChange={update('selfPerception')} placeholder="Como se percebe, autoestima, autoimagem" rows={3} />
          </Section>

          {/* Seção 8 - Observações e Hipótese */}
          <Section title="Observações e Planejamento" icon={<Icons.FileText />} defaultOpen={true}>
            <Area label="Observações Comportamentais" value={data.behavioralObservations} onChange={update('behavioralObservations')} placeholder="Postura, aparência, contato visual, comportamento durante a sessão" rows={3} />
            <Area label="Observações Adicionais" value={data.additionalNotes} onChange={update('additionalNotes')} placeholder="Informações complementares relevantes" rows={3} />
            <Area label="Hipótese Diagnóstica Inicial" value={data.initialHypothesis} onChange={update('initialHypothesis')} placeholder="Hipóteses levantadas com base nos dados colhidos (CID/DSM quando aplicável)" rows={3} />
            <Area label="Plano Terapêutico" value={data.therapeuticPlan} onChange={update('therapeuticPlan')} placeholder="Abordagem proposta, frequência das sessões, objetivos terapêuticos, encaminhamentos" rows={4} />
          </Section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-xl font-black text-white active-touch disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: palette.hex }}
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                Salvando...
              </>
            ) : (
              <>
                <Icons.Check />
                Salvar Anamnese na Pasta do Paciente
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

function generateAnamnesisText(data: Omit<AnamnesisData, 'patientId' | 'patientName'>, patientName: string): string {
  const sections: string[] = [
    'FICHA DE ANAMNESE PSICOLÓGICA',
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    `Paciente: ${patientName}`,
    '',
    '═══════════════════════════════════',
    '1. DADOS PESSOAIS',
    '═══════════════════════════════════',
  ];

  const addIfFilled = (label: string, value: string) => {
    if (value.trim()) sections.push(`${label}: ${value}`);
  };

  addIfFilled('Data de Nascimento', data.birthDate ? new Date(data.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : '');
  addIfFilled('Idade', data.age);
  addIfFilled('Sexo', data.gender);
  addIfFilled('Estado Civil', data.maritalStatus);
  addIfFilled('Escolaridade', data.education);
  addIfFilled('Profissão', data.occupation);
  addIfFilled('Endereço', data.address);
  addIfFilled('Telefone', data.phone);
  addIfFilled('E-mail', data.email);

  if (data.responsibleName.trim()) {
    sections.push('', '--- Dados do Responsável ---');
    addIfFilled('Nome', data.responsibleName);
    addIfFilled('Parentesco', data.responsibleRelation);
    addIfFilled('Telefone', data.responsiblePhone);
  }

  sections.push('', '═══════════════════════════════════', '2. MOTIVO DA CONSULTA', '═══════════════════════════════════');
  addIfFilled('Queixa Principal', data.mainComplaint);
  addIfFilled('Encaminhamento', data.referralSource);
  addIfFilled('Tratamentos Anteriores', data.previousTreatment);
  addIfFilled('Medicações Atuais', data.currentMedications);

  sections.push('', '═══════════════════════════════════', '3. HISTÓRICO DE SAÚDE', '═══════════════════════════════════');
  addIfFilled('Saúde Geral', data.healthHistory);
  addIfFilled('Histórico Psiquiátrico', data.psychiatricHistory);
  addIfFilled('Histórico Familiar', data.familyHealthHistory);
  addIfFilled('Uso de Substâncias', data.substanceUse);
  addIfFilled('Padrão de Sono', data.sleepPattern);
  addIfFilled('Alimentação', data.feedingHabits);

  sections.push('', '═══════════════════════════════════', '4. HISTÓRICO DE DESENVOLVIMENTO', '═══════════════════════════════════');
  addIfFilled('Gestação e Parto', data.pregnancyNotes);
  addIfFilled('Marcos do Desenvolvimento', data.developmentMilestones);
  addIfFilled('Histórico Escolar', data.schoolHistory);

  sections.push('', '═══════════════════════════════════', '5. DINÂMICA FAMILIAR E SOCIAL', '═══════════════════════════════════');
  addIfFilled('Composição Familiar', data.familyComposition);
  addIfFilled('Relacionamentos Familiares', data.familyRelationships);
  addIfFilled('Relacionamentos Sociais', data.socialRelationships);

  sections.push('', '═══════════════════════════════════', '6. ASPECTOS EMOCIONAIS', '═══════════════════════════════════');
  addIfFilled('Estado Emocional', data.emotionalState);
  addIfFilled('Estratégias de Enfrentamento', data.copingStrategies);
  addIfFilled('Autopercepção', data.selfPerception);

  sections.push('', '═══════════════════════════════════', '7. OBSERVAÇÕES E PLANEJAMENTO', '═══════════════════════════════════');
  addIfFilled('Observações Comportamentais', data.behavioralObservations);
  addIfFilled('Observações Adicionais', data.additionalNotes);
  addIfFilled('Hipótese Diagnóstica Inicial', data.initialHypothesis);
  addIfFilled('Plano Terapêutico', data.therapeuticPlan);

  return sections.join('\n');
}

export default AnamnesisView;
