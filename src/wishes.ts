import { CATEGORY_NAMES, normalizeCategory } from './categories.js';
import { json, parseJsonBody } from './http.js';
import { generatePlan } from './model.js';
import { serverMessage } from './server-messages.js';
import { Env, Wish, WishListResult, RawWishRow } from './types.js';
import {
  bindStatement,
  MAX_PLAN_LENGTH,
  parseWishRow,
  serializePlan,
  VALID_CATEGORIES,
  WISH_FIELDS
} from './wish-data.js';

const WISH_ID_PATTERN = /^wish_[a-zA-Z0-9_-]+$/;

function normalizeLanguage(language?: string | null): 'zh' | 'en' {
  return language === 'en' ? 'en' : 'zh';
}

function createWishId(): string {
  return `wish_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`;
}

interface CreateWishDraftBody {
  wish?: string;
  category?: string;
  customApiKey?: string;
  language?: string;
}

export async function createWishDraft(request: Request): Promise<Response> {
  const body = await parseJsonBody<CreateWishDraftBody>(request);
  const language = normalizeLanguage(body?.language);
  const title = typeof body?.wish === 'string' ? body.wish.trim().slice(0, 300) : '';

  if (!title) {
    return json({ error: serverMessage(language, 'emptyWish') }, 400);
  }

  const category = normalizeCategory(body?.category);

  try {
    const aiPlan = await generatePlan({
      wish: title,
      category,
      apiKey: body?.customApiKey,
      language
    });
    return json({
      success: true,
      wish: {
        id: createWishId(),
        title,
        category,
        categoryName: CATEGORY_NAMES[language][category],
        createdAt: new Date().toISOString(),
        blessings: 0,
        aiPlan
      }
    });
  } catch (error: unknown) {
    console.error('Wish generation error:', error);
    const message = error instanceof Error ? error.message : '';
    return json({ error: message || serverMessage(language, 'generationFailed') }, 500);
  }
}

interface SaveWishBody {
  wish?: Partial<Wish>;
  language?: string;
}

export async function saveWish(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<SaveWishBody>(request);
  const language = normalizeLanguage(body?.language);
  const draft = body?.wish;

  if (!draft || typeof draft !== 'object') {
    return json({ error: serverMessage(language, 'missingDraft') }, 400);
  }

  const title = typeof draft.title === 'string' ? draft.title.trim().slice(0, 300) : '';
  if (!title) {
    return json({ error: serverMessage(language, 'emptyTitle') }, 400);
  }

  const serializedPlan = serializePlan(draft.aiPlan);
  if (!serializedPlan) {
    return json({ error: serverMessage(language, 'invalidPlan') }, 400);
  }
  if (serializedPlan.length > MAX_PLAN_LENGTH) {
    return json({ error: serverMessage(language, 'planTooLong') }, 400);
  }

  const category = normalizeCategory(draft.category);
  const parsedDate = draft.createdAt ? Date.parse(draft.createdAt) : NaN;
  const savedWish: Wish = {
    id: typeof draft.id === 'string' && WISH_ID_PATTERN.test(draft.id)
      ? draft.id
      : createWishId(),
    title,
    category,
    categoryName: CATEGORY_NAMES[language][category],
    createdAt: Number.isNaN(parsedDate) ? new Date().toISOString() : new Date(parsedDate).toISOString(),
    blessings: 0,
    aiPlan: draft.aiPlan ?? {}
  };

  try {
    await env.DB.prepare(`
      INSERT INTO wishes (id, title, category, categoryName, createdAt, blessings, aiPlan)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      savedWish.id,
      savedWish.title,
      savedWish.category,
      savedWish.categoryName,
      savedWish.createdAt,
      savedWish.blessings,
      serializedPlan
    ).run();

    return json({ success: true, wish: savedWish }, 201);
  } catch (error: unknown) {
    console.error('Wish save error:', error);
    const message = error instanceof Error ? error.message : '';
    if (/unique|constraint/i.test(message)) {
      return json({ error: serverMessage(language, 'alreadySaved') }, 409);
    }
    return json({ error: serverMessage(language, 'saveFailed') }, 500);
  }
}

export async function listWishes(url: URL, env: Env): Promise<Response> {
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search')?.trim();
  const statusParam = url.searchParams.get('status');
  const rawPage = Number.parseInt(url.searchParams.get('page') || '', 10);
  const rawLimit = Number.parseInt(url.searchParams.get('limit') || '', 10);

  const isPaginated = Number.isInteger(rawPage) && rawPage > 0;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 6;
  const page = isPaginated ? rawPage : 1;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (statusParam === 'completed') {
    conditions.push("status = 'completed'");
  } else if (statusParam === 'active') {
    conditions.push("(status = 'active' OR status IS NULL)");
  }

  if (category && category !== 'all' && VALID_CATEGORIES.has(category)) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(title LIKE ? OR categoryName LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

  try {
    let total = 0;
    let totalPages = 1;
    if (isPaginated) {
      const count = await bindStatement(
        env.DB.prepare(`SELECT COUNT(*) AS total FROM wishes${where}`),
        params
      ).first<{ total: number }>();
      total = Number(count?.total) || 0;
      totalPages = Math.max(1, Math.ceil(total / limit));
    }

    const pagination = isPaginated ? ' LIMIT ? OFFSET ?' : '';
    const queryParams: (string | number)[] = isPaginated
      ? [...params, limit, (page - 1) * limit]
      : params;
    const result = await bindStatement(env.DB.prepare(`
      SELECT ${WISH_FIELDS}
      FROM wishes${where}
      ORDER BY createdAt DESC${pagination}
    `), queryParams).all<RawWishRow>();

    const wishList: Wish[] = (result.results || [])
      .map(parseWishRow)
      .filter((item): item is Wish => item !== null);

    if (isPaginated) {
      const response: WishListResult = {
        wishes: wishList,
        total,
        page,
        limit,
        totalPages
      };
      return json(response);
    }
    return json({ wishes: wishList });
  } catch (error) {
    console.error('Wish list error:', error);
    return json({ error: serverMessage('zh', 'listFailed') }, 500);
  }
}

export async function blessWish(id: string, env: Env): Promise<Response> {
  try {
    const update = await env.DB.prepare(
      'UPDATE wishes SET blessings = blessings + 1 WHERE id = ?'
    ).bind(id).run();

    if (!update.meta?.changes) {
      return json({ error: serverMessage('zh', 'notFound') }, 404);
    }

    const row = await env.DB.prepare(
      'SELECT blessings FROM wishes WHERE id = ?'
    ).bind(id).first<{ blessings: number }>();
    return json({ success: true, blessings: row?.blessings || 0 });
  } catch (error) {
    console.error('Wish blessing error:', error);
    return json({ error: serverMessage('zh', 'blessFailed') }, 500);
  }
}

export async function completeWish(id: string, env: Env): Promise<Response> {
  try {
    const completedAt = new Date().toISOString();
    const result = await env.DB.prepare(
      "UPDATE wishes SET status = 'completed', completedAt = ? WHERE id = ?"
    ).bind(completedAt, id).run();

    if (!result.meta?.changes) {
      return json({ error: serverMessage('zh', 'notFound') }, 404);
    }
    return json({ success: true, completedAt });
  } catch (error) {
    console.error('Wish completion error:', error);
    return json({ error: serverMessage('zh', 'updateFailed') }, 500);
  }
}
