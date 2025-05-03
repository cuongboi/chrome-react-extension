'use client';

import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiDateSelectorProps {
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the button */
  buttonClassName?: string;
  /** Custom class name for the popover content */
  popoverClassName?: string;
  /** Placeholder text when no dates are selected */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Selected dates (for controlled component) */
  value?: Date[];
  /** Callback when selected dates change */
  onChange?: (dates: Date[]) => void;
  /** Custom format for displaying selected count */
  selectedCountFormat?: (count: number) => string;
  /** Whether to show the clear button */
  showClearButton?: boolean;
  /** Text for the clear button */
  clearButtonText?: string;
  /** ID for the component */
  id?: string;
  /** Name for the component (for forms) */
  name?: string;
  /** Required field */
  required?: boolean;
  /** ARIA label */
  ariaLabel?: string;
}

export function MultiDateSelector({
  className,
  buttonClassName,
  popoverClassName,
  placeholder = 'Select dates',
  disabled = false,
  value,
  onChange,
  selectedCountFormat,
  id,
  name,
  required,
  ariaLabel = 'Select dates',
}: MultiDateSelectorProps) {
  // State for uncontrolled component

  const [selectedDates, setSelectedDates] = useState<Date[]>(value || []);
  const [open, setOpen] = useState(false);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedDates(value);
    }
  }, [value]);

  // Handle date selection
  const handleDateChange = (dates: Date[] | undefined) => {
    if (!dates) return;

    setSelectedDates(dates);

    if (onChange) {
      onChange(dates);
    }
  };

  const getSelectedText = () => {
    if (selectedDates.length === 0) {
      return placeholder;
    }

    if (selectedCountFormat) {
      return selectedCountFormat(selectedDates.length);
    }

    return `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`;
  };

  return (
    <div className={cn('flex flex-col w-full', className)}>
      <Popover
        open={disabled ? false : open}
        onOpenChange={disabled ? undefined : setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDates.length && 'text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
              buttonClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{getSelectedText()}</span>
            {name && (
              <input
                type="hidden"
                name={name}
                value={selectedDates.map((d) => d.toISOString()).join(',')}
                required={required}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-auto p-0 pointer-events-auto', popoverClassName)}
          align="start"
          asChild
        >
          <div>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(value) => {
                handleDateChange(value);
              }}
              classNames={{
                day_selected:
                  '!bg-primary !rounded-full !text-primary-foreground',
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
