import { load } from 'cheerio';
import { differenceInHours, format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { ListBox, ListBoxItem } from 'react-aria-components';
import * as XLSX from 'xlsx';

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
import { fetchJson } from '@/hook/useFetchProject';
import { useColumnStore, useProjectStore } from '@/storage/project';
import type { FrontTimelineItems, IssueUrl, ProjectItemNode } from '@/types';

interface IssueData {
  title: string;
  number: number;
  frontTimelineItems: FrontTimelineItems;
}

interface Payload {
  payload: {
    preloadedQueries: {
      result: {
        data: {
          repository: {
            issue: IssueData;
          };
        };
      };
    }[];
  };
}

interface StatusResult {
  [key: string]: string;
}

const fetchIssueData = async (
  issue: IssueUrl,
): Promise<Record<string, string>> => {
  try {
    const response = await fetch(issue.url, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const $ = load(await response.text());
    const data = $('script[data-target="react-app.embeddedData"]')
      .text()
      .parseJson<Payload>();

    const issueData =
      data.payload.preloadedQueries[0].result.data.repository.issue;

    const statuses = issueData.frontTimelineItems.edges
      .map((edge) => edge.node)
      .filter((node) => node.status)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    const statusResult = statuses.reduce((acc: StatusResult, status, index) => {
      let result = format(parseISO(status.createdAt), 'yyyy-MM-dd HH:mm');

      if (statuses[index + 1]) {
        const hours = differenceInHours(
          new Date(statuses[index + 1].createdAt),
          new Date(status.createdAt),
        );
        result +=
          `: ${hours > 24 ? Math.floor(hours / 24) + 'd' : ''} ${hours % 24}h`.trim();
      }

      acc[status.status!] = `${acc[status.status!] || ''}\n${result}`.trim();
      return acc;
    }, {});

    return {
      Title: issueData.title,
      Url: issue.url,
      ...statusResult,
    };
  } catch (error) {
    console.error(`Error fetching issue ${issue.url}:`, error);
    return { Title: 'Error', Url: issue.url };
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
      return { url, owner: match[1], repo: match[2], issue: match[3] };
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
      const element = document.getElementById(
        'memex-paginated-items-get-api-data',
      );
      if (!element) throw new Error('Export URL element not found');

      const { url } = element.innerHTML.parseJson<{ url: string }>();
      if (!url) throw new Error('No export URL found');

      const requestUrl = new URL(url, window.location.origin);
      requestUrl.searchParams.set(
        'groupedBy[columnId]',
        Object.values(columns).find((col) => (col.type = 'dataType'))?.id,
      );
      const { groupedItems } = await fetchJson<{
        groupedItems: {
          groupId: string;
          nodes: ProjectItemNode[];
        }[];
      }>(requestUrl.toString());

      const nodes = groupedItems
        .filter((group) => selectedGroups.includes(group.groupId))
        .flatMap((group) => group.nodes);

      const issues = extractIssues(nodes);

      const data = await Promise.all(issues.map(fetchIssueData));

      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: [
          'Title',
          'Url',
          ...columns.Status.settings.options.map(
            (option: { name: string }) => option.name,
          ),
        ],
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
  }, [columns, selectedGroups]);

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

          <Button
            onClick={handleExport}
            disabled={isExporting || !isReady || !selectedGroups.length}
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
