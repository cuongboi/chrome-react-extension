import { ChartGantt, LoaderIcon, SlidersVertical } from 'lucide-react';
import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { useFetchProject } from '../hook/useFetchProject';
import { Chart } from './chart';
import ColumnMap from './column-map';

export const ProjectManager: React.FC<{
  siblingClass: string;
  type: 'chart' | 'config';
}> = ({ siblingClass, type = 'config' }) => {
  const { isReady, columnMap } = useFetchProject({ watch: true });
  const isConfig = React.useMemo(() => type === 'config', [type]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {isConfig ? (
          <button className={cn(siblingClass)} aria-label="config columns map">
            <SlidersVertical size={16} />
          </button>
        ) : (
          columnMap.start && (
            <button className={cn(siblingClass)} aria-label="grantt chart">
              <ChartGantt size={16} />
            </button>
          )
        )}
      </SheetTrigger>
      <SheetContent
        className="flex flex-col h-full w-full"
        style={{
          maxWidth: isConfig ? '30%' : '100%',
        }}
      >
        {isReady ? (
          isConfig ? (
            <ScrollArea className="w-full h-full flex flex-col gap-2">
              <SheetHeader>
                <SheetTitle>Config your columns map</SheetTitle>
                <SheetDescription>
                  Make your columns map to the Gantt chart.
                </SheetDescription>
              </SheetHeader>
              <ColumnMap />
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Gantt Chart</SheetTitle>
                <SheetDescription>
                  See your projects in a Gantt chart.
                </SheetDescription>
              </SheetHeader>

              <Chart className="flex-1 w-full h-full" />
            </div>
          )
        ) : (
          <div className="flex items-center justify-center flex-1">
            <LoaderIcon className="animate-spin" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
