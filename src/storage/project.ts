import { create } from 'zustand';

import type { Group, StatusValue, TaskItem } from '../types';

export type ProjectConfig = {
  holidays: Date[];
  [key: string]: any;
};

export const useProjectStore = create<{
  items: TaskItem[];
  setItems: (items: TaskItem[]) => void;
  groups: { [key: string]: Group };
  setGroups: (groups: { [key: string]: Group }) => void;
  updateApi: string;
  setUpdateApi: (updateApi: string) => void;
  boarditems: TaskItem[];
  setBoardItems: (items: TaskItem[], columnMap: ColumnMapValue) => void;
  config: ProjectConfig;
  setConfig: (config: ProjectConfig) => void;
}>()((set) => ({
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
      return allowStatuses.includes(item.Status?.id);
    });

    set({ boarditems });
  },
  config: {} as ProjectConfig,
  setConfig: (config: ProjectConfig) => {
    set({ config });
  },
}));

export const useSprint = create<{
  currentSprint: string | null;
  setCurrentSprint: (sprint: string | null) => void;
}>()((set) => ({
  currentSprint: null,
  setCurrentSprint: (sprint: string | null) => {
    set({ currentSprint: sprint });
  },
}));

export type ColumnMapValue = {
  start: string;
  end: string;
  parentId: string;
  actualStart: string;
  actualEnd: string;
  statuses: { value: string; label: string }[];
  holidays: Date[];
};

export type ColumnMap = Record<string, ColumnMapValue>;

export const useColumnStore = create<{
  columns: { [key: string]: any };
  setColumns: (columns: { [key: string]: any }) => void;
  columnMap: ColumnMapValue;
  setColumnMap: (columnMap: ColumnMapValue) => void;
  getStatus: (statusId: string) => StatusValue;
  configDescription: string;
  setConfigDescription: (description: string) => void;
}>()((set, get) => ({
  columns: {},
  setColumns: (columns: { [key: string]: any }) => {
    set({ columns });
  },
  columnMap: {} as ColumnMapValue,
  setColumnMap: (columnMap) => {
    set((state) => ({
      ...state,
      columnMap: {
        ...state.columnMap,
        ...columnMap,
      },
    }));
  },
  getStatus: (statusId) => {
    const statusOptions = get().columns.Status.settings.options;
    const status = statusOptions.find((option: any) => option.id === statusId)!;
    return status ?? {};
  },
  configDescription: '',
  setConfigDescription: (description: string) => {
    set({ configDescription: description });
  },
}));
