'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

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
import type { TaskItem } from '@/types';

import { getBurndownData } from './utils';

interface SprintBurndownChartProps {
  selectedSprint: string;
  items: TaskItem[];
}

export function SprintBurndownChart({
  selectedSprint,
  items,
}: SprintBurndownChartProps) {
  const data = getBurndownData(items, selectedSprint);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Burndown</CardTitle>
        <CardDescription>
          Remaining tasks over the sprint duration
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="h-full w-full">
          <ChartContainer
            config={{
              remaining: {
                label: 'Actual',
                color: 'var(--bgColor-success-emphasis)',
              },
              ideal: {
                label: 'Ideal',
                color: 'var(--borderColor-accent-emphasis)',
              },
            }}
            className="h-full w-full"
          >
            <LineChart
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
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={() => ''}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickCount={5}
                domain={[0, 'dataMax']}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="remaining"
                strokeWidth={2}
                activeDot={{ r: 3 }}
                dot={{ r: 2 }}
                stroke="var(--bgColor-success-emphasis)"
              />
              <Line
                dataKey="ideal"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                stroke="var(--borderColor-accent-emphasis)"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
