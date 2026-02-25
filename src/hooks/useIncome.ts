import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { IncomeRecord } from '@/types/tax';

/**
 * Maps a DB row to the IncomeRecord interface used by pages.
 */
function mapRow(row: any): IncomeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    taxYear: 0, // not stored per-record, derived from scenario/return
    type: row.type,
    amount: Number(row.amount),
    frequency: row.frequency,
    metadataJson: row.description || '',
    createdAt: row.created_at,
  };
}

export function useIncome() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['income', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<IncomeRecord[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('income_records')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!scenarioId,
  });
}

export function useAddIncome() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<IncomeRecord, 'id' | 'userId' | 'taxYear' | 'createdAt'>) => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const { data: row, error } = await supabase
        .from('income_records')
        .insert({
          scenario_id: returnData.activeScenario.id,
          user_id: user.id,
          type: data.type,
          amount: data.amount,
          frequency: data.frequency,
          description: data.metadataJson || '',
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', selectedTaxYear] });
    },
  });
}

export function useDeleteIncome() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', selectedTaxYear] });
    },
  });
}
