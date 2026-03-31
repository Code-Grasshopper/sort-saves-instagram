import { useEffect, type PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, Text } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold
} from "@expo-google-fonts/space-grotesk";

import { darkTheme, lightTheme } from "@/constants/theme";
import { initializeDatabase } from "@/db/migrations";
import { useAppSettingsStore } from "@/store/app-settings-store";

export function AppProviders({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const themeMode = useAppSettingsStore((state) => state.themeMode);
  const isDark = themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";
  const theme = isDark ? darkTheme : lightTheme;
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onBackground }}>
          Загружаем InstaSort...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="instasort.db" onInit={initializeDatabase}>
          <PaperProvider theme={theme}>
            <StatusBar style={isDark ? "light" : "dark"} />
            {children}
          </PaperProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
