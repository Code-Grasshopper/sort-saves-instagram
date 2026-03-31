import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ThemeMode } from "@/types/models";

type AppSettingsState = {
  onboarded: boolean;
  themeMode: ThemeMode;
  hydrated: boolean;
  completeOnboarding: () => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setHydrated: (value: boolean) => void;
};

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      onboarded: false,
      themeMode: "system",
      hydrated: false,
      completeOnboarding: () => set({ onboarded: true }),
      setThemeMode: (themeMode) => set({ themeMode }),
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
