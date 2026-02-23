import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AppContextType {
  selectedTaxYear: number;
  setSelectedTaxYear: (year: number) => void;
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: 'usr_001',
  email: 'adebayo@example.com',
  fullName: 'Adebayo Ogunlesi',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedTaxYear, setSelectedTaxYear] = useState<number>(() => {
    const stored = localStorage.getItem('selectedTaxYear');
    return stored ? parseInt(stored, 10) : 2026;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('selectedTaxYear', String(selectedTaxYear));
  }, [selectedTaxYear]);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AppContext.Provider
      value={{
        selectedTaxYear,
        setSelectedTaxYear,
        user: isAuthenticated ? MOCK_USER : null,
        isAuthenticated,
        login,
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
