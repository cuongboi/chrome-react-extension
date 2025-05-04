import { load } from 'cheerio';
import { useEffect, useState } from 'react';

import { GHRegex, GHRequestHeaders } from '@/lib/contains';
import { convertColor } from '@/lib/utils';
import {
  useColumnStore,
  useProjectStore,
  type ColumnMap,
  type ColumnMapValue,
} from '@/storage/project';
import type { StatusValue, TaskItem, ValueLabels } from '@/types';

interface Config {
  watch?: boolean;
}

interface ItemGroupParsed {
  groups?: { nodes: Array<{ groupId: string; groupMetadata: any }> };
  groupedItems?: Array<{ groupId: string; nodes: any[] }>;
  nodes: any[];
}

// Utility Functions
export const fetchJson = async <T>(
  input: RequestInfo | URL,
  options: Omit<RequestInit, 'body'> & {
    body?: unknown;
  } = {},
): Promise<T> => {
  const response = await fetch(input, {
    ...options,
    headers: {
      ...GHRequestHeaders,
      ...options.headers,
    },
    mode: 'cors',
    credentials: 'include',
    body:
      typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body),
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  try {
    return response.json();
  } catch {
    return response.text() as unknown as T;
  }
};

const parseItemValues = (item: any): Map<string, any> =>
  new Map<string, any>(
    item.memexProjectColumnValues.map((col: any) => [
      String(col.memexProjectColumnId),
      col.value,
    ]),
  );

const parseColumnData = (
  columnMap: ColumnMap[string],
  item: any,
  statusOptions: StatusValue[] = [],
): Partial<TaskItem> => {
  const itemValues = parseItemValues(item);
  const statusId = itemValues.get('Status')?.id;
  const status = statusOptions.find((option) => option.id === statusId);

  const columnData: Partial<TaskItem> = {
    Title: itemValues.get('Title'),
    Assignees: itemValues.get('Assignees'),
    Status: status
      ? {
          ...itemValues.get('Status'),
          ...status,
          color: convertColor(status.color as any),
        }
      : undefined,
    Labels: itemValues.get('Labels') as ValueLabels[],
    parentId: itemValues.get(String(columnMap['parentId'])),
    start: itemValues.get(String(columnMap['start'])),
    end: itemValues.get(String(columnMap['end'])),
    actualStart: itemValues.get(String(columnMap['actualStart'])),
    actualEnd: itemValues.get(String(columnMap['actualEnd'])),
  };

  return columnData as TaskItem;
};

const processItems = (
  itemGroupParsed: ItemGroupParsed,
  columnMap: ColumnMapValue,
  statusOptions: StatusValue[] = [],
): { taskItems: TaskItem[]; groups: Record<string, any> } => {
  const groups: Record<string, any> =
    itemGroupParsed.groups?.nodes
      .filter((group) => group.groupMetadata)
      .reduce((acc, cur) => ({ ...acc, [cur.groupId]: cur }), {}) ?? {};

  const items = itemGroupParsed.groupedItems
    ? itemGroupParsed.groupedItems.flatMap((groupNode) =>
        groupNode.nodes.map((node) => ({
          ...node,
          group: groups[groupNode.groupId],
        })),
      )
    : itemGroupParsed.nodes.map((node) => ({ ...node, group: undefined }));

  const taskItems = items.map((item) => ({
    id: item.id,
    contentId: item.contentId,
    contentType: item.contentType,
    ...parseColumnData(columnMap, item, statusOptions),
    group: item.group,
  })) as TaskItem[];

  return { taskItems, groups };
};

// Main Hook
export function useFetchProject({ watch = false }: Config = {}) {
  const [isReady, setIsReady] = useState(false);
  const {
    setItems,
    items,
    setBoardItems,
    setGroups,
    groups,
    setUpdateApi,
    updateApi,
  } = useProjectStore();
  const { setColumns, columns, setColumnMap, columnMap, setConfigDescription } =
    useColumnStore();

  const parseAndStoreGroups = (groups: Record<string, any>) =>
    setGroups(
      Object.values(groups)
        .filter((group) => group.groupMetadata)
        .reduce((acc, cur) => ({ ...acc, [cur.groupId]: cur }), {}),
    );

  const processAndFilterItems = (taskItems: TaskItem[]) => {
    const filteredItems = taskItems
      .filter((item) => item.start?.value && item.end?.value)
      .sort(
        (a, b) =>
          new Date(a.start!.value).getTime() -
          new Date(b.start!.value).getTime(),
      );
    setItems(filteredItems);
    return filteredItems;
  };

  const fetchProjectData = async () => {
    if (!window.location.href.match(GHRegex)) return;

    try {
      const $ = load(document.documentElement.innerHTML);
      const [columnsDataRaw, itemsRaw, updateApiRaw, projectConfigRaw] = [
        $('#memex-columns-data').text(),
        $('#memex-paginated-items-data').text(),
        $('#memex-item-update-api-data').text(),
        $('#memex-data').text(),
      ];
      const projectConfig = projectConfigRaw.parseJson<{
        description: string;
      }>();

      setConfigDescription(projectConfig.description);

      const columnMapRaw =
        projectConfig.description?.match(/<!--([^>]*)-->/is)?.[1] ?? '{}';

      const columnMap = columnMapRaw.parseJson<ColumnMapValue>();
      window.holidays = columnMap.holidays ?? [];

      setColumnMap(columnMap);
      setUpdateApi(JSON.parse(updateApiRaw).url);
      setColumns(
        JSON.parse(columnsDataRaw).reduce(
          (acc: Record<string, any>, column: any) => ({
            ...acc,
            [column.id]: column,
          }),
          {},
        ),
      );

      if (!columnMap) return;

      const { taskItems, groups } = processItems(
        JSON.parse(itemsRaw),
        columnMap,
        columns.Status?.settings.options ?? [],
      );

      parseAndStoreGroups(groups);
      processAndFilterItems(taskItems);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
    } finally {
      setIsReady(true);
    }
  };

  const handleUpdateEvent = async ({
    type,
    url,
  }: {
    type: string;
    url: string;
  }) => {
    if (type !== 'extension:paginated_items' || !columnMap) return;

    try {
      const data = await fetchJson<ItemGroupParsed>(url);
      const { taskItems, groups } = processItems(
        data,
        columnMap,
        columns.Status?.settings.options ?? [],
      );
      parseAndStoreGroups(groups);
      processAndFilterItems(taskItems);
    } catch (err) {
      console.error('Update fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchProjectData();

    if (watch) {
      window.ev.removeAllListeners('extension:paginated_items');
      window.ev.on('extension:paginated_items', handleUpdateEvent);
    }

    return () => {
      if (watch) window.ev.removeAllListeners('extension:paginated_items');
    };
  }, [window.location.href, columnMap]);

  useEffect(() => {
    if (!items.length || !columnMap || !updateApi) return;

    setBoardItems(items, columnMap);
  }, [items, columnMap, updateApi]);

  return { isReady, items, groups, columns, columnMap };
}
