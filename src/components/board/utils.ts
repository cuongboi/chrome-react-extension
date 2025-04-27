import {
  parseISO,
  differenceInBusinessDays,
  differenceInCalendarDays,
  addDays,
  isWithinInterval,
  isBefore,
  endOfDay,
  format,
  startOfDay,
} from 'date-fns';

import type { Group, TaskItem } from '@/types';

// Get tasks for a specific sprint
export const getTasksForSprint = (taskData: TaskItem[], sprintName: string) => {
  return taskData.filter((task) => task.group?.groupValue === sprintName);
};

// Get task completion stats for a sprint
export const getTaskCompletionStats = (
  taskData: TaskItem[],
  sprintName: string,
) => {
  const tasks = getTasksForSprint(taskData, sprintName);
  const statusTasks = pluckTasks(tasks, (task) => task.Status.id, 'id');

  return Object.entries(statusTasks).map(([statusId, tasks]) => ({
    name: statusId,
    value: tasks.length,
  }));
};

// Get sprint progress percentage
export const getSprintProgress = (sprintData: Group[], sprintName: string) => {
  const sprint = sprintData.find(
    (s) => s.groupValue === sprintName,
  )?.groupMetadata;

  if (!sprint) return { percent: 0, day: 0, totalDays: 0 };

  const startDate = parseISO(sprint.startDate);
  const totalDays = sprint.duration;
  const currentDate = new Date();

  const daysElapsed = differenceInCalendarDays(currentDate, startDate);

  const day = Math.min(daysElapsed + 1, totalDays);
  const percent = Math.min(Math.round((day / totalDays) * 100), 100);

  return { percent, day, totalDays };
};

// Get team workload data
export const getTeamWorkload = (taskData: TaskItem[], sprintName: string) => {
  const tasks = getTasksForSprint(taskData, sprintName);
  const teamWorkload: Record<string, { tasks: number; storyPoints: number }> =
    {};

  tasks.forEach((task) => {
    if (task.Assignees && task.Assignees.length > 0) {
      const storyPoints =
        differenceInBusinessDays(task.end.value, task.start.value) + 1;

      task.Assignees.forEach((assignee) => {
        const name = assignee.login;
        if (!teamWorkload[name]) {
          teamWorkload[name] = { tasks: 0, storyPoints: 0 };
        }
        teamWorkload[name].tasks += 1;
        teamWorkload[name].storyPoints += storyPoints;
      });
    }
  });

  return Object.entries(teamWorkload)
    .map(([name, data]) => ({
      name,
      tasks: data.tasks,
      storyPoints: data.storyPoints,
    }))
    .sort((a, b) => b.storyPoints - a.storyPoints);
};

// Generate burndown chart data
export const getBurndownData = (taskData: TaskItem[], sprintName: string) => {
  const sprint = taskData.find((task) => task.group?.groupValue === sprintName)
    ?.group?.groupMetadata;

  if (!sprint) return [];

  const totalDays = sprint.duration;
  const startDate = parseISO(sprint.startDate);
  const sprintTasks = getTasksForSprint(taskData, sprintName);
  const totalPoints = calcStoryPoints(sprintTasks);

  const data = [];
  let remaining = totalPoints;
  let ideal = totalPoints;

  for (let i = 0; i <= totalDays; i++) {
    const day =
      i === 0
        ? ' '
        : format(startOfDay(addDays(startDate, i - 1)), 'yyyy-MM-dd');

    if (i === 0) {
      data.push({ day, remaining: remaining, ideal: ideal });
    } else {
      const date = endOfDay(addDays(startDate, i));
      remaining = totalPoints - getActualPointsByDay(sprintTasks, date);
      ideal = totalPoints - getIdealPointsByDay(sprintTasks, date);

      data.push({ day, remaining, ideal });
    }
  }

  return data;
};

// Generate velocity chart data
export const getVelocityData = (
  taskData: TaskItem[],
  sprintName: string,
  completeStatus: string,
) => {
  const sprints = [...new Set(taskData.map((task) => task.group?.groupValue))];
  const currentSprintIndex = sprints.indexOf(sprintName);

  // Generate data for the current sprint and previous sprints if available
  const data = [];

  for (
    let i = Math.max(0, currentSprintIndex - 5);
    i <= currentSprintIndex;
    i++
  ) {
    const sprint = sprints[i]!;
    const sprintTasks = getTasksForSprint(taskData, sprint);
    const totalTasks = sprintTasks.length;

    // Calculate completed tasks
    const completedTasks = sprintTasks.filter(
      (task) => task.Status.id === completeStatus,
    ).length;

    data.push({
      sprint,
      completed: completedTasks,
      committed: totalTasks,
    });
  }

  return data;
};

// Add a new function to calculate total story points for a sprint
export const getSprintStoryPoints = (
  taskData: TaskItem[],
  sprintName: string,
  completeStatus: string,
) => {
  const tasks = getTasksForSprint(taskData, sprintName);
  let totalPoints = 0;
  let completedPoints = 0;

  tasks.forEach((task) => {
    const days = differenceInBusinessDays(task.end.value, task.start.value) + 1; // Include both start and end dates
    totalPoints += days;

    // Check if task is completed
    if (task.Status.id === completeStatus) {
      completedPoints += days;
    }
  });

  return { totalPoints, completedPoints };
};

export const getCurrentSprint = (sprintData: Group[]): string => {
  const currentDate = new Date();

  for (const sprint of sprintData) {
    const startDate = parseISO(sprint.groupMetadata.startDate);
    const endDate = addDays(startDate, sprint.groupMetadata.duration);

    if (isWithinInterval(currentDate, { start: startDate, end: endDate })) {
      return sprint.groupValue;
    }
  }

  const validSprints = sprintData.sort((a, b) => {
    const dateA = parseISO(a.groupMetadata!.startDate);
    const dateB = parseISO(b.groupMetadata!.startDate);
    return isBefore(dateB, dateA) ? -1 : 1;
  });

  return validSprints[0]?.groupValue || '';
};

export const getPrevSprint = (
  sprintData: Group[],
  currentSprint: string,
): string => {
  sprintData = sprintData.sort((a, b) => {
    const dateA = parseISO(a.groupMetadata!.startDate);
    const dateB = parseISO(b.groupMetadata!.startDate);
    return isBefore(dateA, dateB) ? -1 : 1;
  });

  const currentSprintIndex = sprintData.findIndex(
    (sprint) => sprint.groupValue === currentSprint,
  );

  if (currentSprintIndex < 1) return '';

  return sprintData[currentSprintIndex - 1]?.groupValue || '';
};

export const pluckTasks = (
  taskItems: TaskItem[],
  key: string | ((task: TaskItem) => string),
  valueKey?: string | string[],
): Record<string, TaskItem[]> => {
  const res: Record<string, TaskItem[]> = {};
  if (!Array.isArray(taskItems)) return res;

  taskItems.forEach((item: TaskItem) => {
    const itemKey =
      typeof key === 'function'
        ? key(item)
        : String(item[key as keyof TaskItem]);

    if (!itemKey) return;

    if (!res[itemKey]) {
      res[itemKey] = [];
    }

    if (valueKey) {
      if (!Array.isArray(valueKey)) valueKey = [valueKey];

      const value = valueKey.reduce((acc, valueKey) => {
        if (item[valueKey as keyof TaskItem]) {
          // @ts-expect-error  If no valueKey is provided, just push the item
          acc[valueKey] = item[valueKey as keyof TaskItem];
        }

        return acc;
      }, {} as TaskItem);

      res[itemKey].push(value);
    } else {
      res[itemKey].push(item);
    }
  });

  return res;
};

export const getSprintTaskComplete = (
  items: TaskItem[],
  completeStatus: string,
  date: Date = new Date(),
) =>
  items.filter((item) => {
    const statusId = item.Status?.id;
    try {
      return (
        statusId === completeStatus &&
        isBefore(parseISO(item.actualEnd.value), endOfDay(date))
      );
    } catch {
      return false;
    }
  });

export const calcStoryPoints = (items: TaskItem[]) => {
  let totalPoints = 0;

  items.forEach((item) => {
    const days =
      differenceInBusinessDays(
        parseISO(item.end.value),
        parseISO(item.start.value),
      ) + 1;
    totalPoints += days; // Include both start and end dates
  });

  return totalPoints;
};

export const getIdealPointsByDay = (
  items: TaskItem[],
  date: Date = new Date(),
) => {
  const itemsByDate = items.filter(
    (item) => item.end?.value && isBefore(item.end.value, endOfDay(date)),
  );

  const totalPoints = calcStoryPoints(itemsByDate);

  return totalPoints;
};

export const getActualPointsByDay = (
  items: TaskItem[],
  date: Date = new Date(),
): number => {
  const itemsByDate = items.filter(
    (item) =>
      item.actualEnd?.value &&
      isBefore(parseISO(item.actualEnd.value), endOfDay(date)),
  );

  const totalPoints = calcStoryPoints(itemsByDate);

  return totalPoints;
};
