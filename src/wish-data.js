import { CATEGORY_NAMES } from './prompt.js';

export const WISH_FIELDS = 'id, title, category, categoryName, createdAt, blessings, aiPlan';
export const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_NAMES.zh));

export function serializePlan(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return null;
  return JSON.stringify(plan);
}

export function parseWishRow(row) {
  if (!row) return null;
  try {
    return { ...row, aiPlan: JSON.parse(row.aiPlan || '{}') };
  } catch {
    return { ...row, aiPlan: {} };
  }
}

export function bindStatement(statement, params) {
  return params.length ? statement.bind(...params) : statement;
}
