import type { CategorySuggestion } from "@/types/models";

type SuggestInput = {
  title: string;
  caption: string;
  manualTags?: string;
  categories: string[];
  allowNewCategory: boolean;
  maxSuggestions?: number;
};

type TaxonomyCategory = {
  name: string;
  aliases: string[];
  keywords: string[];
  hashtags?: string[];
  reason: string;
};

type RankedCategory = {
  categoryName: string;
  score: number;
  matches: string[];
  fallbackReason: string;
};

type SignalBag = {
  normalizedText: string;
  tokens: string[];
  hashtagTokens: string[];
  rawHashtags: string[];
};

const fallbackCategoryName = "Идеи";
const maxCategorySuggestions = 3;
const minimumStrongScore = 8;
const minimumWeakScore = 4;

const knownTokenBreaks = [
  "samsung",
  "galaxy",
  "iphone",
  "apple",
  "android",
  "xiaomi",
  "redmi",
  "honor",
  "huawei",
  "pixel",
  "nothing",
  "oneplus",
  "смартфон",
  "телефон",
  "лайфхак",
  "фишки",
  "фишка",
  "советы",
  "рецепт",
  "travel",
  "reels"
];

const taxonomy: TaxonomyCategory[] = [
  {
    name: "Рецепты",
    aliases: ["Еда", "Кулинария", "Блюда"],
    keywords: ["рецепт", "ингредиент", "кухня", "ужин", "завтрак", "обед", "салат", "паста", "суп"],
    hashtags: ["готовимдома", "еда", "рецептдня"],
    reason: "Контент про приготовление еды и блюда."
  },
  {
    name: "Десерты",
    aliases: ["Сладкое", "Выпечка", "Торты"],
    keywords: ["десерт", "торт", "пирог", "печенье", "чизкейк", "брауни", "крем", "шоколад", "выпечка"],
    hashtags: ["сладкое", "десерт", "торт"],
    reason: "Контент про сладости, выпечку и десерты."
  },
  {
    name: "Кафе",
    aliases: ["Рестораны", "Кофейни", "Заведения"],
    keywords: ["кафе", "ресторан", "кофейня", "меню", "бар", "бранч", "заведение", "дегустация"],
    hashtags: ["гдевкуснопоесть", "coffeetime", "restaurant"],
    reason: "Похоже на подборку мест, кафе или ресторанов."
  },
  {
    name: "Путешествия",
    aliases: ["Поездки", "Тревел", "Отдых"],
    keywords: ["путешествие", "поездка", "отпуск", "маршрут", "перелет", "страна", "город", "отдых"],
    hashtags: ["travel", "trip", "wanderlust"],
    reason: "Контент про поездки и путешествия."
  },
  {
    name: "Маршруты",
    aliases: ["Гайды", "Локации", "Места"],
    keywords: ["куда сходить", "локация", "место", "гид", "спот", "район", "маршрут", "обзор города"],
    hashtags: ["cityguide", "местадня"],
    reason: "Похоже на подборку мест или городской маршрут."
  },
  {
    name: "Фитнес",
    aliases: ["Тренировки", "Спорт", "Зал"],
    keywords: ["тренировка", "упражнение", "фитнес", "кардио", "силовая", "зал", "мышцы", "бег"],
    hashtags: ["workout", "fitness", "gym"],
    reason: "Контент про спорт и тренировки."
  },
  {
    name: "Йога",
    aliases: ["Растяжка", "Мобилити"],
    keywords: ["йога", "асан", "растяжка", "медитация", "дыхание", "мобилити", "гибкость"],
    hashtags: ["yoga", "stretching"],
    reason: "Контент про йогу, дыхание и растяжку."
  },
  {
    name: "Питание",
    aliases: ["Полезная еда", "Нутрициология"],
    keywords: ["питание", "белок", "калории", "рацион", "нутрициолог", "витамины", "клетчатка", "пп"],
    hashtags: ["healthyfood", "nutrition"],
    reason: "Контент про рацион и здоровое питание."
  },
  {
    name: "Стиль",
    aliases: ["Мода", "Образы", "Гардероб"],
    keywords: ["стиль", "образ", "аутфит", "гардероб", "мода", "джинсы", "платье", "лук"],
    hashtags: ["outfit", "style", "look"],
    reason: "Контент про одежду, стиль и образы."
  },
  {
    name: "Бьюти",
    aliases: ["Уход", "Косметика", "Макияж"],
    keywords: ["макияж", "косметика", "уход", "кожа", "сыворотка", "волосы", "маникюр", "spf"],
    hashtags: ["beauty", "skincare"],
    reason: "Контент про уход, косметику и красоту."
  },
  {
    name: "Покупки",
    aliases: ["Находки", "Товары", "Wishlist"],
    keywords: ["покупка", "товар", "скидка", "распродажа", "обзор", "находка", "маркетплейс", "wildberries", "ozon"],
    hashtags: ["находкидня", "shopping", "wishlist"],
    reason: "Контент про покупки, товары и находки."
  },
  {
    name: "Дом",
    aliases: ["Интерьер", "Декор", "Уют"],
    keywords: ["интерьер", "декор", "уют", "дом", "ремонт", "мебель", "гостиная", "спальня", "организация дома"],
    hashtags: ["homedecor", "interior"],
    reason: "Контент про дом, интерьер и декор."
  },
  {
    name: "Организация",
    aliases: ["Порядок", "Планирование", "Системы"],
    keywords: ["организация", "порядок", "планирование", "чеклист", "расписание", "трекер", "система", "продуктивность"],
    hashtags: ["planner", "organization"],
    reason: "Контент про порядок, системы и планирование."
  },
  {
    name: "Лайфхаки",
    aliases: ["Фишки", "Советы", "Хитрости"],
    keywords: ["лайфхак", "фишка", "совет", "трюк", "полезно", "как сделать", "howto", "tips", "hack"],
    hashtags: ["лайфхак", "фишкидня", "tips"],
    reason: "Контент похож на полезные советы и лайфхаки."
  },
  {
    name: "Саморазвитие",
    aliases: ["Личный рост", "Привычки", "Осознанность"],
    keywords: ["саморазвитие", "привычка", "осознанность", "дисциплина", "цель", "мышление", "рост"],
    hashtags: ["selfgrowth", "mindset"],
    reason: "Контент про личный рост и развитие."
  },
  {
    name: "Мотивация",
    aliases: ["Вдохновение", "Цитаты"],
    keywords: ["мотивация", "вдохновение", "цитата", "поддержка", "успех", "энергия", "фокус"],
    hashtags: ["motivation", "inspiration"],
    reason: "Похоже на мотивационный контент."
  },
  {
    name: "Книги",
    aliases: ["Чтение", "Литература"],
    keywords: ["книга", "чтение", "автор", "роман", "литература", "нонфикшн", "подборка книг"],
    hashtags: ["books", "reading"],
    reason: "Контент про книги и чтение."
  },
  {
    name: "Обучение",
    aliases: ["Курсы", "Учеба", "Навыки"],
    keywords: ["курс", "обучение", "урок", "лекция", "конспект", "учеба", "навык", "study"],
    hashtags: ["learning", "study"],
    reason: "Контент про учебу и освоение навыков."
  },
  {
    name: "Бизнес",
    aliases: ["Предпринимательство", "Стартап"],
    keywords: ["бизнес", "клиент", "продукт", "стартап", "предприниматель", "команда", "рост бизнеса", "продажи"],
    hashtags: ["business", "startup"],
    reason: "Контент про бизнес и предпринимательство."
  },
  {
    name: "Маркетинг",
    aliases: ["SMM", "Продвижение", "Контент"],
    keywords: ["маркетинг", "smm", "контент", "упаковка", "аудитория", "реклама", "продвижение", "воронка"],
    hashtags: ["smm", "marketing", "reels"],
    reason: "Контент про маркетинг и продвижение."
  },
  {
    name: "Финансы",
    aliases: ["Деньги", "Бюджет", "Инвестиции"],
    keywords: ["финансы", "деньги", "бюджет", "инвестиции", "доход", "расход", "капитал", "накопления"],
    hashtags: ["finance", "money"],
    reason: "Контент про деньги и личные финансы."
  },
  {
    name: "Техника",
    aliases: ["Гаджеты", "Электроника", "Девайсы"],
    keywords: ["техника", "гаджет", "электроника", "девайс", "обзор техники", "samsung", "xiaomi", "apple", "huawei"],
    hashtags: ["tech", "gadgets", "electronics"],
    reason: "Контент про гаджеты, технику и электронику."
  },
  {
    name: "Смартфоны",
    aliases: ["Телефоны", "Мобильные"],
    keywords: ["смартфон", "телефон", "iphone", "android", "galaxy", "samsung", "redmi", "pixel", "камера телефона"],
    hashtags: ["smartphone", "android", "iphone"],
    reason: "Контент явно связан со смартфонами."
  },
  {
    name: "AI",
    aliases: ["ИИ", "Нейросети", "Искусственный интеллект"],
    keywords: ["ai", "ии", "нейросеть", "chatgpt", "gemini", "prompt", "автоматизация", "llm"],
    hashtags: ["ai", "artificialintelligence"],
    reason: "Контент про AI, нейросети и автоматизацию."
  },
  {
    name: "Дизайн",
    aliases: ["Визуал", "Графика", "UI UX"],
    keywords: ["дизайн", "интерфейс", "типографика", "палитра", "брендинг", "композиция", "ui", "ux"],
    hashtags: ["design", "uiux"],
    reason: "Контент про визуал, графику или интерфейсы."
  },
  {
    name: "Фото Видео",
    aliases: ["Съемка", "Монтаж", "Контент-съемка"],
    keywords: ["фото", "видео", "съемка", "монтаж", "камера", "кадр", "обработка", "preset", "reels"],
    hashtags: ["photo", "video", "reels"],
    reason: "Контент про съемку, фото или видео."
  },
  {
    name: "Психология",
    aliases: ["Эмоции", "Терапия", "Ментальное здоровье"],
    keywords: ["психология", "эмоции", "тревога", "выгорание", "терапия", "границы", "ментальное здоровье"],
    hashtags: ["psychology", "mentalhealth"],
    reason: "Контент про психологию и эмоциональное состояние."
  },
  {
    name: "Отношения",
    aliases: ["Любовь", "Пара", "Общение"],
    keywords: ["отношения", "пара", "любовь", "коммуникация", "конфликт", "знакомства", "семья"],
    hashtags: ["relationship", "love"],
    reason: "Контент про отношения и общение."
  },
  {
    name: "Родительство",
    aliases: ["Дети", "Мама", "Папа"],
    keywords: ["ребенок", "дети", "родитель", "мама", "папа", "малыш", "воспитание", "беременность"],
    hashtags: ["kids", "parenting"],
    reason: "Контент про детей и родительство."
  },
  {
    name: "DIY",
    aliases: ["Своими руками", "Мастер-класс", "Хендмейд"],
    keywords: ["diy", "мастер-класс", "своими руками", "поделка", "craft", "сделай сам", "хендмейд"],
    hashtags: ["diy", "craft"],
    reason: "Контент про проекты своими руками."
  },
  {
    name: "Сад",
    aliases: ["Растения", "Цветы", "Огород"],
    keywords: ["растение", "цветок", "сад", "огород", "полив", "грунт", "лист", "рассада"],
    hashtags: ["plants", "garden"],
    reason: "Контент про растения и сад."
  },
  {
    name: "Питомцы",
    aliases: ["Животные", "Кошки", "Собаки"],
    keywords: ["кот", "кошка", "собака", "щенок", "питомец", "животное", "ветеринар", "корм"],
    hashtags: ["pets", "cat", "dog"],
    reason: "Контент про домашних животных."
  },
  {
    name: "Авто",
    aliases: ["Машины", "Автомобили", "Тюнинг"],
    keywords: ["авто", "машина", "автомобиль", "тюнинг", "драйв", "детейлинг", "car"],
    hashtags: ["car", "auto"],
    reason: "Контент про автомобили."
  }
];

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s#_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(word: string) {
  const normalized = word.trim().toLowerCase();

  if (normalized.length <= 3) {
    return normalized;
  }

  return normalized
    .replace(
      /(иями|ями|ами|иях|ях|его|ого|ему|ому|ыми|ими|ее|ие|ые|ой|ий|ый|ая|ое|ам|ям|ах|ях|ов|ев|ей|ом|ем|ою|ею|ую|юю|ия|ья|ье|ии|ию|ью|а|я|ы|и|е|о|у|ю|ь)$/u,
      ""
    )
    .replace(/(ingly|ing|ers|ies|ied|er|ed|es|s)$/u, "")
    .trim();
}

function splitByKnownSegments(token: string) {
  let prepared = token;

  for (const segment of knownTokenBreaks) {
    prepared = prepared.replaceAll(segment, ` ${segment} `);
  }

  return prepared
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitCompoundHashtag(hashtag: string) {
  const withBoundaries = hashtag
    .replace(/(?<=[a-zа-я])(?=[A-ZА-Я])/g, " ")
    .replace(/(?<=[а-яА-Я])(?=[a-zA-Z])/g, " ")
    .replace(/(?<=[a-zA-Z])(?=[а-яА-Я])/g, " ")
    .replace(/(?<=[\p{L}])(?=[0-9])/gu, " ")
    .replace(/(?<=[0-9])(?=[\p{L}])/gu, " ")
    .replace(/[_-]+/g, " ");

  return withBoundaries
    .split(/\s+/)
    .flatMap(splitByKnownSegments)
    .map((part) => normalizeText(part))
    .filter(Boolean);
}

function tokenizeText(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .flatMap(splitByKnownSegments)
    .map((token) => stemToken(token))
    .filter((token) => token.length >= 2);
}

function extractSignals(input: SuggestInput): SignalBag {
  const rawText = [input.title, input.caption, input.manualTags].filter(Boolean).join(" ");
  const rawHashtags = Array.from(rawText.matchAll(/#[\p{L}\p{N}_-]+/gu), (match) => match[0].slice(1));
  const hashtagTokens = rawHashtags
    .flatMap(splitCompoundHashtag)
    .flatMap((part) => tokenizeText(part));
  const tokens = tokenizeText(rawText);

  return {
    normalizedText: normalizeText(rawText),
    tokens: unique(tokens),
    hashtagTokens: unique(hashtagTokens),
    rawHashtags: unique(rawHashtags.map((item) => normalizeText(item)).filter(Boolean))
  };
}

function matchesPhrase(text: string, phrase: string) {
  const normalized = normalizeText(phrase);
  return normalized.length > 0 && text.includes(normalized);
}

function countKeywordHits(tokens: Set<string>, hashtagTokens: Set<string>, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword || normalizedKeyword.includes(" ")) {
    return 0;
  }

  const stemmed = stemToken(normalizedKeyword);
  let score = 0;

  if (tokens.has(stemmed)) {
    score += 3;
  }

  if (hashtagTokens.has(stemmed)) {
    score += 4;
  }

  return score;
}

function scoreCategory(signals: SignalBag, profile: TaxonomyCategory): RankedCategory {
  const matches: string[] = [];
  const tokenSet = new Set(signals.tokens);
  const hashtagTokenSet = new Set(signals.hashtagTokens);
  let score = 0;

  const phrases = [profile.name, ...profile.aliases];
  const terms = [...profile.keywords, ...(profile.hashtags ?? [])];

  for (const phrase of phrases) {
    if (matchesPhrase(signals.normalizedText, phrase)) {
      score += phrase.includes(" ") ? 7 : 5;
      matches.push(phrase);
    }
  }

  for (const term of terms) {
    if (matchesPhrase(signals.normalizedText, term) && normalizeText(term).includes(" ")) {
      score += 5;
      matches.push(term);
    }

    const tokenScore = countKeywordHits(tokenSet, hashtagTokenSet, term);

    if (tokenScore > 0) {
      score += tokenScore;
      matches.push(term);
    }
  }

  for (const rawHashtag of signals.rawHashtags) {
    if (profile.hashtags?.some((hashtag) => rawHashtag.includes(normalizeText(hashtag)))) {
      score += 5;
      matches.push(`#${rawHashtag}`);
    }
  }

  return {
    categoryName: profile.name,
    score,
    matches: unique(matches).slice(0, 5),
    fallbackReason: profile.reason
  };
}

function buildExistingProfile(categoryName: string): TaxonomyCategory {
  const normalizedCategoryName = normalizeText(categoryName);
  const taxonomyMatch = taxonomy.find((item) => {
    const names = [item.name, ...item.aliases].map((entry) => normalizeText(entry));
    return names.some(
      (entry) =>
        entry === normalizedCategoryName ||
        entry.includes(normalizedCategoryName) ||
        normalizedCategoryName.includes(entry)
    );
  });

  if (taxonomyMatch) {
    return {
      ...taxonomyMatch,
      name: categoryName
    };
  }

  const ownKeywords = categoryName
    .split(/\s+/)
    .map((word) => normalizeText(word))
    .filter(Boolean);

  return {
    name: categoryName,
    aliases: [categoryName],
    keywords: ownKeywords,
    reason: "Категория лучше всего совпала по собственному названию."
  };
}

function chooseTopRanked(ranked: RankedCategory[], limit = maxCategorySuggestions, minBaseScore = minimumWeakScore) {
  const withScore = ranked.filter((item) => item.score >= minBaseScore).sort((left, right) => right.score - left.score);

  if (!withScore.length) {
    return [];
  }

  const topScore = withScore[0].score;
  const minScore = Math.max(minBaseScore, Math.floor(topScore * 0.45));

  return withScore.filter((item) => item.score >= minScore).slice(0, limit);
}

function buildReason(categoryNames: string[], matches: string[], fallbackReason: string) {
  if (categoryNames.length > 0 && matches.length > 0) {
    return `Подобраны темы: ${categoryNames.join(", ")}. Сигналы: ${matches.slice(0, 4).join(", ")}.`;
  }

  if (categoryNames.length > 0) {
    return `Подобраны темы: ${categoryNames.join(", ")}.`;
  }

  return fallbackReason;
}

function inferNewCategories(signals: SignalBag, limit: number) {
  const ranked = taxonomy.map((category) => scoreCategory(signals, category));
  return chooseTopRanked(ranked, limit, minimumWeakScore);
}

function matchExistingCategories(signals: SignalBag, categories: string[], limit: number) {
  const ranked = categories.map((categoryName) => {
    const profile = buildExistingProfile(categoryName);
    return scoreCategory(signals, profile);
  });

  return chooseTopRanked(ranked, limit, minimumWeakScore);
}

function mergeRanked(existing: RankedCategory[], inferred: RankedCategory[], limit: number) {
  const merged = new Map<string, RankedCategory>();

  for (const item of [...existing, ...inferred]) {
    const key = normalizeText(item.categoryName);
    const current = merged.get(key);

    if (!current || current.score < item.score) {
      merged.set(key, item);
    }
  }

  return [...merged.values()].sort((left, right) => right.score - left.score).slice(0, limit);
}

export function suggestCategoryOffline(input: SuggestInput): CategorySuggestion {
  const limit = input.maxSuggestions ?? maxCategorySuggestions;
  const signals = extractSignals(input);
  const inferred = inferNewCategories(signals, limit);

  if (!input.categories.length) {
    const chosen = inferred.length ? inferred : [{ categoryName: fallbackCategoryName, score: 0, matches: [], fallbackReason: "Явных сигналов мало, поэтому выбрана универсальная тема." }];

    return {
      categoryNames: chosen.map((item) => item.categoryName),
      reason: buildReason(
        chosen.map((item) => item.categoryName),
        chosen.flatMap((item) => item.matches),
        chosen[0].fallbackReason
      ),
      matchedSignals: unique(chosen.flatMap((item) => item.matches)).slice(0, 6)
    };
  }

  const existing = matchExistingCategories(signals, input.categories, limit);
  const strongExisting = existing.filter((item) => item.score >= minimumStrongScore);
  const hasComplementaryInference = inferred.some(
    (item) =>
      item.score >= minimumStrongScore &&
      !strongExisting.some((existingItem) => normalizeText(existingItem.categoryName) === normalizeText(item.categoryName))
  );
  const shouldAddNew =
    input.allowNewCategory ||
    !strongExisting.length ||
    hasComplementaryInference ||
    (inferred[0]?.score ?? 0) > ((strongExisting[0]?.score ?? 0) + 2);

  const chosen = shouldAddNew
    ? mergeRanked(strongExisting, inferred, limit)
    : strongExisting.slice(0, limit);

  if (!chosen.length) {
    const fallback = inferred.length ? inferred : [{ categoryName: fallbackCategoryName, score: 0, matches: [], fallbackReason: "Явных сигналов мало, поэтому выбрана универсальная тема." }];

    return {
      categoryNames: fallback.map((item) => item.categoryName),
      reason: buildReason(
        fallback.map((item) => item.categoryName),
        fallback.flatMap((item) => item.matches),
        fallback[0].fallbackReason
      ),
      matchedSignals: unique(fallback.flatMap((item) => item.matches)).slice(0, 6)
    };
  }

  return {
    categoryNames: chosen.map((item) => item.categoryName),
    reason: buildReason(
      chosen.map((item) => item.categoryName),
      chosen.flatMap((item) => item.matches),
      chosen[0].fallbackReason
    ),
    matchedSignals: unique(chosen.flatMap((item) => item.matches)).slice(0, 6)
  };
}
