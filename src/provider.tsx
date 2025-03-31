import React from 'react';
import { Toaster } from 'sonner';

type AppContextType = unknown;

export const AppContext = React.createContext({
  // api: {} as Octokit,
} as AppContextType);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  React.useEffect(() => {
    setTimeout(() => {
      document.documentElement.classList.add(
        document.documentElement.getAttribute('data-color-mode') ?? 'light',
      );
    }, 100);
  }, []);

  return (
    <AppContext.Provider value={{}}>
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
