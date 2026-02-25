import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { BenefitInKind } from '@/types/tax';

function mapRow(row: any): BenefitInKind {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    userId: row.user_id,
    category: row.category,
    description: row.description,
    annualValue: Number(row.annual_value),
  };
}

export function useBenefitsInKind() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['benefitsInKind', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<BenefitInKind[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('benefits_in_kind')
        .select('*')
        .eq('scenario_id', scenarioId);
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!scenarioId,
  });
}

export function useAddBenefitInKind() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<BenefitInKind, 'id' | 'scenarioId' | 'userId'>) => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const { data, error } = await supabase
        .from('benefits_in_kind')
        .insert({
          scenario_id: returnData.activeScenario.id,
          user_id: user.id,
          category: item.category,
          description: item.description,
          annual_value: item.annualValue,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitsInKind', selectedTaxYear] });
    },
  });
}

export function useDeleteBenefitInKind() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('benefits_in_kind').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitsInKind', selectedTaxYear] });
    },
  });
}
