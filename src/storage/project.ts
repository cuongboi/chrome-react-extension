import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Group, TaskItem } from '../types';

export const useProjectStore = create<{
  items: TaskItem[];
  setItems: (items: TaskItem[]) => void;
  groups: { [key: string]: Group };
  setGroups: (groups: { [key: string]: Group }) => void;
  updateApi: string;
  setUpdateApi: (updateApi: string) => void;
}>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items: TaskItem[]) => {
        set({ items });
      },
      groups: {},
      setGroups: (groups: { [key: string]: Group }) => {
        set({ groups });
      },
      updateApi: '',
      setUpdateApi: (updateApi: string) => {
        set({ updateApi });
      },
    }),
    {
      name: 'project-storage',
    },
  ),
);

export type ColumnMap = Record<
  string,
  {
    start: number;
    end: number;
    progress: number;
    sprintDuration: number;
    parentId?: number;
  }
>;
export const useColumnStore = create<{
  columns: { [key: string]: any };
  setColumns: (columns: { [key: string]: any }) => void;
  columnMap: ColumnMap;
  setColumnMap: (
    url: string,
    columnMap: {
      start: number | string;
      end: number | string;
      progress: number | string;
      sprintDuration: number | string;
      parentId: number | string;
    },
  ) => void;
}>()(
  persist(
    (set) => ({
      columns: {},
      setColumns: (columns: { [key: string]: any }) => {
        set({ columns });
      },
      columnMap: {} as ColumnMap,
      setColumnMap: (url, columnMap) => {
        set((state) => ({
          ...state,
          columnMap: {
            ...state.columnMap,
            [url]: {
              start: Number(columnMap.start),
              end: Number(columnMap.end),
              progress: Number(columnMap.progress),
              sprintDuration: Number(columnMap.sprintDuration),
              parentId: Number(columnMap.parentId),
            },
          },
        }));
      },
    }),
    {
      name: 'column-storage',
    },
  ),
);
