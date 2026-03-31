import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { FeedSort, FeedView } from "@/types/models";

type FeedState = {
  search: string;
  sort: FeedSort;
  view: FeedView;
  activeCategoryId: number | null;
  setSearch: (value: string) => void;
  setSort: (value: FeedSort) => void;
  setView: (value: FeedView) => void;
  setActiveCategoryId: (value: number | null) => void;
  resetFilters: () => void;
};

export const useFeedStore = create<FeedState>()(
  persist(
    (set) => ({
      search: "",
      sort: "date_desc",
      view: "grid",
      activeCategoryId: null,
      setSearch: (search) => set({ search }),
      setSort: (sort) => set({ sort }),
      setView: (view) => set({ view }),
      setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),
      resetFilters: () => set({ search: "", sort: "date_desc", activeCategoryId: null })
    }),
    {
      name: "instasort-feed-state",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
