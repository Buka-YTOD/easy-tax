import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { AssetDeclaration } from '@/types/tax';

function mapRow(row: any): AssetDeclaration {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    userId: row.user_id,
    assetType: row.asset_type,
    description: row.description,
    location: row.location,
    dateAcquired: row.date_acquired,
    cost: Number(row.cost),
    currentValue: Number(row.current_value),
  };
}

export function useAssetDeclarations() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['assetDeclarations', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<AssetDeclaration[]> => {
      if (!scenarioId) return [];
      const { data, error } = await supabase
        .from('asset_declarations')
        .select('*')
        .eq('scenario_id', scenarioId);
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    enabled: !!scenarioId,
  });
}

export function useAddAssetDeclaration() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<AssetDeclaration, 'id' | 'scenarioId' | 'userId'>) => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const { data, error } = await supabase
        .from('asset_declarations')
        .insert({
          scenario_id: returnData.activeScenario.id,
          user_id: user.id,
          asset_type: item.assetType,
          description: item.description,
          location: item.location,
          date_acquired: item.dateAcquired,
          cost: item.cost,
          current_value: item.currentValue,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetDeclarations', selectedTaxYear] });
    },
  });
}

export function useDeleteAssetDeclaration() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('asset_declarations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetDeclarations', selectedTaxYear] });
    },
  });
}
