import { load } from 'cheerio';

import type { ColumnMap, ColumnMapValue } from '@/storage/project';
import type {
  ItemGroupParsed,
  StatusValue,
  TaskItem,
  ValueLabels,
} from '@/types';

import { fetchJson } from './fetch-json';
import { convertColor } from './utils';

export const parseItemValues = (item: any): Map<string, any> =>
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

export const processItems = (
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

export const processAndFilterItems = (taskItems: TaskItem[]) => {
  return taskItems
    .filter((item) => item.start?.value && item.end?.value)
    .sort(
      (a, b) =>
        new Date(a.start!.value).getTime() - new Date(b.start!.value).getTime(),
    );
};

export const loadConfig = async () => {
  const $ = load(document.documentElement.innerHTML);
  const columns = $('#memex-columns-data')
    .text()
    .parseJson<any[]>()
    .reduce(
      (acc: Record<string, any>, column: any) => ({
        ...acc,
        [column.id]: column,
      }),
      {} as Record<string, any>,
    );

  const memexData = $('#memex-data').text().parseJson<{
    description: string;
  }>();

  const configDescription = memexData.description ?? '';
  const columnMapRaw = configDescription.match(/<!--([^>]*)-->/is)?.[1] ?? '{}';
  const columnMap = columnMapRaw.parseJson<ColumnMapValue>();
  window.holidays = columnMap.holidays ?? [];

  const { url: itemsGetApiUrl } = $('#memex-paginated-items-get-api-data')
    .text()
    .parseJson<{ url: string }>();

  const url = new URL(itemsGetApiUrl, window.location.origin);
  url.searchParams.set('from', 'extension');
  if (Object.values(columnMap.group).length > 0) {
    url.searchParams.set('groupedBy[columnId]', columnMap.group);
  }

  window.cache.set('items-get-api-data', url);

  let items: ItemGroupParsed = {} as ItemGroupParsed;

  if (window.cache.has('items')) {
    items = window.cache.get('items') as ItemGroupParsed;
  } else {
    items = await fetchJson<ItemGroupParsed>(url);
    window.cache.set('items', items, {
      ttl: 1000 * 5,
    });
  }

  const { taskItems, groups } = processItems(
    items,
    columnMap,
    columns.Status?.settings.options ?? [],
  );

  return {
    columns,
    columnMap,
    configDescription,
    items: processAndFilterItems(taskItems),
    groups: Object.values(groups)
      .filter((group) => group.groupMetadata)
      .reduce((acc, cur) => ({ ...acc, [cur.groupId]: cur }), {}),
  };
};
