import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getPosts } from "@/db/repository";
import { useDataStore } from "@/store/data-store";
import type { Post, PostQueryOptions } from "@/types/models";

export function usePosts(options: PostQueryOptions) {
  const db = useSQLiteContext();
  const version = useDataStore((state) => state.version);
  const { search, categoryId, sort } = options;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setPosts(
        await getPosts(db, {
          search,
          categoryId,
          sort
        })
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить посты.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, db, search, sort]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { posts, loading, error, reload: load };
}
