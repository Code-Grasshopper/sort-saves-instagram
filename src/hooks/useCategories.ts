import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getCategories } from "@/db/repository";
import { useDataStore } from "@/store/data-store";
import type { Category } from "@/types/models";

export function useCategories() {
  const db = useSQLiteContext();
  const version = useDataStore((state) => state.version);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setCategories(await getCategories(db));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить категории.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { categories, loading, error, reload: load };
}
