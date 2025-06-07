import type React from 'react';

import { cn } from '@/lib/utils';

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div
      className={cn(
        'flex-1 dashboard h-fit space-y-4 px-4 pb-6  w-full flex flex-col',
        className,
      )}
    >
      {children}
    </div>
  );
}
