import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Button,
  Card,
  Dialog,
  HelperText,
  IconButton,
  Portal,
  Text,
  TextInput
} from "react-native-paper";

import { ColorWheelPicker } from "@/components/ColorWheelPicker";
import { GradientHero } from "@/components/GradientHero";
import { ScreenContainer } from "@/components/ScreenContainer";
import { categoryPalette } from "@/constants/theme";
import { deleteCategory, saveCategory } from "@/db/repository";
import { useCategories } from "@/hooks/useCategories";
import { useDataStore } from "@/store/data-store";
import { useFeedStore } from "@/store/feed-store";

const defaultEmoji = "✨";

function normalizeHexColor(value: string) {
  const cleaned = value.trim().replace(/[^0-9a-fA-F#]/g, "").replace(/^([^#])/, "#$1").toUpperCase();
  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

function isValidHexColor(value: string) {
  return /^#([0-9A-F]{6}|[0-9A-F]{3})$/u.test(value);
}

function formatPostCount(count: number) {
  if (count === 1) {
    return "1 пост";
  }

  if (count >= 2 && count <= 4) {
    return `${count} поста`;
  }

  return `${count} постов`;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const bump = useDataStore((state) => state.bump);
  const setActiveCategoryId = useFeedStore((state) => state.setActiveCategoryId);
  const { categories } = useCategories();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(defaultEmoji);
  const [color, setColor] = useState(categoryPalette[0]);
  const [colorInput, setColorInput] = useState(categoryPalette[0]);
  const [saving, setSaving] = useState(false);

  const titlePreview = useMemo(() => (name.trim() ? name.trim() : "Новая категория"), [name]);

  function openCreateDialog() {
    setEditingId(null);
    setName("");
    setEmoji(defaultEmoji);
    setColor(categoryPalette[0]);
    setColorInput(categoryPalette[0]);
    setDialogVisible(true);
  }

  function openEditDialog(id: number) {
    const category = categories.find((item) => item.id === id);

    if (!category) {
      return;
    }

    setEditingId(category.id);
    setName(category.name);
    setEmoji(category.emoji || defaultEmoji);
    setColor(category.color);
    setColorInput(category.color);
    setDialogVisible(true);
  }

  function applyColor(nextColor: string) {
    setColor(nextColor);
    setColorInput(nextColor);
  }

  async function handleSaveCategory() {
    const normalizedColor = normalizeHexColor(colorInput);

    if (!isValidHexColor(normalizedColor)) {
      Alert.alert("Проверьте цвет", "Введите HEX в формате #RRGGBB или #RGB.");
      return;
    }

    try {
      setSaving(true);
      await saveCategory(db, {
        id: editingId ?? undefined,
        name,
        emoji: emoji.trim() || defaultEmoji,
        color: normalizedColor
      });
      setDialogVisible(false);
      bump();
    } catch (error) {
      Alert.alert(
        "Не удалось сохранить категорию",
        error instanceof Error ? error.message : "Проверьте поля и попробуйте снова."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number) {
    Alert.alert(
      "Удалить категорию?",
      "Связи с постами тоже будут удалены, но сами карточки останутся в базе.",
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

  function openCategoryFeed(id: number) {
    setActiveCategoryId(id);
    router.push("/feed");
  }

  return (
    <ScreenContainer>
      <GradientHero
        eyebrow="Темы"
        title="Соберите свою систему категорий"
        subtitle="Теперь категории можно точнее настраивать: меньше визуального шума, свободный emoji и выбор цвета через круг или HEX. Нажатие на категорию открывает все ее посты."
      />

      <Button mode="contained" onPress={openCreateDialog}>
        Создать категорию
      </Button>

      {!categories.length ? (
        <Card mode="contained" style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleMedium">Категорий пока нет</Text>
            <Text variant="bodyMedium">
              Начните с нескольких тем вроде «Рецепты», «Путешествия», «Лайфхаки» или «Смартфоны».
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {categories.map((category) => (
        <Card key={category.id} mode="contained" style={styles.card}>
          <Card.Content style={styles.categoryRow}>
            <View style={[styles.colorBar, { backgroundColor: category.color }]} />
            <Pressable style={styles.categoryInfo} onPress={() => openCategoryFeed(category.id)}>
              <Text variant="titleMedium">{`${category.emoji} ${category.name}`}</Text>
              <Text variant="bodySmall">{formatPostCount(category.postCount ?? 0)}</Text>
            </Pressable>
            <View style={styles.actions}>
              <IconButton icon="pencil-outline" onPress={() => openEditDialog(category.id)} />
              <IconButton icon="delete-outline" onPress={() => handleDelete(category.id)} />
            </View>
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>{editingId ? "Редактировать категорию" : "Новая категория"}</Dialog.Title>
          <ScrollView
            style={styles.dialogScrollArea}
            contentContainerStyle={styles.dialogContent}
            showsVerticalScrollIndicator={false}
          >
              <View style={[styles.previewCard, { borderColor: color }]}>
                <View style={[styles.previewDot, { backgroundColor: color }]} />
                <Text variant="headlineSmall">{emoji.trim() || defaultEmoji}</Text>
                <Text variant="titleMedium">{titlePreview}</Text>
              </View>

              <TextInput mode="outlined" label="Название" value={name} onChangeText={setName} />
              <TextInput
                mode="outlined"
                label="Emoji"
                value={emoji}
                onChangeText={setEmoji}
                placeholder="✨"
                autoCapitalize="none"
              />
              <HelperText type="info">Можно вставить любой emoji или короткий символ с клавиатуры.</HelperText>

              <Text variant="labelLarge">Цветовой круг</Text>
              <ColorWheelPicker value={color} onChange={applyColor} />

              <Text variant="labelLarge">Готовые оттенки</Text>
              <View style={styles.paletteRow}>
                {categoryPalette.map((option) => {
                  const selected = color === option;

                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      onPress={() => applyColor(option)}
                      style={[
                        styles.paletteSwatch,
                        {
                          backgroundColor: option,
                          borderWidth: selected ? 3 : 1
                        }
                      ]}
                    />
                  );
                })}
              </View>

              <TextInput
                mode="outlined"
                label="HEX-цвет"
                value={colorInput}
                onChangeText={(value) => {
                  setColorInput(value);
                  const normalized = normalizeHexColor(value);

                  if (isValidHexColor(normalized)) {
                    setColor(normalized);
                  }
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="#E9724C"
              />
              <HelperText type={isValidHexColor(normalizeHexColor(colorInput)) ? "info" : "error"}>
                {isValidHexColor(normalizeHexColor(colorInput))
                  ? "Можно задать любой точный оттенок вручную."
                  : "Введите цвет в формате #RRGGBB или #RGB."}
              </HelperText>
          </ScrollView>
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
    borderRadius: 14
  },
  emptyCard: {
    borderRadius: 14
  },
  emptyContent: {
    gap: 8
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  colorBar: {
    width: 8,
    alignSelf: "stretch",
    borderRadius: 4
  },
  categoryInfo: {
    flex: 1,
    gap: 4
  },
  actions: {
    flexDirection: "row"
  },
  dialog: {
    borderRadius: 18,
    maxHeight: "88%"
  },
  dialogScrollArea: {
    paddingHorizontal: 24
  },
  dialogContent: {
    gap: 12,
    paddingBottom: 12
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  previewDot: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  paletteSwatch: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderColor: "#FFFFFF"
  }
});
