import { CATEGORY_NAMES, isCategoryId } from './categories.js';
import { json, parseJsonBody } from './http.js';
import { serverMessage } from './server-messages.js';
import type { AIPlan, Env } from './types.js';
import { MAX_PLAN_LENGTH, parseWishRow, serializePlan, WISH_FIELDS } from './wish-data.js';

interface UpdateAdminWishBody {
  title?: string;
  category?: string;
  blessings?: number;
  status?: string;
  aiPlan?: AIPlan;
}

export async function updateAdminWish(id: string, request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<UpdateAdminWishBody>(request);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 300) : '';
  const category = typeof body?.category === 'string' ? body.category : '';
  const blessings = Number(body?.blessings);
  const status = body?.status === 'completed' ? 'completed' : 'active';
  const now = new Date().toISOString();
  const serializedPlan = serializePlan(body?.aiPlan);

  if (!title) return json({ error: serverMessage('zh', 'emptyTitle') }, 400);
  if (!isCategoryId(category)) {
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
      SET title = ?, category = ?, categoryName = ?, blessings = ?, status = ?,
          completedAt = CASE WHEN ? = 'completed' THEN COALESCE(completedAt, ?) ELSE NULL END,
          aiPlan = ?
      WHERE id = ?
    `)
      .bind(
        title,
        category,
        CATEGORY_NAMES.zh[category],
        blessings,
        status,
        status,
        now,
        serializedPlan,
        id
      )
      .run();

    if (!update.meta?.changes) {
      return json({ error: serverMessage('zh', 'notFound') }, 404);
    }

    const row = await env.DB.prepare(`
      SELECT ${WISH_FIELDS}
      FROM wishes
      WHERE id = ?
    `)
      .bind(id)
      .first();
    return json({ success: true, wish: parseWishRow(row) });
  } catch (error) {
    console.error('Admin wish update error:', error);
    return json({ error: serverMessage('zh', 'updateFailed') }, 500);
  }
}

export async function deleteAdminWish(id: string, env: Env): Promise<Response> {
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
