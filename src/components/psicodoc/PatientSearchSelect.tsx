import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../../types/psicodoc';
import { Icons } from './Icons';

interface PatientSearchSelectProps {
  patients: Patient[];
  selectedPatient: string;
  onSelect: (id: string) => void;
  palette: { hex: string };
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export const PatientSearchSelect: React.FC<PatientSearchSelectProps> = ({
  patients,
  selectedPatient,
  onSelect,
  palette,
  placeholder = 'Buscar paciente...',
  allowEmpty = false,
  emptyLabel = 'Nenhum (digitar manualmente)',
}) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = patients.find(p => p.id === selectedPatient);

  useEffect(() => {
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
          <span className="flex-1 text-muted-foreground">{placeholder}</span>
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
            {allowEmpty && (
              <button
                onClick={() => { onSelect(''); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                  !selectedPatient ? 'font-bold' : 'text-muted-foreground'
                }`}
                style={!selectedPatient ? { color: palette.hex } : {}}
              >
                {emptyLabel}
              </button>
            )}
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

export default PatientSearchSelect;
