import { createRoot } from 'react-dom/client';

import { App } from './App';

const body = document.querySelector('body');
const app = document.createElement('div');
app.id = 'extension-content-root';

if (body) {
  body.querySelector('#extension-content-root')?.remove();
  body.prepend(app);

  const root = createRoot(app);
  root.render(<App />);
}
