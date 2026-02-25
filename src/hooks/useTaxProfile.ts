import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from './useTaxReturn';
import type { TaxProfile } from '@/types/tax';

function mapRow(row: any): TaxProfile {
  return {
    id: row.id,
    userId: row.user_id,
    taxYear: 0,
    stateOfResidence: row.state_of_residence,
    tin: row.tin,
    filingType: row.filing_type,
    isResident: row.is_resident,
    maritalStatus: row.marital_status || 'Single',
    spouseName: row.spouse_name || '',
    numChildren: row.num_children || 0,
    dateOfBirth: row.date_of_birth || null,
    sex: row.sex || '',
    employerName: row.employer_name || '',
    employerAddress: row.employer_address || '',
    employerTin: row.employer_tin || '',
    occupation: row.occupation || '',
    residentialAddress: row.residential_address || '',
    lga: row.lga || '',
  };
}

export function useTaxProfile() {
  const { selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const returnId = returnData?.taxReturn?.id;

  return useQuery({
    queryKey: ['taxProfile', selectedTaxYear, returnId],
    queryFn: async (): Promise<TaxProfile | null> => {
      if (!returnId) return null;
      const { data, error } = await supabase
        .from('tax_profiles')
        .select('*')
        .eq('return_id', returnId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    enabled: !!returnId,
  });
}

export function useUpdateTaxProfile() {
  const { user, selectedTaxYear } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TaxProfile>) => {
      if (!user || !returnData?.taxReturn) throw new Error('No active return');
      const returnId = returnData.taxReturn.id;

      // Check if profile exists
      const { data: existing } = await supabase
        .from('tax_profiles')
        .select('id')
        .eq('return_id', returnId)
        .maybeSingle();

      if (existing) {
        const { data: row, error } = await supabase
          .from('tax_profiles')
          .update({
            state_of_residence: data.stateOfResidence,
            tin: data.tin,
            filing_type: data.filingType,
            is_resident: data.isResident,
            marital_status: data.maritalStatus,
            spouse_name: data.spouseName,
            num_children: data.numChildren,
            date_of_birth: data.dateOfBirth || null,
            sex: data.sex,
            employer_name: data.employerName,
            employer_address: data.employerAddress,
            employer_tin: data.employerTin,
            occupation: data.occupation,
            residential_address: data.residentialAddress,
            lga: data.lga,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return mapRow(row);
      } else {
        const { data: row, error } = await supabase
          .from('tax_profiles')
          .insert({
            return_id: returnId,
            user_id: user.id,
            state_of_residence: data.stateOfResidence ?? '',
            tin: data.tin ?? '',
            filing_type: data.filingType ?? 'Individual',
            is_resident: data.isResident ?? true,
            marital_status: data.maritalStatus ?? 'Single',
            spouse_name: data.spouseName ?? '',
            num_children: data.numChildren ?? 0,
            date_of_birth: data.dateOfBirth || null,
            sex: data.sex ?? '',
            employer_name: data.employerName ?? '',
            employer_address: data.employerAddress ?? '',
            employer_tin: data.employerTin ?? '',
            occupation: data.occupation ?? '',
            residential_address: data.residentialAddress ?? '',
            lga: data.lga ?? '',
          })
          .select()
          .single();
        if (error) throw error;
        return mapRow(row);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxProfile', selectedTaxYear] });
    },
  });
}
