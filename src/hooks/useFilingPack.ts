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

      // Gather full data for the document
      const [profileRes, computationRes, incomesRes, gainsRes, deductionsRes] = await Promise.all([
        supabase.from('tax_profiles').select('*').eq('return_id', returnId).maybeSingle(),
        supabase.from('computations').select('*').eq('scenario_id', scenarioId).maybeSingle(),
        supabase.from('income_records').select('*').eq('scenario_id', scenarioId),
        supabase.from('capital_gains').select('*').eq('scenario_id', scenarioId),
        supabase.from('deductions').select('*').eq('scenario_id', scenarioId),
      ]);

      const computation = computationRes.data;
      const profile = profileRes.data;

      const summary = {
        taxYear: selectedTaxYear,
        profile: profile
          ? {
              stateOfResidence: profile.state_of_residence,
              tin: profile.tin,
              filingType: profile.filing_type,
              isResident: profile.is_resident,
            }
          : null,
        computation: computation
          ? {
              totalIncome: Number(computation.total_income),
              taxableIncome: Number(computation.taxable_income),
              taxOwed: Number(computation.tax_owed),
              breakdownJson: computation.breakdown_json,
              computedAt: computation.computed_at,
            }
          : null,
        incomeRecords: (incomesRes.data || []).map((r: any) => ({
          type: r.type,
          amount: Number(r.amount),
          frequency: r.frequency,
          description: r.description,
        })),
        capitalGains: (gainsRes.data || []).map((r: any) => ({
          assetType: r.asset_type,
          proceeds: Number(r.proceeds),
          costBasis: Number(r.cost_basis),
          fees: Number(r.fees),
          gain: Number(r.proceeds) - Number(r.cost_basis) - Number(r.fees),
        })),
        deductions: (deductionsRes.data || []).map((r: any) => ({
          type: r.type,
          amount: Number(r.amount),
          description: r.description,
        })),
        generatedAt: new Date().toISOString(),
      };

      const status = computation ? 'ready' : 'draft';

      const { data: row, error } = await supabase
        .from('generated_forms')
        .insert({
          scenario_id: scenarioId,
          user_id: user.id,
          form_type: profile?.filing_type === 'Business' ? 'form_h' : 'form_a',
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
