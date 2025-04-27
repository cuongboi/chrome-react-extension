import { ArrowUp, CheckCircle, Clock, ListTodo } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useColumnStore, useProjectStore } from '@/storage/project';
import type { TaskItem } from '@/types';

import {
  getSprintProgress,
  getPrevSprint,
  getTasksForSprint,
  getSprintTaskComplete,
  calcStoryPoints,
} from './utils';

interface SprintProgressCardsProps {
  selectedSprint: string;
  items: TaskItem[];
}

export function SprintProgressCards({
  selectedSprint,
  items,
}: SprintProgressCardsProps) {
  const { groups } = useProjectStore();
  const { columnMap: mapWithPathname } = useColumnStore();
  const columnMap = mapWithPathname[window.location.pathname];
  const prevSprint = getPrevSprint(Object.values(groups), selectedSprint);
  const sprintTasks = React.useMemo(
    () => getTasksForSprint(items, selectedSprint),
    [items, selectedSprint],
  );
  const prevSprintTasks = React.useMemo(
    () => getTasksForSprint(items, prevSprint),
    [items, prevSprint],
  );

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayCompletedTasks = getSprintTaskComplete(
    sprintTasks,
    columnMap.statusEnd,
    today,
  );
  const yesterdayCompletedTasks = getSprintTaskComplete(
    sprintTasks,
    columnMap.statusEnd,
    yesterday,
  );

  const { percent, day, totalDays } = getSprintProgress(
    Object.values(groups),
    selectedSprint,
  );

  const totalTasks = sprintTasks.length;
  const completedTasks = todayCompletedTasks.length;
  const totalPoints = calcStoryPoints(sprintTasks);
  const completedPoints = calcStoryPoints(todayCompletedTasks);
  const yesterdayPoints = calcStoryPoints(yesterdayCompletedTasks);
  const prevSprintPoints = calcStoryPoints(prevSprintTasks);

  const velocityTrend =
    totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const velocityChange =
    prevSprintPoints > 0
      ? Math.round(
          ((completedPoints - prevSprintPoints) / prevSprintPoints) * 100,
        )
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sprint Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{percent}%</div>
          <p className="text-xs text-muted-foreground">
            Day {day} of {totalDays}
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 w-[{percent}%] rounded-full bg-primary"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-full flex flex-col justify-between">
          <div className="text-2xl font-bold flex-1 h-full">
            {completedTasks}/{totalTasks}
          </div>
          <p
            className={`text-xs flex items-center ${completedTasks > yesterdayCompletedTasks.length ? 'text-green-600' : 'text-red-600'}`}
          >
            {yesterdayCompletedTasks.length > 0 && (
              <>
                <ArrowUp
                  className={`mr-1 h-4 w-4 ${completedTasks > yesterdayCompletedTasks.length ? '' : 'rotate-180'}`}
                />
                {Math.round(
                  (completedTasks / yesterdayCompletedTasks.length - 1) * 100,
                )}
                '% from yesterday
              </>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Story Points</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-full flex flex-col justify-between">
          <div className="text-2xl font-bold flex-1 h-full">
            {completedPoints}/{totalPoints}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on task duration in days
          </p>
          <p
            className={`text-xs flex items-center mt-1 ${completedPoints > totalPoints / 3 ? 'text-green-600' : 'text-red-600'}`}
          >
            {yesterdayPoints > 0 && (
              <>
                <ArrowUp
                  className={`mr-1 h-4 w-4 ${completedPoints > totalPoints / 3 ? '' : 'rotate-180'}`}
                />
                {Math.round((completedPoints / yesterdayPoints - 1) * 100)}%
                from yesterday
              </>
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Velocity Trend</CardTitle>
          <ArrowUp
            className={`h-4 w-4 ${velocityChange > 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`}
          />
        </CardHeader>
        <CardContent className="h-full flex flex-col justify-between">
          <div className="text-2xl font-bold flex-1 h-full">
            {velocityTrend}%
          </div>
          <p
            className={`text-xs flex items-center ${velocityChange > 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            <ArrowUp
              className={`mr-1 h-4 w-4 ${velocityChange > 0 ? '' : 'rotate-180'}`}
            />
            {Math.abs(velocityChange)}% from last sprint
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
