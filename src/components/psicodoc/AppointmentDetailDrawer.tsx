import React from 'react';
import { Appointment, Patient, PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';

interface AppointmentDetailDrawerProps {
  appointment: Appointment | null;
  patient: Patient | null;
  primaryColor: PrimaryColor;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const AppointmentDetailDrawer: React.FC<AppointmentDetailDrawerProps> = ({
  appointment,
  patient,
  primaryColor,
  onClose,
  onDelete,
}) => {
  const palette = COLOR_PALETTES[primaryColor];

  if (!appointment) return null;

  const formattedDate = new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate + 'T12:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar mobile */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4 md:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-black">Detalhes do Agendamento</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <Icons.X />
          </button>
        </div>

        {/* Appointment info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0" style={{ background: palette.hex }}>
              {appointment.patientName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-black text-base truncate">{appointment.patientName}</p>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
              <p className="text-sm font-bold" style={{ color: palette.hex }}>{appointment.time}</p>
            </div>
          </div>

          {/* Patient details */}
          {patient && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Dados do Paciente</h4>

              <div className="grid grid-cols-1 gap-2">
                {patient.birthDate && (
                  <div className="p-3 rounded-xl bg-muted">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Data de Nascimento</p>
                    <p className="font-bold text-sm">
                      {new Date(patient.birthDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {calculateAge(patient.birthDate) !== null && (
                        <span className="text-muted-foreground ml-1">({calculateAge(patient.birthDate)} anos)</span>
                      )}
                    </p>
                  </div>
                )}

                {patient.responsibleName && (
                  <div className="p-3 rounded-xl bg-muted">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Responsável</p>
                    <p className="font-bold text-sm">{patient.responsibleName}</p>
                  </div>
                )}

                {patient.responsiblePhone && (
                  <div className="p-3 rounded-xl bg-muted">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Telefone</p>
                    <p className="font-bold text-sm">{patient.responsiblePhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!patient && appointment.patientId && (
            <p className="text-sm text-muted-foreground text-center py-2">Paciente não encontrado no cadastro.</p>
          )}

          {!appointment.patientId && (
            <p className="text-sm text-muted-foreground text-center py-2">Agendamento externo (sem vínculo com paciente).</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              onDelete(appointment.id);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-bold text-sm border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            Cancelar Consulta
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: palette.hex }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailDrawer;
