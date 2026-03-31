import { StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { Image } from "expo-image";

import type { PreviewPayload } from "@/types/models";

type PreviewCardProps = {
  preview: PreviewPayload;
};

export function PreviewCard({ preview }: PreviewCardProps) {
  return (
    <Card mode="contained" style={styles.card}>
      {preview.imageUrl ? <Image source={preview.imageUrl} style={styles.image} contentFit="cover" /> : null}
      <Card.Content style={styles.content}>
        <Text variant="labelMedium">{preview.siteName || "Preview"}</Text>
        {preview.title ? (
          <Text variant="titleMedium" numberOfLines={2}>
            {preview.title}
          </Text>
        ) : null}
        {preview.author ? (
          <Text variant="bodyMedium" numberOfLines={1}>
            Автор: {preview.author}
          </Text>
        ) : null}
        {preview.description ? (
          <Text variant="bodySmall" numberOfLines={3}>
            {preview.description}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 24
  },
  image: {
    width: "100%",
    height: 220
  },
  content: {
    gap: 8,
    paddingTop: 16
  }
});
