import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { identifyUser, resetUser, setSuperProperties } from '@/lib/mixpanel';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  state: string;
}

interface AppContextType {
  selectedTaxYear: number;
  setSelectedTaxYear: (year: number) => void;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedTaxYear, setSelectedTaxYear] = useState<number>(() => {
    const stored = localStorage.getItem('selectedTaxYear');
    return stored ? parseInt(stored, 10) : 2026;
  });

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('selectedTaxYear', String(selectedTaxYear));
  }, [selectedTaxYear]);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          identifyUser(session.user.id, {
            '$email': session.user.email,
            '$name': session.user.user_metadata?.full_name,
          });
          setSuperProperties({ user_id: session.user.id });
          setTimeout(async () => {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            setProfile(data as Profile | null);
            if (data) {
              setSuperProperties({
                state: (data as Profile).state,
                full_name: (data as Profile).full_name,
              });
            }
          }, 0);
        } else {
          resetUser();
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data as Profile | null);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppContext.Provider
      value={{
        selectedTaxYear,
        setSelectedTaxYear,
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
