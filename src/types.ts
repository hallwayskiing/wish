export type Language = 'zh' | 'en';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  GEMINI_API_KEY?: string;
  ADMIN_PASSWORD?: string;
}

export interface AIPlanPhase {
  phase?: string;
  name?: string;
  title?: string;
  action?: string;
  timeline?: string;
  tasks?: string[];
}

export interface AIPlan {
  summary?: string;
  inspiration?: string;
  timeline?: string;
  roadmap?: AIPlanPhase[];
  phases?: AIPlanPhase[];
  habitsAndSystems?: string[];
  pitfalls?: string[];
  firstStep?: string;
}

export interface Wish {
  id: string;
  title: string;
  categories: string[];
  createdAt: string;
  blessings: number;
  aiPlan: AIPlan;
  status?: 'active' | 'completed';
  completedAt?: string | null;
}

export interface WishInput {
  title: string;
  categories: string[];
}

export interface UnpaginatedWishListResult {
  wishes: Wish[];
}

export interface WishListResult {
  wishes: Wish[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminWishUpdateInput {
  title: string;
  categories: string[];
  blessings: number;
  aiPlan: AIPlan;
}

export interface RawWishRow {
  id: string;
  title: string;
  categories: string | null;
  createdAt: string;
  blessings: number;
  aiPlan: string;
  status?: string;
  completedAt?: string;
}
