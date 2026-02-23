import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { getStoredList, setStoredList } from '@/lib/mock-data';
import type { DeductionRecord } from '@/types/guided';

export function useDeductions() {
  const { selectedTaxYear } = useAppContext();
  return useQuery({
    queryKey: ['deductions', selectedTaxYear],
    queryFn: () => getStoredList<DeductionRecord>(`deductions_${selectedTaxYear}`),
  });
}

export function useAddDeduction() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<DeductionRecord, 'id' | 'userId' | 'taxYear' | 'createdAt'>) => {
      const key = `deductions_${selectedTaxYear}`;
      const list = getStoredList<DeductionRecord>(key);
      const record: DeductionRecord = {
        id: crypto.randomUUID(),
        userId: 'usr_001',
        taxYear: selectedTaxYear,
        createdAt: new Date().toISOString(),
        ...data,
      };
      setStoredList(key, [...list, record]);
      return record;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deductions', selectedTaxYear] }),
  });
}

export function useDeleteDeduction() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const key = `deductions_${selectedTaxYear}`;
      const list = getStoredList<DeductionRecord>(key);
      setStoredList(key, list.filter((r) => r.id !== id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deductions', selectedTaxYear] }),
  });
}
