import { differenceInHours, format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { ListBox, ListBoxItem } from 'react-aria-components';
import * as XLSX from 'xlsx';

import { getBusinessDaysDifference } from '@/components/board/utils';
import CsvIcon from '@/components/icons/csv';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { fetchJson } from '@/lib/fetch-json';
import { useColumnStore, useProjectStore } from '@/storage/project';
import type { FrontTimelineItems, IssueUrl, ProjectItemNode } from '@/types';

interface StatusResult {
  [key: string]: string;
}

const fetchIssueData = async (
  issue: IssueUrl,
): Promise<Record<string, string>> => {
  try {
    const url = new URL('https://github.com/_graphql');
    url.searchParams.set(
      'body',
      JSON.stringify({
        query: 'f8994f3e48f3756cb77fa67b56c2eec4',
        variables: { count: 250, cursor: null, id: issue.id },
      }),
    );

    const {
      data: { node },
    } = await fetchJson<{
      data: {
        node: {
          backTimelineItems: FrontTimelineItems;
        };
      };
    }>(url);

    const statuses = node.backTimelineItems.edges
      .map((edge) => edge.node)
      .filter((node) => node.status)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    const statusResult = statuses.reduce((acc: StatusResult, status, index) => {
      let result = format(parseISO(status.createdAt), 'yyyy-MM-dd HH:mm');

      if (statuses[index + 1]) {
        const days = getBusinessDaysDifference(
          statuses[index + 1].createdAt,
          status.createdAt,
        );

        const hours = differenceInHours(
          new Date(statuses[index + 1].createdAt),
          new Date(status.createdAt),
        );

        result += `: ${days > 0 ? days + 'd ' : ''}${hours % 24}h`.trim();
      }

      acc[status.status!] = `${acc[status.status!] || ''}\n${result}`.trim();
      return acc;
    }, {});

    return {
      Title: issue.title,
      Url: issue.url,
      Status: String(statuses.at(-1)?.status),
      ...statusResult,
    };
  } catch (error) {
    console.log(`Error fetching issue ${issue.url}:`, error);
    return { Url: issue.url };
  }
};

// Extract issues from nodes
const extractIssues = (nodes: ProjectItemNode[]): IssueUrl[] => {
  return nodes
    .filter((node) => node.content.url)
    .map((node) => {
      const url = String(node.content.url);
      const match = url.match(/\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
      if (!match) {
        console.error('Invalid issue URL:', url);
        return null;
      }

      const title = node.memexProjectColumnValues.find(
        (col) => col.memexProjectColumnId === 'Title',
      )?.value?.title?.raw;

      return {
        url,
        owner: match[1],
        repo: match[2],
        issue: match[3],
        id: node.content.globalRelayId,
        title,
      };
    })
    .filter((issue): issue is IssueUrl => issue !== null);
};

export const ExportButton: React.FC<{
  siblingClass: string;
  isReady: boolean;
}> = ({ siblingClass, isReady }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { columns } = useColumnStore();
  const { groups } = useProjectStore();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const requestUrl = window.cache.get('items-get-api-data') as URL;

      let nodes: ProjectItemNode[] = [];

      const response = await fetchJson<{
        nodes?: ProjectItemNode[];
        groupedItems: {
          groupId: string;
          nodes: ProjectItemNode[];
        }[];
      }>(requestUrl);

      if (response.groupedItems) {
        nodes = response.groupedItems
          .filter((group) => selectedGroups.includes(group.groupId))
          .flatMap((group) => group.nodes);
      } else if (response.nodes) {
        nodes = response.nodes;
      }

      const issues = extractIssues(nodes);

      const data = await Promise.all(issues.map(fetchIssueData));
      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: [
          'Title',
          'Url',
          'Status',
          ...(columns.Status?.settings?.options ?? []).map(
            (option: { name: string }) => option.name,
          ),
        ],
        cellStyles: true,
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');

      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `issues-data-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(csvUrl);
    } catch (error) {
      console.log('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [columns, selectedGroups, window.location.href]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={siblingClass}
          aria-label="Export project to CSV"
          disabled={isExporting || !isReady}
          data-variant="default"
        >
          <CsvIcon size={16} />
        </button>
      </SheetTrigger>
      <SheetContent
        className="flex flex-col h-screen w-full gap-0"
        style={{
          maxWidth: '30%',
          // @ts-expect-error css variable
          '--sheet-content-height': 'calc(100vh - var(--base-size-4)*23)',
        }}
      >
        <SheetHeader>
          <SheetTitle>Export Project Data</SheetTitle>
          <SheetDescription>
            Click the button below to export your project's issues data to a CSV
            file.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col p-4 gap-4 w-full">
          {Object.values(groups).length > 0 && (
            <div className="space-y-2">
              <Label>Select Sprints</Label>
              <ListBox
                className="bg-background max-h-100 scrollbar min-h-20 space-y-1 overflow-auto border-input rounded-md border p-1 text-sm shadow-xs transition-[color,box-shadow]"
                aria-label="Select Sprints"
                selectionMode="multiple"
                onSelectionChange={(selected) => {
                  if (selected === 'all') {
                    setSelectedGroups(Object.keys(groups));
                  }

                  if (selected instanceof Set) {
                    setSelectedGroups(
                      // @ts-expect-error react-aria-components
                      Array.from(selected.entries()).map(([key]) => key),
                    );
                  }
                }}
              >
                {Object.values(groups).map((group) => (
                  <ListBoxItem
                    key={group.groupId}
                    id={group.groupId}
                    className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:ring-[3px]"
                  >
                    {group.groupValue}
                  </ListBoxItem>
                ))}
              </ListBox>
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              !isReady ||
              (Object.values(groups).length > 0 && !selectedGroups.length)
            }
          >
            {isExporting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" size={16} />
            )}
            Export
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
