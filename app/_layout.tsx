import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

import { AppProviders } from "@/providers/AppProviders";

function RootNavigator() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onBackground,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "SpaceGrotesk_700Bold"
        },
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ title: "Карточка поста" }} />
      <Stack.Screen name="handle-share" options={{ title: "Импорт из share sheet" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
