import { ChartGantt, LoaderIcon, SlidersVertical } from 'lucide-react';
import React from 'react';
import { Toaster } from 'sonner';

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

import { Board } from './board';
import ColumnMap from './column-map';

export const ProjectManager: React.FC<{
  siblingClass: string;
  type: 'chart' | 'config';
  isReady: boolean;
}> = ({ siblingClass, type = 'config', isReady }) => {
  const isConfig = React.useMemo(() => type === 'config', [type]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {isConfig ? (
          <button className={cn(siblingClass)} aria-label="config columns map">
            <SlidersVertical size={16} />
          </button>
        ) : (
          isReady && (
            <button className={cn(siblingClass)} aria-label="gantt chart">
              <ChartGantt size={16} />
            </button>
          )
        )}
      </SheetTrigger>
      <SheetContent
        className="flex flex-col h-screen w-full gap-0"
        style={{
          maxWidth: isConfig ? '30%' : '100%',
          // @ts-expect-error css variable
          '--sheet-content-height': 'calc(100vh - var(--base-size-4)*23)',
        }}
      >
        {isReady ? (
          isConfig ? (
            <ScrollArea className="w-full h-full flex flex-col gap-2">
              <SheetHeader>
                <SheetTitle>Config your columns map</SheetTitle>
                <SheetDescription>
                  Make your columns map to the Dashboard & Gantt chart.
                </SheetDescription>
              </SheetHeader>
              <ColumnMap />
            </ScrollArea>
          ) : (
            <Board />
          )
        ) : (
          <div className="flex items-center justify-center flex-1">
            <LoaderIcon className="animate-spin" />
          </div>
        )}
        <Toaster />
      </SheetContent>
    </Sheet>
  );
};
