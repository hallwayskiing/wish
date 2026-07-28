import { Wish, WishListResult } from './types.js';

declare global {
  interface Window {
    API_BASE?: string;
  }
}

const API_BASE = window.API_BASE || '/api';

async function apiFetch<T>(endpoint: string, options: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
  const { headers, ...fetchOptions } = options;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorObj = data as { error?: string } | undefined;
    const errorMsg = typeof errorObj?.error === 'string' ? errorObj.error : `HTTP ${res.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const WishAPI = {
  submitWish: (wish: string, category: string, customApiKey?: string, language = 'zh'): Promise<{ success: boolean; wish: Wish }> =>
    apiFetch<{ success: boolean; wish: Wish }>('/wish', {
      method: 'POST',
      body: JSON.stringify({ wish, category, customApiKey, language })
    }),

  saveWish: async (wish: Wish, language = 'zh'): Promise<Wish> => {
    const data = await apiFetch<{ success: boolean; wish: Wish }>('/wishes', {
      method: 'POST',
      body: JSON.stringify({ wish, language })
    });
    return data.wish;
  },

  getWishes: (category = 'all', search = '', page = 1, limit = 6, signal?: AbortSignal): Promise<WishListResult> => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return apiFetch<WishListResult>(`/wishes?${params}`, { signal });
  },

  blessWish: (id: string): Promise<{ success: boolean; blessings: number }> =>
    apiFetch<{ success: boolean; blessings: number }>(`/wishes/${encodeURIComponent(id)}/bless`, { method: 'POST' })
};
