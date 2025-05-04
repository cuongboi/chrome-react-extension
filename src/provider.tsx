import React from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/shallow';

import { useFetchProject } from './hook/useFetchProject';
import { ExportButton } from './project/export';
import { ProjectManager } from './project/project';
import { useColumnStore } from './storage/project';

type AppContextType = {};

export const AppContext = React.createContext({
  // octokit: {} as Octokit,
} as AppContextType);

export const AppProvider = React.memo(() => {
  useFetchProject({ watch: true });
  const columnMap = useColumnStore(useShallow((state) => state.columnMap));

  const buttons = React.useMemo<HTMLDivElement[]>(
    () => [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ],
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
          isReady={!!columnMap}
        />,
        buttons[0],
      )}
      {createPortal(
        <ProjectManager siblingClass={siblingClass} type="config" />,
        buttons[1],
      )}
      {createPortal(
        <ExportButton siblingClass={siblingClass} isReady={!!columnMap} />,
        buttons[2],
      )}
    </AppContext.Provider>
  );
});

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
