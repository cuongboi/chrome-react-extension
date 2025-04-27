import React from 'react';

import Dashboard from '@/components/board';
import { SprintSelector } from '@/components/board/sprint-selector';
import { getCurrentSprint } from '@/components/board/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useProjectStore, useSprint } from '@/storage/project';

import { Chart } from './chart';

export const Board: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [tab, setTab] = React.useState('board');
  const { currentSprint, setCurrentSprint } = useSprint();
  const { groups } = useProjectStore();

  // Set the current sprint on initial load
  React.useEffect(() => {
    if (!currentSprint) {
      setCurrentSprint(getCurrentSprint(Object.values(groups)));
    }
  }, [currentSprint]);

  return (
    <Tabs
      defaultValue="board"
      value={tab}
      onValueChange={(value) => {
        setTab(value);
      }}
      className={cn('flex-1 h-screen flex flex-col py-4 space-y-2', className)}
    >
      <div className="h-9 flex items-center justify-between px-4">
        <TabsList className="flex gap-2">
          <TabsTrigger value="board">Dashboard</TabsTrigger>
          <TabsTrigger value="chart">Gantt chart</TabsTrigger>
        </TabsList>
        {tab === 'board' && (
          <SprintSelector
            selectedSprint={currentSprint ?? ''}
            onSprintChange={setCurrentSprint}
          />
        )}
      </div>
      <TabsContent value="board">
        <Dashboard />
      </TabsContent>
      <TabsContent value="chart" asChild>
        <Chart className="flex-1 max-h-full px-4" />
      </TabsContent>
    </Tabs>
  );
};
