import { addDays, endOfDay, startOfDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { GanttOriginal, type Task, ViewMode } from 'react-gantt-chart/lib';

import { Badge } from '@/components/ui/badge';
import { cn, getStatusColor } from '@/lib/utils';
import { useColumnStore, useProjectStore } from '@/storage/project';

import type { TaskItem } from '../types';

const createMoreInfo = (item: TaskItem): JSX.Element => {
  const { columns } = useColumnStore.getState();
  const status = columns.Status.settings.options.find(
    (option: any) => option.id === item.Status?.id,
  )! as { name: string };

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
  const { columnMap, columns } = useColumnStore();
  const { items, groups } = useProjectStore();

  // Window height effect
  useLayoutEffect(() => {
    const handleResize = () => setHeight(window.innerHeight);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createTask = React.useCallback(
    (item: TaskItem, projectId?: string, parentId?: string): Task => ({
      type: 'task' as const,
      id: String(item.id),
      name: item.Title.title.raw,
      title: item.Title,
      start: startOfDay(new Date(item.start?.value)),
      end: endOfDay(new Date(item.end?.value)),
      progress: Number(item.progress?.value || 0),
      status: columns.Status.settings.options.find(
        (option: any) => option.id === item.Status?.id,
      ),
      actualStart: startOfDay(item.actualStart?.value),
      actualEnd: endOfDay(item.actualEnd?.value),
      dependencies: parentId ? [parentId] : [],
      ...(projectId && { project: projectId }),
      info: createMoreInfo(item),
      styles: {
        backgroundColor: getStatusColor(
          item.Status.id,
          columns.Status.settings.options,
        ),
      },
    }),
    [columns],
  );

  // Task generation effect
  useEffect(() => {
    if (!items?.length) return;

    const generateTasks = () => {
      const sortedItems = items
        .filter((item) => item.start?.value && item.end?.value)
        .sort(
          (a, b) =>
            new Date(a.start.value).getTime() -
            new Date(b.start.value).getTime(),
        );

      const tasks: Task[] = [];

      if (!groups || !Object.keys(groups).length) {
        const parentItems = sortedItems.filter((item) => !item.parentId);
        parentItems.forEach((parent) => {
          tasks.push(createTask(parent));
          sortedItems
            .filter(
              (subItem) =>
                Number(subItem.parentId?.value) === parent.Title.number,
            )
            .forEach((subItem) =>
              tasks.push(createTask(subItem, undefined, String(parent.id))),
            );
        });
        return tasks;
      }

      const sortedGroups = Object.values(groups)
        .filter((group) => group.groupMetadata?.startDate && group.groupValue)
        .sort(
          (a, b) =>
            new Date(a.groupMetadata.startDate).getTime() -
            new Date(b.groupMetadata.startDate).getTime(),
        );

      sortedGroups.forEach((group) => {
        tasks.push(createProjectTask(group, columnMap));
        const groupItems = sortedItems.filter(
          (item) => item.group?.groupId === group.groupId,
        );
        const groupItemIDs = new Set(
          groupItems.map((item) => Number(item.Title.number)),
        );

        groupItems
          .filter(
            (item) =>
              !item.parentId || !groupItemIDs.has(Number(item.parentId?.value)),
          )
          .forEach((parent) => {
            tasks.push(createTask(parent, group.groupId));
            groupItems
              .filter(
                (subItem) =>
                  Number(subItem.parentId?.value) ===
                  Number(parent.Title.number),
              )
              .forEach((subItem) =>
                tasks.push(
                  createTask(subItem, group.groupId, String(parent.id)),
                ),
              );
          });
      });

      return tasks;
    };

    setTasks(generateTasks());
  }, [items, groups, columnMap]);

  // Render
  const ganttConfig = {
    tasks,
    viewMode: ViewMode.Day as const,
    columnWidth: 60,
    fontSize: '14px',
    ganttHeight: height - 140,
    locale: 'ja-JP',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
  };

  return tasks.length > 0 ? (
    <div className={cn('w-full max-h-full', className)}>
      <GanttOriginal
        {...ganttConfig}
        onExpanderClick={(task) =>
          setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
        }
        columnOptions={{
          columns,
        }}
        holidays={columnMap.holidays}
      />
    </div>
  ) : (
    <div className="flex items-center justify-center h-full ">
      <Loader2Icon className="animate-spin" />
    </div>
  );
};
