import { categoryPalette } from "@/constants/theme";

const fallbackCategoryName = "Идеи";

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function normalizeSuggestedCategoryName(value: string) {
  const cleaned = value
    .replace(/["'`«»]/g, " ")
    .replace(/[.,:;!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!words.length) {
    return fallbackCategoryName;
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function pickAutoCategoryColor(name: string) {
  return categoryPalette[hashText(name) % categoryPalette.length];
}

export function pickAutoCategoryEmoji(name: string) {
  const normalized = name.toLowerCase();

  if (/(рецепт|еда|кухн|десерт|ужин|обед|выпечк)/i.test(normalized)) return "🍽️";
  if (/(спорт|фитнес|трен|зал|йога|бег|растяж)/i.test(normalized)) return "🏋️";
  if (/(путеш|поезд|отдых|страна|город|отел|маршрут)/i.test(normalized)) return "✈️";
  if (/(идея|вдохнов|мотивац|цитат|саморазвит)/i.test(normalized)) return "💡";
  if (/(книга|обуч|курс|знани|учеб)/i.test(normalized)) return "📚";
  if (/(покупк|товар|бренд|магазин|стиль|образ)/i.test(normalized)) return "🛍️";
  if (/(кино|фильм|сериал|видео|музык|reels)/i.test(normalized)) return "🎬";
  if (/(дом|интерьер|декор|уют|ремонт|мебель)/i.test(normalized)) return "🪴";
  if (/(красот|бьюти|уход|кожа|макияж|волос)/i.test(normalized)) return "💄";
  if (/(технолог|гаджет|техник|ai|ии|смартфон|android|iphone|apple|samsung)/i.test(normalized)) {
    return "📱";
  }
  if (/(лайфхак|фишк|совет|трюк)/i.test(normalized)) return "🧠";

  return "✨";
}
