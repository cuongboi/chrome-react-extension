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

import { getTeamWorkload } from './utils';

interface TeamWorkloadChartProps {
  selectedSprint: string;
  items: TaskItem[];
}

export function TeamWorkloadChart({
  selectedSprint,
  items,
}: TeamWorkloadChartProps) {
  const data = getTeamWorkload(items, selectedSprint);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>
          Tasks and story points assigned per team member
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="h-full w-full">
          <ChartContainer
            config={{
              tasks: {
                label: 'Tasks',
              },
              storyPoints: {
                label: 'Story Points',
              },
            }}
            className="h-full w-full"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="tasks"
                barSize={20}
                radius={[0, 4, 4, 0]}
                fill="var(--bgColor-accent-emphasis)"
              />
              <Bar
                dataKey="storyPoints"
                barSize={20}
                radius={[0, 4, 4, 0]}
                fill="var(--borderColor-success-emphasis)"
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
