import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ThemeMode } from "@/types/models";

type AppSettingsState = {
  onboarded: boolean;
  themeMode: ThemeMode;
  instagramAccessNote: string;
  hydrated: boolean;
  completeOnboarding: () => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setInstagramAccessNote: (value: string) => void;
  setHydrated: (value: boolean) => void;
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      themeMode: "system",
      instagramAccessNote: "",
      hydrated: false,
      completeOnboarding: () => set({ onboarded: true }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setInstagramAccessNote: (instagramAccessNote) => set({ instagramAccessNote }),
      setHydrated: (hydrated) => set({ hydrated })
    }),
    {
      name: "instasort-app-settings",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
