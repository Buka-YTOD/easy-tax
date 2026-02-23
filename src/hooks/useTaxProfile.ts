import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/contexts/AppContext';
import { getStoredItem, setStoredItem } from '@/lib/mock-data';
import type { TaxProfile } from '@/types/tax';

export function useTaxProfile() {
  const { selectedTaxYear } = useAppContext();
  return useQuery({
    queryKey: ['taxProfile', selectedTaxYear],
    queryFn: () => getStoredItem<TaxProfile>(`taxProfile_${selectedTaxYear}`),
  });
}

export function useUpdateTaxProfile() {
  const { selectedTaxYear } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TaxProfile>) => {
      const key = `taxProfile_${selectedTaxYear}`;
      const existing = getStoredItem<TaxProfile>(key);
      const updated: TaxProfile = {
        id: existing?.id || crypto.randomUUID(),
        userId: 'usr_001',
        taxYear: selectedTaxYear,
        stateOfResidence: '',
        tin: '',
        filingType: 'Individual',
        isResident: true,
        ...existing,
        ...data,
      };
      setStoredItem(key, updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxProfile', selectedTaxYear] });
    },
  });
}
