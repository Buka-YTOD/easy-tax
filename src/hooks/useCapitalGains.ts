import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { getStoredList, setStoredList } from '@/lib/mock-data';
import type { CapitalGainRecord } from '@/types/tax';

export function useCapitalGains() {
  const { selectedTaxYear } = useAppContext();
  return useQuery({
    queryKey: ['capitalGains', selectedTaxYear],
    queryFn: () => getStoredList<CapitalGainRecord>(`capitalGains_${selectedTaxYear}`),
  });
}

export function useAddCapitalGain() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CapitalGainRecord, 'id' | 'userId' | 'taxYear'>) => {
      const key = `capitalGains_${selectedTaxYear}`;
      const list = getStoredList<CapitalGainRecord>(key);
      const record: CapitalGainRecord = {
        id: crypto.randomUUID(),
        userId: 'usr_001',
        taxYear: selectedTaxYear,
        ...data,
      };
      list.push(record);
      setStoredList(key, list);
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGains', selectedTaxYear] });
    },
  });
}

export function useDeleteCapitalGain() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const key = `capitalGains_${selectedTaxYear}`;
      const list = getStoredList<CapitalGainRecord>(key);
      setStoredList(key, list.filter(r => r.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGains', selectedTaxYear] });
    },
  });
}
