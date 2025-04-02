import { load } from 'cheerio';
import { useEffect, useState } from 'react';

import { GHRegex, GHRequestHeaders } from '@/lib/contains';
import {
  useColumnStore,
  useProjectStore,
  type ColumnMap,
} from '@/storage/project';
import type { TaskItem } from '@/types';

import { swapObject } from '../lib/utils';

interface Config {
  watch?: boolean;
}

// Utility functions
const processItems = (
  itemGroupParsed: any,
  columnMap: ColumnMap,
  setGroups: (groups: Record<string, any>) => void,
): TaskItem[] => {
  const items: any[] = [];
  const columnSwap = swapObject(columnMap);

  if (itemGroupParsed.groups) {
    const groups = itemGroupParsed.groups.nodes.reduce(
      (acc: Record<string, any>, cur: any) => ({
        ...acc,
        [cur.groupId]: cur,
      }),
      {},
    );
    setGroups(groups);

    itemGroupParsed.groupedItems.forEach((groupNode: any) => {
      const group = groups[groupNode.groupId];
      groupNode.nodes.forEach((node: any) => {
        items.push({ ...node, group });
      });
    });
  } else {
    setGroups({});
    itemGroupParsed.nodes.forEach((node: any) => {
      items.push({ ...node, group: undefined });
    });
  }

  return items.map((item) => {
    const columnData: Record<string, any> = {};
    item.memexProjectColumnValues.forEach((col: any) => {
      const specialColumns = ['Title', 'Assignees', 'Status'];
      const colId = String(col.memexProjectColumnId);

      if (specialColumns.includes(colId)) {
        columnData[colId] = col.value;
      }
      if (columnSwap[colId]) {
        columnData[columnSwap[colId]] = col.value;
      }
    });

    return {
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType,
      ...columnData,
      group: item.group,
    };
  }) as TaskItem[];
};

const fetchPaginatedItems = async (url: string): Promise<any> => {
  const response = await fetch(url, {
    headers: GHRequestHeaders,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  });
  return response.json();
};

// Main hook
export function useFetchProject(config: Config = {}) {
  const [isReady, setIsReady] = useState(false);
  const { setItems, items, groups, setGroups, setUpdateApi } =
    useProjectStore();
  const { setColumns, columns, columnMap } = useColumnStore();

  const fetchProjectData = async () => {
    try {
      const $ = load(document.documentElement.innerHTML);
      const columnsDataRaw = $('#memex-columns-data').text();
      const itemsRaw = $('#memex-paginated-items-data').text();
      const updateApiRaw = $('#memex-item-update-api-data').text();

      setUpdateApi(JSON.parse(updateApiRaw).url);

      const parsedColumns = JSON.parse(columnsDataRaw).reduce(
        (acc: Record<string, any>, column: any) => ({
          ...acc,
          [column.id]: column,
        }),
        {},
      );
      setColumns(parsedColumns);

      if (!columnMap) return;

      const itemGroupParsed = JSON.parse(itemsRaw);
      const processedItems = processItems(
        itemGroupParsed,
        columnMap,
        setGroups,
      );
      setItems(
        processedItems.filter((item) => item.start?.value && item.end?.value),
      );
    } catch (err) {
      console.error('Failed to fetch project data:', err);
    } finally {
      setIsReady(true);
    }
  };

  const handleUpdateEvent = (message: any) => {
    if (message.type !== 'extension:paginated_items') return;

    fetchPaginatedItems(message.url)
      .then((data) => processItems(data, columnMap, setGroups))
      .then(setItems)
      .catch((err) => console.error('Update fetch failed:', err));
  };

  useEffect(() => {
    if (!window.location.href.match(GHRegex)) return;

    fetchProjectData();

    if (config.watch) {
      console.log('Listening for paginated items updates...');
      window.ev.removeAllListeners('extension:paginated_items');
      window.ev.on('extension:paginated_items', handleUpdateEvent);
    }
  }, []);

  return { isReady, items, groups, columns, columnMap };
}
