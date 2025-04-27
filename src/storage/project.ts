import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Group, StatusValue, TaskItem } from '../types';

export const useProjectStore = create<{
  items: TaskItem[];
  setItems: (items: TaskItem[]) => void;
  groups: { [key: string]: Group };
  setGroups: (groups: { [key: string]: Group }) => void;
  updateApi: string;
  setUpdateApi: (updateApi: string) => void;
  boarditems: TaskItem[];
  setBoardItems: (items: TaskItem[], columnMap: ColumnMapValue) => void;
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
      boarditems: [],
      setBoardItems: (items, columnMap) => {
        const allowStatuses = columnMap.statuses.map((item) => item.value);
        const boarditems = items.filter((item) => {
          return allowStatuses.includes(item.Status.id);
        });

        set({ boarditems });
      },
    }),
    {
      name: 'project-storage',
    },
  ),
);

export const useSprint = create<{
  currentSprint: string | null;
  setCurrentSprint: (sprint: string | null) => void;
}>()((set) => ({
  currentSprint: null,
  setCurrentSprint: (sprint: string | null) => {
    set({ currentSprint: sprint });
  },
}));

type MultipleSelectColumn = { value: string; label: string };
export type ColumnMapValue = {
  start: MultipleSelectColumn[];
  end: MultipleSelectColumn[];
  parentId: string;
  actualStart: string;
  actualEnd: string;
  statusStart: string;
  statusEnd: string;
  statuses: MultipleSelectColumn[];
};

export type ColumnMap = Record<string, ColumnMapValue>;

export const useColumnStore = create<{
  columns: { [key: string]: any };
  setColumns: (columns: { [key: string]: any }) => void;
  columnMap: ColumnMap;
  setColumnMap: (url: string, columnMap: ColumnMapValue) => void;
  getStatus: (statusId: string) => StatusValue;
  getColumnMap: () => ColumnMapValue;
}>()(
  persist(
    (set, get) => ({
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
              ...state.columnMap[url],
              ...columnMap,
            },
          },
        }));
      },
      getStatus: (statusId) => {
        const statusOptions = get().columns.Status.settings.options;
        const status = statusOptions.find(
          (option: any) => option.id === statusId,
        )!;
        return status ?? {};
      },
      getColumnMap: () => {
        const columnMap = get().columnMap[window.location.href];
        return (
          columnMap ?? {
            start: [],
            end: [],
            parentId: '',
            actualStart: '',
            actualEnd: '',
            statusStart: '',
            statusEnd: '',
            statuses: [],
          }
        );
      },
    }),
    {
      name: 'column-storage',
    },
  ),
);
