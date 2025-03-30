import { createRoot } from 'react-dom/client';

import { ProjectManager } from './project/project';
import { AppProvider } from './provider';

const chart = document.createElement('div');
chart.id = 'extension-project-manager-chart';

const config = document.createElement('div');
config.id = 'extension-project-manager-config';

const intv = setInterval(() => {
  const body = document.querySelector('body');

  if (body) {
    body
      .querySelectorAll(
        '#extension-project-manager-chart, #extension-project-manager-config',
      )
      .forEach((el) => el.remove());
    const attackButton = body.querySelector<HTMLDivElement>(
      'button[aria-label="Project details"]',
    );

    if (attackButton) {
      clearInterval(intv);
      attackButton.parentNode?.parentNode?.prepend(chart, config);

      const chartRoot = createRoot(chart);
      chartRoot.render(
        <AppProvider>
          <ProjectManager
            siblingClass={attackButton.classList.toString()}
            type="chart"
          />
        </AppProvider>,
      );

      const configRoot = createRoot(config);
      configRoot.render(
        <AppProvider>
          <ProjectManager
            siblingClass={attackButton.classList.toString()}
            type="config"
          />
        </AppProvider>,
      );
    }
  }
}, 500);
