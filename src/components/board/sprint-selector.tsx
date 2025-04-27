'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/storage/project';

interface SprintSelectorProps {
  selectedSprint: string;
  onSprintChange: (sprint: string) => void;
}

export function SprintSelector({
  selectedSprint,
  onSprintChange,
}: SprintSelectorProps) {
  const { groups } = useProjectStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-1 min-w-[150px]"
        >
          {selectedSprint} <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(groups).map((sprint) => (
          <DropdownMenuItem
            key={sprint.groupValue}
            onClick={() => onSprintChange(sprint.groupValue)}
          >
            {sprint.groupValue}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
