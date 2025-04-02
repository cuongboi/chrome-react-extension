import EventEmitter from 'events';
import { createRoot } from 'react-dom/client';

import { AppProvider } from './provider';

declare global {
  interface Window {
    ev: EventEmitter;
  }
}

window.ev = new EventEmitter();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'extension:paginated_items') {
    window.ev.emit(message.type, message);
  }
});

const app = document.createElement('div');
app.id = 'extension-project-manager-app';

const body = document.querySelector('body');

if (body) {
  body.appendChild(app);

  const appRoot = createRoot(app);
  appRoot.render(<AppProvider />);
}
