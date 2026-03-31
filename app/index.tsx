import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { Text, useTheme } from "react-native-paper";

import { useAppSettingsStore } from "@/store/app-settings-store";

export default function IndexScreen() {
  const theme = useTheme();
  const hydrated = useAppSettingsStore((state) => state.hydrated);
  const onboarded = useAppSettingsStore((state) => state.onboarded);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ marginTop: 12 }}>Поднимаем локальную базу...</Text>
      </View>
    );
  }

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/feed" />;
}
