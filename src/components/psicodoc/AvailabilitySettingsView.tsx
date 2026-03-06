import React, { useState, useEffect, useCallback } from 'react';
import { PrimaryColor } from '../../types/psicodoc';
import { COLOR_PALETTES } from '../../constants/psicodoc';
import { Icons } from './Icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AvailabilitySettingsViewProps {
  primaryColor: PrimaryColor;
  slug?: string;
}

interface DaySetting {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface BookingConfig {
  sessionDurationMinutes: number;
  breakBetweenMinutes: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  bookingEnabled: boolean;
}

interface BlockedDate {
  id: string;
  blockedDate: string;
  blockFullDay: boolean;
  blockedStartTime?: string;
  blockedEndTime?: string;
  reason?: string;
}

interface ServiceTypeItem {
  id?: string;
  name: string;
  price: number;
  isActive: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const DEFAULT_CONFIG: BookingConfig = {
  sessionDurationMinutes: 50,
  breakBetweenMinutes: 10,
  minAdvanceHours: 2,
  maxAdvanceDays: 60,
  bookingEnabled: true,
};

export const AvailabilitySettingsView: React.FC<AvailabilitySettingsViewProps> = ({
  primaryColor,
  slug,
}) => {
  const palette = COLOR_PALETTES[primaryColor];
  const { user } = useAuth();
  const { toast } = useToast();

  const [daySettings, setDaySettings] = useState<DaySetting[]>([]);
  const [config, setConfig] = useState<BookingConfig>(DEFAULT_CONFIG);
  const [blocks, setBlocks] = useState<BlockedDate[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [copied, setCopied] = useState(false);

  const bookingUrl = slug
    ? `${window.location.origin}/${slug}/agendamento`
    : null;

  // Load data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Load day settings
        const { data: settings } = await supabase
          .from('availability_settings')
          .select('*')
          .eq('user_id', user.id);

        const allDays: DaySetting[] = [];
        for (let d = 0; d < 7; d++) {
          const existing = (settings || []).find((s: any) => s.day_of_week === d);
          if (existing) {
            allDays.push({
              id: existing.id,
              dayOfWeek: existing.day_of_week,
              startTime: existing.start_time.substring(0, 5),
              endTime: existing.end_time.substring(0, 5),
              isActive: existing.is_active,
            });
          } else {
            allDays.push({
              dayOfWeek: d,
              startTime: '08:00',
              endTime: '18:00',
              isActive: d >= 1 && d <= 5,
            });
          }
        }
        setDaySettings(allDays);

        // Load config
        const { data: configData } = await supabase
          .from('booking_config')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (configData) {
          setConfig({
            sessionDurationMinutes: configData.session_duration_minutes,
            breakBetweenMinutes: configData.break_between_minutes,
            minAdvanceHours: configData.min_advance_hours,
            maxAdvanceDays: configData.max_advance_days,
            bookingEnabled: configData.booking_enabled,
          });
        }

        // Load blocks
        const { data: blocksData } = await supabase
          .from('availability_blocks')
          .select('*')
          .eq('user_id', user.id)
          .gte('blocked_date', new Date().toISOString().split('T')[0])
          .order('blocked_date', { ascending: true });

        setBlocks(
          (blocksData || []).map((b: any) => ({
            id: b.id,
            blockedDate: b.blocked_date,
            blockFullDay: b.block_full_day,
            blockedStartTime: b.blocked_start_time,
            blockedEndTime: b.blocked_end_time,
            reason: b.reason,
          }))
        );

        // Load service types
        const { data: svcData } = await supabase
          .from('service_types')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true });

        setServiceTypes(
          (svcData || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            isActive: s.is_active,
          }))
        );
      } catch (err) {
        console.error('Error loading availability:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upsert booking config
      const { error: configErr } = await supabase
        .from('booking_config')
        .upsert({
          user_id: user.id,
          session_duration_minutes: config.sessionDurationMinutes,
          break_between_minutes: config.breakBetweenMinutes,
          min_advance_hours: config.minAdvanceHours,
          max_advance_days: config.maxAdvanceDays,
          booking_enabled: config.bookingEnabled,
        }, { onConflict: 'user_id' });

      if (configErr) throw configErr;

      // Upsert day settings
      for (const day of daySettings) {
        if (day.id) {
          await supabase
            .from('availability_settings')
            .update({
              start_time: day.startTime,
              end_time: day.endTime,
              is_active: day.isActive,
            })
            .eq('id', day.id);
        } else {
          const { data } = await supabase
            .from('availability_settings')
            .insert({
              user_id: user.id,
              day_of_week: day.dayOfWeek,
              start_time: day.startTime,
              end_time: day.endTime,
              is_active: day.isActive,
            })
            .select('id')
            .single();
          if (data) day.id = data.id;
        }
      }

      toast({ title: 'Configurações salvas!', description: 'Sua disponibilidade foi atualizada.' });
    } catch (err) {
      console.error('Error saving:', err);
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [user, config, daySettings, toast]);

  const handleAddBlock = async () => {
    if (!user || !newBlockDate) return;
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .insert({
          user_id: user.id,
          blocked_date: newBlockDate,
          block_full_day: true,
          reason: newBlockReason || null,
        })
        .select()
        .single();

      if (error) throw error;

      setBlocks((prev) => [
        ...prev,
        {
          id: data.id,
          blockedDate: data.blocked_date,
          blockFullDay: data.block_full_day,
          reason: data.reason,
        },
      ].sort((a, b) => a.blockedDate.localeCompare(b.blockedDate)));

      setNewBlockDate('');
      setNewBlockReason('');
      toast({ title: 'Data bloqueada!' });
    } catch (err) {
      console.error('Error adding block:', err);
      toast({ title: 'Erro ao bloquear data', variant: 'destructive' });
    }
  };

  const handleRemoveBlock = async (id: string) => {
    try {
      await supabase.from('availability_blocks').delete().eq('id', id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      toast({ title: 'Bloqueio removido' });
    } catch (err) {
      console.error('Error removing block:', err);
    }
  };

  const handleAddServiceType = async () => {
    if (!user || !newServiceName.trim()) return;
    const price = parseFloat(newServicePrice) || 0;
    try {
      const { data, error } = await supabase
        .from('service_types')
        .insert({
          user_id: user.id,
          name: newServiceName.trim(),
          price,
          is_active: true,
          sort_order: serviceTypes.length,
        })
        .select()
        .single();

      if (error) throw error;

      setServiceTypes((prev) => [
        ...prev,
        { id: data.id, name: data.name, price: Number(data.price), isActive: data.is_active },
      ]);
      setNewServiceName('');
      setNewServicePrice('');
      toast({ title: 'Serviço adicionado!' });
    } catch (err) {
      console.error('Error adding service type:', err);
      toast({ title: 'Erro ao adicionar serviço', variant: 'destructive' });
    }
  };

  const handleToggleServiceType = async (id: string, currentActive: boolean) => {
    try {
      await supabase.from('service_types').update({ is_active: !currentActive }).eq('id', id);
      setServiceTypes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s))
      );
    } catch (err) {
      console.error('Error toggling service type:', err);
    }
  };

  const handleRemoveServiceType = async (id: string) => {
    try {
      await supabase.from('service_types').delete().eq('id', id);
      setServiceTypes((prev) => prev.filter((s) => s.id !== id));
      toast({ title: 'Serviço removido' });
    } catch (err) {
      console.error('Error removing service type:', err);
    }
  };

  const copyLink = () => {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copiado!' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 page-enter">
      <header className="flex flex-wrap justify-between items-center gap-3 px-2">
        <h2 className="text-2xl md:text-3xl font-black">Agendamento Online</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-white rounded-xl font-bold text-sm shadow-lg active-touch flex items-center gap-2"
          style={{ background: palette.hex }}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </header>

      {/* Share Link */}
      {bookingUrl ? (
        <div className="card-elevated p-4">
          <h3 className="font-black text-sm mb-2">🔗 Link de Agendamento</h3>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={bookingUrl}
              className="flex-1 p-3 bg-muted rounded-xl text-sm font-mono truncate"
            />
            <button
              onClick={copyLink}
              className="p-3 rounded-xl text-white shrink-0"
              style={{ background: palette.hex }}
            >
              {copied ? <Icons.Check /> : <Icons.Copy />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compartilhe este link com seus pacientes para que agendem online.
          </p>
        </div>
      ) : (
        <div className="card-elevated p-4">
          <p className="text-sm text-muted-foreground">
            Configure um <strong>slug</strong> no seu perfil para gerar o link de agendamento.
          </p>
        </div>
      )}

      {/* Enable/Disable */}
      <div className="card-elevated p-4 flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm">Agendamento ativo</h3>
          <p className="text-xs text-muted-foreground">Pacientes podem agendar online</p>
        </div>
        <button
          onClick={() => setConfig((p) => ({ ...p, bookingEnabled: !p.bookingEnabled }))}
          className={`w-12 h-7 rounded-full transition-colors relative ${config.bookingEnabled ? '' : 'bg-muted'}`}
          style={config.bookingEnabled ? { background: palette.hex } : {}}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              config.bookingEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Session Config */}
      <div className="card-elevated p-4 space-y-4">
        <h3 className="font-black">⚙️ Configurações</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Duração da sessão (min)
            </label>
            <input
              type="number"
              value={config.sessionDurationMinutes}
              onChange={(e) => setConfig((p) => ({ ...p, sessionDurationMinutes: Math.max(10, Number(e.target.value)) }))}
              className="input-field mt-1"
              min={10}
              max={180}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Intervalo entre sessões (min)
            </label>
            <input
              type="number"
              value={config.breakBetweenMinutes}
              onChange={(e) => setConfig((p) => ({ ...p, breakBetweenMinutes: Math.max(0, Number(e.target.value)) }))}
              className="input-field mt-1"
              min={0}
              max={60}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Antecedência mínima (horas)
            </label>
            <input
              type="number"
              value={config.minAdvanceHours}
              onChange={(e) => setConfig((p) => ({ ...p, minAdvanceHours: Math.max(0, Number(e.target.value)) }))}
              className="input-field mt-1"
              min={0}
              max={72}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Agendamento futuro máx (dias)
            </label>
            <input
              type="number"
              value={config.maxAdvanceDays}
              onChange={(e) => setConfig((p) => ({ ...p, maxAdvanceDays: Math.max(1, Number(e.target.value)) }))}
              className="input-field mt-1"
              min={1}
              max={365}
            />
          </div>
        </div>
      </div>

      {/* Service Types */}
      <div className="card-elevated p-4 space-y-3">
        <h3 className="font-black">💼 Tipos de Serviço</h3>
        <p className="text-xs text-muted-foreground">
          Configure os tipos de atendimento e seus valores para exibir na página de agendamento.
        </p>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Nome do serviço
            </label>
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="Ex: Avaliação Psicológica"
              maxLength={100}
              className="input-field mt-1"
            />
          </div>
          <div className="w-32">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Valor (R$)
            </label>
            <input
              type="number"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              placeholder="150.00"
              min={0}
              step={0.01}
              className="input-field mt-1"
            />
          </div>
          <button
            onClick={handleAddServiceType}
            disabled={!newServiceName.trim()}
            className="p-3.5 rounded-xl text-white shrink-0 disabled:opacity-50"
            style={{ background: palette.hex }}
          >
            <Icons.PlusCircle />
          </button>
        </div>

        {serviceTypes.length > 0 && (
          <div className="space-y-2 mt-2">
            {serviceTypes.map((svc) => (
              <div
                key={svc.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  svc.isActive ? 'bg-muted' : 'bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => svc.id && handleToggleServiceType(svc.id, svc.isActive)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      svc.isActive ? 'border-transparent text-white' : 'border-muted-foreground/30'
                    }`}
                    style={svc.isActive ? { background: palette.hex } : {}}
                  >
                    {svc.isActive && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p className="font-bold text-sm">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => svc.id && handleRemoveServiceType(svc.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="card-elevated p-4 space-y-3">
        <h3 className="font-black">📅 Horários por dia da semana</h3>
        {daySettings.map((day) => (
          <div
            key={day.dayOfWeek}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${day.isActive ? 'bg-muted' : 'bg-muted/30 opacity-60'}`}
          >
            <button
              onClick={() =>
                setDaySettings((prev) =>
                  prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? { ...d, isActive: !d.isActive } : d))
                )
              }
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                day.isActive ? 'border-transparent text-white' : 'border-muted-foreground/30'
              }`}
              style={day.isActive ? { background: palette.hex } : {}}
            >
              {day.isActive && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="font-bold text-sm w-28 shrink-0">{DAY_NAMES[day.dayOfWeek]}</span>
            {day.isActive && (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) =>
                    setDaySettings((prev) =>
                      prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? { ...d, startTime: e.target.value } : d))
                    )
                  }
                  className="p-2 bg-card rounded-lg text-sm font-semibold outline-none"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) =>
                    setDaySettings((prev) =>
                      prev.map((d) => (d.dayOfWeek === day.dayOfWeek ? { ...d, endTime: e.target.value } : d))
                    )
                  }
                  className="p-2 bg-card rounded-lg text-sm font-semibold outline-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Date Blocks */}
      <div className="card-elevated p-4 space-y-3">
        <h3 className="font-black">🚫 Bloqueio de datas</h3>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Data
            </label>
            <input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-field mt-1"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              placeholder="Ex: Feriado"
              maxLength={100}
              className="input-field mt-1"
            />
          </div>
          <button
            onClick={handleAddBlock}
            disabled={!newBlockDate}
            className="p-3.5 rounded-xl text-white shrink-0 disabled:opacity-50"
            style={{ background: palette.hex }}
          >
            <Icons.PlusCircle />
          </button>
        </div>

        {blocks.length > 0 && (
          <div className="space-y-2 mt-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div>
                  <p className="font-bold text-sm">
                    {new Date(b.blockedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                </div>
                <button
                  onClick={() => handleRemoveBlock(b.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilitySettingsView;
