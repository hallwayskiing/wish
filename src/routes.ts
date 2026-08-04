import { adminLogin, adminLogout, isAdminAuthenticated } from './admin-auth.js';
import { deleteAdminWish, updateAdminWish } from './admin-wishes.js';
import { json } from './http.js';
import { siteQrCode } from './qr.js';
import { serverMessage } from './server-messages.js';
import { Env } from './types.js';
import { blessWish, completeWish, createWishDraft, listWishes, saveWish } from './wishes.js';

const ADMIN_WISH_ROUTE = /^\/api\/admin\/wishes\/([^/]+)$/;
const BLESS_WISH_ROUTE = /^\/api\/wishes\/([^/]+)\/bless$/;
const COMPLETE_WISH_ROUTE = /^\/api\/wishes\/([^/]+)\/complete$/;


function routeId(pathname: string, pattern: RegExp): string | null {
  const match = pathname.match(pattern);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

async function handleAdminRequest(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (request.method === 'POST' && url.pathname === '/api/admin/login') {
    return adminLogin(request, env);
  }
  if (!url.pathname.startsWith('/api/admin/')) {
    return null;
  }
  if (!await isAdminAuthenticated(request, env)) {
    return json({ error: serverMessage('zh', 'adminLoginRequired') }, 401);
  }
  if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
    return adminLogout();
  }
  if (request.method === 'GET' && url.pathname === '/api/admin/session') {
    return json({ authenticated: true });
  }
  if (request.method === 'GET' && url.pathname === '/api/admin/wishes') {
    if (!url.searchParams.has('status')) {
      url.searchParams.set('status', 'all');
    }
    return listWishes(url, env);
  }

  const wishId = routeId(url.pathname, ADMIN_WISH_ROUTE);
  if (wishId && request.method === 'PUT') {
    return updateAdminWish(wishId, request, env);
  }
  if (wishId && request.method === 'DELETE') {
    return deleteAdminWish(wishId, env);
  }
  return json({ error: serverMessage('zh', 'routeNotFound') }, 404);
}

export async function handleApiRequest(request: Request, env: Env, url = new URL(request.url)): Promise<Response> {
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

  const completeId = routeId(url.pathname, COMPLETE_WISH_ROUTE);
  if (completeId && request.method === 'POST') {
    return completeWish(completeId, env);
  }


  return json({ error: serverMessage('zh', 'routeNotFound') }, 404);
}
