import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchFilters } from '@/types/pokemon';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIStore {
  // Search filters
  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  // Modals
  cardDetailId: string | null;
  setCardDetailId: (id: string | null) => void;

  addCardModalId: string | null;
  setAddCardModalId: (id: string | null) => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // View preferences
  cardViewMode: 'grid' | 'grid-sm' | 'list';
  setCardViewMode: (mode: 'grid' | 'grid-sm' | 'list') => void;

  collectionFilter: 'all' | 'owned' | 'wishlist' | 'tradelist';
  setCollectionFilter: (filter: 'all' | 'owned' | 'wishlist' | 'tradelist') => void;
}

const defaultFilters: SearchFilters = {
  query: '',
  types: [],
  supertypes: [],
  subtypes: [],
  setId: '',
  rarity: '',
  format: 'all',
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      searchFilters: defaultFilters,
      setSearchFilters: (filters) =>
        set((state) => ({ searchFilters: { ...state.searchFilters, ...filters } })),
      resetFilters: () => set({ searchFilters: defaultFilters }),

      cardDetailId: null,
      setCardDetailId: (id) => set({ cardDetailId: id }),

      addCardModalId: null,
      setAddCardModalId: (id) => set({ addCardModalId: id }),

      toasts: [],
      addToast: (message, type = 'success') => {
        const id = Math.random().toString(36).slice(2);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
      },
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      cardViewMode: 'grid',
      setCardViewMode: (mode) => set({ cardViewMode: mode }),

      collectionFilter: 'all',
      setCollectionFilter: (filter) => set({ collectionFilter: filter }),
    }),
    {
      name: 'pokevault-ui',
      partialize: (state) => ({
        cardViewMode: state.cardViewMode,
        searchFilters: state.searchFilters,
      }),
    },
  ),
);
