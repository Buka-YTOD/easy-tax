import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { TaxComputation } from '@/types/tax';

// 2026 Nigerian Tax Act progressive brackets
const TAX_BRACKETS = [
  { lower: 0, upper: 800_000, rate: 0 },
  { lower: 800_000, upper: 3_200_000, rate: 0.15 },
  { lower: 3_200_000, upper: 12_000_000, rate: 0.18 },
  { lower: 12_000_000, upper: 25_000_000, rate: 0.21 },
  { lower: 25_000_000, upper: Infinity, rate: 0.25 },
];

/**
 * Consolidated Relief Allowance (CRA) — Nigerian Tax Act 2026
 * CRA = Higher of (1% of gross income OR ₦200,000) + 20% of gross income
 */
function computeCRA(grossIncome: number) {
  const onePercent = grossIncome * 0.01;
  const statutory = 200_000;
  const craBase = Math.max(onePercent, statutory);
  const twentyPercent = grossIncome * 0.20;
  const cra = craBase + twentyPercent;
  return { cra, craBase, onePercent, statutory, twentyPercent };
}

function computeProgressiveTax(taxableIncome: number) {
  const brackets: Array<{ bracket: string; taxableAmount: number; rate: number; tax: number }> = [];
  let taxOwed = 0;

  for (const b of TAX_BRACKETS) {
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, b.upper) - b.lower);
    const tax = taxableInBracket * b.rate;
    taxOwed += tax;
    brackets.push({
      bracket: `₦${b.lower.toLocaleString()} – ${b.upper === Infinity ? '∞' : '₦' + b.upper.toLocaleString()}`,
      taxableAmount: taxableInBracket,
      rate: b.rate,
      tax,
    });
  }

  return { taxOwed, brackets };
}

function mapRow(row: any): TaxComputation {
  return {
    id: row.id,
    userId: row.user_id,
    taxYear: 0,
    totalIncome: Number(row.total_income),
    taxableIncome: Number(row.taxable_income),
    taxOwed: Number(row.tax_owed),
    breakdownJson: typeof row.breakdown_json === 'string' ? row.breakdown_json : JSON.stringify(row.breakdown_json),
    computedAt: row.computed_at,
  };
}

export function useComputation() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const scenarioId = returnData?.activeScenario?.id;

  return useQuery({
    queryKey: ['computation', selectedTaxYear, scenarioId],
    queryFn: async (): Promise<TaxComputation | null> => {
      if (!scenarioId) return null;
      const { data, error } = await supabase
        .from('computations')
        .select('*')
        .eq('scenario_id', scenarioId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    enabled: !!scenarioId,
  });
}

export function useComputeTax() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user || !returnData?.activeScenario) throw new Error('No active scenario');
      const scenarioId = returnData.activeScenario.id;

      // Fetch income and capital gains from DB
      const { data: incomes } = await supabase
        .from('income_records')
        .select('*')
        .eq('scenario_id', scenarioId);

      const [gainsRes, deductionsRes] = await Promise.all([
        supabase.from('capital_gains').select('*').eq('scenario_id', scenarioId),
        supabase.from('deductions').select('*').eq('scenario_id', scenarioId),
      ]);

      const gains = gainsRes.data;
      const deductions = deductionsRes.data;

      const incomeTotal = (incomes ?? []).reduce((sum, r) => {
        if (r.frequency === 'Monthly') return sum + Number(r.amount) * 12;
        return sum + Number(r.amount);
      }, 0);

      const gainsTotal = (gains ?? []).reduce(
        (sum, r) => sum + (Number(r.proceeds) - Number(r.cost_basis) - Number(r.fees)),
        0
      );

      const deductionsTotal = (deductions ?? []).reduce(
        (sum, r) => sum + Number(r.amount),
        0
      );

      const grossIncome = incomeTotal + Math.max(0, gainsTotal);

      // Apply CRA (Consolidated Relief Allowance)
      const { cra, craBase, onePercent, statutory, twentyPercent } = computeCRA(grossIncome);

      // Taxable income = Gross Income - Statutory Deductions - CRA
      const taxableIncome = Math.max(0, grossIncome - deductionsTotal - cra);
      const { taxOwed, brackets } = computeProgressiveTax(taxableIncome);

      const breakdownJson = {
        brackets,
        grossIncome,
        cra: { total: cra, base: craBase, onePercent, statutory, twentyPercent },
        incomeByType: (incomes ?? []).reduce((acc: Record<string, number>, r) => {
          acc[r.type] = (acc[r.type] || 0) + (r.frequency === 'Monthly' ? Number(r.amount) * 12 : Number(r.amount));
          return acc;
        }, {}),
        capitalGainsTotal: gainsTotal,
        deductionsTotal,
        deductionsByType: (deductions ?? []).reduce((acc: Record<string, number>, r) => {
          acc[r.type] = (acc[r.type] || 0) + Number(r.amount);
          return acc;
        }, {}),
        monthlyPAYE: taxOwed / 12,
      };

      // Upsert: check if computation exists for this scenario
      const { data: existing } = await supabase
        .from('computations')
        .select('id')
        .eq('scenario_id', scenarioId)
        .maybeSingle();

      let row;
      if (existing) {
        const { data, error } = await supabase
          .from('computations')
          .update({
            total_income: grossIncome,
            taxable_income: taxableIncome,
            tax_owed: taxOwed,
            breakdown_json: breakdownJson,
            computed_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        row = data;
      } else {
        const { data, error } = await supabase
          .from('computations')
          .insert({
            scenario_id: scenarioId,
            user_id: user.id,
            total_income: grossIncome,
            taxable_income: taxableIncome,
            tax_owed: taxOwed,
            breakdown_json: breakdownJson,
          })
          .select()
          .single();
        if (error) throw error;
        row = data;
      }

      return mapRow(row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computation', selectedTaxYear] });
    },
  });
}
