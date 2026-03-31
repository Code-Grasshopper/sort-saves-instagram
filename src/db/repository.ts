import type { SQLiteDatabase } from "expo-sqlite";

import type {
  BackupPayload,
  Category,
  CategoryInput,
  FeedSort,
  Post,
  PostInput,
  PostQueryOptions
} from "@/types/models";

type PostRow = {
  id: number;
  title: string;
  caption: string;
  author: string;
  url: string;
  image_url: string;
  notes: string;
  manual_tags: string;
  created_at: string;
  category_ids: string | null;
  category_names: string | null;
  category_colors: string | null;
  category_emojis: string | null;
};

const SEPARATOR = "|||";

function mapGroupedCategories(row: PostRow): Category[] {
  if (!row.category_ids) {
    return [];
  }

  const ids = row.category_ids.split(SEPARATOR);
  const names = (row.category_names ?? "").split(SEPARATOR);
  const colors = (row.category_colors ?? "").split(SEPARATOR);
  const emojis = (row.category_emojis ?? "").split(SEPARATOR);

  return ids
    .map((id, index) => ({
      id: Number(id),
      name: names[index] ?? "",
      color: colors[index] ?? "#E9724C",
      emoji: emojis[index] ?? "✨",
      createdAt: ""
    }))
    .filter((category) => Number.isFinite(category.id));
}

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    author: row.author,
    url: row.url,
    imageUrl: row.image_url,
    notes: row.notes,
    manualTags: row.manual_tags,
    createdAt: row.created_at,
    categories: mapGroupedCategories(row)
  };
}

function getOrderBy(sort: FeedSort) {
  switch (sort) {
    case "author":
      return "LOWER(p.author) ASC, p.created_at DESC";
    case "category":
      return "LOWER(COALESCE(MIN(c.name), '')) ASC, p.created_at DESC";
    case "date_desc":
    default:
      return "p.created_at DESC";
  }
}

export async function getCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    color: string;
    emoji: string;
    created_at: string;
    post_count: number;
  }>(`
    SELECT
      c.id,
      c.name,
      c.color,
      c.emoji,
      c.created_at,
      COUNT(pc.post_id) AS post_count
    FROM categories c
    LEFT JOIN post_categories pc ON pc.category_id = c.id
    GROUP BY c.id
    ORDER BY LOWER(c.name) ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    createdAt: row.created_at,
    postCount: row.post_count
  }));
}

export async function saveCategory(db: SQLiteDatabase, input: CategoryInput) {
  const name = input.name.trim();
  const emoji = input.emoji.trim() || "✨";
  const color = input.color.trim() || "#E9724C";

  if (!name) {
    throw new Error("Название категории не может быть пустым.");
  }

  if (input.id) {
    await db.runAsync(
      `UPDATE categories SET name = ?, emoji = ?, color = ? WHERE id = ?`,
      name,
      emoji,
      color,
      input.id
    );
    return input.id;
  }

  const result = await db.runAsync(
    `INSERT INTO categories (name, emoji, color) VALUES (?, ?, ?)`,
    name,
    emoji,
    color
  );

  return result.lastInsertRowId;
}

export async function deleteCategory(db: SQLiteDatabase, id: number) {
  await db.runAsync(`DELETE FROM categories WHERE id = ?`, id);
}

export async function getPosts(db: SQLiteDatabase, options: PostQueryOptions): Promise<Post[]> {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (options.search.trim()) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    where.push(`
      (
        LOWER(COALESCE(p.title, '')) LIKE ?
        OR LOWER(COALESCE(p.caption, '')) LIKE ?
        OR LOWER(COALESCE(p.author, '')) LIKE ?
        OR LOWER(COALESCE(p.manual_tags, '')) LIKE ?
      )
    `);
    params.push(term, term, term, term);
  }

  if (options.categoryId) {
    where.push(`
      EXISTS (
        SELECT 1
        FROM post_categories filter_pc
        WHERE filter_pc.post_id = p.id AND filter_pc.category_id = ?
      )
    `);
    params.push(options.categoryId);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderBy = getOrderBy(options.sort);

  const rows = await db.getAllAsync<PostRow>(
    `
      SELECT
        p.id,
        p.title,
        p.caption,
        p.author,
        p.url,
        p.image_url,
        p.notes,
        p.manual_tags,
        p.created_at,
        GROUP_CONCAT(c.id, '${SEPARATOR}') AS category_ids,
        GROUP_CONCAT(c.name, '${SEPARATOR}') AS category_names,
        GROUP_CONCAT(c.color, '${SEPARATOR}') AS category_colors,
        GROUP_CONCAT(c.emoji, '${SEPARATOR}') AS category_emojis
      FROM posts p
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${orderBy}
    `,
    ...params
  );

  return rows.map(mapPost);
}

export async function getPostById(db: SQLiteDatabase, id: number): Promise<Post | null> {
  const row = await db.getFirstAsync<PostRow>(
    `
      SELECT
        p.id,
        p.title,
        p.caption,
        p.author,
        p.url,
        p.image_url,
        p.notes,
        p.manual_tags,
        p.created_at,
        GROUP_CONCAT(c.id, '${SEPARATOR}') AS category_ids,
        GROUP_CONCAT(c.name, '${SEPARATOR}') AS category_names,
        GROUP_CONCAT(c.color, '${SEPARATOR}') AS category_colors,
        GROUP_CONCAT(c.emoji, '${SEPARATOR}') AS category_emojis
      FROM posts p
      LEFT JOIN post_categories pc ON pc.post_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.id = ?
      GROUP BY p.id
    `,
    id
  );

  return row ? mapPost(row) : null;
}

export async function getExistingPostUrls(db: SQLiteDatabase, urls: string[]) {
  const normalized = [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
  const found = new Set<string>();

  for (let index = 0; index < normalized.length; index += 200) {
    const chunk = normalized.slice(index, index + 200);

    if (!chunk.length) {
      continue;
    }

    const placeholders = chunk.map(() => "?").join(", ");
    const rows = await db.getAllAsync<{ url: string }>(
      `SELECT url FROM posts WHERE url IN (${placeholders})`,
      ...chunk
    );

    rows.forEach((row) => found.add(row.url));
  }

  return found;
}

async function syncPostCategories(db: SQLiteDatabase, postId: number, categoryIds: number[]) {
  await db.runAsync(`DELETE FROM post_categories WHERE post_id = ?`, postId);

  for (const categoryId of categoryIds) {
    await db.runAsync(
      `INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`,
      postId,
      categoryId
    );
  }
}

export async function savePost(db: SQLiteDatabase, input: PostInput) {
  const payload = {
    title: input.title.trim(),
    caption: input.caption.trim(),
    author: input.author.trim(),
    url: input.url.trim(),
    imageUrl: input.imageUrl.trim(),
    notes: input.notes.trim(),
    manualTags: input.manualTags.trim(),
    categoryIds: input.categoryIds,
    createdAt: input.createdAt?.trim() || ""
  };

  if (!payload.title && !payload.caption && !payload.url) {
    throw new Error("Добавьте хотя бы URL, заголовок или описание.");
  }

  let postId = input.id ?? 0;

  await db.withTransactionAsync(async () => {
    if (input.id) {
      await db.runAsync(
        `
          UPDATE posts
          SET title = ?, caption = ?, author = ?, url = ?, image_url = ?, notes = ?, manual_tags = ?
          WHERE id = ?
        `,
        payload.title,
        payload.caption,
        payload.author,
        payload.url,
        payload.imageUrl,
        payload.notes,
        payload.manualTags,
        input.id
      );
      postId = input.id;
    } else {
      const result = payload.createdAt
        ? await db.runAsync(
            `
              INSERT INTO posts (title, caption, author, url, image_url, notes, manual_tags, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            payload.title,
            payload.caption,
            payload.author,
            payload.url,
            payload.imageUrl,
            payload.notes,
            payload.manualTags,
            payload.createdAt
          )
        : await db.runAsync(
            `
              INSERT INTO posts (title, caption, author, url, image_url, notes, manual_tags)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            payload.title,
            payload.caption,
            payload.author,
            payload.url,
            payload.imageUrl,
            payload.notes,
            payload.manualTags
          );
      postId = result.lastInsertRowId;
    }

    await syncPostCategories(db, postId, payload.categoryIds);
  });

  return postId;
}

export async function deletePost(db: SQLiteDatabase, id: number) {
  await db.runAsync(`DELETE FROM posts WHERE id = ?`, id);
}

export async function exportDatabase(db: SQLiteDatabase): Promise<BackupPayload> {
  const categories = await db.getAllAsync<{
    id: number;
    name: string;
    color: string;
    emoji: string;
    created_at: string;
  }>(`SELECT id, name, color, emoji, created_at FROM categories ORDER BY id ASC`);

  const posts = await db.getAllAsync<{
    id: number;
    title: string;
    caption: string;
    author: string;
    url: string;
    image_url: string;
    notes: string;
    manual_tags: string;
    created_at: string;
  }>(`
    SELECT id, title, caption, author, url, image_url, notes, manual_tags, created_at
    FROM posts
    ORDER BY id ASC
  `);

  const relations = await db.getAllAsync<{
    post_id: number;
    category_id: number;
  }>(`SELECT post_id, category_id FROM post_categories ORDER BY post_id ASC, category_id ASC`);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      emoji: category.emoji,
      createdAt: category.created_at
    })),
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      caption: post.caption,
      author: post.author,
      url: post.url,
      imageUrl: post.image_url,
      notes: post.notes,
      manualTags: post.manual_tags,
      createdAt: post.created_at,
      categoryIds: relations
        .filter((relation) => relation.post_id === post.id)
        .map((relation) => relation.category_id)
    }))
  };
}

export async function importDatabase(db: SQLiteDatabase, payload: BackupPayload) {
  if (payload.version !== 1) {
    throw new Error("Неподдерживаемая версия резервной копии.");
  }

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM post_categories;
      DELETE FROM posts;
      DELETE FROM categories;
    `);

    for (const category of payload.categories) {
      await db.runAsync(
        `
          INSERT INTO categories (id, name, color, emoji, created_at)
          VALUES (?, ?, ?, ?, ?)
        `,
        category.id,
        category.name,
        category.color,
        category.emoji,
        category.createdAt
      );
    }

    for (const post of payload.posts) {
      await db.runAsync(
        `
          INSERT INTO posts (
            id,
            title,
            caption,
            author,
            url,
            image_url,
            notes,
            manual_tags,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        post.id,
        post.title,
        post.caption,
        post.author,
        post.url,
        post.imageUrl,
        post.notes,
        post.manualTags,
        post.createdAt
      );

      for (const categoryId of post.categoryIds) {
        await db.runAsync(
          `INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`,
          post.id,
          categoryId
        );
      }
    }
  });
}
