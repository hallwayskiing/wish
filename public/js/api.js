/* ==========================================================================
   Wishing Well API Client Module - 璀璨许愿阁
   ========================================================================== */

const API_BASE = window.API_BASE || '/api';

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

const WishAPI = {
  submitWish: (wish, category, customApiKey, language = 'zh') =>
    apiFetch('/wish', {
      method: 'POST',
      body: JSON.stringify({ wish, category, customApiKey, language })
    }),

  saveWish: async (wish, language = 'zh') => {
    const data = await apiFetch('/wishes', {
      method: 'POST',
      body: JSON.stringify({ wish, language })
    });
    return data.wish;
  },

  getWishes: async (category = 'all', search = '', page = 1, limit = 6) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    const query = params.toString();
    return await apiFetch(`/wishes${query ? `?${query}` : ''}`);
  },

  blessWish: (id) =>
    apiFetch(`/wishes/${encodeURIComponent(id)}/bless`, { method: 'POST' })
};

window.WishAPI = WishAPI;
