import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { CategoryChip } from "@/components/CategoryChip";
import { GradientHero } from "@/components/GradientHero";
import { PreviewCard } from "@/components/PreviewCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { getExistingPostUrls, saveCategory, savePost } from "@/db/repository";
import { useCategories } from "@/hooks/useCategories";
import {
  normalizeSuggestedCategoryName,
  pickAutoCategoryColor,
  pickAutoCategoryEmoji
} from "@/lib/category-ai";
import { extractUrlFromSharedText, normalizeInstagramUrl } from "@/lib/instagram";
import { parseInstagramSavedExport } from "@/lib/instagram-saved-import";
import { fetchUrlPreview } from "@/lib/link-preview";
import { suggestCategoryOffline } from "@/lib/offline-category";
import { emptyDraft, extractTags } from "@/lib/validation";
import { useDataStore } from "@/store/data-store";
import type { CategorySuggestion, PreviewPayload } from "@/types/models";

type CategoryRegistry = Map<string, { id: number; name: string }>;

function buildImportNote(suggestion: CategorySuggestion) {
  const base = "Импортировано из Instagram Saved JSON.";

  if (suggestion.needsReview) {
    return `${base} Авто-категорию лучше проверить и при желании дополнить карточку описанием.`;
  }

  return base;
}

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sharedUrl?: string; sharedText?: string }>();
  const db = useSQLiteContext();
  const bump = useDataStore((state) => state.bump);
  const { categories } = useCategories();
  const [draft, setDraft] = useState(emptyDraft);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [autoCategoryLoading, setAutoCategoryLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const appliedSharedUrl = useRef("");

  const sharedUrl = useMemo(() => {
    const incomingUrl = Array.isArray(params.sharedUrl) ? params.sharedUrl[0] : params.sharedUrl || "";
    const incomingText = Array.isArray(params.sharedText) ? params.sharedText[0] : params.sharedText || "";
    const extracted = extractUrlFromSharedText(incomingUrl || incomingText) || incomingUrl;
    return extracted ? normalizeInstagramUrl(extracted) : "";
  }, [params.sharedText, params.sharedUrl]);

  const sharedText = useMemo(() => {
    const incoming = Array.isArray(params.sharedText) ? params.sharedText[0] : params.sharedText || "";
    return incoming.trim();
  }, [params.sharedText]);

  useEffect(() => {
    if (!sharedUrl || appliedSharedUrl.current === sharedUrl) {
      return;
    }

    appliedSharedUrl.current = sharedUrl;
    setDraft((current) => ({
      ...current,
      url: sharedUrl,
      notes:
        !current.notes.trim() && sharedText && sharedText !== sharedUrl
          ? `Импортировано через Android share intent.\n\n${sharedText}`
          : current.notes
    }));
    handlePreviewFetch(sharedUrl).catch(() => undefined);
  }, [sharedText, sharedUrl]);

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

  function createCategoryRegistry() {
    const registry: CategoryRegistry = new Map();

    categories.forEach((category) => {
      registry.set(category.name.trim().toLowerCase(), {
        id: category.id,
        name: category.name
      });
    });

    return registry;
  }

  async function ensureCategoryInRegistry(
    categoryName: string,
    registry: CategoryRegistry,
    stats?: { createdCategories: number }
  ) {
    const normalizedName = normalizeSuggestedCategoryName(categoryName);
    const key = normalizedName.toLowerCase();
    const existing = registry.get(key);

    if (existing) {
      return existing.id;
    }

    const createdId = await saveCategory(db, {
      name: normalizedName,
      color: pickAutoCategoryColor(normalizedName),
      emoji: pickAutoCategoryEmoji(normalizedName)
    });

    registry.set(key, { id: createdId, name: normalizedName });

    if (stats) {
      stats.createdCategories += 1;
    }

    return createdId;
  }

  async function categorizeAndResolve(
    registry: CategoryRegistry,
    input: { title: string; caption: string; manualTags: string },
    stats?: { createdCategories: number }
  ) {
    const nextSuggestion = suggestCategoryOffline({
      title: input.title,
      caption: input.caption,
      manualTags: input.manualTags,
      categories: [...registry.values()].map((entry) => entry.name),
      allowNewCategory: true
    });

    const normalizedNames = nextSuggestion.categoryNames
      .map(normalizeSuggestedCategoryName)
      .filter(Boolean);
    const categoryIds = await Promise.all(
      normalizedNames.map((name) => ensureCategoryInRegistry(name, registry, stats))
    );

    return {
      suggestion: {
        ...nextSuggestion,
        categoryNames: normalizedNames
      },
      categoryIds
    };
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

  async function handleAutoCategorize() {
    try {
      setAutoCategoryLoading(true);
      const registry = createCategoryRegistry();
      const result = await categorizeAndResolve(
        registry,
        {
          title: draft.title,
          caption: draft.caption,
          manualTags: draft.tagsText
        }
      );

      setSuggestion(result.suggestion);
      ensureCategoryIdsSelected(result.categoryIds);

      if (result.suggestion.needsReview && !draft.notes.trim()) {
        updateField(
          "notes",
          "Авто-категория считает, что посту может понадобиться новая или уточненная тема. Проверьте и дополните карточку."
        );
      }
    } catch (error) {
      Alert.alert(
        "Не удалось подобрать категории",
        error instanceof Error ? error.message : "Попробуйте еще раз."
      );
    } finally {
      setAutoCategoryLoading(false);
    }
  }

  async function handleImportSavedJson() {
    try {
      setImportLoading(true);

      const file = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
        multiple: false
      });

      if (file.canceled || !file.assets[0]) {
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8
      });
      const importedPosts = parseInstagramSavedExport(content);

      if (!importedPosts.length) {
        throw new Error("В файле не удалось найти блок saved_saved_media с валидными Instagram URL.");
      }

      const existingUrls = await getExistingPostUrls(
        db,
        importedPosts.map((item) => item.url)
      );
      const registry = createCategoryRegistry();
      const stats = {
        imported: 0,
        skipped: 0,
        createdCategories: 0,
        reviewNeeded: 0
      };

      for (const item of importedPosts) {
        if (existingUrls.has(item.url)) {
          stats.skipped += 1;
          continue;
        }

        const result = await categorizeAndResolve(
          registry,
          {
            title: item.title,
            caption: "",
            manualTags: ""
          },
          stats
        );

        await savePost(db, {
          title: item.title,
          caption: "",
          author: "",
          url: item.url,
          imageUrl: "",
          notes: buildImportNote(result.suggestion),
          manualTags: "",
          categoryIds: result.categoryIds,
          createdAt: item.savedAt
        });

        if (result.suggestion.needsReview) {
          stats.reviewNeeded += 1;
        }

        stats.imported += 1;
      }

      bump();
      Alert.alert(
        "Импорт завершен",
        `Добавлено: ${stats.imported}\nПропущено дублей: ${stats.skipped}\nНовых категорий: ${stats.createdCategories}\nНуждаются в проверке: ${stats.reviewNeeded}`
      );
    } catch (error) {
      Alert.alert(
        "Импорт не удался",
        error instanceof Error ? error.message : "Проверьте JSON и попробуйте снова."
      );
    } finally {
      setImportLoading(false);
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
        title="Добавьте пост по ссылке, вручную или из Saved JSON"
        subtitle="Приложение хранит все локально и может массово импортировать сохраненные посты из экспорта Instagram без сервера."
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
            Авто-категория работает офлайн, анализирует текст и хэштеги и может создавать новые
            темы, если в системе нет близкого аналога.
          </HelperText>
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.form}>
          <Text variant="titleMedium">Импорт Saved JSON</Text>
          <Text variant="bodyMedium">
            Поддерживается экспорт Instagram с блоком `saved_saved_media`. Парсер ищет `href`,
            `title` и `timestamp` внутри `string_map_data` и `string_list_data`, чтобы пережить
            изменения формата от Meta.
          </Text>
          <Button mode="contained" loading={importLoading} onPress={handleImportSavedJson}>
            Импортировать Saved JSON
          </Button>
          <HelperText type="info">
            Импортированные посты сохраняются локально, раскладываются по существующим категориям
            или создают новые релевантные темы автоматически.
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
              Категорий пока нет. Авто-категория сама создаст первую тему по содержимому поста.
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
