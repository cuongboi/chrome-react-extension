import { LRUCache } from 'lru-cache';
import React from 'react';
import { createPortal } from 'react-dom';

import { GHRegex } from '@/lib/contains';

import { ExportButton } from '../components/project/export';
import { ProjectManager } from '../components/project/project';
import { loadConfig } from '../lib/load-config';
import { useColumnStore, useProjectStore } from '../storage/project';

type AppContextType = {};

export const AppContext = React.createContext({} as AppContextType);

const loadAppConfig = async () => {
  return loadConfig().then((config) => {
    if (config) {
      useColumnStore.setState((state) => {
        return {
          ...state,
          ...config,
        };
      });

      useProjectStore.setState((state) => ({
        ...state,
        items: config.items,
        groups: config.groups,
      }));

      useProjectStore.getState().setBoardItems(config.items, config.columnMap);
    }
  });
};

export const AppProvider = React.memo(() => {
  const [isReady, setIsReady] = React.useState(false);

  const buttons = React.useMemo<HTMLDivElement[]>(
    () => [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ],
    [],
  );

  const [siblingClass, setSiblingClass] = React.useState<string>('');

  React.useEffect(() => {
    window.cache = new LRUCache({
      max: 100,
    });

    if (window.location.href.match(GHRegex)) {
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

      loadAppConfig().then(() => setIsReady(true));

      window.ev.removeAllListeners('extension:paginated_items');
      window.ev.on('extension:paginated_items', loadAppConfig);

      return () => {
        window.ev.removeAllListeners('extension:paginated_items');
      };
    }
  }, [window.location.href]);

  if (!window.location.href.match(GHRegex)) return null;

  return (
    <AppContext.Provider value={{}}>
      {createPortal(
        <ProjectManager
          siblingClass={siblingClass}
          type="chart"
          isReady={isReady}
        />,
        buttons[0],
      )}
      {createPortal(
        <ProjectManager siblingClass={siblingClass} type="config" />,
        buttons[1],
      )}
      {createPortal(
        <ExportButton siblingClass={siblingClass} isReady={isReady} />,
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
