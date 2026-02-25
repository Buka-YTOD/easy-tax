import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { CapitalGainRecord } from '@/types/tax';

function mapRow(row: any): CapitalGainRecord {
  return {
    id: row.id,
    userId: row.user_id,
    taxYear: 0,
    assetType: row.asset_type,
    proceeds: Number(row.proceeds),
    costBasis: Number(row.cost_basis),
    fees: Number(row.fees),
    realizedAt: row.realized_at || '',
  };
}

export function useCapitalGains() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['capitalGains', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<CapitalGainRecord[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('capital_gains')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!scenarioId,
  });
}

export function useAddCapitalGain() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CapitalGainRecord, 'id' | 'userId' | 'taxYear'>) => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const { data: row, error } = await supabase
        .from('capital_gains')
        .insert({
          scenario_id: returnData.activeScenario.id,
          user_id: user.id,
          asset_type: data.assetType,
          proceeds: data.proceeds,
          cost_basis: data.costBasis,
          fees: data.fees,
          realized_at: data.realizedAt || null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGains', selectedTaxYear] });
    },
  });
}

export function useDeleteCapitalGain() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_gains')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGains', selectedTaxYear] });
    },
  });
}
