import EventEmitter from 'events';
import type { LRUCache } from 'lru-cache';
import { createRoot } from 'react-dom/client';

import { AppProvider } from './providers/app-provider';
import type { ColumnMapValue } from './storage/project';

declare global {
  interface Window {
    ev: EventEmitter;
    holidays: Date[];
    config: {
      columns: Record<string, any>;
      columnMap: ColumnMapValue;
    };
    cache: LRUCache<{}, {}, unknown>;
  }
}

window.ev = new EventEmitter();
window.holidays = [];

// Overide console.error to prevent warnings from being shown in the console
console.error = () => {};

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
