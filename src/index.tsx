import { createRoot } from 'react-dom/client';

import { AppProvider } from './provider';

const app = document.createElement('div');
app.id = 'extension-project-manager-app';

const intv = setInterval(() => {
  const body = document.querySelector('body');

  if (body) {
    body.appendChild(app);
    clearInterval(intv);
    const appRoot = createRoot(app);
    appRoot.render(<AppProvider />);
  }
}, 500);
