import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { DeductionRecord } from '@/types/guided';

function mapRow(row: any): DeductionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    taxYear: 0,
    type: row.type,
    amount: Number(row.amount),
    description: row.description || '',
    createdAt: row.created_at,
  };
}

export function useDeductions() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['deductions', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<DeductionRecord[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('deductions')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!scenarioId,
  });
}

export function useAddDeduction() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DeductionRecord, 'id' | 'userId' | 'taxYear' | 'createdAt'>) => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const { data: row, error } = await supabase
        .from('deductions')
        .insert({
          scenario_id: returnData.activeScenario.id,
          user_id: user.id,
          type: data.type,
          amount: data.amount,
          description: data.description || '',
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deductions', selectedTaxYear] });
    },
  });
}

export function useDeleteDeduction() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deductions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deductions', selectedTaxYear] });
    },
  });
}
