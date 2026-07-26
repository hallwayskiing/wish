import { json, parseJsonBody } from './http.js';
import { generatePlan } from './model.js';
import { CATEGORY_NAMES } from './prompt.js';
import {
  bindStatement,
  parseWishRow,
  serializePlan,
  VALID_CATEGORIES,
  WISH_FIELDS
} from './wish-data.js';

const MAX_PLAN_LENGTH = 100_000;
const WISH_ID_PATTERN = /^wish_[a-zA-Z0-9_-]+$/;

const MESSAGES = {
  zh: {
    emptyWish: '请填写您的愿望！',
    genFailed: '愿望生成失败。',
    missingDraft: '缺少待保存的愿望数据。',
    emptyTitle: '愿望内容不能为空。',
    invalidPlan: '愿望行动方案无效。',
    planTooLong: '愿望行动方案内容过长。',
    alreadySaved: '该愿望已经保存。',
    saveFailed: '保存愿望失败。',
    listFailed: '获取愿望列表失败，请重试。',
    notFound: '未找到该愿望。',
    blessFailed: '助愿失败，请重试。'
  },
  en: {
    emptyWish: 'Please enter a wish.',
    genFailed: 'Wish generation failed.',
    missingDraft: 'Missing wish data.',
    emptyTitle: 'Wish content cannot be empty.',
    invalidPlan: 'The wish action plan is invalid.',
    planTooLong: 'The wish action plan is too long.',
    alreadySaved: 'This wish has already been saved.',
    saveFailed: 'Could not save the wish.',
    listFailed: 'Could not load wishes.',
    notFound: 'Wish not found.',
    blessFailed: 'Could not send encouragement.'
  }
};

function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'zh';
}

function normalizeCategory(category) {
  return VALID_CATEGORIES.has(category) ? category : 'growth';
}

function message(language, key) {
  return MESSAGES[normalizeLanguage(language)][key];
}

function createWishId() {
  return `wish_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`;
}

export async function createWishDraft(request) {
  const body = await parseJsonBody(request);
  const language = normalizeLanguage(body?.language);
  const title = typeof body?.wish === 'string' ? body.wish.trim().slice(0, 300) : '';

  if (!title) {
    return json({ error: message(language, 'emptyWish') }, 400);
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
  } catch (error) {
    console.error('Wish generation error:', error);
    return json({ error: error.message || message(language, 'genFailed') }, 500);
  }
}

export async function saveWish(request, env) {
  const body = await parseJsonBody(request);
  const language = normalizeLanguage(body?.language);
  const draft = body?.wish;

  if (!draft || typeof draft !== 'object') {
    return json({ error: message(language, 'missingDraft') }, 400);
  }

  const title = typeof draft.title === 'string' ? draft.title.trim().slice(0, 300) : '';
  if (!title) {
    return json({ error: message(language, 'emptyTitle') }, 400);
  }

  const serializedPlan = serializePlan(draft.aiPlan);
  if (!serializedPlan) {
    return json({ error: message(language, 'invalidPlan') }, 400);
  }
  if (serializedPlan.length > MAX_PLAN_LENGTH) {
    return json({ error: message(language, 'planTooLong') }, 400);
  }

  const category = normalizeCategory(draft.category);
  const parsedDate = Date.parse(draft.createdAt);
  const savedWish = {
    id: typeof draft.id === 'string' && WISH_ID_PATTERN.test(draft.id)
      ? draft.id
      : createWishId(),
    title,
    category,
    categoryName: CATEGORY_NAMES[language][category],
    createdAt: Number.isNaN(parsedDate) ? new Date().toISOString() : new Date(parsedDate).toISOString(),
    blessings: 0,
    aiPlan: draft.aiPlan
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
  } catch (error) {
    console.error('Wish save error:', error);
    if (/unique|constraint/i.test(error.message || '')) {
      return json({ error: message(language, 'alreadySaved') }, 409);
    }
    return json({ error: message(language, 'saveFailed') }, 500);
  }
}

export async function listWishes(url, env) {
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search')?.trim();
  const rawPage = Number.parseInt(url.searchParams.get('page'), 10);
  const rawLimit = Number.parseInt(url.searchParams.get('limit'), 10);

  const isPaginated = Number.isInteger(rawPage) && rawPage > 0;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 6;
  const page = isPaginated ? rawPage : 1;
  const conditions = [];
  const params = [];

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
    let total;
    let totalPages;
    if (isPaginated) {
      const count = await bindStatement(
        env.DB.prepare(`SELECT COUNT(*) AS total FROM wishes${where}`),
        params
      ).first();
      total = Number(count?.total) || 0;
      totalPages = Math.max(1, Math.ceil(total / limit));
    }

    const pagination = isPaginated ? ' LIMIT ? OFFSET ?' : '';
    const queryParams = isPaginated
      ? [...params, limit, (page - 1) * limit]
      : params;
    const result = await bindStatement(env.DB.prepare(`
      SELECT ${WISH_FIELDS}
      FROM wishes${where}
      ORDER BY createdAt DESC${pagination}
    `), queryParams).all();
    const response = { wishes: (result.results || []).map(parseWishRow) };

    if (isPaginated) {
      Object.assign(response, { total, page, limit, totalPages });
    }
    return json(response);
  } catch (error) {
    console.error('Wish list error:', error);
    return json({ error: message('zh', 'listFailed') }, 500);
  }
}

export async function blessWish(id, env) {
  try {
    const update = await env.DB.prepare(
      'UPDATE wishes SET blessings = blessings + 1 WHERE id = ?'
    ).bind(id).run();

    if (!update.meta?.changes) {
      return json({ error: message('zh', 'notFound') }, 404);
    }

    const row = await env.DB.prepare(
      'SELECT blessings FROM wishes WHERE id = ?'
    ).bind(id).first();
    return json({ success: true, blessings: row.blessings });
  } catch (error) {
    console.error('Wish blessing error:', error);
    return json({ error: message('zh', 'blessFailed') }, 500);
  }
}
