import { normalizeInstagramUrl } from "@/lib/instagram";
import type { PreviewPayload } from "@/types/models";

const namedEntities: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " "
};

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (entity, hex: string) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    })
    .replace(/&#(\d+);/g, (entity, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);
      return Number.isNaN(codePoint) ? entity : String.fromCodePoint(codePoint);
    })
    .replace(
      /&([a-z]+);/gi,
      (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity
    )
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

function extractTitle(html: string) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function guessAuthorFromInstagram(description: string) {
  const patterns = [/^([^:]+) on Instagram:/i, /^([^(@]+)\s+\(@[^)]+\)\s+on Instagram/i];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

export async function fetchUrlPreview(rawUrl: string): Promise<PreviewPayload> {
  const url = normalizeInstagramUrl(rawUrl);

  if (!url) {
    throw new Error("Сначала вставьте ссылку на пост.");
  }

  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error("Не удалось получить превью. Попробуйте вручную заполнить поля.");
  }

  const html = await response.text();
  const description = extractMeta(html, "og:description") || extractMeta(html, "description");

  return {
    title: extractMeta(html, "og:title") || extractTitle(html),
    description,
    imageUrl: extractMeta(html, "og:image"),
    siteName: extractMeta(html, "og:site_name") || "Instagram",
    author: extractMeta(html, "author") || guessAuthorFromInstagram(description),
    canonicalUrl: extractMeta(html, "og:url") || url
  };
}
