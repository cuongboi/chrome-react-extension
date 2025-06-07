'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TaskItem } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getSprintWorkload } from './utils';

interface SprintWorkLoadChartProps {
  items: TaskItem[];
  selectedSprint: string;
}

export function SprintWorkLoadChart({
  items,
  selectedSprint,
}: SprintWorkLoadChartProps) {
  const data = React.useMemo(() => {
    const sprintWorkload = getSprintWorkload(items);
    const currentSprintIndex = sprintWorkload.findIndex(
      (item) => item.sprint === selectedSprint,
    );

    return sprintWorkload.slice(0, currentSprintIndex + 1);
  }, [items, selectedSprint]);
  const contentRef = React.useRef<HTMLDivElement>(null);

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
          <CardTitle className="text-sm font-medium">
            Sprints Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={contentRef}
            className="flex h-full flex-col justify-between w-full overflow-x-auto scrollbar"
          >
            <ChartContainer
              config={{
                totalPoints: {
                  label: 'Points',
                  color: 'var(--borderColor-success-emphasis)',
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
                  dataKey="totalPoints"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={35}
                  fill="var(--borderColor-success-emphasis)"
                  label={{
                    position: 'middle',
                    fill: '#ffffff',
                    fontSize: 12,
                  }}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    )
  );
}
