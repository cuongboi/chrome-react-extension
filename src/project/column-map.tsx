'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import MultipleSelector from '@/components/ui/multiselect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getStatusColor } from '@/lib/utils';
import { useColumnStore } from '@/storage/project';

const optionColumnSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const formSchema = z.object({
  start: optionColumnSchema.array(),
  end: optionColumnSchema.array(),
  actualStart: z.string(),
  actualEnd: z.string(),
  statusStart: z.string(),
  statusEnd: z.string(),
  parentId: z.string(),
  statuses: optionColumnSchema.array(),
});

export default function ColumnMap() {
  const { columns, setColumnMap, columnMap: columnMapStore } = useColumnStore();

  const [saved, setSaved] = React.useState(false);
  const columnOptions = React.useMemo(() => {
    return {
      dateList: Object.entries(columns)
        .filter(([, value]) => value.dataType === 'date')
        .map(([key, value]) => ({
          value: key,
          label: value.name,
        })),
      date: Object.entries(columns).map(
        ([key, value]) =>
          value.userDefined &&
          value.dataType === 'date' && (
            <SelectItem value={key} key={key}>
              {value.name}
            </SelectItem>
          ),
      ),
      number: Object.entries(columns).map(
        ([key, value]) =>
          value.userDefined &&
          value.dataType === 'number' && (
            <SelectItem value={key} key={key}>
              {value.name}
            </SelectItem>
          ),
      ),

      statuses: (columns.Status?.settings?.options ?? []).map(
        ({ id, name }: any) => (
          <SelectItem value={id} key={id} className={'flex items-center gap-2'}>
            <i
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: getStatusColor(
                  id,
                  columns.Status.settings.options,
                ),
              }}
            />
            {name}
          </SelectItem>
        ),
      ),

      statusList: (columns.Status?.settings?.options ?? []).map(
        ({ id, name }: any) => ({
          value: id,
          label: name,
        }),
      ),
    };
  }, [columns]);

  const columnMap = React.useMemo(() => {
    const map = columnMapStore[window.location.pathname] ?? {};
    return {
      start: map?.start ?? [],
      end: map?.end ?? [],
      parentId: map?.parentId,
      actualStart: map?.actualStart,
      actualEnd: map?.actualEnd,
      statusStart: map?.statusStart,
      statusEnd: map?.statusEnd,
      statuses: map?.statuses ?? [],
    };
  }, [columns, columnMapStore]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: columnMap,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setColumnMap(window.location.pathname, values);
      setSaved(true);
      window.location.reload();
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
        className="flex flex-col gap-4 w-full p-4"
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

              <MultipleSelector
                commandProps={{
                  label: 'Select as Time Start column',
                }}
                options={columnOptions.dateList}
                placeholder="Select as Time Start column"
                hideClearAllButton
                hidePlaceholderWhenSelected
                emptyIndicator={
                  <p className="text-center text-sm">No results found</p>
                }
                value={field.value}
                onChange={field.onChange}
              />

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
              <MultipleSelector
                commandProps={{
                  label: 'Select as Time End column',
                }}
                options={columnOptions.dateList}
                placeholder="Select as Time End column"
                hideClearAllButton
                hidePlaceholderWhenSelected
                emptyIndicator={
                  <p className="text-center text-sm">No results found</p>
                }
                value={field.value}
                onChange={field.onChange}
              />

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4 w-full">
          <FormField
            control={form.control}
            name="actualStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Start Column</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select as parent column" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{columnOptions.date}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status for Actual Start</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select as parent column" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{columnOptions.statuses}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <FormField
            control={form.control}
            name="actualEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual End Column</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select as parent column" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{columnOptions.date}</SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="statusEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status for Actual End</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select as parent column" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{columnOptions.statuses}</SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Column</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select as parent column" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>{columnOptions.number}</SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="statuses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sprint Statuses</FormLabel>

              <MultipleSelector
                commandProps={{
                  label: 'Select as Sprint Statuses',
                }}
                options={columnOptions.statusList}
                placeholder="Select as Sprint Statuses"
                hideClearAllButton
                hidePlaceholderWhenSelected
                emptyIndicator={
                  <p className="text-center text-sm">No results found</p>
                }
                value={field.value}
                onChange={field.onChange}
                optionLabelRender={(option) => (
                  <div className="flex items-center gap-2">
                    <i
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: getStatusColor(
                          option.value,
                          columns.Status.settings.options,
                        ),
                      }}
                    />
                    {option.label}
                  </div>
                )}
              />

              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={saved}>
          {saved ? 'Saved' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
