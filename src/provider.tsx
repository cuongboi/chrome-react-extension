import React from 'react';
import { createPortal } from 'react-dom';

import { useFetchProject } from './hook/useFetchProject';
import { ProjectManager } from './project/project';
import { useColumnStore } from './storage/project';

type AppContextType = unknown;

export const AppContext = React.createContext({
  // api: {} as Octokit,
} as AppContextType);

export const AppProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { columnMap } = useColumnStore();
  const { isReady } = useFetchProject({ watch: true });

  const buttons = React.useMemo<HTMLDivElement[]>(
    () => [document.createElement('div'), document.createElement('div')],
    [],
  );
  const [siblingClass, setSiblingClass] = React.useState<string>('');

  React.useLayoutEffect(() => {
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
        <ProjectManager
          siblingClass={siblingClass}
          type="chart"
          isReady={!!columnMap && isReady}
        />,
        buttons[0],
      )}
      {createPortal(
        <ProjectManager
          siblingClass={siblingClass}
          type="config"
          isReady={!!columnMap && isReady}
        />,
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
