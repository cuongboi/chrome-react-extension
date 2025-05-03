'use client';

import { useProjectStore, useSprint } from '@/storage/project';

import { DashboardShell } from './dashboard-shell';
import { SprintBurndownChart } from './sprint-burndown-chart';
import { SprintProgressCards } from './sprint-progress-cards';
import { SprintVelocityChart } from './sprint-velocity-chart';
import { TaskCompletionChart } from './task-completion-chart';
import { TaskList } from './task-list';
import { TeamWorkloadChart } from './team-workload-chart';

export default function Dashboard() {
  const { currentSprint } = useSprint();
  const { boarditems } = useProjectStore();

  // Don't render until we have a selected sprint
  if (!currentSprint) {
    return (
      <div className="flex min-h-full items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <DashboardShell>
      <SprintProgressCards selectedSprint={currentSprint} items={boarditems} />
      <div className="grid gap-6 lg:grid-cols-4">
        <SprintBurndownChart
          selectedSprint={currentSprint}
          items={boarditems}
        />
        <SprintVelocityChart
          selectedSprint={currentSprint}
          items={boarditems}
        />
        <TaskCompletionChart
          selectedSprint={currentSprint}
          items={boarditems}
        />
        <TeamWorkloadChart selectedSprint={currentSprint} items={boarditems} />
        <TaskList
          items={boarditems}
          selectedSprint={currentSprint}
          className="col-span-4"
        />
      </div>
    </DashboardShell>
  );
}
