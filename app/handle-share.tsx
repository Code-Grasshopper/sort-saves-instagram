import { useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Text } from "react-native-paper";

import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { extractUrlFromSharedText } from "@/lib/instagram";

export default function HandleShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sharedUrl?: string; text?: string }>();

  const sharedUrl = useMemo(() => {
    const rawValue = Array.isArray(params.sharedUrl)
      ? params.sharedUrl[0]
      : Array.isArray(params.text)
        ? params.text[0]
        : params.sharedUrl || params.text || "";

    return extractUrlFromSharedText(rawValue) || rawValue;
  }, [params.sharedUrl, params.text]);

  useEffect(() => {
    if (!sharedUrl) {
      return;
    }

    router.replace({
      pathname: "/add",
      params: {
        sharedUrl
      }
    });
  }, [router, sharedUrl]);

  return (
    <ScreenContainer>
      <EmptyState
        title="Импорт из share flow недоступен"
        description="В Expo SDK 54 внутри Expo Go нет официального входящего share intent. Для этой версии используйте вставку URL вручную. Если открыть эту страницу deep link-ом с параметром sharedUrl, ссылка подставится автоматически."
        actionLabel="Перейти к добавлению"
        onAction={() => router.replace("/add")}
      />
      <Card mode="contained" style={{ borderRadius: 24 }}>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="titleMedium">Что доступно в SDK 54</Text>
          <Text variant="bodyMedium">1. Скопируйте ссылку на пост в Instagram.</Text>
          <Text variant="bodyMedium">2. Откройте вкладку Add Media и вставьте URL.</Text>
          <Text variant="bodyMedium">
            3. При желании заполните карточку вручную, даже если превью не загрузилось.
          </Text>
          <Button mode="outlined" onPress={() => router.replace("/add")}>
            Открыть Add Media
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}
