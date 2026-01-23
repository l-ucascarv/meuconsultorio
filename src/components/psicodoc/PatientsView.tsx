import React, { useState, useMemo } from 'react';
import { Patient, PrimaryColor, SessionNote } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface PatientsViewProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  primaryColor: PrimaryColor;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  setPatients,
  primaryColor,
  onSelectPatient,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', responsibleName: '', responsiblePhone: '' });

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    return patients.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [patients, search]);

  const handleAddPatient = () => {
    if (!newPatient.name.trim()) return;
    
    const patient: Patient = {
      id: Date.now().toString(),
      name: newPatient.name,
      responsibleName: newPatient.responsibleName,
      birthDate: '',
      responsiblePhone: newPatient.responsiblePhone,
      files: [],
      notes: [],
    };
    
    setPatients(prev => [patient, ...prev]);
    setNewPatient({ name: '', responsibleName: '', responsiblePhone: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 page-enter">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 px-2">
        <h2 className="text-2xl md:text-3xl font-black">Pacientes</h2>
        <div className="flex items-center gap-3 flex-1 md:flex-none">
          <div className="relative flex-1 md:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-3 text-white rounded-xl shadow-lg active-touch shrink-0"
            style={{ background: palette.hex }}
          >
            <Icons.PlusCircle />
          </button>
        </div>
      </header>

      {/* Patients Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 px-1">
        {filteredPatients.length > 0 ? (
          filteredPatients.map(patient => (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className="card-elevated p-5 text-left active-touch hover:shadow-elevation-lg transition-shadow"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg mb-3"
                style={{ background: palette.hex }}
              >
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <p className="font-black text-sm truncate">{patient.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {patient.notes?.length || 0} evoluções
              </p>
            </button>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: `${palette.hex}15` }}
            >
              <div style={{ color: palette.hex }}>
                <Icons.Users />
              </div>
            </div>
            <p className="font-bold text-muted-foreground">
              {search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Tente outra busca' : 'Toque no + para adicionar'}
            </p>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">Novo Paciente</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Nome do Paciente *
                </label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Responsável (se menor)
                </label>
                <input
                  type="text"
                  value={newPatient.responsibleName}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, responsibleName: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={newPatient.responsiblePhone}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, responsiblePhone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleAddPatient}
              disabled={!newPatient.name.trim()}
              className="btn-primary w-full mt-6 disabled:opacity-50"
              style={{ background: palette.hex }}
            >
              Adicionar Paciente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsView;
