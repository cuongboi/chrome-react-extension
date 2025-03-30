import { create } from 'zustand';
import { ChromeLocalStorage } from 'zustand-chrome-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Group, TaskItem } from '@/content-script/types';

export const useProjectStore = create<{
  items: TaskItem[];
  setItems: (items: TaskItem[]) => void;
  groups: { [key: string]: Group };
  setGroups: (groups: { [key: string]: Group }) => void;
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
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => ChromeLocalStorage),
    },
  ),
);

type ColumnMap = {
  start: number;
  end: number;
  progress: number;
  sprintDuration: number;
};
export const useColumnStore = create<{
  columns: { [key: string]: any };
  setColumns: (columns: { [key: string]: any }) => void;
  columnMap: ColumnMap;
  setColumnMap: (columnMap: {
    start: number | string;
    end: number | string;
    progress: number | string;
    sprintDuration: number | string;
  }) => void;
}>()(
  persist(
    (set) => ({
      columns: {},
      setColumns: (columns: { [key: string]: any }) => {
        set({ columns });
      },
      columnMap: {
        start: 0,
        end: 0,
        progress: 0,
        sprintDuration: 14,
      } as ColumnMap,
      setColumnMap: (columnMap) => {
        set({
          columnMap: {
            start: Number(columnMap.start),
            end: Number(columnMap.end),
            progress: Number(columnMap.progress),
            sprintDuration: Number(columnMap.sprintDuration),
          },
        });
      },
    }),
    {
      name: 'column-storage',
      storage: createJSONStorage(() => ChromeLocalStorage),
    },
  ),
);
