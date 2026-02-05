import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
   scale: number;
   increaseScale: () => void;
   decreaseScale: () => void;
   resetScale: () => void;
}

export const useUIStore = create<UIState>()(
   persist(
      (set) => ({
         scale: 100,

         increaseScale: () => set((state) => ({
            scale: Math.min(state.scale + 10, 150)
         })),

         decreaseScale: () => set((state) => ({
            scale: Math.max(state.scale - 10, 60)
         })),

         resetScale: () => set({ scale: 100 }),
      }),
      { name: 'ui-settings' }
   )
);