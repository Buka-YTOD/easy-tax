import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { CapitalAllowance } from '@/types/tax';

function mapRow(row: any): CapitalAllowance {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    userId: row.user_id,
    assetDescription: row.asset_description,
    cost: Number(row.cost),
    ratePercent: Number(row.rate_percent),
    allowanceAmount: Number(row.allowance_amount),
    yearAcquired: row.year_acquired,
  };
}

export function useCapitalAllowances() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['capitalAllowances', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<CapitalAllowance[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('capital_allowances')
        .select('*')
        .eq('scenario_id', scenarioId);
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!scenarioId,
  });
}

export function useAddCapitalAllowance() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<CapitalAllowance, 'id' | 'scenarioId' | 'userId'>) => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const { data, error } = await supabase
        .from('capital_allowances')
        .insert({
          scenario_id: returnData.activeScenario.id,
          user_id: user.id,
          asset_description: item.assetDescription,
          cost: item.cost,
          rate_percent: item.ratePercent,
          allowance_amount: item.allowanceAmount,
          year_acquired: item.yearAcquired,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalAllowances', selectedTaxYear] });
    },
  });
}

export function useDeleteCapitalAllowance() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('capital_allowances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalAllowances', selectedTaxYear] });
    },
  });
}
