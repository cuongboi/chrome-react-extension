import { addDays, endOfDay, startOfDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import React from 'react';
import { GanttOriginal, type Task, ViewMode } from 'react-gantt-chart/lib';

import { stringToColorHash } from '@/lib/utils';

import { useFetchProject } from '../hook/useFetchProject';
import type { Assignee, TaskItem } from '../types';

const createAssigneeInfo = (assignees: Assignee[]) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2">
      <span className="text-xs font-normal text-gray-700">Assignee:</span>
      <div className="flex -space-x-[0.75rem]">
        {assignees.map((assignee) => (
          <img
            key={assignee.id}
            className="ring-background rounded-full ring-1"
            src={assignee.avatarUrl}
            width={18}
            height={18}
          />
        ))}
      </div>
    </div>
  </div>
);

const createTask = (item: TaskItem, projectId?: string): Task => ({
  type: 'task' as Task['type'],
  id: String(item.contentId),
  name: item.Title.title.raw,
  start: startOfDay(new Date(item.start.value)),
  end: endOfDay(new Date(item.end.value)),
  progress: Number(item.progress?.value || 0),
  styles: {
    backgroundColor: stringToColorHash(
      item.Assignees.map((assignee) => assignee.avatarUrl).join(''),
    ),
  },
  ...(projectId && { project: projectId }),
  info: createAssigneeInfo(item.Assignees),
});

export const Chart = () => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const { items, groups, columnMap } = useFetchProject();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (items.length === 0) return;

    const newTasks: Task[] = [];

    if (!groups || Object.keys(groups).length === 0) {
      newTasks.push(...items.map((item) => createTask(item, 'task')));
    } else {
      Object.values(groups)
        .sort(
          (a, b) =>
            new Date(a.groupMetadata.startDate).getTime() -
            new Date(b.groupMetadata.startDate).getTime(),
        )
        .forEach((group) => {
          const start = startOfDay(new Date(group.groupMetadata.startDate));
          const end = endOfDay(
            addDays(
              start,
              group.groupMetadata.duration ?? columnMap.sprintDuration,
            ),
          );
          const progress = Math.min(
            100,
            Math.round(
              ((Date.now() - start.getTime()) /
                (end.getTime() - start.getTime())) *
                100,
            ),
          );

          // Add project task
          newTasks.push({
            type: 'project' as Task['type'],
            id: group.groupId,
            name: group.groupValue,
            start,
            end,
            progress,
            hideChildren: Date.now() - end.getTime() > 0,
          });

          newTasks.push(
            ...items
              .filter((item) => item.group?.groupId === group.groupId)
              .map((item) => createTask(item, group.groupId)),
          );
        });
    }

    setTasks(newTasks);
  }, [items, groups]);

  return (
    <div className="w-full h-full" ref={ref}>
      {tasks.length > 0 ? (
        <GanttOriginal
          tasks={tasks}
          viewMode={ViewMode.Day}
          columnWidth={50}
          fontSize="14px"
          ganttHeight={ref.current?.clientHeight || 500}
          onExpanderClick={(task) =>
            setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
          }
          locale="ja-JP"
          fontFamily='-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"'
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2Icon className="animate-spin" />
        </div>
      )}
    </div>
  );
};
