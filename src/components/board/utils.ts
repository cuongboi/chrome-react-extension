import {
  parseISO,
  differenceInCalendarDays,
  addDays,
  isWithinInterval,
  isBefore,
  endOfDay,
  format,
  startOfDay,
  isSameDay,
  isWeekend,
} from 'date-fns';

import type { Group, TaskItem, ValueLabels } from '@/types';

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
  const parentIds = tasks.map((task) => task.Title.number);
  const teamWorkload: Record<string, { tasks: number; storyPoints: number }> =
    {};

  tasks.forEach((task) => {
    if (task.Assignees && task.Assignees.length > 0) {
      const storyPoints = parentIds.includes(Number(task.parentId?.value))
        ? 0
        : getBusinessDaysDifference(task.end.value, task.start.value) + 1;

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

export const getSprintDuration = (
  taskData: TaskItem[],
  sprintName: string,
): {
  tasks: TaskItem[];
  duration: number;
  startDate?: Date;
  endDate?: Date;
} => {
  const sprint = taskData.find((task) => task.group?.groupValue === sprintName)
    ?.group?.groupMetadata;

  if (!sprint)
    return {
      duration: 0,
      startDate: undefined,
      endDate: undefined,
      tasks: [] as TaskItem[],
    };
  taskData = taskData.filter((task) => task.group?.groupValue === sprintName);

  const lastIdealDate = taskData.sort(
    (a, b) =>
      endOfDay(b.end?.value).getTime() - endOfDay(a.end?.value).getTime(),
  )[0];

  const actualSprintDuration =
    differenceInCalendarDays(lastIdealDate.end.value, sprint.startDate) + 1;

  const totalDays =
    actualSprintDuration > sprint.duration
      ? actualSprintDuration
      : sprint.duration;
  const startDate = parseISO(sprint.startDate);
  const endDate = addDays(startDate, totalDays);

  return {
    tasks: taskData,
    duration: totalDays,
    startDate,
    endDate,
  };
};

// Generate burndown chart data
export const getBurndownData = (taskData: TaskItem[], sprintName: string) => {
  const { duration, startDate } = getSprintDuration(taskData, sprintName);

  if (!startDate) return [];

  const sprintTasks = getTasksForSprint(taskData, sprintName);
  const totalPoints = calcStoryPoints(sprintTasks);

  const data = [];
  let remaining = totalPoints;
  let ideal = totalPoints;

  for (let i = 0; i < duration; i++) {
    const date = endOfDay(addDays(startDate, i));
    const day = i === 0 ? ' ' : format(date, 'yyyy-MM-dd');

    if (i === 0) {
      data.push({ day, remaining: remaining, ideal: ideal });
    } else {
      remaining = totalPoints - getActualPointsByDay(sprintTasks, date);
      ideal = totalPoints - getIdealPointsByDay(sprintTasks, date);

      data.push({ day, i, remaining, ideal });
    }
  }

  return data;
};

export const getVelocityData = (taskData: TaskItem[], sprintName: string) => {
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

    const completedTasks = sprintTasks.filter(
      (task) => !!task.actualEnd,
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
) => {
  const tasks = getTasksForSprint(taskData, sprintName);
  const totalPoints = calcStoryPoints(tasks);
  const completedTask = getSprintTaskComplete(tasks);
  const completedPoints = calcStoryPoints(completedTask);

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
  date: Date = new Date(),
) =>
  items.filter((item) => {
    try {
      return (
        item.actualEnd &&
        isBefore(parseISO(item.actualEnd.value), endOfDay(date))
      );
    } catch {
      return false;
    }
  });

export const calcStoryPoints = (
  items: TaskItem[],
  filter?: (item: TaskItem, index?: number) => boolean,
) => {
  let totalPoints = 0;
  const parentIds = items.map((item) => item.Title.number);

  items
    .filter(
      (item, index) =>
        item.end &&
        item.start &&
        !parentIds.includes(Number(item.parentId?.value)) &&
        (filter ? filter(item, index) : true),
    )
    .forEach((item) => {
      const days =
        getBusinessDaysDifference(
          parseISO(item.end.value),
          parseISO(item.start.value),
        ) + 1;
      totalPoints += days;
    });

  return totalPoints;
};

export function isHoliday(date: Date) {
  return window.holidays?.some((holiday) =>
    isSameDay(new Date(holiday), new Date(date)),
  );
}

export function getBusinessDaysDifference(
  endDate: Date | string,
  startDate: Date | string,
) {
  let businessDays = 0;
  let currentDate = startOfDay(startDate);

  while (currentDate < startOfDay(endDate)) {
    if (!isWeekend(currentDate) && !isHoliday(currentDate)) {
      businessDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return businessDays;
}

export const getIdealPointsByDay = (
  items: TaskItem[],
  date: Date = new Date(),
) => {
  return calcStoryPoints(
    items,
    (item) => item.end && isBefore(parseISO(item.end.value), endOfDay(date)),
  );
};

export const getActualPointsByDay = (
  items: TaskItem[],
  date: Date = new Date(),
): number => {
  return calcStoryPoints(
    items,
    (item) =>
      item.actualEnd &&
      isBefore(parseISO(item.actualEnd.value), endOfDay(date)),
  );
};

export const isSubTask = (task: TaskItem, tasks: TaskItem[]) =>
  tasks.some((t) => Number(t.Title.number) === Number(task.parentId?.value));

export const getSprint = (
  group: Record<string, Group>,
  currentSprint: string,
): Group => {
  return (
    Object.values(group).find(
      (sprint) => sprint.groupValue === currentSprint,
    ) ?? ({} as Group)
  );
};

export const getLabelItems = (tasks: TaskItem[]) => {
  const labelTasks: Map<
    string,
    {
      label: ValueLabels;
      tasks: TaskItem[];
    }
  > = new Map();

  tasks.forEach((task) => {
    task.Labels?.forEach((labels) => {
      if (!labelTasks.has(labels.name)) {
        labelTasks.set(labels.name, {
          label: labels,
          tasks: [task],
        });
      } else {
        const existingLabel = labelTasks.get(labels.name);
        if (existingLabel) {
          existingLabel.tasks.push(task);
        }

        labelTasks.set(labels.name, existingLabel!);
      }
    });
  });

  return labelTasks;
};

export const sprintLabelTasks = (
  groups: Record<string, Group>,
  tasks: TaskItem[],
  currentSprint: string,
) => {
  const groupValues = Object.values(groups);

  const currentSprintIndex = groupValues.findIndex(
    (sprint) => sprint.groupValue === currentSprint,
  );
  const sprints = groupValues.slice(0, currentSprintIndex + 1);

  return sprints.map((sprint) => {
    const sprintTasks = tasks.filter(
      (task) => task.group?.groupValue === sprint.groupValue,
    );

    return {
      sprint: sprint.groupValue,
      labels: getLabelItems(sprintTasks),
    };
  });
};

export const getSprintWorkload = (taskData: TaskItem[]) => {
  const sprintTasks = pluckTasks(
    taskData
      .filter((task) => task.group?.groupValue)
      .sort((a, b) =>
        a.group!.groupMetadata.startDate.localeCompare(
          b.group!.groupMetadata.startDate,
        ),
      ),
    (task) => task.group?.groupValue ?? '',
  );

  return Object.entries(sprintTasks).map(([sprintName, tasks]) => {
    const parentIds = tasks.map((item) => item.Title.number);

    const totalPoints = tasks.reduce((acc, task) => {
      const storyPoints = parentIds.includes(Number(task.parentId?.value))
        ? 0
        : getBusinessDaysDifference(task.end.value, task.start.value) + 1;

      return acc + storyPoints * task.Assignees.length;
    }, 0);

    return {
      sprint: sprintName,
      totalPoints,
    };
  });
};
