import { create } from 'zustand';
import { ChromeSyncStorage } from 'zustand-chrome-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useTokenStore = create<{
  token: string;
  setToken: (token: string) => void;
}>()(
  persist(
    (set) => ({
      token: '',
      setToken: (token: string) => {
        set({ token });
      },
    }),
    {
      name: 'token-storage', // Name of the item in chrome.storage.local
      storage: createJSONStorage(() => ChromeSyncStorage),
    },
  ),
);

export const useProjectStore = create<{
  items: any;
  configurations: any[];
  setItems: (items: any) => void;
  setConfigurations: (configurations: any[]) => void;
}>()(
  persist(
    (set) => ({
      items: {},
      configurations: [],
      setItems: (items: any) => {
        set({ items });
      },
      setConfigurations: (configurations: any[]) => {
        set({ configurations });
      },
    }),
    {
      name: 'project-storage', // Name of the item in chrome.storage.local
      storage: createJSONStorage(() => ChromeSyncStorage),
    },
  ),
);
