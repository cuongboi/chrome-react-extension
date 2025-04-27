'use client';

import React from 'react';
import { Cell, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useColumnStore } from '@/storage/project';
import type { StatusValue, TaskItem } from '@/types';

import { getTaskCompletionStats } from './utils';

interface TaskCompletionChartProps {
  selectedSprint: string;
  items: TaskItem[];
}

export function TaskCompletionChart({
  selectedSprint,
  items,
}: TaskCompletionChartProps) {
  const { getStatus, columns } = useColumnStore();

  const data = getTaskCompletionStats(items, selectedSprint).map((stat) => ({
    ...stat,
    name: getStatus(stat.name).name,
    color: getStatus(stat.name).color,
  }));

  const config = React.useMemo(() => {
    return (columns.Status.settings.options as StatusValue[]).reduce(
      (acc, status) => {
        acc[status.name] = {
          label: status.name,
          color: status.color,
        };

        return acc;
      },
      {} as Record<string, { label: string; color: string }>,
    );
  }, [columns]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion</CardTitle>
        <CardDescription>Current sprint task status breakdown</CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="h-full w-full">
          <ChartContainer config={config} className="h-full w-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={1}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry, index) => {
                  return <Cell key={`cell-${index}`} fill={entry.color} />;
                })}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
