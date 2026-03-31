import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput
} from "react-native-paper";

import { GradientHero } from "@/components/GradientHero";
import { ScreenContainer } from "@/components/ScreenContainer";
import { categoryPalette } from "@/constants/theme";
import { deleteCategory, saveCategory } from "@/db/repository";
import { useCategories } from "@/hooks/useCategories";
import { useDataStore } from "@/store/data-store";

const emojiOptions = ["🍜", "🏋️", "✈️", "💡", "🎬", "🛒", "📚", "🧠"];

export default function CategoriesScreen() {
  const db = useSQLiteContext();
  const bump = useDataStore((state) => state.bump);
  const { categories } = useCategories();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍜");
  const [color, setColor] = useState(categoryPalette[0]);
  const [saving, setSaving] = useState(false);

  function openCreateDialog() {
    setEditingId(null);
    setName("");
    setEmoji("🍜");
    setColor(categoryPalette[0]);
    setDialogVisible(true);
  }

  function openEditDialog(id: number) {
    const category = categories.find((item) => item.id === id);
    if (!category) {
      return;
    }

    setEditingId(category.id);
    setName(category.name);
    setEmoji(category.emoji);
    setColor(category.color);
    setDialogVisible(true);
  }

  async function handleSaveCategory() {
    try {
      setSaving(true);
      await saveCategory(db, {
        id: editingId ?? undefined,
        name,
        emoji,
        color
      });
      setDialogVisible(false);
      bump();
    } catch (error) {
      Alert.alert(
        "Не удалось сохранить категорию",
        error instanceof Error ? error.message : "Проверьте данные и попробуйте снова."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number) {
    Alert.alert(
      "Удалить категорию?",
      "Связи с постами тоже будут удалены, но сами посты останутся в базе.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(db, id);
            bump();
          }
        }
      ]
    );
  }

  return (
    <ScreenContainer>
      <GradientHero
        eyebrow="Темы"
        title="Соберите свою систему категорий"
        subtitle="Категории помогают быстро пересобирать сохраненные идеи: рецепты, путешествия, спорт, покупки и что угодно еще."
      />

      <Button mode="contained" onPress={openCreateDialog}>
        Создать категорию
      </Button>

      {categories.map((category) => (
        <Card key={category.id} mode="contained" style={styles.card}>
          <Card.Content style={styles.categoryCard}>
            <View style={styles.categoryInfo}>
              <View style={[styles.colorDot, { backgroundColor: category.color }]} />
              <View style={{ gap: 4 }}>
                <Text variant="titleMedium">{`${category.emoji} ${category.name}`}</Text>
                <Text variant="bodySmall">
                  {category.postCount === 1 ? "1 пост" : `${category.postCount ?? 0} постов`}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <IconButton icon="pencil-outline" onPress={() => openEditDialog(category.id)} />
              <IconButton icon="delete-outline" onPress={() => handleDelete(category.id)} />
            </View>
          </Card.Content>
        </Card>
      ))}

      {!categories.length ? (
        <Card mode="contained" style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium">
              Пока нет ни одной категории. Начните с чего-то простого: `Рецепты`, `Путешествия`,
              `Фитнес`, `Вдохновение`.
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingId ? "Редактировать категорию" : "Новая категория"}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput mode="outlined" label="Название" value={name} onChangeText={setName} />
            <Text variant="labelLarge">Emoji</Text>
            <View style={styles.options}>
              {emojiOptions.map((option) => (
                <Button
                  key={option}
                  mode={emoji === option ? "contained" : "outlined"}
                  onPress={() => setEmoji(option)}
                >
                  {option}
                </Button>
              ))}
            </View>
            <Text variant="labelLarge">Цвет</Text>
            <View style={styles.options}>
              {categoryPalette.map((option) => (
                <Button
                  key={option}
                  mode={color === option ? "contained" : "outlined"}
                  onPress={() => setColor(option)}
                  buttonColor={color === option ? option : undefined}
                  textColor={color === option ? "#FFFFFF" : undefined}
                >
                  {option}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Отмена</Button>
            <Button loading={saving} onPress={handleSaveCategory}>
              Сохранить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 999
  },
  actions: {
    flexDirection: "row"
  },
  dialogContent: {
    gap: 12
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
