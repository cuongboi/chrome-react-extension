'use client';

import { ArrowUp } from 'lucide-react';
import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useProjectStore } from '@/storage/project';
import type { TaskItem } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getPrevSprint, sprintLabelTasks } from './utils';

interface BugCounterChartProps {
  selectedSprint: string;
  items: TaskItem[];
}

export function BugCounterChart({
  selectedSprint,
  items,
}: BugCounterChartProps) {
  const { groups } = useProjectStore();
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { data, currentBugCount, prevSprintCount } = React.useMemo(() => {
    const prevSprint = getPrevSprint(Object.values(groups), selectedSprint);
    const sprintLabels = sprintLabelTasks(groups, items, selectedSprint);

    const data = sprintLabels.map(({ sprint, labels }) => ({
      sprint,
      bug: Number(labels.get('bug')?.tasks.length || 0),
    }));

    return {
      data,
      currentBugCount:
        data.find((item) => item.sprint === selectedSprint)?.bug || 0,
      prevSprintCount:
        data.find((item) => item.sprint === prevSprint)?.bug || 0,
    };
  }, [items, selectedSprint]);

  React.useEffect(() => {
    if (contentRef.current) {
      const scrollWidth = contentRef.current.scrollWidth;
      const clientWidth = contentRef.current.clientWidth;
      const scrollLeft = scrollWidth - clientWidth;

      if (scrollLeft > 0) {
        contentRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }
    }
  }, [contentRef.current]);

  return (
    data && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sprints Bug</CardTitle>
          <ArrowUp
            className={`h-4 w-4 ${currentBugCount < prevSprintCount ? 'text-green-600 rotate-180' : 'text-red-600'}`}
          />
        </CardHeader>
        <CardContent>
          <div
            ref={contentRef}
            className="flex h-full flex-col justify-between w-full overflow-x-auto scrollbar"
          >
            <ChartContainer
              config={{
                bug: {
                  label: 'Bug',
                  color: 'var(--color-red-600)',
                },
              }}
              className="h-24 table"
              style={{
                width: `max(${data.length * 80}px, 100%)`,
              }}
            >
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="sprint"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="bug"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={35}
                  fill="var(--color-red-600)"
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    )
  );
}
