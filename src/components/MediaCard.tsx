import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { Image } from "expo-image";

import { CategoryChip } from "@/components/CategoryChip";
import { formatRelativeDate } from "@/lib/date";
import type { FeedView, Post } from "@/types/models";

type MediaCardProps = {
  post: Post;
  view: FeedView;
  onPress: () => void;
};

export function MediaCard({ post, view, onPress }: MediaCardProps) {
  const theme = useTheme();
  const isGrid = view === "grid";

  return (
    <Pressable onPress={onPress} style={[styles.wrapper, isGrid ? styles.grid : styles.list]}>
      <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={isGrid ? undefined : styles.listRow}>
          <Image
            source={post.imageUrl || undefined}
            style={isGrid ? styles.gridImage : styles.listImage}
            contentFit="cover"
            transition={150}
          />
          <Card.Content style={[styles.content, isGrid ? undefined : styles.listContent]}>
            <Text variant="titleMedium" numberOfLines={2}>
              {post.title || post.caption || "Пост без названия"}
            </Text>
            {post.author ? (
              <Text variant="bodySmall" style={styles.meta} numberOfLines={1}>
                @{post.author}
              </Text>
            ) : null}
            <Text variant="bodySmall" style={styles.meta}>
              {formatRelativeDate(post.createdAt)}
            </Text>
            {post.caption ? (
              <Text variant="bodyMedium" numberOfLines={isGrid ? 3 : 2} style={styles.caption}>
                {post.caption}
              </Text>
            ) : null}
            <View style={styles.chips}>
              {post.categories.slice(0, isGrid ? 2 : 3).map((category) => (
                <CategoryChip key={category.id} category={category} compact />
              ))}
            </View>
          </Card.Content>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14
  },
  grid: {
    flex: 1,
    marginHorizontal: 5
  },
  list: {
    width: "100%"
  },
  card: {
    borderRadius: 24,
    overflow: "hidden"
  },
  listRow: {
    flexDirection: "row"
  },
  gridImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#2F3946"
  },
  listImage: {
    width: 118,
    height: 148,
    backgroundColor: "#2F3946"
  },
  content: {
    gap: 8,
    paddingTop: 14
  },
  listContent: {
    flex: 1
  },
  meta: {
    opacity: 0.72
  },
  caption: {
    lineHeight: 20
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
