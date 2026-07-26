import { CATEGORY_NAMES } from './prompt.js';
import { json, parseJsonBody } from './http.js';
import { parseWishRow, serializePlan, VALID_CATEGORIES, WISH_FIELDS } from './wish-data.js';

const MAX_PLAN_LENGTH = 100_000;

export async function updateAdminWish(id, request, env) {
  const body = await parseJsonBody(request);
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 300) : '';
  const category = typeof body?.category === 'string' ? body.category : '';
  const blessings = Number(body?.blessings);
  const serializedPlan = serializePlan(body?.aiPlan);

  if (!title) return json({ error: '愿望内容不能为空。' }, 400);
  if (!VALID_CATEGORIES.has(category)) return json({ error: '愿望分类无效。' }, 400);
  if (!Number.isInteger(blessings) || blessings < 0 || blessings > 999999999) {
    return json({ error: '助愿数量必须是大于或等于 0 的整数。' }, 400);
  }
  if (!serializedPlan) return json({ error: 'AI Plan 必须是有效的 JSON 对象。' }, 400);
  if (serializedPlan.length > MAX_PLAN_LENGTH) {
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

    if (!update.meta?.changes) return json({ error: '未找到该愿望。' }, 404);

    const row = await env.DB.prepare(`
      SELECT ${WISH_FIELDS}
      FROM wishes
      WHERE id = ?
    `).bind(id).first();
    return json({ success: true, wish: parseWishRow(row) });
  } catch (error) {
    console.error('Admin wish update error:', error);
    return json({ error: '更新愿望失败。' }, 500);
  }
}

export async function deleteAdminWish(id, env) {
  try {
    const result = await env.DB.prepare('DELETE FROM wishes WHERE id = ?').bind(id).run();
    if (!result.meta?.changes) return json({ error: '未找到该愿望。' }, 404);
    return json({ success: true });
  } catch (error) {
    console.error('Admin wish delete error:', error);
    return json({ error: '删除愿望失败。' }, 500);
  }
}
