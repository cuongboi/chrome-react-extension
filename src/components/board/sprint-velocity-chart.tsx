'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

import { getVelocityData } from './utils';

interface SprintVelocityChartProps {
  selectedSprint: string;
  items: TaskItem[];
}

export function SprintVelocityChart({
  selectedSprint,
  items,
}: SprintVelocityChartProps) {
  const data = getVelocityData(items, selectedSprint);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Velocity</CardTitle>
        <CardDescription>
          Tasks completed vs committed per sprint
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="h-full w-full">
          <ChartContainer
            config={{
              completed: {
                label: 'Released',
                color: 'var(--bgColor-success-emphasis)',
              },
              committed: {
                label: 'Committed',
                color: 'var(--borderColor-accent-emphasis)',
              },
            }}
            className="h-full w-full"
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
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickCount={5}
                domain={[0, 'dataMax']}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="completed"
                radius={[4, 4, 0, 0]}
                maxBarSize={35}
                fill="var(--bgColor-success-emphasis)"
              />
              <Bar
                dataKey="committed"
                radius={[4, 4, 0, 0]}
                maxBarSize={35}
                fill="var(--borderColor-accent-emphasis)"
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
