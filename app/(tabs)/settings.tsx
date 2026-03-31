import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import * as Linking from "expo-linking";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, SegmentedButtons, Text, TextInput } from "react-native-paper";

import { GradientHero } from "@/components/GradientHero";
import { ScreenContainer } from "@/components/ScreenContainer";
import { exportBackupToFile, importBackupFromFile } from "@/lib/backup";
import { useAppSettingsStore } from "@/store/app-settings-store";
import { useDataStore } from "@/store/data-store";
import type { ThemeMode } from "@/types/models";

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const bump = useDataStore((state) => state.bump);
  const themeMode = useAppSettingsStore((state) => state.themeMode);
  const setThemeMode = useAppSettingsStore((state) => state.setThemeMode);
  const instagramAccessNote = useAppSettingsStore((state) => state.instagramAccessNote);
  const setInstagramAccessNote = useAppSettingsStore((state) => state.setInstagramAccessNote);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  async function handleExport() {
    try {
      setBackupLoading(true);
      await exportBackupToFile(db);
      Alert.alert("Готово", "JSON backup создан и открыт через системное меню шаринга.");
    } catch (error) {
      Alert.alert("Экспорт не удался", error instanceof Error ? error.message : "Попробуйте еще раз.");
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleImport() {
    try {
      setImportLoading(true);
      const imported = await importBackupFromFile(db);
      if (imported) {
        bump();
        Alert.alert("Импорт завершен", "База заменена содержимым выбранного JSON backup.");
      }
    } catch (error) {
      Alert.alert("Импорт не удался", error instanceof Error ? error.message : "Проверьте файл backup.");
    } finally {
      setImportLoading(false);
    }
  }

  async function openDocs(url: string) {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return;
    }

    Alert.alert("Не удалось открыть ссылку", url);
  }

  return (
    <ScreenContainer>
      <GradientHero
        eyebrow="Сервис"
        title="Тема, резервные копии и параметры импорта"
        subtitle="Все ключевые данные остаются локально. Сеть нужна только для превью ссылок и внешних документов."
      />

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="titleMedium">Оформление</Text>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as ThemeMode)}
            buttons={[
              { value: "system", label: "Система" },
              { value: "light", label: "Светлая" },
              { value: "dark", label: "Темная" }
            ]}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="titleMedium">Export / Backup</Text>
          <View style={styles.row}>
            <Button mode="contained" loading={backupLoading} onPress={handleExport}>
              Экспорт JSON
            </Button>
            <Button mode="outlined" loading={importLoading} onPress={handleImport}>
              Импорт JSON
            </Button>
          </View>
          <Text variant="bodySmall">
            Backup содержит таблицы `posts`, `categories` и `post_categories` в одном JSON-файле.
          </Text>
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.section}>
          <Text variant="titleMedium">Instagram API / OAuth</Text>
          <Text variant="bodyMedium">
            Basic Display и Instagram Login не дают обычному приложению прямой доступ к вашим Saved-постам, поэтому основной поток здесь остается ручным.
          </Text>
          <TextInput
            mode="outlined"
            label="Личная заметка по Meta app / access token"
            value={instagramAccessNote}
            onChangeText={setInstagramAccessNote}
            multiline
            numberOfLines={3}
          />
          <View style={styles.row}>
            <Button
              mode="outlined"
              onPress={() => openDocs("https://developers.facebook.com/docs/instagram-platform")}
            >
              Документация Meta
            </Button>
            <Button
              mode="text"
              onPress={() => openDocs("https://docs.expo.dev/versions/latest/sdk/sharing/")}
            >
              Expo Sharing docs
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24
  },
  section: {
    gap: 14
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  }
});
