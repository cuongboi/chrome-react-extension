import { load } from 'cheerio';
import { endOfToday, startOfToday } from 'date-fns';
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
const fetchJson = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: GHRequestHeaders,
    mode: 'cors',
    credentials: 'include',
  });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return response.json();
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
    actualStart: itemValues.get(String(columnMap['actualStart'])),
    actualEnd: itemValues.get(String(columnMap['actualEnd'])),
  };

  const dateFields = {
    start: columnMap.start,
    end: columnMap.end,
  };

  for (const [key, field] of Object.entries(dateFields)) {
    const value = field.find(({ value }) => itemValues.get(String(value)));
    if (value)
      columnData[key as keyof typeof columnData] = itemValues.get(
        String(value.value),
      );
  }

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

const updateActualItems = async (
  items: TaskItem[],
  updateType: 'actualStart' | 'actualEnd',
  value: string,
  columnMap: ColumnMapValue,
  updateApi: string,
): Promise<void> => {
  const updatePromises = items.map((item) =>
    fetchJson(updateApi, {
      method: 'PUT',
      body: JSON.stringify({
        memexProjectItemId: item.id,
        memexProjectColumnValues: [
          { memexProjectColumnId: columnMap[updateType], value },
        ],
      }),
    }),
  );

  await Promise.all(updatePromises).catch((err) =>
    console.error(`Update failed: ${err.message}`),
  );
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
  const { setColumns, columns, columnMap: mapWithPathname } = useColumnStore();
  const columnMap = mapWithPathname[window.location.pathname];

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
      const [columnsDataRaw, itemsRaw, updateApiRaw] = [
        $('#memex-columns-data').text(),
        $('#memex-paginated-items-data').text(),
        $('#memex-item-update-api-data').text(),
      ];

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

    const updates = [
      {
        items: items.filter(
          (item) =>
            !item.actualStart && item.Status?.id === columnMap.statusStart,
        ),
        type: 'actualStart' as const,
        value: startOfToday().toISOString(),
      },
      {
        items: items.filter(
          (item) => !item.actualEnd && item.Status?.id === columnMap.statusEnd,
        ),
        type: 'actualEnd' as const,
        value: endOfToday().toISOString(),
      },
    ];

    updates.forEach(({ items, type, value }) => {
      if (items.length) {
        updateActualItems(items, type, value, columnMap, updateApi);
      }
    });

    setBoardItems(items, columnMap);
  }, [items, columnMap, updateApi]);

  return { isReady, items, groups, columns, columnMap };
}
