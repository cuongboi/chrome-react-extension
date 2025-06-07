import { addDays, endOfDay, isBefore } from 'date-fns';
import { ArrowUp, Clock, ListTodo } from 'lucide-react';
import React, { memo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectStore } from '@/storage/project';
import type { TaskItem } from '@/types';

import { BugCounterChart } from './bug-counter-chart';
import { SprintWorkLoadChart } from './sprint-workload-chart';
import {
  getSprintProgress,
  getPrevSprint,
  getTasksForSprint,
  getSprintTaskComplete,
  calcStoryPoints,
  getSprint,
  sprintLabelTasks,
} from './utils';

interface SprintProgressCardsProps {
  selectedSprint: string;
  items: TaskItem[];
}

export const SprintProgressCards = memo(
  ({ selectedSprint, items }: SprintProgressCardsProps) => {
    const { groups } = useProjectStore();

    // Consolidate sprint metadata and calculations
    const sprintMetrics = React.useMemo(() => {
      const currentSprintMeta =
        getSprint(groups, selectedSprint)?.groupMetadata || {};
      const endOfSprint = endOfDay(
        addDays(currentSprintMeta.startDate, currentSprintMeta.duration - 1),
      );

      const sprintLabels = sprintLabelTasks(groups, items, selectedSprint);

      const prevSprint = getPrevSprint(Object.values(groups), selectedSprint);
      const sprintTasks = getTasksForSprint(items, selectedSprint);
      const prevSprintTasks = getTasksForSprint(items, prevSprint);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const todayCompletedTasks = getSprintTaskComplete(sprintTasks, today);
      const yesterdayCompletedTasks = getSprintTaskComplete(
        sprintTasks,
        yesterday,
      );

      const { percent, day, totalDays } = getSprintProgress(
        Object.values(groups),
        selectedSprint,
      );

      const totalTasks = sprintTasks.length;
      const completedTasks = todayCompletedTasks.length;
      const totalPoints = calcStoryPoints(sprintTasks);
      const completedPoints = calcStoryPoints(
        sprintTasks,
        (item) =>
          !!item.actualEnd && isBefore(item.actualEnd.value, endOfSprint),
      );
      const yesterdayPoints = calcStoryPoints(
        sprintTasks,
        (item) =>
          !!item.actualEnd &&
          isBefore(item.actualEnd.value, endOfDay(yesterday)),
      );
      const prevSprintPoints = calcStoryPoints(prevSprintTasks);
      const totalCompletePoint = calcStoryPoints(
        sprintTasks,
        (item) => !!item.actualEnd,
      );

      const velocityTrend =
        totalPoints > 0
          ? Math.round((totalCompletePoint / totalPoints) * 100)
          : 0;
      const velocityChange =
        prevSprintPoints > 0
          ? Math.round(
              ((totalCompletePoint - prevSprintPoints) / prevSprintPoints) *
                100,
            )
          : 0;

      return {
        percent,
        day,
        totalDays,
        totalTasks,
        completedTasks,
        totalPoints,
        completedPoints,
        yesterdayPoints,
        prevSprintPoints,
        totalCompletePoint,
        velocityTrend,
        velocityChange,
        yesterdayCompletedTasksLength: yesterdayCompletedTasks.length,
        overduePoints: totalCompletePoint - completedPoints,
        sprintLabels,
      };
    }, [groups, selectedSprint, items]);

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sprint Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprintMetrics.percent}%</div>
            <p className="text-xs text-muted-foreground">
              Day {sprintMetrics.day} of {sprintMetrics.totalDays}
            </p>
            <div className="mt-4 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${sprintMetrics.percent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Story Points</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between">
            <div className="text-2xl font-bold flex-1">
              {sprintMetrics.totalCompletePoint}/{sprintMetrics.totalPoints}
              {sprintMetrics.overduePoints > 0 && (
                <span className="text-xs text-destructive font-normal">
                  {' '}
                  ({sprintMetrics.overduePoints} overdue)
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Based on task duration in days
              </p>
              {sprintMetrics.yesterdayPoints > 0 && (
                <p
                  className={`text-xs flex items-center mt-1 ${
                    sprintMetrics.totalCompletePoint >=
                    sprintMetrics.yesterdayPoints
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  <ArrowUp
                    className={`mr-1 h-4 w-4 ${
                      sprintMetrics.totalCompletePoint >=
                      sprintMetrics.yesterdayPoints
                        ? ''
                        : 'rotate-180'
                    }`}
                  />
                  {Math.round(
                    (sprintMetrics.totalCompletePoint /
                      sprintMetrics.yesterdayPoints -
                      1) *
                      100,
                  )}
                  % from yesterday
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <SprintWorkLoadChart items={items} selectedSprint={selectedSprint} />

        <BugCounterChart items={items} selectedSprint={selectedSprint} />
      </div>
    );
  },
);

SprintProgressCards.displayName = 'SprintProgressCards';
