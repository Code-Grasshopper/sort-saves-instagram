export type ThemeMode = "system" | "light" | "dark";
export type FeedSort = "date_desc" | "category" | "author";
export type FeedView = "grid" | "list";

export type Category = {
  id: number;
  name: string;
  color: string;
  emoji: string;
  createdAt: string;
  postCount?: number;
};

export type CategoryInput = {
  id?: number;
  name: string;
  color: string;
  emoji: string;
};

export type PostDraft = {
  title: string;
  caption: string;
  author: string;
  url: string;
  imageUrl: string;
  tagsText: string;
  notes: string;
  selectedCategoryIds: number[];
};

export type PostInput = {
  id?: number;
  title: string;
  caption: string;
  author: string;
  url: string;
  imageUrl: string;
  notes: string;
  manualTags: string;
  categoryIds: number[];
};

export type Post = {
  id: number;
  title: string;
  caption: string;
  author: string;
  url: string;
  imageUrl: string;
  notes: string;
  manualTags: string;
  createdAt: string;
  categories: Category[];
};

export type PostQueryOptions = {
  search: string;
  categoryId: number | null;
  sort: FeedSort;
};

export type PreviewPayload = {
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  author: string;
  canonicalUrl: string;
};

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  categories: Array<Omit<Category, "postCount">>;
  posts: Array<{
    id: number;
    title: string;
    caption: string;
    author: string;
    url: string;
    imageUrl: string;
    notes: string;
    manualTags: string;
    createdAt: string;
    categoryIds: number[];
  }>;
};

export type CategorySuggestion = {
  categoryNames: string[];
  reason: string;
  matchedSignals?: string[];
};
