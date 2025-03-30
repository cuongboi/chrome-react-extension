'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import InputNumber from '@/components/input-number';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useColumnStore } from '@/storage/project';

const formSchema = z.object({
  start: z.string(),
  end: z.string(),
  progress: z.string(),
  sprintDuration: z.number(),
});

export default function ColumnMap() {
  const { columns, setColumnMap, columnMap } = useColumnStore();
  const [saved, setSaved] = React.useState(false);
  const columnOptions = React.useMemo(() => {
    return {
      date: Object.entries(columns).map(
        ([key, value]) =>
          value.userDefined &&
          value.visible &&
          value.dataType === 'date' && (
            <SelectItem value={key} key={key}>
              {value.name}
            </SelectItem>
          ),
      ),
      number: Object.entries(columns).map(
        ([key, value]) =>
          value.userDefined &&
          value.visible &&
          value.dataType === 'number' && (
            <SelectItem value={key} key={key}>
              {value.name}
            </SelectItem>
          ),
      ),
    };
  }, [columns]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: String(columnMap.start),
      end: String(columnMap.end),
      progress: String(columnMap.progress),
      sprintDuration: Number(columnMap.sprintDuration || 14),
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setColumnMap(values);
      setSaved(true);
      toast.success('Column map saved successfully');
    } catch (error) {
      console.error('Form submission error', error);
      toast.error('Failed to submit the form. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full"
        onChange={() => {
          setSaved(false);
        }}
      >
        <FormField
          control={form.control}
          name="start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Column</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select as Time Start column" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>{columnOptions.date}</SelectContent>
              </Select>
              <FormDescription>
                Column that contains the start date of the task. Data type must
                be date.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Column</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select as Time End column" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>{columnOptions.date}</SelectContent>
              </Select>
              <FormDescription>
                Column that contains the end date of the task. Data type must be
                date.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="progress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progress Column</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    {/* Create placeholder for progress column */}
                    <SelectValue placeholder="Select as progress column" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>{columnOptions.number}</SelectContent>
              </Select>
              <FormDescription>
                Column that contains the progress of the task. Data type must be
                number with 0-100 range.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sprintDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spint Duration</FormLabel>
              <InputNumber {...field} />
              <FormDescription>
                Duration of the sprint in days. This will be used to calculate
                the progress of the task.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">{saved ? 'Saved' : 'Submit'}</Button>
      </form>
    </Form>
  );
}
