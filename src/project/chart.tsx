import { addDays, endOfDay, startOfDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { GanttOriginal, type Task, ViewMode } from 'react-gantt-chart/lib';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { GHRequestHeaders } from '@/lib/contains';
import { cn } from '@/lib/utils';
import { useColumnStore, useProjectStore } from '@/storage/project';

import type { TaskItem } from '../types';

// Task Creation Helpers
const createMoreInfo = (item: TaskItem): JSX.Element => {
  const { columns } = useColumnStore.getState();
  const status = columns.Status.settings.options.find(
    (option: any) => option.id === item.Status?.id,
  ) as { color: string; description: string; name: string };

  return (
    <>
      <div className="flex items-center gap-2">
        <span>Assignee:</span>
        <div className="flex -space-x-[0.25rem]">
          {item.Assignees.map((assignee) => (
            <img
              key={assignee.id}
              className="ring-background rounded-full ring-1"
              src={assignee.avatarUrl}
              width={18}
              height={18}
              alt={`${assignee.id} avatar`}
            />
          ))}
        </div>
      </div>
      {status && <Badge variant="secondary">{status.name}</Badge>}
    </>
  );
};

const createTask = (
  item: TaskItem,
  projectId?: string,
  parentId?: string,
): Task => ({
  type: 'task' as const,
  id: String(item.id),
  name: item.Title.title.raw,
  start: startOfDay(new Date(item.start?.value)),
  end: endOfDay(new Date(item.end?.value)),
  progress: Number(item.progress?.value || 0),
  dependencies: parentId ? [parentId] : [],
  ...(projectId && { project: projectId }),
  info: createMoreInfo(item),
});

// Project Task Creation
const createProjectTask = (group: any, columnMap: any): Task => {
  const start = startOfDay(new Date(group.groupMetadata.startDate));
  const end = endOfDay(
    addDays(
      start,
      (group.groupMetadata.duration ?? columnMap.sprintDuration) - 1,
    ),
  );
  const now = Date.now();
  const progress =
    start.getTime() < now
      ? Math.min(
          100,
          Math.round(
            ((now - start.getTime()) / (end.getTime() - start.getTime())) * 100,
          ),
        )
      : 0;

  return {
    type: 'project' as const,
    id: group.groupId,
    name: group.groupValue,
    start,
    end,
    progress,
    styles: {
      backgroundColor: '#bfdeff',
      progressSelectedColor:
        now - end.getTime() > 0
          ? 'var(--bgColor-neutral-emphasis)'
          : 'var(--borderColor-accent-emphasis)',
    },
    hideChildren: now - end.getTime() > 0,
  };
};

// Main Component
interface ChartProps {
  className?: string;
}

export const Chart: React.FC<ChartProps> = ({ className }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [height, setHeight] = useState(0);
  const { columnMap: pagesColumnMap } = useColumnStore();
  const { updateApi, items, groups } = useProjectStore();
  const columnMap = pagesColumnMap[window.location.pathname];

  // Window height effect
  useLayoutEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Task generation effect
  useEffect(() => {
    if (!items.length) return;

    const generateTasks = () => {
      const newTasks: Task[] = [];
      const noParentItems = items.filter((item) => !item.parentId?.value);
      const withParentItems = items
        .filter((item) => item.parentId?.value)
        .reduce(
          (acc, item) => {
            const parentId = item.parentId?.value;
            acc[parentId] = acc[parentId] || [];
            acc[parentId].push(item);
            return acc;
          },
          {} as Record<string, TaskItem[]>,
        );

      if (!groups || !Object.keys(groups).length) {
        processUngroupedTasks(noParentItems, withParentItems, newTasks);
      } else {
        processGroupedTasks(noParentItems, withParentItems, newTasks);
      }

      return newTasks.filter(
        (task) => task.start instanceof Date && task.end instanceof Date,
      );
    };

    const processUngroupedTasks = (
      noParentItems: TaskItem[],
      withParentItems: Record<string, TaskItem[]>,
      newTasks: Task[],
    ) => {
      noParentItems.forEach((item) => {
        newTasks.push(createTask(item));
        withParentItems[item.Title.number]?.forEach((childItem) => {
          newTasks.push(createTask(childItem, undefined, String(item.id)));
        });
      });
    };

    const processGroupedTasks = (
      noParentItems: TaskItem[],
      withParentItems: Record<string, TaskItem[]>,
      newTasks: Task[],
    ) => {
      Object.values(groups)
        .sort(
          (a, b) =>
            new Date(a.groupMetadata.startDate).getTime() -
            new Date(b.groupMetadata.startDate).getTime(),
        )
        .forEach((group) => {
          newTasks.push(createProjectTask(group, columnMap));
          noParentItems
            .filter((item) => item.group?.groupId === group.groupId)
            .forEach((item) => {
              newTasks.push(createTask(item, group.groupId));
              withParentItems[item.Title.number]?.forEach((childItem) => {
                newTasks.push(
                  createTask(childItem, group.groupId, String(item.id)),
                );
              });
            });
        });
    };

    setTasks(generateTasks());
  }, [items, groups, columnMap]);

  // Progress update handler
  const handleProgressChange = async (task: Task) => {
    const itemTask = items.find((item) => item.id === Number(task.id));
    if (!itemTask) return;

    try {
      const response = await fetch(updateApi, {
        headers: GHRequestHeaders,
        method: 'PUT',
        body: JSON.stringify({
          memexProjectItemId: itemTask.id,
          memexProjectColumnValues: [
            { memexProjectColumnId: columnMap.progress, value: task.progress },
          ],
        }),
        mode: 'cors',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Progress updated successfully');
      }
    } catch {
      toast.error('Failed to update progress');
    }
  };

  // Render
  const ganttConfig = {
    tasks,
    viewMode: ViewMode.Day as const,
    columnWidth: 60,
    fontSize: '14px',
    ganttHeight: height - 260 || 500,
    locale: 'ja-JP',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
  };

  return (
    <div className={cn('w-full max-h-full p-4', className)}>
      {tasks.length > 0 ? (
        <GanttOriginal
          {...ganttConfig}
          onExpanderClick={(task) =>
            setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
          }
          onProgressChange={handleProgressChange}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2Icon className="animate-spin" />
        </div>
      )}
    </div>
  );
};
