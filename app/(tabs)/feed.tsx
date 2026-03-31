import { useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, IconButton, Menu, Searchbar, Text, useTheme } from "react-native-paper";

import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { GradientHero } from "@/components/GradientHero";
import { MediaCard } from "@/components/MediaCard";
import { useCategories } from "@/hooks/useCategories";
import { usePosts } from "@/hooks/usePosts";
import { useFeedStore } from "@/store/feed-store";
import type { FeedSort } from "@/types/models";

const sortLabels: Record<FeedSort, string> = {
  date_desc: "Сначала новые",
  category: "По категории",
  author: "По автору"
};

function formatPostCount(count: number) {
  if (count === 1) {
    return "1 пост";
  }

  if (count >= 2 && count <= 4) {
    return `${count} поста`;
  }

  return `${count} постов`;
}

export default function FeedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const search = useFeedStore((state) => state.search);
  const sort = useFeedStore((state) => state.sort);
  const view = useFeedStore((state) => state.view);
  const activeCategoryId = useFeedStore((state) => state.activeCategoryId);
  const setSearch = useFeedStore((state) => state.setSearch);
  const setSort = useFeedStore((state) => state.setSort);
  const setView = useFeedStore((state) => state.setView);
  const setActiveCategoryId = useFeedStore((state) => state.setActiveCategoryId);
  const resetFilters = useFeedStore((state) => state.resetFilters);

  const { categories } = useCategories();
  const { posts, loading, reload } = usePosts({
    search,
    categoryId: activeCategoryId,
    sort
  });

  return (
    <FlatList
      data={posts}
      key={view}
      keyExtractor={(item) => `${view}-${item.id}`}
      numColumns={view === "grid" ? 2 : 1}
      renderItem={({ item }) => (
        <MediaCard
          post={item}
          view={view}
          onPress={() =>
            router.push({
              pathname: "/post/[id]",
              params: { id: String(item.id) }
            })
          }
        />
      )}
      columnWrapperStyle={view === "grid" ? styles.column : undefined}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <GradientHero
            eyebrow="Локальная база"
            title="Коллекция сохраненных Instagram постов"
            subtitle="Ищите по подписи, автору или тегам. Переключайте категории и оставляйте в базе только действительно полезное."
          />

          <Searchbar
            placeholder="Найти по подписи, тегу или автору"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          <View style={styles.controls}>
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setSortMenuVisible(true)}>
                  {sortLabels[sort]}
                </Button>
              }
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <Menu.Item
                  key={value}
                  title={label}
                  onPress={() => {
                    setSort(value as FeedSort);
                    setSortMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            <IconButton
              mode="contained-tonal"
              icon={view === "grid" ? "format-list-bulleted" : "view-grid-outline"}
              onPress={() => setView(view === "grid" ? "list" : "grid")}
            />

            <Button mode="text" onPress={resetFilters}>
              Сбросить
            </Button>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Button
              compact
              mode={activeCategoryId === null ? "contained" : "outlined"}
              onPress={() => setActiveCategoryId(null)}
            >
              Все
            </Button>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                selected={activeCategoryId === category.id}
                onPress={() => setActiveCategoryId(activeCategoryId === category.id ? null : category.id)}
              />
            ))}
          </ScrollView>

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatPostCount(posts.length)}
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <EmptyState
            title="Коллекция пока пустая"
            description="Добавьте первую ссылку из Instagram или сохраните карточку вручную с изображением, подписью и заметками."
            actionLabel="Открыть добавление"
            onAction={() => router.push("/add")}
          />
        )
      }
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.colors.primary} />
      }
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.colors.background }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 36
  },
  header: {
    gap: 16,
    marginBottom: 10
  },
  search: {
    borderRadius: 14
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  chipsRow: {
    gap: 10,
    paddingRight: 18
  },
  column: {
    justifyContent: "space-between"
  }
});
