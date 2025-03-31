import { addDays, endOfDay, startOfDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import React from 'react';
import { GanttOriginal, type Task, ViewMode } from 'react-gantt-chart/lib';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useColumnStore, useProjectStore } from '@/storage/project';

import { useFetchProject } from '../hook/useFetchProject';
import type { TaskItem } from '../types';

const createMoreInfo = (item: TaskItem) => {
  const { columns } = useColumnStore.getState();

  const status = columns.Status.settings.options.find(
    (option: any) => option.id === item.Status?.id,
  ) as {
    color: string;
    description: string;
    name: string;
  };

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
  type: 'task' as Task['type'],
  id: String(item.id),
  name: item.Title.title.raw,
  start: startOfDay(new Date(item.start?.value)),
  end: endOfDay(new Date(item.end?.value)),
  progress: Number(item.progress?.value || 0),
  dependencies: [parentId || ''],
  ...(projectId && { project: projectId }),
  info: createMoreInfo(item),
});

export const Chart: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const { items, groups, columnMap } = useFetchProject();
  const { updateApi } = useProjectStore();

  const [height, setHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const handleResize = () => {
      setHeight(window.innerHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    if (items.length === 0) return;

    const newTasks: Task[] = [];
    const noParentItems = items.filter((item) => !item.parentId?.value);
    const withParentItems = items
      .filter((item) => item.parentId?.value)
      .reduce(
        (acc, item) => {
          const parentId = item.parentId?.value;
          if (!acc[parentId]) {
            acc[parentId] = [];
          }
          acc[parentId].push(item);
          return acc;
        },
        {} as Record<string, TaskItem[]>,
      );

    if (!groups || Object.keys(groups).length === 0) {
      noParentItems.forEach((item) => {
        newTasks.push(createTask(item, 'task'));

        if (withParentItems[item.Title.number]) {
          withParentItems[item.Title.number].forEach((childItem) => {
            newTasks.push(createTask(childItem, 'task', String(item.id)));
          });
        }
      });
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
              (group.groupMetadata.duration ?? columnMap.sprintDuration) - 1,
            ),
          );
          const progress =
            start.getTime() < Date.now()
              ? Math.min(
                  100,
                  Math.round(
                    ((Date.now() - start.getTime()) /
                      (end.getTime() - start.getTime())) *
                      100,
                  ),
                )
              : 0;

          // Add project task
          newTasks.push({
            type: 'project' as Task['type'],
            id: group.groupId,
            name: group.groupValue,
            start,
            end,
            styles: {
              backgroundColor: 'var(--borderColor-accent-muted)',
              progressSelectedColor:
                Date.now() - end.getTime() > 0
                  ? 'var(--bgColor-neutral-emphasis)'
                  : 'var(--borderColor-accent-emphasis)',
            },
            progress,
            hideChildren: Date.now() - end.getTime() > 0,
          });

          noParentItems
            .filter((item) => item.group?.groupId === group.groupId)
            .forEach((item) => {
              newTasks.push(createTask(item, group.groupId));

              if (withParentItems[item.Title.number]) {
                withParentItems[item.Title.number].forEach((childItem) => {
                  newTasks.push(
                    createTask(childItem, group.groupId, String(item.id)),
                  );
                });
              }
            });
        });
    }

    setTasks(
      newTasks.filter(
        (task) => task.start instanceof Date && task.end instanceof Date,
      ),
    );
  }, [items, groups]);

  const progressChangeHandler = (task: Task) => {
    const itemTask = items.find((item) => item.id === Number(task.id));
    const progressColumnId = columnMap.progress;
    fetch(updateApi, {
      headers: {
        accept: 'application/json',
        'accept-language': 'ja,en-US;q=0.9,en;q=0.8,vi;q=0.7',
        'content-type': 'application/json',
        'github-verified-fetch': 'true',
        priority: 'u=1, i',
        'sec-ch-ua':
          '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
      },
      method: 'PUT',
      body: JSON.stringify({
        memexProjectItemId: itemTask?.id,
        memexProjectColumnValues: [
          { memexProjectColumnId: progressColumnId, value: task.progress },
        ],
      }),
      mode: 'cors',
      credentials: 'include',
    }).then(() => {
      toast.success('Progress updated successfully');
    });
  };

  return (
    <div className={cn('w-full max-h-full p-4', className)}>
      {tasks.length > 0 ? (
        <GanttOriginal
          tasks={tasks}
          viewMode={ViewMode.Day}
          columnWidth={60}
          fontSize="14px"
          ganttHeight={height - 260 || 500}
          onExpanderClick={(task) =>
            setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
          }
          onProgressChange={progressChangeHandler}
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
