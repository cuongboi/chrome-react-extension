// *** NPM ***
import React from 'react';
import ReactDOM from 'react-dom';

import { initTasks } from '../../../example/helpers';
// *** OTHER ***
import GanttOriginal from './GanttOriginal';

describe('[GanttOriginal.tsx] Render', () => {
  it('Renders w/o errors', () => {
    const tasks = initTasks();
    const div = document.createElement('div');
    ReactDOM.render(<GanttOriginal tasks={tasks} />, div);
  });
});
