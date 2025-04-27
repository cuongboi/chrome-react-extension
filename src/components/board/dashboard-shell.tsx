import type React from 'react';

import { cn } from '@/lib/utils';

import { ScrollArea } from '../ui/scroll-area';

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <ScrollArea className="h-[calc(100vh_-_var(--spacing)*16)] w-full flex flex-col">
      <div
        className={cn('flex-1 dashboard h-fit space-y-4 px-4 pb-6', className)}
      >
        {children}
      </div>
    </ScrollArea>
  );
}
