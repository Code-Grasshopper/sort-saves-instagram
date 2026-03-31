import { normalizeInstagramUrl } from "@/lib/instagram";

export type ImportedSavedPost = {
  title: string;
  url: string;
  savedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function collectStringsByKey(value: unknown, allowedKeys: string[], result: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringsByKey(item, allowedKeys, result));
    return result;
  }

  if (!isRecord(value)) {
    return result;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (typeof nestedValue === "string" && allowedKeys.includes(key.toLowerCase())) {
      result.push(nestedValue);
      return;
    }

    collectStringsByKey(nestedValue, allowedKeys, result);
  });

  return result;
}

function collectNumbersByKey(value: unknown, allowedKeys: string[], result: number[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNumbersByKey(item, allowedKeys, result));
    return result;
  }

  if (!isRecord(value)) {
    return result;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (typeof nestedValue === "number" && allowedKeys.includes(key.toLowerCase())) {
      result.push(nestedValue);
      return;
    }

    collectNumbersByKey(nestedValue, allowedKeys, result);
  });

  return result;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function pickTitleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const code = segments[segments.length - 1] ?? "Instagram saved";
    return `Instagram Saved ${code}`;
  } catch {
    return "Instagram Saved";
  }
}

function parseSavedItem(item: unknown): ImportedSavedPost | null {
  if (!isRecord(item)) {
    return null;
  }

  const stringMapData = item.string_map_data;
  const stringListData = item.string_list_data;
  const titleCandidates = unique(
    [
      typeof item.title === "string" ? item.title : "",
      ...collectStringsByKey(stringMapData, ["title", "value"]),
      ...collectStringsByKey(stringListData, ["title", "value"])
    ]
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const hrefCandidates = unique(
    [
      ...collectStringsByKey(stringMapData, ["href"]),
      ...collectStringsByKey(stringListData, ["href"])
    ]
      .map((value) => normalizeInstagramUrl(value))
      .filter(Boolean)
  );

  const timestamp = collectNumbersByKey(stringMapData, ["timestamp"])[0] ??
    collectNumbersByKey(stringListData, ["timestamp"])[0];

  const url = hrefCandidates.find((value) => value.includes("instagram.com")) ?? hrefCandidates[0];

  if (!url) {
    return null;
  }

  return {
    title: titleCandidates[0] || pickTitleFromUrl(url),
    url,
    savedAt: typeof timestamp === "number" ? new Date(timestamp * 1000).toISOString() : new Date().toISOString()
  };
}

export function parseInstagramSavedExport(content: string) {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const savedMedia = Array.isArray(parsed.saved_saved_media) ? parsed.saved_saved_media : [];

  return savedMedia.map(parseSavedItem).filter((item): item is ImportedSavedPost => Boolean(item));
}
