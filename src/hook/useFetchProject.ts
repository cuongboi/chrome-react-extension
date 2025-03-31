import { load } from 'cheerio';
import { useEffect, useState } from 'react';

import { useColumnStore, useProjectStore } from '@/storage/project';

import { delay, joinPath, parseIssueUrl, swapObject } from '../lib/utils';

export function useFetchProject(config?: { watch?: boolean }) {
  const [isReady, setIsReady] = useState(false);
  const { setItems, items, groups, setGroups, setUpdateApi } =
    useProjectStore();
  const { setColumns, columns, columnMap } = useColumnStore();

  useEffect(() => {
    const url = window.location.href;
    const issueUrl = parseIssueUrl(url);

    if (issueUrl && issueUrl.type === 'projects') {
      const fetchData = async () => {
        try {
          const response = await fetch(
            joinPath(
              '/',
              issueUrl.owner,
              issueUrl.repo,
              issueUrl.type,
              issueUrl.number,
              'view',
              '1',
            ),
            {
              method: 'GET',
              mode: 'no-cors',
              credentials: 'include',
            },
          );
          const text = await response.text();
          const $ = load(text);

          const columnsDataRaw = $('#memex-columns-data').text();
          const itemsRaw = $('#memex-paginated-items-data').text();
          const updateApiRaw = $('#memex-item-update-api-data').text();
          setUpdateApi(JSON.parse(updateApiRaw).url);

          const columns = JSON.parse(columnsDataRaw).reduce(
            (acc: any, column: any) => {
              const columnId = column.id;
              return { ...acc, [columnId]: column };
            },
            {},
          );

          setColumns(columns);

          if (!columnMap) {
            return;
          }

          const items: any[] = [];
          const itemGroupParsed = JSON.parse(itemsRaw);

          if (itemGroupParsed.groups) {
            const groups = itemGroupParsed.groups.nodes.reduce(
              (acc: any, cur: any) => {
                acc[cur.groupId] = cur;
                return acc;
              },
              {},
            );

            setGroups(groups);

            itemGroupParsed.groupedItems.forEach((groupNode: any) => {
              const group = groups[groupNode.groupId];
              groupNode.nodes.forEach((node: any) => {
                items.push({
                  ...node,
                  group,
                });
              });
            });
          } else {
            setGroups({});
            itemGroupParsed.nodes.forEach((node: any) => {
              items.push({
                ...node,
                group: undefined,
              });
            });
          }

          const columnSwap = swapObject(columnMap);

          const taskItems = items.map((item) => {
            const columnData: any = {};

            for (const col of item.memexProjectColumnValues) {
              if (
                ['Title', 'Assignees', 'Status'].includes(
                  col.memexProjectColumnId,
                )
              ) {
                columnData[col.memexProjectColumnId] = col.value;
              }

              if (columnSwap[String(col.memexProjectColumnId)]) {
                columnData[columnSwap[col.memexProjectColumnId]] = col.value;
              }
            }

            return {
              id: item.id,
              contentId: item.contentId,
              contentType: item.contentType,
              ...columnData,
              group: item.group,
            };
          });

          setItems(taskItems);
        } catch (err) {
          console.error(err);
        } finally {
          setIsReady(true);
        }
      };

      fetchData();

      if (config?.watch) {
        const observer = new MutationObserver(
          delay(() => {
            const newIssueUrl = parseIssueUrl(window.location.href);
            if (newIssueUrl && newIssueUrl.type === 'projects') {
              fetchData();
            }
          }, 500),
        );

        if (
          document.querySelector<HTMLDivElement>('#memex-project-view-root')
        ) {
          observer.observe(
            document.querySelector<HTMLDivElement>('#memex-project-view-root')!,
            {
              childList: true,
              characterData: true,
            },
          );
        }
      }
    }
  }, []);

  return { isReady, items, groups, columns, columnMap };
}
