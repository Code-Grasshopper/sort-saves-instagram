import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Button, Card, Text } from "react-native-paper";

import { GradientHero } from "@/components/GradientHero";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAppSettingsStore } from "@/store/app-settings-store";

const steps = [
  {
    title: "Локальная база",
    description: "Посты, заметки и категории хранятся только на вашем устройстве в SQLite."
  },
  {
    title: "Ручной импорт",
    description:
      "Instagram не дает обычным приложениям прямой доступ к Saved и Collections, поэтому основной сценарий здесь построен вокруг ссылки и ручного ввода."
  },
  {
    title: "Офлайн автокатегория",
    description:
      "Кнопка авто-категории работает полностью локально и может сама создать первую подходящую тему, если категорий еще нет."
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAppSettingsStore((state) => state.completeOnboarding);

  const handleContinue = () => {
    completeOnboarding();
    router.replace("/feed");
  };

  const openInstagramDocs = async () => {
    const docsUrl = "https://developers.facebook.com/docs/instagram-platform";
    const supported = await Linking.canOpenURL(docsUrl);

    if (!supported) {
      Alert.alert("Не удалось открыть ссылку", docsUrl);
      return;
    }

    await Linking.openURL(docsUrl);
  };

  return (
    <ScreenContainer>
      <GradientHero
        eyebrow="InstaSort"
        title="Сортируйте сохраненные посты как личную базу знаний"
        subtitle="Ссылки из Instagram превращаются в понятную коллекцию с категориями, заметками и быстрым поиском."
      />

      {steps.map((step) => (
        <Card key={step.title} mode="contained" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium">{step.title}</Text>
            <Text variant="bodyMedium">{step.description}</Text>
          </Card.Content>
        </Card>
      ))}

      <View style={styles.buttons}>
        <Button mode="contained" onPress={handleContinue}>
          Начать сортировку
        </Button>
        <Button mode="outlined" onPress={openInstagramDocs}>
          Instagram API и OAuth
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24
  },
  cardContent: {
    gap: 8
  },
  buttons: {
    gap: 12,
    marginTop: 4
  }
});
