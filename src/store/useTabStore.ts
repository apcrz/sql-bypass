import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
   id: string;
   filter: string;
   page: number;
   data: any[];
   loading: boolean;
}

interface TabState {
   tabs: Tab[];
   activeTabId: string | null;
   addTab: (tableName: string) => void;
   removeTab: (id: string) => void;
   setActiveTab: (id: string) => void;
   updateTab: (id: string, data: Partial<Tab>) => void;
}

export const useTabStore = create<TabState>()(
   persist(
      (set) => ({
         tabs: [],
         activeTabId: null,

         addTab: (tableName) => set((state) => {
            if (state.tabs.some((t) => t.id === tableName)) {
               return { activeTabId: tableName };
            }
            return {
               tabs: [...state.tabs, {
                  id: tableName,
                  filter: '',
                  page: 0,
                  data: [],
                  loading: false
               }],
               activeTabId: tableName,
            };
         }),

         removeTab: (id) => set((state) => {
            const newTabs = state.tabs.filter((t) => t.id !== id);
            let nextActive = state.activeTabId;
            if (state.activeTabId === id) {
               nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
            }
            return { tabs: newTabs, activeTabId: nextActive };
         }),

         setActiveTab: (id) => set({ activeTabId: id }),

         updateTab: (id, updates) => set((state) => ({
            tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t))
         })),
      }),
      { name: 'sql-bypass-tabs-v1' }
   )
);