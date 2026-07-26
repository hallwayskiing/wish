import { CATEGORY_NAMES } from './categories.js';
import { json, parseJsonBody } from './http.js';
import { serverMessage } from './server-messages.js';
import { parseWishRow, serializePlan, VALID_CATEGORIES, WISH_FIELDS } from './wish-data.js';

const MAX_PLAN_LENGTH = 100_000;

export async function updateAdminWish(id, request, env) {
  const body = await parseJsonBody(request);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 300) : '';
  const category = typeof body?.category === 'string' ? body.category : '';
  const blessings = Number(body?.blessings);
  const serializedPlan = serializePlan(body?.aiPlan);

  if (!title) return json({ error: serverMessage('zh', 'emptyTitle') }, 400);
  if (!VALID_CATEGORIES.has(category)) {
    return json({ error: serverMessage('zh', 'invalidCategory') }, 400);
  }
  if (!Number.isInteger(blessings) || blessings < 0 || blessings > 999999999) {
    return json({ error: serverMessage('zh', 'invalidBlessings') }, 400);
  }
  if (!serializedPlan) return json({ error: serverMessage('zh', 'invalidPlan') }, 400);
  if (serializedPlan.length > MAX_PLAN_LENGTH) {
    return json({ error: serverMessage('zh', 'planTooLong') }, 400);
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
      return json({ error: serverMessage('zh', 'notFound') }, 404);
    }

    const row = await env.DB.prepare(`
      SELECT ${WISH_FIELDS}
      FROM wishes
      WHERE id = ?
    `).bind(id).first();
    return json({ success: true, wish: parseWishRow(row) });
  } catch (error) {
    console.error('Admin wish update error:', error);
    return json({ error: serverMessage('zh', 'updateFailed') }, 500);
  }
}

export async function deleteAdminWish(id, env) {
  try {
    const result = await env.DB.prepare('DELETE FROM wishes WHERE id = ?').bind(id).run();
    if (!result.meta?.changes) {
      return json({ error: serverMessage('zh', 'notFound') }, 404);
    }
    return json({ success: true });
  } catch (error) {
    console.error('Admin wish delete error:', error);
    return json({ error: serverMessage('zh', 'deleteFailed') }, 500);
  }
}
