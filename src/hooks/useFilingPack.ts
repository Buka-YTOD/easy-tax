import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { getStoredItem, setStoredItem, getStoredList } from '@/lib/mock-data';
import type { FilingPack, TaxComputation, TaxProfile, IncomeRecord, CapitalGainRecord } from '@/types/tax';

export function useFilingPack() {
  const { selectedTaxYear } = useAppContext();
  return useQuery({
    queryKey: ['filingPack', selectedTaxYear],
    queryFn: () => getStoredItem<FilingPack>(`filingPack_${selectedTaxYear}`),
  });
}

export function useGenerateFilingPack() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const profile = getStoredItem<TaxProfile>(`taxProfile_${selectedTaxYear}`);
      const computation = getStoredItem<TaxComputation>(`computation_${selectedTaxYear}`);
      const incomes = getStoredList<IncomeRecord>(`income_${selectedTaxYear}`);
      const gains = getStoredList<CapitalGainRecord>(`capitalGains_${selectedTaxYear}`);

      const summary = {
        taxYear: selectedTaxYear,
        profile: profile || { status: 'Not configured' },
        computation: computation
          ? {
              totalIncome: computation.totalIncome,
              taxableIncome: computation.taxableIncome,
              taxOwed: computation.taxOwed,
              computedAt: computation.computedAt,
            }
          : { status: 'Not computed' },
        incomeRecords: incomes.length,
        capitalGainRecords: gains.length,
        generatedAt: new Date().toISOString(),
      };

      const pack: FilingPack = {
        id: crypto.randomUUID(),
        userId: 'usr_001',
        taxYear: selectedTaxYear,
        summaryJson: JSON.stringify(summary),
        status: computation ? 'Ready' : 'Draft',
        generatedAt: new Date().toISOString(),
      };

      setStoredItem(`filingPack_${selectedTaxYear}`, pack);
      return pack;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filingPack', selectedTaxYear] });
    },
  });
}
