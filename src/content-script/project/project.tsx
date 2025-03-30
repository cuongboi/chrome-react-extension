import { ChartGantt, LoaderIcon, SlidersVertical } from 'lucide-react';
import React from 'react';

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
  const { isReady, columnMap } = useFetchProject(true);
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
        className="flex flex-col h-full"
        style={{
          maxWidth: isConfig ? '30%' : '80%',
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {isConfig ? 'Config your columns map' : 'Gantt Chart'}
          </SheetTitle>
          <SheetDescription>
            {isConfig ? 'Make your columns map to the Gantt chart.' : ''}
          </SheetDescription>
        </SheetHeader>

        {isReady ? (
          <div className="px-4 flex-1 h-full">
            {isConfig ? <ColumnMap /> : <Chart />}
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <LoaderIcon className="animate-spin" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
