import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getPostById } from "@/db/repository";
import { useDataStore } from "@/store/data-store";
import type { Post } from "@/types/models";

export function usePostDetail(postId: number) {
  const db = useSQLiteContext();
  const version = useDataStore((state) => state.version);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setPost(await getPostById(db, postId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить карточку.");
    } finally {
      setLoading(false);
    }
  }, [db, postId]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { post, loading, error, reload: load };
}
