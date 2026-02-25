import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';

export function useSubscription() {
  const { user, isAuthenticated } = useAppContext();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      setIsActive(false);
      return;
    }

    // Reset loading when auth state changes to prevent flash redirect
    setLoading(true);

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setIsActive(false); setLoading(false); return; }

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/paystack?action=status`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const result = await res.json();
        setIsActive(result.active);
      } catch {
        setIsActive(false);
      }
      setLoading(false);
    };

    check();
  }, [isAuthenticated, user]);

  return { isActive, loading };
}
