import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { CategoryChip } from "@/components/CategoryChip";
import { GradientHero } from "@/components/GradientHero";
import { PreviewCard } from "@/components/PreviewCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { saveCategory, savePost } from "@/db/repository";
import { useCategories } from "@/hooks/useCategories";
import {
  normalizeSuggestedCategoryName,
  pickAutoCategoryColor,
  pickAutoCategoryEmoji
} from "@/lib/category-ai";
import { normalizeInstagramUrl } from "@/lib/instagram";
import { fetchUrlPreview } from "@/lib/link-preview";
import { suggestCategoryOffline } from "@/lib/offline-category";
import { emptyDraft, extractTags } from "@/lib/validation";
import { useDataStore } from "@/store/data-store";
import type { CategorySuggestion, PreviewPayload } from "@/types/models";

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sharedUrl?: string }>();
  const db = useSQLiteContext();
  const bump = useDataStore((state) => state.bump);
  const { categories } = useCategories();
  const [draft, setDraft] = useState(emptyDraft);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const appliedSharedUrl = useRef("");

  const sharedUrl = useMemo(() => {
    const incoming = Array.isArray(params.sharedUrl) ? params.sharedUrl[0] : params.sharedUrl;
    return incoming ? normalizeInstagramUrl(incoming) : "";
  }, [params.sharedUrl]);

  useEffect(() => {
    if (!sharedUrl || appliedSharedUrl.current === sharedUrl) {
      return;
    }

    appliedSharedUrl.current = sharedUrl;
    setDraft((current) => ({ ...current, url: sharedUrl }));
    handlePreviewFetch(sharedUrl).catch(() => undefined);
  }, [sharedUrl]);

  function updateField<K extends keyof typeof draft>(field: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleCategory(id: number) {
    setDraft((current) => ({
      ...current,
      selectedCategoryIds: current.selectedCategoryIds.includes(id)
        ? current.selectedCategoryIds.filter((item) => item !== id)
        : [...current.selectedCategoryIds, id]
    }));
  }

  function ensureCategoryIdsSelected(categoryIds: number[]) {
    setDraft((current) => ({
      ...current,
      selectedCategoryIds: [...new Set([...current.selectedCategoryIds, ...categoryIds])]
    }));
  }

  async function handlePreviewFetch(urlOverride?: string) {
    const targetUrl = normalizeInstagramUrl(urlOverride ?? draft.url);

    try {
      setPreviewLoading(true);
      const data = await fetchUrlPreview(targetUrl);
      setPreview(data);
      setDraft((current) => ({
        ...current,
        url: data.canonicalUrl || targetUrl,
        title: current.title || data.title,
        caption: current.caption || data.description,
        author: current.author || data.author,
        imageUrl: current.imageUrl || data.imageUrl
      }));
    } catch (error) {
      Alert.alert(
        "Превью не загрузилось",
        error instanceof Error ? error.message : "Не удалось получить данные по ссылке."
      );
    } finally {
      setPreviewLoading(false);
    }
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

  async function handleAutoCategorize() {
    try {
      setAutoCategoryLoading(true);

      const nextSuggestion = suggestCategoryOffline({
        title: draft.title,
        caption: draft.caption,
        manualTags: draft.tagsText,
        categories: categories.map((category) => category.name),
        allowNewCategory: categories.length === 0
      });

      const normalizedNames = nextSuggestion.categoryNames.map(normalizeSuggestedCategoryName);
      setSuggestion({
        ...nextSuggestion,
        categoryNames: normalizedNames
      });

      if (!normalizedNames.length) {
        return;
      }

      const categoryIds = await Promise.all(normalizedNames.map((name) => ensureCategory(name)));
      ensureCategoryIdsSelected(categoryIds);
    } catch (error) {
      Alert.alert(
        "Не удалось подобрать категории",
        error instanceof Error ? error.message : "Попробуйте еще раз."
      );
    } finally {
      setAutoCategoryLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await savePost(db, {
        title: draft.title,
        caption: draft.caption,
        author: draft.author,
        url: normalizeInstagramUrl(draft.url),
        imageUrl: draft.imageUrl,
        notes: draft.notes,
        manualTags: extractTags(draft.tagsText),
        categoryIds: draft.selectedCategoryIds
      });
      bump();
      setDraft(emptyDraft());
      setPreview(null);
      setSuggestion(null);
      Alert.alert("Сохранено", "Пост добавлен в локальную базу.");
      router.replace("/feed");
    } catch (error) {
      Alert.alert(
        "Не удалось сохранить",
        error instanceof Error ? error.message : "Проверьте поля и попробуйте снова."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <GradientHero
        eyebrow={sharedUrl ? "Импорт из Instagram" : "Новый пост"}
        title="Добавьте сохраненный пост по ссылке или вручную"
        subtitle="Если Instagram не отдает превью, карточку все равно можно сохранить с заметками и офлайн-авто-категорией."
      />

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.form}>
          <Text variant="titleMedium">Ссылка на пост</Text>
          <TextInput
            mode="outlined"
            label="Instagram URL"
            placeholder="https://www.instagram.com/p/..."
            value={draft.url}
            onChangeText={(value) => updateField("url", value)}
            autoCapitalize="none"
          />
          <View style={styles.row}>
            <Button mode="contained-tonal" loading={previewLoading} onPress={() => handlePreviewFetch()}>
              Получить превью
            </Button>
            <Button mode="outlined" loading={autoCategoryLoading} onPress={handleAutoCategorize}>
              Авто-категория
            </Button>
          </View>
          <HelperText type="info">
            Авто-категория работает офлайн, разбирает обычный текст и хэштеги и может отметить сразу
            несколько тем.
          </HelperText>
          <HelperText type="info">
            В Expo Go системная отправка из Instagram обычно недоступна, поэтому для этой сборки
            используйте копирование URL.
          </HelperText>
        </Card.Content>
      </Card>

      {preview ? <PreviewCard preview={preview} /> : null}

      {suggestion ? (
        <Card mode="contained" style={styles.card}>
          <Card.Content style={styles.form}>
            <Text variant="titleSmall">
              {suggestion.categoryNames.length
                ? `Подобраны категории: ${suggestion.categoryNames.join(", ")}`
                : "Подходящие категории не найдены"}
            </Text>
            <Text variant="bodyMedium">{suggestion.reason}</Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.form}>
          <Text variant="titleMedium">Данные карточки</Text>
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
            label="Личная заметка"
            value={draft.notes}
            onChangeText={(value) => updateField("notes", value)}
            multiline
            numberOfLines={4}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.form}>
          <Text variant="titleMedium">Категории</Text>
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
          {!categories.length ? (
            <HelperText type="info">
              Категорий пока нет. Авто-категория может сама создать первую тему по содержимому поста.
            </HelperText>
          ) : null}
        </Card.Content>
      </Card>

      <Button mode="contained" loading={saving} onPress={handleSave}>
        Сохранить в базу
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16
  },
  form: {
    gap: 14
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  }
});
