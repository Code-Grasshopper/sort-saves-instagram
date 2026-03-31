import type { PostDraft } from "@/types/models";

export function extractTags(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");
}

export function emptyDraft(): PostDraft {
  return {
    title: "",
    caption: "",
    author: "",
    url: "",
    imageUrl: "",
    tagsText: "",
    notes: "",
    selectedCategoryIds: []
  };
}
