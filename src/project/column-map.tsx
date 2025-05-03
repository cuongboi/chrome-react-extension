'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { MultiDateSelector } from '@/components/muti-date-selector';
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
import { fetchJson } from '@/hook/useFetchProject';
import { getStatusColor, getUrlPath } from '@/lib/utils';
import { useColumnStore } from '@/storage/project';

const optionColumnSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const formSchema = z.object({
  start: z.string(),
  end: z.string(),
  actualStart: z.string(),
  actualEnd: z.string(),
  parentId: z.string(),
  statuses: optionColumnSchema.array(),
  holidays: z.date().array(),
});

export default function ColumnMap() {
  const { columns, columnMap, configDescription } = useColumnStore();
  const { type, name, id } = getUrlPath();
  const [saving, setSaving] = React.useState(false);
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start: columnMap?.start || '',
      end: columnMap?.end || '',
      actualStart: columnMap?.actualStart || '',
      actualEnd: columnMap?.actualEnd || '',
      parentId: columnMap?.parentId || '',
      statuses: columnMap?.statuses || [],
      holidays: (columnMap?.holidays ?? []).map((date) => new Date(date)),
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newColumnMap = {
      ...columnMap,
      start: values.start,
      end: values.end,
      actualStart: values.actualStart,
      actualEnd: values.actualEnd,
      parentId: values.parentId,
      statuses: values.statuses,
      holidays: values.holidays.map((date) => date.toUTCString()),
    };

    const description = configDescription.replace(
      /<!--([^>]*)-->/is,
      `<!--${JSON.stringify(newColumnMap, null, 2)}-->`,
    );

    fetchJson(`/${type}/${name}/projects/beta/${id}`, {
      method: 'PUT',
      body: { description },
    })
      .then(() => {
        toast.success('Column map saved successfully');
        setTimeout(() => window.location.reload(), 1000);
      })
      .catch((error) => {
        console.error('Error saving column map', error);
        toast.error('Failed to save column map');
      })
      .finally(() => {
        setSaving(true);
      });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full p-4"
        onChange={() => {
          setSaving(false);
        }}
      >
        <div className="w-full flex items-center gap-4">
          <FormField
            control={form.control}
            name="start"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Start Column</FormLabel>
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
            name="end"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>End Column</FormLabel>
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
        </div>

        <div className="w-full flex items-center gap-4">
          <FormField
            control={form.control}
            name="actualStart"
            render={({ field }) => (
              <FormItem className="w-full">
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
            name="actualEnd"
            render={({ field }) => (
              <FormItem className="w-full">
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

        <FormField
          control={form.control}
          name="holidays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holidays</FormLabel>
              <MultiDateSelector id="controlled-holidays" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 animate-spin" />}
          {saving ? 'Saving' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
