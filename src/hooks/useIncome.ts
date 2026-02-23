import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { getStoredList, setStoredList } from '@/lib/mock-data';
import type { IncomeRecord } from '@/types/tax';

export function useIncome() {
  const { selectedTaxYear } = useAppContext();
  return useQuery({
    queryKey: ['income', selectedTaxYear],
    queryFn: () => getStoredList<IncomeRecord>(`income_${selectedTaxYear}`),
  });
}

export function useAddIncome() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<IncomeRecord, 'id' | 'userId' | 'taxYear' | 'createdAt'>) => {
      const key = `income_${selectedTaxYear}`;
      const list = getStoredList<IncomeRecord>(key);
      const record: IncomeRecord = {
        id: crypto.randomUUID(),
        userId: 'usr_001',
        taxYear: selectedTaxYear,
        createdAt: new Date().toISOString(),
        ...data,
      };
      list.push(record);
      setStoredList(key, list);
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', selectedTaxYear] });
    },
  });
}

export function useDeleteIncome() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const key = `income_${selectedTaxYear}`;
      const list = getStoredList<IncomeRecord>(key);
      setStoredList(key, list.filter(r => r.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', selectedTaxYear] });
    },
  });
}
