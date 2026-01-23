import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/psicodoc';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const usePatients = (
  patients: Patient[],
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const addPatient = useCallback(async (patientData: {
    name: string;
    responsibleName?: string;
    responsiblePhone?: string;
    birthDate?: string;
  }) => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: patientData.name,
          responsible_name: patientData.responsibleName || null,
          responsible_phone: patientData.responsiblePhone || null,
          birth_date: patientData.birthDate || null,
          notes: [],
        })
        .select()
        .single();

      if (error) throw error;

      const newPatient: Patient = {
        id: data.id,
        name: data.name,
        responsibleName: data.responsible_name || '',
        birthDate: data.birth_date || '',
        responsiblePhone: data.responsible_phone || '',
        notes: [],
        files: [],
      };

      setPatients(prev => [newPatient, ...prev]);
      
      toast({
        title: 'Paciente adicionado!',
        description: `${patientData.name} foi cadastrado com sucesso.`,
      });

      return newPatient;
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: 'Erro ao adicionar paciente',
        description: 'Não foi possível cadastrar o paciente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, setPatients, toast]);

  const updatePatient = useCallback(async (patientId: string, updates: Partial<Patient>) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: updates.name,
          responsible_name: updates.responsibleName,
          responsible_phone: updates.responsiblePhone,
          birth_date: updates.birthDate || null,
          notes: updates.notes as any,
        })
        .eq('id', patientId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPatients(prev => prev.map(p => 
        p.id === patientId ? { ...p, ...updates } : p
      ));

      return true;
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: 'Erro ao atualizar paciente',
        description: 'Não foi possível atualizar os dados.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setPatients, toast]);

  const deletePatient = useCallback(async (patientId: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPatients(prev => prev.filter(p => p.id !== patientId));

      toast({
        title: 'Paciente removido',
        description: 'O paciente foi removido com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: 'Erro ao remover paciente',
        description: 'Não foi possível remover o paciente.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setPatients, toast]);

  const addSessionNote = useCallback(async (patientId: string, note: {
    text: string;
    mood?: string;
  }) => {
    if (!user) return false;

    const patient = patients.find(p => p.id === patientId);
    if (!patient) return false;

    const newNote = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      text: note.text,
      mood: note.mood,
    };

    const updatedNotes = [...(patient.notes || []), newNote];

    return updatePatient(patientId, { notes: updatedNotes });
  }, [patients, user, updatePatient]);

  return {
    addPatient,
    updatePatient,
    deletePatient,
    addSessionNote,
    isLoading,
  };
};
