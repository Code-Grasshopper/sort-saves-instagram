import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useSQLiteContext } from "expo-sqlite";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";

import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { saveCategory, deletePost, savePost } from "@/db/repository";
import { useCategories } from "@/hooks/useCategories";
import { usePostDetail } from "@/hooks/usePostDetail";
import { pickAutoCategoryColor, pickAutoCategoryEmoji, normalizeSuggestedCategoryName } from "@/lib/category-ai";
import { formatRelativeDate } from "@/lib/date";
import { suggestCategoryOffline } from "@/lib/offline-category";
import { extractTags } from "@/lib/validation";
import { useDataStore } from "@/store/data-store";
import type { CategorySuggestion, PostDraft } from "@/types/models";

function createDraftFromPost(post: NonNullable<ReturnType<typeof usePostDetail>["post"]>): PostDraft {
  return {
    title: post.title,
    caption: post.caption,
    author: post.author,
    url: post.url,
    imageUrl: post.imageUrl,
    tagsText: post.manualTags,
    notes: post.notes,
    selectedCategoryIds: post.categories.map((category) => category.id)
  };
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const theme = useTheme();
  const bump = useDataStore((state) => state.bump);
  const postId = Number(id);
  const { post, loading } = usePostDetail(postId);
  const { categories } = useCategories();
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);

  useEffect(() => {
    if (post) {
      setDraft(createDraftFromPost(post));
    }
  }, [post]);

  const title = useMemo(
    () => post?.title || post?.caption || "Пост без названия",
    [post?.caption, post?.title]
  );

  function updateField<K extends keyof PostDraft>(field: K, value: PostDraft[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function toggleCategory(idValue: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            selectedCategoryIds: current.selectedCategoryIds.includes(idValue)
              ? current.selectedCategoryIds.filter((idItem) => idItem !== idValue)
              : [...current.selectedCategoryIds, idValue]
          }
        : current
    );
  }

  function ensureCategorySelected(idValue: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            selectedCategoryIds: current.selectedCategoryIds.includes(idValue)
              ? current.selectedCategoryIds
              : [...current.selectedCategoryIds, idValue]
          }
        : current
    );
  }

  async function ensureCategory(categoryName: string) {
    const normalizedName = normalizeSuggestedCategoryName(categoryName);
    const existing = categories.find(
      (category) => category.name.trim().toLowerCase() === normalizedName.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    const createdId = await saveCategory(db, {
      name: normalizedName,
      color: pickAutoCategoryColor(normalizedName),
      emoji: pickAutoCategoryEmoji(normalizedName)
    });

    bump();
    return createdId;
  }

  async function handleSave() {
    if (!post || !draft) {
      return;
    }

    try {
      setSaving(true);
      await savePost(db, {
        id: post.id,
        title: draft.title,
        caption: draft.caption,
        author: draft.author,
        url: draft.url,
        imageUrl: draft.imageUrl,
        notes: draft.notes,
        manualTags: extractTags(draft.tagsText),
        categoryIds: draft.selectedCategoryIds
      });
      bump();
      setEditMode(false);
      Alert.alert("Сохранено", "Изменения применены.");
    } catch (error) {
      Alert.alert(
        "Не удалось сохранить",
        error instanceof Error ? error.message : "Повторите попытку."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) {
      return;
    }

    Alert.alert("Удалить пост?", "Эту карточку нельзя будет восстановить без backup.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await deletePost(db, post.id);
          bump();
          router.replace("/feed");
        }
      }
    ]);
  }

  async function handleAutoCategorize() {
    if (!draft) {
      return;
    }

    try {
      setAutoCategoryLoading(true);

      const nextSuggestion = suggestCategoryOffline({
        title: draft.title,
        caption: draft.caption,
        categories: categories.map((category) => category.name),
        allowNewCategory: categories.length === 0
      });

      const normalizedName = normalizeSuggestedCategoryName(nextSuggestion.categoryName);
      setSuggestion({
        ...nextSuggestion,
        categoryName: normalizedName
      });

      const categoryId = await ensureCategory(normalizedName);
      ensureCategorySelected(categoryId);
    } catch (error) {
      Alert.alert(
        "Не удалось подобрать категорию",
        error instanceof Error ? error.message : "Попробуйте еще раз."
      );
    } finally {
      setAutoCategoryLoading(false);
    }
  }

  if (loading || !draft) {
    return (
      <ScreenContainer
        scroll={false}
        contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ marginTop: 12 }}>Загружаем карточку поста...</Text>
      </ScreenContainer>
    );
  }

  if (!post) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Пост не найден"
          description="Возможно, карточка уже удалена или база была импортирована заново."
          actionLabel="Вернуться в ленту"
          onAction={() => router.replace("/feed")}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {post.imageUrl ? <Image source={post.imageUrl} style={styles.image} contentFit="cover" /> : null}

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="headlineSmall">{title}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Добавлено {formatRelativeDate(post.createdAt)}
          </Text>
          {post.author ? <Text variant="bodyMedium">@{post.author}</Text> : null}

          <View style={styles.row}>
            <Button mode="contained-tonal" onPress={() => post.url && Linking.openURL(post.url)}>
              Открыть источник
            </Button>
            <Button mode={editMode ? "contained" : "outlined"} onPress={() => setEditMode(!editMode)}>
              {editMode ? "Режим редактирования" : "Редактировать"}
            </Button>
            <Button mode="text" textColor={theme.colors.error} onPress={handleDelete}>
              Удалить
            </Button>
          </View>

          {editMode ? (
            <>
              <TextInput
                mode="outlined"
                label="Заголовок"
                value={draft.title}
                onChangeText={(value) => updateField("title", value)}
              />
              <TextInput
                mode="outlined"
                label="Описание / подпись"
                value={draft.caption}
                onChangeText={(value) => updateField("caption", value)}
                multiline
                numberOfLines={5}
              />
              <TextInput
                mode="outlined"
                label="Автор"
                value={draft.author}
                onChangeText={(value) => updateField("author", value)}
              />
              <TextInput
                mode="outlined"
                label="URL поста"
                value={draft.url}
                onChangeText={(value) => updateField("url", value)}
                autoCapitalize="none"
              />
              <TextInput
                mode="outlined"
                label="Image URL"
                value={draft.imageUrl}
                onChangeText={(value) => updateField("imageUrl", value)}
                autoCapitalize="none"
              />
              <TextInput
                mode="outlined"
                label="Теги через запятую"
                value={draft.tagsText}
                onChangeText={(value) => updateField("tagsText", value)}
              />
              <TextInput
                mode="outlined"
                label="Заметки"
                value={draft.notes}
                onChangeText={(value) => updateField("notes", value)}
                multiline
                numberOfLines={4}
              />

              <View style={styles.categories}>
                {categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    category={category}
                    selected={draft.selectedCategoryIds.includes(category.id)}
                    onPress={() => toggleCategory(category.id)}
                  />
                ))}
              </View>

              <View style={styles.row}>
                <Button mode="outlined" loading={autoCategoryLoading} onPress={handleAutoCategorize}>
                  Авто-категория
                </Button>
                <Button mode="contained" loading={saving} onPress={handleSave}>
                  Сохранить
                </Button>
              </View>

              {suggestion ? (
                <HelperText type="info">
                  Подобрана категория: {suggestion.categoryName}
                  {suggestion.reason ? ` - ${suggestion.reason}` : ""}
                </HelperText>
              ) : null}
            </>
          ) : (
            <>
              {post.caption ? <Text variant="bodyMedium">{post.caption}</Text> : null}
              <View style={styles.categories}>
                {post.categories.map((category) => (
                  <CategoryChip key={category.id} category={category} />
                ))}
              </View>
              {post.manualTags ? <Text variant="bodySmall">Теги: {post.manualTags}</Text> : null}
              {post.notes ? (
                <Card mode="outlined" style={styles.noteCard}>
                  <Card.Content>
                    <Text variant="labelLarge">Личная заметка</Text>
                    <Text variant="bodyMedium">{post.notes}</Text>
                  </Card.Content>
                </Card>
              ) : (
                <HelperText type="info">Заметок пока нет. Их можно добавить через редактирование.</HelperText>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 320,
    borderRadius: 28,
    backgroundColor: "#2A3340"
  },
  card: {
    borderRadius: 24
  },
  content: {
    gap: 14
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  noteCard: {
    borderRadius: 20
  }
});
