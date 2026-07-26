import { adminLogin, adminLogout, isAdminAuthenticated } from './admin-auth.js';
import { deleteAdminWish, updateAdminWish } from './admin-wishes.js';
import { json } from './http.js';
import { siteQrCode } from './qr.js';
import { blessWish, createWishDraft, listWishes, saveWish } from './wishes.js';

const ADMIN_WISH_ROUTE = /^\/api\/admin\/wishes\/([^/]+)$/;
const BLESS_WISH_ROUTE = /^\/api\/wishes\/([^/]+)\/bless$/;

function routeId(pathname, pattern) {
  const match = pathname.match(pattern);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function handleAdminRequest(request, env, url) {
  if (request.method === 'POST' && url.pathname === '/api/admin/login') {
    return adminLogin(request, env);
  }
  if (!url.pathname.startsWith('/api/admin/')) {
    return null;
  }
  if (!await isAdminAuthenticated(request, env)) {
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

  const wishId = routeId(url.pathname, ADMIN_WISH_ROUTE);
  if (wishId && request.method === 'PUT') {
    return updateAdminWish(wishId, request, env);
  }
  if (wishId && request.method === 'DELETE') {
    return deleteAdminWish(wishId, env);
  }
  return json({ error: '请求路径不存在。' }, 404);
}

export async function handleApiRequest(request, env, url = new URL(request.url)) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const adminResponse = await handleAdminRequest(request, env, url);
  if (adminResponse) return adminResponse;

  if (request.method === 'POST' && url.pathname === '/api/wish') {
    return createWishDraft(request);
  }
  if (url.pathname === '/api/wishes') {
    if (request.method === 'POST') return saveWish(request, env);
    if (request.method === 'GET') return listWishes(url, env);
  }
  if (request.method === 'GET' && url.pathname === '/api/site-qr') {
    return siteQrCode(request);
  }

  const wishId = routeId(url.pathname, BLESS_WISH_ROUTE);
  if (wishId && request.method === 'POST') {
    return blessWish(wishId, env);
  }
  return json({ error: '请求路径不存在。' }, 404);
}
