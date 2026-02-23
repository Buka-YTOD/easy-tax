import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { getStoredItem, setStoredItem, getStoredList } from '@/lib/mock-data';
import type { TaxComputation, IncomeRecord, CapitalGainRecord } from '@/types/tax';

const TAX_BRACKETS = [
  { min: 0, max: 800_000, rate: 0 },
  { min: 800_001, max: 3_200_000, rate: 0.15 },
  { min: 3_200_001, max: 12_000_000, rate: 0.18 },
  { min: 12_000_001, max: 25_000_000, rate: 0.21 },
  { min: 25_000_001, max: Infinity, rate: 0.25 },
];

function computeProgressiveTax(totalIncome: number) {
  let remaining = totalIncome;
  let taxOwed = 0;
  const brackets: Array<{ bracket: string; taxableAmount: number; rate: number; tax: number }> = [];

  for (const b of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketWidth = b.max === Infinity ? remaining : b.max - b.min + 1;
    const taxable = Math.min(remaining, bracketWidth);
    const tax = taxable * b.rate;
    taxOwed += tax;
    remaining -= taxable;
    brackets.push({
      bracket: `₦${b.min.toLocaleString()} – ${b.max === Infinity ? '∞' : '₦' + b.max.toLocaleString()}`,
      taxableAmount: taxable,
      rate: b.rate,
      tax,
    });
  }

  return { taxOwed, brackets };
}

export function useComputation() {
  const { selectedTaxYear } = useAppContext();
  return useQuery({
    queryKey: ['computation', selectedTaxYear],
    queryFn: () => getStoredItem<TaxComputation>(`computation_${selectedTaxYear}`),
  });
}

export function useComputeTax() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const incomes = getStoredList<IncomeRecord>(`income_${selectedTaxYear}`);
      const gains = getStoredList<CapitalGainRecord>(`capitalGains_${selectedTaxYear}`);

      const incomeTotal = incomes.reduce((sum, r) => {
        if (r.frequency === 'Monthly') return sum + r.amount * 12;
        return sum + r.amount;
      }, 0);

      const gainsTotal = gains.reduce((sum, r) => sum + (r.proceeds - r.costBasis - r.fees), 0);
      const totalIncome = incomeTotal + Math.max(0, gainsTotal);
      const taxableIncome = totalIncome;
      const { taxOwed, brackets } = computeProgressiveTax(taxableIncome);

      const computation: TaxComputation = {
        id: crypto.randomUUID(),
        userId: 'usr_001',
        taxYear: selectedTaxYear,
        totalIncome,
        taxableIncome,
        taxOwed,
        breakdownJson: JSON.stringify({
          brackets,
          incomeByType: incomes.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + (r.frequency === 'Monthly' ? r.amount * 12 : r.amount);
            return acc;
          }, {} as Record<string, number>),
          capitalGainsTotal: gainsTotal,
        }),
        computedAt: new Date().toISOString(),
      };

      setStoredItem(`computation_${selectedTaxYear}`, computation);
      return computation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['computation', selectedTaxYear] });
    },
  });
}
