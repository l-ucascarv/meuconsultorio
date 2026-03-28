import React, { useState, useMemo } from 'react';
import { Appointment, Patient, PrimaryColor, CalendarDay, DayInfo } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { AppointmentDetailDrawer } from './AppointmentDetailDrawer';

interface AgendaViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  patients: Patient[];
  primaryColor: PrimaryColor;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  setAppointments,
  patients,
  primaryColor,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: '',
    time: '08:00',
  });

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: (CalendarDay | null)[] = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        appointments: appointments.filter(a => a.date === dateStr),
      });
    }
    
    return days;
  }, [currentDate, appointments]);

  const handleAddAppointment = () => {
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) return;
    
    const patient = patients.find(p => p.id === newAppointment.patientId);
    if (!patient) return;

    const appointment: Appointment = {
      id: Date.now().toString(),
      patientId: patient.id,
      patientName: patient.name,
      date: newAppointment.date,
      time: newAppointment.time,
    };

    const updated = [...appointments, appointment].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    setAppointments(updated);
    
    if (selectedDay && selectedDay.date === appointment.date) {
      setSelectedDay({
        ...selectedDay,
        appointments: updated.filter(a => a.date === selectedDay.date),
      });
    }

    setNewAppointment({ patientId: '', date: newAppointment.date, time: '08:00' });
    setIsModalOpen(false);
  };

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    
    if (selectedDay) {
      setSelectedDay({
        ...selectedDay,
        appointments: updated.filter(a => a.date === selectedDay.date),
      });
    }
  };

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const selectedPatient = selectedAppointment?.patientId
    ? patients.find(p => p.id === selectedAppointment.patientId) || null
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 py-2 md:py-4 page-enter">
      {/* Header */}
      <header className="flex justify-between items-center gap-3 px-1 md:px-2">
        <h2 className="text-xl md:text-3xl font-black">Agenda</h2>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={() => {
              setNewAppointment(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
              setIsModalOpen(true);
            }}
            className="p-2.5 md:p-3 text-white rounded-xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"
            style={{ background: palette.hex }}
          >
            <Icons.PlusCircle />
            <span className="hidden md:inline font-bold text-sm">Novo Agendamento</span>
          </button>
          <div className="flex gap-0.5 md:gap-1">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() - 1);
                setCurrentDate(d);
                setSelectedDay(null);
              }}
              className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm active:scale-95 transition-transform"
            >
              <Icons.ChevronLeft />
            </button>
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() + 1);
                setCurrentDate(d);
                setSelectedDay(null);
              }}
              className="p-2 md:p-2.5 bg-card rounded-xl shadow-sm active:scale-95 transition-transform"
            >
              <Icons.ChevronRight />
            </button>
          </div>
        </div>
      </header>

      {/* Month/Year */}
      <div className="text-center">
        <h3 className="text-lg md:text-xl font-black">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className="card-elevated p-3 md:p-4">
        <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[9px] md:text-[10px] font-black text-muted-foreground uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              disabled={!day}
              onClick={() => day && setSelectedDay({ date: day.date, appointments: day.appointments })}
              className={`aspect-square rounded-lg md:rounded-xl flex flex-col items-center justify-center p-0.5 md:p-1 transition-all active:scale-95 ${
                !day 
                  ? 'invisible' 
                  : selectedDay?.date === day.date
                    ? 'text-white'
                    : isToday(day.date)
                      ? 'bg-primary/10'
                      : 'hover:bg-muted'
              }`}
              style={day && selectedDay?.date === day.date ? { background: palette.hex } : {}}
            >
              {day && (
                <>
                  <span className={`text-xs md:text-sm font-bold ${isToday(day.date) && selectedDay?.date !== day.date ? 'text-primary' : ''}`} style={isToday(day.date) && selectedDay?.date !== day.date ? { color: palette.hex } : {}}>
                    {day.day}
                  </span>
                  {day.appointments.length > 0 && (
                    <div 
                      className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full mt-0.5 ${selectedDay?.date === day.date ? 'bg-white' : ''}`}
                      style={selectedDay?.date !== day.date ? { background: palette.hex } : {}}
                    />
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Appointments */}
      {selectedDay && (
        <div className="card-elevated p-3 md:p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h4 className="font-black text-sm md:text-base">
              {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h4>
            <button
              onClick={() => {
                setNewAppointment(prev => ({ ...prev, date: selectedDay.date }));
                setIsModalOpen(true);
              }}
              className="text-xs md:text-sm font-bold"
              style={{ color: palette.hex }}
            >
              + Adicionar
            </button>
          </div>

          {selectedDay.appointments.length > 0 ? (
            <div className="space-y-2">
              {selectedDay.appointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(apt => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-muted active:scale-[0.98] transition-transform cursor-pointer"
                    onClick={() => handleAppointmentClick(apt)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ background: palette.hex }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{apt.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-muted-foreground hidden md:inline">Ver detalhes</span>
                      <Icons.ChevronRight />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Nenhum agendamento para este dia
            </p>
          )}
        </div>
      )}

      {/* Appointment Detail Drawer */}
      {selectedAppointment && (
        <AppointmentDetailDrawer
          appointment={selectedAppointment}
          patient={selectedPatient}
          primaryColor={primaryColor}
          onClose={() => setSelectedAppointment(null)}
          onDelete={handleDeleteAppointment}
        />
      )}

      {/* Add Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card rounded-t-3xl md:rounded-3xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4 md:hidden" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">Novo Agendamento</h3>
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
                  Paciente *
                </label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, patientId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Data *
                </label>
                <input
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">
                  Horário *
                </label>
                <input
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleAddAppointment}
              disabled={!newAppointment.patientId || !newAppointment.date}
              className="btn-primary w-full mt-6 disabled:opacity-50"
              style={{ background: palette.hex }}
            >
              Confirmar Horário
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaView;
