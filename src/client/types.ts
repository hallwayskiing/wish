// Re-export shared domain types from the single source of truth
export type { AIPlan, AIPlanPhase, Wish, WishListResult, UnpaginatedWishListResult } from '../types.js';

// Client-only types
export type Language = 'zh' | 'en';
export type TranslateFn = (key: string) => string;
