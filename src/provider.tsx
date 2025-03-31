import React from 'react';
import { createPortal } from 'react-dom';

import { ProjectManager } from './project/project';

type AppContextType = unknown;

export const AppContext = React.createContext({
  // api: {} as Octokit,
} as AppContextType);

export const AppProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const buttons = React.useMemo<HTMLDivElement[]>(
    () => [document.createElement('div'), document.createElement('div')],
    [],
  );
  const [siblingClass, setSiblingClass] = React.useState<string>('');

  React.useEffect(() => {
    setTimeout(() => {
      document.documentElement.classList.add(
        document.documentElement.getAttribute('data-color-mode') ?? 'light',
      );
    }, 100);

    const attackButton = document.querySelector<HTMLDivElement>(
      'button[aria-label="Project details"]',
    );

    setSiblingClass(attackButton?.classList.toString() ?? '');
    attackButton?.parentNode?.parentNode?.prepend(...buttons);
  }, []);

  return (
    <AppContext.Provider value={{}}>
      {createPortal(
        <ProjectManager siblingClass={siblingClass} type="chart" />,
        buttons[0],
      )}
      {createPortal(
        <ProjectManager siblingClass={siblingClass} type="config" />,
        buttons[1],
      )}
      {children}
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
