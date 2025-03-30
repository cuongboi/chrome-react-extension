// *** NPM ***
import React from 'react';
import ReactDOM from 'react-dom';

import { initTasks } from '../../../example/helpers';
// *** OTHER ***
import GanttNationalResources from './GanttNationalResources';

describe('[GanttNationalResources.tsx] Render', () => {
  it('Renders w/o errors', () => {
    const tasks = initTasks();
    const div = document.createElement('div');
    ReactDOM.render(<GanttNationalResources tasks={tasks} />, div);
  });
});
