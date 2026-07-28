import { CATEGORY_IDS } from './categories.js';
import { Wish, AIPlan, AIPlanPhase } from './types.js';

export const WISH_FIELDS = 'id, title, category, categoryName, createdAt, blessings, aiPlan';
export const VALID_CATEGORIES: Set<string> = new Set(CATEGORY_IDS);
export const MAX_PLAN_LENGTH = 100_000;

export interface RawWishRow {
  id: string;
  title: string;
  category: string;
  categoryName: string;
  createdAt: string;
  blessings: number;
  aiPlan: string;
}

export function sanitizeAiPlan(obj: unknown): AIPlan {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const p = obj as Record<string, unknown>;

  const sanitizePhases = (arr: unknown): AIPlanPhase[] | undefined => {
    if (!Array.isArray(arr)) return undefined;
    return arr.map(item => {
      if (!item || typeof item !== 'object') return {};
      const step = item as Record<string, unknown>;
      return {
        phase: typeof step.phase === 'string' ? step.phase : undefined,
        name: typeof step.name === 'string' ? step.name : undefined,
        title: typeof step.title === 'string' ? step.title : undefined,
        action: typeof step.action === 'string' ? step.action : undefined,
        timeline: typeof step.timeline === 'string' ? step.timeline : undefined,
        tasks: Array.isArray(step.tasks) ? step.tasks.filter((t): t is string => typeof t === 'string') : undefined
      };
    });
  };

  const sanitizeStringArray = (arr: unknown): string[] | undefined => {
    if (!Array.isArray(arr)) return undefined;
    return arr.filter((item): item is string => typeof item === 'string');
  };

  return {
    inspiration: typeof p.inspiration === 'string' ? p.inspiration : undefined,
    timeline: typeof p.timeline === 'string' ? p.timeline : undefined,
    roadmap: sanitizePhases(p.roadmap),
    phases: sanitizePhases(p.phases),
    habits: sanitizeStringArray(p.habits),
    habitsAndTools: sanitizeStringArray(p.habitsAndTools),
    pitfalls: sanitizeStringArray(p.pitfalls),
    firstStep: typeof p.firstStep === 'string' ? p.firstStep : undefined
  };
}

export function serializePlan(plan: AIPlan | Record<string, unknown> | null | undefined): string | null {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return null;
  const sanitized = sanitizeAiPlan(plan);
  return JSON.stringify(sanitized);
}

export function parseAiPlanJson(jsonString?: unknown): AIPlan {
  if (typeof jsonString !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(jsonString);
    return sanitizeAiPlan(parsed);
  } catch {
    return {};
  }
}

export function parseWishRow(row: RawWishRow | Record<string, unknown> | null | undefined): Wish | null {
  if (!row || typeof row !== 'object') return null;
  const raw = row as Record<string, unknown>;
  return {
    id: String(raw.id || ''),
    title: String(raw.title || ''),
    category: String(raw.category || ''),
    categoryName: String(raw.categoryName || ''),
    createdAt: String(raw.createdAt || ''),
    blessings: Number(raw.blessings) || 0,
    aiPlan: parseAiPlanJson(raw.aiPlan)
  };
}

export function bindStatement(statement: D1PreparedStatement, params: (string | number)[]): D1PreparedStatement {
  return params.length ? statement.bind(...params) : statement;
}
