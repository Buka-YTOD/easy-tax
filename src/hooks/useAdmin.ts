import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';

export function useIsAdmin() {
  const { user } = useAppContext();

  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });
}

export interface AdminUser {
  userId: string;
  fullName: string;
  email: string;
  taxYear: number;
  status: string;
  totalIncome: number;
  taxOwed: number;
  computedAt: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      // Fetch all profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      if (pErr) throw pErr;

      // Fetch all tax returns
      const { data: returns, error: rErr } = await supabase
        .from('tax_returns')
        .select('id, user_id, tax_year, status');
      if (rErr) throw rErr;

      // Fetch all computations
      const { data: computations, error: cErr } = await supabase
        .from('computations')
        .select('scenario_id, total_income, tax_owed, computed_at');
      if (cErr) throw cErr;

      // Fetch all income to get totals
      const { data: incomes, error: iErr } = await supabase
        .from('income_records')
        .select('user_id, amount');
      if (iErr) throw iErr;

      // Build user map
      const profileMap = new Map(profiles.map(p => [p.user_id, p.full_name]));
      
      const users: AdminUser[] = returns.map(r => {
        const comp = computations.find(c => {
          // We need scenario for this return - just match by any comp for now
          return true; // simplified - admin view shows latest
        });
        const userIncomeTotal = incomes
          .filter(i => i.user_id === r.user_id)
          .reduce((sum, i) => sum + Number(i.amount), 0);

        return {
          userId: r.user_id,
          fullName: profileMap.get(r.user_id) || 'Unknown',
          email: '',
          taxYear: r.tax_year,
          status: r.status,
          totalIncome: userIncomeTotal,
          taxOwed: 0,
          computedAt: null,
        };
      });

      return users;
    },
  });
}

export function useAdminFlags() {
  return useQuery({
    queryKey: ['adminFlags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_flags')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
