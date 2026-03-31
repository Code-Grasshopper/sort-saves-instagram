import { useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Text } from "react-native-paper";

import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { extractUrlFromSharedText } from "@/lib/instagram";

export default function HandleShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sharedUrl?: string; text?: string }>();

  const sharedText = useMemo(() => {
    const rawValue = Array.isArray(params.text) ? params.text[0] : params.text || "";
    return rawValue.trim();
  }, [params.text]);

  const sharedUrl = useMemo(() => {
    const direct = Array.isArray(params.sharedUrl) ? params.sharedUrl[0] : params.sharedUrl || "";
    return extractUrlFromSharedText(direct || sharedText) || direct || "";
  }, [params.sharedUrl, sharedText]);

  useEffect(() => {
    if (!sharedUrl && !sharedText) {
      return;
    }

    router.replace({
      pathname: "/add",
      params: {
        sharedUrl,
        sharedText
      }
    });
  }, [router, sharedText, sharedUrl]);

  return (
    <ScreenContainer>
      <EmptyState
        title="Открываем импорт"
        description="Если Instagram передал ссылку или текст, они будут подставлены в экран добавления автоматически."
        actionLabel="Перейти к добавлению"
        onAction={() => router.replace("/add")}
      />
      <Card mode="contained" style={{ borderRadius: 16 }}>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="titleMedium">Что передано из share intent</Text>
          <Text variant="bodyMedium">
            {sharedUrl
              ? `Ссылка: ${sharedUrl}`
              : sharedText
                ? `Текст: ${sharedText}`
                : "Пока нет данных. Попробуйте заново отправить пост из Instagram."}
          </Text>
          <Button mode="outlined" onPress={() => router.replace("/add")}>
            Открыть Добавить
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}
