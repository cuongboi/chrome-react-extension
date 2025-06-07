import {
  differenceInCalendarDays,
  formatDate,
  isWeekend,
  setDefaultOptions,
} from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import type React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ArcherContainer, ArcherElement } from 'react-archer';

import {
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useProjectStore, useSprint } from '@/storage/project';
import type { TaskItem } from '@/types';

import { getSprintDuration, isHoliday } from './utils';

setDefaultOptions({
  locale: ja,
});

interface GanttChartProps {
  issues: TaskItem[];
  start: Date;
  end: Date;
}

export const ChartItem: React.FC<{
  issue: TaskItem & { children?: TaskItem[] };
  dateRange: Date[];
  left: number;
  width: number;
}> = ({ issue, left, width, dateRange }) => {
  const issueRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(80);

  useEffect(() => {
    if (issueRef.current) {
      const rect = issueRef.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [issueRef.current]);

  const isChild = issue.parentId !== null;
  const statusColor = issue.Status.color;

  return (
    <div className="border-b relative">
      <div className="flex items-center relative">
        {/* Title Column */}
        <div
          className="flex-shrink-0 p-3 border-r border-border w-96"
          ref={issueRef}
        >
          <div className={cn('space-y-2', isChild && 'ml-6')}>
            <p>{issue.Title.title.raw}</p>
            <div className="flex justify-between items-center">
              <div
                className="px-2 text-xs font-medium h-5 flex items-center justify-center w-fit"
                style={{
                  color: issue.Status.color
                    .replace('border', 'fg')
                    .replace('-muted', ''),
                  backgroundColor: issue.Status.color.replace('border', 'bg'),
                  border: '1px solid ' + issue.Status.color,
                  borderRadius: 'var(--borderRadius-full)',
                }}
              >
                {issue.Status.name}
              </div>
              <div className="flex -space-x-1">
                {issue.Assignees &&
                  issue.Assignees.map((assignee) => (
                    <Tooltip key={assignee.id}>
                      <TooltipTrigger asChild>
                        <img
                          className="ring-background rounded-full ring-1"
                          key={assignee.id}
                          src={assignee.avatarUrl}
                          width={20}
                          height={20}
                          alt={`${assignee.id} avatar`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{assignee.login}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Column */}
        <div
          className="flex-1 relative h-full flex items-center"
          style={{
            height: `${height}px`,
          }}
        >
          {/* Timeline background */}

          {dateRange.map((date, dateIndex) => (
            <div
              key={dateIndex}
              className={cn(
                'flex-1 border-r border-border h-full',
                (isWeekend(date) || isHoliday(date)) && 'bg-muted/60',
              )}
            />
          ))}

          <ArcherElement
            id={`issue-${issue.Title.number || issue.id}`}
            {...(issue.children?.length && {
              relations: issue.children.map((child) => ({
                targetId: `issue-${child.Title.number || child.id}`,
                targetAnchor: 'top',
                sourceAnchor: 'right',
                style: {
                  zIndex: 1,
                  endShape: {
                    arrow: {
                      arrowLength: 8,
                      arrowThickness: 8,
                    },
                  },
                },
              })),
            })}
          >
            <div
              className="absolute h-8 rounded cursor-pointer transition-all duration-200 z-2"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: statusColor
                  .replace('border', 'fg')
                  .replace('-muted', ''),
              }}
            >
              <div className="h-full flex items-center justify-center text-white text-xs font-medium px-2">
                <span className="truncate">#{issue.Title.number}</span>
              </div>
            </div>
          </ArcherElement>
        </div>
      </div>
    </div>
  );
};

export const GanttChart: React.FC = () => {
  const { boarditems } = useProjectStore();
  const { currentSprint } = useSprint();

  const { startDate, endDate, tasks } = useMemo(
    () => getSprintDuration(boarditems, currentSprint ?? ''),
    [currentSprint, boarditems],
  );

  return (
    <GanttChartOriginal issues={tasks} start={startDate!} end={endDate!} />
  );
};

export function GanttChartOriginal({ issues, start, end }: GanttChartProps) {
  const earliestStart = useMemo(() => {
    if (!issues.length) return new Date();
    return issues.reduce((earliest, issue) => {
      const issueStart = new Date(issue.start?.value || '');
      return issueStart < earliest ? issueStart : earliest;
    }, start);
  }, [issues]);

  const latestEnd = useMemo(() => {
    if (!issues.length) return new Date();
    return issues.reduce((latest, issue) => {
      const issueEnd = new Date(issue.end?.value || '');
      return issueEnd > latest ? issueEnd : latest;
    }, end);
  }, [issues]);

  // Calculate date range and timeline
  const { startDate, dateRange, totalDays } = useMemo(() => {
    const range = [];
    const startDate = new Date(
      Math.min(start.getTime(), earliestStart.getTime()),
    );
    const endDate = new Date(Math.max(end.getTime(), latestEnd.getTime()));

    const current = new Date(startDate);
    while (current <= endDate) {
      range.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      startDate,
      endDate,
      dateRange: range,
      totalDays: range.length,
    };
  }, [start, end, earliestStart, latestEnd]);

  // Sort issues to show parent tasks before children
  const sortedIssues = useMemo(() => {
    const parentTasks = issues.filter((issue) => !issue.parentId);
    const childTasks = issues
      .filter((issue) => issue.parentId)
      .sort((a, b) => a.start?.value?.localeCompare(b.start?.value) || 0);

    const result: (TaskItem & { children?: TaskItem[] })[] = [];

    parentTasks
      .sort((a, b) => a.start?.value?.localeCompare(b.start?.value) || 0)
      .forEach((parent) => {
        const children = childTasks.filter(
          (child) => child.parentId?.value === parent.Title.number,
        );

        result.push({ ...parent, children });
        result.push(...children);
      });

    return result;
  }, [issues]);

  // Calculate position and width for task bars
  const getTaskPosition = (issue: TaskItem) => {
    const taskStart = new Date(issue.start?.value);
    const taskEnd = new Date(issue.end?.value);
    const startOffset = differenceInCalendarDays(taskStart, startDate);
    const duration = differenceInCalendarDays(taskEnd, taskStart) + 1; // Include the end date

    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100,
    };
  };

  const formatDateHeader = (date: Date) => {
    return formatDate(date, 'MMMdd', {
      locale: ja,
    });
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 p-4">
        {/* Gantt Chart Table */}
        <div className="border rounded-lg">
          {/* Header */}
          <div className="bg-card static top-0 z-10 border-b border-border">
            <div className="flex overflow-auto">
              <div className="flex-shrink-0 p-3 border-r border-border w-96 font-semibold relative">
                Title
              </div>
              <div className="flex-1 flex">
                {dateRange.map((date, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex-1 border-r border-border text-center text-sm flex items-center justify-center',
                      (isWeekend(date) || isHoliday(date)) && 'bg-muted/60',
                    )}
                  >
                    <div>{formatDateHeader(date)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <ArcherContainer
            strokeColor="orange"
            strokeWidth={1}
            strokeDasharray="5 5"
            noCurves
            className="[&>svg]:z-1"
          >
            {sortedIssues.map((issue) => (
              <ChartItem
                key={issue.id}
                issue={issue}
                dateRange={dateRange}
                {...getTaskPosition(issue)}
              />
            ))}
          </ArcherContainer>
        </div>
      </div>
    </TooltipProvider>
  );
}
