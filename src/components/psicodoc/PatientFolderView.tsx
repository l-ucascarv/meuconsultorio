import React, { useState, useMemo, useRef } from 'react';
import { Patient, SessionNote, ExternalFile, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { toast } from 'sonner';
import { usePatients } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'evolutions' | 'files'>('evolutions');
  const [previewFile, setPreviewFile] = useState<ExternalFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'note' | 'file'; id: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updatePatient } = usePatients(patients, setPatients);

  const currentPatient = patients.find(p => p.id === patient.id) || patient;

  const filteredNotes = useMemo(() => {
    if (!currentPatient.notes) return [];
    if (!search.trim()) return currentPatient.notes;
    return currentPatient.notes.filter(note => 
      note.text.toLowerCase().includes(search.toLowerCase())
    );
  }, [currentPatient.notes, search]);

  const addNote = async () => {
    if (!newNote.trim() || isSaving) return;
    
    const note: SessionNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: newNote.trim(),
    };

    const updatedNotes = [note, ...(currentPatient.notes || [])];
    
    setIsSaving(true);
    const success = await updatePatient(patient.id, { notes: updatedNotes });
    setIsSaving(false);

    if (success) {
      setNewNote('');
      toast.success('Evolução adicionada com sucesso!');
    }
  };

  const deleteNote = async (noteId: string) => {
    const updatedNotes = (currentPatient.notes || []).filter(n => n.id !== noteId);
    
    const success = await updatePatient(patient.id, { notes: updatedNotes });
    if (success) {
      setDeleteConfirm(null);
      toast.success('Evolução removida');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      try {
        const { data, error } = await supabase
          .from('patient_files')
          .insert({
            patient_id: patient.id,
            user_id: user.id,
            name: file.name,
            file_type: file.type,
            file_size: formatFileSize(file.size),
            content,
          })
          .select()
          .single();

        if (error) throw error;

        const newFile: ExternalFile = {
          id: data.id,
          name: data.name,
          type: data.file_type || '',
          size: data.file_size || '',
          date: data.created_at,
          content: data.content || '',
        };

        setPatients(prev => prev.map(p => {
          if (p.id === patient.id) {
            return { ...p, files: [newFile, ...(p.files || [])] };
          }
          return p;
        }));
        toast.success('Arquivo anexado com sucesso!');
      } catch (err) {
        console.error('Error uploading file:', err);
        toast.error('Erro ao anexar arquivo.');
      }
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('patient_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setPatients(prev => prev.map(p => {
        if (p.id === patient.id) {
          return { ...p, files: p.files?.filter(f => f.id !== fileId) || [] };
        }
        return p;
      }));
      setDeleteConfirm(null);
      toast.success('Arquivo removido');
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Erro ao remover arquivo.');
    }
  };

  const downloadFile = (file: ExternalFile) => {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Icons.Image />;
    return <Icons.File />;
  };

  const isImageFile = (type: string) => type.startsWith('image/');

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
            {patient.birthDate && (
              <p className="text-sm text-muted-foreground">
                Nascimento: {new Date(patient.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
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
          Evoluções ({currentPatient.notes?.length || 0})
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
          Arquivos ({currentPatient.files?.length || 0})
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
              maxLength={5000}
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim() || isSaving}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
              style={{ background: palette.hex }}
            >
              {isSaving ? 'Salvando...' : 'Adicionar Evolução'}
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
                      onClick={() => setDeleteConfirm({ type: 'note', id: note.id })}
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
        <div className="space-y-4">
          {/* Upload Area */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="card-elevated p-6 w-full"
          >
            <div className="p-10 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
              <div style={{ color: palette.hex }}>
                <Icons.Upload />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase">
                Toque para anexar arquivo
              </span>
              <span className="text-[10px] text-muted-foreground">
                Imagens, PDFs, Word
              </span>
            </div>
          </button>

          {/* Files List */}
          <div className="space-y-3">
            {currentPatient.files && currentPatient.files.length > 0 ? (
              currentPatient.files.map(file => (
                <div key={file.id} className="card-elevated p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${palette.hex}15`, color: palette.hex }}
                    >
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} • {new Date(file.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isImageFile(file.type) && (
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                          title="Visualizar"
                        >
                          <Icons.Eye />
                        </button>
                      )}
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                        title="Download"
                      >
                        <Icons.Download />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'file', id: file.id })}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                        title="Excluir"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${palette.hex}15` }}
                >
                  <div style={{ color: palette.hex }}>
                    <Icons.FolderOpen />
                  </div>
                </div>
                <p className="font-bold text-muted-foreground">Nenhum arquivo anexado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Anexe exames, laudos e outros documentos
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-black truncate">{previewFile.name}</h3>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-2 rounded-full hover:bg-muted"
              >
                <Icons.X />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              <img 
                src={previewFile.content} 
                alt={previewFile.name}
                className="w-full h-auto rounded-xl"
              />
            </div>
            <div className="flex gap-3 p-4 border-t border-border">
              <button
                onClick={() => downloadFile(previewFile)}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                style={{ background: palette.hex }}
              >
                <Icons.Download />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <div className="text-destructive">
                <Icons.AlertCircle />
              </div>
            </div>
            <h3 className="text-xl font-black text-center mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {deleteConfirm.type === 'note' 
                ? 'Tem certeza que deseja excluir esta evolução?' 
                : 'Tem certeza que deseja excluir este arquivo?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-muted active-touch"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'note') {
                    deleteNote(deleteConfirm.id);
                  } else {
                    deleteFile(deleteConfirm.id);
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-destructive active-touch"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientFolderView;
