'use client';

import { format, parseISO } from 'date-fns';
import React, { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useColumnStore } from '@/storage/project';
import type { TaskItem } from '@/types';

import { getBusinessDaysDifference, getTasksForSprint } from './utils';

interface TaskListProps {
  selectedSprint: string;
  items: TaskItem[];
  className?: string;
}

export function TaskList({ selectedSprint, items, className }: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { columnMap } = useColumnStore();
  const tasks = React.useMemo(() => {
    const allTasks = getTasksForSprint(items, selectedSprint).sort(
      (a, b) => a.Title.number - b.Title.number,
    );
    if (statusFilter === 'all') {
      return allTasks;
    }
    return allTasks.filter((task) => {
      const status = columnMap.statuses.find(
        (option) => option.value === task.Status?.id,
      );
      return status?.value === statusFilter;
    });
  }, [items, selectedSprint, statusFilter, columnMap]);

  return (
    <TooltipProvider>
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Sprint Tasks</CardTitle>
              <CardDescription>All tasks in the current sprint</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {columnMap.statuses.map((status) => (
                  <SelectItem value={status.value} key={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Assignees
                </TableHead>
                <TableHead className="flex justify-center items-center">
                  Story Points
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Ideal Dates
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Actual Dates
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No tasks found with the selected filter
                  </TableCell>
                </TableRow>
              ) : (
                tasks
                  .filter(
                    (task) =>
                      !task.parentId ||
                      !tasks.find(
                        (t) => task.parentId?.value === t.Title.number,
                      ),
                  )
                  .map((task) => {
                    const title =
                      task.Title.title?.raw ||
                      task.Title.title?.html ||
                      `Task #${task.id}`;

                    return (
                      <>
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[250px] md:max-w-[350px]">
                                    {title}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-sm">{title}</p>
                                </TooltipContent>
                              </Tooltip>

                              {task.parentId && (
                                <span className="text-xs text-muted-foreground">
                                  Subtask of #{task.parentId.value}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className="px-2 text-xs font-medium h-5 flex items-center justify-center w-fit"
                              style={{
                                color: task.Status.color
                                  .replace('border', 'fg')
                                  .replace('-muted', ''),
                                backgroundColor: task.Status.color.replace(
                                  'border',
                                  'bg',
                                ),
                                border: '1px solid ' + task.Status.color,
                                borderRadius: 'var(--borderRadius-full)',
                              }}
                            >
                              {task.Status.name}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex -space-x-1">
                              {task.Assignees &&
                                task.Assignees.map((assignee) => (
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
                          </TableCell>
                          <TableCell className="flex justify-center items-center">
                            {getBusinessDaysDifference(
                              task.end.value,
                              task.start.value,
                            ) + 1}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {task.start
                                ? format(
                                    parseISO(task.start.value),
                                    'yyyy-MM-dd',
                                  )
                                : 'Not started'}
                              {' - '}
                              {task.end
                                ? format(parseISO(task.end.value), 'yyyy-MM-dd')
                                : 'Not ended'}
                            </span>
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {task.actualStart
                                ? format(
                                    parseISO(task.actualStart.value),
                                    'yyyy-MM-dd',
                                  )
                                : 'Not started'}
                              {' - '}
                              {task.actualEnd
                                ? format(
                                    parseISO(task.actualEnd.value),
                                    'yyyy-MM-dd',
                                  )
                                : 'Not ended'}
                            </span>
                          </TableCell>
                        </TableRow>
                        {tasks
                          .filter(
                            (subtask) =>
                              Number(subtask.parentId?.value) ===
                              Number(task.Title.number),
                          )
                          .map((subtask) => (
                            <TableRow key={subtask.id}>
                              <TableCell className="pl-5">
                                <div className="flex flex-col">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-medium truncate max-w-[250px] md:max-w-[350px]">
                                        {subtask.Title.title?.raw}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-sm">
                                        {subtask.Title.title?.raw}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className="px-2 text-xs font-medium h-5 flex items-center justify-center w-fit"
                                  style={{
                                    color: subtask.Status.color
                                      .replace('border', 'fg')
                                      .replace('-muted', ''),
                                    backgroundColor:
                                      subtask.Status.color.replace(
                                        'border',
                                        'bg',
                                      ),
                                    border: '1px solid ' + subtask.Status.color,
                                    borderRadius: 'var(--borderRadius-full)',
                                  }}
                                >
                                  {subtask.Status.name}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex -space-x-2">
                                  {subtask.Assignees &&
                                    subtask.Assignees.map((assignee) => (
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
                              </TableCell>
                              <TableCell className="flex justify-center items-center"></TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {subtask.start
                                    ? format(
                                        parseISO(subtask.start.value),
                                        'yyyy-MM-dd',
                                      )
                                    : 'Not started'}
                                  {' - '}
                                  {subtask.end
                                    ? format(
                                        parseISO(subtask.end.value),
                                        'yyyy-MM-dd',
                                      )
                                    : 'Not ended'}
                                </span>
                              </TableCell>

                              <TableCell className="hidden md:table-cell">
                                <span className="text-xs text-muted-foreground">
                                  {subtask.actualStart
                                    ? format(
                                        parseISO(subtask.actualStart.value),
                                        'yyyy-MM-dd',
                                      )
                                    : 'Not started'}
                                  {' - '}
                                  {subtask.actualEnd
                                    ? format(
                                        parseISO(subtask.actualEnd.value),
                                        'yyyy-MM-dd',
                                      )
                                    : 'Not ended'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
