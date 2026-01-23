import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/psicodoc';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useAppointments = (
  appointments: Appointment[],
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const addAppointment = useCallback(async (appointmentData: {
    patientId: string;
    patientName: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          patient_id: appointmentData.patientId,
          patient_name: appointmentData.patientName,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          notes: appointmentData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newAppointment: Appointment = {
        id: data.id,
        date: data.appointment_date,
        time: data.appointment_time,
        patientName: data.patient_name,
        patientId: data.patient_id || undefined,
      };

      setAppointments(prev => {
        const updated = [...prev, newAppointment];
        return updated.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        });
      });

      toast({
        title: 'Agendamento criado!',
        description: `Consulta marcada para ${appointmentData.date} às ${appointmentData.time}.`,
      });

      return newAppointment;
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: 'Erro ao criar agendamento',
        description: 'Não foi possível criar o agendamento.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, setAppointments, toast]);

  const deleteAppointment = useCallback(async (appointmentId: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAppointments(prev => prev.filter(a => a.id !== appointmentId));

      toast({
        title: 'Agendamento removido',
        description: 'O agendamento foi cancelado.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erro ao remover agendamento',
        description: 'Não foi possível cancelar o agendamento.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setAppointments, toast]);

  const updateAppointment = useCallback(async (appointmentId: string, updates: {
    date?: string;
    time?: string;
    notes?: string;
  }) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const updateData: any = {};
      if (updates.date) updateData.appointment_date = updates.date;
      if (updates.time) updateData.appointment_time = updates.time;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAppointments(prev => {
        const updated = prev.map(a => {
          if (a.id !== appointmentId) return a;
          return {
            ...a,
            date: updates.date || a.date,
            time: updates.time || a.time,
          };
        });
        return updated.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        });
      });

      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro ao atualizar agendamento',
        description: 'Não foi possível atualizar o agendamento.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setAppointments, toast]);

  return {
    addAppointment,
    deleteAppointment,
    updateAppointment,
    isLoading,
  };
};
