import { CATEGORY_NAMES, buildPrompt } from './prompt.js';

import configYaml from '../config.yaml';

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const ADMIN_COOKIE = 'wish_admin_session';
const ADMIN_SESSION_SECONDS = 24 * 60 * 60;

function readYamlString(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*(?:\"([^\"]*)\"|'([^']*)'|([^#\\r\\n]+))\\s*$`, 'm'));
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim();
}

const ADMIN_PASSWORD = readYamlString(configYaml, 'admin_password');

const MESSAGES = {
  zh: {
    noApiKey: '未配置 API Key，请打开【Google API】并填写 Gemini API Key。',
    modelFailed: (msg) => `大模型调用失败：${msg}`,
    emptyResponse: '大模型返回了空内容。',
    invalidJson: '大模型返回的 JSON 格式无效，请重试。',
    emptyWish: '请填写您的愿望！',
    genFailed: '愿望生成失败。',
    missingDraft: '缺少待保存的愿望数据。',
    emptyTitle: '愿望内容不能为空。',
    invalidPlan: '愿望行动方案无效。',
    alreadySaved: '该愿望已经保存。',
    saveFailed: '保存愿望失败。',
    listFailed: '获取愿望列表失败，请重试。',
    notFound: '未找到该愿望。',
    blessFailed: '助愿失败，请重试。',
    routeNotFound: '请求路径不存在。'
  },
  en: {
    noApiKey: 'No API key configured. Open Google API and enter your Gemini API key.',
    modelFailed: (msg) => `Model request failed: ${msg}`,
    emptyResponse: 'The model returned an empty response.',
    invalidJson: 'The model returned invalid JSON. Please try again.',
    emptyWish: 'Please enter a wish.',
    genFailed: 'Wish generation failed.',
    missingDraft: 'Missing wish data.',
    emptyTitle: 'Wish content cannot be empty.',
    invalidPlan: 'The wish action plan is invalid.',
    alreadySaved: 'This wish has already been saved.',
    saveFailed: 'Could not save the wish.',
    listFailed: 'Could not load wishes.',
    notFound: 'Wish not found.',
    blessFailed: 'Could not send encouragement.',
    routeNotFound: 'API route not found.'
  }
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers }
  });
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function signAdminSession(expiresAt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ADMIN_PASSWORD),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`admin:${expiresAt}`)
  );
  return `${expiresAt}.${bytesToHex(signature)}`;
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator === -1) continue;
    if (cookie.slice(0, separator).trim() === name) {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    }
  }
  return '';
}

async function isAdminAuthenticated(request) {
  if (!ADMIN_PASSWORD) return false;
  const token = getCookie(request, ADMIN_COOKIE);
  const separator = token.indexOf('.');
  if (separator === -1) return false;

  const expiresAt = Number(token.slice(0, separator));
  const signature = token.slice(separator + 1);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const expectedToken = await signAdminSession(expiresAt);
  const expectedSignature = expectedToken.slice(expectedToken.indexOf('.') + 1);
  return constantTimeEqual(signature, expectedSignature);
}

function normalizeLanguage(lang) {
  return lang === 'en' ? 'en' : 'zh';
}

function normalizeCategory(cat) {
  return CATEGORY_NAMES.zh[cat] ? cat : 'growth';
}

function getMsg(lang, key, arg) {
  const l = normalizeLanguage(lang);
  const entry = MESSAGES[l][key] || MESSAGES.zh[key];
  return typeof entry === 'function' ? entry(arg) : entry;
}



async function generatePlan(wish, category, apiKey, language) {
  if (!apiKey) {
    throw new Error(getMsg(language, 'noApiKey'));
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(wish, category, language) }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const errMsg = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(getMsg(language, 'modelFailed', errMsg));
  }

  const responseText = payload?.candidates?.[0]?.content?.parts
    ?.map(p => p.text || '')
    .join('')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!responseText) {
    throw new Error(getMsg(language, 'emptyResponse'));
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(getMsg(language, 'invalidJson'));
  }
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function createWishDraft(request) {
  const body = await parseJsonBody(request);
  const lang = normalizeLanguage(body?.language);
  const wish = typeof body?.wish === 'string' ? body.wish.trim() : '';

  if (!wish) {
    return json({ error: getMsg(lang, 'emptyWish') }, 400);
  }

  const category = normalizeCategory(body?.category);

  try {
    const aiPlan = await generatePlan(wish, category, body?.customApiKey, lang);
    return json({
      success: true,
      wish: {
        id: `wish_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`,
        title: wish.slice(0, 300),
        category,
        categoryName: CATEGORY_NAMES[lang][category],
        createdAt: new Date().toISOString(),
        blessings: 0,
        aiPlan
      }
    });
  } catch (error) {
    console.error('Wish generation error:', error);
    return json({ error: error.message || getMsg(lang, 'genFailed') }, 500);
  }
}

async function saveWish(request, env) {
  const body = await parseJsonBody(request);
  const lang = normalizeLanguage(body?.language);
  const draft = body?.wish;

  if (!draft || typeof draft !== 'object') {
    return json({ error: getMsg(lang, 'missingDraft') }, 400);
  }

  const title = typeof draft.title === 'string' ? draft.title.trim().slice(0, 300) : '';
  if (!title) {
    return json({ error: getMsg(lang, 'emptyTitle') }, 400);
  }

  if (!draft.aiPlan || typeof draft.aiPlan !== 'object' || Array.isArray(draft.aiPlan)) {
    return json({ error: getMsg(lang, 'invalidPlan') }, 400);
  }

  const category = normalizeCategory(draft.category);
  const parsedDate = Date.parse(draft.createdAt);
  const savedWish = {
    id: typeof draft.id === 'string' && /^wish_[a-zA-Z0-9_-]+$/.test(draft.id)
      ? draft.id
      : `wish_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`,
    title,
    category,
    categoryName: CATEGORY_NAMES[lang][category],
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
      JSON.stringify(savedWish.aiPlan)
    ).run();

    return json({ success: true, wish: savedWish }, 201);
  } catch (error) {
    console.error('Wish save error:', error);
    if (/unique|constraint/i.test(error.message || '')) {
      return json({ error: getMsg(lang, 'alreadySaved') }, 409);
    }
    return json({ error: getMsg(lang, 'saveFailed') }, 500);
  }
}

async function listWishes(url, env) {
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search')?.trim();
  const rawPage = parseInt(url.searchParams.get('page'), 10);
  const rawLimit = parseInt(url.searchParams.get('limit'), 10);

  const isPaginated = !isNaN(rawPage) && rawPage > 0;
  const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, 100) : 6;
  const page = isPaginated ? rawPage : 1;
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (category && category !== 'all' && CATEGORY_NAMES.zh[category]) {
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
    if (isPaginated) {
      const countStmt = env.DB.prepare(`SELECT COUNT(*) as total FROM wishes${where}`);
      const countRes = params.length ? await countStmt.bind(...params).first() : await countStmt.first();
      const total = countRes?.total || 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const queryStmt = env.DB.prepare(`
        SELECT id, title, category, categoryName, createdAt, blessings, aiPlan
        FROM wishes${where}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `);
      const queryParams = [...params, limit, offset];
      const result = await queryStmt.bind(...queryParams).all();
      const wishes = (result.results || []).map(row => ({
        ...row,
        aiPlan: JSON.parse(row.aiPlan || '{}')
      }));

      return json({
        wishes,
        total,
        page,
        limit,
        totalPages
      });
    }

    const statement = env.DB.prepare(`
      SELECT id, title, category, categoryName, createdAt, blessings, aiPlan
      FROM wishes${where}
      ORDER BY createdAt DESC
    `);
    const result = params.length
      ? await statement.bind(...params).all()
      : await statement.all();
    const wishes = (result.results || []).map(row => ({
      ...row,
      aiPlan: JSON.parse(row.aiPlan || '{}')
    }));
    return json({ wishes });
  } catch (error) {
    console.error('Wish list error:', error);
    return json({ error: getMsg('zh', 'listFailed') }, 500);
  }
}

async function blessWish(id, env) {
  try {
    const update = await env.DB.prepare(
      'UPDATE wishes SET blessings = blessings + 1 WHERE id = ?'
    ).bind(id).run();

    if (!update.meta?.changes) {
      return json({ error: getMsg('zh', 'notFound') }, 404);
    }

    const row = await env.DB.prepare(
      'SELECT blessings FROM wishes WHERE id = ?'
    ).bind(id).first();
    return json({ success: true, blessings: row.blessings });
  } catch (error) {
    console.error('Wish blessing error:', error);
    return json({ error: getMsg('zh', 'blessFailed') }, 500);
  }
}

async function adminLogin(request) {
  if (!ADMIN_PASSWORD) {
    return json({ error: '管理员密码尚未配置。' }, 503);
  }

  const body = await parseJsonBody(request);
  const submittedPassword = typeof body?.password === 'string' ? body.password : '';
  const [submittedHash, expectedHash] = await Promise.all([
    sha256(submittedPassword),
    sha256(ADMIN_PASSWORD)
  ]);

  if (!constantTimeEqual(submittedHash, expectedHash)) {
    return json({ error: '密码错误。' }, 401);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const token = await signAdminSession(expiresAt);
  return json(
    { success: true },
    200,
    {
      'set-cookie': `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ADMIN_SESSION_SECONDS}`
    }
  );
}

function adminLogout() {
  return json(
    { success: true },
    200,
    {
      'set-cookie': `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    }
  );
}

async function updateAdminWish(id, request, env) {
  const body = await parseJsonBody(request);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 300) : '';
  const category = typeof body?.category === 'string' ? body.category : '';
  const blessings = Number(body?.blessings);
  const aiPlan = body?.aiPlan;

  if (!title) return json({ error: '愿望内容不能为空。' }, 400);
  if (!CATEGORY_NAMES.zh[category]) return json({ error: '愿望分类无效。' }, 400);
  if (!Number.isInteger(blessings) || blessings < 0 || blessings > 999999999) {
    return json({ error: '助愿数量必须是大于或等于 0 的整数。' }, 400);
  }
  if (!aiPlan || typeof aiPlan !== 'object' || Array.isArray(aiPlan)) {
    return json({ error: 'AI Plan 必须是有效的 JSON 对象。' }, 400);
  }

  const serializedPlan = JSON.stringify(aiPlan);
  if (serializedPlan.length > 100000) {
    return json({ error: 'AI Plan 内容过长。' }, 400);
  }

  try {
    const update = await env.DB.prepare(`
      UPDATE wishes
      SET title = ?, category = ?, categoryName = ?, blessings = ?, aiPlan = ?
      WHERE id = ?
    `).bind(
      title,
      category,
      CATEGORY_NAMES.zh[category],
      blessings,
      serializedPlan,
      id
    ).run();

    if (!update.meta?.changes) {
      return json({ error: '未找到该愿望。' }, 404);
    }

    const row = await env.DB.prepare(`
      SELECT id, title, category, categoryName, createdAt, blessings, aiPlan
      FROM wishes
      WHERE id = ?
    `).bind(id).first();

    return json({
      success: true,
      wish: { ...row, aiPlan: JSON.parse(row.aiPlan || '{}') }
    });
  } catch (error) {
    console.error('Admin wish update error:', error);
    return json({ error: '更新愿望失败。' }, 500);
  }
}

async function deleteAdminWish(id, env) {
  try {
    const result = await env.DB.prepare('DELETE FROM wishes WHERE id = ?').bind(id).run();
    if (!result.meta?.changes) {
      return json({ error: '未找到该愿望。' }, 404);
    }
    return json({ success: true });
  } catch (error) {
    console.error('Admin wish delete error:', error);
    return json({ error: '删除愿望失败。' }, 500);
  }
}

async function handleApiRequest(request, env, url) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/login') {
    return adminLogin(request);
  }

  if (url.pathname.startsWith('/api/admin/')) {
    if (!await isAdminAuthenticated(request)) {
      return json({ error: '请先登录管理后台。' }, 401);
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
      return adminLogout();
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/session') {
      return json({ authenticated: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/wishes') {
      return listWishes(url, env);
    }

    const adminWishMatch = url.pathname.match(/^\/api\/admin\/wishes\/([^/]+)$/);
    if (adminWishMatch) {
      const id = decodeURIComponent(adminWishMatch[1]);
      if (request.method === 'PUT') {
        return updateAdminWish(id, request, env);
      }
      if (request.method === 'DELETE') {
        return deleteAdminWish(id, env);
      }
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/wish') {
    return createWishDraft(request);
  }
  if (request.method === 'POST' && url.pathname === '/api/wishes') {
    return saveWish(request, env);
  }
  if (request.method === 'GET' && url.pathname === '/api/wishes') {
    return listWishes(url, env);
  }

  const blessMatch = url.pathname.match(/^\/api\/wishes\/([^/]+)\/bless$/);
  if (request.method === 'POST' && blessMatch) {
    return blessWish(decodeURIComponent(blessMatch[1]), env);
  }

  return json({ error: getMsg('zh', 'routeNotFound') }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }
    if (url.pathname === '/admin') {
      const adminUrl = new URL(request.url);
      adminUrl.pathname = '/admin/index.html';
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }
    return env.ASSETS.fetch(request);
  }
};
