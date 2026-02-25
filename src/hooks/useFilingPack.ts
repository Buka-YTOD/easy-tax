import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { FilingPack } from '@/types/tax';

function mapRow(row: any): FilingPack {
  return {
    id: row.id,
    userId: row.user_id,
    taxYear: 0,
    summaryJson: typeof row.summary_json === 'string' ? row.summary_json : JSON.stringify(row.summary_json),
    status: row.status === 'draft' ? 'Draft' : row.status === 'ready' ? 'Ready' : 'Draft',
    generatedAt: row.generated_at,
  };
}

export function useFilingPack() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['filingPack', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<FilingPack | null> => {
      if (!scenarioId) return null;
      const { data, error } = await supabase
        .from('generated_forms')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    enabled: !!scenarioId,
  });
}

export function useGenerateFilingPack() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const scenarioId = returnData.activeScenario.id;
      const returnId = returnData.taxReturn.id;

      // Gather data for summary
      const [profileRes, computationRes, incomesRes, gainsRes] = await Promise.all([
        supabase.from('tax_profiles').select('*').eq('return_id', returnId).maybeSingle(),
        supabase.from('computations').select('*').eq('scenario_id', scenarioId).maybeSingle(),
        supabase.from('income_records').select('id').eq('scenario_id', scenarioId),
        supabase.from('capital_gains').select('id').eq('scenario_id', scenarioId),
      ]);

      const computation = computationRes.data;
      const summary = {
        taxYear: selectedTaxYear,
        profile: profileRes.data
          ? { stateOfResidence: profileRes.data.state_of_residence, tin: profileRes.data.tin, filingType: profileRes.data.filing_type }
          : { status: 'Not configured' },
        computation: computation
          ? {
              totalIncome: Number(computation.total_income),
              taxableIncome: Number(computation.taxable_income),
              taxOwed: Number(computation.tax_owed),
              computedAt: computation.computed_at,
            }
          : { status: 'Not computed' },
        incomeRecords: incomesRes.data?.length ?? 0,
        capitalGainRecords: gainsRes.data?.length ?? 0,
        generatedAt: new Date().toISOString(),
      };

      const status = computation ? 'ready' : 'draft';

      const { data: row, error } = await supabase
        .from('generated_forms')
        .insert({
          scenario_id: scenarioId,
          user_id: user.id,
          form_type: 'form_a',
          status,
          summary_json: summary,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filingPack', selectedTaxYear] });
    },
  });
}
