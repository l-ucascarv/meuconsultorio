import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

interface ProfessionalInfo {
  name: string;
  specialty: string;
  crp: string;
  sessionDuration: number;
  maxAdvanceDays: number;
  availableDays?: number[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const PublicBooking: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [info, setInfo] = useState<ProfessionalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', age: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load professional info
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/public-booking?slug=${encodeURIComponent(slug!)}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Profissional não encontrado');
        }
        setInfo(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    const loadSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime(null);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/public-booking?slug=${encodeURIComponent(slug!)}&date=${selectedDate}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selectedDate, slug]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (info?.maxAdvanceDays || 60));
    const maxStr = maxDate.toISOString().split('T')[0];

    const days: (null | { day: number; date: string; disabled: boolean })[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay();
      const isPast = dateStr < today;
      const isTooFar = dateStr > maxStr;
      const isAvailableDay = info?.availableDays?.includes(dayOfWeek) ?? true;
      days.push({ day: d, date: dateStr, disabled: isPast || isTooFar || !isAvailableDay });
    }
    return days;
  }, [currentMonth, info]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !form.name.trim() || !form.age.trim()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/public-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          date: selectedDate,
          time: selectedTime,
          patientName: form.name.trim(),
          patientAge: form.age.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao agendar');
      setSuccess(true);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Página não encontrada</h2>
          <p className="text-gray-500">{error || 'Este link de agendamento não está disponível.'}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Consulta agendada com sucesso!</h2>
          <p className="text-gray-500 mb-2">
            Sua consulta com <strong>{info.name}</strong> foi confirmada.
          </p>
          <p className="text-gray-600 font-semibold">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {selectedTime}
          </p>
          <p className="text-sm text-gray-400 mt-4">Duração: {info.sessionDuration} minutos</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900">{info.name}</h1>
          <p className="text-gray-500 font-medium">{info.specialty}</p>
          {info.crp && <p className="text-gray-400 text-sm">CRP: {info.crp}</p>}
          <p className="text-indigo-600 font-semibold text-sm mt-2">
            Sessão de {info.sessionDuration} minutos
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          <span className={`px-3 py-1 rounded-full ${selectedDate ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-600 text-white'}`}>
            1. Data
          </span>
          <span className="text-gray-300">→</span>
          <span className={`px-3 py-1 rounded-full ${selectedTime ? 'bg-indigo-100 text-indigo-700' : selectedDate ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            2. Horário
          </span>
          <span className="text-gray-300">→</span>
          <span className={`px-3 py-1 rounded-full ${selectedTime ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            3. Dados
          </span>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const d = new Date(currentMonth);
                d.setMonth(d.getMonth() - 1);
                setCurrentMonth(d);
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-black text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => {
                const d = new Date(currentMonth);
                d.setMonth(d.getMonth() + 1);
                setCurrentMonth(d);
              }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDayNames.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <button
                key={i}
                disabled={!day || day.disabled}
                onClick={() => day && !day.disabled && setSelectedDate(day.date)}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  !day
                    ? 'invisible'
                    : day.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : selectedDate === day.date
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : day.date === todayStr
                    ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day?.day}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="bg-white rounded-2xl shadow-lg p-5 animate-fade-in">
            <h4 className="font-black text-gray-900 mb-3">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h4>

            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-center text-gray-400 py-6">Nenhum horário disponível nesta data</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      selectedTime === t
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        {selectedTime && (
          <div className="bg-white rounded-2xl shadow-lg p-5 animate-fade-in">
            <h4 className="font-black text-gray-900 mb-4">Seus dados</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome"
                  maxLength={200}
                  className="w-full mt-1 p-3.5 bg-gray-50 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  maxLength={20}
                  className="w-full mt-1 p-3.5 bg-gray-50 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="seu@email.com"
                  maxLength={255}
                  className="w-full mt-1 p-3.5 bg-gray-50 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            </div>

            {submitError && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim() || !form.phone.trim()}
              className="w-full mt-5 py-4 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Ao confirmar, você concorda com o agendamento da consulta.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by <span className="font-bold">PsicoDoc AI</span>
        </p>
      </div>
    </div>
  );
};

export default PublicBooking;
