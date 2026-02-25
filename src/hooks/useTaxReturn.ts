import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';

export interface TaxReturn {
  id: string;
  user_id: string;
  tax_year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnScenario {
  id: string;
  return_id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches or auto-creates a tax return + default scenario for the selected year.
 * Returns the tax return and the active scenario.
 */
export function useTaxReturn() {
  const { user, selectedTaxYear } = useAppContext();

  return useQuery({
    queryKey: ['taxReturn', selectedTaxYear, user?.id],
    queryFn: async (): Promise<{ taxReturn: TaxReturn; activeScenario: ReturnScenario } | null> => {
      if (!user) return null;

      // Try to fetch existing return
      let { data: taxReturn } = await supabase
        .from('tax_returns')
        .select('*')
        .eq('user_id', user.id)
        .eq('tax_year', selectedTaxYear)
        .maybeSingle();

      // Auto-create if none exists
      if (!taxReturn) {
        const { data: newReturn, error: retErr } = await supabase
          .from('tax_returns')
          .insert({ user_id: user.id, tax_year: selectedTaxYear })
          .select()
          .single();
        if (retErr) throw retErr;
        taxReturn = newReturn;
      }

      // Fetch active scenario
      let { data: scenario } = await supabase
        .from('return_scenarios')
        .select('*')
        .eq('return_id', taxReturn.id)
        .eq('is_active', true)
        .maybeSingle();

      // Auto-create default scenario if none
      if (!scenario) {
        const { data: newScenario, error: scErr } = await supabase
          .from('return_scenarios')
          .insert({
            return_id: taxReturn.id,
            user_id: user.id,
            name: 'Scenario 1',
            is_active: true,
          })
          .select()
          .single();
        if (scErr) throw scErr;
        scenario = newScenario;
      }

      return {
        taxReturn: taxReturn as TaxReturn,
        activeScenario: scenario as ReturnScenario,
      };
    },
    enabled: !!user,
  });
}
