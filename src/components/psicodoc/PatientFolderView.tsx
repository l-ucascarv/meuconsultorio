import React, { useState, useMemo } from 'react';
import { Patient, SessionNote, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface PatientFolderViewProps {
  patient: Patient;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  primaryColor: PrimaryColor;
  onBack: () => void;
  onCreateDocument: () => void;
}

export const PatientFolderView: React.FC<PatientFolderViewProps> = ({
  patient,
  patients,
  setPatients,
  primaryColor,
  onBack,
  onCreateDocument,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'evolutions' | 'files'>('evolutions');

  const filteredNotes = useMemo(() => {
    if (!patient.notes) return [];
    if (!search.trim()) return patient.notes;
    return patient.notes.filter(note => 
      note.text.toLowerCase().includes(search.toLowerCase())
    );
  }, [patient.notes, search]);

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: SessionNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: newNote,
    };

    const updatedPatients = patients.map(p => {
      if (p.id === patient.id) {
        return { ...p, notes: [note, ...(p.notes || [])] };
      }
      return p;
    });

    setPatients(updatedPatients);
    setNewNote('');
  };

  const deleteNote = (noteId: string) => {
    const updatedPatients = patients.map(p => {
      if (p.id === patient.id) {
        return { ...p, notes: p.notes?.filter(n => n.id !== noteId) || [] };
      }
      return p;
    });
    setPatients(updatedPatients);
  };

  const currentPatient = patients.find(p => p.id === patient.id) || patient;

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
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-black">{patient.name}</h2>
          <p className="text-sm text-muted-foreground">Prontuário do Paciente</p>
        </div>
        <button
          onClick={onCreateDocument}
          className="p-3 rounded-xl text-white active-touch"
          style={{ background: palette.hex }}
        >
          <Icons.FileText />
        </button>
      </header>

      {/* Patient Info Card */}
      <div className="card-elevated p-5">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl"
            style={{ background: palette.hex }}
          >
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-black">{patient.name}</p>
            {patient.responsibleName && (
              <p className="text-sm text-muted-foreground">
                Responsável: {patient.responsibleName}
              </p>
            )}
            {patient.responsiblePhone && (
              <p className="text-sm text-muted-foreground">
                Tel: {patient.responsiblePhone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setActiveTab('evolutions')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'evolutions' 
              ? 'text-white' 
              : 'bg-muted text-muted-foreground'
          }`}
          style={activeTab === 'evolutions' ? { background: palette.hex } : {}}
        >
          Evoluções
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'files' 
              ? 'text-white' 
              : 'bg-muted text-muted-foreground'
          }`}
          style={activeTab === 'files' ? { background: palette.hex } : {}}
        >
          Arquivos
        </button>
      </div>

      {/* Content */}
      {activeTab === 'evolutions' && (
        <div className="space-y-4">
          {/* Add Note */}
          <div className="card-elevated p-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Adicionar evolução da sessão..."
              rows={3}
              className="input-field resize-none mb-3"
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
              style={{ background: palette.hex }}
            >
              Adicionar Evolução
            </button>
          </div>

          {/* Search */}
          {(currentPatient.notes?.length || 0) > 3 && (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icons.Search />
              </div>
              <input
                type="text"
                placeholder="Buscar nas evoluções..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => (
                <div key={note.id} className="card-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-bold mb-2">
                        {new Date(note.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive shrink-0"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma evolução registrada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="card-elevated p-6">
          <div className="p-10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer active-touch">
            <Icons.Upload />
            <span className="text-[10px] font-black text-muted-foreground uppercase">
              Toque para anexar
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Funcionalidade em desenvolvimento
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientFolderView;
