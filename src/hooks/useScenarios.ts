import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn, type ReturnScenario } from './useTaxReturn';

export function useScenarios() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();

  return useQuery({
    queryKey: ['scenarios', returnData?.taxReturn?.id],
    queryFn: async (): Promise<ReturnScenario[]> => {
      if (!returnData?.taxReturn) return [];
      const { data, error } = await supabase
        .from('return_scenarios')
        .select('*')
        .eq('return_id', returnData.taxReturn.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReturnScenario[];
    },
    enabled: !!returnData?.taxReturn,
  });
}

export function useCreateScenario() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!returnData?.taxReturn || !user) throw new Error('No active return');
      const { data, error } = await supabase
        .from('return_scenarios')
        .insert({
          return_id: returnData.taxReturn.id,
          user_id: user.id,
          name,
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ReturnScenario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios', returnData?.taxReturn?.id] });
    },
  });
}

export function useSwitchScenario() {
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scenarioId: string) => {
      if (!returnData?.taxReturn) throw new Error('No active return');
      // Deactivate all scenarios for this return
      await supabase
        .from('return_scenarios')
        .update({ is_active: false })
        .eq('return_id', returnData.taxReturn.id);
      // Activate the chosen one
      const { error } = await supabase
        .from('return_scenarios')
        .update({ is_active: true })
        .eq('id', scenarioId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxReturn'] });
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['capitalGains'] });
    },
  });
}
